// Pasa Lighthouse (móvil) por cada página de la web ya preparada (_site) y falla si alguna
// puntuación baja del mínimo. Deja el resumen en la Action y las insignias del README en
// _site/insignias/, que shields.io lee desde la web publicada.
// El rendimiento varía de una medición a otra: si una página no llega, se mide hasta dos veces más y
// cuenta la mejor. Con LH_RENDIMIENTO_AVISA=1 (la publicación diaria), un rendimiento bajo no impide
// publicar los datos nuevos: queda anotado para el aviso. Accesibilidad, buenas prácticas y SEO sí lo impiden.
// Uso: node scripts/lighthouse.mjs   (necesita lighthouse y playwright)

import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { chromium } from 'playwright';
import { arrancar } from '../tests/e2e/servidor.mjs';
import { anotar } from './estado.mjs';

const PAGINAS = { 'Tu ticket': '', 'A dónde va': 'a-donde-va/', 'Quién gasta': 'quien-gasta/', Presupuesto: 'presupuesto/', Lupa: 'lupa/', Fuentes: 'fuentes/' };
const CATEGORIAS = {
  performance: { nombre: 'Rendimiento', minimo: 0.9, insignia: 'rendimiento' },
  accessibility: { nombre: 'Accesibilidad', minimo: 1, insignia: 'accesibilidad' },
  'best-practices': { nombre: 'Buenas prácticas', minimo: 0.95, insignia: 'buenas-practicas' },
  seo: { nombre: 'SEO', minimo: 1, insignia: 'seo' },
};

const servidor = await arrancar();
const chrome = await chromeLauncher.launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
});

const resultados = {};
const medir = async (ruta) =>
  (await lighthouse(servidor.base + ruta, {
    port: chrome.port,
    output: 'json',
    logLevel: 'error',
    onlyCategories: Object.keys(CATEGORIAS),
    // Las visitas no cuentan: son de terceros y no dependen de la web
    blockedUrlPatterns: ['*goatcounter*', '*gc.zgo.at*'],
  })).lhr;
const INTENTOS = 3;

for (const [nombre, ruta] of Object.entries(PAGINAS)) {
  let lhr = await medir(ruta);
  for (let i = 2; i <= INTENTOS && (lhr.categories.performance?.score ?? 0) < CATEGORIAS.performance.minimo; i++) {
    const otra = await medir(ruta);
    if ((otra.categories.performance?.score ?? 0) > (lhr.categories.performance?.score ?? 0)) lhr = otra;
  }
  resultados[nombre] = Object.fromEntries(Object.keys(CATEGORIAS).map((c) => [c, lhr.categories[c]?.score ?? 0]));
  let linea = Object.entries(resultados[nombre]).map(([c, v]) => `${CATEGORIAS[c].nombre} ${Math.round(v * 100)}`).join(', ');
  // Si el rendimiento no llega a 95, se dice qué métrica lo baja
  if (resultados[nombre].performance < 0.95) {
    const a = lhr.audits;
    const ms = (id) => `${Math.round(a[id]?.numericValue ?? 0)} ms (${Math.round((a[id]?.score ?? 0) * 100)})`;
    linea += `. LCP ${ms('largest-contentful-paint')}, FCP ${ms('first-contentful-paint')}, TBT ${ms('total-blocking-time')}, SI ${ms('speed-index')}, CLS ${(a['cumulative-layout-shift']?.numericValue ?? 0).toFixed(3)}`;
    linea += `, elemento LCP: ${a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.snippet ?? a['largest-contentful-paint-element']?.details?.items?.[0]?.node?.snippet ?? '?'}`;
    const cls = a['layout-shifts']?.details?.items ?? [];
    if (cls.length) linea += `, desplazamientos: ${cls.slice(0, 3).map((x) => `${x.node?.snippet ?? '?'} ${x.score?.toFixed?.(3)}`).join(' | ')}`;
  }
  for (const c of ['accessibility', 'best-practices', 'seo']) {
    if ((lhr.categories[c]?.score ?? 1) < 1) {
      const fallos = lhr.categories[c].auditRefs.filter((r) => r.weight > 0 && lhr.audits[r.id]?.score !== null && lhr.audits[r.id]?.score < 1).map((r) => r.id);
      linea += `. ${CATEGORIAS[c].nombre} falla en: ${fallos.join(', ')}`;
    }
  }
  // En la Action, cada página sale como anotación en la PR
  console.log(process.env.GITHUB_ACTIONS ? `::notice title=Lighthouse ${nombre}::${linea}` : `${nombre}: ${linea}`);
}

await chrome.kill();
await servidor.cerrar();

// Peor puntuación de cada categoría entre todas las páginas
const peores = Object.fromEntries(
  Object.keys(CATEGORIAS).map((c) => [c, Math.min(...Object.values(resultados).map((r) => r[c]))])
);

// Insignias para el README (formato endpoint de shields.io)
const carpeta = new URL('../_site/insignias/', import.meta.url);
await mkdir(carpeta, { recursive: true });
for (const [c, v] of Object.entries(peores)) {
  const n = Math.round(v * 100);
  await writeFile(
    new URL(`${CATEGORIAS[c].insignia}.json`, carpeta),
    JSON.stringify({ schemaVersion: 1, label: CATEGORIAS[c].nombre.toLowerCase(), message: String(n), color: n >= 90 ? 'brightgreen' : n >= 70 ? 'yellow' : 'red' })
  );
}
await writeFile(new URL('lighthouse.json', carpeta), JSON.stringify({ fecha: new Date().toISOString(), resultados }, null, 1));

// Resumen en la página de la ejecución
if (process.env.GITHUB_STEP_SUMMARY) {
  const cabecera = `| Página | ${Object.values(CATEGORIAS).map((c) => c.nombre).join(' | ')} |\n|---|${Object.keys(CATEGORIAS).map(() => '---:').join('|')}|\n`;
  const filas = Object.entries(resultados)
    .map(([p, r]) => `| ${p} | ${Object.keys(CATEGORIAS).map((c) => Math.round(r[c] * 100)).join(' | ')} |`)
    .join('\n');
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `### Lighthouse (móvil)\n\n${cabecera}${filas}\n`);
}

const texto = ([c, v]) => `${CATEGORIAS[c].nombre} ${Math.round(v * 100)} (mínimo ${CATEGORIAS[c].minimo * 100})`;
const suspensos = Object.entries(peores).filter(([c, v]) => v < CATEGORIAS[c].minimo);
const graves = suspensos.filter(([c]) => c !== 'performance' || !process.env.LH_RENDIMIENTO_AVISA);
if (graves.length) {
  await anotar('lighthouse', false, `por debajo del mínimo: ${suspensos.map(texto).join(', ')}`);
  console.error(`Por debajo del mínimo: ${graves.map(texto).join(', ')}`);
  process.exit(1);
}
if (suspensos.length) {
  // Solo el rendimiento, en la publicación diaria: se publica igual y queda el aviso
  const lentas = Object.entries(resultados).filter(([, r]) => r.performance < CATEGORIAS.performance.minimo).map(([p, r]) => `${p} ${Math.round(r.performance * 100)}`);
  await anotar('lighthouse', false, `rendimiento por debajo de ${CATEGORIAS.performance.minimo * 100} en ${lentas.join(', ')} (se ha publicado igual)`);
  console.log(`${process.env.GITHUB_ACTIONS ? '::warning::' : ''}Rendimiento bajo en ${lentas.join(', ')}: se publica igual y queda el aviso`);
} else {
  await anotar('lighthouse', true, Object.entries(peores).map(([c, v]) => `${CATEGORIAS[c].nombre} ${Math.round(v * 100)}`).join(', '));
}

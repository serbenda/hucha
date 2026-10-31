// Descarga la ejecución del presupuesto del Estado (IGAE) y la guarda en el almacén (almacen/ejecucion.json).
// Cada mes la IGAE publica un libro con lo acumulado desde enero. Se leen los del año en curso y los del anterior
// (para comparar con el mismo mes): solo los que faltan en el almacén y, siempre, el último de cada año, por si
// se ha revisado. Si algo falla, se queda lo anterior.

import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { urlPaginaEjecucion, librosMensuales, leerLibro } from '../assets/js/ejecucion.js';
import { leerXlsx } from './xlsx.mjs';
import { anotar } from './estado.mjs';

const almacen = new URL('../almacen/', import.meta.url);
const fichero = new URL('ejecucion.json', almacen);
const cabeceras = { 'User-Agent': 'Mozilla/5.0 (hucha; github.com/serbenda/hucha)' };
const HOJAS = ['GTOS 004', 'GTOS 014', 'GTOS 016', 'GTOS 017'];

async function descargar(url, binario = false) {
  let ultimo;
  for (let i = 1; i <= 3; i++) {
    try {
      const r = await fetch(url, { headers: cabeceras, signal: AbortSignal.timeout(120000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return binario ? Buffer.from(await r.arrayBuffer()) : await r.text();
    } catch (e) {
      ultimo = e;
      await new Promise((ok) => setTimeout(ok, 5000 * i));
    }
  }
  throw ultimo;
}

let previo = { meses: {} };
try {
  previo = JSON.parse(await readFile(fichero, 'utf8'));
} catch {}

const hoy = new Date();
const año = hoy.getFullYear();
const notas = [];
try {
  // Los libros del año en curso y del anterior, desde sus páginas
  const libros = [];
  for (const [a, actual] of [[año, true], [año - 1, false]]) {
    try {
      libros.push(...librosMensuales(await descargar(urlPaginaEjecucion(a, actual))));
    } catch (e) {
      notas.push(`página de ${a}: ${e.message}`);
    }
  }
  // A principios de año la página «actual» puede seguir siendo la del año anterior: se juntan sin repetir
  const porMes = new Map(libros.map((l) => [l.mes, l.url]));
  const ultimos = new Set([año, año - 1].map((a) => [...porMes.keys()].filter((m) => m.startsWith(`${a}-`)).sort().at(-1)).filter(Boolean));
  const pendientes = [...porMes.keys()].filter((m) => !previo.meses?.[m] || ultimos.has(m)).sort();

  const dir = await mkdtemp(join(tmpdir(), 'igae-'));
  const meses = { ...(previo.meses ?? {}) };
  let leidos = 0;
  for (const mes of pendientes) {
    try {
      const ruta = join(dir, `${mes}.xlsx`);
      await writeFile(ruta, await descargar(porMes.get(mes), true));
      meses[mes] = { ...leerLibro(leerXlsx(ruta, HOJAS), mes), url: porMes.get(mes) };
      leidos++;
    } catch (e) {
      notas.push(`${mes}: ${e.message}`);
    }
  }
  await rm(dir, { recursive: true, force: true });

  const lista = Object.keys(meses).sort();
  if (!lista.length) throw new Error(`ningún mes leído (${notas.join('; ')})`);
  // Solo hacen falta los dos últimos años
  for (const m of lista) if (Number(m.slice(0, 4)) < año - 1) delete meses[m];
  await mkdir(almacen, { recursive: true });
  await writeFile(fichero, JSON.stringify({ actualizado: new Date().toISOString(), fuente: 'IGAE, ejecución del presupuesto de gastos del Estado', meses }));

  const ultimo = meses[Object.keys(meses).sort().at(-1)];
  const pct = (x) => `${Math.round((x.obligaciones / x.creditos) * 1000) / 10} %`;
  const resumen = `hasta ${ultimo.mes}: ${pct(ultimo.noFinanciero)} de ${Math.round(ultimo.noFinanciero.creditos).toLocaleString('es-ES')} M€ no financieros (${pct(ultimo.noFinanciero.anterior)} un año antes); ${leidos} libros leídos, ${Object.keys(meses).length} meses guardados${notas.length ? `; ${notas.join('; ')}` : ''}`;
  console.log(`Ejecución: ${resumen}`);
  await anotar('igae', true, resumen);
} catch (e) {
  console.warn(`Ejecución: ${e.message}. Se mantiene la versión anterior`);
  await anotar('igae', false, e.message);
}

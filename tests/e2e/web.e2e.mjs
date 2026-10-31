// Tests de navegador: cargan la web ya preparada (_site) con datos reales y comprueban
// que cada página funciona, no da errores y pasa la auditoría de accesibilidad (axe),
// en móvil y escritorio, en modo claro y oscuro.
// Los ejecuta la Action antes de publicar: si fallan, no se publica.
// Uso: node --test tests/e2e/   (necesita playwright y @axe-core/playwright instalados)

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { arrancar } from './servidor.mjs';
import { partidas, ultimoAño, PARTIDAS, detallePartida, ultimoAñoTipos } from '../../assets/js/cofog.js';

let servidor, navegador, base, datos;

const MOVIL = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const ESCRITORIO = { viewport: { width: 1280, height: 900 } };

before(async () => {
  servidor = await arrancar();
  base = servidor.base;
  navegador = await chromium.launch();
  datos = JSON.parse(await readFile(new URL('../../_site/data/cofog.json', import.meta.url), 'utf8'));
});

after(async () => {
  await navegador?.close();
  await servidor?.cerrar();
});

async function abrir(ruta, opciones = {}) {
  const contexto = await navegador.newContext({ locale: 'es-ES', timezoneId: 'Europe/Madrid', ...opciones });
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  pagina.on('console', (m) => {
    if (m.type() === 'error') errores.push(m.text());
  });
  // Fuera de la web (visitas): no se descarga nada en los tests
  await pagina.route((url) => !url.href.startsWith(base), (r) => r.abort());
  const respuesta = await pagina.goto(base + ruta);
  await pagina.waitForLoadState('networkidle');
  return { pagina, errores, contexto, respuesta };
}

/** Errores de consola que no son de la web (peticiones de terceros bloqueadas en el test). */
const propios = (errores) => errores.filter((e) => !/ERR_FAILED|net::/.test(e));

async function accesible(pagina, donde) {
  // Con los desplegables abiertos, para revisar también lo que hay dentro
  await pagina.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
  const { violations } = await new AxeBuilder({ page: pagina }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  assert.deepEqual(
    violations.map((v) => `${donde} ${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`),
    []
  );
}

async function sinDesbordar(pagina, donde) {
  const ancho = await pagina.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(ancho <= 1, `${donde}: la página se sale ${ancho} px por la derecha`);
}

const VARIANTES = [
  ['móvil claro', { ...MOVIL, colorScheme: 'light' }],
  ['móvil oscuro', { ...MOVIL, colorScheme: 'dark' }],
  ['escritorio claro', { ...ESCRITORIO, colorScheme: 'light' }],
  ['escritorio oscuro', { ...ESCRITORIO, colorScheme: 'dark' }],
];

for (const [ruta, nombre] of [['', 'portada'], ['a-donde-va/', 'a dónde va'], ['quien-gasta/', 'quién gasta'], ['fuentes/', 'fuentes']]) {
  test(`${nombre}: sin errores, accesible y sin desbordar en móvil y escritorio, claro y oscuro`, async () => {
    for (const [variante, opciones] of VARIANTES) {
      const { pagina, errores, contexto } = await abrir(ruta, opciones);
      assert.deepEqual(propios(errores), [], `${nombre} (${variante})`);
      assert.equal(await pagina.locator('.banda').count(), 0, `${nombre} (${variante}): no debe salir la banda de aviso`);
      await sinDesbordar(pagina, `${nombre} (${variante})`);
      await accesible(pagina, `${nombre} (${variante})`);
      await contexto.close();
    }
  });
}

test('portada: el ticket calcula, reparte y suma el 100 %', async () => {
  const { pagina, contexto } = await abrir('', ESCRITORIO);
  const año = ultimoAño(datos);
  assert.match(await pagina.textContent('#ticket-año'), new RegExp(año));
  // 30.000 € por defecto: IRPF y Seguridad Social de los tests unitarios
  assert.match(await pagina.textContent('#aporte'), /4\.926\s€/);
  assert.match(await pagina.textContent('#aporte'), /1\.950\s€/);
  assert.equal(await pagina.locator('#reparto .linea-ticket').count(), partidas(datos, año).length);

  // Las líneas del reparto suman el total (con margen de redondeo)
  const suma = async () =>
    (await pagina.locator('#reparto dd').allTextContents()).reduce((t, x) => t + Number(x.replace(/.*%/, '').replace(/[^\d]/g, '')), 0);
  const total = async () => Number((await pagina.locator('#aporte .total dd').textContent()).replace(/[^\d]/g, ''));
  assert.ok(Math.abs((await suma()) - (await total())) <= partidas(datos, año).length, 'el reparto suma el total');

  // Con lo que paga la empresa, sube
  const antes = await total();
  await pagina.check('#empresa');
  assert.ok((await total()) > antes * 2, 'con la empresa, el total más que se duplica');

  // Otro sueldo
  await pagina.click('[data-sueldo="17094"]');
  assert.match(await pagina.textContent('#aporte'), /IRPF\s*0\s€/);
  // Al escribir, el ticket se recalcula con una pequeña espera (para no hacerlo en cada tecla)
  await pagina.fill('#bruto', '');
  await pagina.waitForFunction(() => /Escribe tu sueldo/.test(document.querySelector('#aporte').textContent), null, { timeout: 2000 });
  await contexto.close();
});

test('portada: en el móvil se ve el resumen junto al campo', async () => {
  const { pagina, contexto } = await abrir('', MOVIL);
  await pagina.fill('#bruto', '45000');
  await pagina.waitForTimeout(300);
  assert.ok(await pagina.locator('#resumen').isVisible(), 'resumen visible');
  assert.match(await pagina.textContent('#resumen'), /Pones .+€ al año/);
  await contexto.close();

  const escritorio = await abrir('', ESCRITORIO);
  assert.equal(await escritorio.pagina.locator('#resumen').isVisible(), false, 'en escritorio no hace falta');
  await escritorio.contexto.close();
});

test('portada: compartir no incluye el sueldo', async () => {
  const { pagina, contexto } = await abrir('', ESCRITORIO);
  await contexto.grantPermissions(['clipboard-read', 'clipboard-write']);
  await pagina.evaluate(() => Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }));
  await pagina.fill('#bruto', '54321');
  await pagina.click('#compartir');
  const copiado = await pagina.evaluate(() => navigator.clipboard.readText());
  assert.match(copiado, /De cada 100 €/);
  assert.doesNotMatch(copiado, /54\.?321|sueldo=/);
  await contexto.close();
});

test('portada: un enlace antiguo con ?sueldo= sigue funcionando', async () => {
  const { pagina, contexto } = await abrir('?sueldo=45000&empresa=1', ESCRITORIO);
  assert.equal(await pagina.inputValue('#bruto'), '45.000');
  assert.ok(await pagina.isChecked('#empresa'));
  await contexto.close();
});

test('a dónde va: todas las partidas, con su detalle y su gráfico', async () => {
  const { pagina, contexto } = await abrir('a-donde-va/', ESCRITORIO);
  const n = partidas(datos, ultimoAño(datos)).length;
  assert.equal(await pagina.locator('.partida').count(), n);
  assert.match(await pagina.textContent('#c-habitante'), /€/);
  assert.match(await pagina.textContent('#c-pib'), /del PIB/);
  await pagina.locator('.partida summary').nth(1).click();
  const detalle = pagina.locator('.partida').nth(1);
  assert.ok(await detalle.locator('.evolucion polyline.es').count(), 'línea de España');
  assert.match(await detalle.textContent(), /del PIB/);
  // En qué se va y cómo se gasta (si Eurostat da el detalle)
  const id = partidas(datos, ultimoAño(datos))[1].id;
  if (detallePartida(datos, id, ultimoAño(datos)).length) assert.match(await detalle.textContent(), /En qué se va/);
  if (ultimoAñoTipos(datos)) {
    assert.match(await detalle.textContent(), /Cómo se gasta/);
    assert.ok(await pagina.locator('#bloque-tipos').isVisible(), 'cómo se gasta cada euro');
    assert.ok((await pagina.locator('#tipos li').count()) >= 5);
  }
  await contexto.close();
});

test('quién gasta: las cuatro administraciones y las funciones', async () => {
  const { pagina, contexto } = await abrir('quien-gasta/', ESCRITORIO);
  assert.equal(await pagina.locator('#administraciones .cifra').count(), 4);
  assert.ok((await pagina.locator('.funcion').count()) >= 9);
  assert.match(await pagina.textContent('#c-sanidad'), /%/);
  await contexto.close();
});

test('fuentes: la tabla de partidas sale del código', async () => {
  const { pagina, contexto } = await abrir('fuentes/', ESCRITORIO);
  assert.equal(await pagina.locator('#tabla-partidas tr').count(), PARTIDAS.length);
  assert.match(await pagina.textContent('#actualizado'), /Datos descargados/);
  await contexto.close();
});

test('404: página propia con su código', async () => {
  const { pagina, respuesta, contexto } = await abrir('no-existe/', ESCRITORIO);
  assert.equal(respuesta.status(), 404);
  assert.match(await pagina.textContent('h1'), /no está en la hucha/);
  await accesible(pagina, '404');
  await contexto.close();
});

test('SEO y compartir: cada página tiene título, descripción, canónica e imagen', async () => {
  for (const ruta of ['', 'a-donde-va/', 'quien-gasta/', 'fuentes/']) {
    const { pagina, contexto } = await abrir(ruta, ESCRITORIO);
    const meta = await pagina.evaluate(() => ({
      titulo: document.title,
      descripcion: document.querySelector('meta[name=description]')?.content,
      canonica: document.querySelector('link[rel=canonical]')?.href,
      imagen: document.querySelector('meta[property="og:image"]')?.content,
      icono: document.querySelector('link[rel=apple-touch-icon]')?.getAttribute('href'),
    }));
    assert.ok(meta.titulo.includes('hucha'), `${ruta}: título`);
    assert.ok(meta.descripcion?.length > 50, `${ruta}: descripción`);
    assert.ok(meta.canonica?.startsWith('https://hucha.bendi.dev/'), `${ruta}: canónica`);
    assert.ok(meta.imagen?.endsWith('/assets/img/compartir.png'), `${ruta}: imagen para compartir`);
    // Las imágenes existen en lo que se publica
    const icono = await pagina.request.get(new URL(meta.icono, pagina.url()).href);
    assert.equal(icono.status(), 200, `${ruta}: icono`);
    await contexto.close();
  }
  const r = await fetch(base + 'assets/img/compartir.png');
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'image/png');
});

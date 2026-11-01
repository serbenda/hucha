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
  datos = JSON.parse(await readFile(new URL('../../almacen/cofog.json', import.meta.url), 'utf8'));
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

const PAGINAS_ES = [['', 'portada'], ['a-donde-va/', 'a dónde va'], ['quien-gasta/', 'quién gasta'], ['presupuesto/', 'presupuesto'], ['lupa/', 'lupa'], ['fuentes/', 'fuentes']];
// La versión en inglés (en/) pasa por lo mismo: sin errores, accesible y sin desbordar
for (const [ruta, nombre] of [...PAGINAS_ES, ...PAGINAS_ES.map(([r, n]) => [`en/${r}`, `${n} (inglés)`])]) {
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

test('presupuesto: lo gastado, el ritmo, los capítulos y los ministerios con sus programas', async () => {
  let vista = null;
  try {
    vista = JSON.parse(await readFile(new URL('../../_site/data/vistas/presupuesto.json', import.meta.url), 'utf8'));
  } catch {}
  const { pagina, contexto } = await abrir('presupuesto/', ESCRITORIO);
  if (!vista) {
    assert.match(await pagina.textContent('#capitulos'), /no están disponibles/);
    await contexto.close();
    return;
  }
  assert.match(await pagina.textContent('#c-gastado'), /%/);
  assert.match(await pagina.textContent('#c-presupuesto'), /millones de €/);
  assert.ok(await pagina.locator('#ritmo .g-lineas').isVisible(), 'gráfico del ritmo');
  assert.ok((await pagina.locator('#capitulos .g-fila').count()) >= 5);
  assert.ok((await pagina.locator('.ministerio').count()) >= 15);
  // Abrir un ministerio enseña sus programas
  await pagina.locator('.ministerio summary').first().click();
  assert.ok((await pagina.locator('.ministerio details[open] .g-avance .g-fila').count()) >= 1);
  // Buscar un programa que no existe
  await pagina.fill('#q', 'zzzzzz');
  await pagina.waitForTimeout(400);
  assert.match(await pagina.textContent('#resumen-programas'), /Ningún programa/);
  await contexto.close();
});

test('fuentes: la tabla de partidas sale del código', async () => {
  const { pagina, contexto } = await abrir('fuentes/', ESCRITORIO);
  assert.equal(await pagina.locator('#tabla-partidas tr').count(), PARTIDAS.length);
  assert.match(await pagina.textContent('#actualizado'), /Datos descargados/);
  await contexto.close();
});

test('inglés: en inglés, con los datos de la Lupa tal cual y el enlace al castellano', async () => {
  for (const [ruta] of PAGINAS_ES) {
    const { pagina, contexto } = await abrir(`en/${ruta}`, { ...ESCRITORIO, locale: 'en-GB' });
    assert.equal(await pagina.getAttribute('html', 'lang'), 'en', `en/${ruta}: lang`);
    assert.match(await pagina.textContent('nav'), /Where it goes/, `en/${ruta}: menú en inglés`);
    // El enlace de idioma lleva a la misma página en castellano
    const es = await pagina.getAttribute('a.idioma', 'href');
    assert.equal(new URL(es, pagina.url()).href, base + ruta, `en/${ruta}: enlace al castellano`);
    // Lo que escriben los scripts, también en inglés
    const texto = await pagina.textContent('main');
    assert.doesNotMatch(texto, /millones de €|Prueba en un rato|sin dato\b/, `en/${ruta}: textos en castellano`);
    await contexto.close();
  }
  // El ticket lee el sueldo con coma de miles: 30,000 → IRPF 4,926 €, como en castellano
  const ticket = await abrir('en/', { ...ESCRITORIO, locale: 'en-GB' });
  assert.equal(await ticket.pagina.inputValue('#bruto'), '30,000');
  assert.match(await ticket.pagina.textContent('#aporte'), /€4,926/);
  await ticket.contexto.close();
  const { pagina, contexto } = await abrir('en/lupa/', { ...ESCRITORIO, locale: 'en-GB' });
  await pagina.waitForSelector('#resultados .resultado');
  assert.match(await pagina.textContent('#resumen-lupa'), /contracts? worth/);
  assert.match(await pagina.textContent('#resultados'), /Paid by/);
  // Los títulos de los contratos son los publicados: los mismos que en castellano
  const titulo = await pagina.textContent('#resultados .resultado h3');
  const original = await abrir('lupa/', ESCRITORIO);
  await original.pagina.waitForSelector('#resultados .resultado');
  assert.equal(await original.pagina.textContent('#resultados .resultado h3'), titulo);
  await original.contexto.close();
  await contexto.close();
});

test('descargas: cada página baja sus datos en CSV, y el JSON existe', async () => {
  for (const [ruta, cabecera] of [['a-donde-va/', /^\ufeffPartida;/], ['quien-gasta/', /^\ufeffAdministración;/], ['presupuesto/', /^\ufeffAño;Mes;/], ['lupa/', /^\ufeffContrato;Paga;/], ['en/a-donde-va/', /^\ufeffItem,/]]) {
    const { pagina, contexto } = await abrir(ruta, { ...ESCRITORIO, acceptDownloads: true });
    const boton = pagina.locator('#descargas [data-descarga]').first();
    await boton.waitFor();
    const [descarga] = await Promise.all([pagina.waitForEvent('download'), boton.click()]);
    assert.match(descarga.suggestedFilename(), /^hucha-.+\.csv$/, `${ruta}: nombre del fichero`);
    const texto = await readFile(await descarga.path(), 'utf8');
    assert.match(texto, cabecera, `${ruta}: cabecera del CSV`);
    assert.ok(texto.trim().split('\r\n').length > 1, `${ruta}: el CSV tiene filas`);
    const json = pagina.locator('#descargas a[href$=".json"]');
    if (await json.count()) assert.equal((await pagina.request.get(await json.getAttribute('href'))).status(), 200, `${ruta}: JSON`);
    await contexto.close();
  }
});

test('portada en el móvil: «Ver mi ticket» calcula, cierra el teclado y lleva al ticket', async () => {
  const { pagina, contexto } = await abrir('', MOVIL);
  await pagina.fill('#bruto', '45000');
  await pagina.tap('.calcular');
  await pagina.waitForFunction(() => document.activeElement?.id !== 'bruto');
  assert.match(await pagina.textContent('#aporte'), /Total/);
  // El desplazamiento es suave: se espera a que acabe
  await pagina.waitForFunction(() => Math.abs(document.getElementById('ticket').getBoundingClientRect().top) < 300, null, { timeout: 5000 });
  await contexto.close();
});

test('presupuesto: los temas rellenan la búsqueda', async () => {
  const { pagina, contexto } = await abrir('presupuesto/', ESCRITORIO);
  await pagina.click('[data-q="igualdad"]');
  assert.equal(await pagina.inputValue('#q'), 'igualdad');
  assert.equal(await pagina.getAttribute('[data-q="igualdad"]', 'aria-pressed'), 'true');
  assert.match(pagina.url(), /q=igualdad/);
  await pagina.click('[data-q="igualdad"]');
  assert.equal(await pagina.inputValue('#q'), '');
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
  for (const ruta of PAGINAS_ES.flatMap(([r]) => [r, `en/${r}`])) {
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

async function lupa(nombre) {
  try {
    return JSON.parse(await readFile(new URL(`../../_site/data/lupa/${nombre}.json`, import.meta.url), 'utf8'));
  } catch {
    return null;
  }
}

test('lupa: contratos con buscador, temas, nivel y estado en la URL', async () => {
  const datosContratos = await lupa('contratos');
  const { pagina, errores, contexto } = await abrir('lupa/', ESCRITORIO);
  assert.deepEqual(propios(errores), []);
  if (!datosContratos?.contratos?.length) {
    assert.match(await pagina.textContent('#resumen-lupa'), /no están disponibles/);
    await contexto.close();
    return;
  }
  assert.match(await pagina.textContent('#resumen-lupa'), /contratos? por .+millones de €/);
  assert.ok((await pagina.locator('#resultados .resultado').count()) > 0);
  // Ningún adjudicatario con NIF de persona aparece con nombre
  const ganadores = datosContratos.contratos.flatMap((c) => c.g ?? []);
  assert.ok(!ganadores.some((g) => /^[0-9XYZ]\d{7}[A-Z]$/.test(g)), 'sin NIF de personas');
  // Un tema
  await pagina.getByRole('button', { name: 'Sanidad', exact: true }).click();
  await pagina.waitForTimeout(200);
  assert.match(pagina.url(), /tema=sanidad/);
  // Una búsqueda que no existe
  await pagina.fill('#q', 'zzzzzzzzzz');
  await pagina.press('#q', 'Enter');
  await pagina.waitForTimeout(300);
  assert.match(await pagina.textContent('#resumen-lupa'), /No hay contratos/);
  await contexto.close();
});

test('lupa: subvenciones y ayuda a otros países', async () => {
  const sub = await lupa('subvenciones');
  const ayuda = await lupa('ayuda');
  const { pagina, contexto } = await abrir('lupa/?tab=subvenciones', ESCRITORIO);
  if (sub?.subvenciones?.length) assert.match(await pagina.textContent('#resumen-lupa'), /subvenci(ón|ones) por/);
  await pagina.click('#tab-ayuda');
  await pagina.waitForTimeout(300);
  assert.match(pagina.url(), /tab=ayuda/);
  if (ayuda?.paises && Object.keys(ayuda.paises).length) {
    assert.match(await pagina.textContent('#resumen-lupa'), /ayuda oficial al desarrollo/);
    assert.ok((await pagina.locator('.resultado-pais').count()) > 0);
    assert.equal(await pagina.locator('#filtros').isVisible(), false, 'sin temas en la pestaña de países');
  }
  await accesible(pagina, 'lupa (ayuda)');
  await contexto.close();
});

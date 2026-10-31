// Hace capturas de la web ya preparada (_site) con los datos reales y las guarda en _site/capturas/.
// El README las enlaza desde hucha.bendi.dev, así que siempre enseñan la versión publicada.
// Uso: node scripts/capturas.mjs   (necesita playwright)

import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { arrancar } from '../tests/e2e/servidor.mjs';

const destino = new URL('../_site/capturas/', import.meta.url);
await mkdir(destino, { recursive: true });

const servidor = await arrancar();
const navegador = await chromium.launch();

async function captura(nombre, ruta, { ancho = 1280, alto = 860, tema = 'light', antes, ...opciones } = {}) {
  const contexto = await navegador.newContext({
    viewport: { width: ancho, height: alto },
    deviceScaleFactor: 2,
    colorScheme: tema,
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
    reducedMotion: 'reduce',
    ...opciones,
  });
  const pagina = await contexto.newPage();
  await pagina.route(/goatcounter|gc\.zgo\.at/, (r) => r.abort());
  await pagina.goto(servidor.base + ruta, { waitUntil: 'networkidle' });
  if (antes) await antes(pagina);
  await pagina.waitForTimeout(500);
  await pagina.screenshot({ path: new URL(`${nombre}.png`, destino).pathname });
  await contexto.close();
  console.log(`capturas/${nombre}.png`);
}

await captura('portada', '');
await captura('a-donde-va', 'a-donde-va/', {
  alto: 1000,
  antes: async (p) => {
    await p.locator('.partida summary').nth(1).click();
    await p.locator('.partida').nth(1).evaluate((e) => window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 120));
  },
});
await captura('quien-gasta', 'quien-gasta/', {
  alto: 1000,
  antes: (p) => p.locator('#t-funciones').evaluate((e) => window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 24)),
});
await captura('movil', '', {
  ancho: 390, alto: 844, tema: 'dark', isMobile: true, hasTouch: true,
  antes: (p) => p.fill('#bruto', '30.000'),
});
await captura('movil-ticket', '', {
  ancho: 390, alto: 844, tema: 'dark', isMobile: true, hasTouch: true,
  antes: (p) => p.locator('#ticket').evaluate((e) => window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 16)),
});

await navegador.close();
await servidor.cerrar();

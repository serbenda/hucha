// Genera los iconos de la app y la imagen para compartir (Open Graph) a partir del logo SVG y de los datos.
// Lo ejecuta la Action con Playwright instalado; las imágenes no se guardan en el repositorio.
// Uso: node scripts/imagenes.mjs   (necesita almacen/cofog.json y, si existe, usa vendor/ para la fuente)

import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { logoFijo, htmlIcono, htmlCompartir } from './plantillas-imagenes.mjs';

const raiz = new URL('../', import.meta.url);
const logo = logoFijo(await readFile(new URL('assets/img/favicon.svg', raiz), 'utf8'));
const datos = JSON.parse(await readFile(new URL('almacen/cofog.json', raiz), 'utf8'));

let fuente = '';
try {
  const woff = await readFile(new URL('vendor/fuentes/archivo-latin-wdth-normal.woff2', raiz));
  fuente = `@font-face{font-family:Archivo;src:url(data:font/woff2;base64,${woff.toString('base64')}) format('woff2');font-weight:100 900;font-stretch:62% 125%}`;
} catch {
  console.warn('Sin vendor/: las imágenes usarán la fuente del sistema');
}

const navegador = await chromium.launch();

async function captura(html, ancho, alto, destino) {
  const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
  await pagina.setContent(`<!doctype html><meta charset="utf-8"><style>${fuente}*{margin:0;box-sizing:border-box}body{width:${ancho}px;height:${alto}px;overflow:hidden}svg{width:100%;height:100%;display:block}</style>${html}`);
  await pagina.evaluate(() => document.fonts.ready);
  await writeFile(new URL(destino, raiz), await pagina.screenshot({ type: 'png' }));
  await pagina.close();
  console.log(`${destino} (${ancho}×${alto})`);
}

await captura(htmlIcono(logo, 192, 0.12), 192, 192, 'assets/img/icono-192.png');
await captura(htmlIcono(logo, 512, 0.12), 512, 512, 'assets/img/icono-512.png');
await captura(htmlIcono(logo, 512, 0.2), 512, 512, 'assets/img/icono-maskable-512.png');
await captura(htmlIcono(logo, 180, 0.12), 180, 180, 'assets/img/apple-touch-icon.png');
await captura(htmlCompartir(logo, datos), 1200, 630, 'assets/img/compartir.png');

await navegador.close();

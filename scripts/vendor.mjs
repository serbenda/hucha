// Copia la fuente Archivo desde node_modules a vendor/fuentes/,
// para servirla desde la propia web y no depender de Google Fonts ni de CDN.
// Uso (lo hace la Action):
//   npm install --no-save --no-package-lock @fontsource-variable/archivo@5
//   node scripts/vendor.mjs

import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';

const raiz = new URL('../', import.meta.url);
const destino = new URL('vendor/fuentes/', raiz);
const origen = new URL('node_modules/@fontsource-variable/archivo/files/', raiz);

await rm(new URL('vendor/', raiz), { recursive: true, force: true });
await mkdir(destino, { recursive: true });

const archivos = await readdir(origen);
const SUBCONJUNTOS = {
  latin: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  'latin-ext': 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
};

let css = '';
for (const [sub, rango] of Object.entries(SUBCONJUNTOS)) {
  // Preferimos el fichero con todos los ejes (anchura y peso)
  const fichero = ['full', 'wdth', 'wght'].map((eje) => `archivo-${sub}-${eje}-normal.woff2`).find((n) => archivos.includes(n));
  if (!fichero) throw new Error(`No encuentro la fuente Archivo para ${sub}. Ficheros: ${archivos.join(', ')}`);
  await cp(new URL(fichero, origen), new URL(fichero, destino));
  css += `@font-face {
  font-family: 'Archivo';
  font-style: normal;
  font-display: swap;
  font-weight: 100 900;
  font-stretch: 62% 125%;
  src: url('${fichero}') format('woff2-variations');
  unicode-range: ${rango};
}
`;
  console.log(`Fuente ${sub}: ${fichero}`);
}
await writeFile(new URL('archivo.css', destino), css);
console.log('vendor/ listo');

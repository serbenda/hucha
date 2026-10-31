// La versión en inglés (en/) se genera de las páginas en castellano: no puede faltar ninguna traducción,
// y las rutas, el idioma y la canónica tienen que quedar bien.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { traducir, PAGINAS } from '../scripts/ingles.mjs';
import * as EN from '../assets/js/en.js';
import { PARTIDAS, SUBSECTORES, FUNCIONES, GRUPOS, TIPOS } from '../assets/js/cofog.js';
import { TEMAS } from '../assets/js/lupa-datos.js';

const leer = (ruta) => readFile(new URL(`../${ruta}index.html`, import.meta.url), 'utf8');

for (const ruta of PAGINAS) {
  test(`en/${ruta}: todo traducido, en inglés y con las rutas bien`, async () => {
    const { html, faltan } = traducir(await leer(ruta), ruta);
    assert.deepEqual(faltan, [], 'faltan traducciones en scripts/traduccion-en.mjs');
    assert.match(html, /<html lang="en">/);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://hucha\\.bendi\\.dev/en/${ruta}">`));
    assert.match(html, /<a class="idioma" href="[./]*[^"]*" hreflang="es" lang="es">Español<\/a>/);
    // Los recursos suben un nivel; las páginas, no
    const viejo = ruta ? 'src="../assets/' : 'src="assets/';
    const nuevo = ruta ? 'src="../../assets/' : 'src="../assets/';
    assert.ok(!html.includes(viejo) && html.includes(nuevo), 'los scripts suben un nivel');
    assert.doesNotMatch(html, /href="\.\.\/https?:/);
  });
}

test('en.js: hay nombre en inglés para cada partida, grupo, tipo, función, administración y tema', () => {
  for (const p of PARTIDAS) assert.ok(EN.PARTIDAS[p.id]?.[0], `partida ${p.id}`);
  for (const g of Object.keys(GRUPOS)) assert.ok(EN.GRUPOS[g], `grupo ${g}`);
  for (const x of TIPOS) assert.ok(EN.TIPOS[x.id]?.[0], `tipo ${x.id}`);
  for (const f of FUNCIONES) assert.ok(EN.FUNCIONES[f.id ?? f.codigo], `función ${f.id ?? f.codigo}`);
  for (const a of SUBSECTORES) assert.ok(EN.ADMINISTRACIONES[a.id]?.[0], `administración ${a.id}`);
  for (const t of TEMAS) assert.ok(EN.TEMAS[t.id], `tema ${t.id}`);
});

// Fondos de la UE: lo que España recibe del presupuesto de la UE y lo que aporta, año a año.
// Fuente: Comisión Europea, «EU spending and revenue» (un Excel con una hoja por año y una columna por país).
// El enlace al Excel cambia cada año: se busca en la página de la Comisión. Se guarda en almacen/ue.json.
// Si falla, se queda lo de la última vez (y se anota en data/estado.json).

import { mkdtemp, writeFile, readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { leerXlsx, hojasXlsx } from './xlsx.mjs';
import { leerHojaUe } from '../assets/js/ue.js';
import { anotar } from './estado.mjs';

export const PAGINA_UE = 'https://commission.europa.eu/strategy-and-policy/eu-budget/long-term-eu-budget/2021-2027/spending-and-revenue_en';
const almacen = new URL('../almacen/', import.meta.url);
const destino = new URL('ue.json', almacen);
const cabeceras = { 'User-Agent': 'hucha (datos públicos; https://hucha.bendi.dev)' };

async function pedir(url, tipo = 'text') {
  let ultimo;
  for (let i = 1; i <= 3; i++) {
    try {
      const r = await fetch(url, { headers: cabeceras, signal: AbortSignal.timeout(120000), redirect: 'follow' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return tipo === 'buffer' ? Buffer.from(await r.arrayBuffer()) : await r.text();
    } catch (e) {
      ultimo = e;
      if (i < 3) await new Promise((ok) => setTimeout(ok, 5000 * i));
    }
  }
  throw new Error(`${ultimo.message} en ${url}`);
}

try {
  const html = await pedir(PAGINA_UE);
  const enlace = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&')).find((u) => /spending_and_revenue[^"]*\.xlsx/i.test(u));
  if (!enlace) throw new Error('no hay enlace al Excel en la página de la Comisión');
  const url = new URL(enlace, PAGINA_UE).href;
  const carpeta = await mkdtemp(join(tmpdir(), 'ue-'));
  const fichero = join(carpeta, 'ue.xlsx');
  await writeFile(fichero, await pedir(url, 'buffer'));
  const hojas = hojasXlsx(fichero).filter((h) => /^\d{4}$/.test(h.trim()));
  const libro = leerXlsx(fichero, hojas);
  const años = {};
  for (const h of hojas) {
    const año = leerHojaUe(libro[h] ?? []);
    if (año) años[h.trim()] = año;
  }
  const lista = Object.keys(años).sort();
  const ultimo = años[lista.at(-1)];
  if (!ultimo || !(ultimo.recibe > 1000) || !(ultimo.aporta > 1000)) throw new Error(`datos sospechosos: ${lista.length} años; último ${JSON.stringify(ultimo)?.slice(0, 200)}`);
  await mkdir(almacen, { recursive: true });
  await writeFile(destino, JSON.stringify({ actualizado: new Date().toISOString(), fuente: url, años }));
  const r = (x) => Math.round(x).toLocaleString('es-ES');
  await anotar('ue', true, `${lista[0]}-${lista.at(-1)}; ${lista.at(-1)}: recibe ${r(ultimo.recibe)} M€ (de ellos ${r(ultimo.ngeu ?? 0)} del fondo de recuperación), aporta ${r(ultimo.aporta)} M€`);
  console.log(`Fondos de la UE: ${lista.length} años (${lista[0]}-${lista.at(-1)}); ${lista.at(-1)}: ${JSON.stringify(ultimo).slice(0, 600)}`);
} catch (e) {
  let previo = null;
  try {
    previo = JSON.parse(await readFile(destino, 'utf8'));
  } catch {}
  console.warn(`Fondos de la UE: ${e.message}. ${previo ? 'Se queda la versión anterior' : 'Sin datos anteriores'}`);
  await anotar('ue', false, `${e.message}${previo ? '; se usan los datos anteriores' : ''}`);
}

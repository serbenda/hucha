// Fondos de la UE: lo que España recibe del presupuesto de la UE y lo que aporta, año a año.
// Fuente: Comisión Europea, «EU spending and revenue» (un Excel con todos los países desde 2000).
// El enlace al Excel cambia cada año: se busca en la página de la Comisión.
//
// Primera versión: sondeo. Descarga el Excel y escribe en el registro de la Action sus hojas y sus primeras
// filas, para ver cómo es antes de leerlo. No guarda nada ni rompe nada si falla.

import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { leerXlsx, hojasXlsx } from './xlsx.mjs';

const PAGINA = 'https://commission.europa.eu/strategy-and-policy/eu-budget/long-term-eu-budget/2021-2027/spending-and-revenue_en';
const cabeceras = { 'User-Agent': 'hucha (datos públicos; https://hucha.bendi.dev)' };

async function pedir(url, tipo = 'text') {
  const r = await fetch(url, { headers: cabeceras, signal: AbortSignal.timeout(120000), redirect: 'follow' });
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
  return tipo === 'buffer' ? Buffer.from(await r.arrayBuffer()) : r.text();
}

try {
  const html = await pedir(PAGINA);
  const enlaces = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&')).filter((u) => /spending_and_revenue[^"]*\.xlsx/i.test(u));
  console.log(`Enlaces al Excel: ${enlaces.join(' | ') || 'ninguno'}`);
  if (!enlaces.length) throw new Error('no hay enlace al Excel en la página');
  const url = new URL(enlaces[0], PAGINA).href;
  const datos = await pedir(url, 'buffer');
  const carpeta = await mkdtemp(join(tmpdir(), 'ue-'));
  const fichero = join(carpeta, 'ue.xlsx');
  await writeFile(fichero, datos);
  const hojas = hojasXlsx(fichero);
  console.log(`Excel: ${datos.length} bytes; hojas: ${hojas.join(' | ')}`);
  const libro = leerXlsx(fichero, hojas);
  for (const h of hojas) {
    const filas = libro[h] ?? [];
    console.log(`\n=== ${h}: ${filas.length} filas`);
    for (const [i, f] of filas.slice(0, 14).entries()) console.log(`${i}: ${JSON.stringify(f).slice(0, 400)}`);
    const espana = filas.findIndex((f) => Object.values(f).some((v) => /^(ES|Spain|España)$/i.test(String(v).trim())));
    if (espana >= 0) console.log(`España en la fila ${espana}: ${JSON.stringify(filas[espana]).slice(0, 600)}`);
  }
} catch (e) {
  console.warn(`Fondos de la UE (sondeo): ${e.message}`);
}

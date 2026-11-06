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
  // Las dos últimas hojas, enteras: código, concepto y la columna de España (la que tiene «ES» en la cabecera)
  for (const h of hojas.slice(-2)) {
    const filas = libro[h] ?? [];
    const cabecera = filas.find((f) => Object.values(f).some((v) => String(v).trim() === 'ES')) ?? {};
    const col = Object.keys(cabecera).find((k) => String(cabecera[k]).trim() === 'ES');
    const colUe = Object.keys(cabecera).find((k) => /^EU-\d+$/.test(String(cabecera[k]).trim()));
    const colTotal = Object.keys(cabecera).find((k) => String(cabecera[k]).trim() === 'Total');
    console.log(`\n=== ${h}: ${filas.length} filas; España en la columna ${col}, UE en ${colUe}, total en ${colTotal}`);
    for (const [i, f] of filas.entries()) {
      const etiqueta = [f.A, f.B].filter((x) => x !== undefined).join(' | ');
      if (etiqueta) console.log(`${i}: ${String(etiqueta).replace(/\s+/g, ' ').slice(0, 120)} => ES ${f[col] ?? ''} · UE ${f[colUe] ?? ''} · total ${f[colTotal] ?? ''}`);
    }
  }
} catch (e) {
  console.warn(`Fondos de la UE (sondeo): ${e.message}`);
}

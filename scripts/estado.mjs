// Guarda en data/estado.json si cada descarga ha ido bien.
// La Action lo lee después para abrir (o cerrar) un issue de aviso.

import { readFile, writeFile, mkdir } from 'node:fs/promises';

const fichero = new URL('../data/estado.json', import.meta.url);

export async function anotar(fuente, ok, detalle) {
  let estado = {};
  try {
    estado = JSON.parse(await readFile(fichero, 'utf8'));
  } catch {}
  estado[fuente] = { ok, detalle, fecha: new Date().toISOString() };
  await mkdir(new URL('../data/', import.meta.url), { recursive: true });
  await writeFile(fichero, JSON.stringify(estado, null, 1) + '\n');
}

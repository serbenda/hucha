// Guarda en data/estado.json si cada descarga ha ido bien.
// La Action lo lee después para abrir (o cerrar) un issue de aviso.

import { readFile, writeFile, mkdir } from 'node:fs/promises';

const fichero = new URL('../data/estado.json', import.meta.url);

/**
 * Anota cómo ha ido una fuente. `avisar: false` es un fallo que no abre aviso (p. ej., la fuente no responde
 * hoy pero los datos guardados son de hace muy poco): sale en la web como fallo, pero no molesta.
 */
export async function anotar(fuente, ok, detalle, { avisar = true } = {}) {
  let estado = {};
  try {
    estado = JSON.parse(await readFile(fichero, 'utf8'));
  } catch {}
  estado[fuente] = { ok, detalle, fecha: new Date().toISOString(), ...(ok || avisar ? {} : { avisar: false }) };
  await mkdir(new URL('../data/', import.meta.url), { recursive: true });
  await writeFile(fichero, JSON.stringify(estado, null, 1) + '\n');
}

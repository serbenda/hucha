// Genera data/cofog.json con DATOS DE EJEMPLO para trabajar en local sin conexión.
// No son datos oficiales: la web lo avisa con una banda en todas las páginas.
// La Action nunca usa este script.

import { writeFile, mkdir } from 'node:fs/promises';
import { prepararDatos } from '../assets/js/cofog.js';
import { respuestasEjemplo } from '../tests/ayuda.js';

const { gasto, poblacion, tipos } = respuestasEjemplo();
const datos = { ...prepararDatos(gasto, poblacion, tipos), ejemplo: true, actualizado: new Date().toISOString() };
await mkdir(new URL('../data/', import.meta.url), { recursive: true });
await writeFile(new URL('../data/cofog.json', import.meta.url), JSON.stringify(datos));
console.log('data/cofog.json de EJEMPLO creado (no son datos oficiales)');

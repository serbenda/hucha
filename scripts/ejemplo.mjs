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

// Lupa de EJEMPLO
const lupa = new URL('../data/lupa/', import.meta.url);
await mkdir(lupa, { recursive: true });
const contrato = (id, t, o, n, g, a, te, fi) => ({ id, t, o, n, l: null, ti: 'Obras', fi, te, li: a * 1.15, a, f: '2026-10-01', g: [g], u: 'https://contrataciondelestado.es/', up: '2026-10-30' });
await writeFile(new URL('contratos.json', lupa), JSON.stringify({ ejemplo: true, actualizado: new Date().toISOString(), umbral: 1e6, desde: '2026-09-01T00:00:00Z', contratos: [
  contrato('1', 'EJEMPLO: mantenimiento de la catenaria de la línea Madrid-Sevilla', 'Consejo de Administración de Adif', 'Estado', 'EMPRESA DE EJEMPLO SA', 48e6, ['tren'], 'Mantenimiento y reparación'),
  contrato('2', 'EJEMPLO: obras del nuevo hospital comarcal', 'Servicio de Salud', 'Comunidades', 'CONSTRUCTORA DE EJEMPLO SA', 32e6, ['sanidad'], 'Obra'),
  contrato('3', 'EJEMPLO: conservación de la autovía A-4', 'Dirección General de Carreteras', 'Estado', 'CONSERVACIÓN DE EJEMPLO SL', 12e6, ['carreteras'], 'Mantenimiento y reparación'),
] }));
await writeFile(new URL('subvenciones.json', lupa), JSON.stringify({ ejemplo: true, actualizado: new Date().toISOString(), umbral: 1e6, subvenciones: [
  { id: 'S1', f: '2026-10-13', i: 28e6, b: 'AYUNTAMIENTO DE EJEMPLO', nif: 'P0000000A', c: 'EJEMPLO: plan de obras municipales', o: 'Dirección General de Ejemplo', n: 'Estado', l: null, u: null, te: [] },
] }));
await writeFile(new URL('ayuda.json', lupa), JSON.stringify({ ejemplo: true, actualizado: new Date().toISOString(), unidad: 'millones de dólares', años: ['2023', '2024'], paises: { MAR: { 2023: 100, 2024: 120 }, UKR: { 2023: 80, 2024: 60 } } }));
console.log('data/lupa/ de EJEMPLO creado');

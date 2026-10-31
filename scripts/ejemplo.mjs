// Genera un almacén con DATOS DE EJEMPLO para trabajar en local sin conexión, y su escaparate (data/).
// No son datos oficiales: la web lo avisa con una banda en todas las páginas.
// La Action nunca usa este script.

import { writeFile, mkdir } from 'node:fs/promises';
import { prepararDatos } from '../assets/js/cofog.js';
import { respuestasEjemplo } from '../tests/ayuda.js';
import { escaparate } from './escaparate.mjs';

const { gasto, poblacion, tipos } = respuestasEjemplo();
const datos = { ...prepararDatos(gasto, poblacion, tipos), ejemplo: true, actualizado: new Date().toISOString() };
await mkdir(new URL('../almacen/', import.meta.url), { recursive: true });
await writeFile(new URL('../almacen/cofog.json', import.meta.url), JSON.stringify(datos));
console.log('almacen/cofog.json de EJEMPLO creado (no son datos oficiales)');

// Lupa de EJEMPLO
const lupa = new URL('../almacen/', import.meta.url);
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
await writeFile(new URL('ayuda.json', lupa), JSON.stringify({
  ejemplo: true, actualizado: new Date().toISOString(), unidad: 'millones de dólares', años: ['2022', '2023'],
  totales: { 2022: 900, 2023: 1000 },
  sectores: { 2022: { 120: 90, 150: 110, 720: 200, 930: 300 }, 2023: { 120: 100, 150: 120, 720: 230, 930: 320, 140: 40 } },
  paises: { MAR: { 2022: 100, 2023: 120 }, UKR: { 2022: 80, 2023: 60 }, COL: { 2022: 40, 2023: 45 } },
  porPais: { MAR: { 2023: { 120: 30, 140: 25, 150: 20, 310: 15 } }, UKR: { 2023: { 720: 50, 730: 10 } }, COL: { 2023: { 150: 25, 160: 10 } } },
  proyectosAño: '2023',
  proyectos: { MAR: [{ v: 3.2, t: 'EJEMPLO: centros de salud en el norte', s: '120', a: 'AECID', c: 'ONG y sociedad civil' }, { v: 2.1, t: 'EJEMPLO: agua potable en zonas rurales', s: '140', a: 'AECID', c: 'Sector público' }] },
}));
console.log('Lupa de EJEMPLO creada en almacen/');
for (const r of await escaparate()) console.log(r);

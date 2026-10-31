import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepararDatos, partidas, ultimoAño, gastoPorPersona } from '../assets/js/cofog.js';
import { vistaPortada, vistaADondeVa, vistaQuienGasta, aJson } from '../assets/js/vistas.js';
import { respuestasEjemplo } from './ayuda.js';

const { gasto, poblacion, tipos } = respuestasEjemplo();
const datos = { ...prepararDatos(gasto, poblacion, tipos), actualizado: '2026-10-31T05:00:00Z' };
const año = ultimoAño(datos);

test('vista de la portada: lo justo para el ticket y las cifras de todos', () => {
  const v = vistaPortada(datos);
  assert.equal(v.año, año);
  assert.equal(v.porPersona, gastoPorPersona(datos, año));
  assert.deepEqual(v.partidas.map((p) => p.id), partidas(datos, año).map((p) => p.id));
  assert.ok(Math.abs(v.partidas.reduce((t, p) => t + p.cuota, 0) - 1) < 1e-9);
  assert.equal(v.actualizado, '2026-10-31T05:00:00Z');
  assert.equal(v.ejemplo, undefined);
});

test('vista de «A dónde va»: cada partida con su detalle y su serie', () => {
  const v = vistaADondeVa(datos);
  assert.equal(v.partidas.length, partidas(datos, año).length);
  for (const p of v.partidas) {
    assert.ok(Array.isArray(p.serie) && p.serie.length > 1, p.id);
    assert.ok(Array.isArray(p.grupos) && Array.isArray(p.tipos), p.id);
  }
  assert.ok(v.porHabitante > 0);
});

test('vista de «Quién gasta»: administraciones y funciones', () => {
  const v = vistaQuienGasta(datos);
  assert.equal(v.administraciones.length, 4);
  assert.ok(v.funciones.length >= 10);
});

test('las vistas pesan mucho menos que los datos completos', () => {
  const completo = JSON.stringify(datos).length;
  for (const v of [vistaPortada, vistaADondeVa, vistaQuienGasta]) assert.ok(aJson(v(datos)).length < completo / 3, v.name);
  assert.equal(JSON.parse(aJson({ x: 0.123456789, n: 7 })).x, 0.123457);
});

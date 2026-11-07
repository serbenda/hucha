// Fondos de la UE: se lee bien una hoja del Excel de la Comisión y el resumen cuadra.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerHojaUe, resumenUe } from '../assets/js/ue.js';
import { hoja2024 } from './ue-ejemplo.js';

test('leerHojaUe: gasto en España por rúbricas, el fondo de recuperación aparte y lo que aporta', () => {
  const a = leerHojaUe(hoja2024);
  assert.equal(a.mff, 12610.33);
  assert.equal(a.ngeu, 17023.28);
  assert.ok(Math.abs(a.recibe - 29633.61) < 0.01);
  assert.deepEqual(a.rubros.map((r) => r.codigo), ['1.', '2.', '3.', '4.', '5.', '6.', '7.', 'O', 'S'], 'solo las grandes rúbricas, sin el detalle');
  assert.equal(a.ngeuRubros.length, 3);
  assert.ok(Math.abs(a.aporta - (13255.54 - 329.28)) < 0.01);
  assert.equal(a.aportacion.aduanas, 1941.31);
  assert.equal(a.rnbPais, 1584040.55);
});

test('leerHojaUe: sin columna de España o sin total, null', () => {
  assert.equal(leerHojaUe([{ A: 'x', B: 'FR' }]), null);
  assert.equal(leerHojaUe(hoja2024.filter((f) => f.A !== 'TOTAL EXPENDITURE')), null);
});

test('resumenUe: el último año, con nombres claros, el plan de recuperación como una línea más y el saldo', () => {
  const ue = { actualizado: '2026-11-07T00:00:00Z', años: { 2023: { ...leerHojaUe(hoja2024), recibe: 20000, aporta: 12000 }, 2024: leerHojaUe(hoja2024) } };
  const r = resumenUe(ue, { 2024: 48.6e6 });
  assert.equal(r.año, '2024');
  assert.ok(Math.abs(r.saldo - (r.recibe - r.aporta)) < 1e-9);
  assert.equal(r.rubros[0].id, 'ngeu', 'el plan de recuperación es lo que más llega en 2024');
  assert.equal(r.rubros.find((x) => x.id === '3.').nombre, 'Agricultura, pesca y medio ambiente');
  assert.ok(!r.rubros.some((x) => x.id === 'S'), 'lo que es cero no sale');
  assert.equal(r.aportacion[0].id, 'rnb');
  assert.ok(r.aportacion.some((x) => x.id === 'ajustes' && x.valor < 0));
  assert.ok(Math.round(r.porPersona.recibe) === Math.round((r.recibe * 1e6) / 48.6e6));
  assert.deepEqual(r.serie.map((x) => x.año), ['2023', '2024']);
  assert.equal(resumenUe({ años: {} }), null);
});

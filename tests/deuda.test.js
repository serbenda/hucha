// Deuda y déficit (Eurostat gov_10dd_edpt1): se leen bien de JSON-stat y el resumen para la web cuadra.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { urlDeuda, prepararDeuda, resumenDeuda, prepararDatos } from '../assets/js/cofog.js';
import { millones } from '../assets/js/formato.js';
import { respuestasEjemplo, crearJsonStat } from './ayuda.js';

test('urlDeuda pide deuda (GD) y déficit (B9) de España y la UE, en euros y en % del PIB', () => {
  const u = new URL(urlDeuda());
  assert.match(u.pathname, /gov_10dd_edpt1$/);
  assert.deepEqual(u.searchParams.getAll('na_item'), ['GD', 'B9']);
  assert.deepEqual(u.searchParams.getAll('geo'), ['ES', 'EU27_2020']);
  assert.deepEqual(u.searchParams.getAll('unit'), ['MIO_EUR', 'PC_GDP']);
  assert.equal(u.searchParams.get('sector'), 'S13');
});

test('prepararDeuda: España en euros y % del PIB; la UE solo en % del PIB; otros sectores fuera', () => {
  const j = crearJsonStat(['unit', 'sector', 'na_item', 'geo', 'time'], [
    { unit: 'MIO_EUR', sector: 'S13', na_item: 'GD', geo: 'ES', time: '2024', valor: 1600000 },
    { unit: 'PC_GDP', sector: 'S13', na_item: 'GD', geo: 'ES', time: '2024', valor: 101.8 },
    { unit: 'MIO_EUR', sector: 'S13', na_item: 'B9', geo: 'ES', time: '2024', valor: -50000 },
    { unit: 'MIO_EUR', sector: 'S13', na_item: 'GD', geo: 'EU27_2020', time: '2024', valor: 14000000 },
    { unit: 'PC_GDP', sector: 'S13', na_item: 'GD', geo: 'EU27_2020', time: '2024', valor: 81 },
    { unit: 'MIO_EUR', sector: 'S1311', na_item: 'GD', geo: 'ES', time: '2024', valor: 1 },
  ]);
  const d = prepararDeuda(j);
  assert.equal(d.es.GD.MIO_EUR['2024'], 1600000);
  assert.equal(d.es.GD.PC_GDP['2024'], 101.8);
  assert.equal(d.es.B9.MIO_EUR['2024'], -50000);
  assert.deepEqual(d.ue, { GD: { PC_GDP: { 2024: 81 } } });
});

test('resumenDeuda: último año con deuda y población, déficit en positivo y serie frente a la UE', () => {
  const { gasto, poblacion, tipos, deuda } = respuestasEjemplo();
  const datos = { ...prepararDatos(gasto, poblacion, tipos), deuda: prepararDeuda(deuda) };
  const r = resumenDeuda(datos);
  assert.equal(r.año, '2024');
  assert.ok(r.total > 1e6 && r.pib > 90);
  assert.equal(r.pibUe, 82);
  assert.ok(Math.abs(r.porPersona - (r.total * 1e6) / datos.poblacion['2024']) < 1e-6);
  assert.ok(r.deficit > 0 && r.deficitPib > 0, 'el déficit sale en positivo');
  assert.equal(r.deficitPibUe, 3.1);
  assert.equal(r.serie.at(-1).año, '2024');
  assert.equal(r.serie.length, 11);
  assert.equal(resumenDeuda({ ...datos, deuda: undefined }), null);
});

test('millones: a partir del millón de millones, en billones', () => {
  assert.equal(millones(1516200), '1,52 billones de euros');
  assert.equal(millones(1e6), '1 billón de euros');
  assert.equal(millones(880200), '880 mil millones de euros');
});

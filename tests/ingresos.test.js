// Ingresos (Eurostat gov_10a_main y gov_10a_taxag): de dónde sale el dinero.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { urlIngresos, urlImpuestos, prepararIngresos, resumenIngresos, prepararDatos } from '../assets/js/cofog.js';
import { respuestasEjemplo, crearJsonStat } from './ayuda.js';

const datosEjemplo = () => {
  const { gasto, poblacion, tipos, ingresos, impuestos } = respuestasEjemplo();
  return { ...prepararDatos(gasto, poblacion, tipos), ingresos: prepararIngresos(ingresos, impuestos) };
};

test('las URL piden todas las administraciones (S13), España y la UE, en euros y en % del PIB, sin filtrar el concepto', () => {
  for (const [url, tabla] of [[urlIngresos(), 'gov_10a_main'], [urlImpuestos(), 'gov_10a_taxag']]) {
    const u = new URL(url);
    assert.match(u.pathname, new RegExp(`${tabla}$`));
    assert.equal(u.searchParams.get('sector'), 'S13');
    assert.deepEqual(u.searchParams.getAll('geo'), ['ES', 'EU27_2020']);
    assert.equal(u.searchParams.getAll('na_item').length, 0);
  }
});

test('resumen: bloques que suman el total, de mayor a menor, con IVA, IRPF y sociedades por separado', () => {
  const r = resumenIngresos(datosEjemplo());
  assert.equal(r.año, '2024');
  assert.equal(r.detalle, true);
  assert.ok(Math.abs(r.bloques.reduce((s, b) => s + b.valor, 0) - r.total) < 1, 'los bloques suman el total');
  assert.ok(Math.abs(r.bloques.reduce((s, b) => s + b.cuota, 0) - 1) < 1e-9);
  assert.deepEqual(r.bloques.map((b) => b.id), ['cotizaciones', 'irpf', 'iva', 'otros', 'otros-impuestos', 'sociedades']);
  assert.ok(r.gasto > r.total, 'el ejemplo tiene déficit');
  assert.ok(r.bloques.every((b) => b.pibUe !== null), 'cada bloque se compara con la UE');
});

test('se puede pedir un año concreto (el del gasto), y si no lo hay, el último', () => {
  const d = datosEjemplo();
  assert.equal(resumenIngresos(d, '2020').año, '2020');
  assert.equal(resumenIngresos(d, '1990').año, '2024');
});

test('sin el desglose de impuestos, dos bloques de impuestos y el total sigue cuadrando', () => {
  const { ingresos } = respuestasEjemplo();
  const d = { ...datosEjemplo(), ingresos: prepararIngresos(ingresos, null) };
  const r = resumenIngresos(d);
  assert.equal(r.detalle, false);
  assert.deepEqual(r.bloques.map((b) => b.id).sort(), ['consumo', 'cotizaciones', 'otros', 'renta']);
  assert.ok(Math.abs(r.bloques.reduce((s, b) => s + b.valor, 0) - r.total) < 1);
});

test('se guardan solo los conceptos que se usan, y de otros sectores nada', () => {
  const j = crearJsonStat(['unit', 'sector', 'na_item', 'geo', 'time'], [
    { unit: 'MIO_EUR', sector: 'S13', na_item: 'TR', geo: 'ES', time: '2024', valor: 600000 },
    { unit: 'MIO_EUR', sector: 'S13', na_item: 'P1', geo: 'ES', time: '2024', valor: 1 },
    { unit: 'MIO_EUR', sector: 'S1311', na_item: 'TR', geo: 'ES', time: '2024', valor: 2 },
  ]);
  const d = prepararIngresos(j, null);
  assert.deepEqual(d.es, { TR: { MIO_EUR: { 2024: 600000 } } });
  assert.deepEqual(d.codigos, ['P1', 'TR']);
  assert.equal(resumenIngresos({ poblacion: {}, ingresos: undefined }), null);
});

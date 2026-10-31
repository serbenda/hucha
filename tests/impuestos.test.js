import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplicarEscala, cotizaciones, reduccionTrabajo, irpf, aportacion, repartir, REGLAS } from '../assets/js/impuestos.js';
import { leerImporte, euros, porcentaje, millones } from '../assets/js/formato.js';

const cerca = (a, b, margen = 0.01) => assert.ok(Math.abs(a - b) <= margen, `${a} ≠ ${b}`);

test('escala por tramos', () => {
  cerca(aplicarEscala(12450, REGLAS.irpf.escala), 2365.5);
  cerca(aplicarEscala(20200, REGLAS.irpf.escala), 4225.5);
  cerca(aplicarEscala(35200, REGLAS.irpf.escala), 8725.5);
  cerca(aplicarEscala(60000, REGLAS.irpf.escala), 17901.5);
  cerca(aplicarEscala(0, REGLAS.irpf.escala), 0);
});

test('cotizaciones: 6,50 % el trabajador y 30,65 % la empresa hasta la base máxima', () => {
  const c = cotizaciones(30000);
  cerca(c.trabajador, 1950);
  cerca(c.empresa, 9195);
  // Por encima de la base máxima solo cuenta la solidaridad
  const tope = REGLAS.seguridadSocial.baseMaximaAnual;
  const alto = cotizaciones(tope);
  const masAlto = cotizaciones(tope + 1000);
  cerca(masAlto.trabajador - alto.trabajador, 1000 * 0.0019);
  cerca(masAlto.empresa - alto.empresa, 1000 * 0.0096);
});

test('reducción por rendimientos del trabajo', () => {
  assert.equal(reduccionTrabajo(10000), 7302);
  cerca(reduccionTrabajo(16000), 7302 - 1.75 * (16000 - 14852));
  cerca(reduccionTrabajo(18000), 2364.34 - 1.14 * (18000 - 17673.52));
  assert.equal(reduccionTrabajo(25000), 0);
});

test('IRPF: cero hasta el salario mínimo y sin saltos al pasarlo', () => {
  assert.equal(irpf(15000), 0);
  assert.equal(irpf(REGLAS.smi), 0);
  assert.ok(irpf(REGLAS.smi + 100) <= 0.43 * 100 + 0.01);
});

test('IRPF de un sueldo de 30.000 €', () => {
  // Neto 28.050; base 26.050; cuota = escala(26.050) − escala(5.550)
  cerca(irpf(30000), 4926);
});

test('IRPF crece con el sueldo', () => {
  let anterior = 0;
  for (let b = 18000; b <= 200000; b += 2000) {
    const i = irpf(b);
    assert.ok(i >= anterior, `${b}: ${i} < ${anterior}`);
    anterior = i;
  }
});

test('aportación completa', () => {
  const a = aportacion(30000);
  cerca(a.tuyo, 4926 + 1950);
  cerca(a.neto, 30000 - 6876);
  cerca(a.conEmpresa, 6876 + 9195);
  assert.ok(a.tipoEfectivo > 0.2 && a.tipoEfectivo < 0.25);
  assert.equal(aportacion(0), null);
  assert.equal(aportacion(NaN), null);
});

test('repartir según las cuotas', () => {
  const r = repartir(1000, [{ id: 'a', cuota: 0.25 }, { id: 'b', cuota: 0.75 }]);
  assert.deepEqual(r.map((p) => p.euros), [250, 750]);
});

test('formatos', () => {
  assert.equal(leerImporte('30.000'), 30000);
  assert.equal(leerImporte('30000 €'), 30000);
  assert.equal(leerImporte('30 000'), 30000);
  assert.equal(leerImporte('2.500,50'), 2500.5);
  assert.equal(leerImporte('1234.5'), 1234.5);
  assert.equal(leerImporte(''), null);
  assert.equal(leerImporte('abc'), null);
  assert.equal(euros(1234.4).replace(/\s/g, ' '), '1.234 €');
  assert.equal(porcentaje(0.1234).replace(/\s/g, ' '), '12,3 %');
  assert.equal(millones(652000), '652 mil millones de euros');
});

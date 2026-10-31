import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GTOS004, GTOS014, GTOS016, GTOS017, NOMBRES } from './ejecucion-ejemplo.js';
import { librosMensuales, leerCapitulos, leerSecciones, leerPoliticas, leerProgramas, leerLibro, mesDeCorte, ejecutado, nombreSeccion } from '../assets/js/ejecucion.js';

test('ejecución: enlaces a los libros mensuales, sin anexos', () => {
  const html = `<a href="/x/Documents/MENSUAL%20AGOSTO%202026.xlsx">a</a><a href="/x/Documents/MENSUAL%20AGOSTO%202026%20ANEXO%20I.xlsx">b</a>
    <a href="/x/Documents/MENSUAL%20ENERO%202025%20%28EXCEL%29.xlsx">c</a><a href="/x/Documents/AVANCE%20COMENTADO%20PAGOS%20MENSUALES%20SEPTIEMBRE%202026%28EXCEL%29.xlsx">d</a>`;
  assert.deepEqual(librosMensuales(html).map((l) => l.mes), ['2025-01', '2026-08']);
  assert.match(librosMensuales(html)[1].url, /^https:\/\/www\.igae\.pap\.hacienda\.gob\.es\/x\/Documents\/MENSUAL%20AGOSTO%202026\.xlsx$/);
});

test('ejecución: capítulos con el año anterior, en millones', () => {
  const c = leerCapitulos(GTOS004);
  assert.equal(c.capitulos.length, 9);
  assert.equal(c.capitulos[5].nombre, 'INVERSIONES REALES');
  assert.equal(c.capitulos[5].creditos, 19810.94);
  assert.equal(c.capitulos[5].anterior.obligaciones, 4927.04);
  assert.equal(c.capitulos[4].obligaciones, null, 'un guion no es un cero');
  assert.equal(c.noFinanciero.obligaciones, 170765.64);
  assert.equal(Math.round(ejecutado(c.noFinanciero) * 1000) / 10, 60.7);
  assert.equal(mesDeCorte(GTOS004), 8);
});

test('ejecución: secciones, políticas y programas', () => {
  const s = leerSecciones(GTOS014);
  assert.equal(s.length, NOMBRES.length);
  const t = s.find((x) => x.nombre === 'TRANSPORTES Y MOVILIDAD SOSTENIBLE');
  assert.deepEqual([t.creditos, t.obligaciones, t.anterior.creditos, t.anterior.obligaciones], [13228.87, 4938.14, 12492.26, 4522.86]);
  const a = leerPoliticas(GTOS016);
  assert.deepEqual(a.map((x) => x.nombre), ['TRANSFERENCIAS INTERNAS', 'SERVICIOS PÚBLICOS BASICOS', 'PRODUCCIÓN BIENES PÚB. CARÁCTER PREFERENTE', 'ACTUACIONES DE CARÁCTER ECONÓMICO']);
  assert.equal(a[3].politicas[0].nombre, 'Infraestructuras y Ecosistemas Resilientes');
  assert.equal(a[3].politicas[0].id, '45');
  const p = leerProgramas(GTOS017);
  assert.equal(p.find((x) => x.nombre === 'TRANSPORTES Y MOVILIDAD SOSTENIBLE').programas[0].nombre, 'Infraestructuras del transporte ferroviario');
});

test('ejecución: un libro entero y comprobaciones', () => {
  const l = leerLibro({ 'GTOS 004': GTOS004, 'GTOS 014': GTOS014, 'GTOS 016': GTOS016, 'GTOS 017': GTOS017 }, '2026-08');
  assert.equal(l.mes, '2026-08');
  assert.throws(() => leerLibro({ 'GTOS 004': GTOS004, 'GTOS 014': GTOS014, 'GTOS 016': GTOS016, 'GTOS 017': GTOS017 }, '2026-07'), /hasta agosto/);
  assert.throws(() => leerCapitulos(GTOS004.slice(0, 3)), /columnas|faltan/);
  assert.equal(nombreSeccion('TRANSPORTES Y MOVILIDAD SOSTENIBLE'), 'Transportes y Movilidad Sostenible');
  assert.equal(nombreSeccion('RELACIONES FINANCIERAS CON LA U. E.'), 'Aportación a la Unión Europea');
});

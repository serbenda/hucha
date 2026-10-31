import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplanar } from '../assets/js/jsonstat.js';
import {
  prepararDatos, problema, partidas, ultimoAño, esProvisional, gastoPorPersona, reparto,
  gastoPorAdministracion, seriePartida, urlGasto, urlPoblacion, valor, PARTIDAS,
} from '../assets/js/cofog.js';
import { crearJsonStat, respuestasEjemplo } from './ayuda.js';

test('JSON-stat: aplana valores dispersos con su estado', () => {
  const json = crearJsonStat(['geo', 'time'], [
    { geo: 'ES', time: '2023', valor: 1 },
    { geo: 'ES', time: '2024', valor: 2, estado: 'p' },
    { geo: 'FR', time: '2024', valor: 3 },
  ]);
  const obs = aplanar(json);
  assert.equal(obs.length, 3);
  assert.deepEqual(obs.find((o) => o.geo === 'ES' && o.time === '2024'), { geo: 'ES', time: '2024', valor: 2, estado: 'p' });
  assert.equal(obs.find((o) => o.geo === 'FR').valor, 3);
});

test('JSON-stat: aplana valores densos y salta los vacíos', () => {
  const json = {
    id: ['a', 'b'], size: [2, 2],
    dimension: { a: { category: { index: ['x', 'y'] } }, b: { category: { index: { p: 0, q: 1 } } } },
    value: [1, null, 3, 4],
  };
  assert.deepEqual(aplanar(json).map((o) => `${o.a}${o.b}=${o.valor}`), ['xp=1', 'yp=3', 'yq=4']);
});

test('JSON-stat: falla si no tiene la forma esperada', () => {
  assert.throws(() => aplanar({ error: 'nada' }), /id\/size/);
});

test('URLs de Eurostat piden lo necesario', () => {
  const u = new URL(urlGasto());
  assert.equal(u.pathname.split('/').at(-1), 'gov_10a_exp');
  assert.deepEqual(u.searchParams.getAll('geo'), ['ES', 'EU27_2020']);
  assert.deepEqual(u.searchParams.getAll('sector'), ['S13', 'S1311', 'S1312', 'S1313', 'S1314']);
  assert.equal(u.searchParams.get('na_item'), 'TE');
  assert.equal(new URL(urlPoblacion()).searchParams.get('indic_de'), 'AVG');
});

const { gasto, poblacion } = respuestasEjemplo();
const datos = prepararDatos(gasto, poblacion);

test('prepara los datos: años, provisionales, población y fuentes', () => {
  assert.equal(datos.años[0], '2014');
  assert.equal(datos.años.at(-1), '2024');
  assert.deepEqual(datos.provisionales, ['2024']);
  assert.equal(ultimoAño(datos), '2024');
  assert.ok(esProvisional(datos, '2024'));
  assert.ok(!esProvisional(datos, '2023'));
  assert.ok(datos.poblacion['2024'] > 40e6);
  assert.equal(datos.fuente.gasto.dataset, 'gov_10a_exp');
  // De la UE solo se guarda el total de las AAPP en % del PIB
  assert.deepEqual(Object.keys(datos.ue), ['S13']);
  assert.deepEqual(Object.keys(datos.ue.S13), ['PC_GDP']);
  assert.equal(problema(datos), null);
});

test('las partidas cubren el 100 % del gasto, sin solaparse', () => {
  const lista = partidas(datos, '2024');
  assert.equal(lista.length, PARTIDAS.length);
  const suma = lista.reduce((t, p) => t + p.cuota, 0);
  assert.ok(Math.abs(suma - 1) < 1e-9, `suman ${suma}`);
  assert.equal(lista[0].id, 'pensiones');
  // ordenadas de mayor a menor
  for (let i = 1; i < lista.length; i++) assert.ok(lista[i - 1].valor >= lista[i].valor);
  // «otras sociales» = protección social menos pensiones y paro
  const otras = lista.find((p) => p.id === 'otras-sociales').valor;
  const esperado = valor(datos, 'GF10', '2024') - valor(datos, 'GF1002', '2024') - valor(datos, 'GF1003', '2024') - valor(datos, 'GF1005', '2024');
  assert.ok(Math.abs(otras - esperado) < 1e-6);
});

test('si falta el detalle de un grupo, va a «Sin detalle» y las cuotas siguen sumando 1', () => {
  const r = respuestasEjemplo({ quitar: ['GF0405'] });
  const d = prepararDatos(r.gasto, r.poblacion);
  const lista = partidas(d, '2024');
  assert.ok(!lista.some((p) => p.id === 'transporte'));
  assert.ok(!lista.some((p) => p.id === 'economia'));
  const sin = lista.find((p) => p.id === 'sin-detalle');
  assert.ok(sin && sin.valor > 0);
  assert.ok(Math.abs(lista.reduce((t, p) => t + p.cuota, 0) - 1) < 1e-9);
  // Un hueco de más del 5 % del gasto se considera un problema
  assert.match(problema(d), /falta detalle/);
});

test('detecta datos insuficientes', () => {
  assert.match(problema({ años: [] }), /No hay años/);
  const r = respuestasEjemplo({ desde: 2022, hasta: 2024 });
  assert.match(problema(prepararDatos(r.gasto, r.poblacion)), /Solo hay 3 años/);
});

test('gasto por persona', () => {
  const p = gastoPorPersona(datos, '2024');
  const esperado = (valor(datos, 'TOTAL', '2024') * 1e6) / datos.poblacion['2024'];
  assert.equal(p, esperado);
  assert.ok(p > 10000 && p < 30000);
  assert.equal(gastoPorPersona(datos, '1990'), null);
});

test('serie de una partida en % del PIB, con la UE', () => {
  const s = seriePartida(datos, 'sanidad');
  assert.equal(s.length, 11);
  assert.ok(s.every((x) => x.es > 0 && x.ue > 0));
  assert.deepEqual(seriePartida(datos, 'no-existe'), []);
});

test('quién gasta: cuotas por función y sin transferencias generales', () => {
  const r = reparto(datos, '2024');
  const sanidad = r.find((f) => f.id === 'GF07');
  assert.equal(sanidad.partes.find((p) => p.id === 'S1312').cuota.toFixed(2), '0.92');
  for (const f of r) assert.ok(Math.abs(f.partes.reduce((t, p) => t + p.cuota, 0) - 1) < 1e-9);
  // En «Administración general» no cuentan las transferencias del Estado a las comunidades (GF0108)
  const general = r.find((f) => f.id === 'GF01');
  assert.equal(general.partes.find((p) => p.id === 'S1311').cuota.toFixed(2), '0.60');
  // Defensa: solo el Estado
  assert.equal(r.find((f) => f.id === 'GF02').partes.find((p) => p.id === 'S1311').cuota, 1);

  const admin = gastoPorAdministracion(datos, '2024');
  assert.equal(admin.length, 4);
  const estado = admin.find((a) => a.id === 'S1311').valor;
  assert.ok(estado < valor(datos, 'TOTAL', '2024', { sector: 'S1311' }));
});

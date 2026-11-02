// Regresión del issue #18: importes que no cuadran en la fuente y acuerdos marco contados una vez por empresa.
// Los cuatro casos imitan expedientes reales (con las cifras del aviso), en el formato CODICE de la Plataforma.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parsearAtom, esContratoUtil, compactarContrato, revisarContrato, importeDudoso, totales, buscar, UMBRAL_CONTRATOS,
} from '../assets/js/lupa-datos.js';

/** Una entrada con su presupuesto y una lista de resultados: [{ lote, nif, nombre, sin, con }]. */
const entrada = ({ id, titulo, licitado, estimado = null, sistema = null, resultados }) => `<entry>
  <id>https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/${id}</id>
  <link href="https://contrataciondelestado.es/x?idEvl=${id}"/>
  <title>${titulo}</title>
  <updated>2026-10-30T20:10:29.664+01:00</updated>
  <cac-place-ext:ContractFolderStatus>
    <cbc-place-ext:ContractFolderStatusCode>RES</cbc-place-ext:ContractFolderStatusCode>
    <cac-place-ext:LocatedContractingParty><cac:Party><cac:PartyName><cbc:Name>Órgano</cbc:Name></cac:PartyName></cac:Party></cac-place-ext:LocatedContractingParty>
    <cac:ProcurementProject>
      <cbc:Name>${titulo}</cbc:Name><cbc:TypeCode>2</cbc:TypeCode>
      <cac:BudgetAmount>${estimado ? `<cbc:EstimatedOverallContractAmount currencyID="EUR">${estimado}</cbc:EstimatedOverallContractAmount>` : ''}<cbc:TaxExclusiveAmount currencyID="EUR">${licitado}</cbc:TaxExclusiveAmount></cac:BudgetAmount>
    </cac:ProcurementProject>
    ${sistema ? `<cac:TenderingProcess><cbc:ContractingSystemCode>${sistema}</cbc:ContractingSystemCode></cac:TenderingProcess>` : ''}
    ${resultados
      .map(
        (r) => `<cac:TenderResult><cbc:ResultCode>9</cbc:ResultCode><cbc:AwardDate>2026-10-01</cbc:AwardDate>
      <cac:WinningParty><cac:PartyIdentification><cbc:ID>${r.nif}</cbc:ID></cac:PartyIdentification><cac:PartyName><cbc:Name>${r.nombre}</cbc:Name></cac:PartyName></cac:WinningParty>
      <cac:AwardedTenderedProject>${r.lote ? `<cbc:ProcurementProjectLotID>${r.lote}</cbc:ProcurementProjectLotID>` : ''}<cac:LegalMonetaryTotal><cbc:TaxExclusiveAmount currencyID="EUR">${r.sin}</cbc:TaxExclusiveAmount>${r.con ? `<cbc:PayableAmount currencyID="EUR">${r.con}</cbc:PayableAmount>` : ''}</cac:LegalMonetaryTotal></cac:AwardedTenderedProject>
    </cac:TenderResult>`
      )
      .join('')}
  </cac-place-ext:ContractFolderStatus>
</entry>`;
const leer = (x) => parsearAtom(`<?xml version="1.0"?><feed>${x}</feed>`).entradas[0];
const empresas = (n, datos) => Array.from({ length: n }, (_, i) => ({ nif: `B0000000${i}`, nombre: `EMPRESA ${i} SA`, ...datos }));

test('caso A (rehabilitación en Donostia): sin IVA mayor que con IVA → dudoso, fuera de los totales, pero se queda', () => {
  const c = leer(entrada({ id: 'A', titulo: 'Rehabilitación Kanpandegi 2', licitado: 2521000, resultados: [{ nif: 'A1', nombre: 'CONSTRUCTORA SA', sin: 2357531666, con: 2593284.83 }] }));
  assert.equal(importeDudoso(c), 'iva');
  assert.ok(esContratoUtil(c), 'lo licitado pasa del millón: se queda en la Lupa');
  const k = compactarContrato(c);
  assert.equal(k.x, 'iva');
  assert.equal(k.a, 2357531666, 'se enseña lo que publica la fuente, sin corregirlo a ojo');
  const t = totales([k, { a: 5e6, li: 5e6 }], 'a');
  assert.equal(t.suma, 5e6, 'no suma');
  assert.deepEqual(t.dudosos, { n: 1 });
});

test('caso B (transporte de una exposición en Artium): 19.540 € publicados como 1.954 millones → no entra en la Lupa', () => {
  const c = leer(entrada({ id: 'B', titulo: 'Transporte de exposición', licitado: 22000, resultados: [{ nif: 'B1', nombre: 'TRANSPORTES SL', sin: 1954023643.4, con: 23643.4 }] }));
  assert.equal(importeDudoso(c), 'iva');
  assert.ok(!esContratoUtil(c), 'el umbral se aplica a lo que cuadra: lo licitado, 22.000 €');
});

test('caso C (acuerdo marco de servicios informáticos): 20 adjudicatarios del mismo techo cuentan una vez', () => {
  const c = leer(entrada({ id: 'C', titulo: 'Acuerdo marco de servicios informáticos', sistema: 1, licitado: 900e6, estimado: 930e6, resultados: empresas(20, { sin: 900e6, con: 1089e6 }) }));
  assert.equal(c.marco, true);
  assert.equal(c.adjudicado, 900e6, 'no 18.000 millones');
  assert.equal(c.ganadores.length, 20);
  assert.equal(importeDudoso(c), null);
});

test('caso D (acuerdo marco audiovisual por lotes): cada lote una vez, aunque lo repita cada adjudicatario', () => {
  const lotes = [['1', 30e6], ['2', 30e6], ['3', 21.5e6]];
  const resultados = lotes.flatMap(([lote, sin]) => empresas(5, { lote, sin, con: sin * 1.21 }));
  const c = leer(entrada({ id: 'D', titulo: 'AM 12/2025 equipos audiovisuales', sistema: 1, licitado: 81.5e6, estimado: 81.5e6, resultados }));
  assert.equal(c.adjudicado, 81.5e6);
  assert.equal(c.conIva, 81.5e6 * 1.21);
});

test('un contrato normal con lotes distintos sí suma cada lote, y con dos empresas y distinto importe en un lote, las dos', () => {
  const c = leer(entrada({ id: 'E', titulo: 'Obras por lotes', licitado: 5e6, resultados: [{ lote: '1', nif: 'X1', nombre: 'A SA', sin: 2e6 }, { lote: '2', nif: 'X2', nombre: 'B SA', sin: 1.5e6 }, { lote: '2', nif: 'X3', nombre: 'C SA', sin: 0.5e6 }] }));
  assert.equal(c.adjudicado, 4e6);
});

test('más del doble de lo licitado → dudoso; una baja o una subida pequeña, no', () => {
  assert.equal(importeDudoso({ adjudicado: 2.1e6, licitado: 1e6 }), 'licitado');
  assert.equal(importeDudoso({ adjudicado: 1.9e6, licitado: 1e6 }), null);
  assert.equal(importeDudoso({ adjudicado: 0.8e6, licitado: 1e6 }), null);
  assert.equal(importeDudoso({ adjudicado: 2.1e6, licitado: 1e6, estimado: 3e6 }), null, 'el valor estimado (con prórrogas) también vale');
  assert.equal(importeDudoso({ adjudicado: 1e6, licitado: null }), null, 'sin referencia no se juzga');
});

test('lo guardado antes de la comprobación también se revisa: el marco inflado, dudoso; el de 19.540 €, fuera', () => {
  const inflado = revisarContrato({ id: 'C', a: 18000e6, li: 930e6, m: 1 });
  assert.equal(inflado.x, 'licitado');
  assert.equal(revisarContrato({ id: 'B', a: 1954023643.4, li: 22000 }), null);
  assert.equal(revisarContrato({ id: 'ok', a: 3e6, li: 3.2e6, x: 'iva' }).x, undefined, 'si ya cuadra, se le quita la marca');
  assert.ok(UMBRAL_CONTRATOS === 1e6);
});

test('acuerdo marco con varias empresas leído con la versión anterior y sin licitado: techo por revisar hasta releerlo', () => {
  const viejo = { id: 'C', a: 18000e6, li: 0, m: 1, g: Array.from({ length: 20 }, (_, i) => `E${i}`) };
  assert.equal(revisarContrato(viejo).x, 'marco');
  assert.equal(revisarContrato({ ...viejo, v: 2, a: 900e6 }).x, undefined, 'releído con la versión nueva, cuadra');
  assert.equal(revisarContrato({ ...viejo, g: ['UNA SA'] }).x, undefined, 'con una sola empresa no hay duplicado posible');
  assert.equal(totales([revisarContrato(viejo)], 'a').marcos.suma, 0);
});

test('ordenar: un importe dudoso no encabeza la lista; cuenta lo licitado', () => {
  const lista = buscar([{ t: 'a', a: 2357531666, li: 2.5e6, x: 'iva' }, { t: 'b', a: 50e6, li: 50e6 }], '', { campos: ['t'], importe: 'a' });
  assert.deepEqual(lista.map((x) => x.t), ['b', 'a']);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parsearAtom, esContratoUtil, compactarContrato, parsearConcesiones, parsearAyuda, buscar, suma, esPersona,
  normalizar, temas, finalidad, urlConcesiones,
} from '../assets/js/lupa-datos.js';
import { nombrePais, esPais } from '../assets/js/paises.js';

// Entrada con la misma forma que el feed real de la Plataforma de Contratación
const entrada = ({ id = '1', estado = 'RES', titulo = 'Mantenimiento de la catenaria', nif = 'A12345678', ganador = 'OBRAS SA', importe = 2500000, lote2 = null, cpv = '50220000', jerarquia = ['ADIF', 'Ministerio de Transportes', 'Sector Público Estatal', 'Sector Público'] } = {}) => `<entry>
  <id>https://contrataciondelestado.es/sindicacion/licitacionesPerfilContratante/${id}</id>
  <link href="https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&amp;idEvl=${id}"/>
  <summary type="text">Id licitación: x; Estado: ${estado}</summary>
  <title>${titulo}&#xD;
 tramo norte</title>
  <updated>2026-10-30T20:10:29.664+01:00</updated>
  <cac-place-ext:ContractFolderStatus>
    <cbc-place-ext:ContractFolderStatusCode languageID="es">${estado}</cbc-place-ext:ContractFolderStatusCode>
    <cac-place-ext:LocatedContractingParty>
      <cac:Party><cac:PartyIdentification><cbc:ID schemeName="NIF">Q2801660H</cbc:ID></cac:PartyIdentification>
        <cac:PartyName><cbc:Name>Consejo de Administración de ADIF</cbc:Name></cac:PartyName></cac:Party>
      ${jerarquia.map((j) => `<cac-place-ext:ParentLocatedParty><cac:PartyName><cbc:Name>${j}</cbc:Name></cac:PartyName>`).join('')}${jerarquia.map(() => '</cac-place-ext:ParentLocatedParty>').join('')}
    </cac-place-ext:LocatedContractingParty>
    <cac:ProcurementProject>
      <cbc:Name>${titulo}</cbc:Name>
      <cbc:TypeCode listURI="x">2</cbc:TypeCode>
      <cac:BudgetAmount><cbc:EstimatedOverallContractAmount currencyID="EUR">9</cbc:EstimatedOverallContractAmount><cbc:TotalAmount currencyID="EUR">3630000</cbc:TotalAmount><cbc:TaxExclusiveAmount currencyID="EUR">3000000</cbc:TaxExclusiveAmount></cac:BudgetAmount>
      <cac:RequiredCommodityClassification><cbc:ItemClassificationCode listURI="x">${cpv}</cbc:ItemClassificationCode></cac:RequiredCommodityClassification>
    </cac:ProcurementProject>
    <cac:TenderResult>
      <cbc:ResultCode listURI="x">9</cbc:ResultCode><cbc:AwardDate>2026-10-01</cbc:AwardDate>
      <cac:WinningParty><cac:PartyIdentification><cbc:ID schemeName="NIF">${nif}</cbc:ID></cac:PartyIdentification><cac:PartyName><cbc:Name>${ganador}</cbc:Name></cac:PartyName></cac:WinningParty>
      <cac:AwardedTenderedProject><cac:LegalMonetaryTotal><cbc:TaxExclusiveAmount currencyID="EUR">${importe}</cbc:TaxExclusiveAmount><cbc:PayableAmount currencyID="EUR">1</cbc:PayableAmount></cac:LegalMonetaryTotal></cac:AwardedTenderedProject>
    </cac:TenderResult>
    ${lote2 ? `<cac:TenderResult><cbc:ResultCode>8</cbc:ResultCode><cbc:AwardDate>2026-10-05</cbc:AwardDate><cac:WinningParty><cac:PartyIdentification><cbc:ID schemeName="NIF">${lote2.nif}</cbc:ID></cac:PartyIdentification><cac:PartyName><cbc:Name>${lote2.nombre}</cbc:Name></cac:PartyName></cac:WinningParty><cac:AwardedTenderedProject><cac:LegalMonetaryTotal><cbc:TaxExclusiveAmount currencyID="EUR">${lote2.importe}</cbc:TaxExclusiveAmount></cac:LegalMonetaryTotal></cac:AwardedTenderedProject></cac:TenderResult>` : ''}
    <cac:TenderResult><cbc:ResultCode>4</cbc:ResultCode><cac:AwardedTenderedProject><cac:LegalMonetaryTotal><cbc:TaxExclusiveAmount currencyID="EUR">999999</cbc:TaxExclusiveAmount></cac:LegalMonetaryTotal></cac:AwardedTenderedProject></cac:TenderResult>
  </cac-place-ext:ContractFolderStatus>
</entry>`;

const feed = (entradas) => `<?xml version="1.0"?><feed><updated>2026-10-30T20:22:05.400+01:00</updated>
<link href="https://contrataciondelestado.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3_20261030_202205.atom" rel="next"/>
${entradas.join('\n')}</feed>`;

test('contratos: lee la entrada con lotes, importe adjudicado, nivel y temas', () => {
  const p = parsearAtom(feed([entrada({ lote2: { nif: 'B87654321', nombre: 'VIAS SL', importe: 500000 } })]));
  assert.match(p.siguiente, /_20261030_202205\.atom$/);
  assert.equal(p.actualizado, '2026-10-30T20:22:05.400+01:00');
  const c = p.entradas[0];
  assert.equal(c.id, '1');
  assert.equal(c.titulo, 'Mantenimiento de la catenaria tramo norte');
  assert.equal(c.organo, 'Consejo de Administración de ADIF');
  assert.equal(c.nivel, 'Estado');
  assert.equal(c.tipo, 'Servicios');
  assert.equal(c.finalidad, 'Mantenimiento y reparación');
  assert.deepEqual(c.temas, ['tren']);
  assert.equal(c.licitado, 3000000);
  // Lotes adjudicados (código 8 y 9) se suman; el desierto (4) no
  assert.equal(c.adjudicado, 3000000);
  assert.equal(c.fecha, '2026-10-05');
  assert.deepEqual(c.ganadores, ['OBRAS SA', 'VIAS SL']);
  assert.match(c.enlace, /idEvl=1$/);
  assert.ok(esContratoUtil(c));
  assert.equal(compactarContrato(c).a, 3000000);
});

test('contratos: las personas físicas no aparecen con su nombre', () => {
  const c = parsearAtom(feed([entrada({ nif: '12345678Z', ganador: 'JUAN PÉREZ' })])).entradas[0];
  assert.deepEqual(c.ganadores, ['Persona física']);
  assert.ok(esPersona('X1234567L') && esPersona('12345678Z') && !esPersona('B12345678') && !esPersona('Q2801660H'));
});

test('contratos: solo adjudicados o resueltos desde el umbral', () => {
  const [pub, peq] = parsearAtom(feed([entrada({ id: '2', estado: 'PUB' }), entrada({ id: '3', importe: 900000 })])).entradas;
  assert.ok(!esContratoUtil(pub));
  assert.ok(!esContratoUtil(peq));
});

test('contratos: nivel de la administración por la jerarquía', () => {
  const local = parsearAtom(feed([entrada({ jerarquia: ['San Bartolomé de Tirajana', 'Ayuntamientos', 'Las Palmas', 'Canarias', 'ENTIDADES LOCALES', 'Sector Público'] })])).entradas[0];
  assert.equal(local.nivel, 'Ayuntamientos');
  assert.equal(local.lugar, 'Canarias');
});

test('temas y finalidad', () => {
  assert.deepEqual(temas('Suministro de medicamentos para el Hospital', ['33600000']), ['sanidad']);
  assert.ok(temas('Obras de la autovía A-4', ['45233000']).includes('carreteras'));
  assert.ok(temas('Construcción del colegio público', ['45214000']).includes('educacion'));
  assert.equal(finalidad('45234100'), 'Obra');
  assert.equal(finalidad('34620000'), 'Compra de bienes');
  assert.equal(normalizar('FERROCARRÍL Ñandú'), 'ferrocarril nandu');
});

test('subvenciones: sin personas físicas, con convocatoria y nivel', () => {
  const json = {
    content: [
      { codConcesion: 'SB1', fechaConcesion: '2026-10-13', beneficiario: 'P2306900H AYUNTAMIENTO DE PORCUNA', importe: 27984347.7, convocatoria: ' Plan de obras ', nivel1: 'ESTADO', nivel2: 'MINISTERIO', nivel3: 'DIRECCIÓN GENERAL', numeroConvocatoria: '900' },
      { codConcesion: 'SB2', fechaConcesion: '2026-10-13', beneficiario: '12345678Z NOMBRE APELLIDO', importe: 2000000, convocatoria: 'Ayuda', nivel1: 'AUTONOMICA', nivel2: 'ANDALUCÍA', nivel3: 'CONSEJERÍA' },
    ],
  };
  const lista = parsearConcesiones(json);
  assert.equal(lista.length, 1);
  assert.deepEqual(
    { b: lista[0].b, i: lista[0].i, c: lista[0].c, n: lista[0].n, u: lista[0].u },
    { b: 'AYUNTAMIENTO DE PORCUNA', i: 27984347.7, c: 'Plan de obras', n: 'Estado', u: 'https://www.infosubvenciones.es/bdnstrans/GE/es/convocatorias/900' }
  );
  const u = new URL(urlConcesiones('2026-10-01', '2026-10-31'));
  assert.equal(u.searchParams.get('fechaDesde'), '01/10/2026');
  assert.equal(u.searchParams.get('sort'), 'importe,desc');
});

test('ayuda: SDMX genérico a millones de dólares por país', () => {
  const xml = `<message:DataSet><generic:Series><generic:SeriesKey><generic:Value id="DONOR" value="ESP" /><generic:Value id="RECIPIENT" value="MAR" /></generic:SeriesKey>
    <generic:Attributes><generic:Value id="UNIT_MULT" value="6" /></generic:Attributes>
    <generic:Obs><generic:ObsDimension id="TIME_PERIOD" value="2023" /><generic:ObsValue value="123.45" /></generic:Obs>
    <generic:Obs><generic:ObsDimension id="TIME_PERIOD" value="2024" /><generic:ObsValue value="150" /></generic:Obs></generic:Series></message:DataSet>`;
  assert.deepEqual(parsearAyuda(xml), [{ pais: 'MAR', año: '2023', valor: 123.45 }, { pais: 'MAR', año: '2024', valor: 150 }]);
  assert.equal(nombrePais('MAR'), 'Marruecos');
  assert.ok(esPais('UKR') && !esPais('DPGC'));
});

test('buscar: todas las palabras, sin tildes, ordenado por importe y por tema', () => {
  const lista = [
    { t: 'Obras de vía en Madrid', g: ['ACCIONA'], a: 5, te: ['tren'] },
    { t: 'Hospital de Madrid', g: ['SACYR'], a: 9, te: ['sanidad'] },
    { t: 'Vía verde', g: ['X'], a: 1, te: [] },
  ];
  const opciones = { campos: ['t', 'g'], importe: 'a' };
  assert.deepEqual(buscar(lista, 'madrid', opciones).map((x) => x.a), [9, 5]);
  assert.deepEqual(buscar(lista, 'VIA madrid', opciones).map((x) => x.a), [5]);
  assert.deepEqual(buscar(lista, 'acciona', opciones).map((x) => x.a), [5]);
  assert.deepEqual(buscar(lista, '', { ...opciones, tema: 'sanidad' }).map((x) => x.a), [9]);
  assert.equal(suma(lista, 'a'), 15);
});

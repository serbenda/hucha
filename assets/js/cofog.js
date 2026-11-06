// Gasto público por funciones (clasificación COFOG) a partir de los datos de Eurostat.
// Este módulo lo usan tanto el navegador como el script de la GitHub Action,
// así que la lógica que prueban los tests es la misma que corre en la web.

import { aplanar } from './jsonstat.js';

export const PRIMER_AÑO = 2010;

/** Subsectores de las Administraciones Públicas, con nombre de calle. */
export const SUBSECTORES = [
  { id: 'S1311', nombre: 'Estado', largo: 'Administración central: ministerios y sus organismos' },
  { id: 'S1312', nombre: 'Comunidades', largo: 'Comunidades autónomas' },
  { id: 'S1313', nombre: 'Ayuntamientos', largo: 'Ayuntamientos, diputaciones, cabildos y consejos insulares' },
  { id: 'S1314', nombre: 'Seguridad Social', largo: 'Fondos de la Seguridad Social: pensiones contributivas, paro, bajas' },
];

const SECTORES = ['S13', ...SUBSECTORES.map((s) => s.id)];

/** Grandes funciones (divisiones COFOG), para el reparto por administración. */
export const FUNCIONES = [
  { id: 'GF10', nombre: 'Pensiones y protección social' },
  { id: 'GF07', nombre: 'Sanidad' },
  { id: 'GF01', nombre: 'Administración general e intereses', menos: ['GF0108'] },
  { id: 'GF04', nombre: 'Economía, empleo y transporte' },
  { id: 'GF09', nombre: 'Educación' },
  { id: 'GF03', nombre: 'Policía, justicia y prisiones' },
  { id: 'GF08', nombre: 'Cultura, deporte y religión' },
  { id: 'GF05', nombre: 'Medio ambiente' },
  { id: 'GF02', nombre: 'Defensa' },
  { id: 'GF06', nombre: 'Vivienda, urbanismo y agua' },
];

/**
 * Partidas del ticket: las funciones COFOG agrupadas en conceptos que se entienden sin ser economista.
 * Cada partida suma `codigos` y resta `menos`. Entre todas cubren el gasto total sin solaparse.
 */
export const PARTIDAS = [
  {
    id: 'pensiones',
    nombre: 'Pensiones de jubilación y viudedad',
    codigos: ['GF1002', 'GF1003'],
    que: 'Pensiones de jubilación, viudedad y orfandad, también las de funcionarios (clases pasivas).',
  },
  {
    id: 'sanidad',
    nombre: 'Sanidad',
    codigos: ['GF07'],
    que: 'Hospitales, centros de salud, médicos y enfermería, medicamentos y salud pública.',
  },
  {
    id: 'educacion',
    nombre: 'Educación',
    codigos: ['GF09'],
    que: 'Colegios, institutos, universidades, formación profesional, becas y comedores.',
  },
  {
    id: 'otras-sociales',
    nombre: 'Bajas, incapacidad, familia y otras ayudas',
    codigos: ['GF10'],
    menos: ['GF1002', 'GF1003', 'GF1005'],
    que: 'Bajas por enfermedad, incapacidad, dependencia, prestaciones por hijos, ingreso mínimo vital y ayudas contra la exclusión.',
  },
  {
    id: 'administracion',
    nombre: 'Funcionamiento de las administraciones',
    codigos: ['GF01'],
    menos: ['GF0107'],
    que: 'Gobiernos, parlamentos, Hacienda, gestión de personal, estadística, elecciones, ayuda al desarrollo e investigación básica.',
  },
  {
    id: 'economia',
    nombre: 'Empleo, empresas, campo y energía',
    codigos: ['GF04'],
    menos: ['GF0405'],
    que: 'Políticas de empleo, ayudas a empresas, agricultura y pesca, energía, minería, telecomunicaciones y turismo.',
  },
  {
    id: 'intereses',
    nombre: 'Intereses de la deuda',
    codigos: ['GF0107'],
    que: 'Lo que se paga cada año por el dinero que deben las administraciones. No incluye devolver la deuda, solo sus intereses.',
  },
  {
    id: 'transporte',
    nombre: 'Carreteras, trenes y transporte',
    codigos: ['GF0405'],
    que: 'Carreteras, ferrocarril, metro y autobús, puertos y aeropuertos, y las ayudas al transporte público.',
  },
  {
    id: 'paro',
    nombre: 'Paro',
    codigos: ['GF1005'],
    que: 'Prestaciones y subsidios por desempleo.',
  },
  {
    id: 'seguridad',
    nombre: 'Policía, justicia y prisiones',
    codigos: ['GF03'],
    que: 'Policía y Guardia Civil, bomberos, juzgados y tribunales, y prisiones.',
  },
  {
    id: 'cultura',
    nombre: 'Cultura, deporte y religión',
    codigos: ['GF08'],
    que: 'Bibliotecas, museos, instalaciones deportivas, radio y televisión públicas, y actividades religiosas y sociales.',
  },
  {
    id: 'medio-ambiente',
    nombre: 'Medio ambiente y basuras',
    codigos: ['GF05'],
    que: 'Recogida y tratamiento de residuos, aguas residuales, contaminación y protección de la naturaleza.',
  },
  {
    id: 'defensa',
    nombre: 'Defensa',
    codigos: ['GF02'],
    que: 'Fuerzas Armadas, material militar, misiones en el extranjero y protección civil.',
  },
  {
    id: 'vivienda',
    nombre: 'Vivienda, urbanismo y agua',
    codigos: ['GF06'],
    que: 'Vivienda pública y ayudas a la vivienda, urbanismo, abastecimiento de agua y alumbrado público.',
  },
];

/** Grupos COFOG (segundo nivel) con nombre de calle: «en qué se va» dentro de cada partida. */
export const GRUPOS = {
  GF0101: 'Gobierno, parlamentos, Hacienda y asuntos exteriores',
  GF0102: 'Ayuda al desarrollo de otros países',
  GF0103: 'Servicios generales: personal, estadística, compras centrales',
  GF0104: 'Investigación básica',
  GF0105: 'Investigación sobre la administración',
  GF0106: 'Otros servicios generales',
  GF0107: 'Intereses de la deuda',
  GF0108: 'Transferencias entre administraciones',
  GF0201: 'Fuerzas Armadas',
  GF0202: 'Protección civil',
  GF0203: 'Ayuda militar a otros países',
  GF0204: 'Investigación militar',
  GF0205: 'Otros gastos de defensa',
  GF0301: 'Policía y Guardia Civil',
  GF0302: 'Bomberos',
  GF0303: 'Juzgados y tribunales',
  GF0304: 'Prisiones',
  GF0305: 'Investigación sobre seguridad',
  GF0306: 'Otros gastos de seguridad',
  GF0401: 'Empleo, comercio y asuntos económicos generales',
  GF0402: 'Agricultura, montes y pesca',
  GF0403: 'Energía',
  GF0404: 'Industria, minería y construcción',
  GF0405: 'Transporte: carreteras, tren, puertos y aeropuertos',
  GF0406: 'Telecomunicaciones',
  GF0407: 'Turismo y otros sectores',
  GF0408: 'Investigación económica',
  GF0409: 'Otros asuntos económicos',
  GF0501: 'Recogida y tratamiento de basuras',
  GF0502: 'Aguas residuales',
  GF0503: 'Contaminación',
  GF0504: 'Naturaleza y paisaje',
  GF0505: 'Investigación ambiental',
  GF0506: 'Otros gastos de medio ambiente',
  GF0601: 'Vivienda',
  GF0602: 'Urbanismo y desarrollo de barrios',
  GF0603: 'Agua potable',
  GF0604: 'Alumbrado público',
  GF0605: 'Investigación sobre vivienda',
  GF0606: 'Otros gastos de vivienda y urbanismo',
  GF0701: 'Medicamentos y material sanitario',
  GF0702: 'Centros de salud y consultas',
  GF0703: 'Hospitales',
  GF0704: 'Salud pública y vacunas',
  GF0705: 'Investigación sanitaria',
  GF0706: 'Gestión y otros gastos de sanidad',
  GF0801: 'Deporte y ocio',
  GF0802: 'Cultura: museos, bibliotecas, patrimonio',
  GF0803: 'Radio, televisión y publicaciones',
  GF0804: 'Religión y asociaciones',
  GF0805: 'Investigación cultural',
  GF0806: 'Otros gastos de cultura y deporte',
  GF0901: 'Infantil y primaria',
  GF0902: 'Secundaria: ESO, Bachillerato y FP',
  GF0903: 'Postsecundaria no universitaria',
  GF0904: 'Universidad',
  GF0905: 'Educación sin nivel concreto (adultos, idiomas…)',
  GF0906: 'Comedores, transporte escolar y otros servicios',
  GF0907: 'Investigación educativa',
  GF0908: 'Gestión y otros gastos de educación',
  GF1001: 'Bajas por enfermedad e incapacidad',
  GF1002: 'Pensiones de jubilación',
  GF1003: 'Pensiones de viudedad y orfandad',
  GF1004: 'Familia e hijos',
  GF1005: 'Paro',
  GF1006: 'Ayudas a la vivienda',
  GF1007: 'Exclusión social: ingreso mínimo y otras ayudas',
  GF1008: 'Investigación sobre protección social',
  GF1009: 'Dependencia y otros gastos sociales',
};

/**
 * Tipos de gasto (operaciones de contabilidad nacional): «cómo se gasta» cada euro.
 * Lo que no encaja en ninguno (algunos impuestos, compra de terrenos…) va a «Otros».
 */
export const TIPOS = [
  { id: 'D1', nombre: 'Sueldos del personal público', que: 'Sueldos y cotizaciones de funcionarios y empleados públicos: médicos, docentes, policías…' },
  { id: 'D62', nombre: 'Pagos directos a personas', que: 'Pensiones, paro, bajas, ayudas por hijos o ingreso mínimo: dinero que llega a los hogares.' },
  { id: 'P2', nombre: 'Compras de bienes y servicios', que: 'Material, suministros, mantenimiento, alquileres y servicios contratados a empresas.' },
  { id: 'D632', nombre: 'Servicios pagados a empresas para los ciudadanos', que: 'Lo que la administración paga a otros para que te atiendan: medicamentos con receta, conciertos sanitarios y educativos.' },
  { id: 'P5', nombre: 'Inversión: obras y equipos', que: 'Carreteras, vías, edificios, ordenadores, material militar…' },
  { id: 'D3', nombre: 'Subvenciones a empresas', que: 'Ayudas a empresas para que bajen precios o mantengan actividad: transporte, energía, agricultura…' },
  { id: 'D4', nombre: 'Intereses y rentas', que: 'Sobre todo, los intereses de la deuda.' },
  { id: 'D7', nombre: 'Transferencias a otros', que: 'Dinero a asociaciones, a la Unión Europea, a otros países y entre administraciones.' },
  { id: 'D9', nombre: 'Ayudas para inversiones', que: 'Dinero para que otros inviertan: obras de empresas públicas, fondos europeos…' },
];

// ---------------------------------------------------------------------------
// Descarga (lo usa la Action)

const API = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';

/** Gasto de las AAPP por función, de España y de la media de la UE, por sector y unidad. */
export function urlGasto() {
  const p = new URLSearchParams({ lang: 'EN', na_item: 'TE', sinceTimePeriod: String(PRIMER_AÑO) });
  for (const g of ['ES', 'EU27_2020']) p.append('geo', g);
  for (const u of ['MIO_EUR', 'PC_GDP']) p.append('unit', u);
  for (const s of SECTORES) p.append('sector', s);
  return `${API}/gov_10a_exp?${p}`;
}

/** Desglose por tipo de gasto (sueldos, compras, inversión…) de España, todas las administraciones. */
export const AÑO_TIPOS = 2015;
export function urlTipos() {
  const p = new URLSearchParams({ lang: 'EN', geo: 'ES', sector: 'S13', unit: 'MIO_EUR', sinceTimePeriod: String(AÑO_TIPOS) });
  for (const t of TIPOS) p.append('na_item', t.id);
  return `${API}/gov_10a_exp?${p}`;
}

/**
 * Deuda y déficit de todas las administraciones (procedimiento de déficit excesivo), de España y de la UE:
 * GD es la deuda bruta consolidada (lo que se debe al final de cada año) y B9 la capacidad (+) o necesidad (−)
 * de financiación, es decir, el superávit o el déficit del año.
 */
export function urlDeuda() {
  const p = new URLSearchParams({ lang: 'EN', sector: 'S13', sinceTimePeriod: String(PRIMER_AÑO) });
  for (const g of ['ES', 'EU27_2020']) p.append('geo', g);
  for (const n of ['GD', 'B9']) p.append('na_item', n);
  for (const u of ['MIO_EUR', 'PC_GDP']) p.append('unit', u);
  return `${API}/gov_10dd_edpt1?${p}`;
}

/** Deuda y déficit en el formato del almacén: { es: { GD: { MIO_EUR: { año }, PC_GDP }, B9 }, ue: { GD: { PC_GDP }, B9 }, actualizado }. */
export function prepararDeuda(json) {
  const d = { es: {}, ue: {}, actualizado: json?.updated ?? null };
  for (const o of aplanar(json)) {
    const destino = o.geo === 'ES' ? 'es' : o.geo === 'EU27_2020' ? 'ue' : null;
    if (!destino || (o.sector && o.sector !== 'S13') || !['GD', 'B9'].includes(o.na_item) || !['MIO_EUR', 'PC_GDP'].includes(o.unit)) continue;
    if (destino === 'ue' && o.unit !== 'PC_GDP') continue;
    if (o.valor === null || o.valor === undefined) continue;
    ((d[destino][o.na_item] ??= {})[o.unit] ??= {})[o.time] = o.valor;
  }
  return d;
}

/**
 * Resumen de la deuda para la web, del último año con deuda y población:
 * { año, total (M€), pib (%), pibUe, porPersona (€), deficit (M€, positivo si hay déficit), deficitPib, deficitPibUe, serie: [{ año, es, ue }] }
 * Devuelve null si no hay datos de deuda.
 */
export function resumenDeuda(datos) {
  const d = datos?.deuda;
  const total = d?.es?.GD?.MIO_EUR ?? {};
  const año = Object.keys(total).sort().reverse().find((a) => total[a] > 0 && datos.poblacion?.[a] > 0);
  if (!año) return null;
  const v = (zona, item, unidad, a = año) => d[zona]?.[item]?.[unidad]?.[a] ?? null;
  const menos = (x) => (x === null ? null : -x);
  const años = Object.keys(d.es?.GD?.PC_GDP ?? {}).filter((a) => a >= String(PRIMER_AÑO) && a <= año).sort();
  return {
    año,
    actualizado: d.actualizado ?? null,
    total: total[año],
    pib: v('es', 'GD', 'PC_GDP'),
    pibUe: v('ue', 'GD', 'PC_GDP'),
    porPersona: (total[año] * 1e6) / datos.poblacion[año],
    deficit: menos(v('es', 'B9', 'MIO_EUR')),
    deficitPib: menos(v('es', 'B9', 'PC_GDP')),
    deficitPibUe: menos(v('ue', 'B9', 'PC_GDP')),
    serie: años.map((a) => ({ año: a, es: v('es', 'GD', 'PC_GDP', a), ue: v('ue', 'GD', 'PC_GDP', a), deficit: menos(v('es', 'B9', 'PC_GDP', a)) })),
    // El déficit de cada año en millones: la deuda suele ir un año por delante del gasto por funciones,
    // y así la portada puede usar el del mismo año que el gasto
    deficits: Object.fromEntries(Object.entries(d.es?.B9?.MIO_EUR ?? {}).filter(([a]) => a >= String(PRIMER_AÑO)).map(([a, x]) => [a, -x])),
  };
}

// ---------------------------------------------------------------------------
// Ingresos: de dónde sale el dinero
//
// gov_10a_main da los grandes bloques de ingresos de todas las administraciones (S13): impuestos sobre la
// producción y el consumo (D2), sobre la renta y el patrimonio (D5), sobre el capital (D91), cotizaciones
// sociales (D61) y el total (TR). gov_10a_taxag separa dentro de ellos el IVA (D211), el IRPF (D51A_C1) y el
// impuesto de sociedades (D51B_C2). Se piden sin filtrar el concepto, para que un código que falte no rompa la
// descarga, y se guardan solo los que se usan.

export const CONCEPTOS_MAIN = ['TR', 'TE', 'D2REC', 'D5REC', 'D91REC', 'D61REC'];
export const CONCEPTOS_IMPUESTOS = ['D211', 'D51A_C1', 'D51B_C2'];

const urlIngresosDe = (tabla) => {
  const p = new URLSearchParams({ lang: 'EN', sector: 'S13', sinceTimePeriod: String(PRIMER_AÑO) });
  for (const g of ['ES', 'EU27_2020']) p.append('geo', g);
  for (const u of ['MIO_EUR', 'PC_GDP']) p.append('unit', u);
  return `${API}/${tabla}?${p}`;
};
export const urlIngresos = () => urlIngresosDe('gov_10a_main');
export const urlImpuestos = () => urlIngresosDe('gov_10a_taxag');

/** { es: { concepto: { MIO_EUR: { año }, PC_GDP } }, ue: { concepto: { PC_GDP } }, actualizado, codigos } */
export function prepararIngresos(main, taxag) {
  const d = { es: {}, ue: {}, actualizado: main?.updated ?? null, codigos: [] };
  const vistos = new Set();
  const meter = (json, conceptos) => {
    for (const o of aplanar(json)) {
      vistos.add(o.na_item);
      if (!conceptos.includes(o.na_item) || (o.sector && o.sector !== 'S13')) continue;
      const zona = o.geo === 'ES' ? 'es' : o.geo === 'EU27_2020' ? 'ue' : null;
      if (!zona || o.valor === null || o.valor === undefined || !['MIO_EUR', 'PC_GDP'].includes(o.unit)) continue;
      if (zona === 'ue' && o.unit !== 'PC_GDP') continue;
      ((d[zona][o.na_item] ??= {})[o.unit] ??= {})[o.time] = o.valor;
    }
  };
  if (main) meter(main, CONCEPTOS_MAIN);
  if (taxag) meter(taxag, CONCEPTOS_IMPUESTOS);
  d.codigos = [...vistos].sort();
  return d;
}

/** Bloques de ingresos, de mayor a menor peso en España. */
export const BLOQUES_INGRESOS = [
  { id: 'cotizaciones', nombre: 'Cotizaciones sociales', que: 'Lo que pagan trabajadores y empresas a la Seguridad Social por cada nómina, y los autónomos por su cuota.' },
  { id: 'irpf', nombre: 'IRPF', que: 'El impuesto sobre la renta de las personas: lo que se retiene de la nómina, de las pensiones y de los ahorros.' },
  { id: 'iva', nombre: 'IVA', que: 'El impuesto que va en casi todo lo que se compra: 21 %, 10 % o 4 %, según el producto.' },
  { id: 'sociedades', nombre: 'Impuesto de sociedades', que: 'Lo que pagan las empresas por sus beneficios.' },
  { id: 'otros-impuestos', nombre: 'Otros impuestos', que: 'Gasolina, tabaco y alcohol, electricidad, IBI y otros impuestos locales, sucesiones, patrimonio, tasas…' },
  { id: 'otros', nombre: 'Otros ingresos', que: 'Ventas y servicios que cobran las administraciones, intereses y dividendos, dinero de la UE y otras transferencias.' },
];

/**
 * Resumen de los ingresos para la web, del último año con total: { año, total, porPersona, pib, pibUe,
 * gasto, bloques: [{ id, nombre, que, valor, cuota, pib, pibUe }], detalle: true si están IVA, IRPF y sociedades }.
 * Si no hay el desglose de impuestos, los impuestos van en dos bloques (consumo y producción; renta y patrimonio).
 */
export function resumenIngresos(datos) {
  const d = datos?.ingresos;
  const tr = d?.es?.TR?.MIO_EUR ?? {};
  const año = Object.keys(tr).sort().reverse().find((a) => tr[a] > 0 && datos.poblacion?.[a] > 0);
  if (!año) return null;
  const v = (zona, c, unidad = 'MIO_EUR') => d[zona]?.[c]?.[unidad]?.[año] ?? null;
  const total = tr[año];
  const d2 = v('es', 'D2REC') ?? 0;
  const d5 = v('es', 'D5REC') ?? 0;
  const d91 = v('es', 'D91REC') ?? 0;
  const d61 = v('es', 'D61REC') ?? 0;
  const iva = v('es', 'D211');
  const irpf = v('es', 'D51A_C1');
  const soc = v('es', 'D51B_C2');
  const detalle = iva > 0 && irpf > 0 && soc > 0;
  // Lo mismo en % del PIB, para comparar con la UE (con la misma cuenta)
  const pib = (zona) => {
    const x = (c) => v(zona, c, 'PC_GDP');
    const [p2, p5, p91, p61, ptr] = ['D2REC', 'D5REC', 'D91REC', 'D61REC', 'TR'].map(x);
    if (ptr === null) return {};
    const [piva, pirpf, psoc] = ['D211', 'D51A_C1', 'D51B_C2'].map(x);
    const base = { cotizaciones: p61, otros: ptr - (p2 ?? 0) - (p5 ?? 0) - (p91 ?? 0) - (p61 ?? 0) };
    return detalle && piva !== null && pirpf !== null && psoc !== null
      ? { ...base, irpf: pirpf, iva: piva, sociedades: psoc, 'otros-impuestos': (p2 ?? 0) + (p5 ?? 0) + (p91 ?? 0) - piva - pirpf - psoc }
      : { ...base, consumo: p2, renta: (p5 ?? 0) + (p91 ?? 0) };
  };
  const valores = detalle
    ? { cotizaciones: d61, irpf, iva, sociedades: soc, 'otros-impuestos': d2 + d5 + d91 - iva - irpf - soc, otros: total - d2 - d5 - d91 - d61 }
    : { cotizaciones: d61, consumo: d2, renta: d5 + d91, otros: total - d2 - d5 - d91 - d61 };
  const sinDetalle = [
    { id: 'cotizaciones', ...BLOQUES_INGRESOS[0] },
    { id: 'consumo', nombre: 'Impuestos sobre el consumo y la producción', que: 'IVA, gasolina, tabaco, alcohol, electricidad, IBI y otros impuestos sobre lo que se compra y se produce.' },
    { id: 'renta', nombre: 'Impuestos sobre la renta y el patrimonio', que: 'IRPF, impuesto de sociedades, sucesiones y patrimonio.' },
    BLOQUES_INGRESOS[5],
  ];
  const pibEs = pib('es');
  const pibUe = pib('ue');
  const bloques = (detalle ? BLOQUES_INGRESOS : sinDetalle)
    .map((b) => ({ ...b, valor: valores[b.id], cuota: valores[b.id] / total, pib: pibEs[b.id] ?? null, pibUe: pibUe[b.id] ?? null }))
    .filter((b) => b.valor > 0)
    .sort((a, b) => b.valor - a.valor);
  return {
    año,
    actualizado: d.actualizado ?? null,
    total,
    porPersona: (total * 1e6) / datos.poblacion[año],
    pib: v('es', 'TR', 'PC_GDP'),
    pibUe: v('ue', 'TR', 'PC_GDP'),
    gasto: v('es', 'TE'),
    detalle,
    bloques,
    serie: Object.keys(d.es?.TR?.PC_GDP ?? {}).filter((a) => a <= año).sort().map((a) => ({ año: a, es: d.es.TR.PC_GDP[a], ue: d.ue?.TR?.PC_GDP?.[a] ?? null })),
  };
}

/** Población media anual de España. */
export function urlPoblacion() {
  const p = new URLSearchParams({ lang: 'EN', geo: 'ES', indic_de: 'AVG', sinceTimePeriod: String(PRIMER_AÑO) });
  return `${API}/demo_gind?${p}`;
}

/**
 * Junta las dos respuestas de Eurostat en el JSON compacto que lee la web:
 * { años, provisionales, poblacion, es: { S13: { MIO_EUR: { GF07: { '2024': 98000 } } } }, ue: {...}, fuente }
 * Solo se guarda lo que se usa: España en todas las unidades y sectores, y la UE en % del PIB.
 */
export function prepararDatos(jsonGasto, jsonPoblacion, jsonTipos = null) {
  const datos = { es: {}, ue: {}, poblacion: {}, tipos: {}, años: [], provisionales: [], fuente: {} };
  const años = new Set();
  const provisionales = new Set();

  for (const o of aplanar(jsonGasto)) {
    if (o.na_item && o.na_item !== 'TE') continue;
    const destino = o.geo === 'ES' ? 'es' : o.geo === 'EU27_2020' ? 'ue' : null;
    if (!destino || !SECTORES.includes(o.sector) || !o.cofog99) continue;
    if (destino === 'ue' && (o.sector !== 'S13' || o.unit !== 'PC_GDP')) continue;
    const ruta = (((datos[destino][o.sector] ??= {})[o.unit] ??= {})[o.cofog99] ??= {});
    ruta[o.time] = o.valor;
    if (destino === 'es' && o.sector === 'S13' && o.unit === 'MIO_EUR' && o.cofog99 === 'TOTAL') {
      años.add(o.time);
      if (o.estado?.includes('p')) provisionales.add(o.time);
    }
  }

  for (const o of aplanar(jsonPoblacion)) {
    if (o.geo === 'ES' && (!o.indic_de || o.indic_de === 'AVG')) datos.poblacion[o.time] = o.valor;
  }

  // tipos[cofog][na_item][año]
  if (jsonTipos) {
    const validos = new Set(TIPOS.map((t) => t.id));
    for (const o of aplanar(jsonTipos)) {
      if (o.geo !== 'ES' || o.sector !== 'S13' || o.unit !== 'MIO_EUR' || !validos.has(o.na_item) || !o.cofog99) continue;
      ((datos.tipos[o.cofog99] ??= {})[o.na_item] ??= {})[o.time] = o.valor;
    }
  }

  datos.años = [...años].sort();
  datos.provisionales = [...provisionales].sort();
  datos.fuente = {
    gasto: { dataset: 'gov_10a_exp', actualizado: jsonGasto?.updated ?? null },
    poblacion: { dataset: 'demo_gind', actualizado: jsonPoblacion?.updated ?? null },
    tipos: jsonTipos ? { dataset: 'gov_10a_exp', actualizado: jsonTipos?.updated ?? null } : null,
  };
  return datos;
}

/** Comprueba que los datos tienen lo mínimo para que la web funcione. Devuelve el problema o null. */
export function problema(datos) {
  if (!datos?.años?.length) return 'No hay años con gasto total de España';
  if (datos.años.length < 5) return `Solo hay ${datos.años.length} años`;
  const año = ultimoAño(datos);
  if (!año) return 'Ningún año tiene a la vez gasto y población';
  const total = valor(datos, 'TOTAL', año);
  if (!(total > 100000)) return `Gasto total de ${año} sospechoso: ${total}`;
  for (const p of partidas(datos, año)) {
    if (p.id === 'sin-detalle' && p.cuota > 0.05) return `En ${año} falta detalle para el ${(p.cuota * 100).toFixed(1)} % del gasto`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Consultas (las usa la web)

/** Valor de un código COFOG. Por defecto, España, todas las administraciones, millones de euros. */
export function valor(datos, codigo, año, { geo = 'es', sector = 'S13', unidad = 'MIO_EUR' } = {}) {
  const v = datos?.[geo]?.[sector]?.[unidad]?.[codigo]?.[año];
  return typeof v === 'number' ? v : null;
}

/** Suma `codigos` y resta `menos`; null si falta alguno de los que suman. */
function combinar(datos, codigos, menos = [], año, opciones) {
  let total = 0;
  for (const c of codigos) {
    const v = valor(datos, c, año, opciones);
    if (v === null) return null;
    total += v;
  }
  for (const c of menos) {
    const v = valor(datos, c, año, opciones);
    if (v === null) return null;
    total -= v;
  }
  return total;
}

/** Último año con gasto total de España y población. */
export function ultimoAño(datos) {
  return [...(datos?.años ?? [])].reverse().find((a) => valor(datos, 'TOTAL', a) !== null && datos.poblacion?.[a] > 0) ?? null;
}

export function esProvisional(datos, año) {
  return datos?.provisionales?.includes(año) ?? false;
}

/** Gasto público total por persona en un año, en euros. */
export function gastoPorPersona(datos, año) {
  const total = valor(datos, 'TOTAL', año);
  const poblacion = datos?.poblacion?.[año];
  return total !== null && poblacion > 0 ? (total * 1e6) / poblacion : null;
}

/**
 * Partidas de un año ordenadas de mayor a menor: [{ id, nombre, que, valor, cuota }].
 * Si a alguna le falta el detalle, lo que no se puede asignar va a «Sin detalle»,
 * así las cuotas siempre suman el 100 % del gasto total.
 */
export function partidas(datos, año, opciones = {}) {
  const total = valor(datos, 'TOTAL', año, opciones);
  if (total === null || total <= 0) return [];
  const lista = [];
  let asignado = 0;
  for (const p of PARTIDAS) {
    const v = combinar(datos, p.codigos, p.menos, año, opciones);
    if (v === null) continue;
    lista.push({ id: p.id, nombre: p.nombre, que: p.que, valor: v });
    asignado += v;
  }
  const resto = total - asignado;
  if (Math.abs(resto) > total * 0.005) {
    lista.push({ id: 'sin-detalle', nombre: 'Sin detalle', que: 'Gasto que Eurostat no desglosa para este año.', valor: resto });
  }
  return lista.map((p) => ({ ...p, cuota: p.valor / total })).sort((a, b) => b.valor - a.valor);
}

/** Serie de una partida en % del PIB para España (y la UE si hay dato): [{ año, es, ue }]. */
export function seriePartida(datos, id) {
  const p = PARTIDAS.find((x) => x.id === id);
  if (!p) return [];
  return (datos?.años ?? [])
    .map((año) => ({
      año,
      es: combinar(datos, p.codigos, p.menos, año, { unidad: 'PC_GDP' }),
      ue: combinar(datos, p.codigos, p.menos, año, { geo: 'ue', unidad: 'PC_GDP' }),
    }))
    .filter((x) => x.es !== null);
}

/**
 * Quién gasta cada función: [{ id, nombre, total, partes: [{ id, nombre, valor, cuota }] }].
 * Son cifras sin consolidar: si una administración pasa dinero a otra para un fin concreto,
 * cuenta en las dos. Por eso se dan cuotas dentro de cada función, no sumas entre funciones.
 */
export function reparto(datos, año) {
  return FUNCIONES.map((f) => {
    const partes = SUBSECTORES.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      valor: Math.max(0, combinar(datos, [f.id], f.menos, año, { sector: s.id }) ?? 0),
    }));
    const suma = partes.reduce((t, x) => t + x.valor, 0);
    return {
      id: f.id,
      nombre: f.nombre,
      total: valor(datos, f.id, año),
      partes: partes.map((x) => ({ ...x, cuota: suma > 0 ? x.valor / suma : 0 })),
    };
  })
    .filter((f) => f.partes.some((x) => x.valor > 0))
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
}

/** Gasto de cada administración, sin las transferencias generales entre administraciones. */
export function gastoPorAdministracion(datos, año) {
  return SUBSECTORES.map((s) => ({
    ...s,
    valor: combinar(datos, ['TOTAL'], ['GF0108'], año, { sector: s.id }) ?? valor(datos, 'TOTAL', año, { sector: s.id }),
  })).filter((s) => s.valor !== null);
}

// ---------------------------------------------------------------------------
// Detalle de cada partida

const division = (codigo) => codigo.slice(0, 4);
const hijos = (datos, div, año) =>
  Object.keys(datos?.es?.S13?.MIO_EUR ?? {}).filter((c) => c.length === 6 && division(c) === div && valor(datos, c, año) !== null).sort();

/** Los grupos COFOG que forman una partida: los de sus divisiones (menos los que se restan) o ella misma. */
export function gruposDePartida(datos, partida, año) {
  const lista = [];
  for (const c of partida.codigos) {
    if (c.length === 4) {
      const h = hijos(datos, c, año).filter((x) => !(partida.menos ?? []).includes(x));
      lista.push(...h);
    } else lista.push(c);
  }
  return lista;
}

/**
 * En qué se va una partida: [{ codigo, nombre, valor, cuota }] de mayor a menor (cuota sobre la partida).
 * Si los grupos no suman la partida (falta detalle), la diferencia va a «Sin detalle».
 */
export function detallePartida(datos, id, año) {
  const partida = PARTIDAS.find((p) => p.id === id);
  if (!partida) return [];
  const total = combinar(datos, partida.codigos, partida.menos, año);
  if (!(total > 0)) return [];
  const grupos = gruposDePartida(datos, partida, año);
  // Una partida de un solo grupo (como el transporte) no tiene más detalle en esta fuente
  if (grupos.length <= 1) return [];
  const lista = grupos
    .map((c) => ({ codigo: c, nombre: GRUPOS[c] ?? c, valor: valor(datos, c, año) ?? 0 }))
    .filter((g) => g.valor > 0);
  const resto = total - lista.reduce((t, g) => t + g.valor, 0);
  if (resto > total * 0.01) lista.push({ codigo: 'resto', nombre: 'Sin detalle', valor: resto });
  return lista.map((g) => ({ ...g, cuota: g.valor / total })).sort((a, b) => b.valor - a.valor);
}

/** Último año con desglose por tipo de gasto (puede ir un año por detrás del total). */
export function ultimoAñoTipos(datos) {
  const años = new Set();
  for (const t of Object.values(datos?.tipos?.TOTAL ?? {})) for (const a of Object.keys(t)) años.add(a);
  return [...años].sort().at(-1) ?? null;
}

/**
 * Cómo se gasta: reparto por tipo de gasto de una partida (o del total con id 'TOTAL').
 * [{ id, nombre, que, valor, cuota }] de mayor a menor, con «Otros» para lo que no encaja.
 */
export function tiposDeGasto(datos, id, año) {
  const partida = id === 'TOTAL' ? { codigos: ['TOTAL'], menos: [] } : PARTIDAS.find((p) => p.id === id);
  if (!partida || !datos?.tipos) return [];
  const total = combinar(datos, partida.codigos, partida.menos, año);
  if (!(total > 0)) return [];
  const de = (codigo, tipo) => datos.tipos?.[codigo]?.[tipo]?.[año];
  const lista = [];
  for (const t of TIPOS) {
    let v = 0;
    let completo = true;
    for (const c of partida.codigos) {
      const x = de(c, t.id);
      if (typeof x !== 'number') completo = false;
      else v += x;
    }
    for (const c of partida.menos ?? []) {
      const x = de(c, t.id);
      if (typeof x !== 'number') completo = false;
      else v -= x;
    }
    if (completo && v > total * 0.002) lista.push({ id: t.id, nombre: t.nombre, que: t.que, valor: v });
  }
  if (!lista.length) return [];
  const resto = total - lista.reduce((s, x) => s + x.valor, 0);
  if (resto > total * 0.005) lista.push({ id: 'otros', nombre: 'Otros', que: 'Impuestos que pagan las propias administraciones, compra de terrenos y otros ajustes.', valor: resto });
  return lista.map((x) => ({ ...x, cuota: x.valor / total })).sort((a, b) => b.valor - a.valor);
}

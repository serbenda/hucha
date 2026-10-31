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
export function prepararDatos(jsonGasto, jsonPoblacion) {
  const datos = { es: {}, ue: {}, poblacion: {}, años: [], provisionales: [], fuente: {} };
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

  datos.años = [...años].sort();
  datos.provisionales = [...provisionales].sort();
  datos.fuente = {
    gasto: { dataset: 'gov_10a_exp', actualizado: jsonGasto?.updated ?? null },
    poblacion: { dataset: 'demo_gind', actualizado: jsonPoblacion?.updated ?? null },
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

// Ejecución del presupuesto del Estado (IGAE): lo presupuestado frente a lo que se lleva gastado.
//
// La Intervención General del Estado publica cada mes un libro de Excel («MENSUAL <MES> <AÑO>.xlsx») con el estado
// de ejecución del presupuesto de gastos del Estado, acumulado desde enero. De ahí se usan cuatro hojas:
//   GTOS 004  por capítulos (personal, compras, intereses, transferencias, inversiones…), con el mismo mes del año anterior
//   GTOS 014  por secciones (ministerios y otros), con el año anterior
//   GTOS 016  por áreas de gasto y políticas (sanidad, defensa, infraestructuras, I+D…)
//   GTOS 017  por programas dentro de cada sección
// Importes en miles de euros en el libro; aquí se guardan en millones de euros.
//
// Conceptos (no son lo mismo):
//   créditos definitivos   el presupuesto vigente: el inicial más las modificaciones aprobadas en el año
//   gastos comprometidos   lo que ya está reservado con contratos o acuerdos
//   obligaciones reconocidas  lo que ya se debe porque el trabajo está hecho o el derecho reconocido: el «gastado»
//   pagos realizados       lo que ya ha salido de la caja

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const BASE = 'https://www.igae.pap.hacienda.gob.es/sitios/igae/es-ES/Contabilidad/ContabilidadPublica/CPE/EjecucionPresupuestaria';
/** Página con los libros del año en curso, y la de un año anterior. */
export const urlPaginaEjecucion = (año, actual) => `${BASE}/Paginas/imejecucionpresupuesto${actual ? '' : año}.aspx`;
export const urlIgae = (ruta) => (ruta.startsWith('http') ? ruta : `https://www.igae.pap.hacienda.gob.es${ruta}`).replace(/ /g, '%20');

/** Enlaces a los libros mensuales de una página: [{ mes: 'AAAA-MM', url }], sin los anexos. */
export function librosMensuales(html) {
  const libros = new Map();
  for (const [, href] of String(html).matchAll(/href="([^"]+\.xlsx)"/gi)) {
    const nombre = decodeURIComponent(href.split('/').at(-1)).toUpperCase();
    if (/ANEXO/.test(nombre) || !/MENSUAL/.test(nombre) || /AVANCE/.test(nombre)) continue;
    const m = nombre.match(/MENSUAL\s+([A-ZÁÉÍÓÚ]+)\s+(\d{4})/);
    if (!m) continue;
    const i = MESES.indexOf(m[1].toLowerCase());
    if (i < 0) continue;
    libros.set(`${m[2]}-${String(i + 1).padStart(2, '0')}`, urlIgae(href));
  }
  return [...libros].map(([mes, url]) => ({ mes, url })).sort((a, b) => a.mes.localeCompare(b.mes));
}

// ---------------------------------------------------------------------------
// Lectura de las hojas. Cada hoja llega como filas [{ A: 'texto', B: 123, … }].

const num = (v) => (typeof v === 'number' ? v : /^-?\d+(\.\d+)?$/.test(String(v ?? '').trim()) ? Number(v) : null);
const millones = (v) => (num(v) === null ? null : Math.round(num(v) / 10) / 100); // miles de € → millones, 2 decimales
const texto = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
const siguiente = (col) => String.fromCharCode(col.charCodeAt(0) + 1);

/** Columnas de cabecera (en las primeras filas) cuyo texto cumple la expresión, en orden. */
function columnas(filas, expresion) {
  const salida = [];
  for (const fila of filas.slice(0, 5)) for (const [col, v] of Object.entries(fila)) if (expresion.test(texto(v))) salida.push(col);
  return salida.sort();
}

/** Primera fila de datos: la siguiente a la última fila de cabecera. */
const filasDeDatos = (filas) => {
  const i = filas.findIndex((f, k) => k > 1 && num(f.B) !== null);
  return i < 0 ? [] : filas.slice(i);
};

/** «… HASTA EL 31 DE AGOSTO» → 8. */
export function mesDeCorte(filas) {
  for (const fila of filas.slice(0, 3)) {
    const m = texto(fila.A).match(/HASTA EL \d+ DE ([A-ZÁÉÍÓÚ]+)/i);
    if (m) return MESES.indexOf(m[1].toLowerCase()) + 1 || null;
  }
  return null;
}

const CREDITOS = /^CR[ÉE]DITOS DEFINITIVOS/i;
const COMPROMETIDOS = /^GASTOS COMPROMETIDOS/i;
const OBLIGACIONES = /^OBLIGACIONES RECONOCIDAS/i;
const PAGOS = /^PAGOS REALIZADOS/i;

/** GTOS 004: capítulos, de este año y del mismo mes del año anterior. */
export function leerCapitulos(filas) {
  const [cr, crAnt] = columnas(filas, CREDITOS);
  const [co, coAnt] = columnas(filas, COMPROMETIDOS);
  const [ob, obAnt] = columnas(filas, OBLIGACIONES);
  const [pa, paAnt] = columnas(filas, PAGOS);
  if (!cr || !ob || !crAnt || !obAnt) throw new Error('GTOS 004: no se encuentran las columnas');
  const salida = { capitulos: [], noFinanciero: null, total: null };
  for (const f of filasDeDatos(filas)) {
    const nombre = texto(f.A);
    const fila = {
      creditos: millones(f[cr]), comprometidos: millones(f[co]), obligaciones: millones(f[ob]), pagos: millones(f[pa]),
      anterior: { creditos: millones(f[crAnt]), comprometidos: millones(f[coAnt]), obligaciones: millones(f[obAnt]), pagos: millones(f[paAnt]) },
    };
    const capitulo = nombre.match(/^(\d)\.\s*(.+)$/);
    if (capitulo) salida.capitulos.push({ id: capitulo[1], nombre: capitulo[2], ...fila });
    else if (/^TOTAL OPERACIONES NO FINANCIERAS/i.test(nombre)) salida.noFinanciero = fila;
    else if (/^TOTALES?$/i.test(nombre)) salida.total = fila;
  }
  if (!salida.noFinanciero || salida.capitulos.length < 9) throw new Error('GTOS 004: faltan capítulos o totales');
  return salida;
}

/** GTOS 014: secciones (ministerios y otros), con el año anterior. */
export function leerSecciones(filas) {
  const [cr] = columnas(filas, CREDITOS);
  const [co] = columnas(filas, COMPROMETIDOS);
  const [ob] = columnas(filas, OBLIGACIONES);
  if (!cr || !ob) throw new Error('GTOS 014: no se encuentran las columnas');
  const secciones = [];
  for (const f of filasDeDatos(filas)) {
    const nombre = texto(f.A);
    if (!nombre || /^TOTAL/i.test(nombre)) continue;
    secciones.push({
      nombre,
      creditos: millones(f[cr]), comprometidos: millones(f[co]), obligaciones: millones(f[ob]),
      anterior: { creditos: millones(f[siguiente(cr)]), comprometidos: millones(f[siguiente(co)]), obligaciones: millones(f[siguiente(ob)]) },
    });
  }
  if (secciones.length < 15) throw new Error(`GTOS 014: solo ${secciones.length} secciones`);
  return secciones;
}

/** GTOS 016: áreas de gasto y sus políticas. Las áreas vienen en mayúsculas; las políticas, debajo. */
export function leerPoliticas(filas) {
  const [cr] = columnas(filas, CREDITOS);
  const [ob] = columnas(filas, OBLIGACIONES);
  const [pa] = columnas(filas, PAGOS);
  if (!cr || !ob) throw new Error('GTOS 016: no se encuentran las columnas');
  const areas = [];
  for (const f of filasDeDatos(filas)) {
    const nombre = texto(f.A);
    const m = nombre.match(/^(\d)\.\s*(.+)$/);
    if (!m) continue;
    const fila = { creditos: millones(f[cr]), obligaciones: millones(f[ob]), pagos: millones(f[pa]) };
    if (m[2] === m[2].toUpperCase()) areas.push({ id: m[1], nombre: m[2], ...fila, politicas: [] });
    else if (areas.length) areas.at(-1).politicas.push({ id: `${areas.at(-1).id}${m[1]}`, nombre: m[2], ...fila });
  }
  if (areas.length < 4) throw new Error(`GTOS 016: solo ${areas.length} áreas`);
  return areas;
}

/** GTOS 017: programas, agrupados por sección. Las secciones vienen en mayúsculas; sus programas, debajo. */
export function leerProgramas(filas) {
  const [cr] = columnas(filas, CREDITOS);
  const [ob] = columnas(filas, OBLIGACIONES);
  const [pa] = columnas(filas, PAGOS);
  if (!cr || !ob) throw new Error('GTOS 017: no se encuentran las columnas');
  const secciones = [];
  for (const f of filasDeDatos(filas)) {
    const nombre = texto(f.A);
    if (!nombre || num(f[cr]) === null || /^TOTAL/i.test(nombre)) continue;
    const fila = { creditos: millones(f[cr]), obligaciones: millones(f[ob]), pagos: millones(f[pa]) };
    if (nombre === nombre.toUpperCase()) secciones.push({ nombre, ...fila, programas: [] });
    else if (secciones.length) secciones.at(-1).programas.push({ nombre, ...fila });
  }
  if (secciones.length < 15) throw new Error(`GTOS 017: solo ${secciones.length} secciones`);
  return secciones;
}

/** Un libro mensual ya leído ({ 'GTOS 004': filas, … }) → el resumen de ese mes. */
export function leerLibro(hojas, mes) {
  const capitulos = leerCapitulos(hojas['GTOS 004'] ?? []);
  const corte = mesDeCorte(hojas['GTOS 004'] ?? []);
  if (corte && corte !== Number(mes.slice(5))) throw new Error(`el libro de ${mes} dice «hasta ${MESES[corte - 1]}»`);
  return {
    mes,
    ...capitulos,
    secciones: leerSecciones(hojas['GTOS 014'] ?? []),
    areas: leerPoliticas(hojas['GTOS 016'] ?? []),
    programas: leerProgramas(hojas['GTOS 017'] ?? []),
  };
}

// ---------------------------------------------------------------------------
// Para la web

/** Parte ejecutada: obligaciones reconocidas entre créditos definitivos. */
export const ejecutado = (x) => (x?.creditos > 0 && x.obligaciones !== null ? x.obligaciones / x.creditos : null);

/** Parte del año transcurrida a final de un mes (AAAA-MM). */
export const transcurrido = (mes) => Number(mes.slice(5)) / 12;

/** Nombres más legibles para las secciones del libro (vienen abreviados y en mayúsculas). */
const NOMBRES_SECCION = {
  'ASUNTOS EXT., U. E. Y COOPERACIÓN': 'Asuntos Exteriores, UE y Cooperación',
  'PRESIDENCIA, JUSTICIA Y REL. CORTES': 'Presidencia, Justicia y Relaciones con las Cortes',
  'EDUCACIÓN, F. PROFESIONAL Y DEPORTES': 'Educación, Formación Profesional y Deportes',
  'POLÍTICA TERRITORIAL Y MEM. DEMOCR.': 'Política Territorial y Memoria Democrática',
  'TRANSICIÓN ECOLÓGICA Y RETO DEMOGR.': 'Transición Ecológica y Reto Demográfico',
  'DERECHOS SOC., CONSUMO Y AGENDA 2030': 'Derechos Sociales, Consumo y Agenda 2030',
  'INCLUSIÓN, S.S. Y MIGRACIONES': 'Inclusión, Seguridad Social y Migraciones',
  'PARA LA TRANSF. DIGITAL Y LA FUNCIÓN PÚBL.': 'Transformación Digital y Función Pública',
  'RELACIONES FINANCIERAS CON LA U. E.': 'Aportación a la Unión Europea',
  'APORTAC. AL MUTUALISMO ADMINISTRATIVO': 'Mutualidades de funcionarios',
  'FONDOS DE COMPENSACIÓN INTERTERRIT.': 'Fondos de Compensación Interterritorial',
  'OTRAS RELAC. FINANC. CON ENTES TERRIT.': 'Otras transferencias a comunidades y ayuntamientos',
  'SISTEMAS DE FINANC. DE ENTES TERRIT.': 'Financiación de comunidades y ayuntamientos',
  'DEUDA PÚBLICA': 'Deuda pública (intereses y amortizaciones)',
  'CLASES PASIVAS': 'Pensiones de funcionarios (clases pasivas)',
};
const MINUSCULAS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'a', 'en', 'con', 'para', 'por', 'su']);
export function nombreSeccion(nombre) {
  if (NOMBRES_SECCION[nombre]) return NOMBRES_SECCION[nombre];
  return nombre
    .toLowerCase()
    .split(' ')
    .map((p, i) => (i > 0 && MINUSCULAS.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ');
}

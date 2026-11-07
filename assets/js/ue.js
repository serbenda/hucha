// España y la UE: lo que España recibe del presupuesto de la UE y lo que aporta.
// Lee las hojas del Excel «EU spending and revenue» de la Comisión Europea (una por año, una columna por país)
// y resume el último año para la web. Las cifras son de pagos hechos cada año, en millones de euros.

const texto = (x) => String(x ?? '').replace(/\s+/g, ' ').trim();
const numero = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : null);

/**
 * Una hoja del Excel → { recibe, mff, ngeu, rubros: [{ codigo, nombre, valor }], ngeuRubros, aporta,
 * aportacion: { aduanas, iva, rnb, reduccion, plasticos, recursos, ajustes }, rnbPais } para España.
 * Devuelve null si la hoja no tiene la columna de España o el total de gasto.
 */
export function leerHojaUe(filas, pais = 'ES') {
  const esCabecera = (f) => Object.values(f).some((v) => texto(v) === pais);
  const cabeceras = filas.map((f, i) => (esCabecera(f) ? i : -1)).filter((i) => i >= 0);
  if (!cabeceras.length) return null;
  const columna = (i) => Object.keys(filas[i]).find((k) => texto(filas[i][k]) === pais);
  const colGasto = columna(cabeceras[0]);
  const etiqueta = (f) => texto(`${f.A ?? ''} ${f.B ?? ''}`);
  const buscar = (re, desde = 0, col = colGasto) => {
    for (let i = desde; i < filas.length; i++) if (re.test(etiqueta(filas[i]))) return { i, valor: numero(filas[i][col]) };
    return null;
  };

  const total = buscar(/^TOTAL EXPENDITURE/i, cabeceras[0]);
  if (!total || total.valor === null) return null;
  // Las grandes rúbricas: «1.», «2.»… y las letras sueltas (fuera del marco, instrumentos especiales)
  const rubros = [];
  for (let i = cabeceras[0] + 1; i < total.i; i++) {
    const f = filas[i];
    const codigo = texto(f.A);
    if (!/^(\d+\.|[A-Z])$/.test(codigo)) continue;
    const valor = numero(f[colGasto]);
    if (valor !== null) rubros.push({ codigo, nombre: texto(f.B), valor });
  }

  // NextGenerationEU (el fondo de recuperación), en su propia tabla desde 2021
  const iNgeu = cabeceras.find((i) => i > total.i && /NextGenerationEU|NGEU/i.test(Object.values(filas[i]).map(texto).join(' ')));
  let ngeu = null;
  const ngeuRubros = [];
  if (iNgeu !== undefined) {
    const col = columna(iNgeu);
    const t = buscar(/^TOTAL NGEU/i, iNgeu, col);
    ngeu = t?.valor ?? null;
    for (let i = iNgeu + 1; i < (t?.i ?? iNgeu); i++) {
      const codigo = texto(filas[i].A);
      const valor = numero(filas[i][col]);
      if (/^\d+\.$/.test(codigo) && valor !== null) ngeuRubros.push({ codigo, nombre: texto(filas[i].B), valor });
    }
  }

  // Lo que aporta: recursos propios (aduanas, IVA, renta nacional, plásticos) y ajustes de años anteriores
  const iIngresos = cabeceras.find((i) => /REVENUE/i.test(Object.values(filas[i]).map(texto).join(' '))) ?? total.i;
  const colIngresos = columna(iIngresos) ?? colGasto;
  const ingreso = (re) => buscar(re, iIngresos, colIngresos)?.valor ?? null;
  const aportacion = {
    aduanas: ingreso(/^Customs duties/i),
    iva: ingreso(/^Own resources based on VAT/i),
    rnb: ingreso(/^Own resources based on GNI/i),
    reduccion: ingreso(/^Gross reduction/i),
    plasticos: ingreso(/plastic packaging/i),
    recursos: ingreso(/^TOTAL Own resources/i),
    ajustes: ingreso(/^TOTAL Balances and adjustments/i),
  };
  if (aportacion.recursos === null) return null;
  const rnbPais = ingreso(/^Gross National Income/i);
  const mff = total.valor;
  return {
    mff,
    ngeu,
    recibe: mff + (ngeu ?? 0),
    rubros,
    ngeuRubros,
    aporta: aportacion.recursos + (aportacion.ajustes ?? 0),
    aportacion,
    ...(rnbPais ? { rnbPais } : {}),
  };
}

/** Nombres claros de las rúbricas del marco 2021-2027 (por su número). */
export const RUBROS_UE = {
  '1.': ['Investigación, innovación y digital', 'Horizonte Europa, conexiones de transporte y energía, programa digital, espacio…'],
  '2.': ['Fondos regionales y sociales', 'Fondo de Desarrollo Regional (FEDER), Fondo Social Europeo, Erasmus+…'],
  '3.': ['Agricultura, pesca y medio ambiente', 'La Política Agraria Común (ayudas a agricultores y desarrollo rural), la pesca y el programa LIFE.'],
  '4.': ['Migración y fronteras', 'Gestión de fronteras exteriores, asilo y migración.'],
  '5.': ['Seguridad y defensa', 'Fondo Europeo de Defensa, seguridad interior y protección civil.'],
  '6.': ['Ayuda exterior', 'Lo que la UE gasta en países vecinos y en el resto del mundo, ejecutado desde España.'],
  '7.': ['Administración europea', 'Sueldos, escuelas y pensiones de las instituciones europeas con sede o personal en España.'],
  O: ['Fuera del marco financiero', 'Gastos que no entran en el presupuesto de siete años.'],
  S: ['Instrumentos especiales', 'Fondo de solidaridad ante catástrofes, ajuste a la globalización y Brexit.'],
};

export const APORTACION_UE = {
  rnb: ['Aportación según la renta nacional', 'La mayor parte: cada país paga en proporción a su renta nacional bruta.'],
  iva: ['Parte del IVA', 'Un pequeño porcentaje de lo que se recauda de IVA.'],
  aduanas: ['Aranceles de aduanas', 'Lo que se cobra en las aduanas españolas a lo que llega de fuera de la UE: es dinero de la UE, y España se queda una parte por recaudarlo.'],
  plasticos: ['Plásticos no reciclados', 'Desde 2021, 0,80 € por kilo de envases de plástico que no se reciclan.'],
  reduccion: ['Rebajas a otros países', 'Lo que pone España para pagar las rebajas que tienen algunos países que aportan mucho.'],
  ajustes: ['Ajustes de años anteriores', 'Correcciones de lo que se pagó de más o de menos otros años.'],
};

/**
 * Resumen para la web del último año: { año, recibe, mff, ngeu, aporta, saldo, porPersona?, rnb?,
 * rubros: [{ id, nombre, que, valor }], aportacion: [...], serie: [{ año, recibe, aporta }] }.
 */
export function resumenUe(ue, poblacion = {}) {
  const años = Object.keys(ue?.años ?? {}).sort();
  const año = años.at(-1);
  if (!año) return null;
  const a = ue.años[año];
  const pob = poblacion[año] ?? poblacion[Object.keys(poblacion).sort().at(-1)] ?? null;
  const nuevoMarco = Number(año) >= 2021;
  const rubros = a.rubros
    .filter((r) => r.valor > 0.5)
    .map((r) => ({ id: r.codigo, nombre: nuevoMarco ? RUBROS_UE[r.codigo]?.[0] ?? r.nombre : r.nombre, que: nuevoMarco ? RUBROS_UE[r.codigo]?.[1] ?? '' : '', valor: r.valor }));
  if (a.ngeu > 0) rubros.push({ id: 'ngeu', nombre: 'Plan de recuperación (NextGenerationEU)', que: 'Los fondos europeos de recuperación tras la pandemia que llegaron ese año (las ayudas, sin los préstamos).', valor: a.ngeu });
  rubros.sort((x, y) => y.valor - x.valor);
  const aportacion = Object.entries(APORTACION_UE)
    .map(([id, [nombre, que]]) => ({ id, nombre, que, valor: a.aportacion[id] }))
    .filter((x) => x.valor !== null && Math.abs(x.valor) > 0.5)
    .sort((x, y) => y.valor - x.valor);
  return {
    año,
    actualizado: ue.actualizado ?? null,
    fuente: ue.fuente ?? null,
    recibe: a.recibe,
    mff: a.mff,
    ngeu: a.ngeu,
    aporta: a.aporta,
    saldo: a.recibe - a.aporta,
    ...(pob ? { porPersona: { recibe: (a.recibe * 1e6) / pob, aporta: (a.aporta * 1e6) / pob } } : {}),
    ...(a.rnbPais ? { rnb: { recibe: a.recibe / a.rnbPais, aporta: a.aporta / a.rnbPais } } : {}),
    rubros,
    aportacion,
    serie: años.map((x) => ({ año: x, recibe: ue.años[x].recibe, aporta: ue.años[x].aporta, ngeu: ue.años[x].ngeu ?? 0 })),
  };
}

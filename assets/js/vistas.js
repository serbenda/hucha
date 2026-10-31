// Vistas: lo que enseña cada página, ya calculado.
// La Action parte de los datos completos de Eurostat (almacen/cofog.json) y deja en data/vistas/ un fichero
// pequeño por página. El navegador solo descarga eso y pinta: no recibe tablas enteras ni hace cuentas.

import {
  partidas, ultimoAño, esProvisional, gastoPorPersona, valor, seriePartida, detallePartida, tiposDeGasto, ultimoAñoTipos,
  reparto, gastoPorAdministracion,
} from './cofog.js';

/** Lo común a todas las vistas: año, si es provisional, de cuándo son los datos y si son de ejemplo. */
function base(d) {
  const año = ultimoAño(d);
  return {
    año,
    provisional: esProvisional(d, año),
    actualizado: d.actualizado ?? null,
    eurostat: d.fuente?.gasto?.actualizado ?? null,
    ...(d.ejemplo ? { ejemplo: true } : {}),
  };
}

const cifrasTotales = (d, año) => ({
  total: valor(d, 'TOTAL', año),
  porPersona: gastoPorPersona(d, año),
  pib: valor(d, 'TOTAL', año, { unidad: 'PC_GDP' }),
  pibUe: valor(d, 'TOTAL', año, { geo: 'ue', unidad: 'PC_GDP' }),
});

/** Tu ticket: las cuotas de cada partida y las cifras de todos. */
export function vistaPortada(d) {
  const b = base(d);
  return {
    ...b,
    ...cifrasTotales(d, b.año),
    partidas: partidas(d, b.año).map(({ id, nombre, que, cuota }) => ({ id, nombre, que, cuota })),
  };
}

/** A dónde va: cada partida con su detalle, cómo se gasta y su serie frente a la UE. */
export function vistaADondeVa(d) {
  const b = base(d);
  const añoTipos = ultimoAñoTipos(d);
  const quitarQue = (lista) => lista.map(({ que, ...x }) => x);
  return {
    ...b,
    ...cifrasTotales(d, b.año),
    // Euros por habitante: millones de euros → euros, entre la población del año
    porHabitante: 1e6 / d.poblacion[b.año],
    añoTipos,
    porHabitanteTipos: añoTipos ? 1e6 / (d.poblacion[añoTipos] ?? d.poblacion[b.año]) : 0,
    partidas: partidas(d, b.año).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      que: p.que,
      cuota: p.cuota,
      serie: seriePartida(d, p.id),
      grupos: detallePartida(d, p.id, b.año),
      tipos: añoTipos ? quitarQue(tiposDeGasto(d, p.id, añoTipos)) : [],
    })),
    tipos: añoTipos ? tiposDeGasto(d, 'TOTAL', añoTipos) : [],
  };
}

/** Quién gasta: cuánto gasta cada administración y el reparto de cada función. */
export function vistaQuienGasta(d) {
  const b = base(d);
  return { ...b, poblacion: d.poblacion?.[b.año] ?? null, administraciones: gastoPorAdministracion(d, b.año), funciones: reparto(d, b.año) };
}

export const VISTAS = { portada: vistaPortada, 'a-donde-va': vistaADondeVa, 'quien-gasta': vistaQuienGasta };

/**
 * Presupuesto: lo presupuestado frente a lo gastado (IGAE). Parte del almacén de la ejecución, no de Eurostat.
 * Lo principal son las operaciones no financieras (capítulos 1 a 7): sin la compra de activos ni la amortización
 * de deuda, que son movimientos de dinero y no gasto.
 */
export function vistaPresupuesto(e) {
  const meses = Object.keys(e?.meses ?? {}).sort();
  const mes = meses.at(-1);
  if (!mes) return null;
  const m = e.meses[mes];
  const año = mes.slice(0, 4);
  const anterior = String(Number(año) - 1);
  const pct = (x) => (x?.creditos > 0 && x.obligaciones !== null ? x.obligaciones / x.creditos : null);
  const serie = (a) => meses.filter((x) => x.startsWith(`${a}-`)).map((x) => ({ mes: Number(x.slice(5)), ejecutado: pct(e.meses[x].noFinanciero) }));
  const programasDe = new Map((m.programas ?? []).map((s) => [s.nombre, s.programas]));
  const fila = ({ nombre, creditos, comprometidos, obligaciones, pagos, anterior: ant }) => ({
    nombre, creditos, comprometidos, obligaciones, pagos,
    ...(ant ? { anterior: { creditos: ant.creditos, obligaciones: ant.obligaciones } } : {}),
  });
  return {
    mes,
    año,
    actualizado: e.actualizado,
    ...(e.ejemplo ? { ejemplo: true } : {}),
    url: m.url ?? null,
    total: fila(m.noFinanciero),
    financiero: m.total && m.noFinanciero ? { creditos: m.total.creditos - m.noFinanciero.creditos, obligaciones: m.total.obligaciones - m.noFinanciero.obligaciones } : null,
    series: { [año]: serie(año), [anterior]: serie(anterior) },
    capitulos: (m.capitulos ?? []).map((c) => ({ id: c.id, ...fila(c) })),
    politicas: (m.areas ?? []).filter((a) => a.id !== '0').flatMap((a) => a.politicas.map((p) => ({ id: p.id, area: a.nombre, ...fila(p) }))),
    secciones: (m.secciones ?? []).map((s) => ({
      ...fila(s),
      programas: (programasDe.get(s.nombre) ?? []).filter((p) => p.creditos > 0).map(fila).sort((a, b) => b.creditos - a.creditos),
    })),
  };
}

/** JSON compacto: los decimales, con 6 cifras significativas, que es más de lo que se enseña. */
export const aJson = (x) => JSON.stringify(x, (k, v) => (typeof v === 'number' && !Number.isInteger(v) ? Number(v.toPrecision(6)) : v));

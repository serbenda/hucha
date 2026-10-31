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
  return { ...b, administraciones: gastoPorAdministracion(d, b.año), funciones: reparto(d, b.año) };
}

export const VISTAS = { portada: vistaPortada, 'a-donde-va': vistaADondeVa, 'quien-gasta': vistaQuienGasta };

/** JSON compacto: los decimales, con 6 cifras significativas, que es más de lo que se enseña. */
export const aJson = (x) => JSON.stringify(x, (k, v) => (typeof v === 'number' && !Number.isInteger(v) ? Number(v.toPrecision(6)) : v));

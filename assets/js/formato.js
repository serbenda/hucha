// Formatos de números y fechas en castellano.

const enteros = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' });
const unDecimal = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: 'always' });

/** 1234.5 → «1.235 €» */
export const euros = (n) => (n === null || n === undefined || !Number.isFinite(n) ? '—' : `${enteros.format(Math.round(n))} €`);

/** 0.1234 → «12,3 %» */
export const porcentaje = (cuota) => (Number.isFinite(cuota) ? `${unDecimal.format(cuota * 100)} %` : '—');

/** Puntos de PIB: 10.83 → «10,8 % del PIB» */
export const delPib = (pc) => (Number.isFinite(pc) ? `${unDecimal.format(pc)} % del PIB` : '—');

/** Millones de euros a texto de calle: 652000 → «652.000 millones de euros» */
export function millones(m) {
  if (!Number.isFinite(m)) return '—';
  if (Math.abs(m) >= 1000) return `${enteros.format(Math.round(m / 1000))} mil millones de euros`;
  return `${enteros.format(Math.round(m))} millones de euros`;
}

/** Número sin unidades: 48600000 → «48.600.000» */
export const numero = (n) => (Number.isFinite(n) ? enteros.format(n) : '—');

/** Lee un importe escrito a mano: «30.000», «30000 €», «30 000», «2.500,50» */
export function leerImporte(texto) {
  const limpio = String(texto ?? '').replace(/[€\s]/g, '');
  if (!limpio) return null;
  // Con coma decimal (español): los puntos son de miles
  const normal = limpio.includes(',') ? limpio.replace(/\./g, '').replace(',', '.') : limpio.replace(/\.(?=\d{3}(\D|$))/g, '');
  const n = Number(normal);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const fechas = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
export const fecha = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : fechas.format(d);
};

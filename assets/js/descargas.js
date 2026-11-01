// Descargas: los datos de cada página en CSV (para abrir en una hoja de cálculo) y en JSON (para programas).
// El CSV se genera en el navegador con lo que ya está cargado: no hay ficheros aparte que mantener.
// En castellano va separado por punto y coma y con coma decimal, que es lo que espera Excel en español;
// en inglés, por comas y con punto decimal. Lleva BOM para que las tildes se lean bien.

import { EN, t } from './idioma.js';
import { icono } from './iconos.js';

const SEPARADOR = EN ? ',' : ';';

const celda = (v) => {
  if (v === null || v === undefined) return '';
  // Hasta 4 decimales: suficiente para partes (0,1234 = 12,34 %) y sin ruido de coma flotante
  let s = typeof v === 'number' ? (Number.isFinite(v) ? String(Math.round(v * 1e4) / 1e4) : '') : String(v);
  if (typeof v === 'number' && !EN) s = s.replace('.', ',');
  return s.includes(SEPARADOR) || /["\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Texto CSV a partir de las columnas y las filas (listas de valores). */
export const csv = (columnas, filas) =>
  '﻿' + [columnas, ...filas].map((f) => f.map(celda).join(SEPARADOR)).join('\r\n') + '\r\n';

/** Descarga un texto como fichero. */
export function descargar(nombre, texto, tipo = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([texto], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Pinta los botones de descarga en una caja.
 * items: [{ texto, fichero, tabla: () => [columnas, filas] }] para CSV, o [{ texto, href, fichero }] para un JSON ya publicado.
 */
export function botones(caja, items) {
  caja.innerHTML = items
    .map((x, i) =>
      x.href
        ? `<a class="boton-descarga" href="${x.href}" download="${x.fichero}">${icono('descargar')}${x.texto}<small>JSON</small></a>`
        : `<button type="button" class="boton-descarga" data-descarga="${i}">${icono('descargar')}${x.texto}<small>CSV</small></button>`
    )
    .join('');
  caja.onclick = (e) => {
    const b = e.target.closest('[data-descarga]');
    if (!b) return;
    const x = items[Number(b.dataset.descarga)];
    const [columnas, filas] = x.tabla();
    descargar(x.fichero, csv(columnas, filas));
  };
}

/** Nombre de fichero: hucha-<que>[-en].csv */
export const fichero = (que, ext = 'csv') => `hucha-${que}${EN ? '-en' : ''}.${ext}`;

/** Enlace al JSON publicado de una vista de la web. */
export const jsonVista = (vista) => ({
  texto: t('Todo, para programas', 'Everything, for software'),
  href: new URL(`../../data/vistas/${vista}.json`, import.meta.url).href,
  fichero: `hucha-${vista}.json`,
});

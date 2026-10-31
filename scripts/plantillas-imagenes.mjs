// HTML de los iconos y de la imagen para compartir. Lo usa scripts/imagenes.mjs.
// Separado para poder revisar el diseño sin necesidad de Playwright.

import { partidas, ultimoAño } from '../assets/js/cofog.js';

const PAPEL = '#f3f1ec';
const TINTA = '#1c2230';
const COBRE = '#9a5418';
const TENUE = '#5b6170';

/** El logo con colores fijos (el SVG de la web los cambia con el modo oscuro). */
export function logoFijo(svg) {
  return svg.replace(/<style>[\s\S]*?<\/style>/, `<style>.cuerpo{fill:${TINTA}}.hueco{fill:${PAPEL}}.moneda{fill:${COBRE}}</style>`);
}

/** Icono cuadrado: el logo sobre el papel, con margen (más para los iconos «maskable» de Android). */
export function htmlIcono(logo, lado, margen) {
  return `<div style="width:${lado}px;height:${lado}px;background:${PAPEL};display:grid;place-items:center">
    <div style="width:${lado * (1 - 2 * margen)}px;height:${lado * (1 - 2 * margen)}px">${logo}</div>
  </div>`;
}

/**
 * Imagen para compartir (1200×630): de cada 100 € de gasto público, las cinco partidas mayores.
 * Con los datos del último año, así siempre enseña cifras reales.
 */
export function htmlCompartir(logo, datos) {
  const año = ultimoAño(datos);
  const lista = partidas(datos, año).slice(0, 5);
  const mayor = lista[0]?.cuota ?? 1;
  const filas = lista
    .map(
      (p) => `<div style="display:grid;grid-template-columns:440px 1fr 92px;align-items:center;gap:22px">
        <div style="font-size:25px;font-weight:600;line-height:1.1">${p.nombre}</div>
        <div style="height:22px;background:#e2ddd3;border-radius:11px;overflow:hidden"><div style="height:100%;width:${(p.cuota / mayor) * 100}%;background:${COBRE};border-radius:11px"></div></div>
        <div style="font-size:34px;font-weight:800;font-stretch:112%;text-align:right">${Math.round(p.cuota * 100)} €</div>
      </div>`
    )
    .join('');
  return `<div style="width:1200px;height:630px;background:${PAPEL};color:${TINTA};font-family:Archivo,system-ui,sans-serif;padding:52px 72px;display:flex;flex-direction:column;gap:26px">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:22px">
        <div style="width:86px;height:86px">${logo}</div>
        <div style="font-size:70px;font-weight:800;font-stretch:125%;letter-spacing:-0.03em">hucha</div>
      </div>
      <div style="font-size:26px;color:${TENUE};font-weight:600">hucha.bendi.dev</div>
    </div>
    <div style="font-size:44px;font-weight:800;font-stretch:112%;letter-spacing:-0.02em;line-height:1.08">De cada 100 € de gasto público en España…</div>
    <div style="display:grid;gap:14px">${filas}</div>
    <div style="margin-top:auto;font-size:22px;color:${TENUE}">Datos oficiales de ${año} (Eurostat). Escribe tu sueldo y mira a dónde va lo que pones.</div>
  </div>`;
}

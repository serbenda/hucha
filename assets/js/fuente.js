// Pie de fuente: debajo de cada dato, de dónde sale, hasta cuándo llega, cuándo lo publicó la fuente y cuándo
// lo descargó hucha. Así nadie tiene que adivinar si una cifra es oficial ni si está al día.

import { t } from './idioma.js';
import { fecha } from './formato.js';

const esc = (x) => String(x ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/**
 * Pinta el pie en el elemento `el`. Cada fuente: { nombre, enlace, tabla?, cubre, publicado?, descargado? }.
 * `cubre` es texto («hasta 2024, provisional»); las fechas son ISO.
 */
export function pieFuente(el, fuentes, { raiz = '../' } = {}) {
  if (!el) return;
  const linea = (f) =>
    [
      `<a href="${esc(f.enlace)}" rel="noopener">${esc(f.nombre)}</a>${f.tabla ? ` (${t('tabla', 'table')} <code>${esc(f.tabla)}</code>)` : ''}`,
      f.cubre ? `<strong>${esc(f.cubre)}</strong>` : '',
      f.publicado && fecha(f.publicado) ? t(`publicados por la fuente el ${fecha(f.publicado)}`, `published by the source on ${fecha(f.publicado)}`) : '',
      f.descargado && fecha(f.descargado) ? t(`descargados por hucha el ${fecha(f.descargado)}`, `downloaded by hucha on ${fecha(f.descargado)}`) : '',
    ]
      .filter(Boolean)
      .join(' · ');
  el.innerHTML = `<span class="pie-fuente-titulo">${fuentes.length > 1 ? t('Fuentes', 'Sources') : t('Fuente', 'Source')}</span> ${fuentes
    .map(linea)
    .join('<br>')}. <a href="${raiz}fuentes/#t-al-dia">${t('Cómo y cuándo se actualiza', 'How and when it is updated')}</a>`;
  el.hidden = false;
}

/** Las fuentes de hucha, con su enlace oficial. */
export const FUENTES = {
  gasto: { nombre: 'Eurostat', enlace: 'https://ec.europa.eu/eurostat/databrowser/view/gov_10a_exp/default/table', tabla: 'gov_10a_exp' },
  deuda: { nombre: 'Eurostat', enlace: 'https://ec.europa.eu/eurostat/databrowser/view/gov_10dd_edpt1/default/table', tabla: 'gov_10dd_edpt1' },
  igae: { nombre: t('IGAE (Ministerio de Hacienda)', 'IGAE (Spanish Ministry of Finance)'), enlace: 'https://www.igae.pap.hacienda.gob.es/' },
  contratos: { nombre: t('Plataforma de Contratación del Sector Público', 'Public Sector Procurement Platform'), enlace: 'https://contrataciondelestado.es/' },
  subvenciones: { nombre: t('Base de Datos Nacional de Subvenciones', 'National Grants Database'), enlace: 'https://www.infosubvenciones.es/' },
  ayuda: { nombre: t('OCDE, sistema CRS', 'OECD, CRS system'), enlace: 'https://data-explorer.oecd.org/' },
};

/** «hasta 2024 (provisional)» */
export const hastaAño = (año, provisional) => (provisional ? t(`datos de ${año} (provisionales)`, `data for ${año} (provisional)`) : t(`datos de ${año}`, `data for ${año}`));

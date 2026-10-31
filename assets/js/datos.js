// Carga la vista de una página (data/vistas/<página>.json, la prepara la Action) y avisa si son datos de
// ejemplo o si no hay datos.

import { t } from './idioma.js';

function banda(texto) {
  const b = document.createElement('p');
  b.className = 'banda';
  b.setAttribute('role', 'status');
  b.textContent = texto;
  document.body.prepend(b);
}

export async function cargarVista(pagina) {
  try {
    const r = await fetch(new URL(`../../data/vistas/${pagina}.json`, import.meta.url), { cache: 'no-cache' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const datos = await r.json();
    if (datos.ejemplo) banda(t('Datos de ejemplo para desarrollo: no son cifras oficiales.', 'Example data for development: not official figures.'));
    return datos;
  } catch (e) {
    banda(t('No se han podido cargar los datos. Prueba a recargar la página en un rato.', 'The data could not be loaded. Try reloading the page in a while.'));
    throw e;
  }
}

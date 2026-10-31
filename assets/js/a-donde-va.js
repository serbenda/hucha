// «A dónde va»: las partidas en euros por habitante, con su evolución frente a la UE.

import { cargarDatos } from './datos.js';
import { partidas, ultimoAño, esProvisional, gastoPorPersona, seriePartida, valor } from './cofog.js';
import { euros, porcentaje, delPib } from './formato.js';

const $ = (id) => document.getElementById(id);
const unDecimal = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Gráfico de línea pequeño: España frente a la UE, en % del PIB. */
function grafico(serie, nombre) {
  const W = 600, H = 150, izq = 34, der = 52, arriba = 12, abajo = 22;
  const valores = serie.flatMap((x) => [x.es, x.ue]).filter((v) => v !== null);
  const max = Math.max(...valores) * 1.15 || 1;
  const n = serie.length;
  const X = (i) => izq + (n === 1 ? 0 : (i / (n - 1)) * (W - izq - der));
  const Y = (v) => arriba + (1 - v / max) * (H - arriba - abajo);
  const trazo = (clave) =>
    serie.map((p, i) => (p[clave] === null ? null : `${X(i).toFixed(1)},${Y(p[clave]).toFixed(1)}`)).filter(Boolean).join(' ');

  const marcas = [0, max / 2, max].map((v) => `<line class="rejilla" x1="${izq}" x2="${W - der}" y1="${Y(v)}" y2="${Y(v)}"/><text class="eje" x="${izq - 6}" y="${Y(v) + 4}" text-anchor="end">${unDecimal.format(v)}</text>`).join('');
  const ultimo = serie.at(-1);
  const ue = serie.some((p) => p.ue !== null) ? `<polyline class="ue" points="${trazo('ue')}"/>` : '';
  return `<div class="evolucion">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${nombre}: ${unDecimal.format(ultimo.es)} % del PIB en ${ultimo.año}, frente a ${unDecimal.format(serie[0].es)} % en ${serie[0].año}">
      ${marcas}
      ${ue}
      <polyline class="es" points="${trazo('es')}"/>
      <text class="eje" x="${X(0)}" y="${H - 4}" text-anchor="start">${serie[0].año}</text>
      <text class="eje" x="${X(n - 1)}" y="${H - 4}" text-anchor="end">${ultimo.año}</text>
      <text class="etiqueta-es" x="${X(n - 1) + 6}" y="${Y(ultimo.es) + 4}">${unDecimal.format(ultimo.es)} %</text>
    </svg>
  </div>`;
}

function comparar(es, ue) {
  if (es === null || ue === null || !(ue > 0)) return '';
  const r = es / ue;
  const como = r > 1.1 ? 'más que' : r < 0.9 ? 'menos que' : 'parecido a';
  return `<p class="comparacion">España dedica <strong>${delPib(es)}</strong>, ${como} la media de la Unión Europea (${delPib(ue)}).</p>`;
}

try {
  const datos = await cargarDatos();
  const año = ultimoAño(datos);
  const porPersona = gastoPorPersona(datos, año);
  const lista = partidas(datos, año);
  const primera = lista[0];

  $('entradilla').innerHTML =
    `En ${año}, las administraciones gastaron <strong>${euros(porPersona)} por habitante</strong>. ` +
    `La partida más grande, ${primera.nombre.toLowerCase()}, se llevó ${porcentaje(primera.cuota)} del total.`;
  $('partidas-texto').textContent =
    `Euros por habitante en ${año}${esProvisional(datos, año) ? ' (datos provisionales)' : ''}. Pulsa una partida para ver qué incluye y cómo ha cambiado desde ${datos.años[0]}.`;

  const mayor = lista[0].cuota;
  $('partidas').replaceChildren(
    ...lista.map((p) => {
      const li = document.createElement('li');
      li.className = 'partida';
      const serie = seriePartida(datos, p.id);
      const esPib = serie.at(-1)?.es ?? null;
      const uePib = serie.at(-1)?.ue ?? null;
      li.innerHTML = `<details>
        <summary>
          <span class="partida-nombre">${p.nombre}</span>
          <span class="partida-euros">${euros(p.cuota * porPersona)}<small>${porcentaje(p.cuota)} del gasto</small></span>
          <span class="partida-barra" aria-hidden="true"><i style="--ancho: ${((p.cuota / mayor) * 100).toFixed(1)}%"></i></span>
        </summary>
        <div class="partida-detalle">
          <p>${p.que}</p>
          ${comparar(esPib, uePib)}
          ${serie.length > 1 ? grafico(serie, p.nombre) : ''}
        </div>
      </details>`;
      return li;
    })
  );

  // Total en % del PIB, en la entradilla si hay dato de la UE
  const pib = valor(datos, 'TOTAL', año, { unidad: 'PC_GDP' });
  const pibUe = valor(datos, 'TOTAL', año, { geo: 'ue', unidad: 'PC_GDP' });
  if (pib !== null && pibUe !== null) {
    $('entradilla').insertAdjacentHTML('beforeend', ` En total, el ${delPib(pib)}; la media europea es el ${delPib(pibUe)}.`);
  }
} catch {
  $('partidas').replaceChildren();
}

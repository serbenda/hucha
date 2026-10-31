// «A dónde va»: las partidas en euros por habitante, con su evolución frente a la UE.

import { cargarDatos } from './datos.js';
import { partidas, ultimoAño, esProvisional, gastoPorPersona, seriePartida, valor, detallePartida, tiposDeGasto, ultimoAñoTipos } from './cofog.js';
import { euros, porcentaje, delPib } from './formato.js';

const $ = (id) => document.getElementById(id);
const unDecimal = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Paso «redondo» para el eje: 0,5, 1, 2, 5… */
function paso(max) {
  const bruto = max / 3;
  const base = 10 ** Math.floor(Math.log10(bruto));
  return [1, 2, 2.5, 5, 10].map((m) => m * base).find((p) => p >= bruto);
}

/**
 * Gráfico de línea pequeño: España frente a la UE, en % del PIB.
 * Las líneas van en SVG y los textos en HTML encima, para que se lean igual en el móvil y en el ordenador.
 */
function grafico(serie, nombre) {
  const valores = serie.flatMap((x) => [x.es, x.ue]).filter((v) => v !== null);
  const p = paso(Math.max(...valores) * 1.05);
  const max = Math.ceil((Math.max(...valores) * 1.05) / p) * p;
  const n = serie.length;
  const X = (i) => (n === 1 ? 0 : (i / (n - 1)) * 100); // en %
  const Y = (v) => (1 - v / max) * 100; // en %
  const trazo = (clave) => serie.map((q, i) => (q[clave] === null ? null : `${X(i).toFixed(2)},${Y(q[clave]).toFixed(2)}`)).filter(Boolean).join(' ');

  const ticks = [];
  for (let v = 0; v <= max + 1e-9; v += p) ticks.push(v);
  const formato = new Intl.NumberFormat('es-ES', { maximumFractionDigits: p < 1 ? 1 : 0 });
  const rejilla = ticks.map((v) => `<line class="rejilla" x1="0" x2="100" y1="${Y(v)}" y2="${Y(v)}"/>`).join('');
  const etiquetasY = ticks.map((v) => `<span class="eje eje-y" style="top: ${Y(v)}%">${formato.format(v)}</span>`).join('');

  // Años: el primero, el último y algunos en medio (cada 4 o 5)
  const cada = n > 12 ? 5 : 4;
  const años = serie.map((q, i) => ({ q, i })).filter(({ i }) => i === 0 || i === n - 1 || (i % cada === 0 && n - 1 - i >= 3));
  const etiquetasX = años.map(({ q, i }) => `<span class="eje eje-x${i === 0 ? ' inicio' : i === n - 1 ? ' fin' : ''}" style="left: ${X(i)}%">${q.año}</span>`).join('');
  const marcasX = años.map(({ i }) => `<line class="marca-año" x1="${X(i)}" x2="${X(i)}" y1="100" y2="103"/>`).join('');

  // La pandemia explica el salto de 2020 en casi todas las partidas
  const iCovid = serie.findIndex((q) => q.año === '2020');
  const covid = iCovid > 0 ? `<line class="covid" x1="${X(iCovid)}" x2="${X(iCovid)}" y1="0" y2="100"/>` : '';
  const notaCovid = iCovid > 0 ? `<span class="nota-grafico" style="left: ${X(iCovid)}%">COVID</span>` : '';

  const ultimo = serie.at(-1);
  const ue = serie.some((q) => q.ue !== null) ? `<polyline class="ue" points="${trazo('ue')}"/>` : '';
  return `<div class="evolucion" role="img" aria-label="${nombre}: ${unDecimal.format(ultimo.es)} % del PIB en ${ultimo.año}, frente a ${unDecimal.format(serie[0].es)} % en ${serie[0].año}">
    <div class="lienzo" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">${rejilla}${covid}${marcasX}${ue}<polyline class="es" points="${trazo('es')}"/></svg>
      ${etiquetasY}${etiquetasX}${notaCovid}
      <span class="etiqueta-es" style="top: ${Y(ultimo.es)}%">${unDecimal.format(ultimo.es)} %</span>
    </div>
  </div>`;
}

/** Lista con barras: nombre, euros por habitante y porcentaje. `que` (opcional) va como aclaración. */
function desglose(items, porHabitante, deQue) {
  const mayor = Math.max(...items.map((x) => x.cuota));
  return `<ul class="desglose">${items
    .map(
      (x) => `<li>
        <span class="desglose-nombre">${x.nombre}${x.que ? `<small>${x.que}</small>` : ''}</span>
        <span class="desglose-cifra">${euros(x.valor * porHabitante)}<small>${porcentaje(x.cuota)} ${deQue}</small></span>
        <span class="partida-barra" aria-hidden="true"><i style="--ancho: ${((x.cuota / mayor) * 100).toFixed(1)}%"></i></span>
      </li>`
    )
    .join('')}</ul>`;
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

  const pib = valor(datos, 'TOTAL', año, { unidad: 'PC_GDP' });
  const pibUe = valor(datos, 'TOTAL', año, { geo: 'ue', unidad: 'PC_GDP' });
  const cifra = (id, dato, nota) => {
    const dd = $(id);
    const small = document.createElement('small');
    small.textContent = nota;
    dd.replaceChildren(dato, small);
  };
  const provisional = esProvisional(datos, año) ? ', provisional' : '';
  cifra('c-habitante', euros(porPersona), `al año, en ${año}${provisional}`);
  cifra('c-mayor', porcentaje(primera.cuota), primera.nombre);
  cifra('c-pib', delPib(pib), pibUe !== null ? `Media de la Unión Europea: ${delPib(pibUe).replace(' del PIB', '')}` : '');

  // Euros por habitante: millones de euros → euros, entre la población del año
  const porHabitante = 1e6 / datos.poblacion[año];
  const añoTipos = ultimoAñoTipos(datos);
  const porHabitanteTipos = añoTipos ? 1e6 / (datos.poblacion[añoTipos] ?? datos.poblacion[año]) : 0;

  const mayor = lista[0].cuota;
  $('partidas').replaceChildren(
    ...lista.map((p) => {
      const li = document.createElement('li');
      li.className = 'partida';
      const serie = seriePartida(datos, p.id);
      const esPib = serie.at(-1)?.es ?? null;
      const uePib = serie.at(-1)?.ue ?? null;
      const grupos = detallePartida(datos, p.id, año);
      const tipos = añoTipos ? tiposDeGasto(datos, p.id, añoTipos) : [];
      li.innerHTML = `<details>
        <summary>
          <span class="partida-nombre">${p.nombre}</span>
          <span class="partida-euros">${euros(p.cuota * porPersona)}<small>${porcentaje(p.cuota)} del gasto</small></span>
          <span class="partida-barra" aria-hidden="true"><i style="--ancho: ${((p.cuota / mayor) * 100).toFixed(1)}%"></i></span>
        </summary>
        <div class="partida-detalle">
          <p>${p.que}</p>
          ${grupos.length ? `<h3 class="detalle-titulo">En qué se va</h3>${desglose(grupos, porHabitante, 'de la partida')}` : ''}
          ${tipos.length ? `<h3 class="detalle-titulo">Cómo se gasta${añoTipos !== año ? ` <small>(${añoTipos})</small>` : ''}</h3>${desglose(tipos.map(({ que, ...t }) => t), porHabitanteTipos, 'de la partida')}` : ''}
          <h3 class="detalle-titulo">Frente a Europa</h3>
          ${comparar(esPib, uePib)}
          ${serie.length > 1 ? grafico(serie, p.nombre) : ''}
        </div>
      </details>`;
      return li;
    })
  );

  // Cómo se gasta todo: sueldos, pagos a personas, compras, inversión…
  const total = añoTipos ? tiposDeGasto(datos, 'TOTAL', añoTipos) : [];
  if (total.length) {
    $('t-tipos-texto').textContent = `Todo el gasto público de ${añoTipos} según en qué se materializa, en euros por habitante.`;
    $('tipos').innerHTML = desglose(total, porHabitanteTipos, 'del gasto');
    $('bloque-tipos').hidden = false;
  }

} catch {
  $('partidas').replaceChildren();
}

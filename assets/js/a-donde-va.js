// «A dónde va»: las partidas en euros por habitante, con su evolución frente a la UE.

import { cargarVista } from './datos.js';
import { bloques } from './graficos.js';
import { t, LOCALE } from './idioma.js';
import { PARTIDAS, GRUPOS, TIPOS, en, enQue } from './en.js';
import { colorPartida } from './colores.js';
import { icono, ICONO_PARTIDA } from './iconos.js';
import { euros, porcentaje, delPib } from './formato.js';

const $ = (id) => document.getElementById(id);
const unDecimal = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

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
  const formato = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: p < 1 ? 1 : 0 });
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
  return `<div class="evolucion" role="img" aria-label="${t(`${nombre}: ${unDecimal.format(ultimo.es)} % del PIB en ${ultimo.año}, frente a ${unDecimal.format(serie[0].es)} % en ${serie[0].año}`, `${nombre}: ${unDecimal.format(ultimo.es)}% of GDP in ${ultimo.año}, compared with ${unDecimal.format(serie[0].es)}% in ${serie[0].año}`)}">
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

/**
 * En qué se va cada partida, a la vista sin abrirla: una barra tan larga como la partida (frente a la mayor),
 * partida en sus grupos (tonos de su color, del más grande al más pequeño), y los tres mayores escritos debajo.
 */
function composicion(grupos, largo = 1) {
  const lista = grupos.filter((g) => g.cuota > 0.005);
  if (lista.length < 2) return '';
  const tramos = lista
    .map((g, k) => `<i style="--ancho: ${(g.cuota * 100).toFixed(2)}%; --tono: ${Math.max(28, 100 - k * 16)}%" title="${g.nombre}: ${porcentaje(g.cuota)}"></i>`)
    .join('');
  const texto = lista.slice(0, 3).map((g) => `${g.nombre} <b>${porcentaje(g.cuota)}</b>`).join(' · ');
  return `<span class="partida-composicion" aria-hidden="true" style="--largo: ${(largo * 100).toFixed(1)}%"><span>${tramos}</span></span><span class="partida-grupos">${texto}${lista.length > 3 ? ' · …' : ''}</span>`;
}

function comparar(es, ue) {
  if (es === null || ue === null || !(ue > 0)) return '';
  const r = es / ue;
  if (t(false, true)) {
    const como = r > 1.1 ? 'more than' : r < 0.9 ? 'less than' : 'about the same as';
    return `<p class="comparacion">Spain spends <strong>${delPib(es)}</strong>, ${como} the European Union average (${delPib(ue)}).</p>`;
  }
  const como = r > 1.1 ? 'más que' : r < 0.9 ? 'menos que' : 'parecido a';
  return `<p class="comparacion">España dedica <strong>${delPib(es)}</strong>, ${como} la media de la Unión Europea (${delPib(ue)}).</p>`;
}

try {
  const v = await cargarVista('a-donde-va');
  const { año, porPersona, pib, pibUe, añoTipos, porHabitante, porHabitanteTipos } = v;
  // En inglés, los nombres propios de hucha (partidas, grupos, tipos de gasto) se traducen
  const lista = v.partidas.map((p) => ({
    ...p,
    nombre: en(PARTIDAS, p.id, p.nombre),
    que: enQue(PARTIDAS, p.id, p.que),
    grupos: p.grupos.map((g) => ({ ...g, nombre: en(GRUPOS, g.codigo, g.nombre) })),
    tipos: p.tipos.map((x) => ({ ...x, nombre: en(TIPOS, x.id, x.nombre) })),
  }));
  const primera = lista[0];

  const cifra = (id, dato, nota) => {
    const dd = $(id);
    const small = document.createElement('small');
    small.textContent = nota;
    dd.replaceChildren(dato, small);
  };
  const provisional = v.provisional ? ', provisional' : '';
  cifra('c-habitante', euros(porPersona), t(`al año, en ${año}${provisional}`, `a year, in ${año}${provisional}`));
  cifra('c-mayor', porcentaje(primera.cuota), primera.nombre);
  cifra('c-pib', delPib(pib), pibUe !== null ? t(`Media de la Unión Europea: ${delPib(pibUe).replace(' del PIB', '')}`, `European Union average: ${delPib(pibUe).replace(' of GDP', '')}`) : '');

  const mayor = lista[0].cuota;
  $('partidas').replaceChildren(
    ...lista.map((p) => {
      const li = document.createElement('li');
      li.className = 'partida';
      li.id = `p-${p.id}`;
      li.style.setProperty('--c', colorPartida(p.id));
      const { serie, grupos, tipos } = p;
      const esPib = serie.at(-1)?.es ?? null;
      const uePib = serie.at(-1)?.ue ?? null;
      li.innerHTML = `<details>
        <summary>
          <span class="partida-nombre"><span class="insignia">${icono(ICONO_PARTIDA[p.id])}</span><span>${p.nombre}</span></span>
          <span class="partida-euros">${euros(p.cuota * porPersona)}<small>${porcentaje(p.cuota)} ${t('del gasto', 'of spending')}</small></span>
          ${composicion(grupos, p.cuota / mayor) || `<span class="partida-barra" aria-hidden="true"><i style="--ancho: ${((p.cuota / mayor) * 100).toFixed(1)}%"></i></span>`}
        </summary>
        <div class="partida-detalle">
          <p>${p.que}</p>
          ${grupos.length ? `<h3 class="detalle-titulo">${t('En qué se va', 'What it is spent on')}</h3>${desglose(grupos, porHabitante, t('de la partida', 'of the item'))}` : ''}
          ${tipos.length ? `<h3 class="detalle-titulo">${t('Cómo se gasta', 'How it is spent')}${añoTipos !== año ? ` <small>(${añoTipos})</small>` : ''}</h3>${desglose(tipos, porHabitanteTipos, t('de la partida', 'of the item'))}` : ''}
          <h3 class="detalle-titulo">${t('Frente a Europa', 'Compared with Europe')}</h3>
          ${comparar(esPib, uePib)}
          ${serie.length > 1 ? grafico(serie, p.nombre) : ''}
        </div>
      </details>`;
      return li;
    })
  );

  $('mapa').innerHTML = bloques(
    lista.map((p) => ({ id: p.id, nombre: p.nombre, valor: p.cuota, texto: `${euros(p.cuota * porPersona)} · ${porcentaje(p.cuota)}`, href: `#p-${p.id}`, color: colorPartida(p.id) })),
    {
      titulo: t(`Gasto público de ${año} por partidas, en euros por habitante`, `Public spending in ${año} by item, in euros per person`),
      otros: { minimo: 0.035, nombre: (n) => t(`Otras ${n} partidas`, `${n} other items`), texto: (v) => `${euros(v * porPersona)} · ${porcentaje(v)}`, href: '#t-partidas', color: 'var(--serie-otros)' },
    }
  );
  // Un enlace a una partida (#p-sanidad) la abre
  const abrir = () => {
    const li = location.hash.startsWith('#p-') && document.getElementById(location.hash.slice(1));
    if (!li) return;
    li.querySelector('details').open = true;
    li.scrollIntoView({ block: 'start' });
  };
  addEventListener('hashchange', abrir);
  abrir();

  // Cómo se gasta todo: sueldos, pagos a personas, compras, inversión…
  const total = v.tipos;
  if (total.length) {
    $('t-tipos-texto').textContent = t(`Todo el gasto público de ${añoTipos} según en qué se materializa, en euros por habitante.`, `All public spending in ${añoTipos} by what it turns into, in euros per person.`);
    $('tipos').innerHTML = desglose(total.map((x) => ({ ...x, nombre: en(TIPOS, x.id, x.nombre), que: enQue(TIPOS, x.id, x.que) })), porHabitanteTipos, t('del gasto', 'of spending'));
    $('bloque-tipos').hidden = false;
  }

} catch {
  $('partidas').replaceChildren();
}

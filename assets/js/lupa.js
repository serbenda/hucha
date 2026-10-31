// La Lupa: buscador de contratos, subvenciones y ayuda a otros países.
// Los datos se cargan al abrir cada pestaña; la búsqueda se hace en el navegador.
// El estado (pestaña, búsqueda, tema, nivel) va en la URL para poder compartir una búsqueda.

import { TEMAS, buscar, suma, normalizar } from './lupa-datos.js';
import { nombrePais } from './paises.js';
import { euros, fecha } from './formato.js';

const $ = (id) => document.getElementById(id);
const POR_PAGINA = 40;
const millones = (n) => `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: n >= 100e6 ? 0 : 1 }).format(n / 1e6)} millones de €`;
const fechaCorta = (iso) => (iso ? new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso)) : '');
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const params = new URLSearchParams(location.search);
const estado = {
  tab: ['contratos', 'subvenciones', 'ayuda'].includes(params.get('tab')) ? params.get('tab') : 'contratos',
  q: params.get('q') ?? '',
  tema: params.get('tema') ?? '',
  nivel: params.get('nivel') ?? '',
  mostrados: POR_PAGINA,
};
const cache = {};

async function datos(tab) {
  const fichero = { contratos: 'contratos', subvenciones: 'subvenciones', ayuda: 'ayuda' }[tab];
  cache[tab] ??= fetch(new URL(`../../data/lupa/${fichero}.json`, import.meta.url), { cache: 'no-cache' }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });
  return cache[tab];
}

function guardarUrl() {
  const p = new URLSearchParams();
  if (estado.tab !== 'contratos') p.set('tab', estado.tab);
  if (estado.q) p.set('q', estado.q);
  if (estado.tema) p.set('tema', estado.tema);
  if (estado.nivel) p.set('nivel', estado.nivel);
  history.replaceState(null, '', `${location.pathname}${p.size ? `?${p}` : ''}`);
}

// ---------------------------------------------------------------------------
// Pintar

function pintarTemas() {
  const visible = estado.tab !== 'ayuda';
  $('filtros').hidden = !visible;
  if (!visible) return;
  $('temas').replaceChildren(
    ...[{ id: '', nombre: 'Todo' }, ...TEMAS].map((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = t.nombre;
      b.setAttribute('aria-pressed', String(estado.tema === t.id));
      b.addEventListener('click', () => {
        estado.tema = t.id;
        estado.mostrados = POR_PAGINA;
        pintarTemas();
        pintar();
      });
      return b;
    })
  );
}

function fichaContrato(c) {
  return `<li class="resultado">
    <div class="resultado-cabeza">
      <h3>${esc(c.t)}</h3>
      <p class="resultado-importe">${millones(c.a)}<small>adjudicado, sin IVA</small></p>
    </div>
    <dl class="resultado-datos">
      <div><dt>Paga</dt><dd>${esc(c.o)}${c.l ? ` <span class="tenue">(${esc(c.l)})</span>` : ''}</dd></div>
      <div><dt>Gana</dt><dd>${esc(c.g?.join(', ') || 'Sin dato')}</dd></div>
      <div><dt>Fecha</dt><dd>${fechaCorta(c.f)}</dd></div>
      ${c.li && Math.abs(c.li - c.a) / c.li > 0.005 ? `<div><dt>Licitado por</dt><dd>${millones(c.li)} <span class="tenue">(${c.a < c.li ? 'baja' : 'sube'} un ${Math.abs(Math.round((1 - c.a / c.li) * 100))} %)</span></dd></div>` : ''}
    </dl>
    <p class="etiquetas">${[c.n, c.fi, c.ti].filter(Boolean).map((e) => `<span>${esc(e)}</span>`).join('')}
      ${c.u ? `<a href="${esc(c.u)}" rel="noopener">Ver el expediente</a>` : ''}</p>
  </li>`;
}

function fichaSubvencion(s) {
  return `<li class="resultado">
    <div class="resultado-cabeza">
      <h3>${esc(s.c || 'Subvención')}</h3>
      <p class="resultado-importe">${millones(s.i)}<small>concedido</small></p>
    </div>
    <dl class="resultado-datos">
      <div><dt>Paga</dt><dd>${esc(s.o)}${s.l ? ` <span class="tenue">(${esc(s.l)})</span>` : ''}</dd></div>
      <div><dt>Recibe</dt><dd>${esc(s.b)}</dd></div>
      <div><dt>Fecha</dt><dd>${fechaCorta(s.f)}</dd></div>
    </dl>
    <p class="etiquetas"><span>${esc(s.n)}</span>${s.u ? `<a href="${esc(s.u)}" rel="noopener">Ver la convocatoria</a>` : ''}</p>
  </li>`;
}

async function pintar() {
  guardarUrl();
  document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === estado.tab)));
  $('panel').setAttribute('aria-labelledby', `tab-${estado.tab}`);
  $('nivel').value = estado.nivel;
  const resumen = $('resumen-lupa');
  const lista = $('resultados');
  const mas = $('mas');

  let d;
  try {
    d = await datos(estado.tab);
  } catch {
    resumen.textContent = 'Estos datos no están disponibles ahora mismo. Prueba en un rato.';
    lista.replaceChildren();
    mas.hidden = true;
    return;
  }

  if (estado.tab === 'ayuda') {
    pintarAyuda(d);
    return;
  }

  const contratos = estado.tab === 'contratos';
  const todos = contratos ? d.contratos : d.subvenciones;
  const campos = contratos ? ['t', 'o', 'g', 'l', 'fi', 'ti', 'n'] : ['c', 'o', 'b', 'l', 'n'];
  const importe = contratos ? 'a' : 'i';
  let r = buscar(todos, estado.q, { campos, importe, tema: estado.tema });
  if (estado.nivel) r = r.filter((x) => x.n === estado.nivel);

  const total = suma(r, importe);
  const que = contratos ? (r.length === 1 ? 'contrato' : 'contratos') : r.length === 1 ? 'subvención' : 'subvenciones';
  const filtro = [estado.q && `«${estado.q}»`, estado.tema && TEMAS.find((t) => t.id === estado.tema)?.nombre.toLowerCase(), estado.nivel && estado.nivel.toLowerCase()]
    .filter(Boolean)
    .join(', ');
  resumen.innerHTML = r.length
    ? `<strong>${new Intl.NumberFormat('es-ES').format(r.length)} ${que}</strong> por <strong>${millones(total)}</strong>${filtro ? ` con ${esc(filtro)}` : ''}.`
    : `No hay ${contratos ? 'contratos' : 'subvenciones'}${filtro ? ` con ${esc(filtro)}` : ''} en lo que cubre la Lupa.`;
  lista.innerHTML = r.slice(0, estado.mostrados).map(contratos ? fichaContrato : fichaSubvencion).join('');
  mas.hidden = r.length <= estado.mostrados;
  mas.textContent = `Ver más (quedan ${new Intl.NumberFormat('es-ES').format(r.length - estado.mostrados)})`;
}

function pintarAyuda(d) {
  const años = d.años ?? [];
  const ultimo = años.at(-1);
  const anterior = años.at(-2);
  const q = normalizar(estado.q);
  const filas = Object.entries(d.paises)
    .map(([iso, v]) => ({ iso, nombre: nombrePais(iso) ?? iso, ultimo: v[ultimo] ?? 0, anterior: v[anterior] ?? null, suma: años.reduce((t, a) => t + (v[a] ?? 0), 0) }))
    .filter((p) => p.ultimo > 0 || p.suma > 0)
    .filter((p) => !q || normalizar(p.nombre).includes(q) || p.iso.toLowerCase() === q)
    .sort((a, b) => b.ultimo - a.ultimo || b.suma - a.suma);
  const total = filas.reduce((t, p) => t + p.ultimo, 0);
  const md = (n) => `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: n >= 100 ? 0 : 1 }).format(n)} millones de $`;
  $('resumen-lupa').innerHTML = filas.length
    ? `En ${ultimo}, España dio <strong>${md(total)}</strong> de ayuda oficial al desarrollo a ${filas.length === 1 ? esc(filas[0].nombre) : `<strong>${filas.length} países</strong>`}. Solo lo asignado a un país concreto; la ayuda a organismos internacionales y a regiones va aparte.`
    : `No hay ayuda de España a «${esc(estado.q)}» en ${años[0]}-${ultimo}.`;
  $('resultados').innerHTML = filas
    .slice(0, estado.mostrados)
    .map(
      (p) => `<li class="resultado resultado-pais">
        <div class="resultado-cabeza">
          <h3>${esc(p.nombre)}</h3>
          <p class="resultado-importe">${md(p.ultimo)}<small>en ${ultimo}${p.anterior !== null ? ` · ${md(p.anterior)} en ${anterior}` : ''}</small></p>
        </div>
        <p class="tenue">${años.map((a) => `${a}: ${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(d.paises[p.iso][a] ?? 0)}`).join(' · ')}</p>
      </li>`
    )
    .join('');
  $('mas').hidden = filas.length <= estado.mostrados;
  $('mas').textContent = `Ver más (quedan ${filas.length - estado.mostrados})`;
}

async function pintarCobertura() {
  const caja = $('cobertura');
  const textos = {
    contratos: async () => {
      const d = await datos('contratos');
      return `<p><strong>Contratos adjudicados desde ${millones(d.umbral)} (sin IVA)</strong> publicados en la <a href="https://contrataciondelestado.es/">Plataforma de Contratación del Sector Público</a>, incluidos los de las plataformas propias de comunidades y ayuntamientos que se agregan a ella. Recoge los movimientos desde el ${fecha(d.desde)} y los va reuniendo cada día, así que el histórico crece solo.</p>
        <p><strong>Lo que no aparece:</strong> los contratos menores y los de menos de un millón; lo que una plataforma propia no haya enviado a la estatal; y lo que se paga al final, que puede cambiar por modificados o revisiones de precio. Los adjudicatarios que son personas físicas aparecen sin nombre.</p>`;
    },
    subvenciones: async () => {
      const d = await datos('subvenciones');
      return `<p><strong>Subvenciones y ayudas concedidas desde ${millones(d.umbral)}</strong> en los últimos 12 meses, de la <a href="https://www.infosubvenciones.es/">Base de Datos Nacional de Subvenciones</a>, que reúne las del Estado, comunidades y ayuntamientos.</p>
        <p><strong>Lo que no aparece:</strong> las de menos de un millón; las concedidas a personas físicas (por privacidad); y las que una administración no haya registrado, aunque la ley obliga a hacerlo. Una subvención concedida no siempre se paga entera.</p>`;
    },
    ayuda: async () => {
      const d = await datos('ayuda');
      return `<p><strong>Ayuda oficial al desarrollo de España por país</strong> (desembolsos, en millones de dólares de cada año), de la <a href="https://data-explorer.oecd.org/">OCDE</a>, que recoge lo que declara la Cooperación Española. Datos de ${d.años[0]} a ${d.años.at(-1)}.</p>
        <p><strong>Lo que no aparece:</strong> la ayuda a organismos internacionales (ONU, Banco Mundial, UE) y a regiones sin un país concreto, que es una parte importante; y el detalle proyecto a proyecto. Los datos de un año se publican a finales del año siguiente.</p>`;
    },
  };
  try {
    caja.innerHTML = await textos[estado.tab]();
  } catch {
    caja.innerHTML = '<p>Sin datos de cobertura ahora mismo.</p>';
  }
}

// ---------------------------------------------------------------------------
// Eventos

document.querySelectorAll('[data-tab]').forEach((b) =>
  b.addEventListener('click', () => {
    estado.tab = b.dataset.tab;
    estado.mostrados = POR_PAGINA;
    pintarTemas();
    pintar();
    pintarCobertura();
  })
);
$('buscador').addEventListener('submit', (e) => {
  e.preventDefault();
  estado.q = $('q').value.trim();
  estado.mostrados = POR_PAGINA;
  pintar();
});
let espera;
$('q').addEventListener('input', () => {
  clearTimeout(espera);
  espera = setTimeout(() => {
    estado.q = $('q').value.trim();
    estado.mostrados = POR_PAGINA;
    pintar();
  }, 250);
});
$('nivel').addEventListener('change', () => {
  estado.nivel = $('nivel').value;
  estado.mostrados = POR_PAGINA;
  pintar();
});
$('mas').addEventListener('click', () => {
  estado.mostrados += POR_PAGINA;
  pintar();
});

$('q').value = estado.q;
pintarTemas();
pintar();
pintarCobertura();

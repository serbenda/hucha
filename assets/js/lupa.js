// La Lupa: buscador de contratos, subvenciones y ayuda a otros países.
// Los datos se cargan al abrir cada pestaña; la búsqueda se hace en el navegador.
// El estado (pestaña, búsqueda, tema, nivel) va en la URL para poder compartir una búsqueda.

import { TEMAS, buscar, totales, normalizar } from './lupa-datos.js';
import { nombrePais } from './paises.js';
import { euros, fecha } from './formato.js';
import { barras, columnas } from './graficos.js';
import { icono, ICONO_TEMA } from './iconos.js';

const $ = (id) => document.getElementById(id);
const POR_PAGINA = 40;
const millones = (n) => {
  const texto = new Intl.NumberFormat('es-ES', { maximumFractionDigits: n >= 100e6 ? 0 : 1 }).format(n / 1e6);
  return `${texto} ${texto === '1' ? 'millón' : 'millones'} de €`;
};
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

function pedir(fichero) {
  cache[fichero] ??= fetch(new URL(`../../data/lupa/${fichero}.json`, import.meta.url), { cache: 'no-cache' }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });
  return cache[fichero];
}

// Al abrir la Lupa basta con el índice: los mayores, los totales por tema y por administración y la lista de
// meses. Los meses se piden al buscar, filtrar o ver más; así la Lupa pesa lo mismo aunque el histórico crezca.
const enPortada = () => !estado.q && !estado.tema && !estado.nivel && estado.mostrados <= POR_PAGINA;
const indice = (tab) => pedir(tab === 'ayuda' ? 'ayuda' : tab);
const mesesDe = (d) => d.meses ?? [];
// En cuanto se va a buscar o filtrar, los meses se empiezan a pedir para que estén listos
const preparar = () =>
  estado.tab !== 'ayuda' &&
  indice(estado.tab)
    .then((d) => mesesDe(d).forEach(({ mes }) => pedir(`${estado.tab}/${mes}`).catch(() => {})))
    .catch(() => {});

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

// Los botones de temas ya vienen en el HTML (así la página no se mueve al cargar); aquí solo se marcan
function pintarTemas() {
  const visible = estado.tab !== 'ayuda';
  $('filtros').hidden = !visible;
  $('temas').querySelectorAll('[data-tema]').forEach((b) => b.setAttribute('aria-pressed', String(estado.tema === b.dataset.tema)));
}
$('temas').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tema]');
  if (!b) return;
  estado.tema = b.dataset.tema;
  estado.mostrados = POR_PAGINA;
  pintarTemas();
  pintar();
});

function fichaContrato(c) {
  return `<li class="resultado">
    <div class="resultado-cabeza">
      <h3>${esc(c.t)}</h3>
      <p class="resultado-importe">${millones(c.a)}<small>${c.m ? 'como máximo, sin IVA' : 'adjudicado, sin IVA'}</small></p>
    </div>
    <dl class="resultado-datos">
      <div><dt>Paga</dt><dd>${esc(c.o)}${c.l ? ` <span class="tenue">(${esc(c.l)})</span>` : ''}</dd></div>
      <div><dt>Gana</dt><dd>${esc(c.g?.join(', ') || 'Sin dato')}</dd></div>
      <div><dt>Fecha</dt><dd>${fechaCorta(c.f)}</dd></div>
      ${c.li && Math.abs(c.li - c.a) / c.li > 0.005 ? `<div><dt>Licitado por</dt><dd>${millones(c.li)} <span class="tenue">(${c.a < c.li ? 'baja' : 'sube'} un ${Math.abs(Math.round((1 - c.a / c.li) * 100))} %)</span></dd></div>` : ''}
    </dl>
    ${c.m ? '<p class="nota-marco"><strong>Acuerdo marco:</strong> es un techo de lo que se podrá gastar con contratos posteriores, no dinero ya comprometido. No suma en los totales.</p>' : ''}
    <p class="etiquetas">${[c.m && 'Acuerdo marco', c.n, c.fi, c.ti].filter(Boolean).map((e) => `<span>${esc(e)}</span>`).join('')}
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

let turno = 0;
async function pintar() {
  const mio = ++turno;
  guardarUrl();
  document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === estado.tab)));
  $('panel').setAttribute('aria-labelledby', `tab-${estado.tab}`);
  $('nivel').value = estado.nivel;
  const resumen = $('resumen-lupa');
  const lista = $('resultados');
  const mas = $('mas');

  let d;
  try {
    d = await indice(estado.tab);
    if (mio !== turno) return; // ya hay otra búsqueda más nueva
  } catch {
    if (mio !== turno) return;
    resumen.textContent = 'Estos datos no están disponibles ahora mismo. Prueba en un rato.';
    lista.replaceChildren();
    mas.hidden = true;
    return;
  }

  if (estado.tab === 'ayuda') {
    $('panorama-rejilla').replaceChildren();
    pintarAyuda(d);
    return;
  }

  const contratos = estado.tab === 'contratos';
  pintarPanorama(d, contratos);
  const clave = contratos ? 'contratos' : 'subvenciones';
  const campos = contratos ? ['t', 'o', 'g', 'l', 'fi', 'ti', 'n'] : ['c', 'o', 'b', 'l', 'n'];
  const importe = contratos ? 'a' : 'i';
  const filtrar = (todos) => {
    const r = buscar(todos, estado.q, { campos, importe, tema: estado.tema });
    return estado.nivel ? r.filter((x) => x.n === estado.nivel) : r;
  };
  const meses = mesesDe(d);

  // Sin buscar ni filtrar, o con un índice antiguo sin meses: todo sale del índice
  if (enPortada() || !meses.length) {
    const r = filtrar(d[clave]);
    const t = enPortada() && d.total ? d.total : totales(r, importe);
    pintarResultados(t, r, { contratos, disponibles: Math.max(t.n, r.length) });
    return;
  }

  // Con un solo filtro, el total ya viene en el índice y se enseña al momento
  const rapido = !estado.q && (estado.tema && !estado.nivel ? d.porTema?.[estado.tema] : estado.nivel && !estado.tema ? d.porNivel?.[estado.nivel] : null);
  let cargados = [];
  let hechos = 0;
  let fallos = 0;
  let pendiente = false;
  const repintar = () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => {
      pendiente = false;
      if (mio !== turno) return;
      const r = filtrar(cargados);
      const completo = hechos === meses.length;
      pintarResultados(completo || !rapido ? totales(r, importe) : rapido, r, {
        contratos,
        progreso: completo ? (fallos ? `No se han podido cargar ${fallos} de ${meses.length} meses.` : '') : `Buscando en ${hechos} de ${meses.length} meses…`,
      });
    });
  };
  if (rapido) pintarResultados(rapido, [], { contratos, progreso: 'Cargando la lista…' });
  else resumen.textContent = 'Buscando…';
  await Promise.all(
    meses.map(({ mes }) =>
      pedir(`${estado.tab}/${mes}`)
        .then((m) => {
          cargados = cargados.concat(m[clave] ?? []);
        })
        .catch(() => fallos++)
        .finally(() => {
          hechos++;
          repintar();
        })
    )
  );
}

// Panorama: de un vistazo, en qué temas, quién paga y mes a mes. Pulsar una barra filtra la lista.
const NIVELES = ['Estado', 'Comunidades', 'Ayuntamientos', 'Universidades', 'Otros'];
const mesCorto = (mes) => new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit' }).format(new Date(`${mes}-15`));
const mesLargo = (mes) => new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(`${mes}-15`));
function pintarPanorama(d, contratos) {
  const caja = $('panorama-rejilla');
  if (!d.porTema && !d.porNivel) {
    caja.replaceChildren();
    return;
  }
  const que = contratos ? 'contratos' : 'subvenciones';
  const fila = (t) => `${new Intl.NumberFormat('es-ES').format(t.n - (t.marcos?.n ?? 0))} ${que}`;
  const temas = TEMAS.filter((t) => d.porTema?.[t.id]?.suma > 0)
    .map((t) => ({ id: t.id, nombre: t.nombre, valor: d.porTema[t.id].suma, texto: millones(d.porTema[t.id].suma), nota: fila(d.porTema[t.id]), icono: icono(ICONO_TEMA[t.id]) }))
    .sort((a, b) => b.valor - a.valor);
  const niveles = NIVELES.filter((n) => d.porNivel?.[n]?.suma > 0).map((n) => ({ id: n, nombre: n, valor: d.porNivel[n].suma, texto: millones(d.porNivel[n].suma), nota: fila(d.porNivel[n]) }));
  const meses = [...(d.meses ?? [])].filter((m) => m.mes !== 'sin-fecha').reverse();
  const bloque = (titulo, texto, contenido) => (contenido ? `<div class="panorama-bloque"><h3>${titulo}</h3><p class="tenue">${texto}</p>${contenido}</div>` : '');
  caja.innerHTML =
    bloque('Por tema', `Importe ${contratos ? 'adjudicado' : 'concedido'}. Un ${contratos ? 'contrato' : 'pago'} puede estar en varios temas. Pulsa uno para ver la lista.`, barras(temas.slice(0, 8), { accion: 'p-tema', activo: estado.tema })) +
    bloque('Quién paga', 'Pulsa una administración para ver lo suyo.', barras(niveles, { accion: 'p-nivel', activo: estado.nivel })) +
    (meses.length > 1 ? bloque('Mes a mes', `Importe ${contratos ? 'adjudicado' : 'concedido'} cada mes, sin acuerdos marco.`, columnas(meses.map((m) => ({ etiqueta: mesLargo(m.mes), corta: mesCorto(m.mes), valor: m.suma ?? 0, texto: millones(m.suma ?? 0), rotulo: `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format((m.suma ?? 0) / 1e6)} M€` })), { titulo: 'Importe por mes' })) : '');
}
$('panorama-rejilla').addEventListener('click', (e) => {
  const b = e.target.closest('[data-p-tema], [data-p-nivel]');
  if (!b) return;
  if (b.dataset.pTema !== undefined) estado.tema = estado.tema === b.dataset.pTema ? '' : b.dataset.pTema;
  else estado.nivel = estado.nivel === b.dataset.pNivel ? '' : b.dataset.pNivel;
  estado.mostrados = POR_PAGINA;
  pintarTemas();
  pintar().then(() => $('resumen-lupa').scrollIntoView({ block: 'start', behavior: 'smooth' }));
});

function pintarResultados(t, r, { contratos, progreso = '', disponibles = r.length }) {
  const resumen = $('resumen-lupa');
  const lista = $('resultados');
  const mas = $('mas');
  const { n } = t;
  const nm = t.marcos?.n ?? 0;
  const fmt = (x) => new Intl.NumberFormat('es-ES').format(x);
  const cuantos = (x) => (contratos ? `${fmt(x)} ${x === 1 ? 'contrato' : 'contratos'}` : `${fmt(x)} ${x === 1 ? 'subvención' : 'subvenciones'}`);
  const filtro = [estado.q && `«${estado.q}»`, estado.tema && TEMAS.find((x) => x.id === estado.tema)?.nombre.toLowerCase(), estado.nivel && estado.nivel.toLowerCase()]
    .filter(Boolean)
    .join(', ');
  const con = filtro ? ` con ${esc(filtro)}` : '';
  // Los acuerdos marco van aparte: su importe es un techo para contratos posteriores, no gasto
  const quien = nm === 1 ? 'un acuerdo marco' : `${fmt(nm)} acuerdos marco`;
  const techo = nm ? `con un techo de ${millones(t.marcos.suma)} para contratos posteriores, que no suma porque aún no es gasto` : '';
  const nota = progreso ? ` <span class="tenue">${esc(progreso)}</span>` : '';
  resumen.innerHTML =
    (!n
      ? progreso ? '' : `No hay ${contratos ? 'contratos' : 'subvenciones'}${con} en lo que cubre la Lupa.`
      : n > nm
        ? `<strong>${cuantos(n - nm)}</strong> por <strong>${millones(t.suma)}</strong>${con}.${nm ? ` Además hay ${quien}, ${techo}.` : ''}`
        : `Solo hay ${quien}${con}, ${techo}.`) + nota;
  lista.innerHTML = r.slice(0, estado.mostrados).map(contratos ? fichaContrato : fichaSubvencion).join('');
  mas.hidden = progreso !== '' || disponibles <= estado.mostrados;
  mas.textContent = `Ver más (quedan ${fmt(disponibles - estado.mostrados)})`;
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
      const d = await indice('contratos');
      return `<p><strong>Contratos adjudicados desde ${millones(d.umbral)} (sin IVA)</strong> publicados en la <a href="https://contrataciondelestado.es/">Plataforma de Contratación del Sector Público</a>, incluidos los de las plataformas propias de comunidades y ayuntamientos que se agregan a ella. Recoge los movimientos desde el ${fecha(d.desde)} y los va reuniendo cada día, así que el histórico crece solo.</p>
        <p><strong>Los acuerdos marco</strong> aparecen con su importe máximo y no suman en los totales: fijan un techo para contratos posteriores, no un gasto. Esos contratos posteriores, si pasan del millón, aparecen por su cuenta.</p>
        <p><strong>Lo que no aparece:</strong> los contratos menores y los de menos de un millón; lo que una plataforma propia no haya enviado a la estatal; y lo que se paga al final, que puede cambiar por modificados o revisiones de precio. Los adjudicatarios que son personas físicas aparecen sin nombre.</p>`;
    },
    subvenciones: async () => {
      const d = await indice('subvenciones');
      return `<p><strong>Subvenciones y ayudas concedidas desde ${millones(d.umbral)}</strong> en los últimos 12 meses, de la <a href="https://www.infosubvenciones.es/">Base de Datos Nacional de Subvenciones</a>, que reúne las del Estado, comunidades y ayuntamientos.</p>
        <p><strong>Lo que no aparece:</strong> las de menos de un millón; las concedidas a personas físicas (por privacidad); y las que una administración no haya registrado, aunque la ley obliga a hacerlo. Una subvención concedida no siempre se paga entera.</p>`;
    },
    ayuda: async () => {
      const d = await indice('ayuda');
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
for (const id of ['buscador', 'filtros']) {
  $(id).addEventListener('focusin', preparar);
  $(id).addEventListener('pointerdown', preparar);
}
$('mas').addEventListener('click', () => {
  estado.mostrados += POR_PAGINA;
  pintar();
});

$('q').value = estado.q;
pintarTemas();
// Los datos son pesados: se piden cuando ya está pintada la página con su letra, para no retrasarla
const listo = document.fonts?.ready ?? Promise.resolve();
listo.then(() => requestAnimationFrame(() => {
  pintar();
  pintarCobertura();
}));

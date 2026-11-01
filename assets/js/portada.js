// Portada: el ticket de tus impuestos y las cifras de todos.

import { cargarVista } from './datos.js';
import { cien, activarCien } from './graficos.js';
import { colorPartida, tieneColor } from './colores.js';
import { aportacion, repartir, REGLAS } from './impuestos.js';
import { icono, ICONO_PARTIDA } from './iconos.js';
import { euros, porcentaje, millones, delPib, leerImporte } from './formato.js';
import { t, LOCALE, EN } from './idioma.js';
import { PARTIDAS, en, enQue } from './en.js';

const $ = (id) => document.getElementById(id);
const entrada = $('bruto');
const conEmpresa = $('empresa');

// En inglés, los importes del HTML (escritos con punto de miles) se reescriben con coma: 30,000 y €23,000
if (EN) {
  entrada.value = new Intl.NumberFormat(LOCALE).format(30000);
  document.querySelectorAll('[data-sueldo]').forEach((b) => {
    if (/^[\d.]+\s€$/.test(b.textContent.trim())) b.textContent = euros(Number(b.dataset.sueldo));
  });
}

// El sueldo puede venir en el enlace (?sueldo=30000&empresa=1): no lo generamos al compartir, pero se acepta
const params = new URLSearchParams(location.search);
if (leerImporte(params.get('sueldo')) > 0) entrada.value = new Intl.NumberFormat(LOCALE).format(leerImporte(params.get('sueldo')));
if (params.get('empresa') === '1') conEmpresa.checked = true;

let lista = [];
let año = null;

function linea(nombre, importe, { clase = '', titulo = '', extra = '', id = '' } = {}) {
  const div = document.createElement('div');
  div.className = `linea-ticket ${clase}`.trim();
  const dt = document.createElement('dt');
  dt.textContent = nombre;
  if (ICONO_PARTIDA[id]) dt.insertAdjacentHTML('afterbegin', icono(ICONO_PARTIDA[id]));
  if (titulo) dt.title = titulo;
  const dd = document.createElement('dd');
  if (extra) {
    const small = document.createElement('small');
    small.textContent = extra;
    dd.append(small);
  }
  dd.append(importe);
  div.append(dt, dd);
  return div;
}

function pintarTicket() {
  const bruto = leerImporte(entrada.value);
  const a = aportacion(bruto);
  const aporte = $('aporte');
  const reparto = $('reparto');

  if (!a) {
    aporte.replaceChildren(linea(t('Escribe tu sueldo bruto anual', 'Enter your gross yearly salary'), ''));
    reparto.replaceChildren();
    $('resumen').replaceChildren();
    return;
  }

  const filas = [
    linea('IRPF', euros(a.irpf), { titulo: t('Impuesto sobre la renta, estimado con las reglas de retención de la Agencia Tributaria', 'Personal income tax, estimated with the Spanish Tax Agency withholding rules') }),
    linea(t('Seguridad Social', 'Social Security'), euros(a.cotizacionTrabajador), { titulo: t('Tu parte de las cotizaciones', 'Your share of contributions') }),
  ];
  if (conEmpresa.checked) filas.push(linea(t('Seguridad Social (tu empresa)', 'Social Security (your employer)'), euros(a.cotizacionEmpresa), { clase: 'empresa' }));
  const total = conEmpresa.checked ? a.conEmpresa : a.tuyo;
  filas.push(linea('Total', euros(total), { clase: 'total' }));
  aporte.replaceChildren(...filas);

  // En el móvil el ticket queda debajo: un resumen junto al campo para que se vea que algo ha cambiado
  const resumen = $('resumen');
  resumen.replaceChildren(t('Pones ', 'You put in '), Object.assign(document.createElement('strong'), { textContent: euros(total) }), t(' al año · ', ' a year · '));
  const ir = Object.assign(document.createElement('a'), { href: '#ticket', textContent: t('ver a dónde va ↓', 'see where it goes ↓') });
  resumen.append(ir);

  if (!lista.length) return;
  const repartidas = repartir(total, lista);
  reparto.replaceChildren(...repartidas.map((p) => linea(p.nombre, euros(p.euros), { titulo: p.que, extra: porcentaje(p.cuota), id: p.id })));

  $('ticket-pie').textContent =
    t(
      `Si ganas ${euros(bruto)} brutos, te quedan unos ${euros(a.neto)} netos al año. Reparto según el gasto público de ${año}${vista?.provisional ? ' (provisional)' : ''}. Reglas fiscales de ${REGLAS.año}. Estimación orientativa.`,
      `If you earn ${euros(bruto)} gross, you keep about ${euros(a.neto)} net a year. Split according to public spending in ${año}${vista?.provisional ? ' (provisional)' : ''}. ${REGLAS.año} tax rules. Rough estimate.`
    );
}

let vista = null;

function pintarCifras(v) {
  const { total, pib, pibUe } = v;
  const cifras = $('cifras').querySelectorAll('dd');
  const cifra = (dd, dato, nota) => {
    const small = document.createElement('small');
    small.textContent = nota || '\u00a0';
    dd.replaceChildren(dato, small);
  };
  cifra(cifras[0], millones(total), t(`en ${año}`, `in ${año}`));
  cifra(cifras[1], euros(v.porPersona), t('al año, contando a todos: niños, jubilados…', 'a year, counting everyone: children, pensioners…'));
  cifra(cifras[2], delPib(pib), pibUe !== null ? t(`La media de la Unión Europea: ${delPib(pibUe).replace(' del PIB', '')}`, `European Union average: ${delPib(pibUe).replace(' of GDP', '')}`) : '');
  $('todos-texto').textContent =
    t(
      `En ${año}${v.provisional ? ' (datos provisionales)' : ''}, todas las administraciones juntas (Estado, comunidades, ayuntamientos y Seguridad Social) gastaron esto.`,
      `In ${año}${v.provisional ? ' (provisional data)' : ''}, all administrations together (central government, regions, local councils and Social Security) spent this.`
    );
}

let espera;
entrada.addEventListener('input', () => {
  clearTimeout(espera);
  espera = setTimeout(pintarTicket, 120);
});
conEmpresa.addEventListener('change', pintarTicket);
// «Ver mi ticket» (o Intro): en el móvil, el teclado numérico no tiene tecla para cerrarse y el ticket queda
// debajo; el botón cierra el teclado y lleva al ticket
$('formulario').addEventListener('submit', (e) => {
  e.preventDefault();
  clearTimeout(espera);
  pintarTicket();
  entrada.blur();
  if (matchMedia('(max-width: 760px)').matches) $('ticket').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
});
document.querySelectorAll('[data-sueldo]').forEach((b) =>
  b.addEventListener('click', () => {
    entrada.value = new Intl.NumberFormat(LOCALE).format(Number(b.dataset.sueldo));
    pintarTicket();
  })
);

$('compartir').addEventListener('click', async () => {
  // Se comparte el reparto en porcentajes, nunca el sueldo
  const url = new URL('./', location.href).href;
  const principales = lista.slice(0, 3).map((p) => t(`${Math.round(p.cuota * 100)} € a ${p.nombre.toLowerCase()}`, `€${Math.round(p.cuota * 100)} to ${p.nombre.toLowerCase()}`));
  const texto = lista.length
    ? t(`De cada 100 € de gasto público en España, ${principales.join(', ')}. Mira a dónde van tus impuestos:`, `Out of every €100 of public spending in Spain, ${principales.join(', ')}. See where your taxes go:`)
    : t('Mira a dónde van tus impuestos:', 'See where your taxes go:');
  const boton = $('compartir');
  try {
    if (navigator.share) await navigator.share({ title: t('hucha: a dónde va el dinero público', 'hucha: where Spain’s public money goes'), text: texto, url });
    else {
      await navigator.clipboard.writeText(`${texto} ${url}`);
      boton.textContent = t('Copiado', 'Copied');
      setTimeout(() => (boton.textContent = t('Compartir el reparto', 'Share the breakdown')), 2500);
    }
  } catch {}
});

pintarTicket();

try {
  vista = await cargarVista('portada');
  año = vista.año;
  lista = vista.partidas.map((p) => ({ ...p, nombre: en(PARTIDAS, p.id, p.nombre), que: enQue(PARTIDAS, p.id, p.que) }));
  $('ticket-año').textContent = t(`Gasto público de España en ${año}`, `Public spending in Spain, ${año}`);
  pintarTicket();
  pintarCifras(vista);
  // De cada 100 €: las partidas con color propio y, en gris, las demás juntas
  const conColor = lista.filter((p) => tieneColor(p.id));
  const otras = lista.filter((p) => !tieneColor(p.id));
  const resto = otras.reduce((t, p) => t + p.cuota, 0);
  const euros100 = (c) => { const n = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: c < 0.1 ? 1 : 0 }).format(c * 100); return t(`${n} €`, `€${n}`); };
  $('mapa').innerHTML = cien(
    [
      ...conColor.map((p) => ({ id: p.id, nombre: p.nombre, valor: p.cuota, color: colorPartida(p.id), texto: euros100(p.cuota), href: `a-donde-va/#p-${p.id}` })),
      ...(otras.length ? [{ id: 'otras', nombre: t(`Otras ${otras.length} partidas`, `${otras.length} other items`), nota: otras.map((p) => p.nombre.toLowerCase()).join(', '), valor: resto, color: 'var(--serie-otros)', texto: euros100(resto), href: 'a-donde-va/#t-partidas' }] : []),
    ],
    { titulo: t('De cada 100 € de gasto público', 'Out of every €100 of public spending') }
  );
  activarCien($('mapa'));
} catch {
  $('reparto').replaceChildren(linea(t('Sin datos ahora mismo', 'No data right now'), ''));
}

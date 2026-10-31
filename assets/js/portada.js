// Portada: el ticket de tus impuestos y las cifras de todos.

import { cargarDatos } from './datos.js';
import { partidas, ultimoAño, esProvisional, gastoPorPersona, valor } from './cofog.js';
import { aportacion, repartir, REGLAS } from './impuestos.js';
import { euros, porcentaje, millones, delPib, leerImporte } from './formato.js';

const $ = (id) => document.getElementById(id);
const entrada = $('bruto');
const conEmpresa = $('empresa');

// El sueldo puede venir en el enlace (?sueldo=30000&empresa=1) para compartir el ticket
const params = new URLSearchParams(location.search);
if (leerImporte(params.get('sueldo')) > 0) entrada.value = new Intl.NumberFormat('es-ES').format(leerImporte(params.get('sueldo')));
if (params.get('empresa') === '1') conEmpresa.checked = true;

let lista = [];
let año = null;

function linea(nombre, importe, { clase = '', titulo = '', extra = '' } = {}) {
  const div = document.createElement('div');
  div.className = `linea-ticket ${clase}`.trim();
  const dt = document.createElement('dt');
  dt.textContent = nombre;
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
    aporte.replaceChildren(linea('Escribe tu sueldo bruto anual', ''));
    reparto.replaceChildren();
    return;
  }

  const filas = [
    linea('IRPF', euros(a.irpf), { titulo: 'Impuesto sobre la renta, estimado con las reglas de retención de la Agencia Tributaria' }),
    linea('Seguridad Social', euros(a.cotizacionTrabajador), { titulo: 'Tu parte de las cotizaciones' }),
  ];
  if (conEmpresa.checked) filas.push(linea('Seguridad Social (tu empresa)', euros(a.cotizacionEmpresa), { clase: 'empresa' }));
  const total = conEmpresa.checked ? a.conEmpresa : a.tuyo;
  filas.push(linea('Total', euros(total), { clase: 'total' }));
  aporte.replaceChildren(...filas);

  if (!lista.length) return;
  const repartidas = repartir(total, lista);
  reparto.replaceChildren(...repartidas.map((p) => linea(p.nombre, euros(p.euros), { titulo: p.que, extra: porcentaje(p.cuota) })));

  $('ticket-pie').textContent =
    `Si ganas ${euros(bruto)} brutos, te quedan unos ${euros(a.neto)} netos al año. ` +
    `Reparto según el gasto público de ${año}${esProvisional(datosGlobal, año) ? ' (provisional)' : ''}. Reglas fiscales de ${REGLAS.año}. Estimación orientativa.`;
}

let datosGlobal = null;

function pintarCifras(datos) {
  const total = valor(datos, 'TOTAL', año);
  const pib = valor(datos, 'TOTAL', año, { unidad: 'PC_GDP' });
  const pibUe = valor(datos, 'TOTAL', año, { geo: 'ue', unidad: 'PC_GDP' });
  const cifras = $('cifras').querySelectorAll('dd');
  cifras[0].textContent = millones(total);
  cifras[1].textContent = euros(gastoPorPersona(datos, año));
  cifras[1].insertAdjacentHTML('beforeend', '<small>al año, contando a todos: niños, jubilados…</small>');
  cifras[2].textContent = delPib(pib);
  if (pibUe !== null) {
    const small = document.createElement('small');
    small.textContent = `La media de la Unión Europea: ${delPib(pibUe).replace(' del PIB', '')}`;
    cifras[2].append(small);
  }
  $('todos-texto').textContent =
    `En ${año}${esProvisional(datos, año) ? ' (datos provisionales)' : ''}, todas las administraciones juntas (Estado, comunidades, ayuntamientos y Seguridad Social) gastaron esto.`;
}

let espera;
entrada.addEventListener('input', () => {
  clearTimeout(espera);
  espera = setTimeout(pintarTicket, 120);
});
conEmpresa.addEventListener('change', pintarTicket);
$('formulario').addEventListener('submit', (e) => {
  e.preventDefault();
  pintarTicket();
});
document.querySelectorAll('[data-sueldo]').forEach((b) =>
  b.addEventListener('click', () => {
    entrada.value = new Intl.NumberFormat('es-ES').format(Number(b.dataset.sueldo));
    pintarTicket();
  })
);

$('compartir').addEventListener('click', async () => {
  const bruto = leerImporte(entrada.value);
  const url = new URL(location.href);
  url.search = '';
  if (bruto) url.searchParams.set('sueldo', String(Math.round(bruto)));
  if (conEmpresa.checked) url.searchParams.set('empresa', '1');
  const texto = 'Mira a dónde van mis impuestos';
  try {
    if (navigator.share) await navigator.share({ title: 'Mi ticket de hucha', text: texto, url: url.href });
    else {
      await navigator.clipboard.writeText(url.href);
      $('compartir').textContent = 'Enlace copiado';
      setTimeout(() => ($('compartir').textContent = 'Compartir mi ticket'), 2500);
    }
  } catch {}
});

pintarTicket();

try {
  datosGlobal = await cargarDatos();
  año = ultimoAño(datosGlobal);
  lista = partidas(datosGlobal, año);
  $('ticket-año').textContent = `Gasto público de España en ${año}`;
  pintarTicket();
  pintarCifras(datosGlobal);
} catch {
  $('reparto').replaceChildren(linea('Sin datos ahora mismo', ''));
}

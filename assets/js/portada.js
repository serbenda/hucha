// Portada: el ticket de tus impuestos y las cifras de todos.

import { cargarVista } from './datos.js';
import { aportacion, repartir, REGLAS } from './impuestos.js';
import { icono, ICONO_PARTIDA } from './iconos.js';
import { euros, porcentaje, millones, delPib, leerImporte } from './formato.js';

const $ = (id) => document.getElementById(id);
const entrada = $('bruto');
const conEmpresa = $('empresa');

// El sueldo puede venir en el enlace (?sueldo=30000&empresa=1): no lo generamos al compartir, pero se acepta
const params = new URLSearchParams(location.search);
if (leerImporte(params.get('sueldo')) > 0) entrada.value = new Intl.NumberFormat('es-ES').format(leerImporte(params.get('sueldo')));
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
    aporte.replaceChildren(linea('Escribe tu sueldo bruto anual', ''));
    reparto.replaceChildren();
    $('resumen').replaceChildren();
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

  // En el móvil el ticket queda debajo: un resumen junto al campo para que se vea que algo ha cambiado
  const resumen = $('resumen');
  resumen.replaceChildren('Pones ', Object.assign(document.createElement('strong'), { textContent: euros(total) }), ' al año · ');
  const ir = Object.assign(document.createElement('a'), { href: '#ticket', textContent: 'ver a dónde va ↓' });
  resumen.append(ir);

  if (!lista.length) return;
  const repartidas = repartir(total, lista);
  reparto.replaceChildren(...repartidas.map((p) => linea(p.nombre, euros(p.euros), { titulo: p.que, extra: porcentaje(p.cuota), id: p.id })));

  $('ticket-pie').textContent =
    `Si ganas ${euros(bruto)} brutos, te quedan unos ${euros(a.neto)} netos al año. ` +
    `Reparto según el gasto público de ${año}${vista?.provisional ? ' (provisional)' : ''}. Reglas fiscales de ${REGLAS.año}. Estimación orientativa.`;
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
  cifra(cifras[0], millones(total), `en ${año}`);
  cifra(cifras[1], euros(v.porPersona), 'al año, contando a todos: niños, jubilados…');
  cifra(cifras[2], delPib(pib), pibUe !== null ? `La media de la Unión Europea: ${delPib(pibUe).replace(' del PIB', '')}` : '');
  $('todos-texto').textContent =
    `En ${año}${v.provisional ? ' (datos provisionales)' : ''}, todas las administraciones juntas (Estado, comunidades, ayuntamientos y Seguridad Social) gastaron esto.`;
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
  // Se comparte el reparto en porcentajes, nunca el sueldo
  const url = new URL('./', location.href).href;
  const principales = lista.slice(0, 3).map((p) => `${Math.round(p.cuota * 100)} € a ${p.nombre.toLowerCase()}`);
  const texto = lista.length
    ? `De cada 100 € de gasto público en España, ${principales.join(', ')}. Mira a dónde van tus impuestos:`
    : 'Mira a dónde van tus impuestos:';
  const boton = $('compartir');
  try {
    if (navigator.share) await navigator.share({ title: 'hucha: a dónde va el dinero público', text: texto, url });
    else {
      await navigator.clipboard.writeText(`${texto} ${url}`);
      boton.textContent = 'Copiado';
      setTimeout(() => (boton.textContent = 'Compartir el reparto'), 2500);
    }
  } catch {}
});

pintarTicket();

try {
  vista = await cargarVista('portada');
  año = vista.año;
  lista = vista.partidas;
  $('ticket-año').textContent = `Gasto público de España en ${año}`;
  pintarTicket();
  pintarCifras(vista);
} catch {
  $('reparto').replaceChildren(linea('Sin datos ahora mismo', ''));
}

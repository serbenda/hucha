// «Presupuesto»: lo presupuestado por el Estado este año frente a lo que lleva gastado (IGAE).

import { cargarVista } from './datos.js';
import { avance, lineasDelAño } from './graficos.js';
import { MESES, nombreSeccion } from './ejecucion.js';
import { normalizar } from './lupa-datos.js';
import { fecha } from './formato.js';

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmt = (n, d = 0) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);
const pct = (x) => (x?.creditos > 0 && x.obligaciones !== null && x.obligaciones !== undefined ? x.obligaciones / x.creditos : null);
const textoPct = (v) => (v === null ? 'sin dato' : `${fmt(v * 100)} %`);
const millones = (n) => (n >= 1000 ? `${fmt(n / 1000, n >= 10000 ? 0 : 1)} mil millones de €` : `${fmt(n)} millones de €`);
const corto = (n) => (n >= 1000 ? `${fmt(n / 1000, 1)} mil M€` : `${fmt(n)} M€`);
const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();

/** Fila para el gráfico de avance: «61 % de 13,2 mil M€», con el año anterior debajo. */
const filaAvance = (x, { id, nombre } = {}) => {
  const v = pct(x);
  const ant = pct(x.anterior);
  return {
    id: id ?? x.nombre,
    nombre: nombre ?? x.nombre,
    valor: v ?? 0,
    texto: `${textoPct(v)} de ${corto(x.creditos)}`,
    nota: ant !== null ? `un año antes: ${textoPct(ant)}` : '',
  };
};

try {
  const v = await cargarVista('presupuesto');
  const nMes = Number(v.mes.slice(5));
  const nombreMes = MESES[nMes - 1];
  const año = v.año;
  const transcurrido = nMes / 12;
  const marca = { marca: transcurrido, textoMarca: `Parte del año transcurrida: ${fmt(transcurrido * 100)} %` };

  // Cifras
  const cifra = (id, dato, nota) => {
    const small = document.createElement('small');
    small.textContent = nota;
    $(id).replaceChildren(dato, small);
  };
  const g = pct(v.total);
  const ga = pct(v.total.anterior);
  cifra('c-presupuesto', millones(v.total.creditos), `del Estado en ${año}, sin operaciones financieras`);
  cifra('c-gastado', textoPct(g), `${millones(v.total.obligaciones)} hasta el 31 de ${nombreMes}, con el ${fmt(transcurrido * 100)} % del año pasado`);
  cifra('c-anterior', textoPct(ga), `hasta ${nombreMes} de ${año - 1}`);

  // Ritmo mes a mes
  const series = [
    { nombre: año, clase: '', puntos: (v.series[año] ?? []).map((p) => ({ mes: p.mes, valor: p.ejecutado })) },
    { nombre: String(año - 1), clase: 'anterior', puntos: (v.series[año - 1] ?? []).map((p) => ({ mes: p.mes, valor: p.ejecutado })) },
  ].filter((s) => s.puntos.length);
  $('ritmo').innerHTML = lineasDelAño(series, { titulo: 'Parte del presupuesto gastada al final de cada mes' });
  const diferencia = g !== null && ga !== null ? Math.round((g - ga) * 1000) / 10 : null;
  $('ritmo-texto').textContent =
    `Parte del presupuesto ya gastada al final de cada mes. Hasta ${nombreMes} de ${año} se ha gastado el ${textoPct(g)}` +
    (diferencia !== null ? `: ${Math.abs(diferencia) < 1 ? 'casi lo mismo que' : diferencia > 0 ? `${fmt(Math.abs(diferencia), 1)} puntos más que` : `${fmt(Math.abs(diferencia), 1)} puntos menos que`} un año antes.` : '.');

  // Capítulos (solo los no financieros, con presupuesto)
  const capitulos = v.capitulos.filter((c) => Number(c.id) <= 7 && c.creditos > 0 && c.obligaciones !== null);
  $('capitulos').innerHTML = avance(capitulos.map((c) => filaAvance(c, { nombre: capitalizar(c.nombre).replace('Fdo.', 'Fondo') })), marca);

  // Políticas, de más a menos presupuesto
  const politicas = [...v.politicas].filter((p) => p.creditos > 0).sort((a, b) => b.creditos - a.creditos);
  $('politicas').innerHTML = avance(politicas.map((p) => filaAvance(p)), marca);

  // Ministerios y sus programas
  const secciones = [...v.secciones].filter((s) => s.creditos > 0).sort((a, b) => b.creditos - a.creditos);
  const pintarMinisterios = (q = '') => {
    const nq = normalizar(q);
    const coincide = (t) => normalizar(t).includes(nq);
    const filas = secciones
      .map((s) => ({ s, programas: nq ? s.programas.filter((p) => coincide(p.nombre)) : s.programas }))
      .filter(({ s, programas }) => !nq || programas.length || coincide(nombreSeccion(s.nombre)));
    $('resumen-programas').textContent = nq
      ? filas.length
        ? `${fmt(filas.reduce((t, f) => t + f.programas.length, 0))} programas con «${q}».`
        : `Ningún programa con «${q}».`
      : '';
    $('ministerios').innerHTML = `<ul class="ministerios">${filas
      .map(({ s, programas }) => {
        const abierto = Boolean(nq);
        return `<li class="ministerio">
          <details${abierto ? ' open' : ''}>
            <summary>${avance([filaAvance(s, { nombre: nombreSeccion(s.nombre) })], { ...marca, enLinea: true })}</summary>
            ${programas.length ? avance(programas.map((p) => filaAvance(p)), marca) : '<p class="tenue">Sin programas con presupuesto.</p>'}
          </details>
        </li>`;
      })
      .join('')}</ul>`;
  };
  pintarMinisterios();
  let espera;
  $('q').addEventListener('input', () => {
    clearTimeout(espera);
    espera = setTimeout(() => pintarMinisterios($('q').value.trim()), 200);
  });
  $('buscador').addEventListener('submit', (e) => {
    e.preventDefault();
    pintarMinisterios($('q').value.trim());
  });
  const inicial = new URLSearchParams(location.search).get('q');
  if (inicial) {
    $('q').value = inicial;
    pintarMinisterios(inicial);
  }

  $('fuente-igae').innerHTML =
    `<strong>Fuente:</strong> Intervención General de la Administración del Estado, <a href="${esc(v.url ?? 'https://www.igae.pap.hacienda.gob.es/')}">ejecución del presupuesto de gastos del Estado hasta ${nombreMes} de ${año}</a>. Datos descargados el ${fecha(v.actualizado)}.`;
} catch {
  $('ritmo').replaceChildren();
  $('capitulos').textContent = 'Estos datos no están disponibles ahora mismo. Prueba en un rato.';
}

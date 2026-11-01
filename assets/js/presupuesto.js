// «Presupuesto»: lo presupuestado por el Estado este año frente a lo que lleva gastado (IGAE).

import { cargarVista } from './datos.js';
import { botones, fichero, jsonVista } from './descargas.js';
import { avance, lineasDelAño } from './graficos.js';
import { MESES, nombreSeccion } from './ejecucion.js';
import { normalizar } from './lupa-datos.js';
import { fecha } from './formato.js';
import { t, LOCALE, EN } from './idioma.js';
import { CAPITULOS, politica, en } from './en.js';

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmt = (n, d = 0) => new Intl.NumberFormat(LOCALE, { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);
const pct = (x) => (x?.creditos > 0 && x.obligaciones !== null && x.obligaciones !== undefined ? x.obligaciones / x.creditos : null);
const pc = t(' %', '%');
const textoPct = (v) => (v === null ? t('sin dato', 'no data') : `${fmt(v * 100)}${pc}`);
const millones = (n) =>
  EN
    ? n >= 1000 ? `€${fmt(n / 1000, n >= 10000 ? 0 : 1)} billion` : `€${fmt(n)} million`
    : n >= 1000 ? `${fmt(n / 1000, n >= 10000 ? 0 : 1)} mil millones de €` : `${fmt(n)} millones de €`;
const corto = (n) => (EN ? (n >= 1000 ? `€${fmt(n / 1000, 1)}bn` : `€${fmt(n)}m`) : n >= 1000 ? `${fmt(n / 1000, 1)} mil M€` : `${fmt(n)} M€`);
const MESES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();

/** Fila para el gráfico de avance: «61 % de 13,2 mil M€», con el año anterior debajo. */
const filaAvance = (x, { id, nombre } = {}) => {
  const v = pct(x);
  const ant = pct(x.anterior);
  return {
    id: id ?? x.nombre,
    nombre: nombre ?? x.nombre,
    valor: v ?? 0,
    texto: t(`${textoPct(v)} de ${corto(x.creditos)}`, `${textoPct(v)} of ${corto(x.creditos)}`),
    nota: ant !== null ? t(`un año antes: ${textoPct(ant)}`, `a year earlier: ${textoPct(ant)}`) : '',
  };
};

try {
  const v = await cargarVista('presupuesto');
  const nMes = Number(v.mes.slice(5));
  const nombreMes = t(MESES, MESES_EN)[nMes - 1];
  const año = v.año;
  const transcurrido = nMes / 12;
  const marca = { marca: transcurrido, textoMarca: t(`Parte del año transcurrida: ${fmt(transcurrido * 100)} %`, `Share of the year gone by: ${fmt(transcurrido * 100)}%`) };

  // Cifras
  const cifra = (id, dato, nota) => {
    const small = document.createElement('small');
    small.textContent = nota;
    $(id).replaceChildren(dato, small);
  };
  const g = pct(v.total);
  const ga = pct(v.total.anterior);
  cifra('c-presupuesto', millones(v.total.creditos), t(`del Estado en ${año}, sin operaciones financieras`, `central government budget for ${año}, excluding financial operations`));
  cifra('c-gastado', textoPct(g), t(
      `${millones(v.total.obligaciones)} hasta el 31 de ${nombreMes}, con el ${fmt(transcurrido * 100)} % del año pasado`,
      `${millones(v.total.obligaciones)} up to the end of ${nombreMes}, with ${fmt(transcurrido * 100)}% of the year gone`,
    ));
  cifra('c-anterior', textoPct(ga), t(`hasta ${nombreMes} de ${año - 1}`, `up to ${nombreMes} ${año - 1}`));

  // Ritmo mes a mes
  const series = [
    { nombre: año, clase: '', puntos: (v.series[año] ?? []).map((p) => ({ mes: p.mes, valor: p.ejecutado })) },
    { nombre: String(año - 1), clase: 'anterior', puntos: (v.series[año - 1] ?? []).map((p) => ({ mes: p.mes, valor: p.ejecutado })) },
  ].filter((s) => s.puntos.length);
  $('ritmo').innerHTML = lineasDelAño(series, { titulo: t('Parte del presupuesto gastada al final de cada mes', 'Share of the budget spent by the end of each month') });
  const diferencia = g !== null && ga !== null ? Math.round((g - ga) * 1000) / 10 : null;
  const dif = diferencia === null ? null : Math.abs(diferencia) < 1 ? 0 : diferencia;
  $('ritmo-texto').textContent = EN
    ? `Share of the budget already spent by the end of each month. Up to ${nombreMes} ${año}, ${textoPct(g)} has been spent` +
      (dif === null ? '.' : `: ${dif === 0 ? 'almost the same as' : `${fmt(Math.abs(dif), 1)} points ${dif > 0 ? 'more' : 'less'} than`} a year earlier.`)
    : `Parte del presupuesto ya gastada al final de cada mes. Hasta ${nombreMes} de ${año} se ha gastado el ${textoPct(g)}` +
      (dif === null ? '.' : `: ${dif === 0 ? 'casi lo mismo que' : `${fmt(Math.abs(dif), 1)} puntos ${dif > 0 ? 'más' : 'menos'} que`} un año antes.`);

  // Capítulos (solo los no financieros, con presupuesto)
  const capitulos = v.capitulos.filter((c) => Number(c.id) <= 7 && c.creditos > 0 && c.obligaciones !== null);
  $('capitulos').innerHTML = avance(capitulos.map((c) => filaAvance(c, { nombre: en(CAPITULOS, Number(c.id), capitalizar(c.nombre).replace('Fdo.', 'Fondo')) })), marca);

  // Políticas, de más a menos presupuesto
  const politicas = [...v.politicas].filter((p) => p.creditos > 0).sort((a, b) => b.creditos - a.creditos);
  $('politicas').innerHTML = avance(politicas.map((p) => filaAvance(p, { nombre: politica(p.nombre) })), marca);

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
        ? t(`${fmt(filas.reduce((n, f) => n + f.programas.length, 0))} programas con «${q}».`, `${fmt(filas.reduce((n, f) => n + f.programas.length, 0))} programmes matching “${q}”.`)
        : t(`Ningún programa con «${q}».`, `No programme matching “${q}”.`)
      : '';
    $('ministerios').innerHTML = `<ul class="ministerios">${filas
      .map(({ s, programas }) => {
        const abierto = Boolean(nq);
        return `<li class="ministerio">
          <details${abierto ? ' open' : ''}>
            <summary>${avance([filaAvance(s, { nombre: nombreSeccion(s.nombre) })], { ...marca, enLinea: true })}</summary>
            ${programas.length ? avance(programas.map((p) => filaAvance(p)), marca) : `<p class="tenue">${t('Sin programas con presupuesto.', 'No programmes with a budget.')}</p>`}
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

  const enlace = esc(v.url ?? 'https://www.igae.pap.hacienda.gob.es/');
  $('fuente-igae').innerHTML = EN
    ? `<strong>Source:</strong> Intervención General de la Administración del Estado (IGAE, Spain’s public accounts office), <a href="${enlace}" hreflang="es">central government spending budget execution up to ${nombreMes} ${año}</a> (in Spanish). Data downloaded on ${fecha(v.actualizado)}.`
    : `<strong>Fuente:</strong> Intervención General de la Administración del Estado, <a href="${enlace}">ejecución del presupuesto de gastos del Estado hasta ${nombreMes} de ${año}</a>. Datos descargados el ${fecha(v.actualizado)}.`;

  // Descargas: millones de euros; «gastado» son las obligaciones reconocidas
  const cols = [t('Presupuesto (millones de €)', 'Budget (EUR million)'), t('Comprometido', 'Committed'), t('Gastado (obligaciones)', 'Spent (obligations)'), t('Pagado', 'Paid'), t('Parte gastada', 'Share spent')];
  const cifras = (x) => [x.creditos, x.comprometidos ?? null, x.obligaciones, x.pagos ?? null, pct(x)];
  const hasta = `${año}-${String(nMes).padStart(2, '0')}`;
  botones($('descargas'), [
    {
      texto: t('Mes a mes', 'Month by month'),
      fichero: fichero('presupuesto-mes-a-mes'),
      tabla: () => [
        [t('Año', 'Year'), t('Mes', 'Month'), t('Parte gastada al final del mes', 'Share spent by the end of the month')],
        Object.entries(v.series).flatMap(([a, puntos]) => puntos.map((p) => [a, p.mes, p.ejecutado])),
      ],
    },
    {
      texto: t('Por tipo de gasto (capítulos)', 'By type of spending (chapters)'),
      fichero: fichero(`presupuesto-capitulos-${hasta}`),
      tabla: () => [[t('Capítulo', 'Chapter'), t('Nombre', 'Name'), ...cols], v.capitulos.map((c) => [c.id, en(CAPITULOS, Number(c.id), capitalizar(c.nombre)), ...cifras(c)])],
    },
    {
      texto: t('Por política de gasto', 'By spending policy'),
      fichero: fichero(`presupuesto-politicas-${hasta}`),
      tabla: () => [[t('Área', 'Area'), t('Política', 'Policy'), ...cols], v.politicas.map((p) => [p.area, politica(p.nombre), ...cifras(p)])],
    },
    {
      texto: t('Por ministerio y programa', 'By ministry and programme'),
      fichero: fichero(`presupuesto-programas-${hasta}`),
      tabla: () => [
        [t('Sección (ministerio u órgano)', 'Section (ministry or body)'), t('Programa', 'Programme'), ...cols],
        v.secciones.flatMap((x) => [[nombreSeccion(x.nombre), t('(toda la sección)', '(whole section)'), ...cifras(x)], ...x.programas.map((p) => [nombreSeccion(x.nombre), p.nombre, ...cifras(p)])]),
      ],
    },
    jsonVista('presupuesto'),
  ]);
} catch {
  $('ritmo').replaceChildren();
  $('capitulos').textContent = t('Estos datos no están disponibles ahora mismo. Prueba en un rato.', 'This data is not available right now. Try again in a while.');
}

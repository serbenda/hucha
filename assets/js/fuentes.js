// «Fuentes»: la tabla de partidas sale del mismo código que usa la web, y la fecha de los datos.

import { PARTIDAS } from './cofog.js';
import { fecha } from './formato.js';
import { t } from './idioma.js';
import { FUENTES } from './fuente.js';
import { en, PARTIDAS as PARTIDAS_EN } from './en.js';

const NOMBRES = {
  GF01: 'Servicios públicos generales', GF0107: 'Operaciones de deuda pública', GF02: 'Defensa', GF03: 'Orden público y seguridad',
  GF04: 'Asuntos económicos', GF0405: 'Transporte', GF05: 'Protección del medio ambiente', GF06: 'Vivienda y servicios comunitarios',
  GF07: 'Salud', GF08: 'Ocio, cultura y religión', GF09: 'Educación', GF10: 'Protección social', GF1002: 'Vejez',
  GF1003: 'Supervivencia', GF1005: 'Desempleo',
};
// Nombres oficiales de la clasificación COFOG en inglés (la de Naciones Unidas)
const NOMBRES_EN = {
  GF01: 'General public services', GF0107: 'Public debt transactions', GF02: 'Defence', GF03: 'Public order and safety',
  GF04: 'Economic affairs', GF0405: 'Transport', GF05: 'Environmental protection', GF06: 'Housing and community amenities',
  GF07: 'Health', GF08: 'Recreation, culture and religion', GF09: 'Education', GF10: 'Social protection', GF1002: 'Old age',
  GF1003: 'Survivors', GF1005: 'Unemployment',
};
const nombre = (c) => `${c.replace('GF', '')} ${t(NOMBRES, NOMBRES_EN)[c] ?? ''}`.trim();

document.getElementById('tabla-partidas').replaceChildren(
  ...PARTIDAS.map((p) => {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = en(PARTIDAS_EN, p.id, p.nombre);
    const td = document.createElement('td');
    td.textContent = p.codigos.map(nombre).join(' + ') + (p.menos?.length ? `, ${t('menos', 'minus')} ${p.menos.map(nombre).join(', ')}` : '');
    tr.append(th, td);
    return tr;
  })
);

try {
  // La vista de la portada, que es la más pequeña, lleva las fechas de los datos
  const r = await fetch(new URL('../../data/vistas/portada.json', import.meta.url), { cache: 'no-cache' });
  const d = await r.json();
  document.getElementById('actualizado').textContent =
    t(`Datos descargados el ${fecha(d.actualizado)}`, `Data downloaded on ${fecha(d.actualizado)}`) +
    (d.eurostat ? t(`; Eurostat los actualizó por última vez el ${fecha(d.eurostat)}.`, `; Eurostat last updated it on ${fecha(d.eurostat)}.`) : '.');
} catch {}

// «Hasta cuándo están los datos»: una fila por fuente, con lo que hay, hasta cuándo, cuándo lo publicó la fuente,
// cuándo lo descargó hucha y si la última comprobación fue bien. Sale de los mismos ficheros que usa la web.
const pedir = (ruta) =>
  fetch(new URL(`../../data/${ruta}`, import.meta.url), { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
const esc = (x) => String(x ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const mesLargo = (mes) => new Intl.DateTimeFormat(t('es-ES', 'en-GB'), { month: 'long', year: 'numeric' }).format(new Date(`${mes}-15`));
const ultimoMes = (d) => (d?.meses ?? []).map((m) => m.mes).filter((m) => /^\d{4}-\d{2}$/.test(m)).sort().at(-1);

async function pintarAlDia() {
  const cuerpo = document.getElementById('tabla-al-dia');
  if (!cuerpo) return;
  const [portada, presupuesto, contratos, subvenciones, ayuda, estado] = await Promise.all(
    ['vistas/portada.json', 'vistas/presupuesto.json', 'lupa/contratos.json', 'lupa/subvenciones.json', 'lupa/ayuda.json', 'estado.json'].map(pedir)
  );
  const comprobacion = (clave) => {
    const e = estado?.[clave];
    if (!e) return '—';
    return e.ok
      ? `<span class="ok">✓ ${t('Bien', 'OK')}</span>, ${fecha(e.fecha)}`
      : `<span class="mal">✗ ${t('Falló', 'Failed')}</span>, ${fecha(e.fecha)}. ${t('Se usan los últimos datos buenos.', 'The latest good data is used.')}`;
  };
  const fuente = (f) => `<a href="${esc(f.enlace)}" rel="noopener">${esc(f.nombre)}</a>${f.tabla ? ` <code>${esc(f.tabla)}</code>` : ''}`;
  const mesIgae = presupuesto?.mes ? Number(presupuesto.mes.slice(5)) : null;
  const filas = [
    portada && {
      que: t('Gasto público por funciones: tu ticket, «A dónde va» y «Quién gasta»', 'Public spending by function: your receipt, “Where it goes” and “Who spends”'),
      fuente: fuente(FUENTES.gasto),
      hasta: `${portada.año}${portada.provisional ? t(' (provisional)', ' (provisional)') : ''}`,
      publicado: portada.eurostat,
      descargado: portada.actualizado,
      ritmo: t('Unas dos veces al año; los datos de un año, a partir del año siguiente', 'About twice a year; a year’s data, from the following year'),
      estado: 'eurostat',
    },
    portada?.deuda && {
      que: t('Deuda y déficit', 'Debt and deficit'),
      fuente: fuente(FUENTES.deuda),
      hasta: portada.deuda.año,
      publicado: portada.deuda.actualizado,
      descargado: portada.actualizado,
      ritmo: t('Dos veces al año (abril y octubre), con la notificación de déficit a la UE', 'Twice a year (April and October), with the deficit notification to the EU'),
      estado: 'eurostat-deuda',
    },
    presupuesto && {
      que: t('Presupuesto del Estado y lo gastado', 'Central government budget and spending'),
      fuente: fuente({ ...FUENTES.igae, enlace: presupuesto.url ?? FUENTES.igae.enlace }),
      hasta: mesIgae ? t(`31 de ${mesLargo(presupuesto.mes).replace(/ de \d{4}$/, '')} de ${presupuesto.año}`, `end of ${mesLargo(presupuesto.mes)}`) : '—',
      publicado: null,
      descargado: presupuesto.actualizado,
      ritmo: t('Cada mes, con unos dos meses de retraso', 'Every month, about two months behind'),
      estado: 'igae',
    },
    contratos && {
      que: t('Contratos de más de un millón (Lupa)', 'Contracts over a million (Lens)'),
      fuente: fuente(FUENTES.contratos),
      hasta: ultimoMes(contratos) ? `${contratos.desde ? t(`desde el ${fecha(contratos.desde)} hasta `, `from ${fecha(contratos.desde)} to `) : ''}${mesLargo(ultimoMes(contratos))}` : '—',
      publicado: null,
      descargado: contratos.actualizado,
      ritmo: t('Cada día', 'Every day'),
      estado: 'lupa-contratos',
    },
    subvenciones && {
      que: t('Subvenciones de más de un millón (Lupa)', 'Grants over a million (Lens)'),
      fuente: fuente(FUENTES.subvenciones),
      hasta: ultimoMes(subvenciones) ? t(`últimos 12 meses, hasta ${mesLargo(ultimoMes(subvenciones))}`, `last 12 months, up to ${mesLargo(ultimoMes(subvenciones))}`) : '—',
      publicado: null,
      descargado: subvenciones.actualizado,
      ritmo: t('Cada día', 'Every day'),
      estado: 'lupa-subvenciones',
    },
    ayuda && {
      que: t('Ayuda a otros países (Lupa)', 'Aid to other countries (Lens)'),
      fuente: fuente(FUENTES.ayuda),
      hasta: ayuda.años?.length ? `${ayuda.años.at(-1)}${ayuda.proyectosAño && ayuda.proyectosAño !== ayuda.años.at(-1) ? t(` (proyectos, ${ayuda.proyectosAño})`, ` (projects, ${ayuda.proyectosAño})`) : ''}` : '—',
      publicado: null,
      descargado: ayuda.actualizado,
      ritmo: t('Una vez al año; los datos de un año, a finales del siguiente', 'Once a year; a year’s data, at the end of the following year'),
      estado: 'lupa-ayuda',
    },
  ].filter(Boolean);
  const cols = [t('Qué', 'What'), t('Fuente', 'Source'), t('Hasta', 'Up to'), t('Publicado por la fuente', 'Published by the source'), t('Descargado por hucha', 'Downloaded by hucha'), t('Cada cuánto publica', 'How often it publishes'), t('Última comprobación', 'Last check')];
  cuerpo.innerHTML = filas.length
    ? filas
        .map(
          (f) => `<tr><th scope="row" data-col="${cols[0]}">${esc(f.que)}</th><td data-col="${cols[1]}">${f.fuente}</td><td data-col="${cols[2]}">${esc(f.hasta)}</td><td data-col="${cols[3]}">${f.publicado && fecha(f.publicado) ? fecha(f.publicado) : t('No lo dice', 'Not stated')}</td><td data-col="${cols[4]}">${f.descargado ? fecha(f.descargado) : '—'}</td><td data-col="${cols[5]}">${esc(f.ritmo)}</td><td data-col="${cols[6]}">${comprobacion(f.estado)}</td></tr>`
        )
        .join('')
    : `<tr><td colspan="7">${t('No se han podido cargar las fechas ahora mismo.', 'The dates could not be loaded right now.')}</td></tr>`;
}
pintarAlDia();

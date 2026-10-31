// «Fuentes»: la tabla de partidas sale del mismo código que usa la web, y la fecha de los datos.

import { PARTIDAS } from './cofog.js';
import { fecha } from './formato.js';
import { t } from './idioma.js';
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

// «Fuentes»: la tabla de partidas sale del mismo código que usa la web, y la fecha de los datos.

import { PARTIDAS } from './cofog.js';
import { fecha } from './formato.js';

const NOMBRES = {
  GF01: 'Servicios públicos generales', GF0107: 'Operaciones de deuda pública', GF02: 'Defensa', GF03: 'Orden público y seguridad',
  GF04: 'Asuntos económicos', GF0405: 'Transporte', GF05: 'Protección del medio ambiente', GF06: 'Vivienda y servicios comunitarios',
  GF07: 'Salud', GF08: 'Ocio, cultura y religión', GF09: 'Educación', GF10: 'Protección social', GF1002: 'Vejez',
  GF1003: 'Supervivencia', GF1005: 'Desempleo',
};
const nombre = (c) => `${c.replace('GF', '')} ${NOMBRES[c] ?? ''}`.trim();

document.getElementById('tabla-partidas').replaceChildren(
  ...PARTIDAS.map((p) => {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = p.nombre;
    const td = document.createElement('td');
    td.textContent = p.codigos.map(nombre).join(' + ') + (p.menos?.length ? `, menos ${p.menos.map(nombre).join(', ')}` : '');
    tr.append(th, td);
    return tr;
  })
);

try {
  const r = await fetch(new URL('../../data/cofog.json', import.meta.url), { cache: 'no-cache' });
  const d = await r.json();
  const eurostat = d.fuente?.gasto?.actualizado;
  document.getElementById('actualizado').textContent =
    `Datos descargados el ${fecha(d.actualizado)}` + (eurostat ? `; Eurostat los actualizó por última vez el ${fecha(eurostat)}.` : '.');
} catch {}

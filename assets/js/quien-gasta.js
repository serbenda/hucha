// «Quién gasta»: el reparto entre Estado, comunidades, ayuntamientos y Seguridad Social.

import { cargarDatos } from './datos.js';
import { reparto, gastoPorAdministracion, ultimoAño, esProvisional } from './cofog.js';
import { millones, porcentaje } from './formato.js';

const $ = (id) => document.getElementById(id);
const cuota = (funcion, sector) => funcion?.partes.find((p) => p.id === sector)?.cuota ?? 0;

try {
  const datos = await cargarDatos();
  const año = ultimoAño(datos);
  const funciones = reparto(datos, año);
  const sanidad = funciones.find((f) => f.id === 'GF07');
  const educacion = funciones.find((f) => f.id === 'GF09');
  const social = funciones.find((f) => f.id === 'GF10');

  $('entradilla').textContent =
    `En ${año}, las comunidades gestionaron el ${porcentaje(cuota(sanidad, 'S1312'))} del gasto en sanidad y el ${porcentaje(cuota(educacion, 'S1312'))} del de educación. ` +
    `La Seguridad Social, el ${porcentaje(cuota(social, 'S1314'))} del de pensiones y protección social.`;

  $('cuanto-texto').textContent =
    `Gasto de ${año}${esProvisional(datos, año) ? ' (provisional)' : ''}, sin contar el dinero que el Estado pasa a comunidades y ayuntamientos para que lo gasten ellos.`;

  $('administraciones').replaceChildren(
    ...gastoPorAdministracion(datos, año).map((a) => {
      const div = document.createElement('div');
      div.className = `cifra c-${a.id}`;
      div.innerHTML = `<dt>${a.nombre}</dt><dd>${millones(a.valor)}<small>${a.largo}</small></dd>`;
      return div;
    })
  );

  $('funciones').replaceChildren(
    ...funciones.map((f) => {
      const li = document.createElement('li');
      li.className = 'funcion';
      const visibles = f.partes.filter((p) => p.cuota > 0.005);
      const tramos = visibles
        .map((p) => `<span class="c-${p.id}" style="--ancho: ${(p.cuota * 100).toFixed(2)}%">${p.cuota >= 0.1 ? Math.round(p.cuota * 100) : ''}</span>`)
        .join('');
      const texto = visibles.map((p) => `${p.nombre} ${porcentaje(p.cuota)}`).join(' · ');
      li.innerHTML = `<h3>${f.nombre}<small>${f.total !== null ? millones(f.total) : ''}</small></h3>
        <div class="apilada" role="img" aria-label="${f.nombre}: ${texto}">${tramos}</div>
        <p class="desglose">${texto}</p>`;
      return li;
    })
  );
} catch {
  $('administraciones').replaceChildren();
}

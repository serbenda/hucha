// «Quién gasta»: el reparto entre Estado, comunidades, ayuntamientos y Seguridad Social.

import { cargarVista } from './datos.js';
import { icono, ICONO_FUNCION, ICONO_ADMINISTRACION } from './iconos.js';
import { millones, porcentaje } from './formato.js';

const $ = (id) => document.getElementById(id);
const cuota = (funcion, sector) => funcion?.partes.find((p) => p.id === sector)?.cuota ?? 0;

try {
  const v = await cargarVista('quien-gasta');
  const { año, funciones } = v;
  const sanidad = funciones.find((f) => f.id === 'GF07');
  const educacion = funciones.find((f) => f.id === 'GF09');
  const social = funciones.find((f) => f.id === 'GF10');

  const cifra = (id, dato, nota) => {
    const small = document.createElement('small');
    small.textContent = nota;
    $(id).replaceChildren(dato, small);
  };
  cifra('c-sanidad', porcentaje(cuota(sanidad, 'S1312')), `las comunidades, en ${año}`);
  cifra('c-educacion', porcentaje(cuota(educacion, 'S1312')), `las comunidades, en ${año}`);
  cifra('c-social', porcentaje(cuota(social, 'S1314')), `la Seguridad Social, en ${año}`);

  $('cuanto-texto').textContent =
    `En ${año}${v.provisional ? ' (provisional)' : ''}, sin contar el dinero que el Estado pasa a comunidades y ayuntamientos para que lo gasten ellos.`;

  $('administraciones').replaceChildren(
    ...v.administraciones.map((a) => {
      const div = document.createElement('div');
      div.className = `cifra c-${a.id}`;
      div.innerHTML = `<dt>${icono(ICONO_ADMINISTRACION[a.id])}${a.nombre}</dt><dd>${millones(a.valor)}<small>${a.largo}</small></dd>`;
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
      li.innerHTML = `<h3><span class="funcion-nombre"><span class="insignia">${icono(ICONO_FUNCION[f.id])}</span>${f.nombre}</span><small>${f.total !== null ? millones(f.total) : ''}</small></h3>
        <div class="apilada" role="img" aria-label="${f.nombre}: ${texto}">${tramos}</div>
        <p class="desglose">${texto}</p>`;
      return li;
    })
  );
} catch {
  $('administraciones').replaceChildren();
}

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

  // Cada barra es un botón: al pulsarla se despliega debajo lo que pone cada administración, con más datos.
  // El tramo pulsado queda resaltado.
  const porHab = (millonesDeEuros) => (v.poblacion ? `${new Intl.NumberFormat('es-ES').format(Math.round((millonesDeEuros * 1e6) / v.poblacion))} € por habitante` : '');
  $('funciones').replaceChildren(
    ...funciones.map((f, i) => {
      const li = document.createElement('li');
      li.className = 'funcion';
      const visibles = f.partes.filter((p) => p.cuota > 0.005);
      const tramos = visibles
        .map((p) => `<span class="c-${p.id}" data-admin="${p.id}" style="--ancho: ${(p.cuota * 100).toFixed(2)}%" title="${p.nombre}: ${porcentaje(p.cuota)} · ${millones(p.valor)}">${p.cuota >= 0.1 ? Math.round(p.cuota * 100) : ''}</span>`)
        .join('');
      const texto = visibles.map((p) => `${p.nombre} ${porcentaje(p.cuota)}`).join(' · ');
      const idDetalle = `detalle-${f.id}`;
      const mayor = [...visibles].sort((a, b) => b.cuota - a.cuota)[0];
      li.innerHTML = `<h3><span class="funcion-nombre"><span class="insignia">${icono(ICONO_FUNCION[f.id])}</span>${f.nombre}</span><small>${f.total !== null ? millones(f.total) : ''}</small></h3>
        <button type="button" class="apilada" aria-expanded="false" aria-controls="${idDetalle}" aria-label="${f.nombre}: ${texto}. Pulsa para ver más datos">${tramos}</button>
        <p class="desglose">${texto}</p>
        <div class="funcion-detalle" id="${idDetalle}" hidden>
          <p>De cada 100 € de <strong>${f.nombre.toLowerCase()}</strong>, <span data-frase></span></p>
          <table class="tabla-detalle">
            <thead><tr><th scope="col">Quién</th><th scope="col">Parte</th><th scope="col">Gasto en ${año}</th><th scope="col">Por habitante</th></tr></thead>
            <tbody>${[...f.partes]
              .sort((a, b) => b.valor - a.valor)
              .map((p) => `<tr data-admin="${p.id}"><th scope="row"><i class="c-${p.id} muestra"></i>${p.nombre}</th><td>${porcentaje(p.cuota)}</td><td>${millones(p.valor)}</td><td>${porHab(p.valor).replace(' por habitante', '')}</td></tr>`)
              .join('')}</tbody>
          </table>
        </div>`;
      const boton = li.querySelector('.apilada');
      const detalle = li.querySelector('.funcion-detalle');
      const elegir = (id) => {
        const p = f.partes.find((x) => x.id === id) ?? mayor;
        li.querySelectorAll('[data-admin]').forEach((el) => el.classList.toggle('elegido', el.dataset.admin === p.id));
        const quien = { S1311: 'los pone el Estado', S1312: 'los ponen las comunidades autónomas', S1313: 'los ponen los ayuntamientos', S1314: 'los pone la Seguridad Social' }[p.id] ?? `los pone ${p.nombre}`;
        detalle.querySelector('[data-frase]').textContent = `${Math.round(p.cuota * 100)} ${quien}: ${millones(p.valor)} en ${año}${v.poblacion ? `, ${porHab(p.valor)}` : ''}.`;
      };
      boton.addEventListener('click', (e) => {
        const tramo = e.target.closest('[data-admin]')?.dataset.admin;
        const abierto = boton.getAttribute('aria-expanded') === 'true';
        // Pulsar otro tramo con el detalle abierto cambia de administración; pulsar el mismo lo cierra
        if (abierto && (!tramo || li.querySelector('.elegido')?.dataset.admin === tramo)) {
          boton.setAttribute('aria-expanded', 'false');
          detalle.hidden = true;
          li.querySelectorAll('.elegido').forEach((el) => el.classList.remove('elegido'));
          return;
        }
        boton.setAttribute('aria-expanded', 'true');
        detalle.hidden = false;
        elegir(tramo ?? mayor.id);
      });
      detalle.addEventListener('click', (e) => {
        const fila = e.target.closest('tr[data-admin]');
        if (fila) elegir(fila.dataset.admin);
      });
      return li;
    })
  );
} catch {
  $('administraciones').replaceChildren();
}

// «Quién gasta»: el reparto entre Estado, comunidades, ayuntamientos y Seguridad Social.

import { cargarVista } from './datos.js';
import { botones, fichero, jsonVista } from './descargas.js';
import { icono, ICONO_FUNCION, ICONO_ADMINISTRACION } from './iconos.js';
import { millones, porcentaje } from './formato.js';
import { t, LOCALE } from './idioma.js';
import { FUNCIONES, ADMINISTRACIONES, en, enQue } from './en.js';

const $ = (id) => document.getElementById(id);
const cuota = (funcion, sector) => funcion?.partes.find((p) => p.id === sector)?.cuota ?? 0;

try {
  const v = await cargarVista('quien-gasta');
  const { año } = v;
  // En inglés, nombres de funciones y administraciones traducidos
  const admin = (p) => ({ ...p, nombre: en(ADMINISTRACIONES, p.id, p.nombre), largo: enQue(ADMINISTRACIONES, p.id, p.largo) });
  const funciones = v.funciones.map((f) => ({ ...f, nombre: en(FUNCIONES, f.id, f.nombre), partes: f.partes.map(admin) }));
  const sanidad = funciones.find((f) => f.id === 'GF07');
  const educacion = funciones.find((f) => f.id === 'GF09');
  const social = funciones.find((f) => f.id === 'GF10');

  const cifra = (id, dato, nota) => {
    const small = document.createElement('small');
    small.textContent = nota;
    $(id).replaceChildren(dato, small);
  };
  cifra('c-sanidad', porcentaje(cuota(sanidad, 'S1312')), t(`las comunidades, en ${año}`, `the regions, in ${año}`));
  cifra('c-educacion', porcentaje(cuota(educacion, 'S1312')), t(`las comunidades, en ${año}`, `the regions, in ${año}`));
  cifra('c-social', porcentaje(cuota(social, 'S1314')), t(`la Seguridad Social, en ${año}`, `Social Security, in ${año}`));

  $('cuanto-texto').textContent =
    t(`En ${año}${v.provisional ? ' (provisional)' : ''}, sin contar el dinero que el Estado pasa a comunidades y ayuntamientos para que lo gasten ellos.`, `In ${año}${v.provisional ? ' (provisional)' : ''}, not counting the money central government passes to regions and councils for them to spend.`);

  $('administraciones').replaceChildren(
    ...v.administraciones.map(admin).map((a) => {
      const div = document.createElement('div');
      div.className = `cifra c-${a.id}`;
      div.innerHTML = `<dt>${icono(ICONO_ADMINISTRACION[a.id])}${a.nombre}</dt><dd>${millones(a.valor)}<small>${a.largo}</small></dd>`;
      return div;
    })
  );

  // Cada barra es un botón: al pulsarla se despliega debajo lo que pone cada administración, con más datos.
  // El tramo pulsado queda resaltado.
  const porHab = (millonesDeEuros) => (v.poblacion ? t(`${new Intl.NumberFormat(LOCALE).format(Math.round((millonesDeEuros * 1e6) / v.poblacion))} € por habitante`, `€${new Intl.NumberFormat(LOCALE).format(Math.round((millonesDeEuros * 1e6) / v.poblacion))} per person`) : '');
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
        <button type="button" class="apilada" aria-expanded="false" aria-controls="${idDetalle}" aria-label="${f.nombre}: ${texto}. ${t('Pulsa para ver más datos', 'Tap for more figures')}">${tramos}</button>
        <p class="desglose">${texto}</p>
        <div class="funcion-detalle" id="${idDetalle}" hidden>
          <p>${t('De cada 100 € de', 'Out of every €100 of')} <strong>${f.nombre.toLowerCase()}</strong>, <span data-frase></span></p>
          <table class="tabla-detalle">
            <thead><tr><th scope="col">${t('Quién', 'Who')}</th><th scope="col">${t('Parte', 'Share')}</th><th scope="col">${t(`Gasto en ${año}`, `Spending in ${año}`)}</th><th scope="col">${t('Por habitante', 'Per person')}</th></tr></thead>
            <tbody>${[...f.partes]
              .sort((a, b) => b.valor - a.valor)
              .map((p) => `<tr data-admin="${p.id}"><th scope="row"><i class="c-${p.id} muestra"></i>${p.nombre}</th><td>${porcentaje(p.cuota)}</td><td>${millones(p.valor)}</td><td>${porHab(p.valor).replace(' por habitante', '').replace(' per person', '')}</td></tr>`)
              .join('')}</tbody>
          </table>
        </div>`;
      const boton = li.querySelector('.apilada');
      const detalle = li.querySelector('.funcion-detalle');
      const elegir = (id) => {
        const p = f.partes.find((x) => x.id === id) ?? mayor;
        li.querySelectorAll('[data-admin]').forEach((el) => el.classList.toggle('elegido', el.dataset.admin === p.id));
        const quien = t(
          { S1311: 'los pone el Estado', S1312: 'los ponen las comunidades autónomas', S1313: 'los ponen los ayuntamientos', S1314: 'los pone la Seguridad Social' }[p.id] ?? `los pone ${p.nombre}`,
          { S1311: 'come from central government', S1312: 'come from the regions', S1313: 'come from local councils', S1314: 'come from Social Security' }[p.id] ?? `come from ${p.nombre}`
        );
        detalle.querySelector('[data-frase]').textContent = t(
          `${Math.round(p.cuota * 100)} ${quien}: ${millones(p.valor)} en ${año}${v.poblacion ? `, ${porHab(p.valor)}` : ''}.`,
          `€${Math.round(p.cuota * 100)} ${quien}: ${millones(p.valor)} in ${año}${v.poblacion ? `, ${porHab(p.valor)}` : ''}.`
        );
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

  // Descargas
  const colMillones = t('Millones de €', 'EUR million');
  botones($('descargas'), [
    {
      texto: t('Gasto de cada administración', 'Spending by administration'),
      fichero: fichero(`administraciones-${año}`),
      tabla: () => [
        [t('Administración', 'Administration'), t('Qué es', 'What it is'), t('Año', 'Year'), colMillones, t('Euros por habitante', 'Euros per person')],
        v.administraciones.map(admin).map((a) => [a.nombre, a.largo, año, a.valor, v.poblacion ? Math.round((a.valor * 1e6) / v.poblacion) : null]),
      ],
    },
    {
      texto: t('Quién paga cada cosa', 'Who pays for what'),
      fichero: fichero(`quien-paga-${año}`),
      tabla: () => [
        [t('Función', 'Function'), t('Administración', 'Administration'), t('Año', 'Year'), colMillones, t('Parte de la función', 'Share of the function')],
        funciones.flatMap((f) => f.partes.map((p) => [f.nombre, p.nombre, año, p.valor, p.cuota])),
      ],
    },
    jsonVista('quien-gasta'),
  ]);
} catch {
  $('administraciones').replaceChildren();
}

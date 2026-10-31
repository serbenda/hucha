// Color fijo de cada partida en los gráficos: sigue a la partida, no a su puesto, para que no cambie si un año
// cambia el orden. Siete colores de la paleta comprobada (--serie-1…7) para las partidas más grandes; el resto,
// en gris (--serie-otros), se agrupa como «otras».

export const COLOR_PARTIDA = {
  pensiones: 1,
  sanidad: 2,
  'otras-sociales': 3,
  educacion: 4,
  administracion: 5,
  economia: 6,
  intereses: 7,
};

/** Color CSS de una partida: var(--serie-n), o el gris de «otras». */
export const colorPartida = (id) => (COLOR_PARTIDA[id] ? `var(--serie-${COLOR_PARTIDA[id]})` : 'var(--serie-otros)');
export const tieneColor = (id) => Boolean(COLOR_PARTIDA[id]);

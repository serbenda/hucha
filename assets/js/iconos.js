// Iconos de hucha: trazos sencillos de 24×24 que toman el color del texto (currentColor).
// Son propios, sin librerías. Se usan dentro del HTML (menú, secciones, pestañas, temas) y desde JavaScript
// (partidas, funciones, ticket). Los del HTML llevan data-icono y un test comprueba que coinciden con estos.

const TRAZOS = {
  // Secciones de la web
  ticket: 'M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21Z M9 8h6 M9 12h6 M9 16h3',
  'a-donde-va': 'M12 3a9 9 0 1 0 9 9h-9Z M15 3.5A9 9 0 0 1 20.5 9H15Z',
  presupuesto: 'M3.5 17a8.5 8.5 0 1 1 17 0 M12 17l4.5-5.5 M3.5 17h17',
  'quien-gasta': 'M3 21h18 M4 10h16 M12 3l8 4.5H4Z M6 10v8 M10 10v8 M14 10v8 M18 10v8',
  lupa: 'M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z M20.5 20.5l-5.4-5.4',
  fuentes: 'M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2Z M4 20a2 2 0 0 0 2 2h13v-4',
  error: 'M12 3 2 20h20Z M12 10v4 M12 17h.01',
  candado: 'M6 11h12v10H6Z M8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  sello: 'M12 3l2.4 1.8 3-.2.9 2.9 2.4 1.8-1 2.8 1 2.8-2.4 1.8-.9 2.9-3-.2L12 21l-2.4-1.8-3 .2-.9-2.9-2.4-1.8 1-2.8-1-2.8 2.4-1.8.9-2.9 3 .2Z M9 12l2 2 4-4',
  flecha: 'M5 12h14 M13 6l6 6-6 6',

  // Partidas y temas
  pensiones: 'M6 3h12 M6 21h12 M7 3c0 6 10 6 10 9s-10 3-10 9 M17 3c0 6-10 6-10 9s10 3 10 9',
  sanidad: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z',
  educacion: 'M2 9l10-5 10 5-10 5Z M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5 M22 9v6',
  social: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z',
  administracion: 'M9 3h6v3H9Z M9 4.5H6a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5.5a1 1 0 0 0-1-1h-3 M9 12h6 M9 16h4',
  empleo: 'M3 8h18v12H3Z M8 8V5h8v3 M3 13h18',
  intereses: 'M19 5 5 19 M9.5 7a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z M19.5 17a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z',
  tren: 'M7 3h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z M5 10h14 M8.5 13.5h.01 M15.5 13.5h.01 M8 17l-3 4 M16 17l3 4',
  carreteras: 'M8 3 4 21 M16 3l4 18 M12 4v3 M12 10v4 M12 17v3',
  transporte: 'M6 3h12a2 2 0 0 1 2 2v12H4V5a2 2 0 0 1 2-2Z M4 11h16 M7 17v3 M17 17v3 M7.5 14h.01 M16.5 14h.01',
  paro: 'M12.5 8a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6 M16 11h5',
  seguridad: 'M12 3v18 M8 21h8 M5 7h14 M5 7l-3 7a3 3 0 0 0 6 0Z M19 7l-3 7a3 3 0 0 0 6 0Z',
  cultura: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3l-5.5 2.9 1-6.2L3 9.6l6.2-.9Z',
  'medio-ambiente': 'M5 19C5 10 11 5 20 4c0 9-5 15-13 15Z M5 19l7-7',
  defensa: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6Z',
  vivienda: 'M3 11l9-7 9 7 M5 9.5V20h14V9.5 M10 20v-6h4v6',
  energia: 'M13 2 4 14h7l-1 8 9-12h-7Z',
  agua: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z',
  tecnologia: 'M7 7h10v10H7Z M10 3v4 M14 3v4 M10 17v4 M14 17v4 M3 10h4 M3 14h4 M17 10h4 M17 14h4',
  campo: 'M12 21v-9 M12 12c0-4-3-7-8-7 0 4 3 7 8 7Z M12 14c0-4 3-6 8-6 0 4-3 6-8 6Z',
  todo: 'M4 4h6v6H4Z M14 4h6v6h-6Z M4 14h6v6H4Z M14 14h6v6h-6Z',

  // La Lupa
  contratos: 'M6 3h9l4 4v14H6Z M14 3v5h5 M9 13h6 M9 17h4',
  subvenciones: 'M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Z M4 7v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7 M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5',
  mundo: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z M3 12h18 M12 3c3 3 3 15 0 18 M12 3c-3 3-3 15 0 18',

  // Administraciones
  estado: 'M3 21h18 M4 10h16 M12 3l8 4.5H4Z M6 10v8 M10 10v8 M14 10v8 M18 10v8',
  comunidades: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2Z M9 4v14 M15 6v14',
  ayuntamientos: 'M4 21V9l8-5 8 5v12Z M9 21v-5h6v5 M9 11h.01 M15 11h.01 M12 11h.01',
  'seguridad-social': 'M3 12a9 9 0 0 1 18 0Z M12 12v6a2 2 0 0 0 4 0',
};

/** Nombres de todos los iconos. */
export const NOMBRES = Object.keys(TRAZOS);

/** El SVG de un icono, decorativo (el texto de al lado ya dice lo que es). */
export function icono(nombre, clase = 'icono') {
  const d = TRAZOS[nombre];
  if (!d) return '';
  return `<svg class="${clase}" data-icono="${nombre}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
}

/** Icono de cada partida de «A dónde va» y del ticket (por su id en cofog.js). */
export const ICONO_PARTIDA = {
  pensiones: 'pensiones',
  sanidad: 'sanidad',
  educacion: 'educacion',
  'otras-sociales': 'social',
  administracion: 'administracion',
  economia: 'empleo',
  intereses: 'intereses',
  transporte: 'tren',
  paro: 'paro',
  seguridad: 'seguridad',
  cultura: 'cultura',
  'medio-ambiente': 'medio-ambiente',
  defensa: 'defensa',
  vivienda: 'vivienda',
};

/** Icono de cada función de «Quién gasta» (divisiones COFOG). */
export const ICONO_FUNCION = {
  GF01: 'administracion',
  GF02: 'defensa',
  GF03: 'seguridad',
  GF04: 'empleo',
  GF05: 'medio-ambiente',
  GF06: 'vivienda',
  GF07: 'sanidad',
  GF08: 'cultura',
  GF09: 'educacion',
  GF10: 'social',
};

/** Icono de cada tema de la Lupa (por su id en lupa-datos.js). */
export const ICONO_TEMA = {
  '': 'todo',
  tren: 'tren',
  carreteras: 'carreteras',
  transporte: 'transporte',
  sanidad: 'sanidad',
  educacion: 'educacion',
  social: 'social',
  vivienda: 'vivienda',
  energia: 'energia',
  agua: 'agua',
  seguridad: 'seguridad',
  defensa: 'defensa',
  tecnologia: 'tecnologia',
  cultura: 'cultura',
  empleo: 'empleo',
  campo: 'campo',
};

/** Icono de cada administración (subsectores de Eurostat). */
export const ICONO_ADMINISTRACION = { S1311: 'estado', S1312: 'comunidades', S1313: 'ayuntamientos', S1314: 'seguridad-social' };

// Utilidades de los tests: respuestas de Eurostat fabricadas con la misma forma que las reales.
// Las cifras son de ejemplo, del orden de las de España, pero NO son datos oficiales.

/** Crea un dataset JSON-stat 2.0 (valores dispersos, como Eurostat) a partir de observaciones planas. */
export function crearJsonStat(ids, observaciones, { updated = '2026-04-22T23:00:00+0200' } = {}) {
  const categorias = ids.map((id) => [...new Set(observaciones.map((o) => o[id]))]);
  const size = categorias.map((c) => c.length);
  const saltos = [];
  let s = 1;
  for (let d = ids.length - 1; d >= 0; d--) {
    saltos[d] = s;
    s *= size[d];
  }
  const value = {};
  const status = {};
  for (const o of observaciones) {
    const i = ids.reduce((t, id, d) => t + categorias[d].indexOf(o[id]) * saltos[d], 0);
    value[i] = o.valor;
    if (o.estado) status[i] = o.estado;
  }
  const dimension = Object.fromEntries(
    ids.map((id, d) => [
      id,
      { label: id, category: { index: Object.fromEntries(categorias[d].map((c, i) => [c, i])), label: Object.fromEntries(categorias[d].map((c) => [c, c])) } },
    ])
  );
  return { version: '2.0', class: 'dataset', label: 'ejemplo', source: 'ESTAT', updated, id: ids, size, dimension, value, status };
}

// Gasto de España de ejemplo en millones de euros (un año), por código COFOG
const BASE = {
  GF01: 80000, GF0107: 35000, GF0108: 0,
  GF02: 13000,
  GF03: 27000,
  GF04: 70000, GF0405: 20000,
  GF05: 13000,
  GF06: 8000,
  GF07: 95000,
  GF08: 16000,
  GF09: 60000,
  GF10: 270000, GF1002: 165000, GF1003: 27000, GF1005: 22000,
};
BASE.TOTAL = ['GF01', 'GF02', 'GF03', 'GF04', 'GF05', 'GF06', 'GF07', 'GF08', 'GF09', 'GF10'].reduce((t, c) => t + BASE[c], 0);

// Reparto de ejemplo entre administraciones (Estado, comunidades, ayuntamientos, Seguridad Social)
const REPARTO = {
  GF01: [0.6, 0.22, 0.18, 0], GF0107: [0.85, 0.12, 0.03, 0], GF02: [1, 0, 0, 0], GF03: [0.6, 0.22, 0.18, 0],
  GF04: [0.45, 0.3, 0.15, 0.1], GF0405: [0.5, 0.25, 0.25, 0], GF05: [0.15, 0.15, 0.7, 0], GF06: [0.15, 0.35, 0.5, 0],
  GF07: [0.03, 0.92, 0.02, 0.03], GF08: [0.2, 0.3, 0.5, 0], GF09: [0.06, 0.85, 0.09, 0],
  GF10: [0.15, 0.06, 0.04, 0.75], GF1002: [0.12, 0, 0, 0.88], GF1003: [0.05, 0, 0, 0.95], GF1005: [0, 0, 0, 1],
};
const SUBSECTORES = ['S1311', 'S1312', 'S1313', 'S1314'];

// Peso de cada función en el PIB de la UE, de ejemplo
const UE_PIB = { TOTAL: 49, GF01: 5.6, GF0107: 1.6, GF02: 1.3, GF03: 1.7, GF04: 6, GF0405: 1.8, GF05: 0.8, GF06: 0.6, GF07: 7.6, GF08: 1.1, GF09: 4.7, GF10: 19.3, GF1002: 10.3, GF1003: 1.2, GF1005: 1.3 };

/**
 * Las dos respuestas de Eurostat (gasto y población) para varios años.
 * `quitar` deja fuera códigos (para simular falta de detalle); el último año va marcado como provisional.
 */
export function respuestasEjemplo({ desde = 2014, hasta = 2024, quitar = [] } = {}) {
  const obs = [];
  for (let año = desde; año <= hasta; año++) {
    const f = 1 + 0.035 * (año - desde); // crece un 3,5 % al año
    const pib = 1100000 * (1 + 0.04 * (año - desde));
    const estado = año === hasta ? 'p' : undefined;
    for (const [codigo, base] of Object.entries(BASE)) {
      if (quitar.includes(codigo)) continue;
      const v = base * f;
      const comun = { freq: 'A', na_item: 'TE', time: String(año), cofog99: codigo };
      obs.push({ ...comun, unit: 'MIO_EUR', sector: 'S13', geo: 'ES', valor: v, estado });
      obs.push({ ...comun, unit: 'PC_GDP', sector: 'S13', geo: 'ES', valor: (v / pib) * 100, estado });
      obs.push({ ...comun, unit: 'PC_GDP', sector: 'S13', geo: 'EU27_2020', valor: UE_PIB[codigo] });
      const reparto = REPARTO[codigo] ?? (codigo === 'TOTAL' ? null : [0.25, 0.25, 0.25, 0.25]);
      SUBSECTORES.forEach((s, i) => {
        let sub;
        if (codigo === 'TOTAL') sub = Object.entries(BASE).filter(([c]) => c.length === 4).reduce((t, [c, b]) => t + b * f * REPARTO[c][i], 0);
        else sub = v * reparto[i];
        // Transferencias generales del Estado a las comunidades: solo en el Estado
        if (codigo === 'GF0108' && s === 'S1311') sub = 100000 * f;
        if ((codigo === 'GF01' || codigo === 'TOTAL') && s === 'S1311') sub += 100000 * f;
        obs.push({ ...comun, unit: 'MIO_EUR', sector: s, geo: 'ES', valor: sub, estado });
      });
    }
  }
  const gasto = crearJsonStat(['freq', 'unit', 'sector', 'cofog99', 'na_item', 'geo', 'time'], obs);

  const pob = [];
  for (let año = desde; año <= hasta; año++) pob.push({ freq: 'A', indic_de: 'AVG', geo: 'ES', time: String(año), valor: 46500000 + 220000 * (año - desde) });
  const poblacion = crearJsonStat(['freq', 'indic_de', 'geo', 'time'], pob);
  return { gasto, poblacion };
}

// Lo que pone en la hucha un asalariado: IRPF y cotizaciones a la Seguridad Social.
// Es una estimación orientativa para un contrato indefinido, sin hijos ni situaciones especiales.
// Este módulo lo usan tanto el navegador como los tests.
//
// Fuentes de las reglas de 2026 (se actualizan a mano cada año, ver README):
// - IRPF: algoritmo de retenciones de la Agencia Tributaria para 2026.
// - Cotizaciones: orden de cotización de 2026 (bases y tipos del Régimen General).

export const REGLAS = {
  año: 2026,
  smi: 17094, // salario mínimo anual (14 pagas de 1.221 €)

  irpf: {
    // Escala de retención (estatal + autonómica general), en euros anuales
    escala: [
      [12450, 0.19],
      [20200, 0.24],
      [35200, 0.3],
      [60000, 0.37],
      [300000, 0.45],
      [Infinity, 0.47],
    ],
    minimoPersonal: 5550,
    otrosGastos: 2000,
    // Reducción por rendimientos del trabajo (art. 20 LIRPF)
    reduccion: { tope1: 14852, importe1: 7302, pendiente1: 1.75, tope2: 17673.52, importe2: 2364.34, pendiente2: 1.14, tope3: 19747.5 },
    // La cuota no puede pasar de este porcentaje de lo que se gana por encima del salario mínimo
    limiteSobreExceso: 0.43,
  },

  seguridadSocial: {
    baseMaximaAnual: 5101.2 * 12,
    // Contrato indefinido: contingencias comunes, MEI, desempleo y formación profesional (+ FOGASA en la empresa)
    trabajador: 0.047 + 0.0015 + 0.0155 + 0.001,
    empresa: 0.236 + 0.0075 + 0.055 + 0.006 + 0.002,
    // Cotización de solidaridad sobre lo que pasa de la base máxima: [hasta % por encima de la base, trabajador, empresa]
    solidaridad: [
      [0.1, 0.0019, 0.0096],
      [0.5, 0.0021, 0.0104],
      [Infinity, 0.0024, 0.0122],
    ],
  },
};

const redondear = (n) => Math.round(n * 100) / 100;

/** Cuota de una escala por tramos. */
export function aplicarEscala(base, escala) {
  let cuota = 0;
  let desde = 0;
  for (const [hasta, tipo] of escala) {
    if (base <= desde) break;
    cuota += (Math.min(base, hasta) - desde) * tipo;
    desde = hasta;
  }
  return cuota;
}

/** Cotizaciones anuales a la Seguridad Social: { trabajador, empresa }. */
export function cotizaciones(bruto, reglas = REGLAS) {
  const ss = reglas.seguridadSocial;
  const base = Math.min(bruto, ss.baseMaximaAnual);
  let trabajador = base * ss.trabajador;
  let empresa = base * ss.empresa;

  // Solidaridad: por la parte del sueldo que supera la base máxima
  let desde = ss.baseMaximaAnual;
  for (const [hasta, tTrab, tEmp] of ss.solidaridad) {
    const tope = ss.baseMaximaAnual * (1 + hasta);
    if (bruto <= desde) break;
    const tramo = Math.min(bruto, tope) - desde;
    trabajador += tramo * tTrab;
    empresa += tramo * tEmp;
    desde = tope;
  }
  return { trabajador: redondear(trabajador), empresa: redondear(empresa) };
}

/** Reducción por obtención de rendimientos del trabajo. */
export function reduccionTrabajo(rendimientoNeto, r = REGLAS.irpf.reduccion) {
  if (rendimientoNeto <= r.tope1) return r.importe1;
  if (rendimientoNeto <= r.tope2) return r.importe1 - r.pendiente1 * (rendimientoNeto - r.tope1);
  if (rendimientoNeto < r.tope3) return r.importe2 - r.pendiente2 * (rendimientoNeto - r.tope2);
  return 0;
}

/** IRPF anual estimado de un asalariado sin hijos ni situaciones especiales. */
export function irpf(bruto, reglas = REGLAS) {
  if (!(bruto > reglas.smi)) return 0;
  const r = reglas.irpf;
  const { trabajador } = cotizaciones(bruto, reglas);
  const neto = Math.max(0, bruto - trabajador);
  const base = Math.max(0, neto - reduccionTrabajo(neto, r.reduccion) - Math.min(r.otrosGastos, neto));
  const cuota = Math.max(0, aplicarEscala(base, r.escala) - aplicarEscala(r.minimoPersonal, r.escala));
  return redondear(Math.min(cuota, r.limiteSobreExceso * (bruto - reglas.smi)));
}

/**
 * Lo que aporta un sueldo bruto anual a la hucha:
 * { bruto, irpf, cotizacionTrabajador, cotizacionEmpresa, tuyo, conEmpresa, neto, tipoEfectivo }
 */
export function aportacion(bruto, reglas = REGLAS) {
  if (!(bruto > 0)) return null;
  const c = cotizaciones(bruto, reglas);
  const i = irpf(bruto, reglas);
  const tuyo = redondear(i + c.trabajador);
  return {
    bruto,
    irpf: i,
    cotizacionTrabajador: c.trabajador,
    cotizacionEmpresa: c.empresa,
    tuyo,
    conEmpresa: redondear(tuyo + c.empresa),
    neto: redondear(bruto - tuyo),
    tipoEfectivo: tuyo / bruto,
  };
}

/** Reparte una cantidad entre las partidas según su cuota del gasto: [{ ...partida, euros }]. */
export function repartir(cantidad, partidas) {
  return partidas.map((p) => ({ ...p, euros: cantidad * p.cuota }));
}

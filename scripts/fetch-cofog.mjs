// Descarga de Eurostat el gasto público por funciones (COFOG) y la población de España,
// y lo guarda en el almacén (almacen/cofog.json). Si Eurostat falla o los datos no tienen buena pinta,
// se mantienen los de la publicación anterior.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { urlGasto, urlPoblacion, urlTipos, urlDeuda, prepararDatos, prepararDeuda, resumenDeuda, urlIngresos, urlImpuestos, prepararIngresos, resumenIngresos, problema, ultimoAño, gastoPorPersona, ultimoAñoTipos } from '../assets/js/cofog.js';
import { anotar } from './estado.mjs';

const salida = new URL('../almacen/cofog.json', import.meta.url);
const cabeceras = { Accept: 'application/json', 'User-Agent': 'hucha (github.com/serbenda/hucha)' };

async function descargar(url) {
  let ultimoError;
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const r = await fetch(url, { headers: cabeceras, signal: AbortSignal.timeout(120000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      // Eurostat responde a veces con un JSON de error o con el dataset «en preparación»
      if (json?.error) throw new Error(`Eurostat: ${JSON.stringify(json.error).slice(0, 200)}`);
      return json;
    } catch (e) {
      ultimoError = e;
      console.warn(`Intento ${intento} (${new URL(url).pathname.split('/').at(-1)}): ${e.message}`);
      await new Promise((ok) => setTimeout(ok, 5000 * intento));
    }
  }
  throw ultimoError;
}

async function anteriores() {
  try {
    return JSON.parse(await readFile(salida, 'utf8'));
  } catch {
    return null;
  }
}

let datos;
let fallaTipos = null;
try {
  const [gasto, poblacion] = await Promise.all([descargar(urlGasto()), descargar(urlPoblacion())]);
  // El desglose por tipo de gasto es un extra: si falla, la web sigue sin él (o con el de la última vez)
  let tipos = null;
  try {
    tipos = await descargar(urlTipos());
  } catch (e) {
    fallaTipos = e.message;
  }
  datos = prepararDatos(gasto, poblacion, tipos);
} catch (e) {
  await anotar('eurostat', false, `No se ha podido descargar: ${e.message}`);
  console.warn('Eurostat: se mantienen los datos anteriores');
  process.exit(0);
}

const fallo = problema(datos);
if (fallo) {
  await anotar('eurostat', false, fallo);
  console.warn(`Eurostat: ${fallo}. Se mantienen los datos anteriores`);
  process.exit(0);
}

// No retroceder: si lo publicado ya llega a un año más reciente, algo raro pasa en Eurostat
const previo = await anteriores();
if (previo?.años?.length && ultimoAño(previo) > ultimoAño(datos)) {
  await anotar('eurostat', false, `Eurostat llega a ${ultimoAño(datos)} pero lo publicado llega a ${ultimoAño(previo)}`);
  process.exit(0);
}

if (!Object.keys(datos.tipos).length) {
  if (previo?.tipos && Object.keys(previo.tipos).length) {
    datos.tipos = previo.tipos;
    datos.fuente.tipos = previo.fuente?.tipos ?? null;
  }
  await anotar('eurostat-tipos', false, `Sin desglose por tipo de gasto${fallaTipos ? `: ${fallaTipos}` : ''}; se usa el anterior si lo hay`);
} else {
  await anotar('eurostat-tipos', true, `Tipos de gasto hasta ${ultimoAñoTipos(datos)}`);
}

// Deuda y déficit: otro extra. Si falla o no tiene buena pinta, se queda la de la última vez
try {
  const deuda = prepararDeuda(await descargar(urlDeuda()));
  const r = resumenDeuda({ ...datos, deuda });
  if (!r || !(r.total > 100000) || !(r.pib > 10)) throw new Error(`deuda sospechosa: ${JSON.stringify(r)?.slice(0, 120)}`);
  datos.deuda = deuda;
  await anotar('eurostat-deuda', true, `Deuda hasta ${r.año}: ${Math.round(r.pib)} % del PIB`);
} catch (e) {
  if (previo?.deuda) datos.deuda = previo.deuda;
  await anotar('eurostat-deuda', false, `Sin deuda nueva (${e.message}); se usa la anterior si la hay`);
}

// Ingresos: otro extra. El desglose de impuestos (IVA, IRPF, sociedades) es opcional: sin él, van en dos bloques
try {
  const main = await descargar(urlIngresos());
  let taxag = null;
  try {
    taxag = await descargar(urlImpuestos());
  } catch (e) {
    console.warn(`Sin desglose de impuestos (${e.message})`);
  }
  const ingresos = prepararIngresos(main, taxag);
  const r = resumenIngresos({ ...datos, ingresos });
  if (!r || !(r.total > 100000) || !(r.pib > 20)) throw new Error(`ingresos sospechosos: ${JSON.stringify(r)?.slice(0, 160)}; códigos: ${ingresos.codigos.slice(0, 40).join(' ')}`);
  datos.ingresos = ingresos;
  console.log(`Ingresos: ${JSON.stringify({ año: r.año, total: Math.round(r.total), pib: r.pib, detalle: r.detalle, bloques: r.bloques.map((b) => [b.id, Math.round(b.valor), b.pib]) })}`);
  await anotar('eurostat-ingresos', true, `Ingresos hasta ${r.año}: ${Math.round(r.pib)} % del PIB; ${r.bloques.map((b) => `${b.id} ${Math.round(b.cuota * 100)} %`).join(', ')}${r.detalle ? '' : ` (sin desglose; códigos: ${ingresos.codigos.slice(0, 40).join(' ')})`}`);
} catch (e) {
  if (previo?.ingresos) datos.ingresos = previo.ingresos;
  await anotar('eurostat-ingresos', false, `Sin ingresos nuevos (${e.message}); se usan los anteriores si los hay`);
}

datos.actualizado = new Date().toISOString();
await mkdir(new URL('../almacen/', import.meta.url), { recursive: true });
await writeFile(salida, JSON.stringify(datos));

const año = ultimoAño(datos);
const resumen = `${datos.años[0]}-${año}${datos.provisionales.includes(año) ? ' (último provisional)' : ''}, ${Math.round(gastoPorPersona(datos, año))} € por persona en ${año}`;
console.log(`Eurostat: ${resumen}`);
await anotar('eurostat', true, resumen);

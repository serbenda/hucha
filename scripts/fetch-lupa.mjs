// Descarga los datos de la Lupa y los guarda en data/lupa/:
// - contratos.json: contratos adjudicados desde 1 millón de € (Plataforma de Contratación del Sector Público,
//   incluidas las plataformas autonómicas y locales que se agregan a ella).
//   El feed se lee de lo más nuevo hacia atrás; cada ejecución añade lo nuevo y sigue rellenando hacia atrás,
//   así que el histórico crece solo. El punto por el que va se guarda en el propio fichero.
// - subvenciones.json: concesiones desde 1 millón de € a empresas y entidades, últimos 12 meses (BDNS).
// - ayuda.json: ayuda oficial al desarrollo de España por país, últimos años (OCDE).
// - contratos-portada.json y subvenciones-portada.json: los mayores y el total, para abrir la Lupa rápido.
// Cada parte es independiente: si una fuente falla, se queda la versión anterior de esa parte.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import {
  parsearAtom, esContratoUtil, compactarContrato, urlConcesiones, parsearConcesiones, UMBRAL_SUBVENCIONES,
  urlAyuda, parsearAyuda, UMBRAL_CONTRATOS, portadaDe, esMarcoPorTitulo,
} from '../assets/js/lupa-datos.js';
import { esPais } from '../assets/js/paises.js';
import { anotar } from './estado.mjs';

const carpeta = new URL('../data/lupa/', import.meta.url);
await mkdir(carpeta, { recursive: true });
const cabeceras = { 'User-Agent': 'hucha (github.com/serbenda/hucha)' };

async function leer(nombre) {
  try {
    return JSON.parse(await readFile(new URL(nombre, carpeta), 'utf8'));
  } catch {
    return null;
  }
}
const guardar = (nombre, datos) => writeFile(new URL(nombre, carpeta), JSON.stringify(datos));

async function descargar(url, { tipo = 'text', intentos = 3 } = {}) {
  let ultimo;
  for (let i = 1; i <= intentos; i++) {
    try {
      const r = await fetch(url, { headers: cabeceras, signal: AbortSignal.timeout(120000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return tipo === 'json' ? await r.json() : await r.text();
    } catch (e) {
      ultimo = e;
      await new Promise((ok) => setTimeout(ok, 3000 * i));
    }
  }
  throw ultimo;
}

const hoy = new Date();
const isoDia = (d) => d.toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Contratos

// Dos feeds: los órganos que publican directamente en la Plataforma (Estado y muchos más) y las
// plataformas propias de comunidades y ayuntamientos que se agregan a ella.
const FEEDS = {
  perfiles: 'https://contrataciondelestado.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom',
  agregadas: 'https://contrataciondelestado.es/sindicacion/sindicacion_1044/PlataformasAgregadasSinMenores.atom',
};
const PAGINAS_MAX = Number(process.env.LUPA_PAGINAS ?? 40); // por feed y ejecución
const MINUTOS_FEED = 9; // tiempo máximo por feed y ejecución
const ANTIGUEDAD_MAX = 2 * 365; // días por fecha de adjudicación

async function contratos() {
  const previo = (await leer('contratos.json')) ?? { contratos: [], cursores: {} };
  previo.cursores ??= {};
  const porId = new Map(previo.contratos.map((c) => [c.id, c]));
  const resumen = [];
  let nuevos = 0;
  let porCodigo = 0;

  for (const [clave, portada] of Object.entries(FEEDS)) {
    const cursor = previo.cursores[clave] ?? {};
    let paginas = 0;
    const inicioFeed = Date.now();
    const quedaTiempo = () => (Date.now() - inicioFeed) / 60000 < MINUTOS_FEED;
    const procesar = (pagina) => {
      for (const e of pagina.entradas) {
        if (!esContratoUtil(e)) continue;
        const id = `${clave[0]}${e.id}`;
        const anterior = porId.get(id);
        if (anterior && anterior.up >= e.actualizado) continue;
        if (!anterior) nuevos++;
        if (e.sistema === 1 || e.sistema === 2) porCodigo++;
        porId.set(id, { ...compactarContrato(e), id });
      }
    };

    try {
      // 1. Lo nuevo: desde la portada del feed hasta lo que ya se había leído
      let url = portada;
      let primero = null;
      while (url && paginas < PAGINAS_MAX && quedaTiempo()) {
        const p = parsearAtom(await descargar(url));
        paginas++;
        primero ??= p.entradas[0]?.actualizado ?? null;
        procesar(p);
        url = p.siguiente;
        const masViejo = p.entradas.at(-1)?.actualizado;
        // Primera vez: lo que queda hacia atrás lo hace el relleno
        if (!cursor.masNuevo) {
          cursor.siguiente = url;
          cursor.desde = masViejo ?? null;
          break;
        }
        if (masViejo && masViejo <= cursor.masNuevo) break;
      }
      if (primero) cursor.masNuevo = primero;

      // 2. Relleno hacia atrás con las páginas que queden
      while (cursor.siguiente && paginas < PAGINAS_MAX && quedaTiempo()) {
        const p = parsearAtom(await descargar(cursor.siguiente));
        paginas++;
        procesar(p);
        cursor.desde = p.entradas.at(-1)?.actualizado ?? cursor.desde;
        cursor.siguiente = p.siguiente;
      }
      resumen.push(`${clave}: ${paginas} páginas, desde ${cursor.desde?.slice(0, 10) ?? '?'}`);
    } catch (e) {
      resumen.push(`${clave}: falló (${e.message})`);
    }
    previo.cursores[clave] = cursor;
  }

  // Los guardados antes de marcar los acuerdos marco se miran por el título
  for (const c of porId.values()) c.m ??= esMarcoPorTitulo(c.t) ? 1 : 0;
  const limite = isoDia(new Date(hoy - ANTIGUEDAD_MAX * 864e5));
  const lista = [...porId.values()].filter((c) => !c.f || c.f >= limite).sort((a, b) => (b.a ?? 0) - (a.a ?? 0));
  if (!lista.length) throw new Error(`sin contratos (${resumen.join('; ')})`);
  // «Desde» lo que está completo en los dos feeds: el más reciente de los dos límites
  const desde = Object.values(previo.cursores).map((c) => c.desde).filter(Boolean).sort().at(-1) ?? null;
  await guardar('contratos.json', {
    actualizado: new Date().toISOString(),
    umbral: UMBRAL_CONTRATOS,
    desde,
    cursores: previo.cursores,
    contratos: lista,
  });
  return `${lista.length} contratos (${nuevos} nuevos; ${lista.filter((c) => c.m).length} acuerdos marco, ${porCodigo} reconocidos por su código). ${resumen.join('; ')}`;
}

// ---------------------------------------------------------------------------
// Subvenciones

async function subvenciones() {
  const todas = new Map();
  for (let m = 0; m < 12; m++) {
    const fin = new Date(hoy.getFullYear(), hoy.getMonth() - m + 1, 0);
    const ini = new Date(hoy.getFullYear(), hoy.getMonth() - m, 1);
    const hasta = isoDia(m === 0 ? hoy : fin);
    const desde = isoDia(ini);
    for (let pagina = 0; pagina < 10; pagina++) {
      const json = await descargar(urlConcesiones(desde, hasta, pagina), { tipo: 'json' });
      const importes = (json?.content ?? []).map((c) => c.importe ?? 0);
      if (importes.some((v, k) => k > 0 && v > importes[k - 1] + 0.01)) throw new Error(`la API no devuelve las concesiones ordenadas por importe (${importes.slice(0, 5).join(', ')}…)`);
      const lote = parsearConcesiones(json);
      for (const c of lote) if (c.i >= UMBRAL_SUBVENCIONES) todas.set(c.id, c);
      const ultimo = json?.content?.at(-1)?.importe ?? 0;
      if (json.last || ultimo < UMBRAL_SUBVENCIONES) break;
    }
  }
  if (todas.size < 10) throw new Error(`solo ${todas.size} concesiones`);
  const lista = [...todas.values()].sort((a, b) => b.i - a.i);
  await guardar('subvenciones.json', { actualizado: new Date().toISOString(), umbral: UMBRAL_SUBVENCIONES, subvenciones: lista });
  return `${lista.length} concesiones de 12 meses`;
}

// ---------------------------------------------------------------------------
// Ayuda a otros países

async function ayuda() {
  const desde = hoy.getFullYear() - 6;
  const filas = parsearAyuda(await descargar(urlAyuda(desde))).filter((f) => esPais(f.pais));
  if (filas.length < 50) throw new Error(`solo ${filas.length} datos`);
  const años = [...new Set(filas.map((f) => f.año))].sort();
  const porPais = {};
  for (const f of filas) (porPais[f.pais] ??= {})[f.año] = Math.round(f.valor * 100) / 100;
  await guardar('ayuda.json', { actualizado: new Date().toISOString(), unidad: 'millones de dólares', años, paises: porPais });
  return `${Object.keys(porPais).length} países, ${años[0]}-${años.at(-1)}`;
}

// ---------------------------------------------------------------------------

for (const [nombre, parte] of [['contratos', contratos], ['subvenciones', subvenciones], ['ayuda', ayuda]]) {
  try {
    const resumen = await parte();
    console.log(`Lupa ${nombre}: ${resumen}`);
    await anotar(`lupa-${nombre}`, true, resumen);
  } catch (e) {
    console.warn(`Lupa ${nombre}: ${e.message}. Se mantiene la versión anterior`);
    await anotar(`lupa-${nombre}`, false, e.message);
  }
}

// Ficheros de portada, con lo que haya (lo nuevo o la versión anterior)
for (const [nombre, clave, importe] of [['contratos', 'contratos', 'a'], ['subvenciones', 'subvenciones', 'i']]) {
  const d = await leer(`${nombre}.json`);
  if (d) await guardar(`${nombre}-portada.json`, portadaDe(d, clave, importe));
}

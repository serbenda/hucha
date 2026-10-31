// Descarga los datos de la Lupa y los guarda en el almacén (almacen/), completos.
// Lo que descarga la web (índice y un fichero por mes) lo prepara después scripts/escaparate.mjs:
// - contratos.json: contratos adjudicados desde 1 millón de € (Plataforma de Contratación del Sector Público,
//   incluidas las plataformas autonómicas y locales que se agregan a ella).
//   El feed se lee de lo más nuevo hacia atrás; cada ejecución añade lo nuevo y sigue rellenando hacia atrás,
//   así que el histórico crece solo. El punto por el que va se guarda en el propio fichero.
// - subvenciones.json: concesiones desde 1 millón de € a empresas y entidades, últimos 12 meses (BDNS).
// - ayuda.json: ayuda oficial al desarrollo de España por país, últimos años (OCDE).
// Cada parte es independiente: si una fuente falla, se queda la versión anterior de esa parte.

import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { execFileSync } from 'node:child_process';
import {
  parsearAtom, esContratoUtil, compactarContrato, urlConcesiones, parsearConcesiones, UMBRAL_SUBVENCIONES,
  urlAyuda, parsearAyuda, UMBRAL_CONTRATOS, esMarcoPorTitulo,
} from '../assets/js/lupa-datos.js';
import { esPais } from '../assets/js/paises.js';
import { anotar } from './estado.mjs';

const carpeta = new URL('../almacen/', import.meta.url);
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
// Cada feed se lee de dos formas:
// - Lo nuevo, cada día: las páginas del feed ATOM desde la portada hasta lo ya leído (pocas al día).
// - El histórico: los ficheros mensuales que publica la Plataforma (un ZIP por mes con todas las páginas
//   de ese mes, unos 200 MB). Se baja uno por ejecución, de más reciente a más antiguo, hasta tener dos años.
//   El mes en curso, que aún no tiene fichero, se completa con las páginas del feed hacia atrás.
const FEEDS = {
  perfiles: {
    portada: 'https://contrataciondelestado.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom',
    zip: (mes) => `sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3_${mes.replace('-', '')}.zip`,
  },
  agregadas: {
    portada: 'https://contrataciondelestado.es/sindicacion/sindicacion_1044/PlataformasAgregadasSinMenores.atom',
    zip: (mes) => `sindicacion/sindicacion_1044/PlataformasAgregadasSinMenores_${mes.replace('-', '')}.zip`,
  },
};
const DOMINIOS = ['https://contrataciondelsectorpublico.gob.es/', 'https://contrataciondelestado.es/'];
const PAGINAS_MAX = Number(process.env.LUPA_PAGINAS ?? 40); // páginas del feed por feed y ejecución
const MESES_POR_EJECUCION = Number(process.env.LUPA_MESES ?? 1); // ficheros mensuales por feed y ejecución
const MINUTOS_FEED = 9; // tiempo máximo por feed y ejecución
const ANTIGUEDAD_MAX = 2 * 365; // días por fecha de adjudicación

const mesAnterior = (mes) => {
  const [a, m] = mes.split('-').map(Number);
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, '0')}`;
};
const mesActual = hoy.toISOString().slice(0, 7);
const mesMasAntiguo = isoDia(new Date(hoy - ANTIGUEDAD_MAX * 864e5)).slice(0, 7);

/** Baja el fichero mensual de un feed y devuelve sus páginas ATOM una a una (con unzip del sistema). */
async function* paginasDelMes(feed, mes) {
  const dir = await mkdtemp(join(tmpdir(), 'lupa-'));
  const zip = join(dir, 'mes.zip');
  try {
    let ok = false;
    for (const dominio of DOMINIOS) {
      try {
        const r = await fetch(dominio + feed.zip(mes), { headers: cabeceras, signal: AbortSignal.timeout(10 * 60000) });
        if (!r.ok) continue;
        await pipeline(Readable.fromWeb(r.body), createWriteStream(zip));
        ok = true;
        break;
      } catch {}
    }
    if (!ok) throw new Error(`no está el fichero de ${mes}`);
    const ficheros = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' }).split('\n').filter((f) => f.endsWith('.atom'));
    for (const f of ficheros) yield parsearAtom(execFileSync('unzip', ['-p', zip, f], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 }));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function contratos() {
  const previo = (await leer('contratos.json')) ?? { contratos: [], cursores: {} };
  previo.cursores ??= {};
  const porId = new Map(previo.contratos.map((c) => [c.id, c]));
  const resumen = [];
  let nuevos = 0;
  let porCodigo = 0;

  for (const [clave, feed] of Object.entries(FEEDS)) {
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
    const partes = [];

    try {
      // 1. Lo nuevo: desde la portada del feed hasta lo que ya se había leído
      let url = feed.portada;
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

      // 2. El mes en curso, hacia atrás con las páginas del feed (aún no tiene fichero mensual)
      while (cursor.siguiente && (cursor.desde ?? '9') >= mesActual && paginas < PAGINAS_MAX && quedaTiempo()) {
        const p = parsearAtom(await descargar(cursor.siguiente));
        paginas++;
        procesar(p);
        cursor.desde = p.entradas.at(-1)?.actualizado ?? cursor.desde;
        cursor.siguiente = p.siguiente;
      }
      partes.push(`${paginas} páginas del feed`);
    } catch (e) {
      partes.push(`feed falló (${e.message})`);
    }

    // 3. El histórico, mes a mes con los ficheros mensuales, del más reciente al más antiguo
    cursor.mes ??= mesAnterior(mesActual);
    for (let n = 0; n < MESES_POR_EJECUCION && cursor.mes >= mesMasAntiguo; n++) {
      const mes = cursor.mes;
      try {
        let paginasMes = 0;
        for await (const p of paginasDelMes(feed, mes)) {
          procesar(p);
          paginasMes++;
        }
        partes.push(`${mes}: ${paginasMes} páginas`);
        cursor.mes = mesAnterior(mes);
        cursor.hasta = `${mes}-01`;
      } catch (e) {
        partes.push(`${mes} falló (${e.message})`);
        break;
      }
    }
    resumen.push(`${clave}: ${partes.join(', ')}; histórico desde ${cursor.hasta ?? '—'}`);
    previo.cursores[clave] = cursor;
  }

  // Los guardados antes de marcar los acuerdos marco se miran por el título
  for (const c of porId.values()) c.m ??= esMarcoPorTitulo(c.t) ? 1 : 0;
  const limite = isoDia(new Date(hoy - ANTIGUEDAD_MAX * 864e5));
  const lista = [...porId.values()].filter((c) => !c.f || c.f >= limite).sort((a, b) => (b.a ?? 0) - (a.a ?? 0));
  if (!lista.length) throw new Error(`sin contratos (${resumen.join('; ')})`);
  // «Desde» lo que está completo en los dos feeds: el más reciente de los dos límites. Con ficheros mensuales,
  // el primer día del mes más antiguo ya leído; si no, hasta donde llegó el feed hacia atrás.
  // Mientras el mes en curso no esté completo por el feed, lo cubierto empieza donde llegó el feed.
  const cubre = (c) => (c.desde && c.desde.slice(0, 7) >= mesActual ? c.desde : c.hasta ?? c.desde);
  const desde = Object.values(previo.cursores).map(cubre).filter(Boolean).sort().at(-1) ?? null;
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


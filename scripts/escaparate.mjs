// Prepara el escaparate: lo que descarga la web, a partir del almacén.
//
//   almacen/                       Datos completos, acumulados (no se publican; la Action los guarda
//     cofog.json · ejecucion.json  en la release «almacen» del repositorio)
//     contratos.json · subvenciones.json · ayuda.json
//
//   data/                          Lo que se publica con la web
//     vistas/<página>.json         Lo que enseña cada página, ya calculado (pocos KB)
//     vistas/presupuesto.json      Presupuesto del Estado frente a lo gastado (de almacen/ejecucion.json)
//     lupa/contratos.json          Índice de la Lupa: los mayores, totales por tema y administración, meses
//     lupa/contratos/AAAA-MM.json  Un fichero por mes, que solo se pide al buscar o filtrar
//     lupa/subvenciones.json · lupa/subvenciones/AAAA-MM.json
//     lupa/ayuda.json · lupa/ayuda/<país>.json   Ayuda por país y sector, y los proyectos de cada país
//
// Uso: node scripts/escaparate.mjs   (después de npm run datos / npm run lupa, o de npm run ejemplo)

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { VISTAS, vistaPresupuesto, aJson } from '../assets/js/vistas.js';
import { indiceDe, porMes } from '../assets/js/lupa-datos.js';

const raiz = new URL('../', import.meta.url);
const almacen = new URL('almacen/', raiz);
const data = new URL('data/', raiz);

async function leer(nombre) {
  try {
    return JSON.parse(await readFile(new URL(nombre, almacen), 'utf8'));
  } catch {
    return null;
  }
}

async function escribir(ruta, datos) {
  const url = new URL(ruta, data);
  await mkdir(new URL('./', url), { recursive: true });
  const texto = aJson(datos);
  await writeFile(url, texto);
  return texto.length;
}

export async function escaparate() {
  const resumen = [];

  const cofog = await leer('cofog.json');
  if (cofog) {
    for (const [pagina, vista] of Object.entries(VISTAS)) {
      const bytes = await escribir(`vistas/${pagina}.json`, vista(cofog));
      resumen.push(`vistas/${pagina}: ${(bytes / 1024).toFixed(1)} KB`);
    }
  }

  // Presupuesto frente a lo gastado (IGAE)
  const ejecucion = await leer('ejecucion.json');
  const presupuesto = ejecucion && vistaPresupuesto(ejecucion);
  if (presupuesto) resumen.push(`vistas/presupuesto: ${((await escribir('vistas/presupuesto.json', presupuesto)) / 1024).toFixed(1)} KB, hasta ${presupuesto.mes}`);

  for (const [nombre, clave, importe] of [['contratos', 'contratos', 'a'], ['subvenciones', 'subvenciones', 'i']]) {
    const d = await leer(`${nombre}.json`);
    if (!d) continue;
    // Se rehacen todos los meses: así no quedan ficheros de meses que ya no están en el almacén
    await rm(new URL(`lupa/${nombre}/`, data), { recursive: true, force: true });
    const meses = porMes(d[clave] ?? [], importe);
    let mayor = 0;
    for (const [mes, lista] of Object.entries(meses)) mayor = Math.max(mayor, await escribir(`lupa/${nombre}/${mes}.json`, { mes, [clave]: lista }));
    const bytes = await escribir(`lupa/${nombre}.json`, indiceDe(d, clave, importe));
    resumen.push(`lupa/${nombre}: índice ${(bytes / 1024).toFixed(1)} KB, ${Object.keys(meses).length} meses (el mayor, ${(mayor / 1024).toFixed(0)} KB)`);
  }

  // Ayuda a otros países: un índice (totales por año, país y sector) y un fichero por país con sus proyectos
  const ayuda = await leer('ayuda.json');
  if (ayuda) {
    const { porPais = {}, proyectos = {}, ...resto } = ayuda;
    const ultimo = ayuda.años?.at(-1);
    const sectoresPais = Object.fromEntries(Object.entries(porPais).map(([p, años]) => [p, años[ultimo] ?? {}]));
    const bytes = await escribir('lupa/ayuda.json', { ...resto, ...(ayuda.sectores ? { sectoresPais } : {}) });
    await rm(new URL('lupa/ayuda/', data), { recursive: true, force: true });
    let n = 0;
    for (const pais of Object.keys(ayuda.paises ?? {})) {
      if (!porPais[pais] && !proyectos[pais]) continue;
      await escribir(`lupa/ayuda/${pais}.json`, { pais, años: ayuda.años, total: ayuda.paises[pais], sectores: porPais[pais] ?? {}, proyectosAño: ayuda.proyectosAño, proyectos: proyectos[pais] ?? [] });
      n++;
    }
    resumen.push(`lupa/ayuda: índice ${(bytes / 1024).toFixed(1)} KB, ${n} países con detalle`);
  }
  return resumen;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const resumen = await escaparate();
  if (!resumen.length) {
    console.error('El almacén está vacío: ejecuta antes npm run datos y npm run lupa, o npm run ejemplo');
    process.exit(1);
  }
  for (const r of resumen) console.log(process.env.GITHUB_ACTIONS ? `::notice title=Escaparate::${r}` : r);
}

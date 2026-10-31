// Lector mínimo de libros de Excel (.xlsx) sin dependencias: un .xlsx es un ZIP con XML dentro.
// Se descomprime con unzip (en la Action viene instalado) y se leen las hojas pedidas como filas
// [{ A: 'texto', B: 123, … }]. Solo valores (no fórmulas ni formatos), que es lo que publica la IGAE.

import { execFileSync } from 'node:child_process';

const xml = (fichero, ruta) => {
  try {
    return execFileSync('unzip', ['-p', fichero, ruta], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });
  } catch {
    return '';
  }
};
const entidades = (t) => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const textoDe = (t) => entidades(t.replace(/<rPh[\s\S]*?<\/rPh>/g, '').replace(/<[^>]+>/g, ''));

/** Lee las hojas pedidas (por nombre) de un .xlsx. Devuelve { nombre: filas }. */
export function leerXlsx(fichero, nombres) {
  const compartidas = [...xml(fichero, 'xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textoDe(m[1]));
  const libro = xml(fichero, 'xl/workbook.xml');
  const rels = xml(fichero, 'xl/_rels/workbook.xml.rels');
  const destino = (rid) => {
    const r = [...rels.matchAll(/<Relationship\b([^>]*)\/?>/g)].map((m) => m[1]).find((a) => a.includes(`Id="${rid}"`));
    const t = r?.match(/Target="([^"]+)"/)?.[1] ?? '';
    return `xl/${t.replace(/^\/?xl\//, '')}`;
  };
  const salida = {};
  for (const [, atributos] of libro.matchAll(/<sheet\b([^>]*)\/?>/g)) {
    const nombre = entidades(atributos.match(/name="([^"]+)"/)?.[1] ?? '');
    if (!nombres.includes(nombre)) continue;
    const rid = atributos.match(/r:id="([^"]+)"/)?.[1];
    const hoja = xml(fichero, destino(rid));
    salida[nombre] = [...hoja.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map(([, fila]) => {
      const celdas = {};
      for (const [, col, attrs, dentro = ''] of fila.matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const tipo = attrs.match(/t="([^"]+)"/)?.[1];
        const v = dentro.match(/<v>([\s\S]*?)<\/v>/)?.[1];
        if (tipo === 's') celdas[col] = compartidas[Number(v)] ?? '';
        else if (tipo === 'inlineStr') celdas[col] = textoDe(dentro);
        else if (tipo === 'str') celdas[col] = entidades(v ?? '');
        else if (v !== undefined) celdas[col] = Number(v);
      }
      return celdas;
    });
  }
  return salida;
}

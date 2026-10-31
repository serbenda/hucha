// Lector de JSON-stat 2.0, el formato de la API de Eurostat.
// Este módulo lo usan tanto el navegador como el script de la GitHub Action.

/**
 * Convierte un dataset JSON-stat en una lista de observaciones planas:
 * [{ geo: 'ES', time: '2024', ..., valor: 123.4, estado: 'p' }]
 * Acepta `value` como array (denso) o como objeto (disperso, el que usa Eurostat).
 */
export function aplanar(json) {
  const ids = json?.id;
  const tamaños = json?.size;
  if (!Array.isArray(ids) || !Array.isArray(tamaños) || ids.length !== tamaños.length) {
    throw new Error('JSON-stat sin id/size');
  }

  // Para cada dimensión, la lista de códigos ordenados por su posición
  const codigos = ids.map((id, d) => {
    const indice = json.dimension?.[id]?.category?.index;
    const lista = new Array(tamaños[d]);
    if (Array.isArray(indice)) indice.forEach((c, i) => (lista[i] = c));
    else if (indice) for (const [c, i] of Object.entries(indice)) lista[i] = c;
    else if (tamaños[d] === 1) {
      // Dimensión con una sola categoría y sin índice: se toma la etiqueta
      lista[0] = Object.keys(json.dimension?.[id]?.category?.label ?? { '': '' })[0];
    }
    return lista;
  });

  // Saltos de cada dimensión en el índice plano (la última varía más rápido)
  const saltos = new Array(ids.length);
  let s = 1;
  for (let d = ids.length - 1; d >= 0; d--) {
    saltos[d] = s;
    s *= tamaños[d];
  }

  const valores = json.value ?? {};
  const estados = json.status ?? {};
  const entradas = Array.isArray(valores) ? valores.map((v, i) => [i, v]) : Object.entries(valores);

  const salida = [];
  for (const [clave, valor] of entradas) {
    if (typeof valor !== 'number' || !Number.isFinite(valor)) continue;
    let resto = Number(clave);
    const obs = {};
    for (let d = 0; d < ids.length; d++) {
      const pos = Math.floor(resto / saltos[d]);
      resto -= pos * saltos[d];
      obs[ids[d]] = codigos[d][pos];
    }
    obs.valor = valor;
    const estado = Array.isArray(estados) ? estados[clave] : estados[clave];
    if (estado) obs.estado = estado;
    salida.push(obs);
  }
  return salida;
}

/** Etiqueta de un código de una dimensión, si el dataset la trae. */
export function etiqueta(json, dimension, codigo) {
  return json?.dimension?.[dimension]?.category?.label?.[codigo] ?? codigo;
}

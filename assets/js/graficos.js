// Gráficos de hucha, en HTML y CSS (sin librerías). Devuelven HTML para insertar.
// Todos son de una sola serie: un solo color (el cobre) y el valor escrito al lado, así que no dependen
// del color para leerse. Cada marca lleva su texto completo en title (al pasar el ratón) y en el texto
// accesible. Si se les da una acción, cada barra o bloque es un botón que lleva al detalle.

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/**
 * Barras horizontales: una fila por elemento, con su nombre, la barra y la cifra.
 * items: [{ id, nombre, valor, texto, nota?, icono? }]; con accion, cada fila es un botón con data-<accion>=id.
 */
export function barras(items, { accion = '', max = Math.max(...items.map((x) => x.valor), 0), activo = '' } = {}) {
  if (!items.length || !(max > 0)) return '';
  return `<ul class="g-barras">${items
    .map((x) => {
      const ancho = Math.max(0.5, (x.valor / max) * 100).toFixed(1);
      const dentro = `<span class="g-nombre">${x.icono ?? ''}<span>${esc(x.nombre)}</span></span>
        <span class="g-cifra">${esc(x.texto)}${x.nota ? `<small>${esc(x.nota)}</small>` : ''}</span>
        <span class="g-pista" aria-hidden="true"><i style="--ancho: ${ancho}%"></i></span>`;
      return `<li>${
        accion
          ? `<button type="button" class="g-fila" data-${accion}="${esc(x.id)}" aria-pressed="${String(activo === x.id)}" title="${esc(`${x.nombre}: ${x.texto}`)}">${dentro}</button>`
          : `<div class="g-fila" title="${esc(`${x.nombre}: ${x.texto}`)}">${dentro}</div>`
      }</li>`;
    })
    .join('')}</ul>`;
}

/**
 * Columnas (para el tiempo: meses o años). items: [{ etiqueta, corta, valor, texto }].
 * Se rotula la mayor y las etiquetas del eje se espacian para que no se pisen.
 */
export function columnas(items, { titulo = '' } = {}) {
  const max = Math.max(...items.map((x) => x.valor), 0);
  if (!items.length || !(max > 0)) return '';
  const cada = Math.ceil(items.length / 5);
  const mayor = items.findIndex((x) => x.valor === max);
  return `<figure class="g-columnas" role="img" aria-label="${esc(`${titulo}: ${items.map((x) => `${x.etiqueta} ${x.texto}`).join(', ')}`)}">
    <div class="g-lienzo">${items
      .map(
        (x, i) => `<span class="g-col${i === mayor ? ' mayor' : ''}" style="--alto: ${Math.max(1, (x.valor / max) * 100).toFixed(1)}%" title="${esc(`${x.etiqueta}: ${x.texto}`)}">${
          i === mayor ? `<b class="${i > items.length * 0.7 ? 'fin' : i < items.length * 0.3 ? 'inicio' : ''}">${esc(x.rotulo ?? x.texto)}</b>` : ''
        }</span>`
      )
      .join('')}</div>
    <div class="g-eje" aria-hidden="true">${items
      .map((x, i) => [x, i])
      .filter(([, i]) => i === 0 || i === items.length - 1 || (i % cada === 0 && i < items.length - cada / 2))
      .map(([x, i]) => {
        const sitio = i === 0 ? 'left: 0' : i === items.length - 1 ? 'right: 0' : `left: ${(((i + 0.5) / items.length) * 100).toFixed(2)}%; transform: translateX(-50%)`;
        return `<span style="${sitio}">${esc(x.corta ?? x.etiqueta)}</span>`;
      })
      .join('')}</div>
  </figure>`;
}

/**
 * Mapa de bloques (treemap): el área de cada bloque es su parte del total. items: [{ id, nombre, valor, texto, href? }].
 * Algoritmo «squarified» (Bruls, Huizing y van Wijk), para que los bloques salgan lo más cuadrados posible.
 */
export function bloques(items, { ancho = 100, alto = 62, titulo = '' } = {}) {
  const lista = items.filter((x) => x.valor > 0).sort((a, b) => b.valor - a.valor);
  const total = lista.reduce((t, x) => t + x.valor, 0);
  if (!total) return '';
  const area = ancho * alto;
  const nodos = lista.map((x) => ({ ...x, a: (x.valor / total) * area }));
  const rects = [];
  let caja = { x: 0, y: 0, w: ancho, h: alto };
  const peor = (fila, lado) => {
    const s = fila.reduce((t, n) => t + n.a, 0);
    const mx = Math.max(...fila.map((n) => n.a));
    const mn = Math.min(...fila.map((n) => n.a));
    return Math.max((lado * lado * mx) / (s * s), (s * s) / (lado * lado * mn));
  };
  const colocar = (fila) => {
    const s = fila.reduce((t, n) => t + n.a, 0);
    if (caja.w >= caja.h) {
      const w = s / caja.h;
      let y = caja.y;
      for (const n of fila) rects.push({ ...n, x: caja.x, y, w, h: n.a / w }), (y += n.a / w);
      caja = { x: caja.x + w, y: caja.y, w: caja.w - w, h: caja.h };
    } else {
      const h = s / caja.w;
      let x = caja.x;
      for (const n of fila) rects.push({ ...n, x, y: caja.y, w: n.a / h, h }), (x += n.a / h);
      caja = { x: caja.x, y: caja.y + h, w: caja.w, h: caja.h - h };
    }
  };
  let fila = [];
  for (const n of nodos) {
    const lado = Math.min(caja.w, caja.h);
    if (!fila.length || peor([...fila, n], lado) <= peor(fila, lado)) fila.push(n);
    else {
      colocar(fila);
      fila = [n];
    }
  }
  if (fila.length) colocar(fila);

  const pct = (v, t) => `${((v / t) * 100).toFixed(3)}%`;
  return `<div class="g-bloques" style="aspect-ratio: ${ancho} / ${alto}" role="group" aria-label="${esc(titulo)}">${rects
    .map((r, i) => {
      const grande = r.w * r.h > area * 0.035;
      const etiqueta = `${r.nombre}: ${r.texto}`;
      const estilo = `left:${pct(r.x, ancho)};top:${pct(r.y, alto)};width:${pct(r.w, ancho)};height:${pct(r.h, alto)}`;
      const clase = `g-bloque${i < 3 ? ' fuerte' : ''}${grande ? '' : ' pequeno'}`;
      const dentro = grande ? `<span class="g-bloque-nombre">${esc(r.nombre)}</span><span class="g-bloque-cifra">${esc(r.texto)}</span>` : '';
      return r.href
        ? `<a class="${clase}" href="${esc(r.href)}" style="${estilo}" title="${esc(etiqueta)}" aria-label="${esc(etiqueta)}">${dentro}</a>`
        : `<span role="img" class="${clase}" style="${estilo}" title="${esc(etiqueta)}" aria-label="${esc(etiqueta)}">${dentro}</span>`;
    })
    .join('')}</div>`;
}

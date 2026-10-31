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
export function bloques(items, { ancho = 100, alto = 62, titulo = '', otros = null } = {}) {
  let lista = items.filter((x) => x.valor > 0).sort((a, b) => b.valor - a.valor);
  const total = lista.reduce((t, x) => t + x.valor, 0);
  if (!total) return '';
  // Los bloques muy pequeños no se leen ni se pueden pulsar bien en el móvil: se juntan en uno
  // (otros: { minimo, nombre(n, lista), texto(valor), href })
  if (otros) {
    const pequeños = lista.filter((x) => x.valor / total < otros.minimo);
    if (pequeños.length > 1) {
      const valor = pequeños.reduce((t, x) => t + x.valor, 0);
      lista = [...lista.filter((x) => !pequeños.includes(x)), { id: 'otros', nombre: otros.nombre(pequeños.length, pequeños), valor, texto: otros.texto(valor), href: otros.href, color: otros.color }];
    }
  }
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
      const clase = `g-bloque${r.color ? ' con-color' : i < 3 ? ' fuerte' : ''}${grande ? '' : ' pequeno'}`;
      const color = r.color ? `;--c:${r.color}` : '';
      const dentro = grande ? `<span class="g-bloque-nombre">${esc(r.nombre)}</span><span class="g-bloque-cifra">${esc(r.texto)}</span>` : '';
      return r.href
        ? `<a class="${clase}" href="${esc(r.href)}" style="${estilo}${color}" title="${esc(etiqueta)}" aria-label="${esc(etiqueta)}">${dentro}</a>`
        : `<span role="img" class="${clase}" style="${estilo}${color}" title="${esc(etiqueta)}" aria-label="${esc(etiqueta)}">${dentro}</span>`;
    })
    .join('')}</div>`;
}

/**
 * Avance: cuánto se lleva de un total, con una marca de «dónde se debería ir» (por ejemplo, la parte del año
 * transcurrida). items: [{ id, nombre, valor (0-1), texto, nota?, icono? }]; marca: 0-1; con accion, cada fila es un botón.
 */
export function avance(items, { marca = null, textoMarca = '', accion = '', enLinea = false } = {}) {
  if (!items.length) return '';
  // enLinea: solo con <span>, para usarlo dentro de un <summary>
  if (enLinea) {
    const x = items[0];
    const ancho = Math.max(0, Math.min(1, x.valor ?? 0)) * 100;
    return `<span class="g-fila g-en-linea"><span class="g-nombre">${x.icono ?? ''}<span>${esc(x.nombre)}</span></span><span class="g-cifra">${esc(x.texto)}${x.nota ? `<small>${esc(x.nota)}</small>` : ''}</span><span class="g-pista" aria-hidden="true"><i style="--ancho: ${ancho.toFixed(1)}%"></i>${marca !== null ? `<b class="g-marca" style="--marca: ${(marca * 100).toFixed(1)}%"></b>` : ''}</span></span>`;
  }
  return `<ul class="g-avance">${items
    .map((x) => {
      const ancho = Math.max(0, Math.min(1, x.valor ?? 0)) * 100;
      const dentro = `<span class="g-nombre">${x.icono ?? ''}<span>${esc(x.nombre)}</span></span>
        <span class="g-cifra">${esc(x.texto)}${x.nota ? `<small>${esc(x.nota)}</small>` : ''}</span>
        <span class="g-pista" aria-hidden="true"><i style="--ancho: ${ancho.toFixed(1)}%"></i>${marca !== null ? `<b class="g-marca" style="--marca: ${(marca * 100).toFixed(1)}%" title="${esc(textoMarca)}"></b>` : ''}</span>`;
      return `<li>${
        accion
          ? `<button type="button" class="g-fila" data-${accion}="${esc(x.id)}" aria-expanded="false" title="${esc(`${x.nombre}: ${x.texto}`)}">${dentro}</button>`
          : `<div class="g-fila" title="${esc(`${x.nombre}: ${x.texto}`)}">${dentro}</div>`
      }</li>`;
    })
    .join('')}</ul>`;
}

/**
 * Líneas sobre los 12 meses del año (0-100 %). series: [{ nombre, clase, puntos: [{ mes (1-12), valor (0-1) }] }].
 * Las líneas van en SVG y los textos en HTML encima. La primera serie se rotula al final de la línea.
 */
export function lineasDelAño(series, { titulo = '', referencia = true } = {}) {
  const x = (mes) => ((mes - 0.5) / 12) * 100;
  const y = (v) => 100 - v * 100;
  const camino = (puntos) => puntos.filter((p) => p.valor !== null).map((p, i) => `${i ? 'L' : 'M'}${x(p.mes).toFixed(2)},${y(p.valor).toFixed(2)}`).join(' ');
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const principal = series[0]?.puntos.filter((p) => p.valor !== null).at(-1);
  const texto = series.map((s) => `${s.nombre}: ${s.puntos.filter((p) => p.valor !== null).map((p) => `${meses[p.mes - 1]} ${Math.round(p.valor * 100)} %`).join(', ')}`).join('. ');
  return `<figure class="g-lineas">
    <div class="g-lineas-lienzo" role="img" aria-label="${esc(`${titulo}. ${texto}`)}">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        ${[0.25, 0.5, 0.75, 1].map((v) => `<line class="g-rejilla" x1="0" x2="100" y1="${y(v)}" y2="${y(v)}"/>`).join('')}
        ${referencia ? `<line class="g-referencia" x1="0" y1="100" x2="100" y2="0"/>` : ''}
        ${series.map((s) => `<path class="g-serie ${s.clase ?? ''}" d="${camino(s.puntos)}"/>`).join('')}
      </svg>
      ${[0.25, 0.5, 0.75, 1].map((v) => `<span class="g-eje-y" style="top: ${y(v)}%">${v * 100} %</span>`).join('')}
      ${principal ? `<span class="g-rotulo" style="left: ${x(principal.mes)}%; top: ${y(principal.valor)}%">${Math.round(principal.valor * 100)} %</span>` : ''}
    </div>
    <div class="g-eje g-eje-meses" aria-hidden="true">${meses.map((m, i) => `<span style="left: ${x(i + 1)}%">${i % 2 === 0 ? m : ''}</span>`).join('')}</div>
    <figcaption class="leyenda">${series.map((s) => `<span><i class="g-muestra ${s.clase ?? ''}"></i>${esc(s.nombre)}</span>`).join('')}${referencia ? '<span><i class="g-muestra g-referencia"></i>Al mismo ritmo todo el año</span>' : ''}</figcaption>
  </figure>`;
}

/**
 * Cien cuadrados («de cada 100 €»): cada cuadrado es un euro de cada cien, del color de su partida.
 * items: [{ id, nombre, valor (parte del total, 0-1), color (CSS), texto, href?, icono? }], ya en el orden en que
 * se quieren pintar. Los cuadrados se reparten por el método del mayor resto, para que sumen siempre 100.
 * Al lado, la leyenda con cada partida, su color, su cifra y un enlace a su detalle.
 */
export function cien(items, { titulo = '' } = {}) {
  const total = items.reduce((t, x) => t + x.valor, 0);
  if (!total) return '';
  const exactos = items.map((x) => (x.valor / total) * 100);
  const cuadros = exactos.map(Math.floor);
  let faltan = 100 - cuadros.reduce((t, n) => t + n, 0);
  exactos
    .map((v, i) => [v - Math.floor(v), i])
    .sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => {
      if (faltan > 0) {
        cuadros[i]++;
        faltan--;
      }
    });
  const celdas = items.flatMap((x, i) => Array.from({ length: cuadros[i] }, () => `<i style="--c: ${x.color}" title="${esc(`${x.nombre}: ${x.texto}`)}" data-de="${esc(x.id)}"></i>`));
  return `<div class="g-cien">
    <div class="g-cien-rejilla" role="img" aria-label="${esc(`${titulo}: ${items.map((x) => `${x.nombre} ${x.texto}`).join(', ')}`)}">${celdas.join('')}</div>
    <ul class="g-cien-leyenda">${items
      .map((x) => {
        const dentro = `<i class="g-cien-muestra" style="--c: ${x.color}" aria-hidden="true"></i><span class="g-cien-nombre">${esc(x.nombre)}${x.nota ? `<small>${esc(x.nota)}</small>` : ''}</span><b>${esc(x.texto)}</b>`;
        return `<li data-de="${esc(x.id)}">${x.href ? `<a href="${esc(x.href)}">${dentro}</a>` : `<span>${dentro}</span>`}</li>`;
      })
      .join('')}</ul>
  </div>`;
}

/** Al pasar por una partida de la leyenda (o por un cuadrado), se resaltan sus cuadrados y su línea. */
export function activarCien(caja) {
  const g = caja.querySelector('.g-cien');
  if (!g) return;
  const marcar = (id) => {
    if (id) g.dataset.activo = id;
    else delete g.dataset.activo;
    g.querySelectorAll('[data-de]').forEach((el) => el.classList.toggle('activo', el.dataset.de === id));
  };
  g.addEventListener('pointerover', (e) => marcar(e.target.closest('[data-de]')?.dataset.de ?? ''));
  g.addEventListener('pointerleave', () => marcar(''));
  g.addEventListener('focusin', (e) => marcar(e.target.closest('[data-de]')?.dataset.de ?? ''));
  g.addEventListener('focusout', () => marcar(''));
}

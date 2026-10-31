// Genera la versión en inglés (en/) a partir de las páginas en castellano: mismas páginas, mismos scripts y mismos
// datos; cambian los textos fijos (con scripts/traduccion-en.mjs), el idioma, las rutas y el enlace de idioma.
// Los textos que escriben los scripts se traducen en cada script con t() (assets/js/idioma.js), según <html lang>.
// Los datos de la Lupa (títulos de contratos, organismos, empresas, convocatorias, proyectos) no se traducen:
// salen tal cual los publican las fuentes.
//
// Uso: node scripts/ingles.mjs            genera en/
//      node scripts/ingles.mjs --comprobar   solo comprueba que no falte ninguna traducción (lo usan los tests)

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { EN, NO_SE_TRADUCE } from './traduccion-en.mjs';

export const PAGINAS = ['', 'a-donde-va/', 'quien-gasta/', 'presupuesto/', 'lupa/', 'fuentes/'];
const WEB = 'https://hucha.bendi.dev/';
const raiz = new URL('../', import.meta.url);

const conLetras = (t) => /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(t);
const ATRIBUTOS = /(\s(?:alt|aria-label|placeholder|title)=")([^"]*)(")/g;
const META = /(<meta\s+(?:name="description"|property="og:(?:title|description|image:alt)")\s+content=")([^"]*)(")/g;

/** Traduce una página. Devuelve { html, faltan: [textos sin traducción] }. */
export function traducir(html, ruta) {
  const faltan = [];
  const traduce = (texto) => {
    const t = texto.trim();
    if (!t || !conLetras(t) || NO_SE_TRADUCE.has(t)) return texto;
    if (EN[t] === undefined) {
      faltan.push(t);
      return texto;
    }
    return texto.replace(t, EN[t]);
  };

  // Los trozos que no se tocan: scripts, estilos y dibujos SVG
  const partes = html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>)/);
  const profundidad = ruta ? 1 : 0;
  const salida = partes
    .map((p, i) => {
      if (i % 2 === 1) return p.startsWith('<script') ? cambiarRutas(p, profundidad) : p;
      let x = p
        .replace(/>([^<]+)</g, (m, t) => `>${traduce(t)}<`)
        // El texto pegado a un dibujo SVG (botones con icono): antes del primer < y después del último >
        .replace(/^([^<]+)/, (m, t) => (i > 0 ? traduce(t) : t))
        .replace(/>([^<>]+)$/, (m, t) => (i < partes.length - 1 ? `>${traduce(t)}` : m))
        .replace(ATRIBUTOS, (m, a, v, b) => a + traduce(v) + b)
        .replace(META, (m, a, v, b) => a + traduce(v) + b);
      return cambiarRutas(x, profundidad);
    })
    .join('');

  const html2 = salida
    .replace('<html lang="es">', '<html lang="en">')
    .replace('content="es_ES"', 'content="en_GB"')
    .replace(new RegExp(`(<link rel="canonical" href=")${WEB}${ruta}(")`), `$1${WEB}en/${ruta}$2`)
    .replace(new RegExp(`(<meta property="og:url" content=")${WEB}${ruta}(")`), `$1${WEB}en/${ruta}$2`)
    // El enlace de idioma pasa a llevar a la versión en castellano
    .replace(/<a class="idioma"[^>]*>[^<]*<\/a>/, `<a class="idioma" href="${'../'.repeat(profundidad + 1)}${ruta}" hreflang="es" lang="es">Español</a>`);
  return { html: html2, faltan };
}

/**
 * Las rutas relativas a páginas se quedan igual (en/ tiene las mismas páginas); las de recursos (assets, vendor,
 * manifest…) suben un nivel más, porque en/ está un directorio por debajo.
 */
function cambiarRutas(html, profundidad) {
  return html.replace(/(\s(?:href|src)=")([^"#:][^"]*)(")/g, (m, a, url, b) => {
    if (url.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(url)) return m;
    // Ruta del destino, relativa a la raíz de la web (las páginas en castellano están en la raíz o un nivel por debajo)
    const pila = profundidad ? ['x'] : [];
    for (const p of url.split('?')[0].split('/')) {
      if (p === '..') pila.pop();
      else if (p !== '.') pila.push(p);
    }
    const destino = pila.join('/');
    const esPagina = PAGINAS.includes(destino) || destino === '' || (destino.endsWith('/') && PAGINAS.includes(destino));
    if (esPagina || url.startsWith('?')) return m;
    if (/^en\//.test(destino)) return m;
    return a + '../' + url + b;
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const comprobar = process.argv.includes('--comprobar');
  const faltan = new Set();
  for (const ruta of PAGINAS) {
    const origen = new URL(`${ruta}index.html`, raiz);
    const { html, faltan: f } = traducir(await readFile(origen, 'utf8'), ruta);
    f.forEach((t) => faltan.add(t));
    if (!comprobar) {
      const destino = new URL(`en/${ruta}index.html`, raiz);
      await mkdir(new URL('./', destino), { recursive: true });
      await writeFile(destino, html);
    }
  }
  if (faltan.size) {
    console.error(`Faltan ${faltan.size} traducciones en scripts/traduccion-en.mjs:\n${[...faltan].map((t) => `  ${JSON.stringify(t)}`).join('\n')}`);
    process.exit(1);
  }
  console.log(comprobar ? 'Todas las traducciones están' : `en/ generado: ${PAGINAS.length} páginas`);
}

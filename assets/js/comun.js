// Código común a todas las páginas: modo sin conexión y contador de visitas.

// Service worker: guarda la web y los últimos datos para consultarlos sin conexión.
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register(new URL('../../sw.js', import.meta.url), { scope: new URL('../../', import.meta.url).pathname }).catch(() => {});
}

// Visitas con GoatCounter: sin cookies ni datos personales. Solo en la web publicada.
// Las rutas se cuentan como /hucha/… para que no se mezclen con las de bendi.dev en el panel de visitas.
if (location.hostname.endsWith('bendi.dev')) {
  window.goatcounter = { ...(window.goatcounter ?? {}), path: (p) => (p.startsWith('/hucha') ? p : `/hucha${p}`) };
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.dataset.goatcounter = 'https://serbenda.goatcounter.com/count';
  document.head.append(s);
}

// Avisos de errores (en Fuentes): el enlace a GitHub ya lleva la página de la que vienes, el navegador y la
// pantalla, para que quien avisa no tenga que explicarlo. No se envía nada: solo se rellena el formulario.
const en = document.documentElement.lang.startsWith('en');
const origen = (() => {
  try {
    const r = new URL(document.referrer);
    return r.origin === location.origin ? r.href : location.href;
  } catch {
    return location.href;
  }
})();
for (const a of document.querySelectorAll('a[data-aviso]')) {
  const fallo = a.dataset.aviso === 'fallo';
  const titulo = fallo ? (en ? 'Something does not work: ' : 'Algo no funciona: ') : en ? 'Data: ' : 'Dato: ';
  const cuerpo = fallo
    ? [
        en ? '**What happens?** (blank page, button that does nothing, something that does not load…)' : '**¿Qué pasa?** (página en blanco, un botón que no hace nada, algo que no carga…)',
        '',
        '',
        '---',
        `${en ? 'Page' : 'Página'}: ${origen}`,
        `${en ? 'Browser' : 'Navegador'}: ${navigator.userAgent}`,
        `${en ? 'Screen' : 'Pantalla'}: ${innerWidth}×${innerHeight} (${devicePixelRatio}x)`,
        `${en ? 'Language' : 'Idioma'}: ${navigator.language}`,
      ]
    : [en ? '**What is wrong?**' : '**¿Qué no cuadra?**', '', '', en ? '**Link to the official source (if you have it):**' : '**Enlace a la fuente oficial (si lo tienes):**', '', '', '---', `${en ? 'Page' : 'Página'}: ${origen}`];
  const u = new URL(a.href);
  u.searchParams.set('title', titulo);
  u.searchParams.set('body', cuerpo.join('\n'));
  a.href = u.href;
}

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

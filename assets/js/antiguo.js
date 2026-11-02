// Aviso para navegadores antiguos. Va como script clásico y sin sintaxis moderna, para que funcione justo donde
// los módulos de la web no: si al navegador le falta lo que usa hucha, se dice en vez de dejar la página en blanco.
(function () {
  var moderno =
    'noModule' in document.createElement('script') &&
    typeof Array.prototype.at === 'function' &&
    typeof Object.hasOwn === 'function' &&
    typeof window.structuredClone === 'function';
  if (moderno) return;
  var en = (document.documentElement.lang || '').indexOf('en') === 0;
  var b = document.createElement('p');
  b.className = 'banda';
  b.setAttribute('role', 'alert');
  b.textContent = en
    ? 'Your browser is too old for this website and some parts will not work. Please update it (or try another one) and reload the page.'
    : 'Tu navegador es demasiado antiguo para esta web y algunas partes no funcionarán. Actualízalo (o prueba con otro) y recarga la página.';
  document.body.insertBefore(b, document.body.firstChild);
})();

// Idioma de la página: castellano (por defecto) o inglés (las páginas de en/, con <html lang="en">).
// t('texto', 'text') devuelve el texto en el idioma de la página. En Node (tests y la Action) siempre es castellano.

const lang = globalThis.document?.documentElement?.lang ?? 'es';
export const EN = lang.startsWith('en');
export const LOCALE = EN ? 'en-GB' : 'es-ES';
export const t = (es, en) => (EN ? en : es);

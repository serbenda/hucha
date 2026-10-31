// Lupa: contratos, subvenciones y ayuda a otros países, con nombre y cifra.
// Este módulo lo usan tanto el navegador (buscar) como el script de la Action (leer las fuentes).

// ---------------------------------------------------------------------------
// Utilidades

/** Minúsculas y sin tildes, para buscar «ferrocarril» y encontrar «FERROCARRÍL». */
export const normalizar = (t) =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/**
 * NIF de una persona (DNI o NIE): sus datos no se publican en hucha.
 * Las empresas y entidades empiezan por letra (A, B, G, P, Q, S…); las personas, por número o X, Y, Z, K, L, M.
 */
export const esPersona = (nif) => /^[0-9XYZKLM]/i.test(String(nif ?? '').trim());

const entidades = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&#xD;': ' ', '&#xA;': ' ', '&#13;': ' ', '&#10;': ' ' };
const texto = (t) =>
  String(t ?? '')
    .replace(/&(amp|lt|gt|quot|apos|#xD|#xA|#13|#10);/g, (m) => entidades[m] ?? m)
    .replace(/\s+/g, ' ')
    .trim();

/** Primer contenido de una etiqueta XML (sin atributos ni prefijo obligatorio). */
function etiqueta(xml, nombre) {
  const m = xml.match(new RegExp(`<${nombre}(?:\\s[^>]*)?>([\\s\\S]*?)</${nombre}>`));
  return m ? texto(m[1]) : null;
}
function todas(xml, nombre) {
  return [...xml.matchAll(new RegExp(`<${nombre}(?:\\s[^>]*)?>([\\s\\S]*?)</${nombre}>`, 'g'))].map((m) => m[1]);
}
const numero = (t) => {
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

// ---------------------------------------------------------------------------
// Contratos (Plataforma de Contratación del Sector Público, ATOM con CODICE)

/** Tipos de contrato (ContractCode). */
export const TIPOS_CONTRATO = {
  1: 'Suministro', 2: 'Servicios', 3: 'Obras', 21: 'Gestión de servicios públicos', 22: 'Concesión de servicios',
  31: 'Concesión de obra pública', 32: 'Concesión de obras', 40: 'Colaboración público-privada',
  7: 'Administrativo especial', 8: 'Privado', 50: 'Patrimonial', 999: 'Otros',
};

/**
 * Para qué es un contrato, según su código CPV (la clasificación oficial de la UE):
 * construir, mantener o reparar, comprar, o prestar un servicio.
 */
export function finalidad(cpv) {
  const c = String(cpv ?? '');
  if (/^45/.test(c)) return 'Obra';
  if (/^50/.test(c)) return 'Mantenimiento y reparación';
  if (/^(0|1|2|3)/.test(c)) return 'Compra de bienes';
  if (/^(7[1-4]|79|80|85|90|92)/.test(c)) return 'Servicios y estudios';
  if (/^6[0-4]/.test(c)) return 'Transporte y logística';
  return c ? 'Servicios' : null;
}

/**
 * Temas para filtrar rápido, por el código CPV del contrato o por las palabras del título.
 * Un contrato puede tener varios. El orden es el de los botones de la Lupa.
 */
export const TEMAS = [
  {
    id: 'tren', nombre: 'Tren',
    cpv: /^(45234|3462|3494|3522|5022|6020|6021|6022|63711|71311210)/,
    texto: /ferrovi|ferrocarril|\badif\b|\brenfe\b|cercania|alta velocidad|\bave\b|via ferrea|catenaria|material rodante|\btren(es)?\b/,
  },
  { id: 'carreteras', nombre: 'Carreteras', cpv: /^(45233|45221|34928|50230)/, texto: /carretera|autovia|autopista|calzada|firme|\bvial(es)?\b|puente|tunel/ },
  { id: 'transporte', nombre: 'Transporte', cpv: /^(6010|6011|6040|6042|6342|6343|34121|45241|45242)/, texto: /autobus|metro|tranvia|aeropuerto|\baena\b|puerto|maritim|transporte (publico|urbano|regular)/ },
  { id: 'sanidad', nombre: 'Sanidad', cpv: /^(33|85)/, texto: /hospital|sanitari|salud|medicament|farmac|centro de salud|quirurg/ },
  { id: 'educacion', nombre: 'Educación', cpv: /^80/, texto: /colegio|instituto|escuela|universidad|educati|docente|comedor escolar|ensenanza/ },
  { id: 'social', nombre: 'Servicios sociales', cpv: /^853/, texto: /dependencia|residencia|mayores|servicios sociales|ayuda a domicilio|discapacidad|inclusion|menores/ },
  { id: 'vivienda', nombre: 'Vivienda', cpv: /^(45211|7031)/, texto: /vivienda|alquiler social|rehabilitacion de edificios|parque publico/ },
  { id: 'energia', nombre: 'Energía', cpv: /^(09|31|6531|45251|45231)/, texto: /energ|electric|fotovolta|renovable|gas natural|alumbrado|eficiencia/ },
  { id: 'agua', nombre: 'Agua y medio ambiente', cpv: /^(4523|6510|9040|905|9070|774)/, texto: /abastecimiento|depuradora|saneamiento|aguas residuales|regadio|presa|residuos|basura|limpieza viaria|incendio|forestal|medio ambiente/ },
  { id: 'seguridad', nombre: 'Seguridad y justicia', cpv: /^(3523|7523|7524)/, texto: /policia|guardia civil|seguridad ciudadana|bomberos|emergencias|juzgado|justicia|prision|penitenciari/ },
  { id: 'defensa', nombre: 'Defensa', cpv: /^(35|3530)/, texto: /defensa|militar|ejercito|armada|fuerzas armadas/ },
  { id: 'tecnologia', nombre: 'Tecnología', cpv: /^(30|48|72|324)/, texto: /informatic|software|licencia|digital|ciberseguridad|\bnube\b|telecomunicacion/ },
  { id: 'cultura', nombre: 'Cultura y deporte', cpv: /^(92|3740|45212)/, texto: /cultura|museo|biblioteca|teatro|festival|deporte|polideportiv|piscina|patrimonio/ },
  { id: 'empleo', nombre: 'Empleo y empresas', cpv: /^(7953|8053)/, texto: /empleo|formacion para el empleo|emprend|pyme|empresa|industria|comercio|turismo/ },
  { id: 'campo', nombre: 'Campo y pesca', cpv: /^(03|77)/, texto: /agricol|agrari|ganader|pesca|regantes|forestal|rural/ },
];

export function temas(texto_, cpvs = []) {
  const t = normalizar(texto_);
  return TEMAS.filter((x) => cpvs.some((c) => x.cpv.test(c)) || x.texto.test(t)).map((x) => x.id);
}

/** Nivel de la administración que contrata, según la jerarquía que publica la Plataforma. */
function nivelAdministracion(jerarquia) {
  const j = normalizar(jerarquia.join(' | '));
  if (/entidades locales|ayuntamiento|diputaci|cabildo|consell insular/.test(j)) return 'Ayuntamientos';
  if (/comunidad|autonom|junta de|generalitat|gobierno de (aragon|canarias|navarra|cantabria)|xunta/.test(j)) return 'Comunidades';
  if (/universidad/.test(j)) return 'Universidades';
  if (/estatal|ministerio|estado|adif|renfe|aena|puertos del estado/.test(j)) return 'Estado';
  return 'Otros';
}

/**
 * Lee una página del feed ATOM: { actualizado, siguiente, entradas: [contrato] }.
 * Cada contrato adjudicado o resuelto trae lo que se adjudicó, a quién y cuándo.
 */
export function parsearAtom(xml) {
  const siguiente = xml.match(/<link[^>]*href="([^"]+)"[^>]*rel="next"/)?.[1] ?? xml.match(/<link[^>]*rel="next"[^>]*href="([^"]+)"/)?.[1] ?? null;
  const actualizado = etiqueta(xml.slice(0, 3000), 'updated');
  const entradas = xml
    .split('<entry>')
    .slice(1)
    .map((e) => e.slice(0, e.indexOf('</entry>')))
    .map(parsearEntrada)
    .filter(Boolean);
  return { actualizado, siguiente: siguiente ? texto(siguiente) : null, entradas };
}

export function parsearEntrada(e) {
  const id = etiqueta(e, 'id');
  if (!id) return null;
  const estado = etiqueta(e, 'cbc-place-ext:ContractFolderStatusCode');
  const enlace = texto(e.match(/<link[^>]*href="([^"]+)"/)?.[1] ?? '');
  const titulo = etiqueta(e, 'title');
  const actualizado = etiqueta(e, 'updated');

  const parte = e.match(/<cac-place-ext:LocatedContractingParty>([\s\S]*?)<\/cac-place-ext:LocatedContractingParty>/)?.[1] ?? '';
  const organo = etiqueta(parte.split('<cac-place-ext:ParentLocatedParty>')[0], 'cbc:Name');
  const jerarquia = [...parte.matchAll(/<cac-place-ext:ParentLocatedParty>\s*<cac:PartyName>\s*<cbc:Name>([\s\S]*?)<\/cbc:Name>/g)].map((m) => texto(m[1]));

  const proyecto = e.match(/<cac:ProcurementProject>([\s\S]*?)<\/cac:ProcurementProject>/)?.[1] ?? '';
  const tipo = numero(etiqueta(proyecto, 'cbc:TypeCode'));
  const cpvs = todas(proyecto, 'cbc:ItemClassificationCode').map(texto);
  const licitado = numero(etiqueta(proyecto.match(/<cac:BudgetAmount>([\s\S]*?)<\/cac:BudgetAmount>/)?.[1] ?? '', 'cbc:TaxExclusiveAmount'));

  // Un contrato puede tener varios lotes, cada uno con su adjudicatario
  let adjudicado = 0;
  let fecha = null;
  const ganadores = new Map();
  for (const r of todas(e, 'cac:TenderResult')) {
    const codigo = numero(etiqueta(r, 'cbc:ResultCode'));
    if (codigo !== null && ![8, 9].includes(codigo)) continue; // 8 adjudicado, 9 formalizado; el resto: desierto, desistido…
    const importe = numero(etiqueta(r.match(/<cac:LegalMonetaryTotal>([\s\S]*?)<\/cac:LegalMonetaryTotal>/)?.[1] ?? '', 'cbc:TaxExclusiveAmount'));
    if (importe) adjudicado += importe;
    const f = etiqueta(r, 'cbc:AwardDate');
    if (f && (!fecha || f > fecha)) fecha = f;
    const g = r.match(/<cac:WinningParty>([\s\S]*?)<\/cac:WinningParty>/)?.[1];
    if (g) {
      const nif = etiqueta(g, 'cbc:ID');
      const nombre = etiqueta(g, 'cbc:Name');
      const clave = nif || nombre;
      if (clave) ganadores.set(clave, esPersona(nif) ? 'Persona física' : nombre);
    }
  }

  return {
    id: id.split('/').at(-1),
    estado,
    titulo,
    organo,
    nivel: nivelAdministracion([organo ?? '', ...jerarquia]),
    lugar: jerarquia.length >= 3 ? jerarquia.at(-3) : null,
    tipo: TIPOS_CONTRATO[tipo] ?? null,
    finalidad: finalidad(cpvs[0]),
    temas: temas(`${titulo} ${organo}`, cpvs),
    licitado,
    adjudicado: adjudicado || null,
    fecha,
    ganadores: [...ganadores.values()],
    enlace,
    actualizado,
  };
}

/** Se guardan los contratos adjudicados o resueltos a partir de 1 millón de € (sin IVA). */
export const UMBRAL_CONTRATOS = 1000000;

export const esContratoUtil = (c) => ['ADJ', 'RES'].includes(c?.estado) && c.adjudicado >= UMBRAL_CONTRATOS;

/** Forma compacta para la web (claves cortas para que pese menos). */
export const compactarContrato = (c) => ({
  id: c.id, t: c.titulo, o: c.organo, n: c.nivel, l: c.lugar, ti: c.tipo, fi: c.finalidad, te: c.temas,
  li: c.licitado, a: c.adjudicado, f: c.fecha, g: [...new Set(c.ganadores)], u: c.enlace, up: c.actualizado,
});

// ---------------------------------------------------------------------------
// Subvenciones (Base de Datos Nacional de Subvenciones)

/** Las mayores concesiones a empresas y entidades se piden de este importe en adelante. */
export const UMBRAL_SUBVENCIONES = 1000000;

export function urlConcesiones(desde, hasta, pagina = 0, tamaño = 200) {
  const ddmmaaaa = (iso) => iso.split('-').reverse().join('/');
  // La API ordena con «order» y «direccion» (no con el «sort» habitual)
  const p = new URLSearchParams({ page: String(pagina), pageSize: String(tamaño), vpd: 'GE', fechaDesde: ddmmaaaa(desde), fechaHasta: ddmmaaaa(hasta), order: 'importe', direccion: 'desc' });
  return `https://www.infosubvenciones.es/bdnstrans/api/concesiones/busqueda?${p}`;
}

/** Concesiones de una respuesta de la API, sin personas físicas. */
export function parsearConcesiones(json) {
  return (json?.content ?? [])
    .map((c) => {
      const [nif, ...resto] = String(c.beneficiario ?? '').trim().split(' ');
      return {
        id: c.codConcesion ?? String(c.id),
        f: c.fechaConcesion,
        i: c.importe,
        b: resto.join(' ').trim() || nif,
        nif,
        c: texto(c.convocatoria),
        o: c.nivel3,
        n: { ESTADO: 'Estado', AUTONOMICA: 'Comunidades', LOCAL: 'Ayuntamientos' }[c.nivel1] ?? 'Otros',
        l: c.nivel1 === 'ESTADO' ? null : c.nivel2,
        u: c.numeroConvocatoria ? `https://www.infosubvenciones.es/bdnstrans/GE/es/convocatorias/${c.numeroConvocatoria}` : null,
        te: temas(`${c.convocatoria} ${c.nivel3} ${c.beneficiario}`),
      };
    })
    .filter((c) => typeof c.i === 'number' && c.nif && !esPersona(c.nif));
}

// ---------------------------------------------------------------------------
// Ayuda a otros países (OCDE, desembolsos de ayuda oficial al desarrollo de España)

export function urlAyuda(desde) {
  return `https://sdmx.oecd.org/public/rest/data/OECD.DCD.FSD,DSD_DAC2@DF_DAC2A,/ESP..206.USD.V?startPeriod=${desde}`;
}

/** SDMX genérico (XML) → [{ pais, año, valor }] en millones de dólares. */
export function parsearAyuda(xml) {
  const salida = [];
  for (const serie of xml.split('<generic:Series>').slice(1)) {
    const pais = serie.match(/id="RECIPIENT" value="([^"]+)"/)?.[1];
    const mult = Number(serie.match(/id="UNIT_MULT" value="(-?\d+)"/)?.[1] ?? 6);
    for (const obs of serie.split('<generic:Obs>').slice(1)) {
      const año = obs.match(/<generic:ObsDimension[^>]*value="(\d{4})"/)?.[1];
      const v = numero(obs.match(/<generic:ObsValue value="([^"]+)"/)?.[1]);
      if (pais && año && v !== null) salida.push({ pais, año, valor: (v * 10 ** mult) / 1e6 });
    }
  }
  return salida;
}

// ---------------------------------------------------------------------------
// Búsqueda (navegador)

/** Filtra por palabras (todas deben aparecer, en cualquier campo de texto) y ordena por importe. */
export function buscar(lista, consulta, { campos, importe, tema } = {}) {
  const palabras = normalizar(consulta).split(/\s+/).filter((p) => p.length > 1);
  return lista
    .filter((x) => !tema || x.te?.includes(tema))
    .filter((x) => {
      if (!palabras.length) return true;
      const t = normalizar(campos.map((c) => (Array.isArray(x[c]) ? x[c].join(' ') : x[c] ?? '')).join(' '));
      return palabras.every((p) => t.includes(p));
    })
    .sort((a, b) => (b[importe] ?? 0) - (a[importe] ?? 0));
}

export const suma = (lista, campo) => lista.reduce((t, x) => t + (x[campo] ?? 0), 0);

// ---------------------------------------------------------------------------
// Portada: lo que la Lupa enseña nada más abrirse, en un fichero pequeño.
// El fichero completo crece con el histórico; solo se pide al buscar, filtrar o ver más.

export const EN_PORTADA = 40;

/** Del fichero completo de contratos o subvenciones, el de portada: los mayores y el total. */
export function portadaDe(datos, clave, importe) {
  const { cursores, [clave]: lista = [], ...resto } = datos;
  const orden = [...lista].sort((a, b) => (b[importe] ?? 0) - (a[importe] ?? 0));
  return { ...resto, total: { n: lista.length, suma: suma(lista, importe) }, [clave]: orden.slice(0, EN_PORTADA) };
}


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

// Acuerdos marco y sistemas dinámicos de adquisición: su importe es un techo de lo que se podrá gastar
// después con contratos basados en ellos, no dinero ya comprometido. Por eso no suman en los totales.
// La Plataforma lo dice con ContractingSystemCode (1 acuerdo marco, 2 sistema dinámico; 3 y 4 son los
// contratos basados en ellos, que sí son gasto). Si no viene el código, se mira el título.
export const esMarcoPorTitulo = (t) => {
  const n = normalizar(t);
  return /\bacuerdos? marco\b|\bsistemas? dinamicos? de adquisicion/.test(n) && !/\bbasad|\bderivad|\bal amparo/.test(n);
};
export function esMarco(sistema, titulo) {
  if (sistema === 1 || sistema === 2) return true;
  if (sistema === 3 || sistema === 4) return false;
  return esMarcoPorTitulo(titulo);
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

  const sistema = numero(etiqueta(e.match(/<cac:TenderingProcess>([\s\S]*?)<\/cac:TenderingProcess>/)?.[1] ?? '', 'cbc:ContractingSystemCode'));

  return {
    id: id.split('/').at(-1),
    estado,
    sistema,
    marco: esMarco(sistema, titulo),
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
  li: c.licitado, a: c.adjudicado, f: c.fecha, g: [...new Set(c.ganadores)], u: c.enlace, up: c.actualizado, m: c.marco ? 1 : 0,
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
// Ayuda al desarrollo por país y sector (OCDE, Creditor Reporting System)
// El CRS recoge, proyecto a proyecto, la ayuda oficial al desarrollo que declara España: a qué país, para qué
// sector, quién la da y por qué canal. Se usa en dos consultas: los totales por país y sector (varios años) y los
// proyectos del último año, para el detalle.

const CRS = 'https://sdmx.oecd.org/dcd-public/rest/data/OECD.DCD.FSD,DSD_CRS@DF_CRS,1.7';
const CSV = 'format=csvfilewithlabels&dimensionAtObservation=AllDimensions';
/** Totales de España por país receptor y sector: AOD (100), desembolsos (D), dólares corrientes (V), agregados (_T). */
export const urlCrs = (desde) => `${CRS}/ESP...100._T._T.D.V._T..?${CSV}&startPeriod=${desde}`;
/** Proyectos de España de un año (microdatos, DD). */
export const urlCrsProyectos = (año) => `${CRS}/ESP...100...D.V.DD..?${CSV}&startPeriod=${año}&endPeriod=${año}`;

/** Sectores de la ayuda, agrupados para que se entiendan. No se solapan entre sí: su suma es el total. */
export const SECTORES_AYUDA = {
  110: 'Educación',
  120: 'Salud',
  130: 'Salud reproductiva y población',
  140: 'Agua y saneamiento',
  150: 'Gobierno, derechos y sociedad civil',
  160: 'Empleo, vivienda, cultura y otros servicios sociales',
  210: 'Transporte',
  220: 'Comunicaciones',
  230: 'Energía',
  240: 'Banca y finanzas',
  250: 'Empresas',
  310: 'Agricultura, bosques y pesca',
  320: 'Industria, minería y construcción',
  330: 'Comercio y turismo',
  410: 'Medio ambiente',
  430: 'Desarrollo rural y urbano y otros',
  510: 'Apoyo al presupuesto del país',
  520: 'Ayuda alimentaria',
  530: 'Otras ayudas en especie',
  600: 'Deuda',
  720: 'Emergencias',
  730: 'Reconstrucción',
  740: 'Prevención de desastres',
  910: 'Gestión de la cooperación',
  930: 'Refugiados acogidos en España',
  998: 'Sin sector concreto',
};

/** Grupo de un código de sector del CRS (12220 → 120; 151 → 150; 72040 → 720). Los agregados (1000, 100…) no tienen. */
export function grupoSector(codigo) {
  const c = String(codigo ?? '');
  if (SECTORES_AYUDA[c]) return c;
  if (c.length === 5 || (c.length === 3 && !c.endsWith('00'))) {
    const g = `${c.slice(0, 2)}0`;
    return SECTORES_AYUDA[g] ? g : '998';
  }
  return null;
}

const AGENCIAS = {
  'Spanish Agency for International Development Co-operation': 'AECID',
  'Ministry of Foreign Affairs and Co-operation': 'Ministerio de Asuntos Exteriores',
  'Ministry of Foreign Affairs': 'Ministerio de Asuntos Exteriores',
  'Ministry of Industry and Energy': 'Ministerio de Industria',
  'Ministry of Economy and Finance': 'Ministerio de Economía',
  'Ministry of Economy': 'Ministerio de Economía',
  'Ministry of Defense': 'Ministerio de Defensa',
  'Ministry of Interior': 'Ministerio del Interior',
  'Ministry of Health': 'Ministerio de Sanidad',
  'Ministry of Education': 'Ministerio de Educación',
  'Ministry of Agriculture': 'Ministerio de Agricultura',
  'Others ministries': 'Otros ministerios',
  'Other ministries': 'Otros ministerios',
  Municipalities: 'Ayuntamientos',
  'Public Universities': 'Universidades públicas',
  Others: 'Otros',
};
const CANALES = {
  10000: 'Sector público',
  20000: 'ONG y sociedad civil',
  30000: 'Alianzas público-privadas',
  40000: 'Organismos multilaterales',
  50000: 'Universidades y centros de investigación',
  60000: 'Empresas privadas',
  90000: 'Otros',
};
export const agencia = (nombre) => AGENCIAS[nombre] ?? nombre ?? '';
export const canal = (codigo) => CANALES[String(codigo ?? '').slice(0, 1) + '0000'] ?? '';

/**
 * Lector de CSV por trozos (con comillas, comas y saltos de línea dentro de los campos), para leer ficheros
 * grandes sin cargarlos enteros. Cada fila completa se entrega a alFila(campos).
 */
export function lectorCsv(alFila) {
  let campo = '';
  let fila = [];
  let comillas = false;
  let previa = '';
  return {
    trozo(texto) {
      for (let i = 0; i < texto.length; i++) {
        const c = texto[i];
        if (comillas) {
          if (c === '"') {
            if (texto[i + 1] === '"') {
              campo += '"';
              i++;
            } else if (i + 1 === texto.length) previa = '"';
            else comillas = false;
          } else campo += c;
          continue;
        }
        if (previa === '"') {
          previa = '';
          if (c === '"') {
            campo += '"';
            comillas = true;
            continue;
          }
          comillas = false;
        }
        if (c === '"') comillas = true;
        else if (c === ',') {
          fila.push(campo);
          campo = '';
        } else if (c === '\n') {
          fila.push(campo.endsWith('\r') ? campo.slice(0, -1) : campo);
          alFila(fila);
          fila = [];
          campo = '';
        } else campo += c;
      }
    },
    fin() {
      if (previa === '"') comillas = false;
      if (campo || fila.length) {
        fila.push(campo);
        alFila(fila);
      }
    },
  };
}

/** Acumula las filas del CRS (totales por país y sector) en { años, paises, sectores, porPais }. */
export function acumuladorCrs() {
  let cab = null;
  const paises = {}; // ISO → año → total
  const porPais = {}; // ISO → año → grupo → valor
  const sectores = {}; // año → grupo → valor (todo lo que da España: países, regiones y sin especificar)
  const totales = {}; // año → total
  const años = new Set();
  return {
    fila(campos) {
      if (!cab) {
        cab = Object.fromEntries(campos.map((c, i) => [c, i]));
        return;
      }
      const v = numero(campos[cab.OBS_VALUE]);
      if (v === null) return;
      const valor = (v * 10 ** Number(campos[cab.UNIT_MULT] || 6)) / 1e6;
      const año = campos[cab.TIME_PERIOD];
      const pais = campos[cab.RECIPIENT];
      const sector = campos[cab.SECTOR];
      años.add(año);
      // DPGC: «países en desarrollo, total», la suma de todo lo que se reparte
      if (pais === 'DPGC') {
        if (sector === '1000') totales[año] = valor;
        const g = SECTORES_AYUDA[sector] ? sector : null;
        if (g) (sectores[año] ??= {})[g] = valor;
        return;
      }
      if (!/^[A-Z]{3}$/.test(pais)) return;
      if (sector === '1000') (paises[pais] ??= {})[año] = valor;
      else if (SECTORES_AYUDA[sector]) ((porPais[pais] ??= {})[año] ??= {})[sector] = valor;
    },
    resultado: () => ({ años: [...años].sort(), totales, sectores, paises, porPais }),
  };
}

/** Acumula los proyectos del CRS: los mayores de cada país. */
export function acumuladorProyectos(porPais = 25) {
  let cab = null;
  const paises = {};
  return {
    fila(campos) {
      if (!cab) {
        cab = Object.fromEntries(campos.map((c, i) => [c, i]));
        return;
      }
      const pais = campos[cab.RECIPIENT];
      if (!/^[A-Z]{3}$/.test(pais)) return;
      const v = numero(campos[cab.OBS_VALUE]);
      if (!(v > 0)) return;
      const lista = (paises[pais] ??= []);
      lista.push({
        v: Math.round(((v * 10 ** Number(campos[cab.UNIT_MULT] || 6)) / 1e6) * 1000) / 1000,
        t: (campos[cab.PROJECT_TITLE] || campos[cab.SHORT_DESCRIPTION] || '').trim(),
        d: (campos[cab.SHORT_DESCRIPTION] || '').trim(),
        s: grupoSector(campos[cab.SECTOR]),
        a: agencia(campos[cab.DONOR_AGENCY]),
        c: canal(campos[cab.CHANNEL]),
      });
      // Se recorta de vez en cuando para no guardar en memoria todos los proyectos
      if (lista.length > porPais * 4) {
        lista.sort((x, y) => y.v - x.v);
        lista.length = porPais;
      }
    },
    resultado() {
      for (const lista of Object.values(paises)) {
        lista.sort((x, y) => y.v - x.v);
        lista.length = Math.min(lista.length, porPais);
        for (const p of lista) if (p.d === p.t) delete p.d;
      }
      return paises;
    },
  };
}

// ---------------------------------------------------------------------------
// Escaparate de la Lupa: un índice pequeño y un fichero por mes.
// El índice (los mayores, los totales por tema y por administración y la lista de meses) es lo que se descarga
// al abrir la Lupa. Los meses se piden solo al buscar, filtrar o ver más, del más reciente al más antiguo,
// así que la Lupa pesa lo mismo al abrirse aunque el histórico crezca.

export const EN_PORTADA = 40;

/** Número de resultados y su suma, con los acuerdos marco aparte (su importe es un máximo, no gasto). */
export function totales(lista, importe) {
  const marcos = lista.filter((x) => x.m);
  return { n: lista.length, suma: suma(lista, importe) - suma(marcos, importe), marcos: { n: marcos.length, suma: suma(marcos, importe) } };
}

/** Mes (AAAA-MM) de un contrato o subvención: el de su fecha y, si no tiene, el de su última actualización. */
export const mesDe = (x) => (x.f ?? x.up ?? '').slice(0, 7) || 'sin-fecha';

/** Reparte una lista por meses: { 'AAAA-MM': [...] }, cada mes ordenado por importe. */
export function porMes(lista, importe) {
  const meses = {};
  for (const x of lista) (meses[mesDe(x)] ??= []).push(x);
  for (const m of Object.values(meses)) m.sort((a, b) => (b[importe] ?? 0) - (a[importe] ?? 0));
  return meses;
}

/** El índice de la Lupa a partir de los datos completos del almacén. */
export function indiceDe(datos, clave, importe) {
  const { cursores, [clave]: lista = [], ...resto } = datos;
  const orden = [...lista].sort((a, b) => (b[importe] ?? 0) - (a[importe] ?? 0));
  const agrupar = (claveDe) => {
    const grupos = {};
    for (const x of lista) for (const g of [claveDe(x)].flat().filter(Boolean)) (grupos[g] ??= []).push(x);
    return Object.fromEntries(Object.entries(grupos).map(([g, xs]) => [g, totales(xs, importe)]));
  };
  const meses = porMes(lista, importe);
  return {
    ...resto,
    total: totales(lista, importe),
    porTema: agrupar((x) => x.te),
    porNivel: agrupar((x) => x.n),
    meses: Object.keys(meses).sort().reverse().map((mes) => ({ mes, n: meses[mes].length, suma: totales(meses[mes], importe).suma })),
    [clave]: orden.slice(0, EN_PORTADA),
  };
}

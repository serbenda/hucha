// Nombres en inglés de las categorías propias de hucha (partidas, grupos, tipos de gasto, funciones, temas,
// sectores…), para las páginas de en/. Los datos de las fuentes (títulos de contratos, organismos, empresas,
// programas del presupuesto) no se traducen: salen tal cual se publican.

import { EN } from './idioma.js';

export const PARTIDAS = {
  pensiones: ['Retirement and survivors’ pensions', 'Retirement, widow’s and orphan’s pensions, including civil servants’ pensions (clases pasivas).'],
  sanidad: ['Healthcare', 'Hospitals, health centres, doctors and nurses, medicines and public health.'],
  educacion: ['Education', 'Schools, secondary schools, universities, vocational training, grants and school meals.'],
  'otras-sociales': ['Sick leave, disability, family and other benefits', 'Sick leave, disability, long-term care, child benefits, minimum income and help against social exclusion.'],
  administracion: ['Running the administrations', 'Governments, parliaments, tax administration, staff management, statistics, elections, development aid and basic research.'],
  economia: ['Jobs, business, farming and energy', 'Employment policies, support for businesses, farming and fishing, energy, mining, telecoms and tourism.'],
  intereses: ['Interest on debt', 'What is paid each year on the money the administrations owe. Repaying the debt itself is not included, only the interest.'],
  transporte: ['Roads, railways and transport', 'Roads, railways, metro and buses, ports and airports, and support for public transport.'],
  paro: ['Unemployment', 'Unemployment benefits and allowances.'],
  seguridad: ['Police, justice and prisons', 'Police and Guardia Civil, fire services, courts and prisons.'],
  cultura: ['Culture, sport and religion', 'Libraries, museums, sports facilities, public radio and TV, and religious and community activities.'],
  'medio-ambiente': ['Environment and waste', 'Waste collection and treatment, waste water, pollution and nature protection.'],
  defensa: ['Defence', 'Armed forces, military equipment, missions abroad and civil protection.'],
  vivienda: ['Housing, urban planning and water', 'Public housing and housing support, urban planning, water supply and street lighting.'],
};

export const GRUPOS = {
  GF0101: 'Government, parliaments, finance and foreign affairs', GF0102: 'Development aid to other countries',
  GF0103: 'General services: staff, statistics, central purchasing', GF0104: 'Basic research', GF0105: 'Research on public administration',
  GF0106: 'Other general services', GF0107: 'Interest on debt', GF0108: 'Transfers between administrations',
  GF0201: 'Armed forces', GF0202: 'Civil protection', GF0203: 'Military aid to other countries', GF0204: 'Military research', GF0205: 'Other defence spending',
  GF0301: 'Police and Guardia Civil', GF0302: 'Fire services', GF0303: 'Courts', GF0304: 'Prisons', GF0305: 'Security research', GF0306: 'Other security spending',
  GF0401: 'Jobs, trade and general economic affairs', GF0402: 'Farming, forestry and fishing', GF0403: 'Energy', GF0404: 'Industry, mining and construction',
  GF0405: 'Transport: roads, rail, ports and airports', GF0406: 'Telecommunications', GF0407: 'Tourism and other sectors', GF0408: 'Economic research', GF0409: 'Other economic affairs',
  GF0501: 'Waste collection and treatment', GF0502: 'Waste water', GF0503: 'Pollution', GF0504: 'Nature and landscape', GF0505: 'Environmental research', GF0506: 'Other environmental spending',
  GF0601: 'Housing', GF0602: 'Urban and neighbourhood development', GF0603: 'Drinking water', GF0604: 'Street lighting', GF0605: 'Housing research', GF0606: 'Other housing and planning spending',
  GF0701: 'Medicines and medical supplies', GF0702: 'Health centres and outpatient care', GF0703: 'Hospitals', GF0704: 'Public health and vaccines', GF0705: 'Health research', GF0706: 'Management and other health spending',
  GF0801: 'Sport and recreation', GF0802: 'Culture: museums, libraries, heritage', GF0803: 'Radio, TV and publishing', GF0804: 'Religion and associations', GF0805: 'Cultural research', GF0806: 'Other culture and sport spending',
  GF0901: 'Pre-primary and primary', GF0902: 'Secondary: ESO, Bachillerato and vocational', GF0903: 'Non-university post-secondary', GF0904: 'University',
  GF0905: 'Education not by level (adults, languages…)', GF0906: 'School meals, transport and other services', GF0907: 'Education research', GF0908: 'Management and other education spending',
  GF1001: 'Sick leave and disability', GF1002: 'Retirement pensions', GF1003: 'Widow’s and orphan’s pensions', GF1004: 'Family and children', GF1005: 'Unemployment',
  GF1006: 'Housing benefits', GF1007: 'Social exclusion: minimum income and other help', GF1008: 'Social protection research', GF1009: 'Long-term care and other social spending',
  resto: 'No breakdown',
};

export const TIPOS = {
  D1: ['Public sector salaries', 'Salaries and contributions of civil servants and public employees: doctors, teachers, police…'],
  D62: ['Direct payments to people', 'Pensions, unemployment, sick leave, child benefits or minimum income: money that reaches households.'],
  P2: ['Purchases of goods and services', 'Materials, supplies, maintenance, rent and services contracted from companies.'],
  D632: ['Services paid to companies for citizens', 'What the administration pays others to look after you: prescription medicines, contracted healthcare and education.'],
  P5: ['Investment: works and equipment', 'Roads, railways, buildings, computers, military equipment…'],
  D3: ['Subsidies to companies', 'Support for companies to lower prices or keep going: transport, energy, farming…'],
  D4: ['Interest and rents', 'Mostly interest on debt.'],
  D7: ['Transfers to others', 'Money to associations, the European Union, other countries and between administrations.'],
  D9: ['Investment grants', 'Money for others to invest: works by public companies, EU funds…'],
  otros: ['Other', 'Taxes paid by the administrations themselves, land purchases and other adjustments.'],
};

export const FUNCIONES = {
  GF10: 'Pensions and social protection', GF07: 'Healthcare', GF01: 'General administration and interest', GF04: 'Economy, jobs and transport',
  GF09: 'Education', GF03: 'Police, justice and prisons', GF08: 'Culture, sport and religion', GF05: 'Environment', GF02: 'Defence', GF06: 'Housing, urban planning and water',
};

export const ADMINISTRACIONES = {
  S1311: ['Central government', 'Central administration: ministries and their agencies'],
  S1312: ['Regions', 'Autonomous communities'],
  S1313: ['Local councils', 'Town councils, provincial and island councils'],
  S1314: ['Social Security', 'Social Security funds: contributory pensions, unemployment, sick leave'],
};

export const TEMAS = {
  tren: 'Rail', carreteras: 'Roads', transporte: 'Transport', sanidad: 'Healthcare', educacion: 'Education', social: 'Social services', vivienda: 'Housing',
  energia: 'Energy', agua: 'Water and environment', seguridad: 'Security and justice', defensa: 'Defence', tecnologia: 'Technology', cultura: 'Culture and sport',
  empleo: 'Jobs and business', campo: 'Farming and fishing',
};

export const NIVELES = { Estado: 'Central government', Comunidades: 'Regions', Ayuntamientos: 'Local councils', Universidades: 'Universities', Otros: 'Other' };

export const TIPOS_CONTRATO = {
  Suministro: 'Supplies', Servicios: 'Services', Obras: 'Works', 'Administrativo especial': 'Special administrative', Privado: 'Private',
  'Gestión de servicios públicos': 'Public service management', 'Concesión de servicios': 'Service concession', 'Concesión de obra pública': 'Public works concession',
  'Concesión de obras': 'Works concession', 'Colaboración público-privada': 'Public-private partnership', Patrimonial: 'Property', Otros: 'Other',
};

export const FINALIDADES = {
  Obra: 'Construction', 'Mantenimiento y reparación': 'Maintenance and repair', 'Compra de bienes': 'Purchase of goods',
  'Servicios y estudios': 'Services and studies', 'Transporte y logística': 'Transport and logistics', Servicios: 'Services',
};

export const SECTORES_AYUDA = {
  110: 'Education', 120: 'Health', 130: 'Reproductive health and population', 140: 'Water and sanitation', 150: 'Government, rights and civil society',
  160: 'Jobs, housing, culture and other social services', 210: 'Transport', 220: 'Communications', 230: 'Energy', 240: 'Banking and finance', 250: 'Business',
  310: 'Farming, forestry and fishing', 320: 'Industry, mining and construction', 330: 'Trade and tourism', 410: 'Environment', 430: 'Rural and urban development and other',
  510: 'Budget support', 520: 'Food aid', 530: 'Other in-kind aid', 600: 'Debt', 720: 'Emergencies', 730: 'Reconstruction', 740: 'Disaster prevention',
  910: 'Managing aid', 930: 'Refugees hosted in Spain', 998: 'No specific sector',
};

export const CANALES = {
  'Sector público': 'Public sector', 'ONG y sociedad civil': 'NGOs and civil society', 'Alianzas público-privadas': 'Public-private partnerships',
  'Organismos multilaterales': 'Multilateral organisations', 'Universidades y centros de investigación': 'Universities and research centres', 'Empresas privadas': 'Private companies', Otros: 'Other',
};

/** Capítulos del presupuesto de gastos del Estado (por número). */
export const CAPITULOS = {
  1: 'Staff costs', 2: 'Goods and services', 3: 'Financial costs (interest)', 4: 'Current transfers', 5: 'Contingency fund',
  6: 'Investment', 7: 'Capital transfers', 8: 'Financial assets', 9: 'Financial liabilities (debt repayment)',
};

/** Políticas de gasto del presupuesto del Estado, por su nombre en el libro de la IGAE (normalizado). */
const POLITICAS_ = {
  'justicia': 'Justice', 'defensa': 'Defence', 'seguridad ciudadana e instituciones penitenciarias': 'Public safety and prisons',
  'politica exterior y cooperacion para el desarrollo': 'Foreign policy and development cooperation', 'pensiones': 'Pensions',
  'otras prestaciones economicas': 'Other economic benefits', 'servicios sociales y promocion social': 'Social services and social promotion',
  'fomento del empleo': 'Employment promotion', 'desempleo': 'Unemployment', 'acceso a la vivienda y fomento de la edificacion': 'Access to housing and building',
  'gestion y administ de trabajo y economia social': 'Labour and social economy administration',
  'gestion y admon de inclusion segur soc y migracion': 'Inclusion, Social Security and migration administration',
  'sanidad': 'Healthcare', 'educacion': 'Education', 'cultura': 'Culture', 'agricultura pesca y alimentacion': 'Agriculture, fisheries and food',
  'industria y energia': 'Industry and energy', 'comercio turismo y pymes': 'Trade, tourism and SMEs', 'subvenciones al transporte': 'Transport subsidies',
  'infraestructuras y ecosistemas resilientes': 'Infrastructure and resilient ecosystems',
  'investigacion desarrollo innovacion y digital': 'Research, development, innovation and digitalisation',
  'otras actuaciones de caracter economico': 'Other economic actions', 'organos constitucionales gobierno y otros': 'Constitutional bodies, government and others',
  'servicios de caracter general': 'General services', 'administracion financiera y tributaria': 'Financial and tax administration',
  'transferencias a otras administraciones publicas': 'Transfers to other public administrations', 'deuda publica': 'Public debt',
};
const normal = (t) => String(t ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
export const politica = (nombre) => (EN ? POLITICAS_[normal(nombre)] ?? nombre : nombre);

/** Nombre en el idioma de la página: en inglés, de la tabla (si está); si no, el original. */
export const en = (tabla, clave, original) => {
  if (!EN) return original;
  const v = tabla[clave];
  return v === undefined ? original : Array.isArray(v) ? v[0] : v;
};
/** Descripción («que») en el idioma de la página. */
export const enQue = (tabla, clave, original) => (EN && Array.isArray(tabla[clave]) && tabla[clave][1] ? tabla[clave][1] : original);

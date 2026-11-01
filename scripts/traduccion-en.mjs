// Traducción al inglés de los textos fijos de las páginas (el HTML). La usa scripts/ingles.mjs para generar en/.
// Clave: el texto tal cual aparece en el HTML en castellano (sin los espacios de los extremos). Valor: su traducción.
// Un texto que falte aquí hace fallar los tests, para que nunca se cuele castellano en la versión inglesa.
// Los textos que escriben los scripts (cifras, gráficos, resultados) se traducen en cada script con t().

export const NO_SE_TRADUCE = new Set([
  'CSV', 'JSON', 'data/vistas/', 'data/lupa/',
  'hucha', 'English', 'GitHub', 'bolsillo', 'GoatCounter', 'gov_10a_exp', 'demo_gind', 'github.com/serbenda', 'IRPF', 'Total', '&nbsp;',
  'width=device-width, initial-scale=1',
]);

export const EN = {
  // Comunes: cabecera, menú y pie
  'hucha · a dónde va el dinero público en España': 'hucha · where Spain’s public money goes',
  'Tu ticket': 'Your receipt',
  'A dónde va': 'Where it goes',
  'Quién gasta': 'Who spends',
  'Presupuesto': 'Budget',
  'Lupa': 'Lens',
  'Fuentes': 'Sources',
  'hucha, inicio': 'hucha, home',
  '¿Te sirve? Apoya hucha en GitHub Sponsors': 'Useful? Support hucha on GitHub Sponsors',
  'Web sin anuncios ni cookies, con datos oficiales.': 'No ads, no cookies, official data only.',
  'Fuentes y condiciones': 'Sources and terms',
  '. Código en': '. Code on',
  '¿Ves un error?': 'Spotted a mistake?',
  'Hermana de': 'Sister site of',
  'Secciones': 'Sections',

  // Portada
  'La hucha de todos.': 'Everyone’s piggy bank.',
  'Con tus impuestos y cotizaciones pones dinero en una hucha común. Escribe tu sueldo y mira a dónde va cada euro, según cómo gastan de verdad las administraciones.':
    'With your taxes and social security contributions you put money into a shared piggy bank. Enter your salary and see where each euro goes, based on how Spain’s public administrations actually spend.',
  'Tu sueldo bruto al año': 'Your gross yearly salary',
  'El que pone tu contrato, antes de impuestos. No sale de tu navegador.': 'The one in your contract, before taxes. It never leaves your browser.',
  'Salario mínimo': 'Minimum wage',
  'Sumar lo que tu empresa paga por ti a la Seguridad Social': 'Add what your employer pays for you to Social Security',
  'Gasto público de España': 'Public spending in Spain',
  'Lo que pones al año': 'What you put in each year',
  'Seguridad Social': 'Social Security',
  'Estimación orientativa · datos de Eurostat': 'Rough estimate · Eurostat data',
  'Compartir el reparto': 'Share the breakdown',
  'Se comparte en porcentajes, sin tu sueldo.': 'Shared as percentages, without your salary.',
  'Entre todos': 'All of us together',
  'En el último año con datos, todas las administraciones juntas (Estado, comunidades, ayuntamientos y Seguridad Social) gastaron esto.':
    'In the latest year with data, all administrations together (central government, regions, local councils and Social Security) spent this.',
  'Gasto público total': 'Total public spending',
  'Por habitante': 'Per person',
  'Sobre lo que produce España': 'Compared with what Spain produces',
  'De cada 100 € de gasto público': 'Out of every €100 of public spending',
  'Cada cuadrado es un euro de cada cien. Pulsa una partida para ver en qué se va.': 'Each square is one euro out of every hundred. Tap an item to see what it is spent on.',
  'Más': 'More',
  '¿A dónde va el dinero?': 'Where does the money go?',
  'Cada partida en euros por habitante, qué incluye y cómo ha cambiado, comparada con la media europea.':
    'Each item in euros per person, what it includes and how it has changed, compared with the European average.',
  '¿Quién lo gasta?': 'Who spends it?',
  'Qué parte de la sanidad, la educación o las pensiones pagan el Estado, tu comunidad, tu ayuntamiento y la Seguridad Social.':
    'How much of healthcare, education or pensions is paid by central government, your region, your local council and Social Security.',
  '¿Se gasta lo presupuestado?': 'Is the budget actually spent?',
  'El presupuesto del Estado de este año y lo que lleva gastado, mes a mes, por ministerios y programas.':
    'This year’s central government budget and how much has been spent so far, month by month, by ministry and programme.',
  '¿A quién se paga?': 'Who gets paid?',
  'La Lupa: contratos, subvenciones y ayuda a otros países con nombre y cifra. Busca una empresa, un organismo o un tema.':
    'The Lens: contracts, grants and aid to other countries, with names and amounts. Search for a company, a public body or a topic.',
  '¿De dónde salen los datos?': 'Where does the data come from?',
  'Fuentes oficiales, cómo se calcula el ticket y lo que no entra en la cuenta.': 'Official sources, how the receipt is calculated and what is left out.',
  'El ticket cuenta el IRPF y las cotizaciones de un asalariado con contrato indefinido, sin hijos ni deducciones. Además pagas IVA e impuestos especiales cada vez que compras: no entran porque dependen de lo que gastes. Y como las administraciones gastan más de lo que ingresan, una parte se paga con deuda.':
    'The receipt counts personal income tax (IRPF) and social security contributions for a permanent employee with no children or deductions. You also pay VAT and excise duties every time you buy something: they are not included because they depend on what you spend. And since public administrations spend more than they collect, part of the spending is paid for with debt.',
  'La hucha de todos: cuánto pones con tus impuestos y en qué se gasta, con datos oficiales.':
    'Everyone’s piggy bank: how much you pay in taxes and what it is spent on, with official data.',
  'hucha: a dónde va el dinero público en España': 'hucha: where Spain’s public money goes',
  'Escribe tu sueldo y mira a dónde va cada euro de tus impuestos, con datos oficiales.': 'Enter your salary and see where each euro of your taxes goes, with official data.',
  'hucha: de cada 100 euros de gasto público, cuánto va a cada partida': 'hucha: out of every €100 of public spending, how much goes to each item',
  'Sueldos de ejemplo': 'Example salaries',

  // A dónde va
  '¿A dónde va el dinero? · hucha': 'Where does the money go? · hucha',
  'Todo lo que gastan las administraciones, repartido en partidas que se entienden, en euros por habitante y año.':
    'Everything Spain’s public administrations spend, split into items that make sense, in euros per person per year.',
  'La partida más grande': 'The largest item',
  'De un vistazo': 'At a glance',
  'Cada bloque es una partida y su tamaño, lo que se lleva del total. Pulsa uno para ver su detalle.':
    'Each block is an item, and its size is its share of the total. Tap one to see the details.',
  'Por partidas': 'By item',
  'Euros por habitante y año. Pulsa una partida para ver en qué se va, cómo se gasta y cómo ha cambiado.':
    'Euros per person per year. Tap an item to see what it is spent on, how, and how it has changed.',
  'España': 'Spain',
  'Media de la Unión Europea': 'European Union average',
  'Cómo se gasta cada euro': 'How each euro is spent',
  'Todo el gasto público según en qué se materializa.': 'All public spending, by what it turns into.',
  'Cómo leer esto': 'How to read this',
  'Las cifras son el gasto de todas las administraciones juntas (Estado, comunidades, ayuntamientos y Seguridad Social), contado una sola vez. «Por habitante» divide entre toda la población, también niños y jubilados. Para comparar entre años y con Europa se usa el porcentaje del PIB, que no depende de la inflación ni del tamaño de cada país.':
    'The figures are the spending of all administrations together (central government, regions, local councils and Social Security), counted only once. “Per person” divides by the whole population, including children and pensioners. To compare across years and with Europe, the share of GDP is used, which does not depend on inflation or on the size of each country.',
  'Todo el gasto público de España en partidas que se entienden: euros por habitante, qué incluye cada una y comparación con Europa.':
    'All of Spain’s public spending in items that make sense: euros per person, what each one includes and a comparison with Europe.',
  'Leyenda de los gráficos': 'Chart legend',

  // Quién gasta
  '¿Quién gasta cada euro? · hucha': 'Who spends each euro? · hucha',
  '¿Quién gasta cada euro?': 'Who spends each euro?',
  'En España el gasto está muy repartido: el Estado, las comunidades, los ayuntamientos y la Seguridad Social se encargan de cosas distintas.':
    'In Spain spending is highly decentralised: central government, the regions, local councils and Social Security each look after different things.',
  'La sanidad, en manos de': 'Healthcare, in the hands of',
  'La educación, en manos de': 'Education, in the hands of',
  'Pensiones y protección social': 'Pensions and social protection',
  'Cuánto gasta cada administración': 'How much each administration spends',
  'En el último año con datos, sin contar el dinero que el Estado pasa a comunidades y ayuntamientos para que lo gasten ellos.':
    'In the latest year with data, not counting the money central government passes to regions and councils for them to spend.',
  'Estado': 'Central government',
  'Administración central: ministerios y sus organismos': 'Central administration: ministries and their agencies',
  'Comunidades': 'Regions',
  'Comunidades autónomas': 'Autonomous communities',
  'Ayuntamientos': 'Local councils',
  'Ayuntamientos, diputaciones, cabildos y consejos insulares': 'Town councils, provincial and island councils',
  'Fondos de la Seguridad Social: pensiones contributivas, paro, bajas': 'Social Security funds: contributory pensions, unemployment, sick leave',
  'Quién paga cada cosa': 'Who pays for what',
  'De cada 100 euros que se gastan en cada función, cuántos pone cada administración. Pulsa una barra (o un color de la barra) para ver los datos de cada una.':
    'Out of every €100 spent on each function, how much each administration puts in. Tap a bar (or a colour in the bar) to see the figures for each one.',
  'Ojo al leerlo': 'Read with care',
  'Cuando una administración da dinero a otra para algo concreto (por ejemplo, el Estado a la Seguridad Social para pagar pensiones), cuenta en las dos. Por eso aquí se comparan porcentajes dentro de cada función, y las cifras de cada administración no se pueden sumar para obtener el total de España.':
    'When one administration gives money to another for a specific purpose (for example, central government to Social Security to pay pensions), it counts in both. That is why percentages are compared within each function here, and the figures of each administration cannot be added up to get Spain’s total.',
  'Qué parte de la sanidad, la educación o las pensiones pagan el Estado, las comunidades, los ayuntamientos y la Seguridad Social.':
    'How much of healthcare, education or pensions is paid by central government, the regions, local councils and Social Security.',
  'Administraciones': 'Administrations',

  // Presupuesto
  '¿Se gasta lo presupuestado? · hucha': 'Is the budget actually spent? · hucha',
  '¿Se gasta lo que se presupuesta?': 'Is the budget actually spent?',
  'El presupuesto del Estado de este año y lo que lleva gastado, mes a mes, con los datos que publica cada mes la Intervención General del Estado.':
    'This year’s central government budget and how much has been spent so far, month by month, with the data published every month by the State Comptroller (IGAE).',
  'Presupuesto de este año': 'This year’s budget',
  'Gastado hasta ahora': 'Spent so far',
  'Un año antes, a estas alturas': 'A year earlier, at this point',
  'A qué ritmo se gasta': 'How fast it is spent',
  'Parte del presupuesto ya gastada al final de cada mes, este año y el anterior.': 'Share of the budget already spent at the end of each month, this year and last.',
  'En qué tipo de gasto': 'By type of spending',
  'Cuánto se lleva de cada tipo. La raya marca la parte del año que ha pasado: una barra por debajo va más lenta que el calendario.':
    'How much of each type has been spent. The line marks the share of the year that has gone by: a bar below it is behind the calendar.',
  'Para qué': 'What for',
  'Por políticas de gasto: sanidad, defensa, infraestructuras, investigación…': 'By spending policy: healthcare, defence, infrastructure, research…',
  'Quién lo gasta': 'Who spends it',
  'Por ministerios y otros órganos. Pulsa uno para ver sus programas, o busca un programa.':
    'By ministry and other bodies. Tap one to see its programmes, or search for a programme. Names are the official ones, in Spanish.',
  'Buscar un programa': 'Search for a programme',
  'Buscar': 'Search',
  'Cómo leerlo': 'How to read it',
  'son los créditos definitivos: lo aprobado para el año más las modificaciones hechas desde enero. En 2026 sigue vigente el presupuesto de 2023, prorrogado.':
    'means the final appropriations: what was approved for the year plus the changes made since January. In 2026 the 2023 budget, rolled over, is still in force.',
  'Gastado': 'Spent',
  'son las obligaciones reconocidas: lo que el Estado ya debe porque el trabajo está hecho o el derecho reconocido. Casi todo se paga en días.':
    'means recognised obligations: what the State already owes because the work has been done or the entitlement recognised. Almost all of it is paid within days.',
  'El ritmo no es igual todo el año.': 'The pace is not the same all year.',
  'Sueldos y pensiones se pagan cada mes, pero las inversiones y muchas transferencias se concentran al final. Por eso la comparación justa es con el mismo mes del año anterior.':
    'Salaries and pensions are paid every month, but investment and many transfers bunch up at the end. That is why the fair comparison is with the same month of the previous year.',
  'Lo que no aparece:': 'What is not included:',
  'solo es el presupuesto del Estado. No están la Seguridad Social, las comunidades autónomas ni los ayuntamientos, que gastan la mayor parte de la sanidad, la educación y las pensiones. Las cifras principales son las operaciones no financieras: sin la compra de activos financieros ni la devolución de deuda, que mueven dinero pero no son gasto.':
    'this is only the central government budget. Social Security, the regions and local councils are not included, and they spend most of healthcare, education and pensions. The headline figures are non-financial operations: excluding purchases of financial assets and debt repayments, which move money but are not spending.',
  'El presupuesto del Estado de este año y lo que lleva gastado, mes a mes, por tipo de gasto, políticas, ministerios y programas.':
    'This year’s central government budget and how much has been spent, month by month, by type of spending, policy, ministry and programme.',
  'Ferroviario, hospitales, becas, carreteras…': 'Ferroviario, hospitales, becas, carreteras… (in Spanish)',

  // Lupa
  'La Lupa: contratos, subvenciones y ayudas · hucha': 'The Lens: contracts, grants and aid · hucha',
  'La Lupa.': 'The Lens.',
  'Contratos, subvenciones y ayuda a otros países, con nombre y cifra: quién paga, a quién, para qué y cuánto. Busca lo que quieras o filtra por tema.':
    'Contracts, grants and aid to other countries, with names and amounts: who pays, to whom, what for and how much. Search for anything or filter by topic. Contract and grant details are shown as published, in Spanish.',
  'Contratos': 'Contracts',
  'Subvenciones': 'Grants',
  'Ayuda a otros países': 'Aid to other countries',
  'Todo': 'All',
  'Tren': 'Rail',
  'Carreteras': 'Roads',
  'Transporte': 'Transport',
  'Sanidad': 'Healthcare',
  'Educación': 'Education',
  'Servicios sociales': 'Social services',
  'Vivienda': 'Housing',
  'Energía': 'Energy',
  'Agua y medio ambiente': 'Water and environment',
  'Seguridad y justicia': 'Security and justice',
  'Defensa': 'Defence',
  'Tecnología': 'Technology',
  'Cultura y deporte': 'Culture and sport',
  'Empleo y empresas': 'Jobs and business',
  'Campo y pesca': 'Farming and fishing',
  'Quién paga': 'Who pays',
  'Todas las administraciones': 'All administrations',
  'Universidades': 'Universities',
  'Otros': 'Other',
  'Panorama': 'Overview',
  'Resultados': 'Results',
  'Cargando…': 'Loading…',
  'Ver más': 'Show more',
  'Qué cubre y qué no': 'What is and is not covered',
  'Busca contratos públicos, subvenciones y ayuda a otros países: quién paga, a quién, para qué y cuánto, con datos oficiales.':
    'Search Spain’s public contracts, grants and aid to other countries: who pays, to whom, what for and how much, with official data.',
  'La Lupa de hucha': 'hucha’s Lens',
  'Qué buscar': 'What to search',
  'Adif, hospital, autovía, Marruecos, una empresa…': 'Adif, hospital, autovía, Morocco, a company…',
  'Temas': 'Topics',

  // Fuentes
  'Fuentes, glosario y aviso legal · hucha': 'Sources, glossary and legal notice · hucha',
  'Todo sale de datos públicos y oficiales. Aquí está, primero en pocas palabras y después con detalle, de dónde viene cada cifra, qué significa, cómo se calcula, lo que no entra en la cuenta y las condiciones legales.':
    'Everything comes from public, official data. Here you will find, first in a nutshell and then in detail, where each figure comes from, what it means, how it is calculated, what is left out and the legal terms.',
  'En pocas palabras': 'In a nutshell',
  'Todas las cifras son oficiales.': 'All figures are official.',
  'Salen de organismos públicos (Eurostat, el Ministerio de Hacienda, la Plataforma de Contratación, la OCDE) y hucha solo las ordena y las explica. No inventa ni estima nada, salvo tu ticket, que es un cálculo aproximado y lo dice.':
    'They come from public bodies (Eurostat, the Spanish Ministry of Finance, the Public Procurement Platform, the OECD) and hucha only organises and explains them. It does not make up or estimate anything, except your receipt, which is an approximate calculation and says so.',
  'Se actualizan solas': 'They update themselves',
  'cada día. Si una fuente falla, la web sigue con los últimos datos buenos.': 'every day. If a source fails, the site keeps the latest good data.',
  'hucha no es una web oficial': 'hucha is not an official website',
  'ni pertenece a ningún partido, administración o empresa. No da opiniones: enseña cifras y las compara con la misma vara.':
    'and does not belong to any party, administration or company. It gives no opinions: it shows figures and compares them by the same yardstick.',
  'Puede tener errores.': 'It may contain mistakes.',
  'Si vas a tomar una decisión, mira la fuente oficial, que siempre está enlazada. Y si ves algo mal,': 'If you are going to make a decision, check the official source, which is always linked. And if you see something wrong,',
  'avísalo': 'let us know',
  'No guarda nada tuyo:': 'It keeps nothing of yours:',
  'sin cookies, sin cuentas, y tu sueldo no sale de tu dispositivo.': 'no cookies, no accounts, and your salary never leaves your device.',
  'Palabras que salen en la web': 'Words used on this site',
  'Gasto público': 'Public spending',
  'Todo lo que gastan juntos el Estado, las comunidades autónomas, los ayuntamientos y la Seguridad Social en un año.':
    'Everything that central government, the autonomous communities, local councils and Social Security spend together in a year.',
  'Todo lo que produce un país en un año. Decir que el gasto es el 45 % del PIB permite comparar países de distinto tamaño.':
    'Everything a country produces in a year. Saying that spending is 45% of GDP makes it possible to compare countries of different sizes.',
  'PIB': 'GDP (PIB in Spanish)',
  'Provisional': 'Provisional',
  'Dato del último año que aún puede revisarse. Suele cambiar poco.': 'Data for the latest year, which may still be revised. It usually changes little.',
  'Presupuesto (créditos)': 'Budget (appropriations)',
  'Lo que el Estado tiene autorizado gastar en el año. Los créditos definitivos incluyen los cambios aprobados desde enero.':
    'What the State is authorised to spend in the year. Final appropriations include the changes approved since January.',
  'Gastado (obligaciones reconocidas)': 'Spent (recognised obligations)',
  'Lo que el Estado ya debe pagar porque el trabajo está hecho o el derecho reconocido. Casi siempre se paga en pocos días.':
    'What the State already has to pay because the work has been done or the entitlement recognised. It is almost always paid within a few days.',
  'Prorrogado': 'Rolled over',
  'Si no se aprueba un presupuesto nuevo, sigue valiendo el del año anterior. Lo dice la Constitución (artículo 134.4).':
    'If no new budget is approved, the previous year’s remains in force. The Spanish Constitution says so (article 134.4).',
  'Licitado y adjudicado': 'Tendered and awarded',
  'Licitado es el precio con el que una administración saca un contrato; adjudicado, el que ofrece la empresa que lo gana. Suele ser menor.':
    'Tendered is the price at which an administration puts a contract out; awarded is the price offered by the company that wins it. It is usually lower.',
  'Acuerdo marco': 'Framework agreement',
  'Un contrato que fija un precio máximo y unas empresas para compras futuras. Su importe es un techo, no un gasto, y por eso hucha no lo suma.':
    'A contract that sets a maximum price and a set of companies for future purchases. Its amount is a ceiling, not spending, so hucha does not add it up.',
  'Subvención': 'Grant',
  'Dinero público que se da a una empresa, entidad o persona para algo concreto, sin que lo devuelva.': 'Public money given to a company, organisation or person for a specific purpose, which does not have to be repaid.',
  'Ayuda oficial al desarrollo': 'Official development assistance',
  'Dinero público de España para mejorar la vida en otros países: salud, agua, emergencias… Lo cuenta la OCDE con las mismas reglas para todos los países.':
    'Spanish public money to improve lives in other countries: health, water, emergencies… The OECD counts it with the same rules for every country.',
  'El gasto público': 'Public spending',
  'Viene de': 'It comes from',
  'Eurostat, tabla': 'Eurostat, table',
  ': el gasto de las Administraciones Públicas por funciones según la clasificación COFOG de Naciones Unidas. Para España lo elabora la':
    ': general government expenditure by function under the United Nations COFOG classification. For Spain it is compiled by the',
  'Intervención General de la Administración del Estado (IGAE)': 'State Comptroller General (IGAE)',
  'y lo envía a Eurostat, que lo publica con el mismo criterio para todos los países de la Unión.': 'and sent to Eurostat, which publishes it on the same basis for every EU country.',
  'Es gasto': 'It is spending',
  'realmente hecho': 'actually made',
  '(contabilidad nacional), no lo presupuestado. Llega con retraso: los datos de un año se publican a principios del año siguiente al siguiente, y el último año sale como provisional. La web se revisa sola cada día y recoge los datos nuevos en cuanto salen.':
    '(national accounts), not what was budgeted. It comes with a delay: a year’s data are published early in the year after next, and the latest year is marked as provisional. The site checks itself every day and picks up new data as soon as it is out.',
  'Dentro de cada partida, «En qué se va» usa el segundo nivel de la misma clasificación (hospitales, medicamentos, universidad, ayuda al desarrollo…), y «Cómo se gasta» las operaciones de contabilidad nacional de la misma tabla: sueldos (D1), compras (P2), pagos a personas (D62), servicios pagados a empresas para los ciudadanos (D632), inversión (P5), subvenciones (D3), intereses (D4), transferencias (D7) y ayudas para inversiones (D9). Lo que no encaja en ninguna va a «Otros».':
    'Within each item, “What it is spent on” uses the second level of the same classification (hospitals, medicines, university, development aid…), and “How it is spent” the national accounts transactions in the same table: salaries (D1), purchases (P2), payments to people (D62), services paid to companies for citizens (D632), investment (P5), subsidies (D3), interest (D4), transfers (D7) and investment grants (D9). Anything that fits none goes to “Other”.',
  'La población es la media anual de España, de la tabla': 'Population is Spain’s annual average, from table',
  'de Eurostat.': 'of Eurostat.',
  'Cómo se agrupan las partidas': 'How the items are grouped',
  'Cada partida junta funciones COFOG. Entre todas cubren el 100 % del gasto, sin contar nada dos veces.': 'Each item brings together COFOG functions. Together they cover 100% of spending, without counting anything twice.',
  'Partida': 'Item',
  'Funciones COFOG': 'COFOG functions',
  'El presupuesto y lo gastado': 'The budget and what is spent',
  'Viene de la': 'It comes from the',
  ', que publica cada mes el estado de ejecución del presupuesto de gastos del Estado, acumulado desde enero. Se usan sus tablas por capítulos, por secciones (ministerios), por políticas de gasto y por programas.':
    ', which publishes every month how much of the central government expenditure budget has been executed, accumulated since January. Its tables by chapter, by section (ministry), by spending policy and by programme are used.',
  'son los créditos definitivos: lo aprobado más las modificaciones del año.': 'means final appropriations: what was approved plus the changes made during the year.',
  'son las obligaciones reconocidas netas. Las cifras principales son las operaciones no financieras (capítulos 1 a 7). Se compara con el mismo mes del año anterior porque el gasto no se reparte igual a lo largo del año.':
    'means net recognised obligations. The headline figures are non-financial operations (chapters 1 to 7). The comparison is with the same month of the previous year because spending is not spread evenly across the year.',
  'Solo cubre el Estado: no la Seguridad Social, las comunidades autónomas ni los ayuntamientos. La web mira cada día si hay un mes nuevo.':
    'It only covers central government: not Social Security, the autonomous communities or local councils. The site checks every day for a new month.',
  'La Lupa': 'The Lens',
  ': los adjudicados desde un millón de euros (sin IVA) en la': ': those awarded for one million euros or more (excluding VAT) on the',
  'Plataforma de Contratación del Sector Público': 'Public Sector Procurement Platform',
  ', incluidos los de las plataformas autonómicas y locales que se agregan a ella. Se leen sus datos abiertos cada día y se van reuniendo. El tema (tren, sanidad…) y si es obra, mantenimiento o compra salen del código oficial del contrato (CPV) y de su título.':
    ', including those from regional and local platforms that feed into it. Its open data are read every day and accumulated. The topic (rail, healthcare…) and whether it is works, maintenance or a purchase come from the contract’s official code (CPV) and its title.',
  ': las concedidas desde un millón de euros en los últimos 12 meses, de la': ': those of one million euros or more awarded in the last 12 months, from the',
  'Base de Datos Nacional de Subvenciones': 'National Grants Database',
  ': los desembolsos de ayuda oficial al desarrollo de España por país, de la': ': Spain’s official development assistance disbursements by country, from the',
  'OCDE': 'OECD',
  ', en millones de dólares.': ', in millions of US dollars.',
  'Las personas físicas (autónomos, particulares) no aparecen con su nombre en ningún caso.': 'Individuals (self-employed people, private persons) never appear by name.',
  'Cómo se calcula tu ticket': 'How your receipt is calculated',
  'Se estima lo que pagas al año como asalariado con contrato indefinido, sin hijos ni situaciones especiales:':
    'It estimates what you pay per year as a permanent employee with no children or special circumstances:',
  ': con el': ': using the',
  'algoritmo de retenciones de la Agencia Tributaria para 2026': 'Spanish Tax Agency withholding algorithm for 2026',
  ': reducción por rendimientos del trabajo, 2.000 € de otros gastos, mínimo personal de 5.550 € y la escala general. Hasta el salario mínimo no se paga. Tu declaración real puede salir distinta por deducciones de tu comunidad, hijos, alquiler o planes de pensiones.':
    ': employment income reduction, €2,000 of other expenses, a personal allowance of €5,550 and the general scale. Nothing is paid up to the minimum wage. Your actual tax return may differ because of regional deductions, children, rent or pension plans.',
  ': el 6,50 % del sueldo hasta la base máxima (contingencias comunes, desempleo, formación profesional y MEI), más la cotización de solidaridad por encima de ella, según la orden de cotización de 2026 (Orden PJC/297/2026, de 30 de marzo, publicada en el BOE).':
    ': 6.50% of salary up to the maximum contribution base (common contingencies, unemployment, vocational training and MEI), plus the solidarity contribution above it, under the 2026 contributions order (Orden PJC/297/2026 of 30 March, published in the BOE).',
  'Tu empresa': 'Your employer',
  ', si activas la opción: un 30,65 % más hasta la base máxima. No incluye accidentes de trabajo, que dependen de la actividad.':
    ', if you turn the option on: a further 30.65% up to the maximum base. Workplace accident insurance is not included, as it depends on the activity.',
  'Lo que pagas se reparte entre las partidas en la misma proporción que el gasto público de ese año. Es una forma de verlo: el dinero de la hucha es común y no se puede seguir euro a euro.':
    'What you pay is split across the items in the same proportion as public spending that year. It is one way of looking at it: the money in the piggy bank is shared and cannot be traced euro by euro.',
  'No entran': 'Not included:',
  'el IVA ni los impuestos especiales (gasolina, tabaco, alcohol, luz), que pagas al comprar; tampoco el IBI ni otros impuestos locales. Y como las administraciones gastan más de lo que ingresan, una parte del gasto se paga con deuda.':
    'VAT and excise duties (fuel, tobacco, alcohol, electricity), which you pay when you buy; nor property tax (IBI) or other local taxes. And since administrations spend more than they collect, part of spending is paid for with debt.',
  'Privacidad': 'Privacy',
  'Sin cookies, sin anuncios y sin cuentas. Tu sueldo no sale de tu navegador: el cálculo se hace en tu dispositivo. Las visitas se cuentan con':
    'No cookies, no ads and no accounts. Your salary never leaves your browser: the calculation is done on your device. Visits are counted with',
  ', que no guarda datos personales.': ', which does not store personal data.',
  'En la Lupa, cuando quien gana un contrato o recibe una subvención es una persona física (un autónomo, un particular), no aparece su nombre: sale como «Persona física» o no se incluye.':
    'In the Lens, when the winner of a contract or the recipient of a grant is an individual (self-employed or a private person), their name is not shown: it appears as “Persona física” (individual) or is not included.',
  'Si una cifra no cuadra, un contrato está mal clasificado o falta algo,': 'If a figure does not add up, a contract is misclassified or something is missing,',
  'avísalo en GitHub': 'report it on GitHub',
  ', mejor con el enlace a la fuente oficial. Se revisa y, si hay que corregirlo, se corrige para todos. Los avisos son públicos: no pongas datos personales.':
    ', ideally with a link to the official source. It will be reviewed and, if it needs fixing, fixed for everyone. Reports are public: do not include personal data.',
  'Aviso legal': 'Legal notice',
  'Lo mismo que arriba, dicho con precisión.': 'The same as above, stated precisely. In case of discrepancy, the Spanish version prevails.',
  'Quién está detrás': 'Who is behind it',
  'hucha es un proyecto personal de Bendi (': 'hucha is a personal project by Bendi (',
  '), publicado en hucha.bendi.dev. Para cualquier comunicación, incluidas las relativas a datos personales, se puede escribir a través de':
    '), published at hucha.bendi.dev. For any communication, including about personal data, you can write via',
  'Qué es y qué no es': 'What it is and is not',
  'hucha tiene una finalidad exclusivamente informativa y divulgativa. No es una publicación oficial, no está vinculada a ninguna administración pública, partido político, sindicato ni empresa, y no recibe financiación pública. Los contenidos no constituyen asesoramiento fiscal, jurídico, financiero ni de ningún otro tipo. El cálculo de «tu ticket» es una estimación orientativa con reglas generales y no sustituye a la declaración de la renta ni a ningún cálculo oficial.':
    'hucha has a purely informative and educational purpose. It is not an official publication, it is not linked to any public administration, political party, trade union or company, and it receives no public funding. Its contents do not constitute tax, legal, financial or any other kind of advice. The “your receipt” calculation is a rough estimate using general rules and does not replace a tax return or any official calculation.',
  'Origen de los datos y reutilización': 'Data sources and re-use',
  'Los datos proceden de fuentes públicas y se reutilizan conforme a sus condiciones, citando siempre la fuente, sin alterar su sentido y con la fecha de la última actualización:':
    'The data come from public sources and are re-used under their terms, always citing the source, without altering its meaning and with the date of the latest update:',
  'Eurostat, según su': 'Eurostat, under its',
  'política de derechos de autor y reutilización': 'copyright and re-use policy',
  'Intervención General de la Administración del Estado, Plataforma de Contratación del Sector Público y Base de Datos Nacional de Subvenciones, según la':
    'State Comptroller General (IGAE), Public Sector Procurement Platform and National Grants Database, under',
  'Ley 37/2007, sobre reutilización de la información del sector público': 'Spanish Law 37/2007 on the re-use of public sector information',
  'OCDE, según sus': 'OECD, under its',
  'términos y condiciones': 'terms and conditions',
  'Las fuentes no participan en hucha ni respaldan sus contenidos. Agrupar, ordenar o calcular a partir de sus datos (partidas, porcentajes, euros por habitante, totales sin acuerdos marco) es obra de hucha, y la web explica en cada caso cómo se hace.':
    'The sources take no part in hucha and do not endorse its contents. Grouping, ordering or calculating from their data (items, percentages, euros per person, totals excluding framework agreements) is hucha’s own work, and the site explains in each case how it is done.',
  'Exactitud y responsabilidad': 'Accuracy and liability',
  'Se procura que la información sea exacta y esté al día, pero puede contener errores, omisiones o retrasos, propios o de las fuentes. hucha no garantiza la exactitud ni la integridad de los datos y no se hace responsable de las decisiones que se tomen a partir de ellos. Para cualquier uso con efectos, consulta la fuente oficial enlazada.':
    'Every effort is made to keep the information accurate and up to date, but it may contain errors, omissions or delays, its own or the sources’. hucha does not guarantee the accuracy or completeness of the data and accepts no liability for decisions made on the basis of them. For any use with consequences, check the linked official source.',
  'Datos personales': 'Personal data',
  'hucha no recoge datos personales de quien la visita: no hay formularios, cuentas ni cookies, y el sueldo que se escribe en el ticket se procesa solo en el propio dispositivo. Las visitas se cuentan con GoatCounter de forma agregada, sin cookies y sin guardar la dirección IP.':
    'hucha collects no personal data from visitors: there are no forms, accounts or cookies, and the salary entered in the receipt is processed only on the device itself. Visits are counted with GoatCounter in aggregate, without cookies and without storing the IP address.',
  'Los contratos y subvenciones proceden de registros públicos cuya publicación exige la ley (la': 'Contracts and grants come from public registers whose publication is required by law (',
  'Ley 9/2017 de Contratos del Sector Público': 'Law 9/2017 on Public Sector Contracts',
  'y la': 'and',
  'Ley 38/2003 General de Subvenciones': 'Law 38/2003 on Grants',
  '). Aun así, por minimización de datos, hucha no muestra el nombre de las personas físicas (autónomos o particulares): en contratos aparecen como «Persona física» y las subvenciones a personas físicas no se incluyen. Si crees que aparece un dato personal que no debería, escribe por':
    '). Even so, for data minimisation, hucha does not show the names of individuals (self-employed or private persons): in contracts they appear as “Persona física” and grants to individuals are not included. If you think personal data appears that should not, write via',
  '(sin poner el dato en el mensaje, que es público) y se retirará. También puedes reclamar ante la': '(without putting the data in the message, which is public) and it will be removed. You can also complain to the',
  'Agencia Española de Protección de Datos': 'Spanish Data Protection Agency (AEPD)',
  'Propiedad intelectual': 'Intellectual property',
  'El código, el diseño, los textos y los gráficos de hucha son de su autor, con todos los derechos reservados (ver la': 'hucha’s code, design, texts and charts belong to its author, all rights reserved (see the',
  'licencia': 'licence',
  '). Los datos pertenecen a sus fuentes. Los nombres de organismos y empresas se usan solo para identificarlos.': '). The data belong to their sources. Names of public bodies and companies are used only to identify them.',
  'Enlaces': 'Links',
  'La web enlaza a páginas de terceros (fuentes oficiales, expedientes, convocatorias) que no controla y de cuyo contenido no responde.':
    'The site links to third-party pages (official sources, contract files, grant calls) that it does not control and for whose content it is not responsible.',
  'Ley aplicable': 'Governing law',
  'Este aviso se rige por la legislación española.': 'This notice is governed by Spanish law.',
  'De dónde salen los datos de hucha, cómo se calcula tu ticket y qué no entra en la cuenta.': 'Where hucha’s data come from, how your receipt is calculated and what is left out.',

  // Tabla de partidas de Fuentes (la rehace fuentes.js, pero está en el HTML para que no salte al cargar)
  'Pensiones de jubilación y viudedad': 'Retirement and survivors’ pensions',
  '1002 Vejez + 1003 Supervivencia': '1002 Old age + 1003 Survivors',
  '07 Salud': '07 Health',
  '09 Educación': '09 Education',
  'Bajas, incapacidad, familia y otras ayudas': 'Sick leave, disability, family and other benefits',
  '10 Protección social, menos 1002 Vejez, 1003 Supervivencia, 1005 Desempleo': '10 Social protection, minus 1002 Old age, 1003 Survivors, 1005 Unemployment',
  'Funcionamiento de las administraciones': 'Running the administrations',
  '01 Servicios públicos generales, menos 0107 Operaciones de deuda pública': '01 General public services, minus 0107 Public debt transactions',
  'Empleo, empresas, campo y energía': 'Jobs, business, farming and energy',
  '04 Asuntos económicos, menos 0405 Transporte': '04 Economic affairs, minus 0405 Transport',
  'Intereses de la deuda': 'Interest on debt',
  '0107 Operaciones de deuda pública': '0107 Public debt transactions',
  'Carreteras, trenes y transporte': 'Roads, railways and transport',
  '0405 Transporte': '0405 Transport',
  'Paro': 'Unemployment',
  '1005 Desempleo': '1005 Unemployment',
  'Policía, justicia y prisiones': 'Police, justice and prisons',
  '03 Orden público y seguridad': '03 Public order and safety',
  'Cultura, deporte y religión': 'Culture, sport and religion',
  '08 Ocio, cultura y religión': '08 Recreation, culture and religion',
  'Medio ambiente y basuras': 'Environment and waste',
  '05 Protección del medio ambiente': '05 Environmental protection',
  '02 Defensa': '02 Defence',
  'Vivienda, urbanismo y agua': 'Housing, urban planning and water',
  '06 Vivienda y servicios comunitarios': '06 Housing and community amenities',
  // Descargas
  'Descarga los datos': 'Download the data',
  'Los mismos datos de esta página, para tu hoja de cálculo o tu programa. Son datos públicos: si los usas, cita la fuente original y, si quieres, hucha.':
    'The same data as on this page, for your spreadsheet or your software. It is public data: if you use it, cite the original source and, if you like, hucha.',
  'Descargar los datos': 'Downloading the data',
  'Cada página tiene al final un apartado «Descarga los datos», y la Lupa, un botón bajo la lista. Bajan exactamente las cifras que se ven, con la misma fecha.':
    'Each page has a “Download the data” section at the end, and the Lens has a button below the list. You get exactly the figures shown, with the same date.',
  ', para abrir en Excel, LibreOffice o Google Sheets. En la web en castellano va separado por punto y coma y con coma decimal; en la de inglés, por comas y con punto decimal. Los importes van en millones de euros (en euros en la Lupa, y en millones de dólares en la ayuda a otros países) y las partes, en tanto por uno: 0,25 es el 25 %.':
    ', to open in Excel, LibreOffice or Google Sheets. On the Spanish site it uses semicolons and decimal commas; on the English site, commas and decimal points. Amounts are in millions of euros (in euros in the Lens, and in millions of US dollars for aid to other countries) and shares are fractions: 0.25 means 25%.',
  ', para programas: los mismos ficheros que usa la web, en': ', for software: the same files the site uses, in',
  'y': 'and',
  '. Cambian cada día con los datos nuevos.': '. They change every day with new data.',
  'Los datos son de sus fuentes, no de hucha: si los usas, cita la fuente original (Eurostat, IGAE, Plataforma de Contratación, BDNS u OCDE) y la fecha. En la Lupa, los títulos, organismos y empresas salen tal cual se publican.':
    'The data belongs to its sources, not to hucha: if you use it, cite the original source (Eurostat, IGAE, the Procurement Platform, BDNS or the OECD) and the date. In the Lens, titles, bodies and companies are shown as published.',
  // Ticket en el móvil y temas que no son una partida
  'Ver mi ticket': 'See my receipt',
  'Temas que no son una partida': 'Topics that are not an item',
  'Algunos temas no tienen partida propia en las cuentas oficiales: están repartidos entre varias o se ven mejor en otro sitio de hucha.':
    'Some topics have no item of their own in the official accounts: they are spread across several, or are better seen elsewhere on hucha.',
  'Cooperación exterior.': 'Development cooperation.',
  'La ayuda al desarrollo de todas las administraciones está dentro de «Funcionamiento de las administraciones» (ábrela para ver cuánto es). País por país y sector por sector, en la':
    'Development aid from all administrations is inside “Running the administrations” (open it to see how much). Country by country and sector by sector, in the',
  '; lo que presupuesta el Estado, en': '; what central government budgets for it, in',
  'Igualdad y violencia de género.': 'Equality and gender-based violence.',
  'Las cuentas europeas no la separan: va dentro de servicios sociales, empleo, justicia o seguridad. Lo que presupuesta el Estado para ello (el Ministerio de Igualdad y sus programas), en Presupuesto:':
    'The European accounts do not separate it: it is inside social services, employment, justice or security. What central government budgets for it (the Ministry of Equality and its programmes), in Budget:',
  'igualdad': 'equality',
  'violencia de género': 'gender-based violence',
  'Dependencia.': 'Long-term care.',
  'Va dentro de «Bajas, incapacidad, familia y otras ayudas». Lo del Estado, en': 'It is inside “Sick leave, disability, family and other benefits”. Central government’s share, in',
  'Becas e investigación.': 'Grants for students and research.',
  'Las becas van dentro de Educación y la investigación, repartida en cada partida (y la básica, en «Funcionamiento de las administraciones»). Lo del Estado, en Presupuesto:':
    'Student grants are inside Education, and research is spread across each item (basic research is in “Running the administrations”). Central government’s share, in Budget:',
  'becas': 'student grants',
  'e': 'and',
  'investigación': 'research',
  'Igualdad': 'Equality',
  'Violencia de género': 'Gender-based violence',
  'Cooperación exterior': 'Development cooperation',
  'Dependencia': 'Long-term care',
  'Becas': 'Student grants',
  'Investigación': 'Research',
  'Temas que se buscan a menudo': 'Frequently searched topics',
};

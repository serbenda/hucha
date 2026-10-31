// TEMPORAL: prueba desde GitHub qué fuentes de la Lupa responden y deja muestras en anotaciones.
const cabeceras = { 'User-Agent': 'hucha (github.com/serbenda/hucha)', Accept: '*/*' };
const grupo = process.argv[2];
const PRUEBAS = {
  bdns: [
    'https://www.infosubvenciones.es/bdnstrans/api/concesiones/busqueda?page=0&pageSize=3&vpd=GE',
    'https://www.infosubvenciones.es/bdnstrans/api/v3/api-docs',
    'https://www.pap.hacienda.gob.es/bdnstrans/api/concesiones/busqueda?page=0&pageSize=3&vpd=GE',
    'https://www.infosubvenciones.es/bdnstrans/api/convocatorias/busqueda?page=0&pageSize=2&vpd=GE',
  ],
  oecd: [
    'https://sdmx.oecd.org/public/rest/data/OECD.DCD.FSD,DSD_DAC2@DF_DAC2A,/ESP.......?startPeriod=2023&endPeriod=2023&format=csvfilewithlabels',
    'https://sdmx.oecd.org/public/rest/dataflow/OECD.DCD.FSD/DSD_DAC2@DF_DAC2A/latest',
  ],
  placsp: [
    'https://contrataciondelestado.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom',
  ],
};
const esc = (t) => t.replace(/%/g, '%25').replace(/\r/g, '').replace(/\n/g, '%0A');
for (const url of PRUEBAS[grupo] ?? []) {
  try {
    const r = await fetch(url, { headers: cabeceras, signal: AbortSignal.timeout(90000) });
    const texto = await r.text();
    let muestra = texto;
    if (grupo === 'placsp') {
      const i = texto.indexOf('<entry');
      muestra = texto.slice(0, 600) + '\n…\n' + texto.slice(i, i + 3200);
    } else if (grupo === 'oecd' && url.includes('csv')) {
      const filas = texto.split('\n');
      const cab = filas[0];
      const col = (n) => cab.split(',').indexOf(n);
      const medidas = new Map();
      for (const f of filas.slice(1)) { const c = f.split(','); const k = c.slice(0, 12).join('|'); medidas.set(c[col('MEASURE')] + ' ' + c[col('Measure')], (medidas.get(c[col('MEASURE')] + ' ' + c[col('Measure')]) ?? 0) + 1); void k; }
      muestra = `filas ${filas.length}\n${cab}\n${filas.slice(1, 4).join('\n')}\nMEDIDAS: ${[...medidas].slice(0, 40).map(([m, n]) => m + '=' + n).join(' | ')}`;
    }
    console.log(`::notice title=${grupo} ${r.status} ${url.slice(0, 110)}::${esc(`${r.headers.get('content-type')} · ${texto.length} bytes\n${muestra.slice(0, 3800)}`)}`);
  } catch (e) {
    console.log(`::warning title=${grupo} FALLO ${url.slice(0, 110)}::${esc(String(e.message))}`);
  }
}

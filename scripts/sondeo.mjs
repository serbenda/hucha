// TEMPORAL: prueba desde GitHub qué fuentes de la Lupa responden y deja muestras en anotaciones.
const cabeceras = { 'User-Agent': 'hucha (github.com/serbenda/hucha)', Accept: '*/*' };
const grupo = process.argv[2];
const PRUEBAS = {
  bdns: [
    'https://www.infosubvenciones.es/bdnstrans/api/concesiones/busqueda?page=0&pageSize=1&vpd=GE&fechaDesde=01/10/2026&fechaHasta=07/10/2026',
    'https://www.infosubvenciones.es/bdnstrans/api/concesiones/busqueda?page=0&pageSize=1&vpd=GE&fechaDesde=2026-10-01&fechaHasta=2026-10-07',
    'https://www.infosubvenciones.es/bdnstrans/api/concesiones/busqueda?page=0&pageSize=2&vpd=GE&fechaDesde=01/10/2026&fechaHasta=07/10/2026&order=importe&direccion=desc',
    'https://www.infosubvenciones.es/bdnstrans/api/concesiones/busqueda?page=0&pageSize=2&vpd=GE&fechaDesde=01/10/2026&fechaHasta=07/10/2026&sort=importe,desc',
    'https://www.infosubvenciones.es/bdnstrans/api/concesiones/busqueda?page=0&pageSize=1&vpd=GE&importeDesde=1000000',
    'https://www.infosubvenciones.es/bdnstrans/api/concesiones/busqueda?page=0&pageSize=1&vpd=GE&administracion=E',
  ],
  oecd: [
    'https://sdmx.oecd.org/public/rest/data/OECD.DCD.FSD,DSD_DAC2@DF_DAC2A,/ESP..206..Q?startPeriod=2023&endPeriod=2023&format=csvfilewithlabels',
    'https://sdmx.oecd.org/public/rest/data/OECD.DCD.FSD,DSD_DAC2@DF_DAC2A,/ESP.MAR+UKR+DPGC.206..?startPeriod=2022&format=csvfilewithlabels',
  ],
  placsp: [
    'https://contrataciondelestado.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom',
    'HEAD https://contrataciondelestado.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3_202609.zip',
    'HEAD https://contrataciondelestado.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3_2025.zip',
  ],
};
const esc = (t) => t.replace(/%/g, '%25').replace(/\r/g, '').replace(/\n/g, '%0A');
for (let url of PRUEBAS[grupo] ?? []) {
  try {
    let metodo = 'GET';
    if (url.startsWith('HEAD ')) { metodo = 'HEAD'; url = url.slice(5); }
    const r = await fetch(url, { method: metodo, headers: cabeceras, signal: AbortSignal.timeout(90000) });
    if (metodo === 'HEAD') { console.log(`::notice title=${grupo} HEAD ${r.status} ${url.slice(-50)}::${r.headers.get('content-length')} bytes ${r.headers.get('content-type')} ${r.headers.get('last-modified')}`); continue; }
    const texto = await r.text();
    let muestra = texto;
    if (grupo === 'placsp') {
      // Una entrada adjudicada, solo las partes útiles
      const entradas = texto.split('<entry>').slice(1);
      const adj = entradas.find((e) => e.includes('<cac:TenderResult>') && e.includes('WinningParty')) ?? entradas[0];
      const trozo = (et) => { const a = adj.indexOf('<' + et); return a < 0 ? `(sin ${et})` : adj.slice(a, adj.indexOf('</' + et, a) + et.length + 3); };
      const estados = {}; for (const e of entradas) { const m = e.match(/ContractFolderStatusCode[^>]*>([A-Z]+)</); estados[m?.[1]] = (estados[m?.[1]] ?? 0) + 1; }
      const sig = texto.match(/<link[^>]*rel="next"[^>]*>/)?.[0] ?? '(sin next)';
      const upd = texto.match(/<updated>([^<]+)<\/updated>/)?.[1];
      muestra = `estados ${JSON.stringify(estados)} · feed updated ${upd} · ${sig}\n` + ['cbc:ContractFolderID', 'cac:ProcurementProject', 'cac:TenderResult'].map(trozo).join('\n').replace(/\s+/g, ' ').slice(0, 3600);
    } else if (grupo === 'bdns') {
      const j = JSON.parse(texto);
      muestra = `total ${j.totalElements} · ${JSON.stringify(j.content?.map((c) => [c.fechaConcesion, c.importe, c.beneficiario, c.nivel1, c.nivel3]))}`;
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

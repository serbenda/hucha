// TEMPORAL: prueba desde GitHub qué fuentes de la Lupa responden y deja muestras en anotaciones.
const cabeceras = { 'User-Agent': 'hucha (github.com/serbenda/hucha)', Accept: '*/*' };
const grupo = process.argv[2];
const PRUEBAS = {
  bdns: [
    'https://www.infosubvenciones.es/bdnstrans/api/concesiones/busqueda?page=0&pageSize=3&vpd=GE&fechaDesde=01/10/2026&fechaHasta=31/10/2026&sort=importe,desc',
    'https://www.infosubvenciones.es/bdnstrans/api/concesiones/busqueda?page=0&pageSize=3&vpd=GE&fechaDesde=01/10/2026&fechaHasta=31/10/2026&order=importe&direccion=desc',
  ],
  oecd: [
    'https://sdmx.oecd.org/public/rest/data/OECD.DCD.FSD,DSD_DAC2@DF_DAC2A,1.7/all?startPeriod=2023&endPeriod=2023&dimensionAtObservation=AllDimensions&format=csvfilewithlabels',
    'https://sdmx.oecd.org/public/rest/datastructure/OECD.DCD.FSD/DSD_DAC2/latest',
    'HEAD https://webfs-dcd.oecd.org/files/dotStat/DSD_DAC2/Table2a_Data.zip',
  ],
  placsp: [
    'https://contrataciondelestado.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom',
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
      muestra = `estados ${JSON.stringify(estados)} · feed updated ${upd} · ${sig}\n` + ['cac:TenderResult', 'cac-place-ext:LocatedContractingParty'].map(trozo).join('\n').replace(/\s+/g, ' ').slice(0, 3600);
    } else if (grupo === 'bdns') {
      const j = JSON.parse(texto);
      muestra = `total ${j.totalElements} · ${JSON.stringify(j.content?.map((c) => [c.fechaConcesion, c.importe, c.beneficiario, c.nivel1, c.nivel3]))}`;
    } else if (grupo === 'oecd' && url.includes('datastructure')) {
      muestra = [...texto.matchAll(/<structure:Dimension [^>]*id="([^"]+)"[^>]*position="(\d+)"/g)].map((m) => m[2] + ':' + m[1]).join(' ') + ' | ' + [...texto.matchAll(/codelist[^>]*id="([^"]+)"/gi)].map((m) => m[1]).slice(0, 20).join(' ');
    } else if (grupo === 'oecd' && url.includes('csv')) {
      const filas = texto.split('\n');
      const cab = filas[0];
      const col = (n) => cab.split(',').indexOf(n);
      const medidas = new Map();
      for (const f of filas.slice(1)) { const c = f.split(','); const k = c.slice(0, 12).join('|'); medidas.set(c[col('MEASURE')] + ' ' + c[col('Measure')], (medidas.get(c[col('MEASURE')] + ' ' + c[col('Measure')]) ?? 0) + 1); void k; }
      const espana = filas.filter((f) => /Spain/.test(f)).slice(0, 3);
      muestra = `filas ${filas.length}\n${cab}\n${filas.slice(1, 3).join('\n')}\nESPAÑA: ${espana.join('\n')}\nMEDIDAS: ${[...medidas].slice(0, 30).map(([m, n]) => m + '=' + n).join(' | ')}`;
    }
    console.log(`::notice title=${grupo} ${r.status} ${url.slice(0, 110)}::${esc(`${r.headers.get('content-type')} · ${texto.length} bytes\n${muestra.slice(0, 3800)}`)}`);
  } catch (e) {
    console.log(`::warning title=${grupo} FALLO ${url.slice(0, 110)}::${esc(String(e.message))}`);
  }
}

// Códigos de país de tres letras (los que usa la OCDE) a dos letras, para nombrarlos en castellano
// con Intl.DisplayNames. Generado a partir de los datos de territorios de CLDR.

const ISO3 = {ABW:"AW",AFG:"AF",AGO:"AO",AIA:"AI",ALA:"AX",ALB:"AL",AND:"AD",ARE:"AE",ARG:"AR",ARM:"AM",ASC:"AC",ASM:"AS",ATA:"AQ",ATF:"TF",ATG:"AG",AUS:"AU",AUT:"AT",AZE:"AZ",BDI:"BI",BEL:"BE",BEN:"BJ",BES:"BQ",BFA:"BF",BGD:"BD",BGR:"BG",BHR:"BH",BHS:"BS",BIH:"BA",BLM:"BL",BLR:"BY",BLZ:"BZ",BMU:"BM",BOL:"BO",BRA:"BR",BRB:"BB",BRN:"BN",BTN:"BT",BUR:"MM",BVT:"BV",BWA:"BW",CAF:"CF",CAN:"CA",CCK:"CC",CHE:"CH",CHL:"CL",CHN:"CN",CIV:"CI",CMR:"CM",COD:"CD",COG:"CG",COK:"CK",COL:"CO",COM:"KM",CPT:"CP",CPV:"CV",CRI:"CR",CUB:"CU",CUW:"CW",CXR:"CX",CYM:"KY",CYP:"CY",CZE:"CZ",DDR:"DE",DEU:"DE",DGA:"DG",DJI:"DJ",DMA:"DM",DNK:"DK",DOM:"DO",DZA:"DZ",ECU:"EC",EGY:"EG",ERI:"ER",ESH:"EH",ESP:"ES",EST:"EE",ETH:"ET",FIN:"FI",FJI:"FJ",FLK:"FK",FRA:"FR",FRO:"FO",FSM:"FM",FXX:"FR",GAB:"GA",GBR:"GB",GEO:"GE",GGY:"GG",GHA:"GH",GIB:"GI",GIN:"GN",GLP:"GP",GMB:"GM",GNB:"GW",GNQ:"GQ",GRC:"GR",GRD:"GD",GRL:"GL",GTM:"GT",GUF:"GF",GUM:"GU",GUY:"GY",HKG:"HK",HMD:"HM",HND:"HN",HRV:"HR",HTI:"HT",HUN:"HU",IDN:"ID",IMN:"IM",IND:"IN",IOT:"IO",IRL:"IE",IRN:"IR",IRQ:"IQ",ISL:"IS",ISR:"IL",ITA:"IT",JAM:"JM",JEY:"JE",JOR:"JO",JPN:"JP",KAZ:"KZ",KEN:"KE",KGZ:"KG",KHM:"KH",KIR:"KI",KNA:"KN",KOR:"KR",KWT:"KW",LAO:"LA",LBN:"LB",LBR:"LR",LBY:"LY",LCA:"LC",LIE:"LI",LKA:"LK",LSO:"LS",LTU:"LT",LUX:"LU",LVA:"LV",MAC:"MO",MAF:"MF",MAR:"MA",MCO:"MC",MDA:"MD",MDG:"MG",MDV:"MV",MEX:"MX",MHL:"MH",MKD:"MK",MLI:"ML",MLT:"MT",MMR:"MM",MNE:"ME",MNG:"MN",MNP:"MP",MOZ:"MZ",MRT:"MR",MSR:"MS",MTQ:"MQ",MUS:"MU",MWI:"MW",MYS:"MY",MYT:"YT",NAM:"NA",NCL:"NC",NER:"NE",NFK:"NF",NGA:"NG",NIC:"NI",NIU:"NU",NLD:"NL",NOR:"NO",NPL:"NP",NRU:"NR",NZL:"NZ",OMN:"OM",PAK:"PK",PAN:"PA",PCN:"PN",PER:"PE",PHL:"PH",PLW:"PW",PNG:"PG",POL:"PL",PRI:"PR",PRK:"KP",PRT:"PT",PRY:"PY",PSE:"PS",PYF:"PF",QAT:"QA",QUU:"EU",REU:"RE",ROU:"RO",RUS:"RU",RWA:"RW",SAU:"SA",SDN:"SD",SEN:"SN",SGP:"SG",SGS:"GS",SHN:"SH",SJM:"SJ",SLB:"SB",SLE:"SL",SLV:"SV",SMR:"SM",SOM:"SO",SPM:"PM",SRB:"RS",SSD:"SS",STP:"ST",SUR:"SR",SVK:"SK",SVN:"SI",SWE:"SE",SWZ:"SZ",SXM:"SX",SYC:"SC",SYR:"SY",TAA:"TA",TCA:"TC",TCD:"TD",TGO:"TG",THA:"TH",TJK:"TJ",TKL:"TK",TKM:"TM",TLS:"TL",TMP:"TL",TON:"TO",TTO:"TT",TUN:"TN",TUR:"TR",TUV:"TV",TWN:"TW",TZA:"TZ",UGA:"UG",UKR:"UA",UMI:"UM",URY:"UY",USA:"US",UZB:"UZ",VAT:"VA",VCT:"VC",VEN:"VE",VGB:"VG",VIR:"VI",VNM:"VN",VUT:"VU",WLF:"WF",WSM:"WS",XAA:"XA",XBB:"XB",XKK:"XK",XKV:"XK",XKX:"XK",YEM:"YE",YMD:"YE",ZAF:"ZA",ZAR:"CD",ZMB:"ZM",ZWE:"ZW",ZZZ:"ZZ"};

const nombres = typeof Intl !== 'undefined' && Intl.DisplayNames ? new Intl.DisplayNames(['es'], { type: 'region' }) : null;

/** 'MAR' → 'Marruecos'; null si no es un país (regiones, «sin especificar»…). */
export function nombrePais(iso3) {
  const iso2 = ISO3[iso3];
  if (!iso2) return null;
  try {
    return nombres?.of(iso2) ?? iso2;
  } catch {
    return iso2;
  }
}

export const esPais = (iso3) => Boolean(ISO3[iso3]);

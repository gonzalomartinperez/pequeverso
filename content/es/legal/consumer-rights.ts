/**
 * "Si compras desde…" reference for /arrepentimiento/#paises. One row per market, sorted
 * alphabetically (Spanish collation). `period` is stated only when the statute text was read on an
 * official or primary source (listed in `source` and in docs/legal-checklist.md, read 2026-09-24);
 * otherwise it is `null` and the page shows the authority link with a neutral note. The note never
 * adds a period that `source` does not back. Cuba is omitted (Hotmart excludes OFAC-sanctioned
 * countries). tests/unit/consumer-rights.test.ts checks https links, sources and order.
 */
export type ConsumerRightsEntry = {
  country: string;
  /** Consumer-protection authority. */
  authority: string;
  /** Official page where a consumer files a complaint (or the authority's home page). */
  url: string;
  /** Statutory withdrawal period for distance/online sales, or null when not verified. */
  period: string | null;
  /** Short note: statute and, where it exists, the digital-content exception. */
  note: string;
  /** Primary source for `period` (required when `period` is not null). */
  source?: string;
};

export const consumerRights: readonly ConsumerRightsEntry[] = [
  {
    country: "Argentina",
    authority: "Defensa de las y los Consumidores (Ventanilla Federal Única de Reclamos)",
    url: "https://www.argentina.gob.ar/servicio/iniciar-un-reclamo-ante-defensa-del-consumidor",
    period: "10 días corridos",
    note: "Ley 24.240, art. 34, y Código Civil y Comercial, art. 1110. El art. 1116 exceptúa, salvo pacto en contrario, los archivos descargables de inmediato; la garantía de Hotmart es ese pacto. En la provincia de Buenos Aires también atiende la Dirección Provincial de Defensa de los Derechos de las y los Consumidores.",
    source: "https://servicios.infoleg.gob.ar/infolegInternet/anexos/0-4999/638/texact.htm",
  },
  {
    country: "Bolivia",
    authority: "Viceministerio de Defensa de los Derechos del Usuario y del Consumidor",
    url: "https://consumidor.justicia.gob.bo/",
    period: null,
    note: "Ley 453 de 2013, General de los Derechos de las Usuarias y los Usuarios y de las Consumidoras y los Consumidores.",
  },
  {
    country: "Brasil",
    authority: "Senacon (consumidor.gov.br) y Procon de tu estado",
    url: "https://www.consumidor.gov.br/",
    period: "7 días",
    note: "Código de Defesa do Consumidor (Lei 8.078/1990), art. 49, para compras fuera del establecimiento comercial.",
    source: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm",
  },
  {
    country: "Chile",
    authority: "Servicio Nacional del Consumidor (SERNAC)",
    url: "https://www.sernac.cl/portal/617/w3-article-9178.html",
    period: "10 días",
    note: "Ley 19.496, art. 3 bis b), para contratos celebrados por medios electrónicos. La ley no menciona expresamente el contenido digital.",
    source: "https://www.bcn.cl/leychile/navegar?idNorma=1160403",
  },
  {
    country: "Colombia",
    authority: "Superintendencia de Industria y Comercio (SIC)",
    url: "https://denuncias.sic.gov.co/consumidor/consumidor/paso0",
    period: "5 días hábiles",
    note: "Ley 1480 de 2011, art. 47 (derecho de retracto). No prevé una excepción expresa para contenido digital.",
    source: "https://www.secretariasenado.gov.co/senado/basedoc/ley_1480_2011.html",
  },
  {
    country: "Costa Rica",
    authority: "Ministerio de Economía, Industria y Comercio (MEIC), Consumidor",
    url: "https://www.consumo.go.cr/",
    period: null,
    note: "Ley 7472 de Promoción de la Competencia y Defensa Efectiva del Consumidor y su reglamento.",
  },
  {
    country: "Ecuador",
    authority: "Defensoría del Pueblo",
    url: "https://www.dpe.gob.ec/",
    period: null,
    note: "Ley Orgánica de Defensa del Consumidor, art. 45 (derecho de devolución o cambio).",
  },
  {
    country: "El Salvador",
    authority: "Defensoría del Consumidor",
    url: "https://www.defensoria.gob.sv/servicios/enlinea/",
    period: null,
    note: "Ley de Protección al Consumidor.",
  },
  {
    country: "España",
    authority: "Ministerio de Derechos Sociales, Consumo y Agenda 2030 (cómo reclamar)",
    url: "https://www.dsca.gob.es/es/consumo/como-reclamar-conflicto-consumo",
    period: "14 días naturales",
    note: "Real Decreto Legislativo 1/2007, arts. 102 y 104. El art. 103 m) excluye el contenido digital descargado cuando diste tu consentimiento previo, reconociste que perdías el derecho y recibiste la confirmación; la garantía de Hotmart se aplica igualmente.",
    source: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555",
  },
  {
    country: "Estados Unidos y Puerto Rico",
    authority: "Comisión Federal de Comercio (FTC); en Puerto Rico, DACO",
    url: "https://reportefraude.ftc.gov/",
    period: null,
    note: "No existe un derecho federal general de arrepentimiento para compras en línea: la regla de la FTC (16 CFR 429) cubre ventas a domicilio o en lugares temporales. Las leyes de cada estado pueden añadir protecciones; en Puerto Rico, reclamos ante DACO (daco.pr.gov).",
  },
  {
    country: "Guatemala",
    authority: "Dirección de Atención y Asistencia al Consumidor (DIACO)",
    url: "https://diaco.gob.gt/tramite-de-queja/",
    period: null,
    note: "Ley de Protección al Consumidor y Usuario (Decreto 006-2003).",
  },
  {
    country: "Honduras",
    authority: "Dirección General de Protección al Consumidor (SDE)",
    url: "https://sde.gob.hn/proteccion-al-consumidor/",
    period: null,
    note: "Ley de Protección al Consumidor (Decreto 24-2008).",
  },
  {
    country: "México",
    authority: "Procuraduría Federal del Consumidor (PROFECO), Concilianet",
    url: "https://concilianet.profeco.gob.mx/Concilianet/",
    period: null,
    note: "Ley Federal de Protección al Consumidor. PROFECO orienta sobre la cancelación de compras fuera del establecimiento.",
  },
  {
    country: "Nicaragua",
    authority: "Dirección de Protección de los Derechos de las Personas Consumidoras (DIPRODEC, MIFIC)",
    url: "https://www.mific.gob.ni/Inicio/Servicios/Servicio-Diprodec",
    period: null,
    note: "Ley 842 de Protección de los Derechos de las Personas Consumidoras y Usuarias.",
  },
  {
    country: "Panamá",
    authority: "Autoridad de Protección al Consumidor y Defensa de la Competencia (ACODECO)",
    url: "https://tableroquejas.acodeco.gob.pa/form_quejas.php",
    period: null,
    note: "Ley 45 de 2007.",
  },
  {
    country: "Paraguay",
    authority: "Secretaría de Defensa del Consumidor y el Usuario (SEDECO)",
    url: "https://sedeco.gov.py/",
    period: null,
    note: "Ley 1334/98 de Defensa del Consumidor y del Usuario y Ley 4868/2013 de Comercio Electrónico.",
  },
  {
    country: "Perú",
    authority: "INDECOPI (Reclama Virtual)",
    url: "https://enlinea.indecopi.gob.pe/reclamavirtual/",
    period: null,
    note: "El Código de Protección y Defensa del Consumidor (Ley 29571) no prevé un derecho general de arrepentimiento; su art. 59 lo reconoce ante métodos comerciales agresivos o engañosos.",
  },
  {
    country: "República Dominicana",
    authority: "Pro Consumidor",
    url: "https://proconsumidor.gob.do/formulario-de-denuncias-y-reclamaciones/",
    period: null,
    note: "Ley General de Protección de los Derechos del Consumidor o Usuario (Ley 358-05).",
  },
  {
    country: "Unión Europea (resto de países)",
    authority: "Comisión Europea: organismos de resolución de litigios de consumo",
    url: "https://consumer-redress.ec.europa.eu/dispute-resolution-bodies",
    period: "14 días",
    note: "Directiva 2011/83/UE, art. 9. El art. 16 m) excluye el contenido digital descargado con tu consentimiento previo y reconocimiento de la pérdida del derecho; la garantía de Hotmart se aplica igualmente.",
    source: "https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:02011L0083-20220528",
  },
  {
    country: "Uruguay",
    authority: "Unidad de Defensa del Consumidor (Ministerio de Economía y Finanzas)",
    url: "https://www.gub.uy/tramites/consulta-reclamo-yo-denuncia-materia-defensa-consumidor",
    period: "5 días hábiles",
    note: "Ley 17.250, art. 16, para ofertas por medios informáticos, desde el contrato o la entrega. El producto debe devolverse sin uso.",
    source: "https://www.impo.com.uy/bases/leyes/17250-2000",
  },
  {
    country: "Venezuela",
    authority: "Superintendencia Nacional para la Defensa de los Derechos Socioeconómicos (SUNDDE)",
    url: "https://www.sundde.gob.ve/?p=29121",
    period: null,
    note: "Ley Orgánica de Precios Justos.",
  },
];

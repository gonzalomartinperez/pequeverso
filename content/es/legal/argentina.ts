/**
 * Argentine legal anchors for the legal pages: control authorities, statutory periods and the
 * jurisdiction clause. Sources and the date they were read are listed in docs/legal-checklist.md;
 * change a value here only together with that list.
 */
import { seller } from "./seller.ts";

/** Consumer-law periods the pages quote. */
export const consumerLaw = {
  /** Ley 24.240 art. 34 and CCyC art. 1110: revocation of distance sales, calendar days. */
  revocationDays: 10,
  /** Res. SCI 424/2020 art. 3: the request code must reach the consumer within 24 hours. */
  revocationCodeHours: 24,
} as const;

/** Consumer-protection authorities linked from the footer and the legal pages. */
export const consumerAuthority = {
  national: {
    name: "Ventanilla Única Federal de Defensa del Consumidor",
    url: "https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario",
  },
  province: {
    name: "Dirección Provincial de Defensa de las y los Consumidores de la provincia de Buenos Aires",
    url: "https://www.gba.gob.ar/consumidores",
  },
} as const;

/** Personal-data control authority (Ley 25.326, Decreto 746/2017). */
export const dataAuthority = {
  name: "Agencia de Acceso a la Información Pública (AAIP)",
  url: "https://www.argentina.gob.ar/aaip/datospersonales",
  /** Mandatory notice, Disposición DNPDP 10/2008 art. 1, with the current authority's name. */
  notice:
    "El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley N° 25.326. La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.",
} as const;

/**
 * Governing law and courts. Consumers keep the forum of their own domicile: in Argentina a
 * prorogation of jurisdiction in a consumer contract is void (CCyC art. 1109, Ley 24.240 art. 37),
 * and in an international consumer contract the consumer may sue in their domicile (CCyC art. 2654).
 */
export function jurisdictionClause(subject: string): string[] {
  return [
    `${subject} se rigen por las leyes de la ${seller.country}.`,
    `Para cualquier controversia serán competentes ${seller.jurisdiction}, sin perjuicio de los derechos que asisten a quien actúe como consumidor. Si eres consumidor, puedes iniciar tu reclamo ante la autoridad de defensa del consumidor o los tribunales correspondientes a tu domicilio, y esta cláusula nunca se interpretará como una renuncia a ese derecho ni a las normas de protección al consumidor de tu país de residencia que te resulten más favorables.`,
  ];
}

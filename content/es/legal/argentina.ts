/**
 * Argentine legal anchors for the legal pages: control authorities, statutory periods and the
 * jurisdiction clause. Sources and the date they were read (2026-09-24) are listed in
 * docs/legal-checklist.md; change a value here only together with that list.
 */
import { seller } from "./seller.ts";

/** Consumer-law periods the pages quote. */
export const consumerLaw = {
  /** Ley 24.240 art. 34 and CCyC art. 1110: revocation of distance sales, calendar days. */
  revocationDays: 10,
  /** Disposición SSDCyLC 954/2025 art. 5: request code within 24 hours, by the same channel. */
  revocationCodeHours: 24,
} as const;

/** National consumer-protection complaint entry point (Ventanilla Federal Única de Reclamos). */
export const consumerAuthority = {
  name: "Defensa de las y los Consumidores (Ventanilla Federal Única de Reclamos)",
  url: "https://www.argentina.gob.ar/servicio/iniciar-un-reclamo-ante-defensa-del-consumidor",
} as const;

/** Consumer office of the provincia de Buenos Aires, where the Titular is domiciled. */
export const provincialConsumerAuthority = {
  name: "Dirección Provincial de Defensa de los Derechos de las y los Consumidores y Usuarios (provincia de Buenos Aires)",
  url: "https://www.gba.gob.ar/defensaconsumidores",
} as const;

/** Personal-data control authority (Ley 25.326; Resolución AAIP 14/2018). */
export const dataAuthority = {
  name: "Agencia de Acceso a la Información Pública (AAIP)",
  url: "https://www.argentina.gob.ar/aaip/datospersonales",
  complaintUrl:
    "https://www.argentina.gob.ar/servicio/denunciar-incumplimientos-de-la-ley-de-proteccion-de-datos-personales",
  /** Mandatory text, Resolución AAIP 14/2018 art. 3 (replaced Disposición DNPDP 10/2008). Verbatim. */
  notice:
    "LA AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.",
} as const;

/**
 * Governing law and courts. A forum clause cannot bind a consumer: in Argentina a prorogation of
 * jurisdiction in a consumer contract "se tiene por no escrita" (CCyC art. 1109), in an
 * international consumer contract the consumer chooses the forum and "no se admite el acuerdo de
 * elección de foro" (CCyC art. 2654), and the law of the consumer's domicile governs when the
 * offer or advertising reached them there (CCyC art. 2655). Bahía Blanca is therefore stated as
 * the seller's domicile, one of the forums the consumer may choose, and as the agreed forum only
 * for buyers who do not act as consumers.
 */
export function jurisdictionClause(subject: string): string[] {
  return [
    `${subject} se rigen por las leyes de la ${seller.country}, sin perjuicio de las normas imperativas de protección al consumidor del país de tu domicilio que te resulten aplicables (art. 2655 del Código Civil y Comercial de la Nación).`,
    `Si actúas como consumidor, puedes iniciar acciones, a tu elección, ante los tribunales del lugar donde recibiste o debiste recibir el producto, del lugar de celebración del contrato, de tu domicilio o del domicilio del Titular —${seller.jurisdiction}—, o ante cualquier otro que la ley te habilite (arts. 1109 y 2654 del Código Civil y Comercial de la Nación). Toda acción del Titular contra un consumidor se interpondrá ante los tribunales del domicilio del consumidor. Esta cláusula no limita tu derecho a reclamar ante las autoridades administrativas de defensa del consumidor o de protección de datos personales.`,
    `Si no actúas como consumidor, las partes se someten a ${seller.jurisdiction}.`,
  ];
}

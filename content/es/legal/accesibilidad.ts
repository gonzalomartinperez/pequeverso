/**
 * Copy for /accesibilidad/ (accessibility statement). Every claim about verification names a check
 * that exists in `tests/browser`; nothing here asserts conformance. The review date comes from
 * `config/content-dates.ts`, the contact and answer time from the seller module (config/site.ts,
 * config/commerce.ts). The EAA paragraph is a neutral scope note for the owner or counsel to
 * confirm (PV-D8); it states no legal conclusion.
 */
import { pageReviewed } from "../../../config/content-dates.ts";
import { seller } from "./seller.ts";

/** "14 de noviembre de 2026" from the ISO review date (UTC, so the day never shifts). */
export function longDate(iso: string): string {
  return new Intl.DateTimeFormat("es-419", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

export const accesibilidadCopy = {
  meta: {
    title: "Declaración de accesibilidad",
    description:
      "Nuestro compromiso de accesibilidad (WCAG 2.2 nivel AA), cómo lo verificamos, las limitaciones conocidas y cómo avisarnos de una barrera.",
  },
  title: "Declaración de accesibilidad",
  intro:
    "Queremos que cualquier persona pueda leer, navegar y comprar en pequeverso.com. Aquí te contamos qué nos proponemos, cómo lo comprobamos y qué todavía no logramos.",
  reviewedAt: longDate(pageReviewed.accessibility),
  sections: [
    { id: "compromiso", title: "Nuestro compromiso" },
    { id: "verificacion", title: "Cómo lo verificamos" },
    { id: "limitaciones", title: "Limitaciones conocidas" },
    { id: "barreras", title: "Cómo avisarnos de una barrera" },
    { id: "eaa", title: "Normativa europea de accesibilidad" },
    { id: "revision", title: "Fecha de revisión" },
  ],
  commitment: [
    "Tomamos como meta las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.2, nivel AA: contraste de color suficiente, uso completo con teclado, foco visible, objetivos táctiles de al menos 24 píxeles, movimiento reducido para quien lo prefiere y alternativas de texto para las imágenes y los videos.",
    "Es una meta de trabajo, no una certificación: no declaramos que el sitio cumpla por completo con WCAG 2.2 AA.",
  ],
  verification: {
    lead: "Esto es lo que comprobamos de forma automática en cada cambio, con las pruebas que están en el repositorio público del sitio (carpeta tests/browser):",
    checks: [
      "Un análisis automático con axe (reglas WCAG 2.0, 2.1 y 2.2 de nivel A y AA, más buenas prácticas) en las páginas públicas, incluida esta. Cualquier fallo grave o crítico detiene la publicación.",
      "El orden del teclado: el enlace para saltar al contenido es lo primero que recibe el foco, y el foco es visible y no queda tapado por otros elementos.",
      "El texto ampliado al 200 %: ninguna página obliga a desplazarse de lado ni recorta el texto.",
      "El diseño adaptable entre 320 y 1920 píxeles de ancho, sin desbordes.",
      "Un solo título principal por página y los puntos de referencia de la página (encabezado, contenido principal y pie).",
      "El movimiento reducido: las animaciones respetan la preferencia del sistema.",
    ],
    manual:
      "Estas pruebas automáticas no sustituyen la revisión con personas y lectores de pantalla. Todavía no tenemos pruebas documentadas con lectores de pantalla, así que no afirmamos nada al respecto.",
  },
  limitations: [
    "El pago ocurre en la página de Hotmart y las ofertas posteriores a la compra se muestran en un cuadro de Hotmart, un servicio de terceros. Su contenido (por ejemplo, algunos enlaces dentro del cuadro de ofertas) no lo controlamos y puede no cumplir con las pautas; lo tenemos registrado como una excepción conocida y pendiente.",
    "Los materiales imprimibles se entregan como archivos PDF. Su accesibilidad es limitada: no los hemos verificado con lectores de pantalla ni garantizamos que estén etiquetados. Están pensados para imprimirse y trabajarse en papel con un adulto.",
  ],
  barriers: {
    lead: "Si encuentras una barrera de accesibilidad o necesitas un contenido en otro formato, escríbenos y trataremos de resolverlo. Cuéntanos qué página, qué dispositivo y qué tecnología de apoyo usas, si puedes.",
  },
  eaa: "El alcance de la Directiva (UE) 2019/882 (Acta Europea de Accesibilidad) para un negocio de este tamaño y para las ventas desde Argentina a la Unión Europea está en revisión. No hemos concluido si nos alcanza ni en qué medida. Este apartado es informativo, lo debe confirmar el titular, preferiblemente con asesoramiento profesional, y se actualizará con el resultado.",
  reviewLine: (date: string) =>
    `Última revisión de esta declaración: ${date}. Se vuelve a revisar cuando cambian el sitio o las pruebas que cita.`,
  contactEmail: seller.supportEmail,
  responseTime: seller.responseTime,
} as const;

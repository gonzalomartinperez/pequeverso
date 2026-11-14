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
  ],
  commitment: [
    "Tomamos como meta las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.2, nivel AA: contraste de color suficiente, uso completo con teclado, foco visible, objetivos táctiles de al menos 24 píxeles, movimiento reducido para quien lo prefiere y alternativas de texto para las imágenes y los videos.",
    "Es una meta de trabajo, no una certificación: no declaramos que el sitio cumpla por completo con WCAG 2.2 AA.",
  ],
  verification: {
    lead: "Esto es lo que comprobamos con pruebas automáticas que corren en cada cambio:",
    checks: [
      {
        strong: "Análisis automático con axe.",
        text: "Reglas WCAG 2.0, 2.1 y 2.2 de nivel A y AA, más buenas prácticas, en las páginas principales, las legales y esta. Un fallo grave o crítico detiene la publicación.",
      },
      {
        strong: "Teclado en la ruta de compra.",
        text: "En la página del producto, el enlace para saltar al contenido es lo primero que recibe el foco, el botón de compra se alcanza con el teclado y su foco es visible y no queda tapado.",
      },
      {
        strong: "Texto ampliado al 200 %.",
        text: "En las páginas principales y las legales, incluida esta, no hay desplazamiento lateral ni texto recortado.",
      },
      {
        strong: "Diseño adaptable.",
        text: "Entre 320 y 1920 píxeles de ancho, sin desbordes, en las páginas principales y en las legales.",
      },
      {
        strong: "Estructura de la página.",
        text: "En las páginas principales, un solo título principal y los puntos de referencia (encabezado, contenido principal y pie).",
      },
      {
        strong: "Movimiento reducido.",
        text: "Con esa preferencia activada, los elementos que aparecen al desplazarte se muestran de inmediato.",
      },
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
  eaa: "Todavía no hemos analizado el alcance de la Directiva (UE) 2019/882 (Acta Europea de Accesibilidad) para nuestro caso. Está pendiente de revisión con asesoramiento profesional; por ahora no sacamos ninguna conclusión. Si cambia, lo indicaremos aquí.",
  contactEmail: seller.supportEmail,
  responseTime: seller.responseTime,
} as const;

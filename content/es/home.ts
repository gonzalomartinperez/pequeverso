/**
 * Copy for the homepage, the hub of two products with the same weight from the hero to the close
 * (docs/specs/home-hub.md): Grafismo Fonético (our printable kit, reading) and the Guía de
 * Alimentación para Bebés (a third-party course recommended as a Hotmart affiliate, first meals).
 * Each chapter speaks from its family's need. Prices, counts, ages and the guarantee periods come
 * from the registry and config; copy only names what each product contains and how it is used.
 * No reviews, testimonials, results or health promises.
 * Headings with a gradient accent are split into `before` / `accent` / `after`.
 */
import { alimentacionBebe as course } from "../../config/affiliates.ts";
import { guaranteeDays } from "../../config/commerce.ts";
import { grafismoFonetico } from "../../src/products/grafismo-fonetico.ts";

/** "3 a 7 años" → "entre los 3 y los 7 años" (ages read from the registry and config). */
const between = (range: string): string => range.replace(/^(\d+) a (\d+) (.+)$/, "entre los $1 y los $2 $3");

export const homeCopy = {
  meta: {
    title: "Pequeverso | Recursos para acompañar cada etapa de tu familia",
    description:
      "Un pequeño universo para familias: Grafismo Fonético, el kit imprimible para aprender a leer por sílabas (3 a 7 años), y la Guía de Alimentación para Bebés que recomendamos para sus primeras comidas (6 a 12 meses).",
  },
  nav: [
    { href: "#leer", label: "Aprender a leer" },
    { href: "#bebe", label: "Empezar a comer" },
    { href: "#preguntas", label: "Preguntas" },
  ],
  /** Caption under AI-generated images where people are the subject. */
  illustrative: "Imagen ilustrativa.",
  illustrativePlural: "Imágenes ilustrativas.",
  hero: {
    kicker: "Recursos para familias",
    title: { before: "Un pequeño ", accent: "universo", after: " para cada etapa." },
    lead: "Un recurso claro para cada momento. Elige lo que tu familia necesita hoy.",
    doors: "¿Qué necesitas hoy?",
  },
  /** Facts shared by both products, right under the hero. */
  trust: {
    label: "Cómo compras en Pequeverso",
    items: [
      { icon: "shield", title: "Pago seguro por Hotmart", text: "Hotmart cobra y entrega los dos." },
      /** `days`: the title is preceded by the shared guarantee days from config ("7 días de garantía"). */
      { icon: "refresh", title: "días de garantía", text: "Pides el reembolso en Hotmart.", days: true },
      {
        icon: "download",
        title: "Acceso digital",
        text: "El acceso llega a tu correo al confirmar el pago.",
      },
      { icon: "globe", title: "Kit en tu moneda", text: "Grafismo Fonético se cobra en tu moneda local." },
    ],
  },
  /** Chapter 1: Grafismo Fonético, from the reading need. */
  reading: {
    kicker: "Para aprender a leer",
    title: { before: "Que aprenda a leer, ", accent: "sin presión", after: "." },
    pain: "Quieres acompañarlo con las letras, pero no sabes por dónde empezar y no quieres convertir la casa en un aula.",
    desire:
      "Grafismo Fonético te da una hoja por día y diez minutos: mira la sílaba, la dice, la traza y la une. A su ritmo, en la mesa de siempre.",
    benefitsLabel: "Qué te llevas",
    benefits: [
      "Sílabas grandes con imágenes que reconoce.",
      "Palabras punteadas para trazar con el dedo y el lápiz.",
      "Una guía para saber por dónde empezar.",
      "Imprimes solo la hoja del día, las veces que quieras.",
    ],
    kind: "Kit imprimible en PDF",
    units: { pdf: "PDF", pages: "páginas" },
    /** "Material principal + N bonos incluidos"; N comes from the registry. */
    bundle: { main: "Material principal", bonuses: "bonos incluidos" },
    priceSuffix: "pago único",
    /** Followed by the registry price: "Quiero el kit · US$14,99". */
    cta: "Quiero el kit",
    ctaNote: `Pago único · ${guaranteeDays} días de garantía · se cobra en tu moneda local`,
    secondary: "Ver qué incluye",
    proof: "Páginas reales del kit",
  },
  method: {
    kicker: "Cómo funciona · Grafismo Fonético",
    title: "Mira\u00a0· Di\u00a0· Traza\u00a0· Une",
    lead: "Cada página sigue la misma secuencia de cuatro gestos. Diez minutos y una sola hoja son suficientes para empezar.",
    steps: [
      { icon: "eye", title: "Mira", text: "La sílaba grande y su imagen." },
      { icon: "ear", title: "Di", text: "El sonido, en voz alta." },
      { icon: "pen", title: "Traza", text: "La palabra punteada, con dedo y lápiz." },
      { icon: "link", title: "Une", text: "Las sílabas, hasta la palabra completa." },
    ],
    playground: {
      title: "Pruébalo: une las sílabas",
      hint: "Toca las sílabas en orden y mira cómo se forma la palabra de la página.",
      doneLabel: "¡Palabra completa!",
      /** `page` is the index of the real worksheet in the registry's page list (0-based). */
      words: [
        { syllables: ["GA", "TO"], word: "gato", page: 17 },
        { syllables: ["PA", "TO"], word: "pato", page: 2 },
        { syllables: ["LU", "NA"], word: "luna", page: 6 },
      ],
    },
  },
  /**
   * Chapter 2: «Recomendado por Pequeverso», the third-party course from the first-meals need.
   * Product facts (name, stage, topics, guarantee, path) live in `config/affiliates.ts`; the
   * disclosure is mandatory and stays visible next to every link to the course.
   */
  affiliate: {
    kicker: "Recomendado por Pequeverso",
    title: { before: "Sus primeras comidas, ", accent: "sin miedo", after: " ni horas en la cocina." },
    pain: "Llega el momento de empezar a comer y aparecen las preguntas: cuándo, cuánto, qué preparar. Y el miedo a equivocarte.",
    desire:
      "Este curso ordena la alimentación complementaria paso a paso, con un menú para las primeras semanas y recetas que sirven para el bebé y para toda la familia.",
    topicsLabel: "Qué enseña el curso",
    kind: "Curso en video, en línea",
    /** Followed by the guarantee days from config: "Garantía de 7 días de Hotmart". */
    guaranteeBefore: "Garantía de",
    guaranteeAfter: "días de Hotmart",
    cta: "Ver la guía en Hotmart",
    ctaNote: `Garantía de ${course.guaranteeDays} días de Hotmart · pago y acceso en Hotmart`,
    secondary: "Ver cómo funciona",
    newTab: "(se abre en una pestaña nueva)",
    disclosure:
      "Recomendación con enlace de afiliado: si compras, Pequeverso recibe una comisión. El curso es de un tercero; Hotmart gestiona el pago, la entrega y los reembolsos.",
    disclosureLink: "Más información sobre los enlaces de afiliado",
    how: {
      kicker: "Cómo funciona · el curso",
      title: "Mira\u00a0· Organiza\u00a0· Cocina",
      lead: "Un curso en video para seguir a tu ritmo, desde el celular, la tableta o la computadora.",
      steps: [
        { icon: "play", title: "Mira", text: "Las clases en video, cuando tengas un rato." },
        { icon: "calendar", title: "Organiza", text: "Cuándo empezar, cantidades y frecuencias." },
        { icon: "utensils", title: "Cocina", text: "El menú de 4 semanas y recetas para todos." },
      ],
      menuTitle: "Un menú para las primeras 4 semanas",
      menuText: "El curso incluye un menú para las primeras 4 semanas de la alimentación complementaria.",
    },
  },
  faq: {
    kicker: "Preguntas frecuentes",
    title: { before: "Antes de ", accent: "elegir", after: "." },
    groups: {
      reading: "Sobre Grafismo Fonético",
      feeding: "Sobre la guía de alimentación",
      both: "Para elegir y pagar",
    },
    /** `about` groups the answers by product (the affiliate copy test scans `feeding`). */
    items: [
      {
        about: "both",
        q: "¿Cuál de los dos es para mi familia?",
        a: `Depende de la etapa. Si tu hijo tiene ${between(grafismoFonetico.composition.ageRange)} y quieres acompañarlo a leer por sílabas, Grafismo Fonético. Si tu bebé tiene ${between(course.stage)} y empieza a comer, la ${course.name}.`,
      },
      {
        about: "reading",
        q: "¿Cómo recibo Grafismo Fonético?",
        a: "Es 100% digital. Después del pago, Hotmart te envía el acceso por correo y puedes imprimir las hojas en casa, en una papelería o en un centro de impresión.",
      },
      {
        about: "reading",
        q: "¿Cuánto tiempo hay que dedicarle?",
        a: "Puedes empezar con unos 10 minutos y una sola hoja. No es una regla: acorta, repite o pausa según la respuesta del niño.",
      },
      {
        about: "feeding",
        q: "¿La guía de alimentación es de Pequeverso?",
        a: "No. Es un curso en video de un tercero que se vende en Hotmart. Pequeverso lo recomienda con un enlace de afiliado: si compras, recibimos una comisión.",
      },
      {
        about: "feeding",
        q: "¿El curso reemplaza la consulta con el pediatra?",
        a: "No. Es un curso para organizar la alimentación complementaria en casa. Ante cualquier duda sobre la alimentación de tu bebé, consulta con su pediatra.",
      },
      {
        about: "both",
        q: "¿Quién gestiona el pago, el acceso y los reembolsos?",
        a: `Hotmart, en los dos casos. Grafismo Fonético tiene ${guaranteeDays} días de garantía; la ${course.name} tiene la que fija su productor en Hotmart, hoy de ${course.guaranteeDays} días.`,
      },
      {
        about: "both",
        q: "¿Puedo pagar en mi moneda?",
        a: `Grafismo Fonético, sí: Hotmart convierte el importe a la moneda de tu país y te muestra el total final antes de confirmar. La ${course.name} la cobra su productor en Hotmart: el importe y los medios de pago se ven en su página de pago.`,
      },
    ],
  },
  closing: {
    kicker: "Para empezar hoy",
    title: { before: "Cada etapa tiene ", accent: "su pequeño universo", after: "." },
    text: "Elige lo que tu familia necesita hoy. Lo demás puede esperar.",
    readingCta: "Ver Grafismo Fonético",
    feedingCta: "Ver la guía en Hotmart",
  },
} as const;

/** A heading with one gradient phrase. */
export type AccentTitle = { before: string; accent: string; after: string };

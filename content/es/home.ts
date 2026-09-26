/**
 * Copy for the homepage (hub), laid out as a storefront: hero, featured product, benefits,
 * the collection inside the kit, real pages, how it works, what to expect and a close.
 * Brand-first, product-clear. Prices, counts and the guarantee period come from the registry
 * and config; copy only names what the material contains. No reviews or testimonials.
 * Headings with a gradient accent are split into `before` / `accent` / `after`.
 */
import { guaranteeDays } from "../../config/commerce.ts";

export const homeCopy = {
  meta: {
    title: "Pequeverso | Recursos imprimibles para aprender en familia",
    description:
      "Un pequeño universo de recursos imprimibles para niños de 3 a 7 años: letras, sonidos, sílabas, palabras y trazos listos para imprimir y practicar en casa, 10 minutos por día.",
  },
  nav: [
    { href: "#empieza", label: "Empieza por aquí" },
    { href: "#metodo", label: "Cómo lo usamos" },
    { href: "#valores", label: "Qué esperar" },
  ],
  /** Caption under AI-generated images where people using the material are the subject. */
  illustrative: "Imagen ilustrativa.",
  hero: {
    kicker: "Recursos imprimibles para familias",
    title: { before: "Un pequeño ", accent: "universo", after: " para aprender en familia." },
    lead: "Páginas reales, listas para imprimir, pensadas para niños de 3 a 7 años y para adultos que quieren saber por dónde empezar. Una hoja por día, diez minutos.",
    chips: [
      { icon: "eye", label: "Material real y visible" },
      { icon: "infinity", label: "Sin suscripciones" },
      { icon: "download", label: "Acceso digital inmediato" },
    ],
    cta: "Ver Grafismo Fonético",
    secondary: "Mirar páginas reales",
    /** Floating product tag over the hero visual. */
    tag: { kicker: "Disponible ahora", cta: "Ver el kit" },
  },
  featured: {
    kicker: "Empieza por aquí",
    title: { before: "El kit para ", accent: "empezar hoy", after: "." },
    lead: "Un solo producto, completo y ordenado: el material principal y sus bonos, en un único pago.",
    vendor: "Pequeverso",
    name: "Grafismo Fonético",
    promise: "Primeros pasos para reconocer letras, sonidos, sílabas y palabras, con trazos guiados.",
    /** Badges: "N PDF", "M páginas", age range; values come from the registry. */
    units: { pdf: "PDF", pages: "páginas" },
    digital: "Descarga digital",
    /** "Material principal + N bonos incluidos"; N comes from the registry. */
    bundle: { main: "Material principal", bonuses: "bonos incluidos" },
    priceKicker: "Kit completo · pago único",
    cta: "Ver producto",
    assurance: [
      { icon: "download", text: "Acceso digital inmediato" },
      { icon: "shield", text: "Pago seguro a través de Hotmart" },
      { icon: "refresh", text: `${guaranteeDays} días para pedir reembolso` },
    ],
  },
  benefits: {
    label: "Por qué comprar en Pequeverso",
    items: [
      {
        icon: "download",
        title: "Entrega digital inmediata",
        text: "Recibes el acceso apenas se confirma el pago.",
      },
      { icon: "shield", title: "Pago seguro", text: "Procesado por Hotmart, en tu moneda local." },
      {
        icon: "refresh",
        title: `Garantía de ${guaranteeDays} días`,
        text: "Si no es para ti, pides el reembolso en Hotmart.",
      },
      {
        icon: "printer",
        title: "Imprime las veces que quieras",
        text: "Repite la hoja del día cuando la necesites.",
      },
    ],
  },
  collection: {
    kicker: "Qué incluye",
    title: { before: "Todo lo que ", accent: "trae el kit", after: "." },
    lead: "El material principal es por donde se empieza; los bonos varían el formato de la práctica. Todo llega junto y no se pagan aparte.",
    principal: {
      label: "Material principal",
      points: [
        "Sílabas grandes con una imagen reconocible",
        "Palabras punteadas para trazar",
        "Actividades listas para imprimir",
      ],
    },
    included: "Incluido",
  },
  lifestyle: {
    kicker: "Así se ve en casa",
    title: { before: "Una hoja por día, ", accent: "en la mesa de siempre", after: "." },
    text: "Imprimes la página del día, se sientan juntos y practican diez minutos: mirar, decir, trazar y unir.",
    points: [
      { icon: "files", label: "Una hoja" },
      { icon: "clock", label: "Diez minutos" },
      { icon: "heart", label: "Juntos" },
    ],
  },
  preview: {
    kicker: "Mira lo que encontrarás dentro",
    title: { before: "Páginas ", accent: "reales", after: ", no maquetas." },
    lead: "Tres hojas del PDF principal tal como las vas a imprimir. Gira cada tarjeta para ver otra página.",
    flip: { show: "Ver otra página", hide: "Volver a la primera" },
    wall: "Más páginas reales del PDF principal",
    cta: "Ver todas las páginas reales",
  },
  method: {
    kicker: "Cómo funciona",
    title: "Mira · Di · Traza · Une",
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
  values: {
    kicker: "Menos dudas antes de comenzar",
    title: { before: "Lo que puedes ", accent: "esperar", after: " de Pequeverso." },
    items: [
      {
        icon: "eye",
        title: "Contenido real y visible",
        text: "Mostramos páginas reales, cantidades exactas y usos concretos. Sin promesas de resultados.",
      },
      {
        icon: "clock",
        title: "Práctica breve",
        text: "Materiales pensados para 10 minutos por día, no para convertir la casa en un aula.",
      },
      {
        icon: "shield",
        title: "Compra clara",
        text: `Pago único a través de Hotmart, acceso inmediato y ${guaranteeDays} días para pedir reembolso.`,
      },
    ],
    facts: {
      title: "El kit, en números",
      pdf: "archivos PDF",
      pages: "páginas para imprimir",
      age: "años",
      minutes: "minutos por día",
    },
  },
  closing: {
    kicker: "Para empezar hoy",
    title: { before: "Elige una hoja. Imprímela. ", accent: "Practica diez minutos.", after: "" },
    /** Followed by "N PDF y M páginas" from the registry. */
    text: "Grafismo Fonético reúne",
    textAfter: "para acompañar sus primeros pasos hacia la lectura.",
    cta: "Ver Grafismo Fonético",
    priceSuffix: "pago único",
    social: "Síguenos: ideas y páginas nuevas cada semana en @somospequeverso",
  },
} as const;

/** A heading with one gradient phrase. */
export type AccentTitle = { before: string; accent: string; after: string };

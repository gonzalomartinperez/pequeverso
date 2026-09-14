/**
 * Copy for /grafismo-fonetico/. One canonical neutral-Spanish version (no runtime overwrite).
 * Claims are limited to what the material contains; see docs/content-model.md for sources.
 * Business facts (prices, counts, media) live in src/products/grafismo-fonetico.ts; the
 * guarantee period comes from config/commerce.ts.
 */
import { guaranteeDays } from "../../../../config/commerce.ts";
import type { CoreLandingCopy } from "../index.ts";
import { grafismoFaq } from "./faq.ts";

const guarantee = `${guaranteeDays} días de garantía en Hotmart`;

export const grafismoCopy = {
  subtitle: "Kit imprimible paso a paso",
  topbar: ["9 PDF imprimibles", "414 páginas", "Acceso digital inmediato"],
  nav: [
    { href: "#metodo", label: "Cómo funciona" },
    { href: "#paginas", label: "Páginas reales" },
    { href: "#incluye", label: "Qué incluye" },
    { href: "#preguntas", label: "Preguntas" },
  ],
  hero: {
    kicker: "Kit imprimible · 3 a 7 años · 9 PDF",
    title: "De las letras a las primeras palabras, un paso por día.",
    lead: "Grafismo Fonético reúne 9 PDF y 414 páginas con sílabas grandes, imágenes reconocibles y palabras para trazar. Eliges una hoja, la imprimes y practican 10 minutos: mira, di, traza y une.",
    facts: [
      { icon: "files", label: "9 PDF", detail: "414 páginas en total" },
      { icon: "printer", label: "Imprimible", detail: "En casa o en una papelería" },
      { icon: "child", label: "3 a 7 años", detail: "Orientativo, según cada niño" },
    ],
    ages: {
      legend: "¿Qué edad tiene?",
      defaultId: "5",
      items: [
        {
          id: "3-4",
          label: "3–4",
          hint: "Empieza por las páginas de sonidos y trazo guiado: hojas cortas, una por día.",
        },
        { id: "5", label: "5", hint: "Sílabas grandes con imagen y la primera palabra para unir." },
        { id: "6-7", label: "6–7", hint: "Palabras completas, tarjetas y juegos para repasar." },
      ],
    },
    cta: "Quiero el kit completo",
    ctaNote: `Pago único · Acceso digital inmediato · ${guarantee}`,
    assurance: { payment: "Pago único", access: "Acceso digital inmediato", guarantee },
    priceKicker: "Kit completo",
    taxNote: "+ impuestos aplicables según el país",
    currencyNote: "Hotmart muestra el total en tu moneda local antes de pagar.",
  },
  trust: [
    { icon: "shield", text: "Pago seguro a través de Hotmart" },
    { icon: "download", text: "Descarga inmediata tras la aprobación" },
    { icon: "refresh", text: `${guaranteeDays} días para pedir reembolso` },
    { icon: "infinity", text: "Imprime las veces que quieras" },
  ],
  problem: {
    kicker: "Para adultos que acompañan",
    title: "Acompañar sus primeros pasos hacia la lectura no debería obligarte a improvisar cada día.",
    paragraphs: [
      "Muchas familias quieren practicar en casa, pero no saben por dónde empezar, cuánto tiempo dedicar ni qué hoja elegir. Terminan buscando fichas sueltas que no siguen ningún orden.",
      "Grafismo Fonético organiza la práctica: cada página muestra una sílaba grande, una imagen reconocible y una palabra para trazar. Tú eliges una hoja; el material hace el resto.",
    ],
    bullets: [
      "Páginas ordenadas de lo simple a lo compuesto: sonidos, sílabas y palabras.",
      "Una guía breve para saber qué hoja usar hoy y cómo acompañar sin presionar.",
      "Formatos variados (tarjetas, juegos, pósteres, reto de 21 días) para que no se vuelva rutina.",
    ],
  },
  method: {
    kicker: "Cómo funciona",
    title: "Del sonido a la palabra, en cuatro gestos.",
    lead: "Cada página sigue la misma secuencia para que el niño la reconozca y la haga suya.",
    steps: [
      { icon: "eye", title: "Mira", text: "Observa la sílaba grande y la imagen que la acompaña." },
      { icon: "ear", title: "Di", text: "Pronuncia el sonido en voz alta, primero contigo y luego solo." },
      { icon: "pen", title: "Traza", text: "Sigue la palabra punteada con el dedo y después con el lápiz." },
      { icon: "link", title: "Une", text: "Junta las sílabas y descubre la palabra completa." },
    ],
  },
  pages: {
    kicker: "Páginas reales del kit",
    title: "Así se ven las hojas que vas a imprimir.",
    lead: "Veinte páginas reales del PDF principal. Sin maquetas: lo que ves es lo que descargas.",
    zoomHint: "Toca una página para verla en grande.",
    galleryLabel: "Páginas reales del kit",
  },
  included: {
    kicker: "Qué recibes",
    title: "Nueve PDF que se complementan.",
    lead: "Un material central y ocho recursos para variar el formato de la práctica: guía, tarjetas, reto, animales, juegos, sonidos del hogar, pósteres y páginas sobre el nombre y la familia.",
    total: "9 PDF · 414 páginas en A4 · Acceso digital",
    units: { pdf: "PDF", pages: "páginas" },
  },
  midOffer: {
    title: "Todo el kit, por un solo pago.",
    text: "Recibes los 9 PDF juntos. Imprimes lo que necesites, cuando lo necesites, y vuelves a usarlos con cada niño.",
    cta: "Quiero el kit completo",
  },
  offer: {
    kicker: "Oferta",
    currencyNote: "Hotmart muestra el total en tu moneda antes de pagar.",
    checks: [
      "9 PDF · 414 páginas en A4",
      "Guía para saber qué hoja usar cada día",
      "Tarjetas, juegos, pósteres y reto de 21 días",
      `Acceso inmediato y ${guarantee}`,
    ],
  },
  videos: {
    kicker: "En movimiento",
    title: "Así se practica una página.",
    lead: "Cuatro demostraciones breves con hojas reales del kit. Pulsa para reproducir.",
  },
  credibility: {
    kicker: "Enfoque",
    title: "Práctica fonética visual, adaptada al español.",
    text: "Tableros horizontales, sílabas grandes, una tarjeta de color por sonido y una palabra punteada para trazar. Un formato claro, inspirado en materiales de práctica fonética y pensado para las sílabas del español.",
    points: [
      "Sílabas del español, no traducciones.",
      "Imágenes reconocibles para cada palabra.",
      "Trazo guiado antes del trazo libre.",
    ],
  },
  benefits: {
    kicker: "Qué cambia en casa",
    title: "Menos búsqueda, más práctica.",
    items: [
      {
        icon: "clock",
        title: "10 minutos alcanzan",
        text: "Una hoja por día es suficiente para sostener el hábito.",
      },
      {
        icon: "folder",
        title: "Todo en orden",
        text: "Sabes qué sigue sin planificar ni buscar fichas sueltas.",
      },
      {
        icon: "sparkles",
        title: "Formatos que cambian",
        text: "Tarjetas, bingo, dominó, pósteres: el repaso no se vuelve monótono.",
      },
      {
        icon: "heart",
        title: "A su ritmo",
        text: "Puedes repetir, acortar o pausar. El material acompaña; no exige.",
      },
    ],
    callout: "El objetivo no es acelerar al niño, sino darte un material claro para acompañarlo.",
  },
  audience: {
    kicker: "Para quién es",
    title: "Antes de comprar, revisa si encaja con tu casa.",
    yes: {
      title: "Es para ti si…",
      items: [
        "Acompañas a un niño de 3 a 7 años que empieza con letras y sonidos.",
        "Prefieres un material ordenado antes que fichas sueltas.",
        "Puedes imprimir en casa o en una papelería.",
      ],
    },
    no: {
      title: "No es para ti si…",
      items: [
        "Buscas un método que prometa resultados en un plazo.",
        "Prefieres pantallas o una app en lugar de papel y lápiz.",
        "Tu hijo ya lee con fluidez y buscas comprensión lectora.",
      ],
    },
  },
  creator: {
    enabled: false,
    kicker: "Nota de quien hizo el kit",
    title: "",
    paragraphs: [],
    signature: "",
  },
  faq: {
    kicker: "Preguntas frecuentes",
    title: "Menos dudas antes de comenzar.",
    items: grafismoFaq,
    supportNote: "¿Otra duda? Escríbenos y te respondemos con calma.",
  },
  finalOffer: {
    kicker: "Listo para imprimir",
    title: "Empieza hoy con una sola hoja.",
    checks: [
      "9 PDF · 414 páginas en A4",
      "Guía para saber qué hoja usar cada día",
      "Tarjetas, juegos, pósteres y reto de 21 días",
      `Acceso inmediato y ${guarantee}`,
    ],
    cta: "Quiero el kit completo",
    note: "Serás dirigido a la página de pago segura de Hotmart.",
  },
  sticky: { label: "Kit completo", cta: "Quiero el kit" },
} as const satisfies CoreLandingCopy;

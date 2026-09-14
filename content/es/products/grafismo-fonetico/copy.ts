/**
 * Copy for /grafismo-fonetico/. One canonical neutral-Spanish version (no runtime overwrite).
 * Claims are limited to what the material contains; see docs/content-model.md for sources.
 * Business facts (prices, counts, media) live in src/products/grafismo-fonetico.ts.
 */
import type { CoreLandingCopy } from "../index.ts";
import { grafismoFaq } from "./faq.ts";

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
    kicker: "Kit imprimible · 3 a 7 años",
    title: "Un kit imprimible para ayudarlo a dar sus primeros pasos hacia la lectura.",
    lead: "Grafismo Fonético reúne más de 400 páginas con sílabas grandes, imágenes reconocibles y palabras para trazar. Elige una hoja, imprímela y practica 10 minutos: mira, di, traza y une.",
    facts: [
      { icon: "files", label: "9 PDF", detail: "414 páginas en total" },
      { icon: "printer", label: "Imprimible", detail: "En casa o en una papelería" },
      { icon: "child", label: "3 a 7 años", detail: "Orientativo, según cada niño" },
    ],
    cta: "Quiero el kit completo",
    ctaNote: "Pago único · Acceso digital inmediato · 7 días de garantía en Hotmart",
    priceKicker: "Kit completo",
    taxNote: "+ impuestos aplicables según el país",
    currencyNote: "Hotmart muestra el total en tu moneda local antes de pagar.",
  },
  trust: [
    { icon: "shield", text: "Pago seguro a través de Hotmart" },
    { icon: "download", text: "Descarga inmediata tras la aprobación" },
    { icon: "refresh", text: "7 días para pedir reembolso" },
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
    kicker: "Qué incluye",
    title: "Nueve PDF que se complementan.",
    lead: "Un material central y ocho recursos para variar el formato de la práctica: guía, tarjetas, reto, animales, juegos, sonidos del hogar, pósteres y páginas sobre el nombre y la familia.",
    total: "9 PDF · 414 páginas en A4 · Acceso digital",
  },
  midOffer: {
    title: "Todo esto, por un solo pago.",
    text: "Recibes los 9 PDF juntos. Imprimes lo que necesites, cuando lo necesites, y vuelves a usarlos con cada niño.",
    cta: "Quiero el kit completo",
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
      "Acceso inmediato y 7 días de garantía en Hotmart",
    ],
    cta: "Quiero el kit completo",
    note: "Serás dirigido a la página de pago segura de Hotmart.",
  },
  sticky: { label: "Kit completo", cta: "Quiero el kit" },
} as const satisfies CoreLandingCopy;

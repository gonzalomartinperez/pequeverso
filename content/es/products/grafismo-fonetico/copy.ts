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
    kicker: "Pequeverso · Kit imprimible",
    title: "Kit Grafismo Fonético",
    lead: "Eliges una hoja, la imprimes y practican 10 minutos juntos: mira, di, traza y une. Sílabas grandes, imágenes reconocibles y palabras para trazar, ordenadas de lo simple a lo compuesto.",
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
    secondary: { label: "Ver las páginas reales", href: "#paginas" },
    pdp: {
      breadcrumb: { home: "Inicio", label: "Grafismo Fonético" },
      tagline: "De las letras a las primeras palabras, un paso por día.",
      taglineAccent: "primeras palabras",
      badges: [
        { icon: "files", text: "PDF", fact: "pdf" },
        { icon: "book", text: "páginas", fact: "pages" },
        { icon: "child", text: "", fact: "ages" },
        { icon: "download", text: "Descarga inmediata" },
      ],
      priceTag: "Pago único",
      galleryLabel: "Imágenes del kit",
      galleryItem: "Ver imagen",
      slides: [
        "El kit con hojas reales para cada edad",
        "Práctica en casa con el kit (imagen ilustrativa)",
        "El kit completo con sus bonos",
        "Página real: GATO",
        "Portada y páginas en abanico",
        "Descargas e imprimes en casa (imagen ilustrativa)",
        "Página real: LUNA",
        "El PDF en la tableta, listo para imprimir",
      ],
      featuredLabel: "Hoja para {age} años",
      details: {
        includes: "Qué incluye",
        usage: {
          title: "Cómo se usa",
          text: "Eliges una hoja por día y la practican unos 10 minutos: mira la sílaba y su imagen, di el sonido en voz alta, traza la palabra punteada y une las sílabas. La guía incluida te ayuda a elegir por dónde empezar.",
        },
        format: {
          title: "Formato e impresión",
          text: "Archivos PDF en tamaño A4 para imprimir en casa, en una papelería o en un centro de impresión, las veces que quieras. No es un producto físico: recibes el acceso por correo tras la aprobación del pago.",
        },
        guarantee: {
          title: "Garantía",
          text: `Tienes ${guaranteeDays} días desde la compra para pedir el reembolso a través de Hotmart, según las condiciones informadas en la página de pago.`,
        },
      },
    },
  },
  illustrativeImage: "Imagen ilustrativa.",
  facts: {
    label: "Datos del kit",
    items: [
      { icon: "files", text: "PDF imprimibles", fact: "pdf" },
      { icon: "book", text: "páginas en A4", fact: "pages" },
      { icon: "clock", text: "10 minutos por día" },
      { icon: "child", text: "", fact: "ages" },
      { icon: "printer", text: "Imprime las veces que quieras" },
      { icon: "sparkles", text: "Mira · Di · Traza · Une" },
      { icon: "download", text: "Acceso digital inmediato" },
    ],
  },
  playground: {
    kicker: "Pruébalo aquí",
    title: "Toca las sílabas en orden y forma la palabra.",
    hint: "Así funciona cada página del kit: primero la sílaba, después la palabra.",
    doneLabel: "¡Palabra completa!",
    words: [
      { syllables: ["GA", "TO"], word: "gato", page: 18 },
      { syllables: ["MA", "PA"], word: "mapa", page: 1 },
      { syllables: ["LU", "NA"], word: "luna", page: 7 },
      { syllables: ["PE", "RRO"], word: "perro", page: 19 },
    ],
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
    titleAccent: "improvisar",
    paragraphs: [
      "Muchas familias quieren practicar en casa, pero no saben por dónde empezar, cuánto tiempo dedicar ni qué hoja elegir. Terminan buscando fichas sueltas que no siguen ningún orden.",
      "Grafismo Fonético organiza la práctica: cada página muestra una sílaba grande, una imagen reconocible y una palabra para trazar. Tú eliges una hoja; el material hace el resto.",
    ],
    bullets: [
      "Páginas ordenadas de lo simple a lo compuesto: sonidos, sílabas y palabras.",
      "Una guía breve para saber qué hoja usar hoy y cómo acompañar sin presionar.",
      "Formatos variados (tarjetas, juegos, pósteres, reto de 21 días) para que no se vuelva rutina.",
    ],
    note: { title: "10 minutos", text: "alcanzan para sostener el hábito" },
  },
  method: {
    kicker: "Cómo funciona",
    title: "Del sonido a la palabra, en cuatro gestos.",
    titleAccent: "cuatro gestos",
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
    titleAccent: "vas a imprimir",
    lead: "Veinte páginas reales del PDF principal. Sin maquetas: lo que ves es lo que descargas.",
    zoomHint: "Toca una página para verla en grande.",
    galleryLabel: "Páginas reales del kit",
    itemLabel: "Página real",
    zoomTitle: "Página real del kit",
    wallLabel: "Muestra de páginas reales del kit",
  },
  included: {
    kicker: "Todo lo que incluye",
    title: "El material principal y sus bonos, todo en el mismo kit.",
    titleAccent: "sus bonos",
    lead: "Grafismo Fonético Paso a Paso es el material principal. Los bonos varían el formato de la práctica: guía, tarjetas, reto, animales, juegos, sonidos del hogar, pósteres y páginas sobre el nombre y la familia. Vienen incluidos: no se pagan aparte.",
    total: "9 PDF · 414 páginas en A4 · Acceso digital",
    units: { pdf: "PDF", pages: "páginas" },
    bundle: {
      main: "Material principal",
      bonus: "Bono",
      included: "incluido",
      bonuses: "bonos incluidos",
      allIncluded: "Todo incluido en un único pago de",
    },
    tiles: {
      kitTitle: "Todo en una sola descarga",
      kitText:
        "El material principal y los bonos llegan juntos. Imprimes lo que necesites, cuando lo necesites.",
      priceKicker: "Todo incluido",
      priceNote: "un único pago",
      priceLink: "Ver la oferta",
    },
  },
  midOffer: {
    title: "Todo el kit, por un solo pago.",
    text: "El material principal y los ocho bonos llegan juntos, en un único pago. Imprimes lo que necesites, cuando lo necesites, y vuelves a usarlos con cada niño.",
    cta: "Quiero el kit completo",
  },
  offer: {
    kicker: "Oferta",
    checks: [
      "9 PDF · 414 páginas en A4",
      "Guía para saber qué hoja usar cada día",
      "Tarjetas, juegos, pósteres y reto de 21 días",
      `Acceso inmediato y ${guarantee}`,
    ],
  },
  videos: {
    kicker: "Videos ilustrativos",
    title: "Así se ve la práctica en casa.",
    titleAccent: "en casa",
    lead: "Cuatro videos breves ilustran cómo se acompaña una hoja: mira, di, traza y une. No son grabaciones del producto; las páginas reales del kit están en la sección siguiente. Pulsa para reproducir.",
    illustrative: "Video ilustrativo",
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
    titleAccent: "más práctica",
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
    titleAccent: "encaja con tu casa",
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
    titleAccent: "antes de comenzar",
    items: grafismoFaq,
    supportNote: "¿Otra duda? Escríbenos y te respondemos con calma.",
  },
  finalOffer: {
    kicker: "Listo para imprimir",
    title: "Empieza hoy con una sola hoja.",
    titleAccent: "una sola hoja",
    priceNote: "pago único",
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

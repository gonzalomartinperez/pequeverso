/**
 * Copy for /imprime-y-juega/ — the optional post-purchase offer. Both views (upsell and
 * downsell) are rendered; the Hotmart sales-funnel widget is the only decision control.
 * Business facts (prices, counts, media) live in src/products/imprime-y-juega.ts.
 */
import type { OfferLandingCopy } from "../index.ts";
import { packFaq } from "./faq.ts";

export const packCopy = {
  topbar: "Tu compra principal está confirmada · Esta oferta es opcional",
  header: { subtitle: "Pack Imprime y Juega", cta: "Ver opciones Sí / No" },
  facts: [{ label: "3 a 7 años", detail: "orientativo" }],
  counters: { pdf: "PDF", pages: "páginas", resources: "recursos" },
  taxNote: "+ impuestos aplicables según el país",
  upsell: {
    kicker: "Oferta opcional · tu compra principal ya está confirmada",
    title: "Ya tienes letras y sonidos. Ahora suma actividades listas para tardes, esperas y viajes.",
    lead: "El Pack Imprime y Juega no repite Grafismo Fonético: amplía las opciones con propuestas para colorear, observar, contar, recortar, dibujar y jugar.",
    priceKicker: "Precio de esta oferta",
    decisionHint: "Elige Sí para sumar el pack a tu compra o No para continuar solo con Grafismo Fonético.",
  },
  downsell: {
    kicker: "Oferta final de este paso",
    title: "Antes de terminar: el mismo pack completo por menos.",
    lead: "Mismo contenido, mismos 6 PDF y 384 páginas. En este paso el precio es menor y tu compra principal no cambia.",
    priceKicker: "Precio final de este paso",
    previousLabel: "Oferta anterior",
    proof: "Mismo contenido: 6 PDF · 384 páginas · 9 recursos",
    objections: [
      {
        title: "“No quería gastar tanto.”",
        text: "Por eso este paso baja el precio sin recortar el contenido.",
      },
      {
        title: "“No voy a imprimir 384 páginas.”",
        text: "No hace falta. Imprimes una actividad cuando la necesitas; el resto queda guardado.",
      },
      {
        title: "“Tal vez repite lo que compré.”",
        text: "No. Grafismo Fonético trabaja letras y sílabas; este pack trabaja juego, observación, valores y creatividad.",
      },
    ],
    decisionHint: "Elige Sí para agregar el pack a este precio o No para terminar tu compra.",
  },
  complement: {
    kicker: "Dos materiales, dos momentos distintos",
    title: "Complementa, no repite.",
    ownedLabel: "Ya es tuyo",
    offerLabel: "Esta oferta",
    owned: {
      title: "Grafismo Fonético (ya es tuyo)",
      points: ["Letras y sonidos", "Sílabas y palabras", "Trazos guiados"],
    },
    offer: {
      title: "Pack Imprime y Juega (esta oferta)",
      points: [
        "Tardes en casa y viajes",
        "Observar, contar, recortar, colorear",
        "Valores, creatividad y juego",
      ],
    },
  },
  included: {
    kicker: "Qué incluye",
    title: "Nueve recursos en seis PDF.",
    lead: "Kit Tardes Tranquilas incorpora tres bonos internos (guía rápida, reconocimientos y checklist) y se completa con cinco packs temáticos.",
    total: "6 PDF · 384 páginas · 9 recursos visibles",
  },
  pages: {
    kicker: "Páginas reales",
    title: "Doce páginas tal como se imprimen.",
    lead: "Actividades reales de los distintos packs, sin maquetas.",
    galleryLabel: "Páginas reales del pack",
  },
  moments: {
    kicker: "Para qué momentos",
    title: "Una actividad lista cuando la necesitas.",
    items: [
      { icon: "home", title: "Tardes en casa", text: "Colorear, observar y recortar sin pantallas." },
      { icon: "car", title: "Viajes y esperas", text: "Aventuras para llevar en el bolso." },
      { icon: "calendar", title: "Un día a la vez", text: "30 propuestas breves con 12 comodines." },
      { icon: "heart", title: "Valores en familia", text: "Cuentos y tarjetas de conversación." },
    ],
  },
  faq: {
    kicker: "Preguntas frecuentes",
    title: "Antes de decidir.",
    items: packFaq,
  },
  close: {
    kicker: "Tu decisión",
    title: "Sumar el pack o continuar: las dos opciones están bien.",
    text: "Las opciones Sí y No las muestra Hotmart dentro de esta página. Tu compra principal ya está confirmada pase lo que pase.",
    cta: "Ir a las opciones Sí / No",
  },
  decision: {
    upsell: {
      kicker: "Confirma tu decisión",
      title: "¿Quieres sumar el Pack Imprime y Juega?",
      text: "Hotmart procesará tu respuesta y te llevará automáticamente al siguiente paso.",
    },
    downsell: {
      kicker: "Última decisión de este paso",
      title: "¿Agregas el pack completo por menos?",
      text: "Elige Sí o No. Hotmart procesará tu respuesta y te llevará automáticamente al siguiente paso.",
    },
  },
  widget: {
    loading: "Cargando las opciones de Hotmart…",
    fallbackTitle: "No pudimos cargar las opciones de Hotmart.",
    fallbackText:
      "Tu compra principal ya está confirmada. Puedes recargar esta página para volver a intentarlo o cerrar la ventana y revisar tu correo para acceder a Grafismo Fonético.",
    reload: "Recargar la página",
  },
  sticky: { upsell: "Sumar el pack", downsell: "Agregar por menos" },
} as const satisfies OfferLandingCopy;

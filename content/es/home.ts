/**
 * Copy for the homepage (hub). Brand-first, product-clear. Prices, counts and the guarantee
 * period come from the registry and config; copy only names what the material contains.
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
  hero: {
    kicker: "Recursos imprimibles para familias",
    title: "Un pequeño universo para aprender en familia, una hoja por día.",
    lead: "Páginas reales, listas para imprimir, pensadas para niños de 3 a 7 años y para adultos que quieren saber por dónde empezar.",
    chips: [
      { icon: "eye", label: "Material real y visible" },
      { icon: "infinity", label: "Sin suscripciones" },
      { icon: "download", label: "Acceso digital inmediato" },
    ],
    cta: "Ver Grafismo Fonético",
  },
  product: {
    kicker: "Disponible ahora · 3 a 7 años",
    title: "Grafismo Fonético",
    promise: "Primeros pasos para reconocer letras, sonidos, sílabas y palabras, con trazos guiados.",
    facts: ["9 PDF", "414 páginas", "Acceso digital"],
    priceKicker: "Kit completo · pago único",
    cta: "Ver Grafismo Fonético",
    assurance: [
      { icon: "shield", text: "Pago seguro a través de Hotmart" },
      { icon: "refresh", text: `${guaranteeDays} días para pedir reembolso` },
    ],
  },
  start: {
    kicker: "Empieza por aquí",
    title: "Un material principal y un complemento opcional.",
    lead: "Cada recurso tiene un papel claro. Así sabes qué comprar primero y qué sumar después, si tiene sentido para tu familia.",
    principal: {
      label: "Producto principal",
      title: "Grafismo Fonético",
      text: "Letras, sonidos, sílabas, palabras y trazos. Es el material con el que se empieza.",
      points: [
        "Sílabas grandes y palabras para trazar",
        "Guía de 10 minutos para acompañar",
        "Tarjetas, juegos, pósteres y reto de 21 días",
      ],
      cta: "Ver el kit completo",
    },
    complement: {
      label: "Complemento opcional",
      title: "Pack Imprime y Juega",
      text: "Actividades para tardes tranquilas, viajes, esperas y momentos creativos. Se ofrece como opción después de comprar el kit principal.",
      points: [
        "6 PDF · 384 páginas · 9 recursos",
        "Colorear, observar, contar, recortar, jugar",
        "No repite el material de Grafismo Fonético",
      ],
    },
  },
  preview: {
    kicker: "Mira lo que encontrarás dentro",
    title: "Páginas reales, no maquetas.",
    lead: "Tres hojas del PDF principal tal como las vas a imprimir. Gira cada tarjeta para ver otra página.",
    flip: { show: "Ver otra página", hide: "Volver a la primera" },
    cta: "Ver todas las páginas reales",
  },
  method: {
    kicker: "Cómo lo usamos",
    title: "Mira · Di · Traza · Une",
    lead: "Cada página sigue la misma secuencia de cuatro gestos. Diez minutos y una sola hoja son suficientes para empezar.",
    steps: [
      { icon: "eye", title: "Mira", text: "La sílaba grande y su imagen." },
      { icon: "ear", title: "Di", text: "El sonido, en voz alta." },
      { icon: "pen", title: "Traza", text: "La palabra punteada, con dedo y lápiz." },
      { icon: "link", title: "Une", text: "Las sílabas, hasta la palabra completa." },
    ],
  },
  values: {
    kicker: "Menos dudas antes de comenzar",
    title: "Lo que puedes esperar de Pequeverso.",
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
  },
  closing: {
    kicker: "Para empezar hoy",
    title: "Elige una hoja. Imprímela. Practica diez minutos.",
    text: "Grafismo Fonético reúne 9 PDF y 414 páginas para acompañar sus primeros pasos hacia la lectura.",
    cta: "Ver Grafismo Fonético",
    priceSuffix: "pago único",
    social: "Síguenos: ideas y páginas nuevas cada semana en @somospequeverso",
  },
} as const;

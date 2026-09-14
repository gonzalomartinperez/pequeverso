/**
 * The nine visible resources of Pack Imprime y Juega delivered as six PDFs (source: Hotmart upload
 * manifest 2026-07-26 and the published offer page, read 2026-09-12). Page counts sum to 384; the
 * three embedded bonuses live inside Kit Tardes Tranquilas.
 */
import type { Resource } from "../index.ts";

export const packResources: Resource[] = [
  {
    id: "tardes-tranquilas",
    card: "pack.card.01",
    title: "Kit Tardes Tranquilas",
    pages: 84,
    pagesLabel: "84 páginas",
    description: "Más de 65 actividades para colorear, observar, contar, recortar, dibujar y jugar en casa.",
  },
  {
    id: "que-imprimo-hoy",
    card: "pack.card.02",
    title: "¿Qué Imprimo Hoy?",
    pages: null,
    pagesLabel: "Incluido en el kit",
    description: "Una guía rápida para elegir según la edad, el momento del día y el tiempo disponible.",
    embedded: true,
  },
  {
    id: "pequenos-logros",
    card: "pack.card.03",
    title: "Pequeños Logros, Grandes Sonrisas",
    pages: null,
    pagesLabel: "Incluido en el kit",
    description: "Tarjetas, medallas y certificados para reconocer el esfuerzo y celebrar cada intento.",
    embedded: true,
  },
  {
    id: "listos-para-jugar",
    card: "pack.card.04",
    title: "Listos para Jugar",
    pages: null,
    pagesLabel: "Incluido en el kit",
    description: "Checklist y un sistema sencillo para preparar el material y comenzar sin vueltas.",
    embedded: true,
  },
  {
    id: "aventuras-para-llevar",
    card: "pack.card.05",
    title: "Aventuras para Llevar",
    pages: 60,
    pagesLabel: "60 páginas",
    description:
      "Más de 50 actividades para viajes, restaurantes, salas de espera y otros momentos fuera de casa.",
  },
  {
    id: "30-dias",
    card: "pack.card.06",
    title: "30 Días para Jugar Juntos",
    pages: 60,
    pagesLabel: "60 páginas",
    description:
      "Una mini actividad por día, con 30 propuestas y 12 comodines para mantener la flexibilidad.",
  },
  {
    id: "letras-en-juego",
    card: "pack.card.07",
    title: "Letras en Juego",
    pages: 60,
    pagesLabel: "60 páginas",
    description: "21 letras, sonidos, rimas, primeras palabras, tarjetas y memoria recortable.",
  },
  {
    id: "valores",
    card: "pack.card.08",
    title: "Valores que Crecen en Casa",
    pages: 60,
    pagesLabel: "60 páginas",
    description:
      "Cuentos, actividades para colorear y tarjetas de conversación sobre diez valores cotidianos.",
  },
  {
    id: "mira-busca-colorea",
    card: "pack.card.09",
    title: "Mira, Busca y Colorea",
    pages: 60,
    pagesLabel: "60 páginas",
    description: "Treinta láminas con diferencias, búsquedas y escenas visuales organizadas en tres niveles.",
  },
];

/**
 * Real composition of the two products (source: Hotmart upload manifests 2026-07-24/26 and the
 * published landings, read 2026-09-12). Page counts sum to 414 and 384 respectively.
 * Descriptions describe what the material contains — never outcomes.
 */
export type Resource = {
  id: string;
  /** media manifest id of the card image */
  card: string;
  title: string;
  pages: number | null;
  pagesLabel: string;
  description: string;
  /** True for the three bonuses embedded inside Kit Tardes Tranquilas. */
  embedded?: boolean;
};

export const grafismoResources: Resource[] = [
  {
    id: "paso-a-paso",
    card: "gf.card.01",
    title: "Grafismo Fonético Paso a Paso",
    pages: 120,
    pagesLabel: "120 páginas",
    description:
      "El material central: sílabas grandes, imágenes reconocibles, palabras para trazar y actividades listas para imprimir.",
  },
  {
    id: "10-minutos",
    card: "gf.card.02",
    title: "10 Minutos de Grafismo Fonético",
    pages: 16,
    pagesLabel: "16 páginas",
    description:
      "Una guía breve para elegir la hoja del día y acompañar la práctica sin convertirla en una clase larga.",
  },
  {
    id: "silabas-en-tus-manos",
    card: "gf.card.03",
    title: "Sílabas en Tus Manos",
    pages: 40,
    pagesLabel: "40 páginas",
    description: "Tarjetas recortables para mezclar, repasar y formar palabras de una manera más dinámica.",
  },
  {
    id: "21-dias",
    card: "gf.card.04",
    title: "21 Días de Grafismo Fonético en Casa",
    pages: 28,
    pagesLabel: "28 páginas",
    description: "Un calendario para sostener una rutina breve y marcar cada día de práctica.",
  },
  {
    id: "safari",
    card: "gf.card.05",
    title: "Safari de Sonidos y Sílabas",
    pages: 40,
    pagesLabel: "40 páginas",
    description: "Animales, sonidos y palabras simples para sumar variedad visual a cada práctica.",
  },
  {
    id: "juega",
    card: "gf.card.06",
    title: "Juega con Sonidos y Sílabas",
    pages: 50,
    pagesLabel: "50 páginas",
    description: "Bingo, memoria, dominó, ruletas y tableros para cambiar el formato de repaso.",
  },
  {
    id: "sonidos-de-mi-casa",
    card: "gf.card.07",
    title: "Los Sonidos de Mi Casa",
    pages: 40,
    pagesLabel: "40 páginas",
    description: "Actividades con objetos cotidianos y palabras cercanas que resultan fáciles de reconocer.",
  },
  {
    id: "pared-de-sonidos",
    card: "gf.card.08",
    title: "Mi Pared de Sonidos",
    pages: 40,
    pagesLabel: "40 páginas",
    description: "Material visual para imprimir, plastificar o dejar a mano como apoyo durante la semana.",
  },
  {
    id: "letras-de-mi-mundo",
    card: "gf.card.09",
    title: "Las Letras de Mi Mundo",
    pages: 40,
    pagesLabel: "40 páginas",
    description:
      "Páginas para trabajar el nombre, las iniciales, la familia y palabras significativas para cada niño.",
  },
];

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

export const grafismoPageIds = Array.from(
  { length: 20 },
  (_, i) => `gf.page.${String(i + 1).padStart(2, "0")}`,
);
export const packPageIds = Array.from(
  { length: 12 },
  (_, i) => `pack.page.${String(i + 1).padStart(2, "0")}`,
);

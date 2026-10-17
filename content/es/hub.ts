/**
 * The two needs Pequeverso answers, shared by every place that lets a visitor choose: the home
 * doors, the header «Productos» menu, the mobile menu, the sticky bar, the footer and the 404 page
 * (docs/specs/home-hub.md). Labels say the task and the age, never an identity. Names, ages and
 * links come from the registry and `config/affiliates.ts`; this file only holds the words.
 */
export const hubCopy = {
  menu: {
    /** Header trigger (every width). */
    label: "Productos",
    /** Accessible name of the open panel (the footer column is also called «Productos»). */
    panelLabel: "Menú de productos",
    title: "¿Qué necesitas hoy?",
    hint: "Un recurso para cada etapa de tu familia.",
  },
  reading: {
    /** Stable anchor of the home chapter, for bios and posts (`pequeverso.com/#leer`). */
    anchor: "leer",
    need: "Aprender a leer",
    line: "Por sílabas, sin presión y a su ritmo.",
    format: "PDF para imprimir",
    go: "Ver el kit",
  },
  feeding: {
    /** Stable anchor of the home chapter, for bios and posts (`pequeverso.com/#bebe`). */
    anchor: "bebe",
    need: "Primeras comidas de tu bebé",
    line: "Una guía para organizar sus primeras comidas, a tu ritmo.",
    format: "Curso en video",
    go: "Ver la guía",
    recommended: "Recomendado",
    /** Affiliate disclosure wherever the course appears outside its chapter (doors, menu, sticky bar). */
    disclosure: "Enlace de afiliado: si compras, Pequeverso recibe una comisión; a ti no te cuesta más.",
  },
} as const;

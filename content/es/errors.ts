/** Copy for the 404 and error pages. Plain strings only: the client error boundary imports it. */
export const notFoundCopy = {
  meta: { title: "Página no encontrada" },
  kicker: "Error 404",
  title: "Esta página no existe.",
  lead: "Puede que el enlace esté incompleto o que la página se haya movido. Estas son las salidas más útiles:",
  home: "Ir al inicio",
  product: "Ver",
  support: "Soporte",
} as const;

export const errorCopy = {
  kicker: "Algo salió mal",
  title: "No pudimos mostrar esta página.",
  lead: "Puedes intentar de nuevo o volver al inicio. Si compraste el kit y necesitas ayuda, escríbenos desde la página de soporte.",
  retry: "Intentar de nuevo",
  home: "Ir al inicio",
  support: "Soporte",
} as const;

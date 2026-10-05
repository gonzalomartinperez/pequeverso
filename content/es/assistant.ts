/**
 * Interface copy of the native shopping assistant (neutral Latin American Spanish, "tú", like the
 * rest of the store). Answers may arrive in English when the visitor writes in English; the
 * interface itself stays in Spanish and each answer carries its own `lang`. The assistant is
 * advisory: no copy here promises prices, stock, discounts or learning outcomes.
 */
import type { ErrorCode, Notice, UnavailableReason } from "../../src/features/assistant/domain/models.ts";

/** The only strings the eager launcher needs (kept apart so the initial bundle stays small). */
export const launcherCopy = {
  launcher: "Pregúntanos",
  launcherLabel: "Abrir el asistente de Pequeverso",
  launcherUnread: "Hay una respuesta nueva",
};

export const assistantCopy = {
  name: "Asistente Pequeverso",
  aiDisclosure: "Asistente con IA. Usa la información de la tienda.",
  privacyNote: "No escribas datos personales ni de tus hijos. ",
  privacyLink: "Cómo tratamos tus mensajes",

  greetingTitle: "¡Hola! ¿En qué te ayudo?",
  greetingBody:
    "Pregúntame qué incluye cada material, para qué edades es, cómo se imprime o cómo se usa en casa. Te respondo con la información de la tienda.",
  startersLabel: "Preguntas para empezar",
  /** Fallback only: the API sends starters built from approved catalog topics. */
  starters: [
    "¿Qué incluye Grafismo Fonético?",
    "¿Sirve para un niño de 4 años?",
    "¿Cómo se imprime y se usa en casa?",
    "¿Cómo recibo el material después de comprar?",
  ],

  transcriptLabel: "Conversación con el asistente",
  you: "Tú",
  assistant: "Asistente",
  composerLabel: "Escribe tu pregunta",
  composerPlaceholder: "Escribe tu pregunta…",
  composerHint: "Enter para enviar · Shift + Enter para nueva línea",
  send: "Enviar pregunta",
  stop: "Detener respuesta",
  stopping: "Deteniendo…",
  charactersLeft: (count: number) => (count === 1 ? "Queda 1 carácter" : `Quedan ${count} caracteres`),
  tooLong: (max: number) => `Tu pregunta supera el máximo de ${max} caracteres.`,

  thinking: "Buscando en la información de la tienda…",
  answerReady: "Respuesta lista.",
  answerStopped: "Respuesta detenida.",
  answerInterrupted: "La respuesta se interrumpió.",
  answerFailed: "No se pudo completar la respuesta.",
  jumpToLatest: "Ir a la última respuesta",

  partialLabel: "Respuesta incompleta",
  inProgressLabel: "Respuesta en curso, todavía sin confirmar",
  cancelledTitle: "Detuviste la respuesta.",
  interruptedTitle: "Se cortó la conexión antes de terminar la respuesta.",
  failedTitle: "No pude completar la respuesta.",
  retry: "Reintentar",
  dismiss: "Cerrar aviso",

  copy: "Copiar respuesta",
  copied: "Copiada",
  copyFailed: "No se pudo copiar",

  productsLabel: "Productos mencionados",
  compareLabel: "Comparación",
  viewProduct: "Ver el material",
  purchaseOptions: "Ver opciones de compra",
  opensInNewTab: "(se abre en una pestaña nueva)",
  ageRange: "Edad",
  price: "Precio",
  priceVerified: (date: string) => `Precio confirmado el ${date}`,
  priceUnverified: "Consulta el precio vigente en la página del material",
  resourcesLabel: "Incluye",
  pages: (count: number) => (count === 1 ? "1 página" : `${count} páginas`),
  resourceCount: (count: number) => (count === 1 ? "1 recurso" : `${count} recursos`),
  sourcesLabel: (count: number) => (count === 1 ? "1 fuente" : `${count} fuentes`),
  sourcesHint: "Información de la tienda usada en esta respuesta",
  linksLabel: "Enlaces útiles",
  followUpsLabel: "Puedes preguntar",

  notices: {
    answer_replaced:
      "No pude confirmar esa respuesta con la información de la tienda, así que te muestro una respuesta segura.",
    payment_data_refused:
      "Por tu seguridad, no escribas datos de tarjetas aquí. El pago se hace solo en la página segura de Hotmart.",
    contact_data_redacted: "Ocultamos datos de contacto de tu mensaje para proteger tu privacidad.",
    language_unsupported: "Por ahora respondo en español y en inglés.",
  } satisfies Record<Notice, string>,

  clear: "Nueva conversación",
  clearConfirmTitle: "¿Empezar de nuevo?",
  clearConfirmBody: "Se borrará esta conversación y no podrás recuperarla.",
  clearConfirm: "Borrar",
  clearCancel: "Cancelar",
  clearing: "Borrando…",
  expand: "Ampliar panel",
  restore: "Reducir panel",
  minimize: "Minimizar asistente",

  connecting: "Conectando con el asistente…",
  reconnect: "Reintentar conexión",
  expiredNotice: "Tu conversación anterior expiró. Puedes seguir con una nueva.",
  offlineTitle: "No pudimos conectar con el asistente.",
  offlineBody: "Revisa tu conexión e inténtalo de nuevo. La tienda sigue funcionando con normalidad.",
  unavailableTitle: "El asistente no está disponible en este momento.",
  unavailableBody: {
    assistant_disabled: "Puedes seguir navegando la tienda o escribirnos desde Soporte.",
    budget_exhausted:
      "Alcanzó su límite de uso por ahora. Puedes seguir navegando la tienda o escribirnos desde Soporte.",
    catalog_unavailable:
      "No puedo consultar la información de la tienda ahora. Puedes seguir navegando o escribirnos desde Soporte.",
  } satisfies Record<UnavailableReason, string>,
  supportLink: "Ir a Soporte",

  errors: {
    invalid_request: "No pude procesar esa pregunta. Prueba a escribirla de otra forma.",
    origin_denied: "El asistente no acepta preguntas desde esta página.",
    csrf_failed: "La sesión se renovó. Vuelve a enviar tu pregunta.",
    session_expired: "La sesión expiró. Vuelve a enviar tu pregunta.",
    rate_limited: "Hiciste muchas preguntas seguidas. Espera un momento antes de seguir.",
    busy: "El asistente está ocupado. Inténtalo de nuevo en unos segundos.",
    run_in_progress: "Todavía estoy respondiendo tu pregunta anterior.",
    idempotency_conflict: "No pude reenviar esa pregunta. Escríbela otra vez.",
    run_not_found: "Esa respuesta ya terminó.",
    budget_exhausted: "El asistente alcanzó su límite de uso por ahora.",
    assistant_disabled: "El asistente no está disponible en este momento.",
    catalog_unavailable: "No puedo consultar la información de la tienda ahora.",
    provider_unavailable: "El servicio de respuestas no está disponible. Inténtalo más tarde.",
    generation_failed: "No pude generar la respuesta. Puedes reintentar.",
    timeout: "La respuesta tardó demasiado. Puedes reintentar.",
    dependency_unavailable: "El asistente tuvo un problema temporal. Inténtalo más tarde.",
    not_found: "No encontré lo que buscabas.",
    network: "Se perdió la conexión. Revisa tu red e inténtalo de nuevo.",
    protocol: "Recibí una respuesta inesperada del servidor. Inténtalo de nuevo.",
  } satisfies Record<ErrorCode, string>,
};

export type AssistantCopy = typeof assistantCopy;

/** "5 de octubre" (date of a confirmed price), in the store's locale. */
export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("es", { day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(iso),
  );
}

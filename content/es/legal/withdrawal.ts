/**
 * Withdrawal-by-email process (PV-D2, OD-50) as customer copy. Every period is generated from
 * `config/commerce.ts`: the 7-day guarantee is refunded automatically in Hotmart; the longer legal
 * windows are honored by email with a manual refund. Pages render these strings and retype no
 * number. Seller personal data never appears here (see ./seller.ts).
 */
import {
  guaranteeDays,
  supportResponseTime,
  withdrawalPeriod,
  withdrawalRequestCodeHours,
  withdrawalWindows,
} from "../../../config/commerce.ts";

/** One line per configured window, in config order: "Argentina: 10 días corridos". */
export const withdrawalWindowList = withdrawalWindows.map((window) => ({
  country: window.country,
  period: withdrawalPeriod(window),
}));

export const withdrawalCopy = {
  title: "Si la ley de tu país te da más tiempo",
  summary: `Con la garantía de Hotmart tienes ${guaranteeDays} días para pedir el reembolso en Hotmart, en cualquier país. Si la ley de tu país te da un plazo de arrepentimiento mayor, escríbenos por correo dentro de ese plazo y gestionamos el reembolso nosotros.`,
  windowsLead: "Plazos legales que gestionamos por correo, por país:",
  windowsNote:
    "Se cuentan como indica la ley de cada país. Si tu país no figura, vale la garantía de Hotmart y la ley local que te corresponda.",
  /** What to write in the email. */
  steps: [
    "Escríbenos desde el correo con el que compraste.",
    "Indica tu nombre, tu país y que quieres ejercer tu derecho de arrepentimiento.",
    "Incluye el código de transacción de Hotmart (empieza con HP) o el número de pedido; si no lo encuentras, dinos el correo y la fecha de la compra.",
    "No hace falta explicar el motivo.",
  ],
  answerTime: `Te respondemos normalmente en ${supportResponseTime} y siempre dentro del plazo legal de tu país.`,
  argentinaCode: `Si compraste desde Argentina, te enviamos por el mismo correo un código de identificación de tu pedido dentro de las ${withdrawalRequestCodeHours} horas.`,
  manualRefund: `Fuera de los ${guaranteeDays} días de la garantía de Hotmart, el reembolso no se hace en Hotmart: lo gestionamos nosotros de forma manual, por el mismo medio de pago o el que acordemos contigo, y te avisamos por correo cuando esté hecho.`,
} as const;

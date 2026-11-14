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
  title: "Plazos legales de arrepentimiento por país",
  summary: `La garantía de Hotmart te da ${guaranteeDays} días para pedir el reembolso en Hotmart, en cualquier país. Además, la ley de algunos países fija su propio plazo de arrepentimiento: esos plazos los gestionamos por correo.`,
  windowsLead: "Plazo legal de arrepentimiento, por país:",
  windowsNote:
    "Se cuenta como indica la ley de cada país. Si tu país no figura, vale la garantía de Hotmart y la ley local que te corresponda.",
  windowsCaption: { country: "País", period: "Plazo" },
  /** What to write in the email; shared by every "Por correo" block. */
  steps: [
    "Indica tu nombre, tu país y el correo con el que compraste.",
    "Incluye el código de transacción de Hotmart de tu compra (empieza con HP; está en el correo de confirmación).",
    "Di que quieres ejercer tu derecho de arrepentimiento. No hace falta explicar el motivo.",
  ],
  answerTime: `Te respondemos normalmente en ${supportResponseTime} y siempre dentro del plazo legal de tu país.`,
  argentinaCode: `Si compraste desde Argentina, te enviamos por el mismo correo un código de identificación de tu pedido dentro de las ${withdrawalRequestCodeHours} horas.`,
  hotmartRefund: `Dentro de los ${guaranteeDays} días de la garantía, Hotmart ejecuta el reembolso.`,
  manualRefund: `Fuera de los ${guaranteeDays} días y dentro del plazo legal de tu país, la solicitud va por correo y lo gestionamos nosotros de forma manual: te confirmamos por correo cómo y cuándo se hace la devolución.`,
} as const;

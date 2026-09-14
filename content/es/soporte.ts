/**
 * Copy for /soporte/ and the 404 / error pages. Support routes point to Hotmart for anything
 * about payment, access or refunds; the site itself only answers by email.
 */
import { guaranteeDays, hotmart } from "../../config/commerce.ts";
import { seller } from "./legal/seller.ts";

export const soporteCopy = {
  meta: {
    title: "Soporte y contacto",
    description:
      "Ayuda para acceder a tu compra, pedir un reembolso o resolver cualquier duda sobre los materiales de Pequeverso.",
  },
  kicker: "Soporte y contacto",
  title: "Estamos para ayudarte.",
  lead: "Elige la situación que se parece más a la tuya. Si no encaja en ninguna, escríbenos directamente.",
  routes: [
    {
      icon: "login",
      title: "No encuentro mi compra",
      text: "Revisa Spam y Promociones y entra en consumer.hotmart.com con el correo que usaste al pagar. Ahí están tus archivos.",
      cta: { label: "Ir a Hotmart", href: hotmart.consumerArea },
    },
    {
      icon: "refresh",
      title: "Quiero un reembolso",
      text: `Tienes ${guaranteeDays} días desde la compra. Pídelo en refund.hotmart.com con tu número de transacción (empieza con HP).`,
      cta: { label: "Pedir reembolso", href: hotmart.refunds },
    },
    {
      icon: "mail",
      title: "Otra duda",
      text: `Escríbenos y te respondemos con calma, normalmente en ${seller.responseTime}. Incluye el correo de la compra si ya compraste.`,
      cta: { label: "Escribir por correo", href: `mailto:${seller.supportEmail}` },
    },
  ],
  limits: {
    title: "Lo que no podemos hacer",
    items: ["Ver o modificar datos de pago.", "Cambiar el correo de una compra."],
    note: "Esas gestiones las hace Hotmart desde su centro de ayuda.",
  },
  contact: { label: "Correo de soporte:", moreLabel: "Más detalle en", moreLink: "Compras y reembolsos" },
} as const;

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

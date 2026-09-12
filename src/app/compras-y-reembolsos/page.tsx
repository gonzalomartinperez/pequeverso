import { guaranteeDays, hotmart } from "@config/commerce";
import { seller } from "@content/es/legal/seller";
import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout/LegalLayout";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/compras-y-reembolsos/",
  title: "Compras y reembolsos",
  description:
    "Cómo funciona la compra en Hotmart, cómo acceder a los archivos y cómo pedir un reembolso paso a paso.",
  noindex: true,
});

const sections = [
  { id: "compra", title: "Cómo se compra" },
  { id: "acceso", title: "Cómo acceder" },
  { id: "reembolso", title: "Cómo pedir un reembolso" },
  { id: "plazos", title: "Plazos" },
];

export default function ComprasPage() {
  return (
    <LegalLayout
      title="Compras y reembolsos"
      intro="Todo el proceso ocurre en Hotmart. Esta página explica cada paso para que no tengas que adivinar."
      updatedAt={seller.updatedAt}
      sections={sections}
    >
      <h2 id="compra">Cómo se compra</h2>
      <ol>
        <li>
          Pulsa el botón de compra en la página del producto. Se abre la página de pago segura de Hotmart.
        </li>
        <li>
          Hotmart muestra el precio en tu moneda, los impuestos de tu país y los medios de pago disponibles.
        </li>
        <li>
          Completa el pago. Después de la compra principal, Hotmart puede mostrarte una oferta opcional (el
          Pack Imprime y Juega) con botones Sí / No dentro de nuestra página. No es obligatoria.
        </li>
        <li>Recibes un correo de Hotmart con la confirmación y el acceso.</li>
      </ol>

      <h2 id="acceso">Cómo acceder</h2>
      <ol>
        <li>Busca el correo de Hotmart (revisa Spam y Promociones).</li>
        <li>
          Entra en <a href={hotmart.consumerArea}>consumer.hotmart.com</a> con el mismo correo de la compra y
          abre “Mis compras”.
        </li>
        <li>Descarga los PDF y guárdalos. Puedes volver a descargarlos cuando quieras.</li>
      </ol>
      <p>
        Si compraste con otro correo o no encuentras el acceso, escríbenos a{" "}
        <a href={`mailto:${seller.supportEmail}`}>{seller.supportEmail}</a> indicando el correo usado y, si lo
        tienes, el número de transacción (empieza con HP).
      </p>

      <h2 id="reembolso">Cómo pedir un reembolso</h2>
      <ol>
        <li>
          Entra en <a href={hotmart.refunds}>refund.hotmart.com</a>.
        </li>
        <li>
          Indica el correo de la compra y el número de transacción (aparece en el correo de confirmación).
        </li>
        <li>Envía la solicitud. Hotmart la procesa y devuelve el importe por el mismo medio de pago.</li>
      </ol>
      <p>
        También puedes escribirnos y gestionamos la solicitud contigo; el reembolso siempre lo ejecuta
        Hotmart.
      </p>

      <h2 id="plazos">Plazos</h2>
      <ul>
        <li>
          <strong>Garantía:</strong> {guaranteeDays} días desde la compra para pedir el reembolso, sin
          justificar el motivo. En la Unión Europea aplica el plazo mínimo que exige la normativa de consumo
          si es mayor; lo verás en la página de pago.
        </li>
        <li>
          <strong>Respuesta de Hotmart:</strong> normalmente en pocos días hábiles; el abono depende del medio
          de pago.
        </li>
        <li>
          <strong>Nuestro soporte:</strong> respondemos en {seller.responseTime}.
        </li>
      </ul>
    </LegalLayout>
  );
}

import { guaranteeDays, hotmart, localCurrencyNote } from "@config/commerce";
import { consumerLaw } from "@content/es/legal/argentina";
import { seller } from "@content/es/legal/seller";
import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, type Section, SectionHeading } from "@/components/layout/legal-layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildMetadata } from "@/lib/metadata";
import { offerProducts } from "@/products";

export const metadata: Metadata = buildMetadata({
  path: "/compras-y-reembolsos/",
  title: "Compras y reembolsos",
  description:
    "Cómo funciona la compra en Hotmart, qué verás en la página de pago (moneda local e impuestos), cómo acceder a los archivos y cómo pedir un reembolso paso a paso.",
  noindex: true,
});

const sections: readonly Section[] = [
  { id: "compra", title: "Cómo se compra" },
  { id: "pago", title: "Moneda, impuestos y comprobante" },
  { id: "acceso", title: "Cómo acceder" },
  { id: "ofertas", title: "Ofertas opcionales" },
  { id: "reembolso", title: "Cómo pedir un reembolso" },
  { id: "arrepentimiento", title: "Botón de arrepentimiento" },
  { id: "plazos", title: "Plazos" },
  { id: "preguntas", title: "Preguntas frecuentes" },
];

const deadlines = [
  {
    step: "Garantía",
    period: `${guaranteeDays} días desde la compra para pedir el reembolso, sin justificar el motivo. En la Unión Europea aplica el plazo mínimo que exige la normativa de consumo si es mayor; lo verás en la página de pago.`,
  },
  {
    step: "Arrepentimiento",
    period: `${consumerLaw.revocationDays} días corridos desde la compra o la entrega del acceso, lo último que ocurra (Ley 24.240, art. 34). Te enviamos un código de identificación del pedido dentro de las ${consumerLaw.revocationCodeHours} horas.`,
  },
  {
    step: "Respuesta a la solicitud",
    period:
      "Hotmart nos da 5 días para responder; si no respondemos, el reembolso se aprueba automáticamente. Hotmart informa por correo de cada cambio de estado.",
  },
  {
    step: "Abono del reembolso",
    period:
      "Lo ejecuta Hotmart por el mismo medio de pago: hasta 30 días en cuenta bancaria y hasta 90 días en tarjeta, según el emisor.",
  },
  { step: "Nuestro soporte", period: `Respondemos en ${seller.responseTime}.` },
];

export default function ComprasPage() {
  const offers = offerProducts();
  const offerNames = offers.map((offer) => offer.name).join(", ");
  return (
    <LegalLayout
      title="Compras y reembolsos"
      intro="Todo el proceso ocurre en Hotmart. Esta página explica cada paso para que no tengas que adivinar."
      updatedAt={seller.updatedAt}
      sections={sections}
    >
      <SectionHeading sections={sections} id="compra" />
      <ol>
        <li>
          Pulsa el botón de compra en la página del producto. Se abre la página de pago segura de Hotmart en
          una pestaña nueva.
        </li>
        <li>
          Hotmart muestra el precio convertido a tu moneda local, los impuestos de tu país y los medios de
          pago disponibles.
        </li>
        <li>Indica tu nombre y tu correo electrónico (a ese correo llegará el acceso) y completa el pago.</li>
        <li>
          Recibes un correo de Hotmart con la confirmación, el comprobante y el enlace de acceso. Con medios
          de pago no inmediatos, el acceso llega cuando el pago se confirma.
        </li>
      </ol>

      <SectionHeading sections={sections} id="pago" />
      <p>{localCurrencyNote}</p>
      <dl>
        <dt>Moneda</dt>
        <dd>
          En este sitio verás precios de referencia en dólares (USD). Hotmart muestra el precio en tu moneda
          local; la conversión se realiza automáticamente dentro de la plataforma con el tipo de cambio del
          momento, y ese es el importe que se cobra. Tu banco puede aplicar su propio tipo de cambio o una
          comisión si trata la operación como compra internacional.
        </dd>
        <dt>Impuestos</dt>
        <dd>
          Algunos países aplican impuestos a las compras internacionales (IVA, VAT u otros). Hotmart los añade
          y los detalla antes de que confirmes. No hay cargos posteriores ni suscripciones: es un pago único.
        </dd>
        <dt>Medios de pago</dt>
        <dd>
          Dependen del país: tarjeta, PayPal, Google Pay o Apple Pay y medios locales como Pix, OXXO o Baloto,
          según Hotmart los ofrezca. El cargo aparecerá a nombre de Hotmart en el extracto de tu tarjeta o
          cuenta.
        </dd>
        <dt>Comprobante</dt>
        <dd>Hotmart emite el comprobante de la compra y lo envía al correo que indicaste al pagar.</dd>
      </dl>

      <SectionHeading sections={sections} id="acceso" />
      <ol>
        <li>Busca el correo de Hotmart (revisa también Spam y Promociones).</li>
        <li>
          Entra en <a href={hotmart.consumerArea}>consumer.hotmart.com</a> con el mismo correo de la compra y
          abre “Mis compras”.
        </li>
        <li>Descarga los PDF y guárdalos. Puedes volver a descargarlos cuando quieras.</li>
      </ol>
      <p>
        En “Mis compras”, la opción “Mostrar detalles” de cada compra muestra el número de transacción
        (empieza con HP), las fechas, el importe pagado y nuestro correo de soporte.
      </p>
      <p>
        Si compraste con otro correo o no encuentras el acceso, escríbenos a{" "}
        <a href={`mailto:${seller.supportEmail}`}>{seller.supportEmail}</a> indicando el correo usado y, si lo
        tienes, el código de transacción (empieza con HP). Cambiar el correo de una compra es una gestión que
        realiza Hotmart desde su centro de ayuda.
      </p>

      <SectionHeading sections={sections} id="ofertas" />
      <p>
        Después de la compra principal, Hotmart puede mostrarte una oferta opcional
        {offerNames ? ` (${offerNames})` : ""} con botones Sí / No dentro de nuestra página. No es
        obligatoria: si eliges No, tu compra principal no cambia. Si eliges Sí, se genera una compra separada
        con su propio comprobante, y la misma garantía y el mismo proceso de reembolso.
      </p>

      <SectionHeading sections={sections} id="reembolso" />
      <ol>
        <li>
          Entra en <a href={hotmart.refunds}>refund.hotmart.com</a>.
        </li>
        <li>
          Indica el correo de la compra y el número de transacción (aparece en el correo de confirmación y en
          “Mis compras”; empieza con HP).
        </li>
        <li>
          Envía la solicitud. Tenemos 5 días para responder; si no lo hacemos, Hotmart aprueba el reembolso
          automáticamente y devuelve el importe por el mismo medio de pago.
        </li>
      </ol>
      <p>
        También puedes escribirnos y gestionamos la solicitud contigo; el reembolso siempre lo ejecuta
        Hotmart. Tras el reembolso, Hotmart retira el acceso a los archivos.
      </p>

      <SectionHeading sections={sections} id="arrepentimiento" />
      <p>
        Si compraste como consumidor, puedes revocar la compra dentro de los {consumerLaw.revocationDays} días
        corridos, sin registrarte ni explicar el motivo, desde el{" "}
        <Link href="/arrepentimiento/">Botón de arrepentimiento</Link>. Dentro de las{" "}
        {consumerLaw.revocationCodeHours} horas te enviamos por correo un código de identificación del pedido,
        y el reembolso lo ejecuta Hotmart por el mismo medio de pago.
      </p>

      <SectionHeading sections={sections} id="plazos" />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Paso</TableHead>
            <TableHead scope="col">Plazo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deadlines.map((row) => (
            <TableRow key={row.step}>
              <TableHead scope="row">{row.step}</TableHead>
              <TableCell>{row.period}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <SectionHeading sections={sections} id="preguntas" />
      <h3>¿Por qué el importe que pagué no coincide exactamente con el precio en dólares?</h3>
      <p>
        Porque Hotmart convierte el precio a tu moneda con su tipo de cambio del momento y añade los impuestos
        de tu país. El total exacto siempre se muestra antes de confirmar.
      </p>
      <h3>¿Puedo pagar en cuotas o con un medio local?</h3>
      <p>
        Depende del país. La página de pago de Hotmart muestra los medios disponibles para el tuyo; nosotros
        no podemos habilitar otros.
      </p>
      <h3>¿Recibo algo físico?</h3>
      <p>No. Son archivos PDF que descargas e imprimes en casa o en una papelería.</p>
      <h3>¿Y el derecho de arrepentimiento, desistimiento o retracto de mi país?</h3>
      <p>
        Se respeta. En la República Argentina puedes revocar la compra dentro de los{" "}
        {consumerLaw.revocationDays} días corridos desde el{" "}
        <Link href="/arrepentimiento/">Botón de arrepentimiento</Link>. Si resides en otro país y tu ley
        reconoce un plazo mayor que la garantía (por ejemplo, el desistimiento de 14 días en la Unión Europea,
        con las reglas propias del contenido digital, o los 5 días hábiles de retracto en Colombia), se aplica
        ese plazo. La solicitud se hace igual: en refund.hotmart.com o por correo. Detalle en los{" "}
        <Link href="/terminos/">Términos de compra</Link>.
      </p>
      <h3>¿Qué pasa si pido el reembolso fuera del plazo?</h3>
      <p>
        Hotmart aplica el plazo informado en la página de pago. Si tienes un problema con el material fuera de
        ese plazo, escríbenos igualmente e intentaremos ayudarte.
      </p>
      <h3>¿Dónde están las condiciones completas?</h3>
      <p>
        En los <Link href="/terminos/">Términos de compra</Link> (licencia de uso, garantía, derecho de
        arrepentimiento) y en la política de privacidad y de cookies enlazadas desde el pie de página.
      </p>
    </LegalLayout>
  );
}

import { guaranteeDays, hotmart, localCurrencyNote } from "@config/commerce";
import { consumerLaw } from "@content/es/legal/argentina";
import { hotmartFacts } from "@content/es/legal/hotmart";
import { seller } from "@content/es/legal/seller";
import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/blocks/notice";
import { LegalLayout, type Section, SectionHeading } from "@/components/layout/legal-layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildMetadata } from "@/lib/metadata";
import { offerProducts } from "@/products";

export const metadata: Metadata = buildMetadata({
  path: "/compras-y-reembolsos/",
  title: "Compras y reembolsos",
  description:
    "Cómo funciona la compra en Hotmart, qué verás en la página de pago, cómo acceder a los archivos, cómo pedir un reembolso y cómo se combinan la garantía y tus derechos legales.",
  noindex: true,
});

const sections: readonly Section[] = [
  { id: "resumen", title: "En resumen" },
  { id: "compra", title: "Cómo se compra" },
  { id: "pago", title: "Moneda, impuestos y comprobante" },
  { id: "acceso", title: "Cómo acceder" },
  { id: "ofertas", title: "Ofertas opcionales" },
  { id: "reembolso", title: "Cómo pedir un reembolso" },
  { id: "garantia-y-ley", title: "Garantía y derechos legales" },
  { id: "plazos", title: "Plazos" },
  { id: "contacto", title: "Canales de contacto" },
  { id: "preguntas", title: "Preguntas frecuentes" },
];

const deadlines = [
  {
    step: "Garantía de Hotmart",
    period: `${guaranteeDays} días desde la aprobación del pago, para cualquier comprador y sin justificar el motivo. En la Unión Europea, Hotmart exige al menos 15 días; el plazo aplicable figura en los términos de la página de pago.`,
  },
  {
    step: "Arrepentimiento en Argentina",
    period: `${consumerLaw.revocationDays} días corridos desde la compra o la entrega del acceso, lo último que ocurra, cuando corresponde (Ley 24.240, art. 34). Código de identificación del pedido en ${consumerLaw.revocationCodeHours} horas.`,
  },
  {
    step: "Respuesta del Titular",
    period: `Hotmart da al Titular ${hotmartFacts.producerResponseDays} días naturales para responder cada solicitud. Hotmart informa por correo de cada cambio de estado.`,
  },
  {
    step: "Aprobación",
    period: `Una vez aprobada, la solicitud puede tardar hasta ${hotmartFacts.approvalDays} días en liberarse al banco o plataforma de pago.`,
  },
  {
    step: "Devolución del dinero",
    period: `Por el mismo medio de pago: ${hotmartFacts.refundTiming}.`,
  },
  { step: "Soporte por correo", period: `Respuesta normalmente en ${seller.responseTime}.` },
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
      <SectionHeading sections={sections} id="resumen" />
      <ul>
        <li>
          Pagas en Hotmart, que te muestra el <strong>total final en tu moneda</strong>, con impuestos, antes
          de confirmar.
        </li>
        <li>
          Recibes el acceso por correo y descargas los PDF en{" "}
          <a href={hotmart.consumerArea}>consumer.hotmart.com</a>.
        </li>
        <li>
          Tienes <strong>{guaranteeDays} días de garantía</strong>, cualquiera sea tu país: pides el reembolso
          en <a href={hotmartFacts.urls.refundForm}>refund.hotmart.com</a> o por correo, sin justificar el
          motivo.
        </li>
        <li>
          Si la ley de tu país te da un plazo mayor u otra protección, se aplica esa ley. En Argentina, usa el{" "}
          <Link href="/arrepentimiento/">Botón de arrepentimiento</Link>.
        </li>
      </ul>

      <SectionHeading sections={sections} id="compra" />
      <ol>
        <li>
          Pulsa el botón de compra en la página del producto. Se abre la página de pago segura de Hotmart en
          una pestaña nueva.
        </li>
        <li>
          Hotmart muestra el precio convertido a tu moneda local, los impuestos de tu país, los medios de pago
          disponibles y los términos de compra, incluido el plazo de garantía.
        </li>
        <li>Indica tu nombre y tu correo electrónico (a ese correo llegará el acceso) y completa el pago.</li>
        <li>
          Recibes un correo de Hotmart con la confirmación, el código de transacción (empieza con HP) y el
          enlace de acceso. Con medios de pago no inmediatos, el acceso llega cuando el pago se confirma.
        </li>
      </ol>

      <SectionHeading sections={sections} id="pago" />
      <p>{localCurrencyNote}</p>
      <dl>
        <dt>Moneda</dt>
        <dd>
          En el Sitio verás precios de referencia en dólares (USD). Hotmart muestra el precio en tu moneda
          local y realiza la conversión automáticamente con el tipo de cambio del momento; el importe que ves
          antes de confirmar es el que se cobra. Tu banco puede aplicar su propio tipo de cambio o una
          comisión si trata la operación como compra internacional.
        </dd>
        <dt>Impuestos</dt>
        <dd>
          Algunos países aplican impuestos a las compras internacionales (IVA, VAT u otros). Hotmart los añade
          y los detalla antes de que confirmes. En Argentina, los impuestos y percepciones sobre compras en el
          exterior los cobran la tarjeta o la entidad de pago, y en caso de reembolso Hotmart devuelve el
          valor del producto, no esos impuestos. Es un pago único: no hay cargos posteriores ni suscripciones.
        </dd>
        <dt>Medios de pago</dt>
        <dd>
          Dependen del país: tarjeta, PayPal, Google Pay o Apple Pay y medios locales, según Hotmart los
          ofrezca. El cargo aparece a nombre de Hotmart en el resumen de tu tarjeta o cuenta.
        </dd>
        <dt>Comprobante</dt>
        <dd>
          Hotmart envía el comprobante de la compra al correo que indicaste al pagar. Si necesitas una factura
          con tus datos, puedes solicitarla en <a href={hotmartFacts.urls.invoice}>purchase.hotmart.com</a>{" "}
          con el código de transacción y el correo de la compra.
        </dd>
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
        El código de transacción (empieza con HP) está en el correo de confirmación y en{" "}
        {hotmartFacts.transactionCodePath}.
      </p>
      <p>
        Si compraste con otro correo o no encuentras el acceso, escríbenos indicando el correo usado y, si lo
        tienes, el código de transacción. Cambiar el correo de una compra es una gestión que realiza Hotmart
        desde su centro de ayuda.
      </p>

      <SectionHeading sections={sections} id="ofertas" />
      <p>
        Después de la compra principal, Hotmart puede mostrarte una oferta opcional
        {offerNames ? ` (${offerNames})` : ""} con botones Sí / No dentro de nuestra página. No es
        obligatoria: si eliges No, tu compra principal no cambia. Si eliges Sí, se genera una compra separada
        con su propio comprobante, y la misma garantía y el mismo proceso de reembolso.
      </p>

      <SectionHeading sections={sections} id="reembolso" />
      <h3>En Hotmart</h3>
      <ol>
        <li>
          Entra en <a href={hotmartFacts.urls.refundForm}>refund.hotmart.com</a>.
        </li>
        <li>
          Indica el código de transacción (HP…) y confirma con el código de seguridad que llega a tu correo.
        </li>
        <li>
          Envía la solicitud. Puedes seguir su estado en{" "}
          <a href={hotmartFacts.urls.refundTracking}>refund.hotmart.com/tracking</a>.
        </li>
      </ol>
      <h3>Por correo</h3>
      <p>
        Escribe a <a href={`mailto:${seller.supportEmail}`}>{seller.supportEmail}</a> (o a{" "}
        <a href={`mailto:${seller.legalEmail}`}>{seller.legalEmail}</a>, el correo del titular en Hotmart) con
        el correo de la compra y el código HP, y gestionamos la solicitud contigo. El reembolso siempre lo
        ejecuta Hotmart, por el mismo medio de pago; después, Hotmart retira el acceso a los archivos.
      </p>

      <SectionHeading sections={sections} id="garantia-y-ley" />
      <dl>
        <dt>Garantía de Hotmart</dt>
        <dd>
          Es una garantía comercial de {guaranteeDays} días que acompaña a toda compra, cualquiera sea tu
          país: dentro de ese plazo puedes pedir el reembolso sin justificar el motivo.
        </dd>
        <dt>Tus derechos legales</dt>
        <dd>
          El derecho de arrepentimiento, retracto o desistimiento que te reconozca la ley de tu país es
          independiente de la garantía y no se puede renunciar. Si esa ley te da un plazo mayor o condiciones
          más favorables, se aplican.
        </dd>
        <dt>Contenido digital</dt>
        <dd>
          Algunas leyes exceptúan del arrepentimiento los archivos que se descargan de inmediato (por ejemplo,
          el art. 1116 del Código Civil y Comercial argentino, salvo pacto en contrario, o la normativa de la
          Unión Europea cuando la descarga empieza con tu consentimiento). La garantía de Hotmart se aplica
          igualmente.
        </dd>
        <dt>Si los plazos difieren</dt>
        <dd>
          Se aplica siempre el plazo o la condición más favorable para ti. La{" "}
          <Link href="/arrepentimiento/#paises">referencia por país</Link> resume los plazos verificados y las
          autoridades de consumo.
        </dd>
      </dl>
      <Notice title="En Argentina">
        <p>
          Puedes revocar la compra dentro de los {consumerLaw.revocationDays} días corridos, cuando
          corresponde, desde el <Link href="/arrepentimiento/">Botón de arrepentimiento</Link>, sin
          registrarte. Te enviamos por correo un código de identificación del pedido dentro de las{" "}
          {consumerLaw.revocationCodeHours} horas.
        </p>
      </Notice>

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

      <SectionHeading sections={sections} id="contacto" />
      <dl>
        <dt>Pequeverso (canal principal)</dt>
        <dd>
          <a href={`mailto:${seller.supportEmail}`}>{seller.supportEmail}</a>. Soporte: respuesta normalmente
          en {seller.responseTime}. Pedidos de arrepentimiento: código de identificación en{" "}
          {consumerLaw.revocationCodeHours} horas. Incluye el correo de la compra y el código HP.
        </dd>
        <dt>{seller.legalEmailLabel}</dt>
        <dd>
          <a href={`mailto:${seller.legalEmail}`}>{seller.legalEmail}</a>
        </dd>
        <dt>Hotmart</dt>
        <dd>
          <a href={hotmartFacts.urls.buyerHelp}>Centro de ayuda para compradores</a>,{" "}
          <a href={hotmartFacts.urls.refundForm}>formulario de reembolso</a> y{" "}
          <a href={hotmart.consumerArea}>área de compras</a>.
        </dd>
        <dt>Autoridades de consumo</dt>
        <dd>
          Si un reclamo no se resuelve, puedes acudir a la autoridad de consumo de tu país; los enlaces
          oficiales están en la <Link href="/arrepentimiento/#paises">referencia por país</Link>.
        </dd>
      </dl>

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
      <h3>¿Qué pasa si pido el reembolso fuera del plazo?</h3>
      <p>
        Fuera del plazo de garantía, el reembolso ya no se tramita automáticamente en Hotmart y depende de la
        autorización del Titular, salvo que la ley de tu país te otorgue un plazo mayor. Si tienes un problema
        con el material, escríbenos igualmente e intentaremos ayudarte.
      </p>
      <h3>¿Dónde están las condiciones completas?</h3>
      <p>
        En los <Link href="/terminos/">Términos de compra</Link> (licencia de uso, garantía, derecho de
        arrepentimiento, jurisdicción), en la <Link href="/privacidad/">Política de privacidad</Link> y en la{" "}
        <Link href="/cookies/">Política de cookies</Link>.
      </p>
    </LegalLayout>
  );
}

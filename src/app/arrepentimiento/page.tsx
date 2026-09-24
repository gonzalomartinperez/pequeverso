import { guaranteeDays, hotmart } from "@config/commerce";
import { consumerAuthority, consumerLaw } from "@content/es/legal/argentina";
import { seller } from "@content/es/legal/seller";
import { Mail, RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CTAButton } from "@/components/blocks/cta-button";
import { Notice } from "@/components/blocks/notice";
import { LegalLayout, type Section, SectionHeading } from "@/components/layout/legal-layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/arrepentimiento/",
  title: "Botón de arrepentimiento",
  description:
    "Cómo revocar una compra de Pequeverso: pedido por correo o en Hotmart, sin registro, con código de identificación en 24 horas.",
  noindex: true,
});

const sections: readonly Section[] = [
  { id: "derecho", title: "Tu derecho a revocar la compra" },
  { id: "como", title: "Cómo pedirlo" },
  { id: "despues", title: "Qué ocurre después" },
  { id: "plazos", title: "Plazos" },
  { id: "reclamos", title: "Si no quedas conforme" },
];

const mailSubject = "Arrepentimiento de compra";
const mailto = `mailto:${seller.supportEmail}?subject=${encodeURIComponent(mailSubject)}`;

const deadlines = [
  {
    step: "Revocación (Ley 24.240)",
    period: `${consumerLaw.revocationDays} días corridos desde la compra o desde que recibiste el acceso, lo que ocurra último.`,
  },
  {
    step: "Garantía de Hotmart",
    period: `${guaranteeDays} días desde la compra, para cualquier comprador y sin justificar el motivo.`,
  },
  {
    step: "Código de identificación",
    period: `Dentro de las ${consumerLaw.revocationCodeHours} horas de recibido tu pedido, por correo.`,
  },
  {
    step: "Devolución del dinero",
    period:
      "La ejecuta Hotmart por el mismo medio de pago: hasta 30 días en cuenta bancaria y hasta 90 días en tarjeta, según el emisor.",
  },
];

export default function ArrepentimientoPage() {
  return (
    <LegalLayout
      title="Botón de arrepentimiento"
      intro="Si compraste un material de Pequeverso y te arrepentiste, puedes revocar la compra desde aquí. No necesitas registrarte ni explicar el motivo."
      updatedAt={seller.updatedAt}
      sections={sections}
    >
      <div className="mb-8 flex flex-wrap gap-3">
        <CTAButton href={mailto} variant="secondary" size="sm" icon={Mail}>
          Pedir el arrepentimiento por correo
        </CTAButton>
        <CTAButton href={hotmart.refunds} variant="outline" size="sm" icon={RotateCcw}>
          Pedirlo en refund.hotmart.com
        </CTAButton>
      </div>

      <SectionHeading sections={sections} id="derecho" />
      <p>
        En las compras a distancia, como las que se hacen por internet, el consumidor puede revocar la
        aceptación dentro de los <strong>{consumerLaw.revocationDays} días corridos</strong> contados desde la
        celebración del contrato o desde la entrega del producto, lo último que ocurra, sin costo ni
        responsabilidad alguna (art. 34 de la Ley 24.240 de Defensa del Consumidor y arts. 1110 y 1112 del
        Código Civil y Comercial de la Nación). Este botón existe para que puedas ejercer ese derecho de forma
        simple, conforme a la Resolución 424/2020 de la Secretaría de Comercio Interior.
      </p>
      <p>
        Además, todas las compras cuentan con la <strong>garantía de {guaranteeDays} días</strong> de Hotmart,
        que permite pedir el reembolso sin justificar el motivo, cualquiera sea tu país. Si ambos plazos te
        alcanzan, se aplica el que te resulte más favorable.
      </p>
      <p>
        El art. 1116 del Código Civil y Comercial prevé excepciones al derecho de revocación para ciertos
        contenidos digitales que se descargan o utilizan de inmediato. Si tienes dudas sobre tu caso,
        escríbenos igualmente: todos los pedidos se responden y se tramitan con el código indicado más abajo.
      </p>

      <SectionHeading sections={sections} id="como" />
      <p>Elige una de estas dos vías. Ninguna exige crear una cuenta ni iniciar sesión en el Sitio.</p>
      <h3>Por correo electrónico</h3>
      <ol>
        <li>
          Escribe a <a href={mailto}>{seller.supportEmail}</a> con el asunto “{mailSubject}”.
        </li>
        <li>
          Indica tu nombre, el correo electrónico con el que compraste y, si lo tienes, el código de
          transacción de Hotmart (empieza con HP; está en el correo de confirmación y en “Mis compras”).
        </li>
        <li>No hace falta explicar el motivo.</li>
      </ol>
      <h3>En Hotmart</h3>
      <ol>
        <li>
          Entra en <a href={hotmart.refunds}>refund.hotmart.com</a>.
        </li>
        <li>Indica el correo de la compra y el código de transacción (HP…).</li>
        <li>Envía la solicitud; Hotmart te confirma por correo cada cambio de estado.</li>
      </ol>

      <SectionHeading sections={sections} id="despues" />
      <ol>
        <li>
          Dentro de las <strong>{consumerLaw.revocationCodeHours} horas</strong> de recibido tu correo, te
          respondemos con un <strong>código de identificación</strong> de tu pedido. Guárdalo: sirve para
          seguir el trámite y para cualquier reclamo posterior.
        </li>
        <li>
          Gestionamos el reembolso en Hotmart, que devuelve el importe por el mismo medio de pago que usaste.
          Tras el reembolso, Hotmart retira el acceso a los archivos.
        </li>
        <li>
          Si pediste la revocación directamente en Hotmart, el número de la solicitud que te envía Hotmart
          identifica el trámite; también puedes escribirnos para recibir nuestro código.
        </li>
      </ol>
      <Notice title="Importante">
        <p>
          El reembolso siempre lo ejecuta Hotmart, que procesó tu pago. El Titular no ve ni guarda los datos
          de tu tarjeta o cuenta. Más detalle en{" "}
          <Link href="/compras-y-reembolsos/">Compras y reembolsos</Link>.
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

      <SectionHeading sections={sections} id="reclamos" />
      <p>
        Si tu pedido no se resolvió, puedes presentar un reclamo ante la{" "}
        <a href={consumerAuthority.national.url}>{consumerAuthority.national.name}</a> o, en la provincia de
        Buenos Aires, ante la <a href={consumerAuthority.province.url}>{consumerAuthority.province.name}</a>.
        Si resides en otro país, puedes acudir a la autoridad de consumo de tu país. Las condiciones completas
        están en los <Link href="/terminos/">Términos de compra</Link>.
      </p>
    </LegalLayout>
  );
}

import { guaranteeDays, hotmart } from "@config/commerce";
import { consumerAuthority, consumerLaw } from "@content/es/legal/argentina";
import { consumerRights } from "@content/es/legal/consumer-rights";
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
  { id: "derecho", title: "Tu derecho a arrepentirte" },
  { id: "como", title: "Cómo pedirlo" },
  { id: "despues", title: "Qué ocurre después" },
  { id: "plazos", title: "Plazos" },
  { id: "paises", title: "Si compras desde otro país" },
  { id: "reclamos", title: "Si no quedas conforme" },
];

const mailSubject = "Arrepentimiento de compra";
const mailto = `mailto:${seller.supportEmail}?subject=${encodeURIComponent(mailSubject)}`;

const deadlines = [
  {
    step: "Revocación legal en Argentina, cuando corresponde",
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
        <strong>La vía simple, para todos:</strong> cualquiera sea tu país, puedes pedir el reembolso dentro
        de los <strong>{guaranteeDays} días</strong> de la compra, sin justificar el motivo, gracias a la
        garantía de Hotmart. Si la ley de tu país te da un plazo mayor u otra protección, se aplica esa ley.
      </p>
      <p>
        En la República Argentina, en las compras a distancia el consumidor puede revocar la aceptación dentro
        de los <strong>{consumerLaw.revocationDays} días corridos</strong> contados desde la entrega del
        producto o la celebración del contrato, lo último que ocurra, sin costo ni responsabilidad alguna
        (art. 34 de la Ley 24.240 de Defensa del Consumidor y arts. 1110 a 1115 del Código Civil y Comercial
        de la Nación). Este botón permite ejercer ese derecho sin registrarte ni hacer otro trámite
        (Disposición 954/2025 de la Subsecretaría de Defensa del Consumidor y Lealtad Comercial).
      </p>
      <p>
        El art. 1116 del Código Civil y Comercial exceptúa de la revocación, salvo pacto en contrario, los
        ficheros informáticos suministrados por vía electrónica que pueden descargarse de inmediato para su
        uso permanente, como los PDF de Pequeverso. Por eso, la garantía de Hotmart es el acuerdo que te
        permite arrepentirte de estos materiales. Si tienes dudas sobre tu caso, escríbenos igualmente: todo
        pedido recibe respuesta y un código de identificación.
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

      <SectionHeading sections={sections} id="paises" />
      <p>
        La garantía de {guaranteeDays} días y nuestro correo son la vía simple para todos. Si la ley de tu
        país te otorga un plazo mayor u otra protección, se aplica esa ley. Esta referencia resume, por país,
        el plazo legal para compras a distancia cuando pudimos verificarlo en una fuente oficial y la
        autoridad de consumo ante la que puedes reclamar. Es orientativa y no reemplaza el texto de cada ley.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">País</TableHead>
            <TableHead scope="col">Plazo legal y autoridad de consumo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {consumerRights.map((entry) => (
            <TableRow key={entry.country}>
              <TableHead scope="row" className="align-top">
                {entry.country}
              </TableHead>
              <TableCell>
                <div className="grid gap-1">
                  <span className="font-bold text-heading">{entry.period ?? "Consulta la ley de tu país"}</span>
                  <span className="text-small">{entry.note}</span>
                  <a href={entry.url}>{entry.authority}</a>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <SectionHeading sections={sections} id="reclamos" />
      <p>
        Si tu pedido no se resolvió, puedes presentar un reclamo ante{" "}
        <a href={consumerAuthority.url}>{consumerAuthority.name}</a> o, si resides en otro país, ante la
        autoridad de consumo indicada en la tabla anterior. Las condiciones completas están en los{" "}
        <Link href="/terminos/">Términos de compra</Link>.
      </p>
    </LegalLayout>
  );
}

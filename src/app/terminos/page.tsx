import { formatUsd, guaranteeDays, hotmart, products } from "@config/commerce";
import { seller } from "@content/es/legal/seller";
import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/LegalLayout/LegalLayout";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/terminos/",
  title: "Términos de compra",
  description:
    "Condiciones de compra de los materiales digitales de Pequeverso: precio, entrega, licencia de uso, garantía y derecho de desistimiento.",
  noindex: true,
});

const sections = [
  { id: "partes", title: "Quién vende y quién cobra" },
  { id: "producto", title: "Qué compras" },
  { id: "precio", title: "Precio e impuestos" },
  { id: "entrega", title: "Entrega y acceso" },
  { id: "licencia", title: "Licencia de uso" },
  { id: "garantia", title: "Garantía y desistimiento" },
  { id: "soporte", title: "Soporte" },
  { id: "ley", title: "Legislación aplicable" },
];

export default function TerminosPage() {
  const main = products.grafismoFonetico;
  const pack = products.imprimeYJuega;
  return (
    <LegalLayout
      title="Términos de compra"
      intro="Condiciones que aplican a la compra de los materiales digitales de Pequeverso a través de Hotmart."
      updatedAt={seller.updatedAt}
      sections={sections}
    >
      <h2 id="partes">Quién vende y quién cobra</h2>
      <p>
        El vendedor de los materiales es {seller.legalName} ({seller.operator}), titular de la marca{" "}
        {seller.brand}. La venta se realiza a través de <strong>Hotmart</strong>, plataforma que actúa como
        intermediaria: procesa el pago, emite el comprobante correspondiente, entrega el acceso digital y
        gestiona los reembolsos conforme a sus propios términos de compra, que aceptas en la página de pago.
      </p>

      <h2 id="producto">Qué compras</h2>
      <ul>
        <li>
          <strong>{main.name}:</strong> {main.pdfCount} archivos PDF con {main.pageCount} páginas en total, en
          formato A4, para imprimir en casa. Orientado a niños de {main.ageRange}.
        </li>
        <li>
          <strong>{pack.name}</strong> (oferta opcional después de la compra principal): {pack.pdfCount}{" "}
          archivos PDF con {pack.pageCount} páginas y {pack.visibleResources} recursos visibles.
        </li>
      </ul>
      <p>
        Son productos 100% digitales: no se envía ningún artículo físico. El contenido descrito en cada página
        del sitio corresponde a lo que recibes; no se prometen resultados de aprendizaje ni plazos.
      </p>

      <h2 id="precio">Precio e impuestos</h2>
      <p>
        Los precios se muestran en dólares estadounidenses ({formatUsd(main.price)} el kit principal;{" "}
        {formatUsd(pack.upsellPrice)} o {formatUsd(pack.downsellPrice)} el pack opcional según el paso del
        proceso de compra en que se ofrezca). Hotmart calcula los impuestos aplicables según tu país, puede
        mostrarte el importe en moneda local y define los medios de pago disponibles. El total final es el que
        aparece en la página de pago antes de confirmar.
      </p>

      <h2 id="entrega">Entrega y acceso</h2>
      <p>
        Tras la aprobación del pago, Hotmart envía el acceso al correo electrónico utilizado en la compra.
        Puedes descargar los archivos desde <a href={hotmart.consumerArea}>consumer.hotmart.com</a> con ese
        mismo correo. Con métodos de pago no inmediatos (por ejemplo, boleto o transferencia), el acceso se
        libera cuando el pago se confirma.
      </p>

      <h2 id="licencia">Licencia de uso</h2>
      <p>
        La compra concede una licencia personal, familiar e intransferible: puedes imprimir el material para
        uso doméstico cuantas veces necesites y los docentes pueden usarlo como recurso complementario con su
        grupo. No está permitido revender, compartir los archivos, publicarlos ni usarlos para crear productos
        derivados.
      </p>

      <h2 id="garantia">Garantía y desistimiento</h2>
      <p>
        Dispones de <strong>{guaranteeDays} días</strong> desde la compra para solicitar el reembolso a través
        de Hotmart, sin necesidad de justificar el motivo. La solicitud se hace en{" "}
        <a href={hotmart.refunds}>refund.hotmart.com</a> con el número de transacción (comienza con HP) o
        escribiéndonos a <a href={`mailto:${seller.supportEmail}`}>{seller.supportEmail}</a>. Si resides en la
        Unión Europea, Hotmart aplica el plazo mínimo que exige la normativa de consumo para contenidos
        digitales; el plazo aplicable se indica en la página de pago y prevalece si es mayor. Más detalle en{" "}
        <Link href="/compras-y-reembolsos/">Compras y reembolsos</Link>.
      </p>

      <h2 id="soporte">Soporte</h2>
      <p>
        Para dudas de acceso, uso del material o reembolsos, escribe a{" "}
        <a href={`mailto:${seller.supportEmail}`}>{seller.supportEmail}</a>. Respondemos normalmente en{" "}
        {seller.responseTime}. No podemos ver ni modificar datos de pago: esas gestiones las realiza Hotmart.
      </p>

      <h2 id="ley">Legislación aplicable</h2>
      <p>
        Estos términos se rigen por la legislación de {seller.country}, sin perjuicio de los derechos que te
        reconozca la normativa de protección al consumidor de tu país de residencia.
      </p>
    </LegalLayout>
  );
}

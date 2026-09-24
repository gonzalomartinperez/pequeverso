import { formatUsd, guaranteeDays, hotmart, localCurrencyNote } from "@config/commerce";
import { consumerAuthority, consumerLaw, jurisdictionClause } from "@content/es/legal/argentina";
import { seller, sellerIdentity } from "@content/es/legal/seller";
import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, type Section, SectionHeading } from "@/components/layout/legal-layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildMetadata } from "@/lib/metadata";
import { coreProducts, offerProducts } from "@/products";
import type { CoreProduct, OfferProduct } from "@/products/schema";

export const metadata: Metadata = buildMetadata({
  path: "/terminos/",
  title: "Términos de compra",
  description:
    "Condiciones de compra de los materiales digitales de Pequeverso a través de Hotmart: precio en moneda local, entrega, licencia de uso, garantía, arrepentimiento y jurisdicción.",
  noindex: true,
});

const sections: readonly Section[] = [
  { id: "definiciones", title: "Partes y definiciones" },
  { id: "aceptacion", title: "Aceptación" },
  { id: "producto", title: "Objeto de la compra" },
  { id: "precio", title: "Precio, moneda e impuestos" },
  { id: "entrega", title: "Entrega y acceso" },
  { id: "ofertas", title: "Ofertas después de la compra" },
  { id: "licencia", title: "Licencia de uso" },
  { id: "garantia", title: "Garantía de reembolso" },
  { id: "arrepentimiento", title: "Derecho de arrepentimiento" },
  { id: "soporte", title: "Soporte y reclamos" },
  { id: "cambios", title: "Modificaciones" },
  { id: "ley", title: "Ley aplicable y jurisdicción" },
];

type ProductLine = { main: CoreProduct; pack: OfferProduct | undefined };

function offerOf(product: CoreProduct): OfferProduct | undefined {
  return offerProducts().find((offer) => offer.parent === product.slug);
}

/** What the main purchase contains: the principal material plus every other PDF as an included bonus. */
function includedName(main: CoreProduct): string {
  return `${main.name} + ${main.resources.length - 1} bonos incluidos`;
}

type PriceRow = { name: string; price: string; when: string };

function priceRows({ main, pack }: ProductLine): PriceRow[] {
  const rows: PriceRow[] = [
    { name: includedName(main), price: formatUsd(main.pricing.list), when: "Compra principal" },
  ];
  if (pack) {
    rows.push(
      {
        name: pack.name,
        price: formatUsd(pack.pricing.upsell),
        when: "Oferta opcional tras la compra principal",
      },
      {
        name: pack.name,
        price: formatUsd(pack.pricing.downsell),
        when: "Precio final del mismo paso si declinas la primera oferta",
      },
    );
  }
  return rows;
}

const allowed = [
  "Imprimir el material en casa, en una papelería o en un centro de impresión, cuantas veces necesites, para los niños a tu cargo.",
  "Guardar copias de los archivos en tus dispositivos para volver a imprimirlos.",
  "Si eres docente, usarlo como recurso complementario con tu propio grupo.",
];

const forbidden = [
  "Revender, alquilar o ceder los archivos, gratis o a cambio de dinero.",
  "Compartirlos por correo, mensajería, grupos o redes sociales, ni publicarlos en internet.",
  "Modificarlos para crear productos derivados o eliminar la marca y las referencias de autoría.",
  "Usarlos en centros, editoriales, plataformas o programas de formación sin una licencia institucional previa y por escrito.",
];

export default function TerminosPage() {
  const lines: ProductLine[] = coreProducts().map((main) => ({ main, pack: offerOf(main) }));
  const rows = lines.flatMap(priceRows);
  return (
    <LegalLayout
      title="Términos de compra"
      intro="Condiciones que rigen la compra de los materiales digitales de Pequeverso a través de Hotmart."
      updatedAt={seller.updatedAt}
      sections={sections}
    >
      <SectionHeading sections={sections} id="definiciones" />
      <dl>
        <dt>Titular</dt>
        <dd>
          {sellerIdentity}, con domicilio en {seller.address}, titular de la marca {seller.brand} y vendedor
          de los materiales. Crea y publica los materiales y atiende el soporte por correo. Datos completos en
          el <Link href="/aviso-legal/">Aviso legal</Link>.
        </dd>
        <dt>Comprador</dt>
        <dd>La persona que adquiere un material a través de Hotmart; en estos términos, “tú”.</dd>
        <dt>Hotmart</dt>
        <dd>
          La plataforma que actúa como intermediaria y facilitadora de pago: muestra el precio en tu moneda,
          cobra, emite el comprobante, entrega el acceso digital y gestiona los reembolsos conforme a sus
          propios términos de compra. Para compradores fuera de Brasil y Estados Unidos, la entidad
          contratante es Hotmart B.V. (Ámsterdam, Países Bajos). El Titular nunca ve tus datos de tarjeta ni
          de otros medios de pago.
        </dd>
        <dt>Sitio</dt>
        <dd>El sitio web pequeverso.com.</dd>
        <dt>Material</dt>
        <dd>Cada producto digital descrito en el Sitio, que se entrega como archivos PDF.</dd>
      </dl>

      <SectionHeading sections={sections} id="aceptacion" />
      <p>
        Al pulsar el botón de compra y confirmar el pago en Hotmart, aceptas estos términos y los de Hotmart.
        Puedes consultarlos, guardarlos o imprimirlos en cualquier momento desde esta página. En caso de duda
        sobre su alcance, prevalece la interpretación más favorable al consumidor (art. 3 de la Ley 24.240 de
        Defensa del Consumidor y art. 1095 del Código Civil y Comercial de la Nación).
      </p>

      <SectionHeading sections={sections} id="producto" />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Material</TableHead>
            <TableHead scope="col">Contenido</TableHead>
            <TableHead scope="col">Formato</TableHead>
            <TableHead scope="col">Edad orientativa</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map(({ main, pack }) => (
            <ProductRows key={main.slug} main={main} pack={pack} />
          ))}
        </TableBody>
      </Table>
      <p>
        Son productos <strong>100% digitales</strong>: no se envía ningún artículo físico. Lo que describe
        cada página del Sitio (archivos, páginas, recursos) es lo que recibes. Los videos de demostración son
        ilustrativos y, en ocasiones, están generados con inteligencia artificial. Son materiales de práctica
        complementaria: no se prometen resultados de aprendizaje ni plazos.
      </p>

      <SectionHeading sections={sections} id="precio" />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Material</TableHead>
            <TableHead scope="col">Precio de referencia</TableHead>
            <TableHead scope="col">Cuándo se ofrece</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${row.name}-${row.when}`}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.price}</TableCell>
              <TableCell>{row.when}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p>{localCurrencyNote}</p>
      <ul>
        <li>
          <strong>Moneda local.</strong> Hotmart muestra el precio en tu moneda local y realiza la conversión
          automáticamente con el tipo de cambio del momento, por lo que el importe en moneda local puede
          variar ligeramente de un día a otro. Tu banco puede aplicar su propio tipo de cambio o una comisión
          si trata la operación como compra internacional.
        </li>
        <li>
          <strong>Impuestos.</strong> Algunos países aplican impuestos a las compras internacionales (IVA, VAT
          u otros). Hotmart los calcula, los añade y los detalla en la página de pago y en el comprobante.
        </li>
        <li>
          <strong>Medios de pago.</strong> Dependen del país: tarjeta, PayPal, Google Pay o Apple Pay y medios
          locales, según Hotmart los ofrezca. El cargo aparece a nombre de Hotmart en el resumen de tu tarjeta
          o cuenta.
        </li>
        <li>
          <strong>Precio final.</strong> El importe total que ves en la página de pago de Hotmart antes de
          confirmar es el que se cobra y prevalece sobre cualquier cifra de referencia del Sitio. Es un pago
          único: no hay cargos posteriores ni suscripciones.
        </li>
      </ul>

      <SectionHeading sections={sections} id="entrega" />
      <ol>
        <li>
          Tras la aprobación del pago, Hotmart envía el acceso al correo electrónico usado en la compra.
        </li>
        <li>
          Puedes descargar los archivos desde <a href={hotmart.consumerArea}>consumer.hotmart.com</a> con ese
          mismo correo, cuantas veces necesites.
        </li>
        <li>
          Con medios de pago no inmediatos (por ejemplo, transferencia o efectivo), el acceso se libera cuando
          el pago se confirma; Hotmart avisa por correo.
        </li>
      </ol>
      <p>
        Si no encuentras el correo o compraste con otra dirección, sigue los pasos de{" "}
        <Link href="/compras-y-reembolsos/">Compras y reembolsos</Link> o escríbenos.
      </p>

      <SectionHeading sections={sections} id="ofertas" />
      <p>
        Tras confirmar la compra principal, Hotmart puede mostrarte dentro del Sitio una oferta opcional con
        botones Sí / No gestionados por Hotmart. Aceptarla genera una compra separada, con su propio
        comprobante y las mismas condiciones, incluidos la garantía y el derecho de arrepentimiento.
        Declinarla no modifica tu compra principal.
      </p>

      <SectionHeading sections={sections} id="licencia" />
      <p>
        La compra concede una licencia <strong>personal, familiar, no exclusiva e intransferible</strong>{" "}
        sobre los archivos. Los materiales siguen siendo propiedad del Titular y están protegidos por la Ley
        11.723 de Propiedad Intelectual.
      </p>
      <h3>Puedes</h3>
      <ul>
        {allowed.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <h3>No puedes</h3>
      <ul>
        {forbidden.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p>
        Para licencias institucionales (colegios, centros, editoriales), escríbenos a{" "}
        <a href={`mailto:${seller.supportEmail}`}>{seller.supportEmail}</a> antes de usar el material.
      </p>

      <SectionHeading sections={sections} id="garantia" />
      <p>
        Dispones de <strong>{guaranteeDays} días</strong> desde la compra para solicitar el reembolso a través
        de Hotmart, sin necesidad de justificar el motivo, cualquiera sea tu país. La solicitud se hace en{" "}
        <a href={hotmart.refunds}>refund.hotmart.com</a> con el correo de la compra y el número de transacción
        (empieza con HP), o escribiéndonos para gestionarla contigo. Hotmart da al Titular cinco días para
        responder la solicitud; si no responde, el reembolso se aprueba automáticamente. El importe vuelve por
        el mismo medio de pago, en los plazos de Hotmart (hasta 30 días en cuenta bancaria y hasta 90 días en
        tarjeta, según el emisor).
      </p>
      <p>
        Si resides en la Unión Europea, Hotmart aplica el plazo mínimo que exige la normativa de consumo para
        contenidos digitales; el plazo aplicable se indica en la página de pago y prevalece si es mayor. Paso
        a paso en <Link href="/compras-y-reembolsos/">Compras y reembolsos</Link>.
      </p>

      <SectionHeading sections={sections} id="arrepentimiento" />
      <p>
        Si compras como consumidor, puedes revocar la compra dentro de los{" "}
        <strong>{consumerLaw.revocationDays} días corridos</strong> contados desde la celebración del contrato
        o desde la entrega del acceso, lo último que ocurra, sin costo ni responsabilidad alguna (art. 34 de
        la Ley 24.240 y arts. 1110 a 1113 del Código Civil y Comercial). Puedes hacerlo desde el{" "}
        <Link href="/arrepentimiento/">Botón de arrepentimiento</Link>, por correo o en refund.hotmart.com,
        sin registrarte; dentro de las {consumerLaw.revocationCodeHours} horas recibirás por correo un código
        de identificación de tu pedido.
      </p>
      <p>
        El art. 1116 del Código Civil y Comercial exceptúa de la revocación, salvo pacto en contrario, los
        ficheros informáticos suministrados por vía electrónica que pueden descargarse de inmediato para su
        uso permanente, como estos materiales. La garantía descrita en el punto anterior es ese pacto: dentro
        de su plazo puedes arrepentirte sin justificar el motivo, cualquiera sea tu país.
      </p>
      <p>
        Si resides en otro país, conservas los derechos que te otorgan las normas imperativas de protección al
        consumidor de tu país (art. 2655 del Código Civil y Comercial); cuando concedan un plazo de
        arrepentimiento, retracto o desistimiento mayor u otra protección, se aplican. La{" "}
        <Link href="/arrepentimiento/#paises">referencia por país</Link> resume los plazos verificados y las
        autoridades de consumo. Toda solicitud se gestiona por las mismas vías: refund.hotmart.com o nuestro
        correo.
      </p>

      <SectionHeading sections={sections} id="soporte" />
      <p>
        Para dudas de acceso, uso del material o reembolsos, escribe a{" "}
        <a href={`mailto:${seller.supportEmail}`}>{seller.supportEmail}</a>. El Titular responde normalmente
        en {seller.responseTime}. No puede ver ni modificar datos de pago ni cambiar el correo de una compra:
        esas gestiones las realiza Hotmart desde su centro de ayuda. Más rutas en{" "}
        <Link href="/soporte/">Soporte y contacto</Link>.
      </p>
      <p>
        Si tu reclamo no se resuelve, puedes presentarlo ante la autoridad de consumo de tu país; en la
        República Argentina, ante <a href={consumerAuthority.url}>{consumerAuthority.name}</a>. La{" "}
        <Link href="/arrepentimiento/#paises">referencia por país</Link> reúne los enlaces oficiales.
      </p>

      <SectionHeading sections={sections} id="cambios" />
      <p>
        El Titular puede actualizar estos términos, por ejemplo si cambia un producto o un proceso de Hotmart.
        A cada compra se le aplican los términos publicados en el momento de comprar; la fecha indicada al
        inicio de la página identifica la versión vigente.
      </p>

      <SectionHeading sections={sections} id="ley" />
      {jurisdictionClause("Estos términos y las compras realizadas a través del Sitio").map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </LegalLayout>
  );
}

function ProductRows({ main, pack }: ProductLine) {
  return (
    <>
      <TableRow>
        <TableHead scope="row">{includedName(main)}</TableHead>
        <TableCell>
          {main.composition.pdfCount} archivos PDF, {main.composition.pageCount} páginas en total
        </TableCell>
        <TableCell>PDF en A4, para imprimir</TableCell>
        <TableCell>{main.composition.ageRange}</TableCell>
      </TableRow>
      {pack ? (
        <TableRow>
          <TableHead scope="row">{pack.name} (opcional)</TableHead>
          <TableCell>
            {pack.composition.pdfCount} archivos PDF, {pack.composition.pageCount} páginas
            {pack.composition.visibleResources ? `, ${pack.composition.visibleResources} recursos` : ""}
          </TableCell>
          <TableCell>PDF en A4, para imprimir</TableCell>
          <TableCell>{pack.composition.ageRange}</TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

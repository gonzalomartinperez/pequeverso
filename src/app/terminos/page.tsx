import { formatUsd, guaranteeDays, hotmart, localCurrencyNote } from "@config/commerce";
import { seller, sellerIdentityPending, sellerLawPending } from "@content/es/legal/seller";
import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/layout/legal-layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildMetadata } from "@/lib/metadata";
import { coreProducts, offerProducts } from "@/products";
import type { CoreProduct, OfferProduct } from "@/products/schema";

export const metadata: Metadata = buildMetadata({
  path: "/terminos/",
  title: "Términos de compra",
  description:
    "Condiciones de compra de los materiales digitales de Pequeverso a través de Hotmart: precio en moneda local, entrega, licencia de uso, garantía y desistimiento.",
  noindex: true,
});

const sections = [
  { id: "partes", title: "Quién vende y quién cobra" },
  { id: "producto", title: "Qué compras" },
  { id: "precio", title: "Precio, moneda e impuestos" },
  { id: "entrega", title: "Entrega y acceso" },
  { id: "ofertas", title: "Ofertas después de la compra" },
  { id: "licencia", title: "Licencia de uso" },
  { id: "garantia", title: "Garantía de reembolso" },
  { id: "desistimiento", title: "Derecho de desistimiento" },
  { id: "soporte", title: "Soporte" },
  { id: "cambios", title: "Cambios en estos términos" },
  { id: "ley", title: "Legislación aplicable" },
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
      intro="Condiciones que aplican a la compra de los materiales digitales de Pequeverso a través de Hotmart. Al pulsar el botón de compra y confirmar el pago en Hotmart, aceptas estos términos y los de Hotmart."
      updatedAt={seller.updatedAt}
      sections={sections}
    >
      <h2 id="partes">Quién vende y quién cobra</h2>
      <dl>
        <dt>Vendedor</dt>
        <dd>
          {sellerIdentityPending
            ? `El titular de la marca ${seller.brand} (razón social pendiente de publicación)`
            : `${seller.legalName}, titular de la marca ${seller.brand}`}
          . Crea y publica los materiales y atiende el soporte por correo. Datos completos en el{" "}
          <Link href="/aviso-legal/">Aviso legal</Link>.
        </dd>
        <dt>Plataforma de pago y entrega</dt>
        <dd>
          <strong>Hotmart</strong> actúa como intermediaria y facilitadora de pago: muestra el precio en tu
          moneda, cobra, emite el comprobante, entrega el acceso digital y gestiona los reembolsos conforme a
          sus propios términos de compra, que aceptas en su página de pago. Para compradores fuera de Brasil y
          Estados Unidos la entidad contratante es Hotmart B.V. (Ámsterdam, Países Bajos). {seller.brand}{" "}
          nunca ve tus datos de tarjeta ni de otros medios de pago.
        </dd>
      </dl>

      <h2 id="producto">Qué compras</h2>
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
        cada página del sitio (archivos, páginas, recursos) es lo que recibes. Son materiales de práctica
        complementaria: no se prometen resultados de aprendizaje ni plazos.
      </p>

      <h2 id="precio">Precio, moneda e impuestos</h2>
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
          <strong>Moneda local.</strong> Hotmart muestra el precio en tu moneda local; la conversión se
          realiza automáticamente dentro de la plataforma con el tipo de cambio del momento, así que el
          importe en moneda local puede variar ligeramente de un día a otro. Tu banco puede aplicar su propio
          tipo de cambio o una comisión si trata la operación como compra internacional.
        </li>
        <li>
          <strong>Impuestos.</strong> Algunos países aplican impuestos a las compras internacionales (IVA, VAT
          u otros). Hotmart los calcula, los añade y los detalla en la página de pago y en el comprobante.
        </li>
        <li>
          <strong>Medios de pago.</strong> Dependen del país: tarjeta, PayPal, Google Pay o Apple Pay y medios
          locales como Pix, OXXO o Baloto, según Hotmart los ofrezca. El cargo aparecerá a nombre de Hotmart
          en el extracto de tu tarjeta o cuenta.
        </li>
        <li>
          <strong>Total final.</strong> El importe que ves en la página de pago de Hotmart antes de confirmar
          es el total que se cobra y prevalece sobre cualquier cifra de este sitio.
        </li>
      </ul>

      <h2 id="entrega">Entrega y acceso</h2>
      <ol>
        <li>
          Tras la aprobación del pago, Hotmart envía el acceso al correo electrónico usado en la compra.
        </li>
        <li>
          Puedes descargar los archivos desde <a href={hotmart.consumerArea}>consumer.hotmart.com</a> con ese
          mismo correo, cuantas veces necesites.
        </li>
        <li>
          Con medios de pago no inmediatos (por ejemplo, boleto, transferencia o efectivo), el acceso se
          libera cuando el pago se confirma; Hotmart avisa por correo.
        </li>
      </ol>
      <p>
        Si no encuentras el correo o compraste con otra dirección, sigue los pasos de{" "}
        <Link href="/compras-y-reembolsos/">Compras y reembolsos</Link> o escríbenos.
      </p>

      <h2 id="ofertas">Ofertas después de la compra</h2>
      <p>
        Tras confirmar la compra principal, Hotmart puede mostrarte dentro de nuestra página una oferta
        opcional con botones Sí / No gestionados por Hotmart. Aceptarla genera una compra separada, con su
        propio comprobante, la misma garantía y las mismas condiciones. Declinarla no modifica tu compra
        principal.
      </p>

      <h2 id="licencia">Licencia de uso</h2>
      <p>
        La compra concede una licencia <strong>personal, familiar e intransferible</strong> sobre los
        archivos. Los materiales siguen siendo propiedad de su titular.
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

      <h2 id="garantia">Garantía de reembolso</h2>
      <p>
        Dispones de <strong>{guaranteeDays} días</strong> desde la compra para solicitar el reembolso a través
        de Hotmart, sin necesidad de justificar el motivo. La solicitud se hace en{" "}
        <a href={hotmart.refunds}>refund.hotmart.com</a> con el correo de la compra y el número de transacción
        (empieza con HP), o escribiéndonos y la gestionamos contigo. Hotmart nos da cinco días para responder
        a la solicitud; si no respondemos, el reembolso se aprueba automáticamente. El importe vuelve siempre
        por el mismo medio de pago, en los plazos de Hotmart (hasta 30 días en cuenta bancaria y hasta 90 días
        en tarjeta, según el emisor).
      </p>
      <p>
        Si resides en la Unión Europea, Hotmart aplica el plazo mínimo que exige la normativa de consumo para
        contenidos digitales; el plazo aplicable se indica en la página de pago y prevalece si es mayor. Paso
        a paso en <Link href="/compras-y-reembolsos/">Compras y reembolsos</Link>.
      </p>

      <h2 id="desistimiento">Derecho de desistimiento</h2>
      <p>
        Si compras como consumidor en España o en otro país de la Unión Europea, tienes el derecho legal de
        desistimiento de 14 días para compras a distancia. En el caso de contenido digital que no se entrega
        en soporte físico, la ley prevé que ese derecho pueda no aplicarse una vez que la entrega ha comenzado
        con tu consentimiento expreso y tu conocimiento de esa consecuencia (art. 103 m del texto refundido de
        la Ley General para la Defensa de los Consumidores y Usuarios, RDL 1/2007). Ese consentimiento se
        recoge, cuando procede, en la página de pago de Hotmart; nosotros no lo excluimos por nuestra cuenta.
      </p>
      <p>
        En América Latina aplican los plazos de tu país. Por ejemplo, en Argentina la Ley 24.240 (art. 34)
        reconoce 10 días corridos para revocar una compra a distancia; en Colombia la Ley 1480 (art. 47) prevé
        un retracto de 5 días hábiles; en México la Ley Federal de Protección al Consumidor exige información
        clara antes de la compra y canales de reclamación. Cuando la ley de tu país reconozca un plazo mayor
        que nuestra garantía, se aplica ese plazo.
      </p>
      <p>
        En cualquier caso, la garantía de {guaranteeDays} días descrita arriba se aplica con independencia de
        esos derechos, y toda solicitud (desistimiento, retracto, arrepentimiento o garantía) se gestiona en{" "}
        <a href={hotmart.refunds}>refund.hotmart.com</a> o escribiéndonos a{" "}
        <a href={`mailto:${seller.supportEmail}`}>{seller.supportEmail}</a>. Nada de lo aquí escrito reduce
        los derechos que te reconozca la normativa de protección al consumidor de tu país de residencia.
      </p>

      <h2 id="soporte">Soporte</h2>
      <p>
        Para dudas de acceso, uso del material o reembolsos, escribe a{" "}
        <a href={`mailto:${seller.supportEmail}`}>{seller.supportEmail}</a>. Respondemos normalmente en{" "}
        {seller.responseTime}. No podemos ver ni modificar datos de pago ni cambiar el correo de una compra:
        esas gestiones las realiza Hotmart desde su centro de ayuda. Más rutas en{" "}
        <Link href="/soporte/">Soporte y contacto</Link>.
      </p>

      <h2 id="cambios">Cambios en estos términos</h2>
      <p>
        Podemos actualizar estos términos, por ejemplo si cambia un producto o un proceso de Hotmart. A cada
        compra se le aplican los términos publicados en el momento de comprar; la fecha del inicio de la
        página indica la versión vigente.
      </p>

      <h2 id="ley">Legislación aplicable</h2>
      {sellerLawPending ? (
        <p>
          Estos términos se rigen por la legislación del país de establecimiento del vendedor, que se
          publicará en esta página y en el <Link href="/aviso-legal/">Aviso legal</Link> en cuanto se complete
          la verificación de sus datos. Si compras como consumidor, conservas en todo caso los derechos que te
          reconoce la normativa de protección al consumidor de tu país de residencia.
        </p>
      ) : (
        <p>
          Estos términos se rigen por la legislación de {seller.country}. Para cualquier controversia, y salvo
          que la normativa de protección al consumidor de tu país de residencia establezca otra cosa, serán
          competentes los tribunales de {seller.jurisdiction}.
        </p>
      )}
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

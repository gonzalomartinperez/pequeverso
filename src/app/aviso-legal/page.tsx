import { site } from "@config/site";
import { seller, sellerField, sellerIdentityPending, sellerLawPending } from "@content/es/legal/seller";
import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/layout/legal-layout";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/aviso-legal/",
  title: "Aviso legal",
  description:
    "Identificación del titular de pequeverso.com, condiciones de uso del sitio, propiedad intelectual y legislación aplicable.",
  noindex: true,
});

const sections = [
  { id: "titular", title: "Titular del sitio" },
  { id: "contacto", title: "Contacto" },
  { id: "objeto", title: "Objeto del sitio" },
  { id: "hotmart", title: "Compras a través de Hotmart" },
  { id: "propiedad", title: "Propiedad intelectual" },
  { id: "uso", title: "Uso del sitio y responsabilidad" },
  { id: "terceros", title: "Enlaces a terceros" },
  { id: "accesibilidad", title: "Accesibilidad" },
  { id: "ley", title: "Legislación aplicable" },
];

export default function AvisoLegalPage() {
  return (
    <LegalLayout
      title="Aviso legal"
      intro="Quién está detrás de pequeverso.com, para qué sirve este sitio y bajo qué condiciones se utiliza."
      updatedAt={seller.updatedAt}
      sections={sections}
    >
      <h2 id="titular">Titular del sitio</h2>
      <p>
        <strong>{seller.brand}</strong> es la marca bajo la que se publican este sitio y los materiales
        educativos que se venden a través de Hotmart.
      </p>
      <dl>
        <dt>Marca</dt>
        <dd>{seller.brand}</dd>
        <dt>Titular</dt>
        <dd>{sellerField(seller.legalName)}</dd>
        <dt>Identificación fiscal</dt>
        <dd>{sellerField(seller.taxId)}</dd>
        <dt>Domicilio</dt>
        <dd>{sellerField(seller.address)}</dd>
        <dt>Sitio web</dt>
        <dd>{site.url}</dd>
      </dl>
      {sellerIdentityPending ? (
        <p>
          Los datos identificativos marcados como pendientes se publicarán en esta misma página en cuanto se
          complete su verificación. Mientras tanto, puedes escribirnos por correo para cualquier consulta.
        </p>
      ) : null}

      <h2 id="contacto">Contacto</h2>
      <p>
        Un único correo atiende todas las consultas (soporte, dudas sobre los materiales y solicitudes
        relacionadas con tus datos personales):{" "}
        <a href={`mailto:${seller.supportEmail}`}>{seller.supportEmail}</a>. Respondemos normalmente en{" "}
        {seller.responseTime}. Encontrarás más ayuda en <Link href="/soporte/">Soporte y contacto</Link>.
      </p>

      <h2 id="objeto">Objeto del sitio</h2>
      <p>
        Este sitio presenta materiales educativos digitales imprimibles para familias con niños de
        aproximadamente 3 a 7 años. Los materiales son un complemento para la práctica en casa: no sustituyen
        la escuela, una terapia ni el criterio de un profesional, y no garantizan resultados de aprendizaje.
      </p>

      <h2 id="hotmart">Compras a través de Hotmart</h2>
      <p>
        Los productos se venden a través de la plataforma Hotmart, que procesa el pago, calcula los impuestos
        según el país del comprador, convierte el precio a tu moneda local, entrega el acceso digital y
        gestiona las solicitudes de reembolso. {seller.brand} no recibe ni almacena datos de tarjetas ni de
        otros medios de pago. Las condiciones de compra se detallan en{" "}
        <Link href="/terminos/">Términos de compra</Link> y en{" "}
        <Link href="/compras-y-reembolsos/">Compras y reembolsos</Link>.
      </p>

      <h2 id="propiedad">Propiedad intelectual</h2>
      <p>
        El nombre {seller.brand}, el logotipo, los textos, las ilustraciones, las fotografías, los vídeos y
        los materiales imprimibles (PDF) son propiedad de su titular o se usan con autorización, y están
        protegidos por la legislación de propiedad intelectual e industrial.
      </p>
      <p>
        La compra de un material concede una <strong>licencia de uso personal y familiar</strong>: puedes
        imprimirlo en casa cuantas veces necesites para los niños a tu cargo. No está permitido revenderlo,
        redistribuirlo, compartir los archivos, publicarlos en internet ni usarlos para crear productos
        derivados. Los docentes pueden usarlo como recurso complementario con su propio grupo; el uso en
        centros o instituciones a mayor escala requiere autorización previa por escrito. El detalle completo
        está en la sección “Licencia de uso” de los <Link href="/terminos/">Términos de compra</Link>.
      </p>

      <h2 id="uso">Uso del sitio y responsabilidad</h2>
      <p>
        Puedes navegar por el sitio sin registrarte. Te pedimos que no lo utilices para fines ilícitos, que no
        intentes acceder a archivos no publicados ni interfieras con su funcionamiento.
      </p>
      <p>
        Trabajamos para que la información del sitio sea exacta y esté actualizada. El precio final, los
        impuestos, la conversión de moneda y los medios de pago los determina Hotmart en su página de pago, y
        son los que prevalecen en caso de diferencia. No garantizamos la disponibilidad ininterrumpida del
        sitio y no respondemos por daños derivados de causas ajenas a nuestro control razonable.
      </p>

      <h2 id="terceros">Enlaces a terceros</h2>
      <p>
        El sitio enlaza a servicios de terceros con sus propias condiciones y políticas de privacidad: Hotmart
        (página de pago, área de compras y reembolsos) y nuestros perfiles en redes sociales, enlazados desde
        el pie de página. No controlamos su contenido ni respondemos por él; te recomendamos revisar sus
        condiciones antes de usarlos.
      </p>

      <h2 id="accesibilidad">Accesibilidad</h2>
      <p>
        Diseñamos y probamos este sitio tomando como referencia las pautas WCAG 2.2 en su nivel AA (contraste,
        navegación por teclado, objetivos táctiles, movimiento reducido y alternativas de texto). Si
        encuentras una barrera, escríbenos a{" "}
        <a href={`mailto:${seller.supportEmail}`}>{seller.supportEmail}</a> e intentaremos resolverla.
      </p>

      <h2 id="ley">Legislación aplicable</h2>
      {sellerLawPending ? (
        <p>
          Este aviso se rige por la legislación del país de establecimiento del titular, que se publicará en
          esta página junto con los datos identificativos pendientes. En cualquier caso, si compras como
          consumidor conservas los derechos que te reconoce la normativa de protección al consumidor de tu
          país de residencia.
        </p>
      ) : (
        <p>
          Este aviso se rige por la legislación de {seller.country}. Para cualquier controversia, y salvo que
          la normativa de protección al consumidor del país del comprador establezca otra cosa, serán
          competentes los tribunales de {seller.jurisdiction}.
        </p>
      )}
    </LegalLayout>
  );
}

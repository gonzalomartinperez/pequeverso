import {
  consumerAuthority,
  jurisdictionClause,
  provincialConsumerAuthority,
} from "@content/es/legal/argentina";
import { seller } from "@content/es/legal/seller";
import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, type Section, SectionHeading } from "@/components/layout/legal-layout";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/aviso-legal/",
  title: "Aviso legal",
  description:
    "Identificación del titular de pequeverso.com, condiciones de uso del sitio, propiedad intelectual, ley aplicable y jurisdicción.",
  noindex: true,
});

const sections: readonly Section[] = [
  { id: "titular", title: "Identificación del Titular" },
  { id: "definiciones", title: "Definiciones" },
  { id: "contacto", title: "Contacto" },
  { id: "objeto", title: "Objeto del Sitio" },
  { id: "hotmart", title: "Compras a través de Hotmart" },
  { id: "propiedad", title: "Propiedad intelectual" },
  { id: "uso", title: "Condiciones de uso y responsabilidad" },
  { id: "terceros", title: "Enlaces a terceros" },
  { id: "consumidor", title: "Defensa del consumidor" },
  { id: "accesibilidad", title: "Accesibilidad" },
  { id: "ley", title: "Ley aplicable y jurisdicción" },
];

export default function AvisoLegalPage() {
  return (
    <LegalLayout
      title="Aviso legal"
      intro="Quién es el titular de pequeverso.com, para qué sirve este sitio y bajo qué condiciones se utiliza."
      updatedAt={seller.updatedAt}
      sections={sections}
    >
      <SectionHeading sections={sections} id="titular" />
      <p>
        El sitio web pequeverso.com (el “Sitio”) y la marca <strong>{seller.brand}</strong> son titularidad de
        la persona que se identifica a continuación, en cumplimiento del deber de información al consumidor
        (art. 4 de la Ley 24.240 de Defensa del Consumidor, art. 1100 del Código Civil y Comercial de la
        Nación y Resolución SCI 270/2020, que incorpora la Resolución GMC 37/19 del MERCOSUR sobre comercio
        electrónico).
      </p>
      <dl>
        <dt>Titular</dt>
        <dd>
          {seller.legalName} ({seller.personType})
        </dd>
        <dt>{seller.taxIdLabel}</dt>
        <dd>{seller.taxId}</dd>
        <dt>Domicilio</dt>
        <dd>{seller.address}</dd>
        <dt>Correo electrónico (principal)</dt>
        <dd>
          <a href={`mailto:${seller.supportEmail}`}>{seller.supportEmail}</a>
        </dd>
        <dt>{seller.legalEmailLabel}</dt>
        <dd>
          <a href={`mailto:${seller.legalEmail}`}>{seller.legalEmail}</a>
        </dd>
        <dt>Marca comercial</dt>
        <dd>{seller.brand}</dd>
      </dl>

      <SectionHeading sections={sections} id="definiciones" />
      <dl>
        <dt>Titular</dt>
        <dd>{seller.legalName}, identificado en la sección anterior.</dd>
        <dt>Sitio</dt>
        <dd>El sitio web pequeverso.com y todas sus páginas.</dd>
        <dt>Usuario</dt>
        <dd>Toda persona que navega por el Sitio.</dd>
        <dt>Comprador</dt>
        <dd>El Usuario que adquiere un material digital a través de Hotmart.</dd>
        <dt>Hotmart</dt>
        <dd>
          La plataforma de terceros que procesa el pago, emite el comprobante, entrega el acceso a los
          archivos y gestiona los reembolsos.
        </dd>
      </dl>

      <SectionHeading sections={sections} id="contacto" />
      <p>
        El canal principal para todas las consultas (soporte, dudas sobre los materiales, solicitudes sobre
        datos personales y pedidos de arrepentimiento) es{" "}
        <a href={`mailto:${seller.supportEmail}`}>{seller.supportEmail}</a>. El Titular responde normalmente
        en {seller.responseTime}. También puedes escribir a{" "}
        <a href={`mailto:${seller.legalEmail}`}>{seller.legalEmail}</a>, el correo registrado en su cuenta de
        Hotmart, al que Hotmart reenvía los contactos de los compradores. Hay más ayuda en{" "}
        <Link href="/soporte/">Soporte y contacto</Link>.
      </p>

      <SectionHeading sections={sections} id="objeto" />
      <p>
        El Sitio presenta materiales educativos digitales imprimibles para familias con niños de
        aproximadamente 3 a 7 años. Los materiales son un complemento para la práctica en casa: no sustituyen
        la escuela, una terapia ni el criterio de un profesional, y no aseguran resultados de aprendizaje.
      </p>

      <SectionHeading sections={sections} id="hotmart" />
      <p>
        Los materiales se venden a través de Hotmart, que procesa el pago, calcula los impuestos según el país
        del Comprador, convierte el precio a su moneda, entrega el acceso digital y gestiona los reembolsos.
        El Titular no recibe ni almacena datos de tarjetas ni de otros medios de pago. Las condiciones de
        compra se detallan en los <Link href="/terminos/">Términos de compra</Link> y en{" "}
        <Link href="/compras-y-reembolsos/">Compras y reembolsos</Link>.
      </p>

      <SectionHeading sections={sections} id="propiedad" />
      <p>
        El nombre {seller.brand}, el logotipo, los textos, las ilustraciones, las fotografías, los videos y
        los materiales imprimibles (PDF) pertenecen al Titular o se usan con autorización, y están protegidos
        por la Ley 11.723 de Propiedad Intelectual, la Ley 22.362 de Marcas y los tratados internacionales
        aplicables. Los videos de demostración del Sitio son ilustrativos y, en ocasiones, están generados con
        inteligencia artificial.
      </p>
      <p>
        La compra de un material concede una <strong>licencia de uso personal y familiar</strong>, cuyo
        alcance completo figura en la sección “Licencia de uso” de los{" "}
        <Link href="/terminos/">Términos de compra</Link>. Queda prohibida cualquier reproducción,
        distribución o comunicación pública que exceda esa licencia sin autorización previa y por escrito del
        Titular.
      </p>

      <SectionHeading sections={sections} id="uso" />
      <p>
        El Sitio puede navegarse sin registro. El Usuario se compromete a no utilizarlo con fines ilícitos, a
        no intentar acceder a archivos no publicados y a no interferir en su funcionamiento.
      </p>
      <p>
        El Titular procura que la información del Sitio sea exacta y esté actualizada. El precio final, los
        impuestos, la conversión de moneda y los medios de pago los determina Hotmart en su página de pago, y
        prevalecen en caso de diferencia. El Titular no asegura la disponibilidad ininterrumpida del Sitio.
        Nada de lo aquí dispuesto limita la responsabilidad que la ley atribuye al proveedor frente al
        consumidor.
      </p>

      <SectionHeading sections={sections} id="terceros" />
      <p>
        El Sitio enlaza a servicios de terceros con sus propias condiciones y políticas de privacidad: Hotmart
        (página de pago, área de compras y reembolsos), las autoridades de defensa del consumidor y de
        protección de datos, y los perfiles de {seller.brand} en redes sociales. El Titular no controla el
        contenido de esos sitios; conviene revisar sus condiciones antes de usarlos.
      </p>

      <SectionHeading sections={sections} id="consumidor" />
      <p>
        Si compraste como consumidor, puedes revocar la compra a través del{" "}
        <Link href="/arrepentimiento/">Botón de arrepentimiento</Link>. Si tienes un reclamo que no se
        resolvió por correo, puedes presentarlo ante la autoridad de defensa del consumidor: en la República
        Argentina, ante <a href={consumerAuthority.url}>{consumerAuthority.name}</a> o ante la{" "}
        <a href={provincialConsumerAuthority.url}>{provincialConsumerAuthority.name}</a>. Si resides en otro
        país, puedes acudir a la autoridad de consumo de tu país; la{" "}
        <Link href="/arrepentimiento/#paises">referencia por país</Link> reúne los enlaces oficiales.
      </p>

      <SectionHeading sections={sections} id="accesibilidad" />
      <p>
        El Sitio se diseña y prueba tomando como referencia las pautas WCAG 2.2 en su nivel AA (contraste,
        navegación por teclado, objetivos táctiles, movimiento reducido y alternativas de texto). Si
        encuentras una barrera, escríbenos a{" "}
        <a href={`mailto:${seller.supportEmail}`}>{seller.supportEmail}</a> y trataremos de resolverla.
      </p>

      <SectionHeading sections={sections} id="ley" />
      {jurisdictionClause("Este aviso legal y el uso del Sitio").map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </LegalLayout>
  );
}

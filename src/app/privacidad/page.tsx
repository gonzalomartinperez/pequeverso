import { dataAuthority } from "@content/es/legal/argentina";
import { seller, sellerIdentity } from "@content/es/legal/seller";
import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/blocks/notice";
import { LegalLayout, type Section, SectionHeading } from "@/components/layout/legal-layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/privacidad/",
  title: "Política de privacidad",
  description:
    "Qué datos personales se tratan en pequeverso.com, con qué finalidad, con quién se comparten, cuánto se conservan y cómo ejercer tus derechos según la Ley 25.326.",
  noindex: true,
});

const sections: readonly Section[] = [
  { id: "responsable", title: "Responsable del tratamiento" },
  { id: "marco", title: "Marco normativo" },
  { id: "datos", title: "Datos que se tratan" },
  { id: "finalidades", title: "Finalidades y fundamento" },
  { id: "destinatarios", title: "Destinatarios" },
  { id: "transferencias", title: "Transferencias internacionales" },
  { id: "conservacion", title: "Conservación" },
  { id: "derechos", title: "Derechos del titular de los datos" },
  { id: "otros-paises", title: "Usuarios de otros países" },
  { id: "seguridad", title: "Seguridad" },
  { id: "menores", title: "Menores de edad" },
  { id: "cambios", title: "Modificaciones" },
];

const purposes = [
  {
    purpose: "Medir las campañas publicitarias y el interés en los productos (Meta Pixel)",
    basis:
      "Información previa en el banner y oposición en cualquier momento: “Rechazar” en el banner o “Configurar cookies” en el pie de página",
  },
  {
    purpose: "Atender consultas, soporte posventa, reembolsos y pedidos de arrepentimiento",
    basis: "Relación contractual con el Comprador y tu propia solicitud (art. 5, inc. 2 d, Ley 25.326)",
  },
  {
    purpose: "Atender solicitudes de acceso, rectificación, actualización o supresión",
    basis: "Cumplimiento de una obligación legal (arts. 14 a 16, Ley 25.326)",
  },
  {
    purpose: "Seguridad del Sitio y registros técnicos del alojamiento",
    basis: "Necesidad técnica de prestar el servicio de forma segura",
  },
];

const retention = [
  { data: "Tu elección de cookies (pv_consent)", period: "6 meses, o hasta que la cambies" },
  { data: "Cookies de Meta (_fbp, _fbc)", period: "Hasta 90 días desde la última visita, según Meta" },
  {
    data: "Correos de soporte y pedidos de arrepentimiento",
    period:
      "Mientras dure la consulta y, después, el plazo necesario para atender reclamos o cumplir obligaciones legales",
  },
  {
    data: "Datos de compra y facturación",
    period: "Los conserva Hotmart según sus plazos legales y contables",
  },
  { data: "Registros técnicos del alojamiento", period: "Plazos técnicos breves definidos por el proveedor" },
];

const recipients = [
  {
    name: "Hotmart",
    text: "Hotmart B.V. (Ámsterdam, Países Bajos) para compradores fuera de Brasil y Estados Unidos, y sus entidades de pago según el país: procesan la compra, la conversión de moneda, los impuestos, la entrega y los reembolsos como responsables independientes.",
  },
  {
    name: "Meta Platforms Ireland Ltd.",
    text: "Medición de campañas mediante el píxel de Meta, salvo que te opongas.",
  },
  {
    name: "Hostinger International Ltd.",
    text: "Alojamiento del Sitio y registros técnicos, por cuenta del Titular.",
  },
  {
    name: "Cloudflare, Inc.",
    text: "Gestión del dominio y DNS; cuando actúa como proxy, distribución del Sitio (CDN) y registros técnicos, por cuenta del Titular.",
  },
  {
    name: "Proveedor de correo electrónico (Google)",
    text: "Gestión del buzón con el que se atienden las consultas, por cuenta del Titular.",
  },
];

const rights = [
  {
    name: "Acceso",
    text: "saber si se tratan datos tuyos y obtener la información. Es gratuito a intervalos no inferiores a seis meses y se responde dentro de los 10 días corridos (art. 14, Ley 25.326).",
  },
  {
    name: "Rectificación y actualización",
    text: "corregir datos inexactos, incompletos o desactualizados, dentro de los 5 días hábiles (art. 16).",
  },
  {
    name: "Supresión",
    text: "pedir que se eliminen tus datos cuando no exista una obligación legal o contractual de conservarlos, dentro de los 5 días hábiles (art. 16).",
  },
  {
    name: "Oposición a la medición publicitaria",
    text: "retirar la medición de Meta en cualquier momento desde el banner o el pie de página, sin necesidad de escribir.",
  },
];

/** Examples only: the rights apply when the buyer's own law applies; no threshold is claimed. */
const foreignDataLaws = [
  "Brasil: Lei Geral de Proteção de Dados (Lei 13.709/2018).",
  "Chile: Ley 19.628 sobre protección de la vida privada.",
  "Colombia: Ley Estatutaria 1581 de 2012.",
  "España y la Unión Europea: Reglamento General de Protección de Datos (RGPD).",
  "Estados Unidos: leyes estatales de privacidad, como la CCPA/CPRA para residentes de California.",
  "México: Ley Federal de Protección de Datos Personales en Posesión de los Particulares.",
  "Perú: Ley 29733 de Protección de Datos Personales.",
];

export default function PrivacidadPage() {
  return (
    <LegalLayout
      title="Política de privacidad"
      intro="El Sitio trata muy pocos datos personales. Esta política explica cuáles, para qué, con quién se comparten y cómo ejercer tus derechos."
      updatedAt={seller.updatedAt}
      sections={sections}
    >
      <SectionHeading sections={sections} id="responsable" />
      <dl>
        <dt>Responsable</dt>
        <dd>
          {sellerIdentity}, titular de la marca {seller.brand} (el “Titular”)
        </dd>
        <dt>Domicilio</dt>
        <dd>{seller.address}</dd>
        <dt>Contacto</dt>
        <dd>
          <a href={`mailto:${seller.privacyEmail}`}>{seller.privacyEmail}</a>
        </dd>
      </dl>
      <p>
        Hotmart actúa como <strong>responsable independiente</strong> de los datos que recoge en su página de
        pago y en su área de compras (identidad, facturación, medio de pago), conforme a su propia política de
        privacidad, que aceptas al comprar.
      </p>

      <SectionHeading sections={sections} id="marco" />
      <p>
        El tratamiento se rige por la Ley 25.326 de Protección de los Datos Personales de la República
        Argentina y su Decreto reglamentario 1558/2001. El órgano de control es la{" "}
        <a href={dataAuthority.url}>{dataAuthority.name}</a>. Los datos de Usuarios y Compradores de cualquier
        país se tratan conforme a esta ley; si resides en un país con su propia ley de protección de datos,
        puedes ejercer además los derechos que esa ley te reconozca (ver{" "}
        <a href="#otros-paises">Usuarios de otros países</a>).
      </p>

      <SectionHeading sections={sections} id="datos" />
      <dl>
        <dt>Navegación</dt>
        <dd>
          Salvo que te opongas, Meta recibe identificadores de navegación (cookies <code>_fbp</code> y{" "}
          <code>_fbc</code>, dirección IP, agente de usuario) y eventos del Sitio: página vista, interés en el
          producto y clic hacia la página de pago, tanto desde tu navegador como, para que la medición sea
          fiable, a través del servidor del Sitio (API de conversiones de Meta) con los mismos datos. Si te
          opones, la medición se desactiva por ambas vías y no se carga ningún script de Meta en tus próximas
          visitas. No se envían a Meta tu nombre, tu correo ni datos de compra. Detalle en la{" "}
          <Link href="/cookies/">Política de cookies</Link>.
        </dd>
        <dt>Compra</dt>
        <dd>
          El pago y la entrega se realizan en Hotmart. El Titular nunca ve datos de tarjetas ni de otros
          medios de pago. Hotmart le facilita tu nombre, tu correo electrónico y los datos de la transacción
          (producto, fecha, código, estado) para darte soporte y atender reembolsos.
        </dd>
        <dt>Soporte y arrepentimiento</dt>
        <dd>
          Si escribes, se tratan tu correo electrónico y el contenido del mensaje (incluido, si lo indicas, el
          código de transacción de Hotmart) para responderte.
        </dd>
        <dt>Registros técnicos</dt>
        <dd>
          El proveedor de alojamiento registra de forma automática la dirección IP, la fecha y la página
          solicitada para garantizar la seguridad del servicio.
        </dd>
      </dl>
      <p>
        No se tratan datos sensibles. Facilitar los datos de contacto es voluntario, pero sin ellos no es
        posible responder a tu consulta.
      </p>

      <SectionHeading sections={sections} id="finalidades" />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Finalidad</TableHead>
            <TableHead scope="col">Fundamento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purposes.map((row) => (
            <TableRow key={row.purpose}>
              <TableCell>{row.purpose}</TableCell>
              <TableCell>{row.basis}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p>
        No se toman decisiones automatizadas con efectos jurídicos sobre ti ni se elaboran perfiles a partir
        de los datos de soporte o de compra. Los datos no se usan para finalidades distintas de las indicadas.
      </p>

      <SectionHeading sections={sections} id="destinatarios" />
      <dl>
        {recipients.map((recipient) => (
          <DefinitionRow key={recipient.name} term={recipient.name} text={recipient.text} />
        ))}
      </dl>
      <p>
        El Titular no vende ni cede tus datos a otros terceros. Solo los comunicaría a una autoridad cuando
        una obligación legal lo exija.
      </p>

      <SectionHeading sections={sections} id="transferencias" />
      <p>
        Los proveedores indicados tratan datos fuera de la República Argentina. Las transferencias a Hotmart
        B.V. (Países Bajos) y a Meta Platforms Ireland se dirigen a países que la AAIP considera con nivel de
        protección adecuado (Disposición DNPDP 60/2016, modificada por la Resolución AAIP 34/2019). Otros
        proveedores, como Hostinger, Cloudflare, Google o las empresas de Meta en los Estados Unidos, pueden
        tratar datos en países que no figuran en esa lista; en esos casos, la transferencia se apoya en las
        cláusulas contractuales de protección de datos que esos proveedores ofrecen, conforme al art. 12 de la
        Ley 25.326 y a las cláusulas modelo aprobadas por la AAIP. Puedes pedir más detalle por correo.
      </p>

      <SectionHeading sections={sections} id="conservacion" />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Datos</TableHead>
            <TableHead scope="col">Plazo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {retention.map((row) => (
            <TableRow key={row.data}>
              <TableCell>{row.data}</TableCell>
              <TableCell>{row.period}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <SectionHeading sections={sections} id="derechos" />
      <p>Como titular de tus datos personales, puedes ejercer estos derechos sin costo:</p>
      <dl>
        {rights.map((right) => (
          <DefinitionRow key={right.name} term={right.name} text={right.text} />
        ))}
      </dl>
      <h3>Cómo ejercerlos</h3>
      <ol>
        <li>
          Escribe a <a href={`mailto:${seller.privacyEmail}`}>{seller.privacyEmail}</a> indicando qué derecho
          quieres ejercer y el correo con el que escribiste o compraste.
        </li>
        <li>Si es necesario, se te pedirá un dato adicional para confirmar tu identidad.</li>
        <li>La respuesta llega por correo dentro de los plazos legales indicados arriba.</li>
      </ol>
      <p>
        Los datos que Hotmart trata como responsable (compra, facturación, reembolsos) se solicitan
        directamente a Hotmart desde su centro de ayuda; si escribes al Titular, te indicará cómo hacerlo.
      </p>
      <Notice title="Órgano de control (Resolución AAIP 14/2018)">
        <p>{dataAuthority.notice}</p>
        <p>
          <a href={dataAuthority.complaintUrl}>Presentar una denuncia ante la AAIP</a>
        </p>
      </Notice>

      <SectionHeading sections={sections} id="otros-paises" />
      <p>
        El Titular está establecido en la República Argentina y trata los datos de Usuarios de cualquier país
        conforme a la Ley 25.326. Si resides en un país con su propia ley de protección de datos, puedes
        ejercer además los derechos que esa ley te reconozca, escribiendo al mismo correo. Por ejemplo:
      </p>
      <ul>
        {foreignDataLaws.map((law) => (
          <li key={law}>{law}</li>
        ))}
      </ul>
      <p>
        Si resides en la Unión Europea, además de los derechos indicados arriba puedes solicitar la limitación
        del tratamiento y la portabilidad de los datos que facilitaste, y presentar una reclamación ante la
        autoridad de protección de datos de tu país; las solicitudes se atienden, en general, en el plazo de
        un mes. La Comisión Europea reconoce a la República Argentina un nivel de protección adecuado.
      </p>

      <SectionHeading sections={sections} id="seguridad" />
      <p>
        El Sitio se sirve siempre por HTTPS, no almacena contraseñas ni datos de pago y limita los datos que
        trata a los descritos en esta política.
      </p>

      <SectionHeading sections={sections} id="menores" />
      <p>
        El Sitio se dirige a madres, padres, cuidadores y docentes adultos que compran material para niños a
        su cargo. No se piden ni se tratan datos de los niños que usan el material, no se dirige publicidad a
        menores y no se recopilan datos de menores de forma consciente. Si crees que un menor envió datos,
        escribe al correo indicado y se eliminarán.
      </p>

      <SectionHeading sections={sections} id="cambios" />
      <p>
        Si se incorpora una nueva herramienta o cambia un proveedor, el Titular actualizará esta página y la
        fecha indicada al inicio. Si el cambio afecta a las cookies, el banner vuelve a mostrarse para que
        decidas de nuevo.
      </p>
    </LegalLayout>
  );
}

function DefinitionRow({ term, text }: { term: string; text: string }) {
  return (
    <>
      <dt>{term}</dt>
      <dd>{text}</dd>
    </>
  );
}

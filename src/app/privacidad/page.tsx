import { seller, sellerField, sellerIdentityPending } from "@content/es/legal/seller";
import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/layout/LegalLayout/LegalLayout";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/privacidad/",
  title: "Política de privacidad",
  description:
    "Qué datos tratamos en pequeverso.com, con qué finalidad y base legal, con quién se comparten, cuánto se conservan y cómo ejercer tus derechos.",
  noindex: true,
});

const sections = [
  { id: "responsable", title: "Responsable" },
  { id: "datos", title: "Qué datos tratamos" },
  { id: "finalidades", title: "Finalidades y base legal" },
  { id: "destinatarios", title: "Con quién se comparten" },
  { id: "transferencias", title: "Transferencias internacionales" },
  { id: "conservacion", title: "Conservación" },
  { id: "derechos", title: "Tus derechos" },
  { id: "menores", title: "Menores" },
  { id: "cambios", title: "Cambios en esta política" },
];

const purposes = [
  {
    purpose: "Medir nuestras campañas y el interés en el producto (Meta Pixel)",
    basis:
      "Interés legítimo en medir la publicidad, con oposición inmediata: “Rechazar” en el banner o “Configurar cookies” en el pie de página",
  },
  {
    purpose: "Estadísticas agregadas de uso del sitio, sin cookies ni identificación de personas",
    basis:
      "Interés legítimo en mejorar el sitio (solo si la herramienta está activa; ver la política de cookies)",
  },
  {
    purpose: "Atender consultas, soporte posventa y solicitudes de reembolso",
    basis: "Ejecución del contrato de compra y atención de tu solicitud",
  },
  {
    purpose: "Atender solicitudes de derechos sobre tus datos",
    basis: "Cumplimiento de una obligación legal",
  },
  {
    purpose: "Seguridad del sitio y registros técnicos del alojamiento",
    basis: "Interés legítimo en la seguridad y continuidad del servicio",
  },
];

const retention = [
  { data: "Tu elección de cookies (pv_consent)", period: "6 meses, o hasta que la cambies" },
  { data: "Cookies de Meta (_fbp, _fbc)", period: "Hasta 90 días desde la última visita, según Meta" },
  {
    data: "Correos de soporte",
    period: "Mientras dure la consulta y, después, el plazo que exijan las obligaciones legales aplicables",
  },
  {
    data: "Datos de compra y facturación",
    period: "Los conserva Hotmart según sus plazos legales y contables",
  },
  { data: "Registros técnicos del alojamiento", period: "Plazos técnicos breves definidos por el proveedor" },
];

const rights = [
  { name: "Acceso", text: "saber si tratamos datos tuyos y obtener una copia." },
  { name: "Rectificación", text: "corregir datos inexactos o incompletos." },
  { name: "Supresión", text: "pedir que borremos tus datos cuando ya no sean necesarios." },
  {
    name: "Oposición",
    text: "oponerte a un tratamiento basado en interés legítimo, como la medición de campañas.",
  },
  { name: "Limitación", text: "pedir que restrinjamos el tratamiento mientras se resuelve una solicitud." },
  { name: "Portabilidad", text: "recibir los datos que nos diste en un formato de uso común." },
];

export default function PrivacidadPage() {
  return (
    <LegalLayout
      title="Política de privacidad"
      intro="Este sitio trata muy pocos datos. Aquí explicamos cuáles, por qué, con quién se comparten y cómo ejercer tus derechos."
      updatedAt={seller.updatedAt}
      sections={sections}
    >
      <h2 id="responsable">Responsable del tratamiento</h2>
      <dl>
        <dt>Responsable</dt>
        <dd>
          {sellerIdentityPending
            ? `El titular de la marca ${seller.brand} (razón social pendiente de publicación)`
            : `${seller.legalName}, titular de la marca ${seller.brand}`}
        </dd>
        <dt>Identificación fiscal</dt>
        <dd>{sellerField(seller.taxId)}</dd>
        <dt>Domicilio</dt>
        <dd>{sellerField(seller.address)}</dd>
        <dt>Contacto</dt>
        <dd>
          <a href={`mailto:${seller.privacyEmail}`}>{seller.privacyEmail}</a>
        </dd>
      </dl>
      {sellerIdentityPending ? (
        <p>
          Los datos identificativos marcados como pendientes se publicarán aquí y en el{" "}
          <Link href="/aviso-legal/">Aviso legal</Link> en cuanto se complete su verificación.
        </p>
      ) : null}
      <p>
        No hemos designado un delegado de protección de datos porque no es obligatorio en nuestro caso; las
        solicitudes se atienden desde el correo indicado.
      </p>
      <p>
        Hotmart actúa como <strong>responsable independiente</strong> de los datos que recoge en su página de
        pago y en su área de compras (identidad, facturación, medio de pago), conforme a su propia política de
        privacidad, que aceptas al comprar.
      </p>

      <h2 id="datos">Qué datos tratamos</h2>
      <dl>
        <dt>Navegación</dt>
        <dd>
          Salvo que rechaces las cookies de marketing, Meta recibe identificadores de navegación (cookies{" "}
          <code>_fbp</code> y <code>_fbc</code>, dirección IP, agente de usuario) y eventos de este sitio:
          página vista, interés en el producto y clic hacia la página de pago, tanto desde tu navegador como,
          para que la medición sea fiable, a través de nuestro servidor (API de conversiones de Meta) con los
          mismos datos. Si las rechazas, la medición se desactiva por ambas vías y no se carga ningún script de
          Meta en tus próximas visitas. No enviamos a Meta tu nombre, tu correo ni datos de compra.
        </dd>
        <dt>Medición sin cookies</dt>
        <dd>
          Podemos usar una herramienta de analítica agregada que no instala cookies ni identifica personas. Si
          está activa, aparece en la <Link href="/cookies/">política de cookies</Link>.
        </dd>
        <dt>Compra</dt>
        <dd>
          El pago y la entrega se realizan en Hotmart. Nosotros nunca vemos datos de tarjetas ni de otros
          medios de pago. Hotmart nos facilita tu nombre, tu correo electrónico y los datos de la transacción
          (producto, fecha, código, estado) para poder darte soporte y atender reembolsos.
        </dd>
        <dt>Soporte</dt>
        <dd>
          Si nos escribes, tratamos tu correo electrónico y el contenido del mensaje (incluido, si lo indicas,
          el código de transacción de Hotmart) para responderte.
        </dd>
        <dt>Registros técnicos</dt>
        <dd>
          El proveedor de alojamiento registra de forma automática la dirección IP, la fecha y la página
          solicitada para garantizar la seguridad del servicio.
        </dd>
      </dl>

      <h2 id="finalidades">Finalidades y base legal</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Finalidad</th>
              <th scope="col">Base legal</th>
            </tr>
          </thead>
          <tbody>
            {purposes.map((row) => (
              <tr key={row.purpose}>
                <td>{row.purpose}</td>
                <td>{row.basis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        No tomamos decisiones automatizadas con efectos jurídicos sobre ti ni elaboramos perfiles a partir de
        los datos de soporte o de compra.
      </p>

      <h2 id="destinatarios">Con quién se comparten</h2>
      <dl>
        <dt>Hotmart</dt>
        <dd>
          Hotmart B.V. (Ámsterdam, Países Bajos) para compradores fuera de Brasil y Estados Unidos, y sus
          entidades de pago según el país: procesan la compra, la conversión de moneda, los impuestos, la
          entrega y los reembolsos como responsables independientes.
        </dd>
        <dt>Meta Platforms Ireland Ltd.</dt>
        <dd>Medición de campañas mediante el píxel de Meta, salvo que la rechaces.</dd>
        <dt>Hostinger International Ltd.</dt>
        <dd>Alojamiento del sitio y registros técnicos, como encargado del tratamiento.</dd>
        <dt>Cloudflare, Inc.</dt>
        <dd>
          Gestión del dominio y DNS; cuando actúa como proxy, distribución del sitio (CDN) y registros
          técnicos, como encargado del tratamiento.
        </dd>
        <dt>Proveedor de correo electrónico</dt>
        <dd>Gestión del buzón con el que atendemos las consultas, como encargado del tratamiento.</dd>
      </dl>
      <p>
        No vendemos ni cedemos tus datos a otros terceros. Solo los comunicaríamos a autoridades cuando una
        obligación legal lo exija.
      </p>

      <h2 id="transferencias">Transferencias internacionales</h2>
      <p>
        Algunos de estos proveedores tratan datos fuera de tu país (por ejemplo, en la Unión Europea o en
        Estados Unidos). Cuando eso ocurre, se apoyan en mecanismos reconocidos, como cláusulas contractuales
        tipo o marcos de adecuación aplicables. Puedes pedirnos más detalle por correo.
      </p>

      <h2 id="conservacion">Conservación</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Datos</th>
              <th scope="col">Plazo</th>
            </tr>
          </thead>
          <tbody>
            {retention.map((row) => (
              <tr key={row.data}>
                <td>{row.data}</td>
                <td>{row.period}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="derechos">Tus derechos</h2>
      <p>
        Según la normativa que te aplique (el RGPD en la Unión Europea o las leyes de protección de datos de
        tu país en América Latina), puedes ejercer estos derechos:
      </p>
      <dl>
        {rights.map((right) => (
          <RightItem key={right.name} {...right} />
        ))}
      </dl>
      <h3>Cómo ejercerlos</h3>
      <ol>
        <li>
          Escribe a <a href={`mailto:${seller.privacyEmail}`}>{seller.privacyEmail}</a> indicando qué derecho
          quieres ejercer y el correo con el que nos contactaste o compraste.
        </li>
        <li>Si es necesario, te pediremos un dato adicional para confirmar tu identidad.</li>
        <li>Respondemos en el plazo legal (en general, un mes) y sin coste.</li>
      </ol>
      <p>
        Para retirar la medición de Meta no hace falta escribirnos: usa “Rechazar” en el banner o el enlace
        “Configurar cookies” del pie de página. Los datos que Hotmart trata como responsable (compra,
        facturación, reembolsos) se solicitan directamente a Hotmart desde su centro de ayuda; si nos
        escribes, te indicamos cómo.
      </p>
      <p>
        Si consideras que no hemos atendido tu solicitud, puedes reclamar ante la autoridad de protección de
        datos de tu país (por ejemplo, la AEPD en España o la AAIP en Argentina).
      </p>

      <h2 id="menores">Menores</h2>
      <p>
        Este sitio se dirige a madres, padres, cuidadores y docentes adultos que compran material para niños a
        su cargo. No pedimos ni tratamos datos de los niños que usan el material, no dirigimos publicidad a
        menores y no recopilamos datos de menores de forma consciente. Si crees que un menor nos ha enviado
        datos, escríbenos y los eliminaremos.
      </p>

      <h2 id="cambios">Cambios en esta política</h2>
      <p>
        Si incorporamos una nueva herramienta o cambiamos un proveedor, actualizaremos esta página y la fecha
        que aparece al inicio. Si el cambio afecta a las cookies, el banner vuelve a mostrarse para que
        decidas de nuevo.
      </p>
    </LegalLayout>
  );
}

function RightItem({ name, text }: { name: string; text: string }) {
  return (
    <>
      <dt>{name}</dt>
      <dd>{text}</dd>
    </>
  );
}

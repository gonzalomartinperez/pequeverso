import { seller } from "@content/es/legal/seller";
import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/LegalLayout/LegalLayout";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/privacidad/",
  title: "Política de privacidad",
  description:
    "Qué datos tratamos en pequeverso.com, con qué finalidad, con quién se comparten y qué derechos tienes.",
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
];

export default function PrivacidadPage() {
  return (
    <LegalLayout
      title="Política de privacidad"
      intro="Este sitio trata muy pocos datos. Aquí explicamos cuáles, por qué y cómo ejercer tus derechos."
      updatedAt={seller.updatedAt}
      sections={sections}
    >
      <h2 id="responsable">Responsable del tratamiento</h2>
      <ul>
        <li>
          {seller.legalName} ({seller.operator}), titular de la marca {seller.brand}
        </li>
        <li>Identificación fiscal: {seller.taxId}</li>
        <li>Domicilio: {seller.address}</li>
        <li>
          Contacto de privacidad: <a href={`mailto:${seller.privacyEmail}`}>{seller.privacyEmail}</a>
        </li>
      </ul>

      <h2 id="datos">Qué datos tratamos</h2>
      <ul>
        <li>
          <strong>Navegación:</strong> si aceptas las cookies de marketing, Meta recibe identificadores de
          navegación (cookies <code>_fbp</code>/<code>_fbc</code>, dirección IP, agente de usuario) y eventos
          de este sitio (página vista, interés en el producto, clic hacia el pago). Si las rechazas, no se
          carga ningún script de Meta.
        </li>
        <li>
          <strong>Medición sin cookies:</strong> podemos usar una herramienta de analítica agregada que no
          instala cookies ni identifica personas (si está activa, aparece en la{" "}
          <Link href="/cookies/">política de cookies</Link>).
        </li>
        <li>
          <strong>Compra:</strong> el pago y la entrega se realizan en Hotmart. Hotmart trata tus datos de
          compra como responsable según su propia política y comparte con nosotros nombre, correo electrónico
          y datos de la transacción para poder darte soporte.
        </li>
        <li>
          <strong>Soporte:</strong> si nos escribes, tratamos tu correo y el contenido del mensaje para
          responderte.
        </li>
      </ul>

      <h2 id="finalidades">Finalidades y base legal</h2>
      <table>
        <thead>
          <tr>
            <th>Finalidad</th>
            <th>Base legal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Medir campañas y comprender el interés en el producto (Meta)</td>
            <td>Tu consentimiento (banner de cookies), revocable en cualquier momento</td>
          </tr>
          <tr>
            <td>Estadísticas agregadas de uso del sitio</td>
            <td>Interés legítimo en mejorar el sitio, sin identificar personas</td>
          </tr>
          <tr>
            <td>Atender consultas y soporte posventa</td>
            <td>Ejecución de la relación contractual y atención de tu solicitud</td>
          </tr>
          <tr>
            <td>Seguridad del sitio y registros técnicos del alojamiento</td>
            <td>Interés legítimo en la seguridad del servicio</td>
          </tr>
        </tbody>
      </table>

      <h2 id="destinatarios">Con quién se comparten</h2>
      <ul>
        <li>
          <strong>Hotmart</strong> (Hotmart B.V., Países Bajos, y sus entidades de pago según la moneda):
          procesa la compra, la entrega y los reembolsos.
        </li>
        <li>
          <strong>Meta Platforms Ireland Ltd.</strong>: medición de campañas, solo con tu consentimiento.
        </li>
        <li>
          <strong>Hostinger International Ltd.</strong>: alojamiento del sitio y registros técnicos.
        </li>
        <li>
          <strong>Proveedor de correo</strong> del titular: gestión de las consultas de soporte.
        </li>
      </ul>

      <h2 id="transferencias">Transferencias internacionales</h2>
      <p>
        Algunos proveedores tratan datos fuera de tu país. Cuando eso ocurre, se apoyan en mecanismos
        reconocidos (cláusulas contractuales tipo o marcos de adecuación aplicables). Puedes pedirnos más
        detalle por correo.
      </p>

      <h2 id="conservacion">Conservación</h2>
      <ul>
        <li>Tu elección de cookies: hasta 6 meses o hasta que la cambies.</li>
        <li>Cookies de Meta: hasta 90 días desde la última visita, según Meta.</li>
        <li>
          Correos de soporte: el tiempo necesario para resolver la consulta y, después, el exigido por
          obligaciones legales.
        </li>
        <li>Datos de compra: los conserva Hotmart según sus plazos legales y contables.</li>
      </ul>

      <h2 id="derechos">Tus derechos</h2>
      <p>
        Puedes acceder, rectificar, suprimir, limitar u oponerte al tratamiento, solicitar la portabilidad y
        retirar tu consentimiento escribiendo a{" "}
        <a href={`mailto:${seller.privacyEmail}`}>{seller.privacyEmail}</a>. También puedes reclamar ante la
        autoridad de protección de datos de tu país (por ejemplo, la AEPD en España o la AAIP en Argentina).
        Para cambiar tu elección de cookies usa el enlace “Configurar cookies” del pie de página.
      </p>

      <h2 id="menores">Menores</h2>
      <p>
        Este sitio se dirige a madres, padres, cuidadores y docentes adultos. No recopilamos datos de menores
        de forma consciente ni dirigimos publicidad a niños.
      </p>
    </LegalLayout>
  );
}

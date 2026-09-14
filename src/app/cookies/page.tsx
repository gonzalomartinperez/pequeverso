import { seller } from "@content/es/legal/seller";
import type { Metadata } from "next";
import { LegalLayout } from "@/components/layout/LegalLayout/LegalLayout";
import { CookieSettingsLink } from "@/features/tracking/CookieSettingsLink";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/cookies/",
  title: "Política de cookies",
  description: "Qué cookies usa pequeverso.com, para qué sirven, cuánto duran y cómo cambiar tu elección.",
  noindex: true,
});

const sections = [
  { id: "que-son", title: "Qué son" },
  { id: "cuales", title: "Cuáles usamos" },
  { id: "elegir", title: "Cómo elegir o cambiar" },
  { id: "hotmart", title: "Cookies de Hotmart" },
];

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Política de cookies"
      intro="Usamos cookies necesarias y, para medir nuestras campañas, el píxel de Meta. Puedes rechazarlo en el banner o desde el pie de página y recordamos tu elección durante seis meses."
      updatedAt={seller.updatedAt}
      sections={sections}
    >
      <h2 id="que-son">Qué son</h2>
      <p>
        Las cookies son pequeños archivos que el navegador guarda cuando visitas un sitio. Permiten recordar
        una elección o reconocer un dispositivo. Por “cookies” también nos referimos a tecnologías
        equivalentes como el almacenamiento local del navegador.
      </p>

      <h2 id="cuales">Cuáles usamos</h2>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Titular</th>
            <th>Finalidad</th>
            <th>Duración</th>
            <th>Tipo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>pv_consent</code>
            </td>
            <td>{seller.brand} (propia)</td>
            <td>Recordar tu elección en el banner de cookies</td>
            <td>6 meses</td>
            <td>Necesaria</td>
          </tr>
          <tr>
            <td>
              <code>_fbp</code>
            </td>
            <td>Meta Platforms Ireland</td>
            <td>Distinguir navegadores para medir campañas (Meta Pixel)</td>
            <td>90 días</td>
            <td>Marketing (puedes rechazarla)</td>
          </tr>
          <tr>
            <td>
              <code>_fbc</code>
            </td>
            <td>Meta Platforms Ireland</td>
            <td>Guardar el identificador de clic de un anuncio de Meta</td>
            <td>90 días</td>
            <td>Marketing (puedes rechazarla)</td>
          </tr>
        </tbody>
      </table>

      <h2 id="elegir">Cómo elegir o cambiar</h2>
      <p>
        El banner ofrece “Aceptar” y “Rechazar” en igualdad de condiciones. Rechazar no limita el uso del
        sitio ni la compra. Puedes cambiar tu decisión cuando quieras: <CookieSettingsLink />. También puedes
        borrar las cookies desde la configuración de tu navegador.
      </p>

      <h2 id="hotmart">Cookies de Hotmart</h2>
      <p>
        La página de pago y el área de compras funcionan en dominios de Hotmart (pay.hotmart.com,
        consumer.hotmart.com) y en el widget de ofertas que Hotmart muestra dentro de este sitio. Esas cookies
        se rigen por la política de cookies de Hotmart.
      </p>
    </LegalLayout>
  );
}

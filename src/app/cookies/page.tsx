import { seller } from "@content/es/legal/seller";
import type { Metadata } from "next";
import Link from "next/link";
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
  { id: "banner", title: "Cómo funciona el banner" },
  { id: "elegir", title: "Cómo cambiar tu elección" },
  { id: "hotmart", title: "Cookies de Hotmart" },
  { id: "cambios", title: "Cambios" },
];

const cookies = [
  {
    name: "pv_consent",
    owner: `${seller.brand} (propia)`,
    purpose:
      "Recordar tu elección en el banner de cookies (también se guarda en el almacenamiento local del navegador)",
    duration: "6 meses",
    type: "Necesaria",
  },
  {
    name: "_fbp",
    owner: "Meta Platforms Ireland",
    purpose: "Distinguir navegadores para medir campañas (Meta Pixel)",
    duration: "90 días",
    type: "Marketing (puedes rechazarla)",
  },
  {
    name: "_fbc",
    owner: "Meta Platforms Ireland",
    purpose: "Guardar el identificador del clic en un anuncio de Meta",
    duration: "90 días",
    type: "Marketing (puedes rechazarla)",
  },
];

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Política de cookies"
      intro="Usamos una cookie necesaria y, para medir nuestras campañas, el píxel de Meta. Puedes rechazarlo en el banner o desde el pie de página; recordamos tu elección durante seis meses."
      updatedAt={seller.updatedAt}
      sections={sections}
    >
      <h2 id="que-son">Qué son</h2>
      <p>
        Las cookies son pequeños archivos que el navegador guarda cuando visitas un sitio. Permiten recordar
        una elección o reconocer un dispositivo. Por “cookies” también nos referimos a tecnologías
        equivalentes, como el almacenamiento local del navegador y los píxeles de medición.
      </p>

      <h2 id="cuales">Cuáles usamos</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Titular</th>
              <th scope="col">Finalidad</th>
              <th scope="col">Duración</th>
              <th scope="col">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {cookies.map((cookie) => (
              <tr key={cookie.name}>
                <th scope="row">
                  <code>{cookie.name}</code>
                </th>
                <td>{cookie.owner}</td>
                <td>{cookie.purpose}</td>
                <td>{cookie.duration}</td>
                <td>{cookie.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        No usamos cookies de analítica con identificadores personales. Si en algún momento añadimos una
        herramienta de estadísticas agregadas sin cookies, la indicaremos aquí y en la{" "}
        <Link href="/privacidad/">política de privacidad</Link>.
      </p>

      <h2 id="banner">Cómo funciona el banner</h2>
      <p>
        El píxel de Meta se activa desde la primera página que visitas para medir nuestras campañas; el banner
        es el control para retirarlo. Ofrece tres opciones en igualdad de condiciones:
      </p>
      <dl>
        <dt>Aceptar</dt>
        <dd>Mantiene la medición y guarda tu elección durante seis meses.</dd>
        <dt>Rechazar</dt>
        <dd>
          Desactiva el píxel en ese momento, descarta los eventos pendientes y evita que el script vuelva a
          cargarse en tus próximas visitas.
        </dd>
        <dt>Configurar</dt>
        <dd>Permite decidir categoría por categoría y guardar la selección.</dd>
      </dl>
      <p>
        Si el píxel no está configurado en este sitio, el banner no aparece y el enlace del pie de página
        muestra un aviso de cookies necesarias.
      </p>

      <h2 id="elegir">Cómo cambiar tu elección</h2>
      <p>
        Rechazar no limita el uso del sitio ni la compra. Puedes cambiar tu decisión cuando quieras:{" "}
        <CookieSettingsLink />. También puedes borrar las cookies y los datos de este sitio desde la
        configuración de tu navegador; en ese caso el banner vuelve a mostrarse en tu siguiente visita.
      </p>

      <h2 id="hotmart">Cookies de Hotmart</h2>
      <p>
        La página de pago y el área de compras funcionan en dominios de Hotmart (pay.hotmart.com,
        consumer.hotmart.com), igual que el widget de ofertas que Hotmart muestra dentro de este sitio después
        de una compra. Esas cookies se rigen por la política de cookies de Hotmart, que puedes consultar en su
        propia página.
      </p>

      <h2 id="cambios">Cambios</h2>
      <p>
        Si incorporamos una nueva herramienta que use cookies, actualizaremos esta tabla y la fecha del inicio
        de la página, y el banner volverá a pedirte una decisión.
      </p>
    </LegalLayout>
  );
}

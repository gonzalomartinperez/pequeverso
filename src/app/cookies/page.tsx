import { seller } from "@content/es/legal/seller";
import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, type Section, SectionHeading } from "@/components/layout/legal-layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CookieSettingsLink } from "@/features/tracking/CookieSettingsLink";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/cookies/",
  title: "Política de cookies",
  description: "Qué cookies usa pequeverso.com, para qué sirven, cuánto duran y cómo cambiar tu elección.",
  noindex: true,
});

const sections: readonly Section[] = [
  { id: "que-son", title: "Qué son las cookies" },
  { id: "cuales", title: "Cookies que usa el Sitio" },
  { id: "banner", title: "Funcionamiento del banner" },
  { id: "elegir", title: "Cómo cambiar tu elección" },
  { id: "hotmart", title: "Cookies de Hotmart" },
  { id: "cambios", title: "Modificaciones" },
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
      intro="El Sitio usa una cookie necesaria y, para medir sus campañas, el píxel de Meta. Puedes rechazarlo en el banner o desde el pie de página; tu elección se recuerda durante seis meses."
      updatedAt={seller.updatedAt}
      sections={sections}
    >
      <p>
        Esta política complementa la <Link href="/privacidad/">Política de privacidad</Link> de pequeverso.com
        (el “Sitio”), cuyo titular es {seller.legalName} (el “Titular”). Consultas:{" "}
        <a href={`mailto:${seller.privacyEmail}`}>{seller.privacyEmail}</a> o{" "}
        <a href={`mailto:${seller.legalEmail}`}>{seller.legalEmail}</a> (correo del titular en su cuenta de
        Hotmart).
      </p>

      <SectionHeading sections={sections} id="que-son" />
      <p>
        Las cookies son pequeños archivos que el navegador guarda cuando visitas un sitio web. Permiten
        recordar una elección o reconocer un dispositivo. En esta política, “cookies” incluye también
        tecnologías equivalentes, como el almacenamiento local del navegador y los píxeles de medición.
      </p>

      <SectionHeading sections={sections} id="cuales" />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Nombre</TableHead>
            <TableHead scope="col">Titular</TableHead>
            <TableHead scope="col">Finalidad</TableHead>
            <TableHead scope="col">Duración</TableHead>
            <TableHead scope="col">Tipo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cookies.map((cookie) => (
            <TableRow key={cookie.name}>
              <TableHead scope="row">
                <code>{cookie.name}</code>
              </TableHead>
              <TableCell>{cookie.owner}</TableCell>
              <TableCell>{cookie.purpose}</TableCell>
              <TableCell>{cookie.duration}</TableCell>
              <TableCell>{cookie.type}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p>
        El Sitio no usa cookies de analítica con identificadores personales. Si en algún momento se incorpora
        una herramienta de estadísticas agregadas sin cookies, se indicará aquí y en la{" "}
        <Link href="/privacidad/">Política de privacidad</Link>.
      </p>

      <SectionHeading sections={sections} id="banner" />
      <p>
        El píxel de Meta se activa desde la primera página que visitas para medir las campañas del Titular; el
        banner es el control para retirarlo. Ofrece tres opciones en igualdad de condiciones:
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
        Si el píxel no está configurado en el Sitio, el banner no aparece y el enlace del pie de página
        muestra un aviso de cookies necesarias.
      </p>

      <SectionHeading sections={sections} id="elegir" />
      <p>
        Rechazar no limita el uso del Sitio ni la compra. Puedes cambiar tu decisión cuando quieras:{" "}
        <CookieSettingsLink />. También puedes borrar las cookies y los datos del Sitio desde la configuración
        de tu navegador; en ese caso, el banner vuelve a mostrarse en tu siguiente visita.
      </p>

      <SectionHeading sections={sections} id="hotmart" />
      <p>
        La página de pago y el área de compras funcionan en dominios de Hotmart (pay.hotmart.com,
        consumer.hotmart.com), igual que el widget de ofertas que Hotmart muestra dentro del Sitio después de
        una compra. Esas cookies se rigen por la política de cookies de Hotmart, que puedes consultar en su
        propia página.
      </p>

      <SectionHeading sections={sections} id="cambios" />
      <p>
        Si se incorpora una nueva herramienta que use cookies, el Titular actualizará esta tabla y la fecha
        indicada al inicio de la página, y el banner volverá a pedirte una decisión.
      </p>
    </LegalLayout>
  );
}

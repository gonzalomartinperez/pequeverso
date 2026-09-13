import { site } from "@config/site";
import { seller, sellerField } from "@content/es/legal/seller";
import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/layout/LegalLayout/LegalLayout";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/aviso-legal/",
  title: "Aviso legal",
  description:
    "Identificación del titular de pequeverso.com, condiciones de uso del sitio y propiedad intelectual.",
  noindex: true,
});

const sections = [
  { id: "titular", title: "Titular del sitio" },
  { id: "objeto", title: "Objeto del sitio" },
  { id: "hotmart", title: "Compras a través de Hotmart" },
  { id: "propiedad", title: "Propiedad intelectual" },
  { id: "responsabilidad", title: "Responsabilidad" },
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
        <strong>{seller.brand}</strong> es una marca operada por <strong>{seller.operator}</strong>.
      </p>
      <ul>
        <li>Titular: {sellerField(seller.legalName)}</li>
        <li>Identificación fiscal: {sellerField(seller.taxId)}</li>
        <li>Domicilio: {sellerField(seller.address)}</li>
        <li>
          Correo de contacto: <a href={`mailto:${seller.supportEmail}`}>{seller.supportEmail}</a>
        </li>
        <li>Sitio web: {site.url}</li>
      </ul>

      <h2 id="objeto">Objeto del sitio</h2>
      <p>
        Este sitio presenta materiales educativos digitales imprimibles para familias con niños de
        aproximadamente 3 a 7 años. Los materiales son un complemento para la práctica en casa: no sustituyen
        la escuela, una terapia ni el criterio de un profesional, y no garantizan resultados de aprendizaje.
      </p>

      <h2 id="hotmart">Compras a través de Hotmart</h2>
      <p>
        Los productos se venden a través de la plataforma Hotmart, que procesa el pago, calcula impuestos
        según el país del comprador, entrega el acceso digital y gestiona las solicitudes de reembolso.{" "}
        {seller.brand} no recibe ni almacena datos de tarjetas ni de medios de pago. Las condiciones de compra
        se detallan en <Link href="/terminos/">Términos de compra</Link> y{" "}
        <Link href="/compras-y-reembolsos/">Compras y reembolsos</Link>.
      </p>

      <h2 id="propiedad">Propiedad intelectual</h2>
      <p>
        El nombre {seller.brand}, el logotipo, los textos, las ilustraciones y los materiales imprimibles son
        propiedad de su titular y están protegidos por la legislación de propiedad intelectual. La compra de
        un material otorga una licencia de uso personal y familiar: puedes imprimirlo para uso doméstico las
        veces que necesites, pero no revenderlo, redistribuirlo ni publicarlo. Los docentes pueden utilizarlo
        como recurso complementario en su aula; el uso institucional a mayor escala requiere autorización
        previa.
      </p>

      <h2 id="responsabilidad">Responsabilidad</h2>
      <p>
        Trabajamos para que la información del sitio sea exacta y esté actualizada; los precios finales,
        impuestos y medios de pago los determina Hotmart en la página de pago. No nos hacemos responsables del
        contenido de sitios de terceros enlazados desde aquí (Hotmart, redes sociales).
      </p>

      <h2 id="ley">Legislación aplicable</h2>
      <p>
        Este aviso se rige por la legislación de {sellerField(seller.country)}. Para cualquier controversia, y
        salvo que la normativa de protección al consumidor del país del comprador establezca otra cosa, serán
        competentes los tribunales de {sellerField(seller.jurisdiction)}.
      </p>
    </LegalLayout>
  );
}

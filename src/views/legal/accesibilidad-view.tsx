import { accesibilidadCopy as copy } from "@content/es/legal/accesibilidad";
import Link from "next/link";
import { LegalLayout, SectionHeading } from "@/views/legal/legal-layout.tsx";

export default function AccesibilidadPage() {
  const { sections } = copy;
  return (
    <LegalLayout
      title={copy.title}
      intro={copy.intro}
      updatedAt={copy.reviewedAt}
      sections={sections}
    >
      <SectionHeading sections={sections} id="compromiso" />
      {copy.commitment.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      <SectionHeading sections={sections} id="verificacion" />
      <p>{copy.verification.lead}</p>
      <ul>
        {copy.verification.checks.map((check) => (
          <li key={check.strong}>
            <strong>{check.strong}</strong> {check.text}
          </li>
        ))}
      </ul>
      <p>{copy.verification.manual}</p>

      <SectionHeading sections={sections} id="limitaciones" />
      <ul>
        {copy.limitations.map((limitation) => (
          <li key={limitation}>{limitation}</li>
        ))}
      </ul>

      <SectionHeading sections={sections} id="barreras" />
      <p>
        {copy.barriers.lead} Escribe a{" "}
        <a href={`mailto:${copy.contactEmail}`}>{copy.contactEmail}</a>. Respondemos normalmente en{" "}
        {copy.responseTime}. También hay ayuda en <Link href="/soporte/">Soporte y contacto</Link>.
      </p>

      <SectionHeading sections={sections} id="eaa" />
      <p>{copy.eaa}</p>
    </LegalLayout>
  );
}

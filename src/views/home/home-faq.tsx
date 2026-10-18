import { homeCopy as copy } from "@content/es/home";
import { FAQ } from "@/shared/editorial/faq.tsx";
import { Accent, Pill } from "./home-ui";

type About = (typeof copy.faq.items)[number]["about"];
const pick = (about: About) => copy.faq.items.filter((item) => item.about === about);

/**
 * `#preguntas`: answers separated by product (one column each from md, same weight) and, under
 * them, the questions that help choose and pay. Zero-JS native `<details>` (`FAQ`).
 */
export function HomeFaq() {
  const f = copy.faq;
  const groups = [
    { key: "reading", title: f.groups.reading, items: pick("reading") },
    { key: "feeding", title: f.groups.feeding, items: pick("feeding") },
  ] as const;
  return (
    <section
      id="preguntas"
      aria-labelledby="preguntas-title"
      className="cq relative scroll-mt-[calc(1.25rem-var(--section-pad))] bg-cream pt-(--section-pad) pb-[calc(var(--section-pad)+var(--section-overlap))]"
    >
      <div className="page-container grid gap-10">
        <div className="grid justify-items-center gap-3 text-center" data-reveal="">
          <Pill>{f.kicker}</Pill>
          <h2 id="preguntas-title">
            <Accent title={f.title} />
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-8 cq-md:grid-cols-2">
          {groups.map((group) => (
            <div key={group.key} className="grid content-start gap-4" data-faq-group={group.key}>
              <h3 className="text-h3 font-extrabold text-ink">{group.title}</h3>
              <FAQ items={group.items} openFirst={false} />
            </div>
          ))}
        </div>
        <div className="mx-auto grid w-full max-w-[52rem] content-start gap-4" data-faq-group="both">
          <h3 className="text-center text-h3 font-extrabold text-ink">{f.groups.both}</h3>
          <FAQ items={pick("both")} openFirst={false} />
        </div>
      </div>
    </section>
  );
}

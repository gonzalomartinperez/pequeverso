import { homeCopy as copy } from "@content/es/home";
import { Icon } from "@/components/blocks/icon";
import { MediaImage } from "@/components/blocks/media-image";
import { Accent, Pill } from "./home-ui";

/**
 * Editorial lifestyle banner: the wide photo of a mother and daughter tracing a page at the
 * table, with a glass card over its free right side (below it on narrow screens) and the
 * "Imagen ilustrativa." caption the AI-generated scenes carry.
 */
export function LifestyleBand() {
  const l = copy.lifestyle;
  return (
    <section
      aria-labelledby="casa-title"
      className="cq defer-render relative bg-cream px-3 py-(--section-pad) cq-sm:px-5"
    >
      <figure className="relative mx-auto grid max-w-[88rem] cq-lg:block" data-reveal="blur">
        <div className="overflow-hidden rounded-2xl shadow-float cq-lg:rounded-[3rem] [&_img]:aspect-[16/10] [&_img]:h-auto [&_img]:w-full [&_img]:object-cover cq-md:[&_img]:aspect-video">
          <MediaImage id="gf.life.trazo" sizes="(min-width: 1440px) 1408px, 96vw" />
        </div>
        <div className="glass relative z-1 mx-3 -mt-14 grid gap-4 rounded-xl p-6 shadow-float cq-sm:mx-8 cq-sm:p-8 cq-lg:absolute cq-lg:top-1/2 cq-lg:right-[5%] cq-lg:m-0 cq-lg:w-[min(28rem,40%)] cq-lg:-translate-y-1/2">
          <Pill tone="white">{l.kicker}</Pill>
          <h2 id="casa-title" className="text-[clamp(1.75rem,1.3rem+1.6vw,2.625rem)]">
            <Accent title={l.title} />
          </h2>
          <p className="text-pretty">{l.text}</p>
          <ul className="flex flex-wrap gap-2">
            {l.points.map((point) => (
              <li
                key={point.label}
                className="inline-flex items-center gap-1.5 rounded-pill bg-white px-3 py-1.5 text-small font-extrabold text-navy ring-1 ring-line"
              >
                <Icon name={point.icon} size={15} className="text-teal" />
                {point.label}
              </li>
            ))}
          </ul>
        </div>
        <figcaption className="mt-3 px-4 text-end text-tiny text-subtle cq-lg:absolute cq-lg:right-8 cq-lg:bottom-5 cq-lg:mt-0 cq-lg:rounded-pill cq-lg:bg-white/80 cq-lg:px-3 cq-lg:py-1">
          {copy.illustrative}
        </figcaption>
      </figure>
    </section>
  );
}

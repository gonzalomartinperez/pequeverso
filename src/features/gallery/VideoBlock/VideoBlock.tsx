import type { CSSProperties } from "react";
import { badgeVariants } from "@/components/ui/badge-variants";
import { VideoGroup, VideoPlayer } from "./VideoPlayer";

export type VideoItem = {
  id: string;
  mp4: string;
  webm?: string;
  poster: { src: string; srcSet: string };
  width: number;
  height: number;
  title: string;
  description: string;
};

/**
 * Click-to-play demos: only a poster loads until the visitor presses play; then a native
 * <video controls> plays inline (one active player at a time). Each demo has a title and
 * description as its text alternative (WCAG 1.2.1 — the clips are silent). The grid and the
 * poster `<img>` render on the server; only ids and sources reach the client player.
 */
export function VideoBlock({
  items,
  illustrativeLabel,
}: {
  items: VideoItem[];
  /** Visible badge, caption line and accessible-name suffix marking the clips as illustrative. */
  illustrativeLabel?: string | undefined;
}) {
  return (
    <VideoGroup>
      <div data-slot="video-block" className="cq">
        <ul className="grid grid-cols-1 gap-6 cq-sm:grid-cols-2 cq-lg:grid-cols-4" role="list">
          {items.map((item, index) => (
            <li key={item.id} className="min-w-0" data-reveal="" style={{ "--i": index } as CSSProperties}>
              <figure className="grid grid-cols-[40%_1fr] items-center gap-4 cq-sm:grid-cols-1 cq-sm:items-start cq-sm:gap-3">
                <div
                  className="relative overflow-hidden rounded-lg bg-navy-deep shadow-md [&_img]:block [&_img]:size-full [&_img]:object-cover [&_video]:block [&_video]:size-full [&_video]:object-cover"
                  style={{ aspectRatio: `${item.width} / ${item.height}` }}
                >
                  <VideoPlayer
                    id={item.id}
                    mp4={item.mp4}
                    webm={item.webm}
                    width={item.width}
                    height={item.height}
                    title={
                      illustrativeLabel ? `${item.title} (${illustrativeLabel.toLowerCase()})` : item.title
                    }
                  >
                    <img
                      src={item.poster.src}
                      srcSet={item.poster.srcSet}
                      sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw"
                      width={item.width}
                      height={item.height}
                      alt=""
                      loading="lazy"
                      fetchPriority="low"
                      decoding="async"
                    />
                  </VideoPlayer>
                  {illustrativeLabel ? (
                    <span
                      aria-hidden="true"
                      className={`${badgeVariants({ variant: "gold" })} pointer-events-none absolute top-2 left-2`}
                    >
                      {illustrativeLabel}
                    </span>
                  ) : null}
                </div>
                <figcaption className="grid gap-1 text-small text-body">
                  <strong className="text-base">{item.title}</strong>
                  <span>{item.description}</span>
                  {illustrativeLabel ? (
                    <span className="text-tiny font-bold text-subtle">{illustrativeLabel}</span>
                  ) : null}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </VideoGroup>
  );
}

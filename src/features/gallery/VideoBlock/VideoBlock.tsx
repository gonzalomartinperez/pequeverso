"use client";

import { Play } from "lucide-react";
import { useRef, useState } from "react";
import styles from "./VideoBlock.module.css";

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
 * description as its text alternative (WCAG 1.2.1 — the clips are silent).
 */
export function VideoBlock({ items }: { items: VideoItem[] }) {
  const [active, setActive] = useState<string | null>(null);
  const refs = useRef(new Map<string, HTMLVideoElement>());

  const play = (id: string) => {
    setActive(id);
    for (const [key, video] of refs.current) if (key !== id) video.pause();
    queueMicrotask(() => {
      refs.current
        .get(id)
        ?.play()
        .catch(() => undefined);
    });
  };

  return (
    <ul className={styles.grid} role="list">
      {items.map((item) => (
        <li key={item.id} className={styles.card} data-reveal>
          <figure className={styles.figure}>
            <div className={styles.frame} style={{ aspectRatio: `${item.width} / ${item.height}` }}>
              {active === item.id ? (
                // biome-ignore lint/a11y/useMediaCaption: the demos are silent; the figcaption title + description is the text alternative (WCAG 1.2.1)
                <video
                  ref={(el) => {
                    if (el) refs.current.set(item.id, el);
                    else refs.current.delete(item.id);
                  }}
                  controls
                  playsInline
                  preload="metadata"
                  poster={item.poster.src}
                  width={item.width}
                  height={item.height}
                  aria-label={item.title}
                  onEnded={() => setActive((current) => (current === item.id ? null : current))}
                >
                  {item.webm ? <source src={item.webm} type="video/webm" /> : null}
                  <source src={item.mp4} type="video/mp4" />
                </video>
              ) : (
                <button
                  type="button"
                  className={styles.playButton}
                  onClick={() => play(item.id)}
                  aria-label={`Reproducir: ${item.title}`}
                >
                  <img
                    src={item.poster.src}
                    srcSet={item.poster.srcSet}
                    sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw"
                    width={item.width}
                    height={item.height}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                  <span className={styles.playIcon} aria-hidden="true">
                    <Play size={28} fill="currentColor" />
                  </span>
                </button>
              )}
            </div>
            <figcaption className={styles.caption}>
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}

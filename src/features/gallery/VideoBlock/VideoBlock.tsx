import styles from "./VideoBlock.module.css";
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
export function VideoBlock({ items }: { items: VideoItem[] }) {
  return (
    <VideoGroup>
      <ul className={styles.grid} role="list">
        {items.map((item) => (
          <li key={item.id} className={styles.card} data-reveal>
            <figure className={styles.figure}>
              <div className={styles.frame} style={{ aspectRatio: `${item.width} / ${item.height}` }}>
                <VideoPlayer
                  id={item.id}
                  mp4={item.mp4}
                  webm={item.webm}
                  width={item.width}
                  height={item.height}
                  title={item.title}
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
              </div>
              <figcaption className={styles.caption}>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </VideoGroup>
  );
}

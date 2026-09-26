"use client";

import { Play } from "lucide-react";
import {
  createContext,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type Group = {
  active: string | null;
  play: (id: string) => void;
  stop: (id: string) => void;
  register: (id: string, el: HTMLVideoElement | null) => void;
};

const noop = () => undefined;
const GroupContext = createContext<Group>({ active: null, play: noop, stop: noop, register: noop });

/** Shares "one active player at a time" state between the `VideoPlayer`s it wraps. */
export function VideoGroup({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<string | null>(null);
  const refs = useRef(new Map<string, HTMLVideoElement>());
  const register = useCallback((id: string, el: HTMLVideoElement | null) => {
    if (el) refs.current.set(id, el);
    else refs.current.delete(id);
  }, []);
  const play = useCallback((id: string) => {
    setActive(id);
    for (const [key, video] of refs.current) if (key !== id) video.pause();
    queueMicrotask(() => {
      refs.current
        .get(id)
        ?.play()
        .catch(() => undefined);
    });
  }, []);
  const stop = useCallback((id: string) => setActive((current) => (current === id ? null : current)), []);
  const value = useMemo(() => ({ active, play, stop, register }), [active, play, stop, register]);
  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
}

type Props = {
  id: string;
  mp4: string;
  webm?: string | undefined;
  width: number;
  height: number;
  title: string;
  /** Server-rendered poster `<img>`; its current rendition becomes the `<video>` poster. */
  children: ReactNode;
};

/** Poster button that swaps itself for a native `<video controls>` on demand. */
export function VideoPlayer({ id, mp4, webm, width, height, title, children }: Props) {
  const group = useContext(GroupContext);
  const [poster, setPoster] = useState<string | undefined>(undefined);
  const onPlay = (event: MouseEvent<HTMLButtonElement>) => {
    setPoster(event.currentTarget.querySelector("img")?.currentSrc || undefined);
    group.play(id);
  };
  if (group.active === id) {
    return (
      // biome-ignore lint/a11y/useMediaCaption: the demos are silent; the figcaption title + description is the text alternative (WCAG 1.2.1)
      <video
        ref={(el) => group.register(id, el)}
        controls
        playsInline
        preload="metadata"
        poster={poster}
        width={width}
        height={height}
        aria-label={title}
        onEnded={() => group.stop(id)}
      >
        {webm ? <source src={webm} type="video/webm" /> : null}
        <source src={mp4} type="video/mp4" />
      </video>
    );
  }
  return (
    <button
      type="button"
      className="group/play relative block size-full cursor-pointer border-0 bg-transparent p-0"
      onClick={onPlay}
      aria-label={`Reproducir: ${title}`}
    >
      {children}
      <span
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,oklch(0.2_0.08_256/45%))] transition-opacity duration-(--duration) ease-out group-hover/play:opacity-60"
        aria-hidden="true"
      />
      <span
        className="absolute inset-0 m-auto grid size-12 place-items-center rounded-full bg-gold text-navy-deep border-4 border-white/60 shadow-lg transition duration-(--duration) ease-out cq-sm:size-16 motion-safe:group-hover/play:scale-110"
        aria-hidden="true"
      >
        <Play className="ml-0.5 size-5 cq-sm:size-7" fill="currentColor" />
      </span>
    </button>
  );
}

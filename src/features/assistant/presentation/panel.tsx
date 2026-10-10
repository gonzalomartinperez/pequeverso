"use client";
import { assistantCopy as enCopy } from "@content/en/assistant";
import { assistantCopy as esCopy } from "@content/es/assistant";
import { ChevronDown, Globe, Maximize2, Minimize2, Minus } from "lucide-react";
import {
  type KeyboardEvent,
  type RefObject,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cx } from "@/lib/cx";
import { holdPageMotion } from "@/motion/motion-hold";
import { phase } from "../domain/conversation";
import type { LinkPolicy } from "../domain/links";
import type { Language, Page } from "../domain/models";
import type { PublicPath } from "../domain/visitor-context";
import { createStoreAssistant } from "../entry";
import styles from "./assistant.module.css";
import { ClearControl } from "./clear-control";
import { type Presentation, PresentationProvider } from "./context";
import { ConversationView } from "./conversation-view";
import { IconButton } from "./parts";
import { useConversation } from "./use-conversation";

export type PanelProps = {
  open: boolean;
  locale: Language;
  openedPath: PublicPath | null;
  currentPath: PublicPath | null;
  onLocaleChange: (locale: Language) => void;
  /** Hide the panel (minimize). The conversation and any authorized answer continue. */
  onMinimize: () => void;
  page: Page | null;
  apiOrigin: string;
  policy: LinkPolicy;
  avatarSrc: string;
  supportPath: string;
  privacyPath: string;
  /** The host element: siblings outside it become inert while the panel is modal. */
  host: RefObject<HTMLElement | null>;
  /** An answer finished while the panel was minimized. */
  onUnread: () => void;
};

/** Phones in portrait or landscape get the near-full-screen, modal surface. */
const PHONE = "(max-width: 639.98px), (max-height: 520px)";
const FOCUSABLE =
  'button:not([disabled]), a[href], textarea:not([disabled]), input:not([disabled]), select:not([disabled]), summary, [tabindex="0"]';

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** While modal: every body child outside the host is inert and the page does not scroll. */
function useModalBackground(active: boolean, host: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active) return;
    const siblings = Array.from(document.body.children).filter((element) => !element.contains(host.current));
    const previous = siblings.map((element) => element.hasAttribute("inert"));
    for (const element of siblings) element.setAttribute("inert", "");
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const release = holdPageMotion();
    return () => {
      siblings.forEach((element, index) => {
        if (!previous[index]) element.removeAttribute("inert");
      });
      document.body.style.overflow = overflow;
      release();
    };
  }, [active, host]);
}

/**
 * Fits the phone surface to the visual viewport: above the on-screen keyboard and inside the visible
 * area even when the page is pinch-zoomed or wider than the screen (safe areas are added in CSS).
 */
function useVisualViewport(active: boolean, surface: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const viewport = window.visualViewport;
    const element = surface.current;
    if (!active || !viewport || !element) return;
    const update = () => {
      element.style.setProperty("--pv-vv-height", `${viewport.height}px`);
      element.style.setProperty("--pv-vv-top", `${viewport.offsetTop}px`);
      element.style.setProperty("--pv-vv-width", `${viewport.width}px`);
      element.style.setProperty("--pv-vv-left", `${viewport.offsetLeft}px`);
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      for (const name of ["--pv-vv-height", "--pv-vv-top", "--pv-vv-width", "--pv-vv-left"])
        element.style.removeProperty(name);
    };
  }, [active, surface]);
}

/**
 * The assistant surface. Loaded on first use; it then stays mounted (hidden and inert while
 * minimized), so minimizing never loses the conversation or aborts an answer already authorized.
 * Compact desktop is a named, non-modal region: the page stays usable. Expanded and phone
 * surfaces are modal dialogs: background inert, focus contained, page motion held, Escape and
 * focus restoration (an open confirmation consumes Escape first).
 */
export default function AssistantPanel({
  open,
  locale,
  openedPath,
  currentPath,
  onLocaleChange,
  onMinimize,
  page,
  apiOrigin,
  policy,
  avatarSrc,
  supportPath,
  privacyPath,
  host,
  onUnread,
}: PanelProps) {
  const [assistant] = useState(() => createStoreAssistant(apiOrigin, policy, locale));
  const state = useConversation(assistant);
  const current = phase(state);
  const phone = useMedia(PHONE);
  const [expanded, setExpanded] = useState(false);
  const modal = open && (phone || expanded);
  const field = useRef<HTMLTextAreaElement>(null);
  const surface = useRef<HTMLElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const t = locale === "en" ? enCopy : esCopy;

  useEffect(() => {
    assistant.setLocale(locale);
  }, [assistant, locale]);

  useModalBackground(modal, host);
  useVisualViewport(open && phone, surface);

  useEffect(() => {
    assistant.setPage(page);
    assistant.setContext({
      opened_path: openedPath,
      current_path: currentPath,
      presentation: expanded || phone ? "expanded" : "compact",
    });
  }, [assistant, page, openedPath, currentPath, expanded, phone]);

  // Opening moves focus into the panel: the composer once it exists (never on touch devices, where
  // it would pop the keyboard over the answer), otherwise the surface itself.
  const sessionOpen = state.session === "open";
  useEffect(() => {
    if (!open) return;
    const element = surface.current;
    if (!element || element.contains(document.activeElement)) return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (!coarse && field.current) field.current.focus({ preventScroll: true });
    else element.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    if (!open || !sessionOpen || window.matchMedia("(pointer: coarse)").matches) return;
    if (document.activeElement === surface.current) field.current?.focus({ preventScroll: true });
  }, [open, sessionOpen]);

  const last = state.messages.at(-1);
  const seen = useRef(last?.id);
  useEffect(() => {
    if (open) seen.current = last?.id;
    else if (last && last.id !== seen.current && last.role === "assistant") {
      seen.current = last.id;
      onUnread();
    }
  }, [open, last, onUnread]);

  const presentation = useMemo<Presentation>(
    () => ({
      t,
      locale,
      policy,
      supportPath,
      privacyPath,
      visible: open,
      onNavigate: () => {
        if (modal) onMinimize();
      },
    }),
    [t, locale, policy, supportPath, privacyPath, open, modal, onMinimize],
  );

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    // An IME composition owns Escape (it cancels the candidate), so it never minimizes the panel.
    if (event.defaultPrevented || event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === "Escape") {
      event.preventDefault();
      onMinimize();
      return;
    }
    if (event.key !== "Tab" || !modal) return;
    const controls = Array.from(surface.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
      (element) => element.getClientRects().length > 0 && !element.closest("[inert]"),
    );
    const first = controls[0];
    const final = controls.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === surface.current)) {
      event.preventDefault();
      final?.focus();
    } else if (!event.shiftKey && document.activeElement === final) {
      event.preventDefault();
      first?.focus();
    }
  }

  return (
    <PresentationProvider value={presentation}>
      {modal && <div aria-hidden="true" className={styles.backdrop} onClick={onMinimize} />}
      <section
        lang={locale}
        ref={surface}
        id="pv-assistant-panel"
        data-testid="assistant-panel"
        data-size={expanded && !phone ? "expanded" : "compact"}
        data-phase={current.kind}
        hidden={!open}
        inert={!open}
        tabIndex={-1}
        {...(modal ? { role: "dialog", "aria-modal": true } : { role: "region" })}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={onKeyDown}
        className={cx(styles.panel, "on-light bg-cream shadow-float ring-1 ring-navy/15 outline-none")}
      >
        <ClearControl
          disabled={state.session !== "open" || state.pending !== null || state.messages.length === 0}
          clearing={state.clearing}
          onConfirm={() => void assistant.clear()}
        >
          {(clearTrigger, confirmation, confirming) => (
            <>
              <header
                className={cx(
                  styles.header,
                  "on-navy flex flex-wrap items-center gap-x-2 gap-y-1 bg-navy py-3 ps-4 pe-2",
                )}
              >
                <img
                  src={avatarSrc}
                  alt=""
                  width={40}
                  height={40}
                  className="size-10 shrink-0 rounded-full bg-white"
                />
                <div className="min-w-[min(100%,11rem)] flex-1 [overflow-wrap:anywhere]">
                  <h2
                    id={titleId}
                    className="m-0 font-sans text-base leading-tight font-extrabold text-white"
                  >
                    {t.name}
                  </h2>
                  <p id={descriptionId} className="m-0 text-tiny text-on-navy">
                    {t.aiDisclosure}
                  </p>
                </div>
                <div className="ms-auto flex max-w-full flex-wrap items-center justify-end gap-1">
                  <label
                    className={cx(
                      styles.languageControl,
                      "flex min-h-11 items-center gap-1 rounded-pill ring-1 ring-inset ring-white/25 px-2",
                    )}
                  >
                    <Globe aria-hidden="true" className="size-4" />
                    <span className="sr-only">{t.languageLabel}</span>
                    <select
                      aria-label={t.languageLabel}
                      value={locale}
                      onChange={(event) => {
                        const next = event.target.value === "en" ? "en" : "es";
                        assistant.setLocale(next);
                        onLocaleChange(next);
                      }}
                      className="min-h-11 min-w-11 appearance-none rounded-none bg-transparent px-1 text-small font-bold text-white"
                    >
                      <option value="es" className="bg-navy text-white">
                        ES
                      </option>
                      <option value="en" className="bg-navy text-white">
                        EN
                      </option>
                    </select>
                    <ChevronDown aria-hidden="true" className="size-3 shrink-0" />
                  </label>
                  {clearTrigger}
                  {!phone && (
                    <IconButton
                      label={expanded ? t.restore : t.expand}
                      aria-pressed={expanded}
                      onClick={() => setExpanded((value) => !value)}
                    >
                      {expanded ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
                    </IconButton>
                  )}
                  <IconButton label={t.minimize} onClick={onMinimize}>
                    <Minus aria-hidden="true" />
                  </IconButton>
                </div>
              </header>
              {confirmation}
              <ConversationView
                assistant={assistant}
                state={state}
                phase={current}
                field={field}
                confirming={confirming}
              />
            </>
          )}
        </ClearControl>
      </section>
    </PresentationProvider>
  );
}

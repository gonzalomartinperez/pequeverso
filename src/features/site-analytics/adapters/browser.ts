import { cellOf, profile, type Route, sectionAllowed } from "../domain/profile.ts";

const excluded =
  'form,input,textarea,select,label,canvas,dialog,[contenteditable],[role="textbox"],[role="dialog"],[data-assistant-host],[data-analytics-private],[data-analytics-exclude],[inert],[hidden]';
type Receiver = { exposure(section: string): void; click(section: string, x: number, y: number): void };
/** Only reviewed public sections and their heading sentinels. Never read text, forms or URLs. */
export function observePublicSections(view: Window & typeof globalThis, route: Route, receiver: Receiver) {
  const document = view.document,
    pending = new Map<Element, number>(),
    qualified = new Set<Element>();
  const bindings = new Map<Element, { section: string; region: HTMLElement; visible: boolean }>();
  let alive = true;
  const observer = view.IntersectionObserver
    ? new view.IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const binding = bindings.get(entry.target);
            if (!binding) continue;
            binding.visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
            const old = pending.get(entry.target);
            if (old !== undefined) {
              view.clearTimeout(old);
              pending.delete(entry.target);
            }
            if (
              !alive ||
              !binding.visible ||
              qualified.has(entry.target) ||
              document.visibilityState !== "visible"
            )
              continue;
            const timer = view.setTimeout(() => {
              if (pending.get(entry.target) !== timer) return;
              pending.delete(entry.target);
              const target = entry.target;
              if (
                !alive ||
                !binding.visible ||
                !target.isConnected ||
                !binding.region.contains(target) ||
                document.visibilityState !== "visible" ||
                target.closest(excluded) ||
                target.closest('[aria-hidden="true"]')
              )
                return;
              const style = view.getComputedStyle(target),
                bounds = target.getBoundingClientRect();
              const width = Math.max(0, Math.min(bounds.right, view.innerWidth) - Math.max(bounds.left, 0));
              const height = Math.max(0, Math.min(bounds.bottom, view.innerHeight) - Math.max(bounds.top, 0));
              if (
                style.visibility === "hidden" ||
                style.display === "none" ||
                bounds.width <= 0 ||
                bounds.height <= 0 ||
                (width * height) / (bounds.width * bounds.height) < 0.5
              )
                return;
              qualified.add(target);
              receiver.exposure(binding.section);
            }, 500);
            pending.set(entry.target, timer);
          }
        },
        { threshold: [0, 0.5, 1] },
      )
    : undefined;
  for (const section of profile[route]) {
    const region = document.getElementById(section);
    if (!region || region.closest(excluded) || region.closest('[aria-hidden="true"]')) continue;
    // Heading visibility is a bounded exposure sentinel, not proof the whole section was read.
    const target = region.querySelector<HTMLElement>("h1,h2");
    if (!target || target.closest(excluded)) continue;
    bindings.set(target, { section, region, visible: false });
    observer?.observe(target);
  }
  const click = (event: MouseEvent) => {
    if (
      !alive ||
      !event.isTrusted ||
      event.button !== 0 ||
      event.detail < 1 ||
      document.visibilityState !== "visible"
    )
      return;
    if (
      event
        .composedPath()
        .some(
          (node) => node instanceof view.Element && (node.matches(excluded) || node.tagName.includes("-")),
        )
    )
      return;
    const target = event.target;
    if (!(target instanceof view.Element)) return;
    const region = target.closest<HTMLElement>("[id]");
    // Nested unrelated IDs cannot broaden the exact approved section registry.
    let section: HTMLElement | null = region;
    while (section && !sectionAllowed(route, section.id))
      section = section.parentElement?.closest<HTMLElement>("[id]") ?? null;
    if (!section || section.closest(excluded) || section.closest('[aria-hidden="true"]')) return;
    const cell = cellOf(event.clientX, event.clientY, section.getBoundingClientRect());
    if (cell) receiver.click(section.id, cell.x, cell.y);
  };
  document.addEventListener("click", click, { capture: true, passive: true });
  return () => {
    alive = false;
    observer?.disconnect();
    for (const timer of pending.values()) view.clearTimeout(timer);
    pending.clear();
    bindings.clear();
    document.removeEventListener("click", click, true);
  };
}

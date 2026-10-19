import {
  type Intent,
  type Measurement,
  type Route,
  routeOf,
  sectionAllowed,
  type Viewport,
} from "../domain/profile.ts";

type Ports = {
  uuid(): string;
  viewport(): Viewport | null;
  send(event: Measurement): void;
  abort(): void;
  now(): number;
};
/** One document-local controller. A failed/dropped event is never queued or retried. */
export function createCollection(port: Ports) {
  let route: Route | null = null,
    allowed = false,
    stopped = false,
    pageSent = false;
  let total = 0,
    windowStart = port.now(),
    minute = 0;
  const sections = new Set<string>();
  function emit(intent: Intent) {
    if (!allowed || stopped || !route || !sectionAllowed(route, intent.section_id)) return;
    const viewport = port.viewport(),
      now = port.now();
    if (!viewport || !Number.isFinite(now) || now < windowStart) return;
    if (now - windowStart >= 60_000) {
      windowStart = now;
      minute = 0;
    }
    if (total >= 120 || minute >= 40) return;
    let id: string;
    try {
      id = port.uuid();
    } catch {
      return;
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return;
    total++;
    minute++;
    port.send({
      ...intent,
      schema_version: 1,
      project: "pequeverso",
      source: "site",
      event_id: id,
      route,
      layout_revision: "pequeverso-v1",
      viewport_bucket: viewport,
      locale: "es",
    });
  }
  function page() {
    if (!allowed || stopped || !route || pageSent) return;
    pageSent = true;
    emit({ event_name: "page_view", section_id: "hero" });
  }
  return {
    navigate(path: string) {
      const next = routeOf(path);
      if (next === route) return false;
      route = next;
      pageSent = false;
      sections.clear();
      page();
      return true;
    },
    consent(value: boolean) {
      if (stopped) return;
      allowed = value;
      if (!value) port.abort();
      else page();
    },
    exposure(section: string) {
      if (!allowed || !route || !sectionAllowed(route, section) || sections.has(section)) return;
      sections.add(section);
      emit({ event_name: "section_view", section_id: section });
    },
    click(section: string, x: number, y: number) {
      if (
        !route ||
        !sectionAllowed(route, section) ||
        !Number.isInteger(x) ||
        !Number.isInteger(y) ||
        x < 0 ||
        x > 7 ||
        y < 0 ||
        y > 7
      )
        return;
      emit({ event_name: "public_click", section_id: section, cell_x: x, cell_y: y });
    },
    stop() {
      stopped = true;
      allowed = false;
      port.abort();
    },
  };
}

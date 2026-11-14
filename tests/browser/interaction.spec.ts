import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Locator, Page, TestInfo } from "@playwright/test";
import { ratchetPhase } from "../../tools/scorecard/ratchets.ts";
import { expect, test } from "./fixtures";

/**
 * Animation fluidity and interaction latency (roadmap M2-2, [13] 2.7; docs/master-plan/testing.md):
 *   (a) frame time while the hero and the wall of pages animate and while the page scrolls,
 *   (b) Long Animation Frames during load and the interactions,
 *   (c) an INP proxy: the slowest interaction `event` entry (durationThreshold 16),
 *   (d) the reduced-motion lane: nothing animates continuously.
 * Ceilings live in ratchets/interaction.json. While that ratchet is in its warn phase
 * (`ratchetPhase`, through its `expires` date inclusive) a breach is recorded as an annotation and a
 * console line; afterwards it fails. Every measurement is also written to
 * test-results/interaction-measurements/ (uploaded with the CI evidence) for
 * tools/interaction-suggest.ts. Chromium only; the 390 project runs with a 4x CPU slowdown and, like
 * every test here, first-party only (external hosts are aborted).
 */

type Limit = { key: string; value: number };
const ratchet = JSON.parse(
  readFileSync(path.join(process.cwd(), "ratchets", "interaction.json"), "utf8"),
) as {
  measuredAt: string;
  mode?: "warn" | "enforce";
  expires?: string;
  values: Limit[];
};
const limits = new Map(ratchet.values.map((item) => [item.key, item.value]));
const phase = ratchetPhase(ratchet, new Date().toISOString().slice(0, 10));

/** A failed condition: an annotation and a console line while warning, an assertion afterwards. */
function gate(ok: boolean, line: string): void {
  if (ok) return;
  if (phase === "warn") {
    test.info().annotations.push({ type: "interaction-ratchet-warning", description: line });
    console.warn(`[interaction] WARN (warn phase through ${ratchet.expires}) ${line}`);
    return;
  }
  expect(ok, line).toBe(true);
}

type Row = { project: string; route: string; key: string; value: number };
const rows: Row[] = [];

/** Records a measurement and checks it against its ceiling. */
function measure(info: TestInfo, route: string, key: string, value: number): void {
  const limit = limits.get(key);
  if (limit === undefined) throw new Error(`ratchets/interaction.json has no "${key}"`);
  rows.push({ project: info.project.name, route, key, value });
  const line = `${info.project.name} ${route} ${key}: ${value} (ceiling ${limit})`;
  console.log(`[interaction] ${line}`);
  gate(value <= limit, line);
}

function flush(info: TestInfo, route: string): void {
  const dir = path.join(process.cwd(), "test-results", "interaction-measurements");
  mkdirSync(dir, { recursive: true });
  const slug = `${info.project.name}-${route}-${info.title}`.replace(/[^a-z0-9]+/gi, "-");
  writeFileSync(path.join(dir, `${slug}.json`), JSON.stringify(rows.splice(0), null, 1));
}

type Observed = {
  loaf: number[];
  events: { duration: number; interactionId: number }[];
  supported: { loaf: boolean; event: boolean };
  flush: () => void;
};

/** Registers the observers before any page script runs so load-time entries are included. */
async function observe(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const supportedTypes = PerformanceObserver.supportedEntryTypes ?? [];
    const data: Observed = {
      loaf: [],
      events: [],
      supported: {
        loaf: supportedTypes.includes("long-animation-frame"),
        event: supportedTypes.includes("event"),
      },
      flush: () => {},
    };
    (window as unknown as { __perf: Observed }).__perf = data;
    const observers: PerformanceObserver[] = [];
    const watch = (init: PerformanceObserverInit, collect: (entry: PerformanceEntry) => void) => {
      const observer = new PerformanceObserver((list) => list.getEntries().forEach(collect));
      try {
        observer.observe(init);
        observers.push(observer);
      } catch {
        // Unsupported entry type: reported through `supported`, never as a zero measurement.
      }
    };
    watch({ type: "long-animation-frame", buffered: true }, (entry) =>
      data.loaf.push(entry.duration),
    );
    watch(
      { type: "event", durationThreshold: 16, buffered: true } as PerformanceObserverInit,
      (entry) =>
        data.events.push({
          duration: entry.duration,
          interactionId:
            (entry as PerformanceEntry & { interactionId?: number }).interactionId ?? 0,
        }),
    );
    // Pending records are delivered asynchronously: drain them before a reading.
    data.flush = () => {
      for (const observer of observers) {
        for (const entry of observer.takeRecords()) {
          if (entry.entryType === "long-animation-frame") data.loaf.push(entry.duration);
          else
            data.events.push({
              duration: entry.duration,
              interactionId:
                (entry as PerformanceEntry & { interactionId?: number }).interactionId ?? 0,
            });
        }
      }
    };
  });
}

async function observed(page: Page): Promise<Omit<Observed, "flush">> {
  return page.evaluate(() => {
    const perf = (window as unknown as { __perf: Observed }).__perf;
    perf.flush();
    return { loaf: [...perf.loaf], events: [...perf.events], supported: perf.supported };
  });
}

/** Enables a CPU slowdown through CDP (the plan's mobile profile); call before navigating. */
async function throttle(page: Page, rate: number): Promise<void> {
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setCPUThrottlingRate", { rate });
}

/** rAF deltas (ms) while `drive` runs; a per-run token retires the loop of any earlier sample. */
async function frames(page: Page, drive: () => Promise<void>): Promise<number[]> {
  const token = await page.evaluate(() => {
    const w = window as unknown as { __frameRun: number; __frames: number[] };
    const run = (w.__frameRun ?? 0) + 1;
    w.__frameRun = run;
    const deltas: number[] = [];
    w.__frames = deltas;
    let last = performance.now();
    const tick = (now: number) => {
      if (w.__frameRun !== run) return;
      deltas.push(now - last);
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return run;
  });
  await drive();
  return page.evaluate((run) => {
    const w = window as unknown as { __frameRun: number; __frames: number[] };
    const deltas = w.__frames.slice(1);
    if (w.__frameRun === run) w.__frameRun = run + 1;
    return deltas;
  }, token);
}

function summarize(deltas: number[]) {
  const sorted = [...deltas].sort((a, b) => a - b);
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0;
  // A long frame misses at least one 60 Hz vsync by half a frame (over 25 ms).
  const long = deltas.filter((delta) => delta > 25).length;
  return {
    count: deltas.length,
    p95: Math.round(p95 * 10) / 10,
    longShare: deltas.length ? Math.round((long / deltas.length) * 1000) / 10 : 0,
  };
}

const maxOf = (values: number[]) => Math.round(Math.max(0, ...values));

/** Centres an element without Playwright's stability wait (animated strips never settle). */
const reveal = (target: Locator) => target.evaluate((el) => el.scrollIntoView({ block: "center" }));

/** The plan's 4x mobile slowdown; INTERACTION_CPU_SLOWDOWN=1 lets a heavily loaded machine verify the logic. */
const CPU_SLOWDOWN = Number(process.env.INTERACTION_CPU_SLOWDOWN ?? 4);

const routes = ["/", "/grafismo-fonetico/"];
const REDUCED = "reduced-motion";
/** What a route must offer to be interacted with: the sample is vacuous without them. */
const MOTION_TRACKS = ".pv-marquee-track, [data-slot='page-wall-track']";

/** Aborts every non-first-party request so third parties never skew the numbers. */
const firstPartyOnly = (page: Page, baseURL: string | undefined) => {
  if (!baseURL) throw new Error("interaction specs need a baseURL");
  const origin = new URL(baseURL).origin;
  return page.route(
    (url) => url.origin !== origin,
    (route) => route.abort(),
  );
};

for (const route of routes) {
  test(`${route}: frame time while idle, scrolling and with the wall on screen`, async ({
    page,
    baseURL,
    browserName,
  }, info) => {
    test.skip(browserName !== "chromium", "frame sampling is calibrated on Chromium");
    test.skip(
      info.project.name === REDUCED,
      "the reduced-motion lane asserts the absence of motion",
    );
    test.setTimeout(240_000);
    await firstPartyOnly(page, baseURL);
    await observe(page);
    if (info.project.name.includes("390")) await throttle(page, CPU_SLOWDOWN);
    await page.goto(route);
    await page.waitForLoadState("networkidle");

    const kinds: [string, number[]][] = [];
    kinds.push(["hero", await frames(page, () => page.waitForTimeout(2_000))]);
    kinds.push([
      "scroll",
      await frames(page, async () => {
        for (let step = 0; step < 14; step += 1) {
          await page.mouse.wheel(0, 360);
          await page.waitForTimeout(80);
        }
      }),
    ]);
    expect(await page.evaluate(() => scrollY), "the wheel scrolled the page").toBeGreaterThan(0);
    const wall = page.locator(MOTION_TRACKS).first();
    if ((await wall.count()) > 0) {
      await reveal(wall);
      kinds.push(["wall", await frames(page, () => page.waitForTimeout(2_500))]);
    }
    for (const [kind, deltas] of kinds) {
      const result = summarize(deltas);
      // Too few frames means the sampler was starved, not that the page is smooth: a hard failure in
      // every phase, and nothing is recorded for the starved sample.
      expect(result.count, `${route} ${kind}: frames sampled (need 10)`).toBeGreaterThanOrEqual(10);
      measure(info, route, `frame-${kind}-p95-ms`, result.p95);
      measure(info, route, `long-frame-${kind}-share-pct`, result.longShare);
    }
    flush(info, route);
  });

  test(`${route}: long animation frames and interaction latency`, async ({
    page,
    baseURL,
    browserName,
  }, info) => {
    test.skip(browserName !== "chromium", "LoAF and event timing are Chromium APIs");
    test.skip(
      info.project.name === REDUCED,
      "interaction timing is measured in the animated project",
    );
    test.setTimeout(240_000);
    await firstPartyOnly(page, baseURL);
    await observe(page);
    if (info.project.name.includes("390")) await throttle(page, CPU_SLOWDOWN);
    await page.goto(route);
    await page.waitForLoadState("networkidle");

    const loaded = await observed(page);
    expect(loaded.supported, "this Chromium supports LoAF and Event Timing").toEqual({
      loaf: true,
      event: true,
    });
    measure(info, route, "loaf-load-count", loaded.loaf.length);
    measure(info, route, "loaf-load-max-ms", maxOf(loaded.loaf));
    const before = loaded.events.length;

    // A click on a link must not leave the page: Hotmart opens in a new tab in production.
    await page.evaluate(() =>
      document.addEventListener(
        "click",
        (event) => {
          if ((event.target as Element).closest("a")) event.preventDefault();
        },
        true,
      ),
    );
    const performed: string[] = [];
    const click = async (name: string, target: Locator) => {
      await expect(target, `${route} needs a ${name}`).toHaveCount(1, { timeout: 10_000 });
      await reveal(target);
      await target.click({ timeout: 10_000 });
      performed.push(name);
    };
    await click("cta", page.locator("a[data-checkout], #hero a[href]").first());
    const summary = page.locator("#preguntas summary").first();
    const details = summary.locator("xpath=..");
    const isOpen = () => details.evaluate((el) => (el as HTMLDetailsElement).open);
    // The first item starts open on some pages: the toggle must flip it either way.
    const initiallyOpen = await isOpen();
    await click("faq-summary", summary);
    expect(await isOpen(), "details toggled by the first click").toBe(!initiallyOpen);
    await summary.click({ timeout: 10_000 });
    expect(await isOpen(), "details restored by the second click").toBe(initiallyOpen);
    if (route !== "/") {
      await click("carousel", page.getByRole("button", { name: "Página siguiente" }).first());
      await click("wall-toggle", page.locator("[data-slot='page-wall-toggle']").first());
    }
    await page.waitForTimeout(500);
    const minimum = route === "/" ? 2 : 4;
    expect(performed.length, `interactions performed on ${route}`).toBeGreaterThanOrEqual(minimum);

    const all = await observed(page);
    const interactions = all.events.slice(before).filter((entry) => entry.interactionId > 0);
    // Warn-only during the warn window; a starved sample is never recorded as a zero.
    const observedInteractions = interactions.length > 0;
    gate(
      observedInteractions,
      `${route}: no interaction \`event\` entry was observed: the INP proxy would be vacuous`,
    );
    if (observedInteractions)
      measure(info, route, "inp-proxy-ms", maxOf(interactions.map((entry) => entry.duration)));
    const observedLoaf = all.loaf.length > 0;
    gate(observedLoaf, `${route}: no Long Animation Frame observed at 4x slowdown`);
    if (observedLoaf) {
      measure(info, route, "loaf-total-count", all.loaf.length);
      measure(info, route, "loaf-total-max-ms", maxOf(all.loaf));
    }
    flush(info, route);
  });
}

/** Infinite CSS animations that are running, and the transforms of the moving strips. */
function motionSnapshot(page: Page) {
  return page.evaluate((selector) => {
    const tracks = [...document.querySelectorAll(selector)];
    return {
      trackCount: tracks.length,
      running: document
        .getAnimations()
        .filter(
          (animation) =>
            animation.playState === "running" &&
            animation.effect?.getComputedTiming().iterations === Number.POSITIVE_INFINITY,
        )
        .map((animation) => (animation as CSSAnimation).animationName ?? animation.id),
      transforms: tracks.map((element) => getComputedStyle(element).transform),
    };
  }, MOTION_TRACKS);
}

test("reduced motion: no continuous animation, no rAF-driven transform loop, strips still", async ({
  page,
  baseURL,
  browserName,
}, info) => {
  test.skip(browserName !== "chromium", "calibrated on Chromium");
  test.skip(info.project.name !== REDUCED, "only meaningful in the reduced-motion project");
  await firstPartyOnly(page, baseURL);
  await page.goto("/grafismo-fonetico/");
  await page.waitForLoadState("networkidle");
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
    true,
  );
  await reveal(page.locator(MOTION_TRACKS).first());
  await page.evaluate(() => {
    const w = window as unknown as { __mutations: number };
    w.__mutations = 0;
    new MutationObserver((records) => {
      w.__mutations += records.length;
    }).observe(document.body, { attributes: true, attributeFilter: ["style"], subtree: true });
  });
  const first = await motionSnapshot(page);
  await page.waitForTimeout(1_000);
  const second = await motionSnapshot(page);
  const mutations = await page.evaluate(
    () => (window as unknown as { __mutations: number }).__mutations,
  );
  expect(second.trackCount, "the marquee and wall strips exist to be checked").toBeGreaterThan(0);
  expect(second.running, "infinite animations running under reduced motion").toEqual([]);
  expect(second.transforms).toEqual(first.transforms);
  expect(mutations, "inline style writes (rAF-driven transform loop)").toBe(0);
});

test("positive control: the motion probe sees the strips move when motion is allowed", async ({
  page,
  baseURL,
  browserName,
}, info) => {
  test.skip(browserName !== "chromium", "calibrated on Chromium");
  test.skip(!info.project.name.includes("390"), "one animated project runs the control");
  await firstPartyOnly(page, baseURL);
  await page.goto("/grafismo-fonetico/");
  await page.waitForLoadState("networkidle");
  await reveal(page.locator(MOTION_TRACKS).first());
  const first = await motionSnapshot(page);
  await page.waitForTimeout(700);
  const second = await motionSnapshot(page);
  expect(second.trackCount).toBeGreaterThan(0);
  expect(second.running.length, "the probe must see a running infinite animation").toBeGreaterThan(
    0,
  );
  expect(second.transforms, "the strip transforms advance").not.toEqual(first.transforms);
});

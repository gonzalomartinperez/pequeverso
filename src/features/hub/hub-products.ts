import { alimentacionBebe as course } from "@config/affiliates";
import { hubCopy } from "@content/es/hub";
import { featuredProduct } from "@/products";

const kit = featuredProduct();

/** One need the hub answers, with everything a chooser (door, menu card, sticky pill) shows. */
export type HubNeed = {
  key: "reading" | "feeding";
  /** Stable in-page anchor on the home (`#leer`, `#bebe`), for bios, posts and the menus. */
  anchor: `#${string}`;
  /** The task, never an identity: «Aprender a leer». */
  need: string;
  /** Age or stage from config: «3 a 7 años», «6 a 12 meses». */
  stage: string;
  line: string;
  format: string;
  /** Product name as published (registry / affiliate config). */
  name: string;
  /** Door action label («Ver el kit»). */
  go: string;
  /** Manifest ids: the door photo and a small thumbnail (menus, sticky bar). */
  photo: string;
  thumb: string;
  /** Third-party product recommended as an affiliate: shows «Recomendado» and the disclosure. */
  recommended: boolean;
};

export const reading: HubNeed = {
  key: "reading",
  anchor: `#${hubCopy.reading.anchor}`,
  need: hubCopy.reading.need,
  stage: kit.composition.ageRange,
  line: hubCopy.reading.line,
  format: hubCopy.reading.format,
  name: kit.name,
  go: hubCopy.reading.go,
  photo: kit.media.hero,
  thumb: kit.media.cards[0] ?? kit.media.hero,
  recommended: false,
};

export const feeding: HubNeed = {
  key: "feeding",
  anchor: `#${hubCopy.feeding.anchor}`,
  need: hubCopy.feeding.need,
  stage: course.stage,
  line: hubCopy.feeding.line,
  format: hubCopy.feeding.format,
  name: course.name,
  go: hubCopy.feeding.go,
  photo: course.media.photo,
  thumb: course.media.figure,
  recommended: true,
};

/** Both needs in the order every chooser shows them (reading first, as on the home). */
export const hubNeeds: readonly HubNeed[] = [reading, feeding];

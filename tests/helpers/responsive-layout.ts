/** Browser-only responsive measurements; self-contained for page.evaluate serialization. */
export function collectLayoutFaults(): string[] {
  const faults: string[] = [];
  const doc = document.documentElement;
  if (doc.scrollWidth > doc.clientWidth) {
    const culprit = [...document.querySelectorAll<HTMLElement>("body *")].find(
      (el) => el.getBoundingClientRect().right > doc.clientWidth + 0.5 && !el.closest("[aria-hidden='true']"),
    );
    const where = culprit
      ? `${culprit.tagName.toLowerCase()}.${String(culprit.className).slice(0, 60)}`
      : "?";
    faults.push(`page scrolls horizontally by ${doc.scrollWidth - doc.clientWidth}px (${where})`);
  }
  const label = (el: Element) =>
    `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 30)}"`;
  for (const el of document.querySelectorAll<HTMLElement>("a, button")) {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (style.display === "inline" || rect.width <= 2 || el.offsetParent === null) continue;
    if (el.scrollWidth > el.clientWidth + 1)
      faults.push(`${label(el)} clips its text (${el.scrollWidth} > ${el.clientWidth})`);
  }
  for (const img of document.querySelectorAll<HTMLImageElement>("img")) {
    const rect = img.getBoundingClientRect();
    if (!img.complete || !img.naturalWidth || rect.width < 2 || rect.height < 2) continue;
    const style = getComputedStyle(img);
    if (style.objectFit !== "fill") continue;
    // CSS transforms project the painted rectangle, not the image's layout content box.
    // Resolved width/height include padding and borders only with border-box sizing.
    const width =
      Number.parseFloat(style.width) -
      (style.boxSizing === "border-box"
        ? Number.parseFloat(style.paddingLeft) +
          Number.parseFloat(style.paddingRight) +
          Number.parseFloat(style.borderLeftWidth) +
          Number.parseFloat(style.borderRightWidth)
        : 0);
    const height =
      Number.parseFloat(style.height) -
      (style.boxSizing === "border-box"
        ? Number.parseFloat(style.paddingTop) +
          Number.parseFloat(style.paddingBottom) +
          Number.parseFloat(style.borderTopWidth) +
          Number.parseFloat(style.borderBottomWidth)
        : 0);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      faults.push(`img ${img.currentSrc.split("/").pop()} has no measurable content box`);
      continue;
    }
    const natural = img.naturalWidth / img.naturalHeight;
    const drift = Math.abs(width / height - natural) / natural;
    if (drift > 0.02)
      faults.push(`img ${img.currentSrc.split("/").pop()} is stretched (${(drift * 100).toFixed(1)}%)`);
  }
  return faults;
}

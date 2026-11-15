/** Browser-only responsive measurements; self-contained for page.evaluate serialization. */
export function collectLayoutFaults(): string[] {
  // Every helper is declared inside: Playwright serializes this function on its own.
  const doc = document.documentElement;
  const px = (value: string) => Number.parseFloat(value);
  const label = (el: Element) =>
    `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 30)}"`;
  const fileOf = (img: HTMLImageElement) => img.currentSrc.split("/").pop();

  function overflowFaults(): string[] {
    if (doc.scrollWidth <= doc.clientWidth) return [];
    const culprit = [...document.querySelectorAll<HTMLElement>("body *")].find(
      (el) =>
        el.getBoundingClientRect().right > doc.clientWidth + 0.5 &&
        !el.closest("[aria-hidden='true']"),
    );
    const where = culprit
      ? `${culprit.tagName.toLowerCase()}.${String(culprit.className).slice(0, 60)}`
      : "?";
    return [`page scrolls horizontally by ${doc.scrollWidth - doc.clientWidth}px (${where})`];
  }

  function clippedFault(el: HTMLElement): string | null {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (style.display === "inline" || rect.width <= 2 || el.offsetParent === null) return null;
    if (el.scrollWidth <= el.clientWidth + 1) return null;
    return `${label(el)} clips its text (${el.scrollWidth} > ${el.clientWidth})`;
  }

  // CSS transforms project the painted rectangle, not the image's layout content box.
  // Resolved width/height include padding and borders only with border-box sizing.
  function contentBox(style: CSSStyleDeclaration): { width: number; height: number } {
    const borderBox = style.boxSizing === "border-box";
    const horizontal = borderBox
      ? px(style.paddingLeft) +
        px(style.paddingRight) +
        px(style.borderLeftWidth) +
        px(style.borderRightWidth)
      : 0;
    const vertical = borderBox
      ? px(style.paddingTop) +
        px(style.paddingBottom) +
        px(style.borderTopWidth) +
        px(style.borderBottomWidth)
      : 0;
    return { width: px(style.width) - horizontal, height: px(style.height) - vertical };
  }

  function imageFault(img: HTMLImageElement): string | null {
    const rect = img.getBoundingClientRect();
    if (!img.complete || !img.naturalWidth || rect.width < 2 || rect.height < 2) return null;
    const style = getComputedStyle(img);
    if (style.objectFit !== "fill") return null;
    const { width, height } = contentBox(style);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
      return `img ${fileOf(img)} has no measurable content box`;
    const natural = img.naturalWidth / img.naturalHeight;
    const drift = Math.abs(width / height - natural) / natural;
    return drift > 0.02 ? `img ${fileOf(img)} is stretched (${(drift * 100).toFixed(1)}%)` : null;
  }

  const faults = overflowFaults();
  for (const el of document.querySelectorAll<HTMLElement>("a, button")) {
    const fault = clippedFault(el);
    if (fault) faults.push(fault);
  }
  for (const img of document.querySelectorAll<HTMLImageElement>("img")) {
    const fault = imageFault(img);
    if (fault) faults.push(fault);
  }
  return faults;
}

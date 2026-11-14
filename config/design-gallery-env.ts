/** Build-time switch of the state gallery; see the comment in config/next.ts. Pure, so unit tests can run it. */
export function designGalleryEnabled(
  env: Record<string, string | undefined>,
  hostinger: boolean,
): boolean {
  const flag = (env.NEXT_PUBLIC_DESIGN_GALLERY ?? "").trim();
  if (!["", "true", "false"].includes(flag))
    throw new Error(
      'design gallery configuration: NEXT_PUBLIC_DESIGN_GALLERY must be "true" or "false"',
    );
  if (flag !== "true") return false;
  if (hostinger)
    throw new Error("design gallery configuration: refused inside Hostinger's builder");
  if (env.PV_VERIFICATION_BUILD !== "design-gallery")
    throw new Error(
      "design gallery configuration: NEXT_PUBLIC_DESIGN_GALLERY=true needs PV_VERIFICATION_BUILD=design-gallery (npm run build:design-gallery)",
    );
  return true;
}

/**
 * Which Next.js target this build produces. Hostinger's Node.js Web App builder forces
 * `output: 'standalone'` without setting NEXT_OUTPUT; its working directory lives under
 * `/hbuilds/`. config/next.ts, tools/build-info.ts and (through build-info.json)
 * tools/check-assistant-disabled.ts must agree, or the post-build checks look for `out/`.
 */
export type BuildOutput = "export" | "standalone";

export function isHostingerNodeBuilder(cwd: string = process.cwd()): boolean {
  return cwd.replace(/\\/g, "/").includes("/hbuilds/");
}

export function buildOutput(
  env: Record<string, string | undefined> = process.env,
  cwd: string = process.cwd(),
): BuildOutput {
  return env.NEXT_OUTPUT === "standalone" || isHostingerNodeBuilder(cwd) ? "standalone" : "export";
}

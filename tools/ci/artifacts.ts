/** OFF-only, source-bound file transfer. Quarantine is validated before out/ is created. */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Above the committed 25 MiB media budget, with room for HTML/JS; exceeding these fails closed.
export const limits = { files: 4096, fileBytes: 8 * 1024 * 1024, totalBytes: 64 * 1024 * 1024 };
export type Binding = {
  repository: string;
  source_sha: string;
  workflow_sha: string;
  run_id: string;
  run_attempt: string;
  configuration_sha256: string;
  lock_sha256: string;
};
type Member = { path: string; size: number; sha256: string };
type Manifest = {
  schema_version: 1;
  variant: "off-export";
  binding: Binding;
  build_id: string;
  files: Member[];
};
export const digest = (data: string | Uint8Array): string => createHash("sha256").update(data).digest("hex");

function object(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid artifact object");
  const found = Object.keys(value);
  if (found.length !== keys.length || keys.some((key) => !Object.hasOwn(value, key))) {
    throw new Error("Unexpected artifact fields");
  }
  return value as Record<string, unknown>;
}
export function safeMember(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value ||
    value.length > 512 ||
    [...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) ||
    value.includes("\\")
  ) {
    throw new Error("Unsafe artifact member");
  }
  const parts = value.split("/");
  if (
    parts.some((part) => !part || part === "." || part === ".." || part.startsWith(".env") || part === ".git")
  ) {
    throw new Error("Unsafe artifact member");
  }
  if (/^[a-z]:/i.test(value) || /\.(?:pem|key|sqlite3?|db|dump|bak)$/i.test(value)) {
    throw new Error("Unexpected artifact member");
  }
  return value;
}
export function requireBinding(actual: unknown, expected: Binding): void {
  const found = object(actual, Object.keys(expected));
  if (Object.keys(expected).length !== 7 || expected.repository !== "gonzalomartinperez/pequeverso") {
    throw new Error("Invalid expected producer");
  }
  for (const key of ["source_sha", "workflow_sha"] as const) {
    if (!/^[0-9a-f]{40}$/.test(expected[key])) throw new Error("Invalid source identity");
  }
  for (const key of ["configuration_sha256", "lock_sha256"] as const) {
    if (!/^[0-9a-f]{64}$/.test(expected[key])) throw new Error("Invalid input identity");
  }
  for (const key of ["run_id", "run_attempt"] as const) {
    if (!/^[1-9][0-9]{0,19}$/.test(expected[key])) throw new Error("Invalid run identity");
  }
  for (const key of Object.keys(expected) as (keyof Binding)[]) {
    if (found[key] !== expected[key]) throw new Error("Artifact producer/input mismatch");
  }
}
export function buildIdentity(
  bytes: Uint8Array,
  expected: Binding,
  assistant: "enabled" | "disabled",
): string {
  const info = object(JSON.parse(Buffer.from(bytes).toString("utf8")), [
    "sha",
    "ref",
    "builtAt",
    "output",
    "assistant",
  ]);
  if (
    info.sha !== expected.source_sha ||
    info.assistant !== assistant ||
    info.output !== "export" ||
    typeof info.ref !== "string" ||
    !info.ref.trim() ||
    typeof info.builtAt !== "string" ||
    !Number.isFinite(Date.parse(info.builtAt))
  )
    throw new Error("Build identity mismatch");
  return digest(bytes);
}

export function requireMembers(value: unknown): Member[] {
  if (!Array.isArray(value) || !value.length || value.length > limits.files) {
    throw new Error("Invalid artifact file inventory");
  }
  const names = new Set<string>();
  let total = 0;
  const members = value.map((value: unknown) => {
    const entry = object(value, ["path", "size", "sha256"]);
    const path = safeMember(entry.path);
    if (
      names.has(path) ||
      [...names].some((name) => path.startsWith(`${name}/`) || name.startsWith(`${path}/`))
    ) {
      throw new Error("Duplicate or conflicting artifact members");
    }
    names.add(path);
    if (
      typeof entry.size !== "number" ||
      !Number.isSafeInteger(entry.size) ||
      entry.size < 0 ||
      entry.size > limits.fileBytes
    ) {
      throw new Error("Invalid member size");
    }
    total += entry.size;
    if (
      total > limits.totalBytes ||
      typeof entry.sha256 !== "string" ||
      !/^[0-9a-f]{64}$/.test(entry.sha256)
    ) {
      throw new Error("Invalid total size/member identity");
    }
    return { path, size: entry.size, sha256: entry.sha256 };
  });
  if (!names.has("index.html") || !names.has("build-info.json") || names.has("UNPUBLISHABLE.txt")) {
    throw new Error("Not an OFF export");
  }
  return members;
}
export function requireManifest(value: unknown, expected: Binding, actual: readonly Member[]): Manifest {
  const manifest = object(value, ["schema_version", "variant", "binding", "build_id", "files"]);
  if (manifest.schema_version !== 1 || manifest.variant !== "off-export")
    throw new Error("Not an OFF manifest");
  requireBinding(manifest.binding, expected);
  const members = requireMembers(manifest.files);
  requireMembers(actual);
  const order = (items: readonly Member[]) => [...items].sort((a, b) => a.path.localeCompare(b.path));
  if (JSON.stringify(order(members)) !== JSON.stringify(order(actual)))
    throw new Error("Payload file set differs");
  if (typeof manifest.build_id !== "string" || !/^[0-9a-f]{64}$/.test(manifest.build_id)) {
    throw new Error("Invalid build identity");
  }
  return {
    schema_version: 1,
    variant: "off-export",
    binding: expected,
    build_id: manifest.build_id,
    files: members,
  };
}
export function requireRegular(
  stat: { isFile(): boolean; nlink: number; size: number },
  maximum: number,
): void {
  if (
    !stat.isFile() ||
    stat.nlink !== 1 ||
    !Number.isSafeInteger(stat.size) ||
    stat.size < 0 ||
    stat.size > maximum
  )
    throw new Error("Expected bounded regular file");
}
function readRegular(path: string, maximum: number): Buffer {
  requireRegular(lstatSync(path), maximum);
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const initial = fstatSync(fd);
    requireRegular(initial, maximum);
    const bytes = Buffer.allocUnsafe(initial.size + 1);
    let length = 0;
    for (;;) {
      const count = readSync(fd, bytes, length, bytes.length - length, null);
      length += count;
      if (length > initial.size) throw new Error("File grew during validation");
      if (!count) break;
    }
    const final = fstatSync(fd);
    requireRegular(final, maximum);
    if (length !== initial.size || final.size !== initial.size || final.mtimeMs !== initial.mtimeMs) {
      throw new Error("File changed during validation");
    }
    return bytes.subarray(0, length);
  } finally {
    closeSync(fd);
  }
}
export function payloadInventory(directory: string): Member[] {
  const files: Member[] = [];
  let total = 0;
  let directories = 0;
  function visit(relative: string): void {
    directories += 1;
    if (directories > limits.files || relative.split("/").length > 32)
      throw new Error("Directory inventory exceeds bounds");
    const current = join(directory, relative);
    const stat = lstatSync(current);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("Linked or non-directory payload");
    for (const entry of readdirSync(current, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const path = safeMember(relative ? `${relative}/${entry.name}` : entry.name);
      if (entry.isDirectory()) visit(path);
      else {
        const bytes = readRegular(join(directory, path), limits.fileBytes);
        total += bytes.length;
        if (files.length >= limits.files || total > limits.totalBytes)
          throw new Error("Payload exceeds bounds");
        files.push({ path, size: bytes.length, sha256: digest(bytes) });
      }
    }
  }
  visit("");
  requireMembers(files);
  return files;
}
/** Read-only quarantine validation; the caller creates out/ only after this succeeds. */
export function validateOffArtifact(artifact: string, binding: Binding, checksum: string): Manifest {
  const root = lstatSync(artifact);
  if (
    !root.isDirectory() ||
    root.isSymbolicLink() ||
    JSON.stringify(readdirSync(artifact).sort()) !== JSON.stringify(["manifest.json", "payload"])
  )
    throw new Error("Unexpected artifact root");
  const serialized = readRegular(join(artifact, "manifest.json"), 1024 * 1024);
  if (digest(serialized) !== checksum) throw new Error("Producer manifest checksum mismatch");
  const payload = join(artifact, "payload");
  const manifest = requireManifest(
    JSON.parse(serialized.toString("utf8")),
    binding,
    payloadInventory(payload),
  );
  if (
    buildIdentity(readRegular(join(payload, "build-info.json"), 8192), binding, "disabled") !==
    manifest.build_id
  ) {
    throw new Error("Build identity mismatch");
  }
  return manifest;
}
function expectedBinding(): Binding {
  const source = process.env.GITHUB_SHA ?? "";
  if (execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim() !== source) {
    throw new Error("Checked source differs from candidate");
  }
  if (process.env.CI_CANDIDATE_SHA && process.env.CI_CANDIDATE_SHA !== source)
    throw new Error("Candidate mismatch");
  const keys = [
    "NEXT_OUTPUT",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_CHECKOUT_URL_GRAFISMO_FONETICO",
    "NEXT_PUBLIC_META_PIXEL_ID",
    "NEXT_PUBLIC_ASSISTANT_ENABLED",
    "NEXT_PUBLIC_ASSISTANT_API_ORIGIN",
  ];
  const inputs = Object.fromEntries(keys.map((key) => [key, process.env[key] ?? ""]));
  return {
    repository: process.env.GITHUB_REPOSITORY ?? "",
    source_sha: source,
    workflow_sha: process.env.GITHUB_WORKFLOW_SHA ?? source,
    run_id: process.env.GITHUB_RUN_ID ?? "",
    run_attempt: process.env.GITHUB_RUN_ATTEMPT ?? "",
    configuration_sha256: digest(
      JSON.stringify({
        inputs,
        next: digest(readRegular("config/next.ts", limits.fileBytes)),
        edge: digest(readRegular("config/edge-rules.json", limits.fileBytes)),
      }),
    ),
    lock_sha256: digest(readRegular("package-lock.json", limits.fileBytes)),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [mode, directory, artifact] = process.argv.slice(2);
    if (!directory || !artifact) throw new Error("Explicit artifact paths required");
    const binding = expectedBinding();
    requireBinding(binding, binding);
    if (mode === "pack-off") {
      if (directory !== "out" || existsSync(artifact)) throw new Error("Unexpected root or existing package");
      const files = payloadInventory(directory);
      const build_id = buildIdentity(
        readRegular(join(directory, "build-info.json"), 8192),
        binding,
        "disabled",
      );
      const manifest = { schema_version: 1, variant: "off-export", binding, build_id, files };
      requireManifest(manifest, binding, files);
      const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
      mkdirSync(join(artifact, "payload"), { recursive: true });
      for (const file of files) {
        const bytes = readRegular(join(directory, file.path), limits.fileBytes);
        if (digest(bytes) !== file.sha256) throw new Error("Export changed during transfer");
        const target = join(artifact, "payload", file.path);
        mkdirSync(resolve(target, ".."), { recursive: true });
        writeFileSync(target, bytes, { flag: "wx" });
      }
      writeFileSync(join(artifact, "manifest.json"), serialized, { flag: "wx" });
      if (process.env.GITHUB_OUTPUT)
        writeFileSync(
          process.env.GITHUB_OUTPUT,
          `manifest_sha256=${digest(serialized)}\nsource_sha=${binding.source_sha}\n`,
          { flag: "a" },
        );
    } else if (mode === "unpack-off") {
      if (directory !== "out" || existsSync(directory)) throw new Error("Expected absent export root");
      const manifest = validateOffArtifact(artifact, binding, process.env.CI_MANIFEST_SHA256 ?? "");
      const payload = join(artifact, "payload");
      mkdirSync(directory);
      for (const file of manifest.files) {
        const bytes = readRegular(join(payload, file.path), limits.fileBytes);
        if (digest(bytes) !== file.sha256) throw new Error("Payload changed during transfer");
        const target = join(directory, file.path);
        mkdirSync(resolve(target, ".."), { recursive: true });
        writeFileSync(target, bytes, { flag: "wx" });
      }
    } else if (mode === "attest-native") {
      if (directory !== "out-assistant-fixture") throw new Error("Unexpected native fixture root");
      const build_id = buildIdentity(
        readRegular(join(directory, "build-info.json"), 8192),
        binding,
        "enabled",
      );
      writeFileSync(
        artifact,
        `${JSON.stringify({ ...binding, variant: "native-fixture", build_id, uploaded_export: false }, null, 2)}\n`,
      );
    } else throw new Error("Unknown artifact operation");
    console.log("Candidate identity and file integrity checked; no delivery authorized.");
  } catch {
    console.error("Candidate artifact validation failed (input details withheld).");
    process.exitCode = 1;
  }
}

// Polls <origin>/build-info.json until it reports the expected commit.
// Usage: node scripts/wait-for-revision.mjs <origin> <sha> [timeoutSeconds]
// Appends a short table to $GITHUB_STEP_SUMMARY when set.
import { appendFileSync } from "node:fs";

const [origin, expected, timeoutArg] = process.argv.slice(2);
const timeoutSeconds = Number(timeoutArg || 600);
const intervalSeconds = 20;

if (!origin || !expected) {
  console.error("usage: wait-for-revision <origin> <sha> [timeoutSeconds]");
  process.exit(2);
}

const base = origin.replace(/\/$/, "");

async function liveInfo() {
  try {
    const res = await fetch(`${base}/build-info.json`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function summarize(rows) {
  if (!process.env.GITHUB_STEP_SUMMARY) return;
  const table = [
    "## Production revision",
    "",
    "| | |",
    "|---|---|",
    ...rows.map(([k, v]) => `| ${k} | ${v} |`),
    "",
  ];
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${table.join("\n")}\n`);
}

const started = Date.now();
const deadline = started + timeoutSeconds * 1000;
let polls = 0;
let last = null;
while (Date.now() < deadline) {
  polls += 1;
  last = await liveInfo();
  const elapsed = Math.round((Date.now() - started) / 1000);
  if (last?.sha === expected) {
    console.log(`revision ${expected} is live after ${elapsed}s (${polls} polls)`);
    summarize([
      ["Origin", base],
      ["Commit", `\`${expected}\` (${last.ref ?? "?"}, built ${last.builtAt ?? "?"})`],
      ["Live after", `${elapsed} s (${polls} polls)`],
    ]);
    process.exit(0);
  }
  console.log(`waiting: live=${last?.sha ?? "unreachable"} expected=${expected} (${elapsed}s)`);
  await new Promise((resolve) => setTimeout(resolve, intervalSeconds * 1000));
}
console.error(`timeout: production did not reach ${expected} within ${timeoutSeconds}s`);
summarize([
  ["Origin", base],
  ["Expected", `\`${expected}\``],
  ["Live", `\`${last?.sha ?? "unreachable"}\``],
  ["Result", `timeout after ${timeoutSeconds} s (${polls} polls)`],
]);
process.exit(1);

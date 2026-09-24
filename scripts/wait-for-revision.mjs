// Polls <origin>/build-info.json until it reports the expected commit, or a newer commit that
// already contains it (Hostinger builds only the latest push when merges land close together).
// Usage: node scripts/wait-for-revision.mjs <origin> <sha> [timeoutSeconds]
// Writes `live_sha` to $GITHUB_OUTPUT and a short table to $GITHUB_STEP_SUMMARY when set; the
// descendant check uses the GitHub compare API ($GITHUB_REPOSITORY, optional $GITHUB_TOKEN).
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

/** True when `live` is a later commit on the same history as `expected`. */
async function supersedes(live) {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo || !live) return false;
  const headers = { accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/compare/${expected}...${live}`, {
      headers,
    });
    if (!res.ok) return false;
    const { status } = await res.json();
    return status === "ahead";
  } catch {
    return false;
  }
}

function output(sha) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `live_sha=${sha}\n`);
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
  if (last?.sha && last.sha !== expected && (await supersedes(last.sha))) {
    console.log(`revision ${expected} superseded by live ${last.sha} after ${elapsed}s`);
    output(last.sha);
    summarize([
      ["Origin", base],
      ["Commit", `\`${expected}\` superseded by live \`${last.sha}\` (built ${last.builtAt ?? "?"})`],
      ["Live after", `${elapsed} s (${polls} polls)`],
    ]);
    process.exit(0);
  }
  if (last?.sha === expected) {
    console.log(`revision ${expected} is live after ${elapsed}s (${polls} polls)`);
    output(expected);
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

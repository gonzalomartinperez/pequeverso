// Polls <origin>/build-info.json until it reports the expected commit.
// Usage: node scripts/wait-for-revision.mjs <origin> <sha> [timeoutSeconds]
const [origin, expected, timeoutArg] = process.argv.slice(2);
const timeoutSeconds = Number(timeoutArg || 600);
const intervalSeconds = 20;

if (!origin || !expected) {
  console.error("usage: wait-for-revision <origin> <sha> [timeoutSeconds]");
  process.exit(2);
}

async function liveSha() {
  try {
    const res = await fetch(`${origin.replace(/\/$/, "")}/build-info.json`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()).sha ?? null;
  } catch {
    return null;
  }
}

const deadline = Date.now() + timeoutSeconds * 1000;
while (Date.now() < deadline) {
  const sha = await liveSha();
  if (sha === expected) {
    console.log(`revision ${sha} is live`);
    process.exit(0);
  }
  console.log(`waiting: live=${sha ?? "unreachable"} expected=${expected}`);
  await new Promise((resolve) => setTimeout(resolve, intervalSeconds * 1000));
}
console.error(`timeout: production did not reach ${expected} within ${timeoutSeconds}s`);
process.exit(1);

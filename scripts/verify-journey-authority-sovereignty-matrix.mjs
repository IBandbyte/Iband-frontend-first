import { spawnSync } from "node:child_process";

const scripts = [
  "scripts/verify-journey-durable-authority-store.mjs",
  "scripts/verify-journey-authority-read-facade.mjs",
  "scripts/verify-journey-progression-authority-adapter.mjs",
  "scripts/verify-journey-authority-atomic-transition.mjs",
  "scripts/verify-journey-authority-acceptance-materialization.mjs",
  "scripts/verify-journey-authority-live-read-cutover.mjs",
  "scripts/verify-journey-authority-live-write-cutover.mjs",
  "scripts/verify-journey-authority-noop-acceptance-cutover.mjs",
  "scripts/verify-journey-authority-exception-recovery-sovereignty.mjs",
  "scripts/verify-journey-progression-project-lock.mjs",
  "scripts/verify-journey-recommendation-atomic-integration.mjs",
  "scripts/verify-journey-recommendation-acceptance-consumption.mjs",
  "scripts/verify-movie-mentor-acceptance-reload-reality.mjs",
  "scripts/verify-journey-creator-truth-authority-projection.mjs",
  "scripts/verify-movie-mentor-live-journey-projection.mjs",
  "scripts/verify-journey-authority-live-callback-barrier.mjs",
];

for (const script of scripts) {
  console.log(`\n=== ${script} ===`);
  const result = spawnSync(process.execPath, [script], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`\nJourney Authority sovereignty matrix FAILED at ${script}`);
    process.exit(result.status || 1);
  }
}

console.log("\nJourney Authority sovereignty matrix: PASS");
console.log(`- ${scripts.length} authority, CAS, recovery, reload, lifecycle, creator-truth and live-callback gates passed in one run`);
console.log("- Creator Memory remains projection/context storage, never mechanical Journey sovereignty");

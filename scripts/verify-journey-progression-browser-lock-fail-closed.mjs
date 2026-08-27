import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { withJourneyProgressionProjectLock } from "../src/components/studio/mentor/JourneyProgressionProjectLock.js";

const ROOT = process.cwd();
const source = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/JourneyProgressionProjectLock.js"), "utf8");

let browserCallbackRan = false;
await assert.rejects(
  withJourneyProgressionProjectLock({
    projectId: "movie-browser-no-web-locks",
    locksApi: null,
    browserRuntime: true,
    callback: async () => { browserCallbackRan = true; },
  }),
  (error) => error?.code === "JOURNEY_PROGRESSION_CROSS_TAB_LOCK_UNAVAILABLE"
);
assert.equal(browserCallbackRan, false, "Browser transaction callback must never run without a cross-context lock.");

const fallbackEvents = [];
const fallbackResults = await Promise.all([
  withJourneyProgressionProjectLock({
    projectId: "movie-non-browser-fallback",
    locksApi: null,
    browserRuntime: false,
    callback: async (proof) => {
      fallbackEvents.push("A-start");
      await new Promise((resolve) => setTimeout(resolve, 10));
      fallbackEvents.push("A-end");
      return proof;
    },
  }),
  withJourneyProgressionProjectLock({
    projectId: "movie-non-browser-fallback",
    locksApi: null,
    browserRuntime: false,
    callback: async (proof) => {
      fallbackEvents.push("B-start");
      fallbackEvents.push("B-end");
      return proof;
    },
  }),
]);
assert.deepEqual(fallbackEvents, ["A-start", "A-end", "B-start", "B-end"]);
assert.equal(fallbackResults[0].mode, "in-process-fallback");
assert.equal(fallbackResults[0].crossTabSerialized, false);
assert.equal(fallbackResults[1].mode, "in-process-fallback");

const fakeLocks = {
  async request(name, options, callback) {
    assert.equal(options.mode, "exclusive");
    return callback({ name });
  },
};
const webProof = await withJourneyProgressionProjectLock({
  projectId: "movie-browser-web-locks",
  locksApi: fakeLocks,
  browserRuntime: true,
  callback: async (proof) => proof,
});
assert.equal(webProof.mode, "web-locks");
assert.equal(webProof.crossTabSerialized, true);

assert.ok(source.includes('JOURNEY_PROGRESSION_CROSS_TAB_LOCK_UNAVAILABLE'));
assert.ok(source.includes('if (browserRuntime)'));
assert.ok(source.indexOf('if (browserRuntime)') < source.indexOf('return withFallbackProjectLock(lockName, callback);'));

console.log("Journey progression browser lock fail-closed verification passed.");
console.log("- browser progression cannot execute without Web Locks");
console.log("- callback is never entered in the unsafe browser universe");
console.log("- non-browser/test runtimes retain deterministic in-process serialization");
console.log("- browser Web Locks remain the authoritative cross-tab serializer");

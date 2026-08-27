import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createAuthorityMaterializationReference } from "../src/components/studio/mentor/JourneyRecommendationAcceptanceExecutionRuntime.js";

const ROOT = process.cwd();
const source = fs.readFileSync(
  path.join(ROOT, "src/components/studio/mentor/JourneyRecommendationAcceptanceExecutionRuntime.js"),
  "utf8"
);

const projectId = "movie-project-materialization-handoff";
const recommendationEnvelope = {
  recommendationId: "journey-recommendation:materialization-handoff",
  fingerprint: "fingerprint-materialization-handoff",
  issuedAgainst: {
    progressionRevision: 2,
    currentStageId: "idea",
    currentTaskId: "premise",
    creatorAuthorityRevision: 7,
    turnRevision: 6,
  },
  target: { stageId: "characters", taskId: "protagonist" },
};

const materialized = createAuthorityMaterializationReference(recommendationEnvelope, projectId);
assert.equal(materialized.recommendationId, recommendationEnvelope.recommendationId);
assert.equal(materialized.recommendationFingerprint, recommendationEnvelope.fingerprint);
assert.equal(materialized.projectId, projectId);
assert.equal(materialized.issuedAgainst.progressionRevision, 2);
assert.deepEqual(materialized.target, recommendationEnvelope.target);
assert.deepEqual(materialized.lifecycle, { current: true, terminalReason: null });

assert.throws(
  () => createAuthorityMaterializationReference({ recommendationId: "x", fingerprint: "" }, projectId),
  (error) => error?.code === "JOURNEY_RECOMMENDATION_ACCEPTANCE_MATERIALIZATION_INVALID"
);

const progressionCall = source.indexOf("const result = await progressionRuntime.execute({");
const recommendationInput = source.indexOf("recommendationId,", progressionCall);
const fingerprintInput = source.indexOf("recommendationFingerprint:", progressionCall);
const materializationInput = source.indexOf("acceptedRecommendationReference: createAuthorityMaterializationReference(recommendationEnvelope, pid)", progressionCall);
assert.ok(progressionCall >= 0, "Movement acceptance must route through progression runtime.");
assert.ok(recommendationInput > progressionCall, "Progression input must carry canonical recommendation ID.");
assert.ok(fingerprintInput > progressionCall, "Progression input must carry canonical recommendation fingerprint.");
assert.ok(materializationInput > progressionCall, "Progression input must carry certified authority materialization evidence.");
assert.ok(
  source.indexOf("const acceptance = createRecommendationAcceptanceAuthority({") < progressionCall,
  "Authority materialization handoff must remain downstream of the canonical recommendation acceptance boundary."
);

console.log("Journey acceptance authority materialization handoff verification passed.");
console.log("- canonical recommendation identity becomes exact authority lifecycle materialization evidence");
console.log("- movement acceptance carries that evidence into progression transaction input");
console.log("- materialization remains downstream of canonical freshness/creator-acceptance authority");
console.log("- incomplete recommendation identity fails closed before authority materialization");

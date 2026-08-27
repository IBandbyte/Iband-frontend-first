import assert from "node:assert/strict";
import {
  createAuthorityRecommendationRecord,
  findAuthorityRecommendation,
  upsertAuthorityRecommendation,
  consumeAuthorityRecommendation,
  invalidateAuthorityRecommendations,
} from "../src/components/studio/mentor/JourneyAuthorityRecommendationLifecycle.js";

function reference(id, revision, stageId, taskId = null) {
  return {
    recommendationId: id,
    recommendationFingerprint: `fp:${id}`,
    projectId: "movie-project-lifecycle",
    issuedAgainst: { progressionRevision: revision },
    target: { stageId, taskId },
    lifecycle: { current: true, terminalReason: null },
  };
}

const r1 = createAuthorityRecommendationRecord(reference("rec-1", 7, "characters", "main-characters"));
const r2 = createAuthorityRecommendationRecord(reference("rec-2", 7, "story-direction", "creative-direction"));
let records = upsertAuthorityRecommendation([], r1);
records = upsertAuthorityRecommendation(records, r2);
assert.equal(records.length, 2);
assert.equal(findAuthorityRecommendation(records, "rec-1").lifecycle.current, true);

const consumed = consumeAuthorityRecommendation(records, {
  recommendationId: "rec-1",
  fingerprint: "fp:rec-1",
  expectedProgressionRevision: 7,
  terminalProgressionRevision: 8,
  operationId: "journey-recommendation-acceptance:rec-1",
  creatorActId: "creator-act-1",
});
assert.equal(consumed.status, "consumed");
assert.equal(consumed.record.lifecycle.terminalReason, "consumed");
assert.equal(consumed.record.lifecycle.terminalProgressionRevision, 8);

const invalidated = invalidateAuthorityRecommendations(consumed.records, {
  projectId: "movie-project-lifecycle",
  issuedAgainstProgressionRevision: 7,
  terminalProgressionRevision: 8,
  operationId: "journey-recommendation-acceptance:rec-1",
  exceptRecommendationId: "rec-1",
});
assert.equal(findAuthorityRecommendation(invalidated, "rec-1").lifecycle.terminalReason, "consumed");
assert.equal(findAuthorityRecommendation(invalidated, "rec-2").lifecycle.terminalReason, "invalidated-by-progression");

const retry = consumeAuthorityRecommendation(invalidated, {
  recommendationId: "rec-1",
  fingerprint: "fp:rec-1",
  expectedProgressionRevision: 7,
  terminalProgressionRevision: 8,
  operationId: "journey-recommendation-acceptance:rec-1",
  creatorActId: "creator-act-zorg-retry",
});
assert.equal(retry.status, "already-consumed");
assert.equal(retry.record.lifecycle.creatorActId, "creator-act-1");

assert.throws(() => consumeAuthorityRecommendation(records, {
  recommendationId: "rec-1",
  fingerprint: "fp:tampered",
  expectedProgressionRevision: 7,
  terminalProgressionRevision: 8,
  operationId: "op-x",
}), (error) => error?.code === "JOURNEY_AUTHORITY_RECOMMENDATION_IDENTITY_CONFLICT");

assert.throws(() => consumeAuthorityRecommendation(records, {
  recommendationId: "rec-1",
  fingerprint: "fp:rec-1",
  expectedProgressionRevision: 8,
  terminalProgressionRevision: 9,
  operationId: "op-y",
}), (error) => error?.code === "JOURNEY_AUTHORITY_RECOMMENDATION_STALE");

const noOp = consumeAuthorityRecommendation(records, {
  recommendationId: "rec-1",
  fingerprint: "fp:rec-1",
  expectedProgressionRevision: 7,
  terminalProgressionRevision: 7,
  operationId: "journey-recommendation-noop:rec-1",
  creatorActId: "creator-act-noop",
  withoutMovement: true,
});
assert.equal(noOp.record.lifecycle.consumedWithoutMovement, true);
assert.equal(noOp.record.lifecycle.terminalProgressionRevision, 7);

console.log("Journey authority recommendation lifecycle verification passed.");
console.log("- exact accepted recommendation becomes consumed");
console.log("- other recommendations issued against the old Journey become invalidated");
console.log("- exact consumed retry returns original lifecycle proof");
console.log("- fingerprint and revision conflicts fail closed");
console.log("- no-op consumption preserves Journey revision while recording durable consumption");

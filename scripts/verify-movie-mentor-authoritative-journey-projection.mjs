import assert from "node:assert/strict";
import { reconcileAuthoritativeCreatorTruth } from "../src/components/studio/mentor/CreatorJourneyAuthoritativeProjection.js";

const position = { currentStageId: "story-direction", currentTaskId: "story-foundation", resumePoint: { stageId: "story-direction", taskId: "story-foundation", sceneId: null, note: "keep-position", savedAt: "2026-08-26T20:00:00.000Z" } };
const journeyN = { projectId: "p-11e1", ...structuredClone(position), stages: [{ id: "story-direction", status: "active", tasks: [{ id: "story-foundation", status: "active" }] }, { id: "characters", status: "not-started", tasks: [{ id: "main-characters", status: "not-started" }] }], decisions: [{ id: "local-provisional", key: "story.tone", value: "hopeful", authority: "mentor-provisional", status: "active", metadata: {} }], metadata: {} };
const authority8 = { revision: 8, currentCreatorTruth: [{ key: "creatorDecision.semantic.story.route", value: "hidden tunnel", authority: "creator", confidenceSource: "creator-confirmed", decisionKey: "semantic.story.route", decisionId: "decision-route-8", decisionFingerprint: "fp-8", decisionIntent: "adoption", evidence: "Use the hidden tunnel", evidenceSource: "creator-explicit-semantic", current: true, createdAt: "2026-08-26T20:01:00.000Z" }] };

const projected8 = reconcileAuthoritativeCreatorTruth(journeyN, authority8);
assert.equal(projected8.metadata.authoritativeCreatorProjectionRevision, 8);
assert.deepEqual({ currentStageId: projected8.currentStageId, currentTaskId: projected8.currentTaskId, resumePoint: projected8.resumePoint }, position);
assert.deepEqual(projected8.stages, journeyN.stages, "projection must not move stage/task status");
assert.equal(projected8.decisions.find(d => d.id === "local-provisional").status, "active", "non-authoritative Journey evidence must survive");
const route8 = projected8.decisions.find(d => d.metadata?.durableDecisionId === "decision-route-8");
assert.equal(route8.id, "decision-route-8");assert.equal(route8.key, "story.route");assert.equal(route8.value, "hidden tunnel");assert.equal(route8.metadata.durableDecisionFingerprint, "fp-8");assert.equal(route8.createdAt, "2026-08-26T20:01:00.000Z");

const replay8 = reconcileAuthoritativeCreatorTruth(projected8, structuredClone(authority8));
assert.deepEqual(replay8, projected8, "same-revision replay must be exactly idempotent");
assert.equal(replay8.decisions.filter(d => d.metadata?.durableDecisionId === "decision-route-8").length, 1);

const restarted = structuredClone(JSON.parse(JSON.stringify(projected8)));
const replayAfterRestart = reconcileAuthoritativeCreatorTruth(restarted, structuredClone(authority8));
assert.deepEqual(replayAfterRestart, restarted, "restart replay must remain idempotent");

assert.throws(() => reconcileAuthoritativeCreatorTruth(projected8, { ...authority8, revision: 7 }), error => error.code === "CREATOR_JOURNEY_STALE_AUTHORITY");

const authority9 = { revision: 9, currentCreatorTruth: [{ key: "creatorDecision.semantic.story.route", value: "lighthouse", authority: "creator", confidenceSource: "creator-confirmed", decisionKey: "semantic.story.route", decisionId: "decision-route-9", decisionFingerprint: "fp-9", decisionIntent: "correction", evidence: "Actually use the lighthouse", evidenceSource: "creator-explicit-semantic", current: true, createdAt: "2026-08-26T20:02:00.000Z" }] };
const projected9 = reconcileAuthoritativeCreatorTruth(restarted, authority9);
const oldRoute = projected9.decisions.find(d => d.metadata?.durableDecisionId === "decision-route-8");
const newRoute = projected9.decisions.find(d => d.metadata?.durableDecisionId === "decision-route-9");
assert.equal(oldRoute.status, "superseded");assert.equal(oldRoute.metadata.supersededByDecisionId, "decision-route-9");assert.equal(newRoute.status, "active");assert.equal(newRoute.value, "lighthouse");assert.equal(newRoute.key, "story.route");
assert.deepEqual({ currentStageId: projected9.currentStageId, currentTaskId: projected9.currentTaskId, resumePoint: projected9.resumePoint }, position);
assert.deepEqual(projected9.stages, journeyN.stages);

const absentDoesNotDelete = reconcileAuthoritativeCreatorTruth(projected9, { revision: 10, currentCreatorTruth: [{ key: "creatorDecision.semantic.character.maya.goal", value: "protect Eli", authority: "creator", confidenceSource: "creator-confirmed", decisionKey: "semantic.character.maya.goal", decisionId: "decision-goal-10", decisionFingerprint: "fp-10", decisionIntent: "adoption", current: true, createdAt: "2026-08-26T20:03:00.000Z" }] });
assert.equal(absentDoesNotDelete.decisions.find(d => d.metadata?.durableDecisionId === "decision-route-9").status, "active", "absence alone must never mean deletion");

assert.throws(() => reconcileAuthoritativeCreatorTruth(journeyN, { revision: 8, currentCreatorTruth: [{ key: "bad", decisionKey: "semantic.bad", decisionId: "bad", authority: "mentor", current: true }] }), error => error.code === "CREATOR_JOURNEY_AUTHORITY_INVALID");

console.log("Movie Mentor authoritative Journey projection torture: PASS — N→N+1 projection preserves durable identity, replay/restart are idempotent, stale authority is denied, N+2 supersedes by durable key, absence never deletes, and stage/task position never moves.");

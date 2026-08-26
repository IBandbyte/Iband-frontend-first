import assert from "node:assert/strict";
import createCreatorJourneyEngine from "../src/components/studio/mentor/CreatorJourneyEngine.js";
import { projectCommittedCreatorAuthorityIntoJourney } from "../src/components/studio/mentor/MovieMentorJourneyProjectionRuntime.js";

const engine = createCreatorJourneyEngine();
const position = { currentStageId: "story-direction", currentTaskId: "story-foundation", resumePoint: { stageId: "story-direction", taskId: "story-foundation", sceneId: null, note: "frozen", savedAt: "2026-08-27T00:00:00.000Z" } };
const journey = { projectId: "p-11e2", ...structuredClone(position), stages: [{ id: "story-direction", status: "active", tasks: [{ id: "story-foundation", status: "active" }] }, { id: "characters", status: "not-started", tasks: [{ id: "main-characters", status: "not-started" }] }], decisions: [], metadata: {} };
let durableProject = { id: "p-11e2", metadata: { projectJourney: structuredClone(journey) } };
const identityRuntime = { persistJourney(projectId, projectJourney) { assert.equal(projectId, durableProject.id); durableProject = { ...durableProject, metadata: { ...durableProject.metadata, projectJourney: structuredClone(projectJourney) } }; return structuredClone(durableProject); } };
const authority = { revision: 12, currentCreatorTruth: [{ key: "creatorDecision.semantic.story.route", value: "Zorgachu's tunnel", authority: "creator", confidenceSource: "creator-confirmed", decisionKey: "semantic.story.route", decisionId: "decision-route-12", decisionFingerprint: "fp-12", decisionIntent: "adoption", evidence: "Use Zorgachu's tunnel", evidenceSource: "creator-explicit-semantic", current: true, createdAt: "2026-08-27T00:01:00.000Z" }] };

const result = projectCommittedCreatorAuthorityIntoJourney({ journeyEngine: engine, identityRuntime, projectJourney: journey, projectId: "p-11e2", turnResult: { postCommitCreatorAuthority: authority, mayAdvanceJourney: false } });
assert.equal(result.status, "projected-and-persisted");
assert.equal(result.projectJourney.metadata.authoritativeCreatorProjectionRevision, 12);
assert.equal(result.projectJourney.decisions.find(d => d.metadata?.durableDecisionId === "decision-route-12")?.value, "Zorgachu's tunnel");
assert.deepEqual({ currentStageId: result.projectJourney.currentStageId, currentTaskId: result.projectJourney.currentTaskId, resumePoint: result.projectJourney.resumePoint }, position);
assert.deepEqual(result.projectJourney.stages, journey.stages, "live projection must not alter stage/task statuses");

const restartedJourney = structuredClone(JSON.parse(JSON.stringify(durableProject.metadata.projectJourney)));
assert.equal(restartedJourney.decisions.find(d => d.metadata?.durableDecisionId === "decision-route-12")?.value, "Zorgachu's tunnel", "restart must expose durable N+1 decision");
assert.deepEqual({ currentStageId: restartedJourney.currentStageId, currentTaskId: restartedJourney.currentTaskId, resumePoint: restartedJourney.resumePoint }, position, "restart must retain frozen position");
assert.deepEqual(restartedJourney.stages, journey.stages, "restart must retain frozen stage/task statuses");

const noAuthority = projectCommittedCreatorAuthorityIntoJourney({ journeyEngine: engine, identityRuntime, projectJourney: restartedJourney, projectId: "p-11e2", turnResult: { postCommitCreatorAuthority: null, mayAdvanceJourney: true } });
assert.equal(noAuthority.status, "no-post-commit-authority");
assert.deepEqual(noAuthority.projectJourney, restartedJourney, "mayAdvanceJourney alone must never mutate Journey truth or position");

console.log("Movie Mentor live Journey projection furnace: PASS — N+1 durable creator authority projects through canonical CreatorJourneyEngine, persists into the active project, survives restart visibly, and stage/task/resume position remains frozen.");

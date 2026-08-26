import assert from "node:assert/strict";
import {
  POSITION_ACTIONS,
  POSITION_AUTHORITY_CLASSES,
  POSITION_AUTHORITY_SOURCES,
  classifyJourneyPositionSource,
  issueJourneyPositionAuthority,
  validateJourneyPositionAuthority,
  consumeJourneyPositionAuthority,
} from "../src/components/studio/mentor/JourneyPositionAuthorityControl.js";

const projectId = "movie-project-11e3c";
const issuedAt = "2026-08-27T00:20:00.000Z";

function expectCode(fn, code) {
  let thrown = null;
  try { fn(); } catch (error) { thrown = error; }
  assert.ok(thrown, `Expected ${code} to throw`);
  assert.equal(thrown.code, code);
}

// Classification contract from Door 11E3A.
assert.equal(classifyJourneyPositionSource(POSITION_AUTHORITY_SOURCES.SEMANTIC_READY_TO_ADVANCE), POSITION_AUTHORITY_CLASSES.ADVISORY);
assert.equal(classifyJourneyPositionSource(POSITION_AUTHORITY_SOURCES.BACKEND_MAY_ADVANCE_JOURNEY), POSITION_AUTHORITY_CLASSES.UNAUTHORISED);
assert.equal(classifyJourneyPositionSource(POSITION_AUTHORITY_SOURCES.MENTOR_RECOMMENDATION), POSITION_AUTHORITY_CLASSES.ADVISORY);
assert.equal(classifyJourneyPositionSource(POSITION_AUTHORITY_SOURCES.CREATOR_EXPLICIT_INTENT), POSITION_AUTHORITY_CLASSES.CREATOR_AUTHORISED);
assert.equal(classifyJourneyPositionSource(POSITION_AUTHORITY_SOURCES.INITIAL_IDEA_PROGRESSION), POSITION_AUTHORITY_CLASSES.MECHANICAL);
assert.equal(classifyJourneyPositionSource(POSITION_AUTHORITY_SOURCES.STAGE_CLICK_UI), POSITION_AUTHORITY_CLASSES.CREATOR_AUTHORISED);
assert.equal(classifyJourneyPositionSource(POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_CALL), POSITION_AUTHORITY_CLASSES.MECHANICAL);

// Semantic readiness is advisory only and cannot move the map.
expectCode(() => issueJourneyPositionAuthority({
  projectId,
  source: POSITION_AUTHORITY_SOURCES.SEMANTIC_READY_TO_ADVANCE,
  action: POSITION_ACTIONS.SET_POSITION,
  target: { stageId: "characters" },
  expectedPositionRevision: 10,
  issuedAt,
  evidence: { readyToAdvance: true },
}), "JOURNEY_POSITION_ADVISORY_CANNOT_AUTHORISE");

// backend mayAdvanceJourney is not a position authority merely because it is true.
expectCode(() => issueJourneyPositionAuthority({
  projectId,
  source: POSITION_AUTHORITY_SOURCES.BACKEND_MAY_ADVANCE_JOURNEY,
  action: POSITION_ACTIONS.SET_POSITION,
  target: { stageId: "characters" },
  expectedPositionRevision: 10,
  issuedAt,
  evidence: { mayAdvanceJourney: true },
}), "JOURNEY_POSITION_SOURCE_UNAUTHORISED");

// Mentor recommendations remain advisory even when exact stage/task targets exist.
expectCode(() => issueJourneyPositionAuthority({
  projectId,
  source: POSITION_AUTHORITY_SOURCES.MENTOR_RECOMMENDATION,
  action: POSITION_ACTIONS.SET_POSITION,
  target: { stageId: "story", taskId: "define-next-beat" },
  expectedPositionRevision: 10,
  issuedAt,
  evidence: { recommendationId: "mentor-rec-1" },
}), "JOURNEY_POSITION_ADVISORY_CANNOT_AUTHORISE");

// Explicit creator intent can issue exact one-time authority.
const creatorAuthority = issueJourneyPositionAuthority({
  projectId,
  source: POSITION_AUTHORITY_SOURCES.CREATOR_EXPLICIT_INTENT,
  action: POSITION_ACTIONS.SET_POSITION,
  target: { stageId: "characters" },
  expectedPositionRevision: 10,
  issuedAt,
  evidence: { creatorExplicit: true, creatorActId: "creator-act-10", phrase: "Take me to characters." },
});
assert.equal(creatorAuthority.authorityClass, POSITION_AUTHORITY_CLASSES.CREATOR_AUTHORISED);
assert.equal(creatorAuthority.target.stageId, "characters");
assert.equal(creatorAuthority.oneTime, true);
assert.equal(creatorAuthority.restrictions.mayCreateCanon, false);
assert.equal(creatorAuthority.restrictions.mayInferTarget, false);

const validated = validateJourneyPositionAuthority(creatorAuthority, { projectId, positionRevision: 10, consumedAuthorityIds: [] });
assert.equal(validated.valid, true);
assert.equal(validated.action, POSITION_ACTIONS.SET_POSITION);

const consumed = consumeJourneyPositionAuthority(creatorAuthority, { projectId, positionRevision: 10, consumedAuthorityIds: [] });
assert.equal(consumed.status, "authorised-for-execution");
assert.equal(consumed.nextPositionRevision, 11);
assert.equal(consumed.journeyMutationPerformed, false, "Door 11E3C must never touch CreatorJourneyEngine mutation APIs");

// Replay is denied, including after a simulated restart when the consumed-id ledger is restored.
expectCode(() => validateJourneyPositionAuthority(creatorAuthority, {
  projectId,
  positionRevision: 10,
  consumedAuthorityIds: consumed.consumedAuthorityIds,
}), "JOURNEY_POSITION_AUTHORITY_REPLAY");
const restoredConsumedLedger = JSON.parse(JSON.stringify(consumed.consumedAuthorityIds));
expectCode(() => consumeJourneyPositionAuthority(creatorAuthority, {
  projectId,
  positionRevision: 10,
  consumedAuthorityIds: restoredConsumedLedger,
}), "JOURNEY_POSITION_AUTHORITY_REPLAY");

// Stale authority loses if position revision changed first.
const staleCandidate = issueJourneyPositionAuthority({
  projectId,
  source: POSITION_AUTHORITY_SOURCES.CREATOR_EXPLICIT_INTENT,
  action: POSITION_ACTIONS.SET_POSITION,
  target: { stageId: "world" },
  expectedPositionRevision: 20,
  issuedAt,
  evidence: { creatorExplicit: true, creatorActId: "creator-act-20" },
});
expectCode(() => validateJourneyPositionAuthority(staleCandidate, { projectId, positionRevision: 21, consumedAuthorityIds: [] }), "JOURNEY_POSITION_AUTHORITY_STALE");

// Wrong project cannot consume another project's movement authority.
expectCode(() => validateJourneyPositionAuthority(staleCandidate, { projectId: "another-project", positionRevision: 20, consumedAuthorityIds: [] }), "JOURNEY_POSITION_AUTHORITY_PROJECT_MISMATCH");

// Tampering with target after issuance fails integrity validation.
const tampered = JSON.parse(JSON.stringify(staleCandidate));
tampered.target.stageId = "publish";
expectCode(() => validateJourneyPositionAuthority(tampered, { projectId, positionRevision: 20, consumedAuthorityIds: [] }), "JOURNEY_POSITION_AUTHORITY_TAMPERED");

// Stage-click UI is creator-authorised only when it is a real creator gesture.
const stageClick = issueJourneyPositionAuthority({
  projectId,
  source: POSITION_AUTHORITY_SOURCES.STAGE_CLICK_UI,
  action: POSITION_ACTIONS.SET_POSITION,
  target: { stageId: "world" },
  expectedPositionRevision: 30,
  issuedAt,
  evidence: { creatorGesture: true, creatorActId: "stage-click-world-30" },
});
assert.equal(stageClick.authorityClass, POSITION_AUTHORITY_CLASSES.CREATOR_AUTHORISED);
expectCode(() => issueJourneyPositionAuthority({
  projectId,
  source: POSITION_AUTHORITY_SOURCES.STAGE_CLICK_UI,
  action: POSITION_ACTIONS.SET_POSITION,
  target: { stageId: "world" },
  expectedPositionRevision: 30,
  issuedAt,
  evidence: { creatorGesture: false, creatorActId: "fake-click" },
}), "JOURNEY_POSITION_STAGE_CLICK_INVALID");

// Existing initial-idea progression is mechanical and guarded: creator-confirmed, ready, no clarification.
const initialIdeaAuthority = issueJourneyPositionAuthority({
  projectId,
  source: POSITION_AUTHORITY_SOURCES.INITIAL_IDEA_PROGRESSION,
  action: POSITION_ACTIONS.SET_POSITION,
  target: { stageId: "story-direction" },
  expectedPositionRevision: 40,
  issuedAt,
  evidence: { creatorConfirmed: true, readyToAdvance: true, clarificationRequired: false },
});
assert.equal(initialIdeaAuthority.authorityClass, POSITION_AUTHORITY_CLASSES.MECHANICAL);
expectCode(() => issueJourneyPositionAuthority({
  projectId,
  source: POSITION_AUTHORITY_SOURCES.INITIAL_IDEA_PROGRESSION,
  action: POSITION_ACTIONS.SET_POSITION,
  target: { stageId: "story-direction" },
  expectedPositionRevision: 40,
  issuedAt,
  evidence: { creatorConfirmed: true, readyToAdvance: true, clarificationRequired: true },
}), "JOURNEY_POSITION_INITIAL_IDEA_GUARD_FAILED");

// completeTask / completeStage calls are mechanical execution, not self-authorising movement.
expectCode(() => issueJourneyPositionAuthority({
  projectId,
  source: POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_CALL,
  action: POSITION_ACTIONS.COMPLETE_TASK,
  target: { stageId: "characters", taskId: "define-protagonist" },
  expectedPositionRevision: 50,
  issuedAt,
  evidence: {},
}), "JOURNEY_POSITION_TASK_COMPLETION_AUTHORITY_REQUIRED");

const taskExecutionAuthority = issueJourneyPositionAuthority({
  projectId,
  source: POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_CALL,
  action: POSITION_ACTIONS.COMPLETE_TASK,
  target: { stageId: "characters", taskId: "define-protagonist" },
  expectedPositionRevision: 50,
  issuedAt,
  evidence: { priorAuthorityValidated: true, priorAuthorityId: creatorAuthority.authorityId },
});
assert.equal(taskExecutionAuthority.authorityClass, POSITION_AUTHORITY_CLASSES.MECHANICAL);

expectCode(() => issueJourneyPositionAuthority({
  projectId,
  source: POSITION_AUTHORITY_SOURCES.STAGE_COMPLETION_CALL,
  action: POSITION_ACTIONS.COMPLETE_STAGE,
  target: { stageId: "characters" },
  expectedPositionRevision: 51,
  issuedAt,
  evidence: {},
}), "JOURNEY_POSITION_STAGE_COMPLETION_AUTHORITY_REQUIRED");

const stageExecutionAuthority = issueJourneyPositionAuthority({
  projectId,
  source: POSITION_AUTHORITY_SOURCES.STAGE_COMPLETION_CALL,
  action: POSITION_ACTIONS.COMPLETE_STAGE,
  target: { stageId: "characters" },
  expectedPositionRevision: 51,
  issuedAt,
  evidence: { priorAuthorityValidated: true, priorAuthorityId: taskExecutionAuthority.authorityId },
});
assert.equal(stageExecutionAuthority.action, POSITION_ACTIONS.COMPLETE_STAGE);

// Generic continuation acceptance is not enough unless it becomes an explicit position act with an exact target.
expectCode(() => issueJourneyPositionAuthority({
  projectId,
  source: POSITION_AUTHORITY_SOURCES.CREATOR_EXPLICIT_INTENT,
  action: POSITION_ACTIONS.SET_POSITION,
  target: {},
  expectedPositionRevision: 60,
  issuedAt,
  evidence: { creatorExplicit: true, creatorActId: "yes-do-that" },
}), "JOURNEY_POSITION_TARGET_STAGE_REQUIRED");

console.log("Movie Mentor Journey Position Authority torture: PASS — advisory signals cannot move the map; creator/mechanical authority is exact, revision-bound, single-use, restart-safe, tamper-evident, and still performs zero Journey mutations.");

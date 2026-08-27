const JOURNEY_POSITION_AUTHORITY_CONTRACT_VERSION = "1.2.0";

const POSITION_ACTIONS = Object.freeze({
  SET_POSITION: "set-position",
  COMPLETE_TASK: "complete-task",
  COMPLETE_STAGE: "complete-stage",
  REVISIT_STAGE: "revisit-stage",
  PAUSE_JOURNEY: "pause-journey",
});

const POSITION_AUTHORITY_CLASSES = Object.freeze({
  CREATOR_AUTHORISED: "creator-authorised",
  MECHANICAL: "mechanical",
  ADVISORY: "advisory",
  UNAUTHORISED: "unauthorised",
});

const POSITION_AUTHORITY_SOURCES = Object.freeze({
  SEMANTIC_READY_TO_ADVANCE: "semantic-ready-to-advance",
  BACKEND_MAY_ADVANCE_JOURNEY: "backend-may-advance-journey",
  MENTOR_RECOMMENDATION: "mentor-recommendation",
  CREATOR_EXPLICIT_INTENT: "creator-explicit-intent",
  INITIAL_IDEA_PROGRESSION: "initial-idea-progression",
  STAGE_CLICK_UI: "stage-click-ui",
  TASK_COMPLETION_UI: "task-completion-ui",
  STAGE_COMPLETION_UI: "stage-completion-ui",
  TASK_COMPLETION_CALL: "task-completion-call",
  STAGE_COMPLETION_CALL: "stage-completion-call",
});

const SOURCE_CLASSIFICATION = Object.freeze({
  [POSITION_AUTHORITY_SOURCES.SEMANTIC_READY_TO_ADVANCE]: POSITION_AUTHORITY_CLASSES.ADVISORY,
  [POSITION_AUTHORITY_SOURCES.BACKEND_MAY_ADVANCE_JOURNEY]: POSITION_AUTHORITY_CLASSES.UNAUTHORISED,
  [POSITION_AUTHORITY_SOURCES.MENTOR_RECOMMENDATION]: POSITION_AUTHORITY_CLASSES.ADVISORY,
  [POSITION_AUTHORITY_SOURCES.CREATOR_EXPLICIT_INTENT]: POSITION_AUTHORITY_CLASSES.CREATOR_AUTHORISED,
  [POSITION_AUTHORITY_SOURCES.INITIAL_IDEA_PROGRESSION]: POSITION_AUTHORITY_CLASSES.MECHANICAL,
  [POSITION_AUTHORITY_SOURCES.STAGE_CLICK_UI]: POSITION_AUTHORITY_CLASSES.CREATOR_AUTHORISED,
  [POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_UI]: POSITION_AUTHORITY_CLASSES.CREATOR_AUTHORISED,
  [POSITION_AUTHORITY_SOURCES.STAGE_COMPLETION_UI]: POSITION_AUTHORITY_CLASSES.CREATOR_AUTHORISED,
  [POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_CALL]: POSITION_AUTHORITY_CLASSES.MECHANICAL,
  [POSITION_AUTHORITY_SOURCES.STAGE_COMPLETION_CALL]: POSITION_AUTHORITY_CLASSES.MECHANICAL,
});

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function safeRevision(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function clone(value) {
  if (value === undefined) return undefined;
  try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
}

function fail(code, message, extras = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, extras);
  throw error;
}

function stableHash(value) {
  const text = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function classifyJourneyPositionSource(source) {
  const key = cleanString(source);
  return SOURCE_CLASSIFICATION[key] || POSITION_AUTHORITY_CLASSES.UNAUTHORISED;
}

function normaliseTarget(action, target = {}) {
  const stageId = cleanString(target.stageId) || null;
  const taskId = cleanString(target.taskId) || null;

  if (
    [POSITION_ACTIONS.SET_POSITION, POSITION_ACTIONS.REVISIT_STAGE].includes(action) &&
    !stageId
  ) {
    fail("JOURNEY_POSITION_TARGET_STAGE_REQUIRED", "This Journey progression action requires an exact target stage.");
  }
  if (action === POSITION_ACTIONS.COMPLETE_TASK && (!stageId || !taskId)) {
    fail("JOURNEY_POSITION_TARGET_TASK_REQUIRED", "Completing a Journey task requires an exact stage and task target.");
  }
  if (action === POSITION_ACTIONS.COMPLETE_STAGE && !stageId) {
    fail("JOURNEY_POSITION_TARGET_STAGE_REQUIRED", "Completing a Journey stage requires an exact stage target.");
  }

  return { stageId, taskId };
}

function assertCreatorGesture(evidence, code, message) {
  if (evidence.creatorGesture !== true || cleanString(evidence.creatorActId) === "") {
    fail(code, message);
  }
}

function assertIssuancePolicy({ source, authorityClass, action, evidence = {} }) {
  if (authorityClass === POSITION_AUTHORITY_CLASSES.ADVISORY) {
    fail("JOURNEY_POSITION_ADVISORY_CANNOT_AUTHORISE", "Advisory Journey evidence cannot issue position authority.", { source });
  }
  if (authorityClass === POSITION_AUTHORITY_CLASSES.UNAUTHORISED) {
    fail("JOURNEY_POSITION_SOURCE_UNAUTHORISED", "This Journey signal is not a position authority source.", { source });
  }

  if (source === POSITION_AUTHORITY_SOURCES.CREATOR_EXPLICIT_INTENT) {
    if (evidence.creatorExplicit !== true || cleanString(evidence.creatorActId) === "") {
      fail("JOURNEY_POSITION_CREATOR_ACT_REQUIRED", "Creator-intent position authority requires an explicit, identifiable creator act.");
    }
  }

  if (source === POSITION_AUTHORITY_SOURCES.STAGE_CLICK_UI) {
    if (action !== POSITION_ACTIONS.SET_POSITION) {
      fail("JOURNEY_POSITION_STAGE_CLICK_INVALID", "Stage-click authority is bound only to set-position.");
    }
    assertCreatorGesture(
      evidence,
      "JOURNEY_POSITION_STAGE_CLICK_INVALID",
      "Stage-click authority requires an explicit creator gesture bound to set-position."
    );
  }

  if (source === POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_UI) {
    if (action !== POSITION_ACTIONS.COMPLETE_TASK) {
      fail("JOURNEY_POSITION_TASK_COMPLETION_UI_INVALID", "Task-completion UI authority is bound only to complete-task.");
    }
    assertCreatorGesture(
      evidence,
      "JOURNEY_POSITION_TASK_COMPLETION_UI_INVALID",
      "Task-completion UI authority requires an explicit creator gesture bound to complete-task."
    );
  }

  if (source === POSITION_AUTHORITY_SOURCES.STAGE_COMPLETION_UI) {
    if (action !== POSITION_ACTIONS.COMPLETE_STAGE) {
      fail("JOURNEY_POSITION_STAGE_COMPLETION_UI_INVALID", "Stage-completion UI authority is bound only to complete-stage.");
    }
    assertCreatorGesture(
      evidence,
      "JOURNEY_POSITION_STAGE_COMPLETION_UI_INVALID",
      "Stage-completion UI authority requires an explicit creator gesture bound to complete-stage."
    );
  }

  if (source === POSITION_AUTHORITY_SOURCES.INITIAL_IDEA_PROGRESSION) {
    if (
      action !== POSITION_ACTIONS.SET_POSITION ||
      evidence.creatorConfirmed !== true ||
      evidence.readyToAdvance !== true ||
      evidence.clarificationRequired === true
    ) {
      fail("JOURNEY_POSITION_INITIAL_IDEA_GUARD_FAILED", "Initial-idea progression requires creator-confirmed readiness with no clarification gate.");
    }
  }

  if (source === POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_CALL) {
    if (action !== POSITION_ACTIONS.COMPLETE_TASK || evidence.priorAuthorityValidated !== true || cleanString(evidence.priorAuthorityId) === "") {
      fail("JOURNEY_POSITION_TASK_COMPLETION_AUTHORITY_REQUIRED", "A task-completion call is mechanical execution and requires prior validated authority.");
    }
  }

  if (source === POSITION_AUTHORITY_SOURCES.STAGE_COMPLETION_CALL) {
    if (action !== POSITION_ACTIONS.COMPLETE_STAGE || evidence.priorAuthorityValidated !== true || cleanString(evidence.priorAuthorityId) === "") {
      fail("JOURNEY_POSITION_STAGE_COMPLETION_AUTHORITY_REQUIRED", "A stage-completion call is mechanical execution and requires prior validated authority.");
    }
  }
}

function issueJourneyPositionAuthority({
  projectId,
  source,
  action,
  target = {},
  expectedPositionRevision,
  issuedAt,
  evidence = {},
} = {}) {
  const pid = cleanString(projectId);
  const sourceKey = cleanString(source);
  const actionKey = cleanString(action);
  const revision = safeRevision(expectedPositionRevision);
  const timestamp = cleanString(issuedAt);

  if (!pid) fail("JOURNEY_POSITION_PROJECT_REQUIRED", "Journey position authority requires a projectId.");
  if (!Object.values(POSITION_ACTIONS).includes(actionKey)) fail("JOURNEY_POSITION_ACTION_INVALID", "Journey position authority received an unsupported action.");
  if (revision === null) fail("JOURNEY_POSITION_REVISION_REQUIRED", "Journey position authority requires the exact current position revision.");
  if (!timestamp) fail("JOURNEY_POSITION_ISSUED_AT_REQUIRED", "Journey position authority requires an explicit issuedAt value.");

  const authorityClass = classifyJourneyPositionSource(sourceKey);
  const normalisedTarget = normaliseTarget(actionKey, target);
  assertIssuancePolicy({ source: sourceKey, authorityClass, action: actionKey, evidence });

  const identity = {
    contractVersion: JOURNEY_POSITION_AUTHORITY_CONTRACT_VERSION,
    projectId: pid,
    source: sourceKey,
    authorityClass,
    action: actionKey,
    target: normalisedTarget,
    expectedPositionRevision: revision,
    issuedAt: timestamp,
    creatorActId: cleanString(evidence.creatorActId) || null,
    priorAuthorityId: cleanString(evidence.priorAuthorityId) || null,
  };

  return Object.freeze({
    ...identity,
    authorityId: `journey-position-authority:${stableHash(identity)}`,
    oneTime: true,
    status: "issued",
    evidence: clone(evidence),
    restrictions: Object.freeze({
      mayCreateCanon: false,
      mayRewriteCreatorTruth: false,
      mayInferTarget: false,
      mayBroadenAction: false,
      requiresExactRevision: true,
      singleUse: true,
    }),
  });
}

function validateJourneyPositionAuthority(envelope, {
  projectId,
  positionRevision,
  consumedAuthorityIds = [],
} = {}) {
  if (!envelope || typeof envelope !== "object") fail("JOURNEY_POSITION_AUTHORITY_REQUIRED", "Journey position authority envelope is required.");
  if (envelope.contractVersion !== JOURNEY_POSITION_AUTHORITY_CONTRACT_VERSION) fail("JOURNEY_POSITION_AUTHORITY_VERSION_INVALID", "Journey position authority contract version is invalid.");
  if (cleanString(envelope.projectId) !== cleanString(projectId)) fail("JOURNEY_POSITION_AUTHORITY_PROJECT_MISMATCH", "Journey position authority belongs to a different project.");

  const currentRevision = safeRevision(positionRevision);
  const expectedRevision = safeRevision(envelope.expectedPositionRevision);
  if (currentRevision === null || expectedRevision === null || currentRevision !== expectedRevision) {
    fail("JOURNEY_POSITION_AUTHORITY_STALE", "Journey position authority was issued against a different position revision.", { currentRevision, expectedRevision });
  }

  const authorityId = cleanString(envelope.authorityId);
  if (!authorityId) fail("JOURNEY_POSITION_AUTHORITY_ID_REQUIRED", "Journey position authority is missing its authorityId.");
  if (consumedAuthorityIds.map(cleanString).includes(authorityId)) fail("JOURNEY_POSITION_AUTHORITY_REPLAY", "Journey position authority is single-use and has already been consumed.");

  const classification = classifyJourneyPositionSource(envelope.source);
  if (classification !== envelope.authorityClass || [POSITION_AUTHORITY_CLASSES.ADVISORY, POSITION_AUTHORITY_CLASSES.UNAUTHORISED].includes(classification)) {
    fail("JOURNEY_POSITION_AUTHORITY_CLASS_INVALID", "Journey position authority source/classification is invalid.");
  }

  normaliseTarget(envelope.action, envelope.target);
  assertIssuancePolicy({ source: envelope.source, authorityClass: classification, action: envelope.action, evidence: envelope.evidence || {} });

  const identity = {
    contractVersion: envelope.contractVersion,
    projectId: envelope.projectId,
    source: envelope.source,
    authorityClass: envelope.authorityClass,
    action: envelope.action,
    target: clone(envelope.target),
    expectedPositionRevision: envelope.expectedPositionRevision,
    issuedAt: envelope.issuedAt,
    creatorActId: envelope.creatorActId || null,
    priorAuthorityId: envelope.priorAuthorityId || null,
  };
  const expectedAuthorityId = `journey-position-authority:${stableHash(identity)}`;
  if (authorityId !== expectedAuthorityId) fail("JOURNEY_POSITION_AUTHORITY_TAMPERED", "Journey position authority envelope failed integrity validation.");

  return Object.freeze({
    valid: true,
    authorityId,
    projectId: envelope.projectId,
    action: envelope.action,
    target: clone(envelope.target),
    authorityClass: envelope.authorityClass,
    source: envelope.source,
    positionRevision: currentRevision,
  });
}

function consumeJourneyPositionAuthority(envelope, context = {}) {
  const validation = validateJourneyPositionAuthority(envelope, context);
  const consumed = Array.from(new Set([...(context.consumedAuthorityIds || []).map(cleanString).filter(Boolean), validation.authorityId]));
  return Object.freeze({
    status: "authorised-for-execution",
    authorityId: validation.authorityId,
    projectId: validation.projectId,
    action: validation.action,
    target: clone(validation.target),
    source: validation.source,
    authorityClass: validation.authorityClass,
    consumedAuthorityIds: Object.freeze(consumed),
    nextPositionRevision: validation.positionRevision + 1,
    journeyMutationPerformed: false,
  });
}

export {
  JOURNEY_POSITION_AUTHORITY_CONTRACT_VERSION,
  POSITION_ACTIONS,
  POSITION_AUTHORITY_CLASSES,
  POSITION_AUTHORITY_SOURCES,
  SOURCE_CLASSIFICATION,
  classifyJourneyPositionSource,
  issueJourneyPositionAuthority,
  validateJourneyPositionAuthority,
  consumeJourneyPositionAuthority,
};

export default {
  version: JOURNEY_POSITION_AUTHORITY_CONTRACT_VERSION,
  classifyJourneyPositionSource,
  issueJourneyPositionAuthority,
  validateJourneyPositionAuthority,
  consumeJourneyPositionAuthority,
};

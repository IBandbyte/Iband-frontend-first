const JOURNEY_RECOMMENDATION_ENVELOPE_VERSION = "1.0.0";
const JOURNEY_RECOMMENDATION_ENVELOPE_CONTRACT_VERSION = "1.0.0";

const RECOMMENDATION_FRESHNESS = Object.freeze({
  FRESH: "fresh",
  STALE: "stale",
  INVALID: "invalid",
});

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cloneValue(value) {
  if (value === undefined) return undefined;
  try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
}

function safeRevision(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value).sort().reduce((result, key) => {
    result[key] = stableValue(value[key]);
    return result;
  }, {});
}

function hashString(value) {
  let hashA = 0x811c9dc5;
  let hashB = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    hashA ^= code;
    hashA = Math.imul(hashA, 0x01000193) >>> 0;
    hashB ^= code + index;
    hashB = Math.imul(hashB, 0x85ebca6b) >>> 0;
  }
  return `${hashA.toString(16).padStart(8, "0")}${hashB.toString(16).padStart(8, "0")}`;
}

function createFingerprintPayload(input) {
  return stableValue({
    contractVersion: JOURNEY_RECOMMENDATION_ENVELOPE_CONTRACT_VERSION,
    projectId: cleanString(input.projectId),
    progressionRevision: safeRevision(input.progressionRevision),
    currentStageId: cleanString(input.currentStageId) || null,
    currentTaskId: cleanString(input.currentTaskId) || null,
    creatorAuthorityRevision: safeRevision(input.creatorAuthorityRevision),
    turnRevision: safeRevision(input.turnRevision),
    targetStageId: cleanString(input.targetStageId) || null,
    targetTaskId: cleanString(input.targetTaskId) || null,
    planningContractVersion: cleanString(input.planningContractVersion) || null,
    bridgeVersion: cleanString(input.bridgeVersion) || null,
  });
}

function createRecommendationFingerprint(input) {
  return hashString(JSON.stringify(createFingerprintPayload(input)));
}

function createJourneyRecommendationEnvelope({
  projectId,
  projectJourney,
  planningEvidence,
  issuedAt = new Date().toISOString(),
} = {}) {
  const pid = cleanString(projectId);
  const progressionRevision = safeRevision(projectJourney?.progression?.revision ?? 0);
  const currentStageId = cleanString(projectJourney?.currentStageId || planningEvidence?.currentStageId) || null;
  const currentTaskId = cleanString(projectJourney?.currentTaskId || planningEvidence?.currentTaskId) || null;
  const creatorAuthorityRevision = safeRevision(planningEvidence?.creatorAuthorityRevision);
  const turnRevision = safeRevision(planningEvidence?.provenance?.turnRevision);
  const targetStageId = cleanString(planningEvidence?.recommendation?.recommendedStageId) || null;
  const targetTaskId = cleanString(planningEvidence?.recommendation?.recommendedTaskId) || null;
  const planningContractVersion = cleanString(planningEvidence?.contractVersion) || null;
  const bridgeVersion = cleanString(planningEvidence?.provenance?.bridgeVersion) || null;

  if (!pid || progressionRevision === null || !planningEvidence?.recommendation || planningEvidence?.clarification?.required === true) {
    return null;
  }
  if (!targetStageId && !targetTaskId) return null;

  const identityInput = {
    projectId: pid,
    progressionRevision,
    currentStageId,
    currentTaskId,
    creatorAuthorityRevision,
    turnRevision,
    targetStageId,
    targetTaskId,
    planningContractVersion,
    bridgeVersion,
  };
  const fingerprint = createRecommendationFingerprint(identityInput);

  return Object.freeze({
    contractVersion: JOURNEY_RECOMMENDATION_ENVELOPE_CONTRACT_VERSION,
    envelopeVersion: JOURNEY_RECOMMENDATION_ENVELOPE_VERSION,
    recommendationId: `journey-recommendation:${fingerprint}`,
    fingerprint,
    projectId: pid,
    issuedAgainst: Object.freeze({
      progressionRevision,
      currentStageId,
      currentTaskId,
      creatorAuthorityRevision,
      turnRevision,
    }),
    target: Object.freeze({
      stageId: targetStageId,
      taskId: targetTaskId,
    }),
    planning: Object.freeze({
      planningContractVersion,
      bridgeVersion,
    }),
    authority: Object.freeze({
      class: "advisory-only",
      creatorConfirmed: false,
      mayCreateCanon: false,
      mayAdvanceJourney: false,
      creatorChoiceRequired: true,
    }),
    issuedAt: cleanString(issuedAt) || null,
  });
}

function targetExists(journey, target = {}) {
  const stageId = cleanString(target.stageId);
  const taskId = cleanString(target.taskId);
  if (!stageId) return false;
  const stage = Array.isArray(journey?.stages)
    ? journey.stages.find((item) => cleanString(item?.id) === stageId)
    : null;
  if (!stage) return false;
  if (!taskId) return true;
  return Array.isArray(stage.tasks) && stage.tasks.some((item) => cleanString(item?.id) === taskId);
}

function validateJourneyRecommendationFreshness(envelope, {
  projectId,
  projectJourney,
  creatorAuthorityRevision = null,
  turnRevision = null,
  clarificationRequired = false,
} = {}) {
  if (!envelope || typeof envelope !== "object") {
    return Object.freeze({ status: RECOMMENDATION_FRESHNESS.INVALID, fresh: false, reasons: Object.freeze(["envelope-missing"]) });
  }

  const reasons = [];
  const expectedFingerprint = createRecommendationFingerprint({
    projectId: envelope.projectId,
    progressionRevision: envelope?.issuedAgainst?.progressionRevision,
    currentStageId: envelope?.issuedAgainst?.currentStageId,
    currentTaskId: envelope?.issuedAgainst?.currentTaskId,
    creatorAuthorityRevision: envelope?.issuedAgainst?.creatorAuthorityRevision,
    turnRevision: envelope?.issuedAgainst?.turnRevision,
    targetStageId: envelope?.target?.stageId,
    targetTaskId: envelope?.target?.taskId,
    planningContractVersion: envelope?.planning?.planningContractVersion,
    bridgeVersion: envelope?.planning?.bridgeVersion,
  });

  if (envelope.contractVersion !== JOURNEY_RECOMMENDATION_ENVELOPE_CONTRACT_VERSION) reasons.push("contract-version-mismatch");
  if (envelope.authority?.class !== "advisory-only" || envelope.authority?.mayAdvanceJourney !== false || envelope.authority?.creatorChoiceRequired !== true) reasons.push("authority-contract-invalid");
  if (cleanString(envelope.fingerprint) !== expectedFingerprint || cleanString(envelope.recommendationId) !== `journey-recommendation:${expectedFingerprint}`) reasons.push("identity-tampered");

  if (reasons.length) {
    return Object.freeze({ status: RECOMMENDATION_FRESHNESS.INVALID, fresh: false, reasons: Object.freeze(reasons) });
  }

  const pid = cleanString(projectId);
  const durableProjectId = cleanString(projectJourney?.projectId);
  const progressionRevision = safeRevision(projectJourney?.progression?.revision ?? 0);
  const currentStageId = cleanString(projectJourney?.currentStageId) || null;
  const currentTaskId = cleanString(projectJourney?.currentTaskId) || null;
  const currentAuthorityRevision = safeRevision(creatorAuthorityRevision);
  const currentTurnRevision = safeRevision(turnRevision);

  if (!pid || pid !== envelope.projectId || (durableProjectId && durableProjectId !== envelope.projectId)) reasons.push("project-changed");
  if (progressionRevision === null || progressionRevision !== envelope.issuedAgainst.progressionRevision) reasons.push("progression-revision-changed");
  if (currentStageId !== envelope.issuedAgainst.currentStageId) reasons.push("current-stage-changed");
  if (currentTaskId !== envelope.issuedAgainst.currentTaskId) reasons.push("current-task-changed");
  if (currentAuthorityRevision !== envelope.issuedAgainst.creatorAuthorityRevision) reasons.push("creator-authority-revision-changed");
  if (currentTurnRevision !== envelope.issuedAgainst.turnRevision) reasons.push("turn-revision-changed");
  if (clarificationRequired === true) reasons.push("clarification-required");
  if (!targetExists(projectJourney, envelope.target)) reasons.push("target-no-longer-canonical");

  return Object.freeze({
    status: reasons.length ? RECOMMENDATION_FRESHNESS.STALE : RECOMMENDATION_FRESHNESS.FRESH,
    fresh: reasons.length === 0,
    reasons: Object.freeze(reasons),
    recommendationId: envelope.recommendationId,
    target: cloneValue(envelope.target),
  });
}

export {
  JOURNEY_RECOMMENDATION_ENVELOPE_VERSION,
  JOURNEY_RECOMMENDATION_ENVELOPE_CONTRACT_VERSION,
  RECOMMENDATION_FRESHNESS,
  createRecommendationFingerprint,
  createJourneyRecommendationEnvelope,
  validateJourneyRecommendationFreshness,
};

export default createJourneyRecommendationEnvelope;

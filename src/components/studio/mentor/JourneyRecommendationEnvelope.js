import {
  createCanonicalJourneyRecommendationIdentity,
  createJourneyRecommendationFingerprint,
  validateCanonicalJourneyRecommendationIdentity,
} from "./JourneyRecommendationIdentity.js";

const JOURNEY_RECOMMENDATION_ENVELOPE_VERSION = "1.1.0";
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

function createRecommendationFingerprint(input = {}) {
  return createJourneyRecommendationFingerprint(input);
}

function createJourneyRecommendationEnvelope({
  projectId,
  projectJourney,
  planningEvidence,
  issuedAt = new Date().toISOString(),
} = {}) {
  const identity = createCanonicalJourneyRecommendationIdentity({
    projectId,
    projectJourney,
    planningEvidence,
  });

  if (!identity) return null;

  return Object.freeze({
    contractVersion: JOURNEY_RECOMMENDATION_ENVELOPE_CONTRACT_VERSION,
    envelopeVersion: JOURNEY_RECOMMENDATION_ENVELOPE_VERSION,
    recommendationId: identity.recommendationId,
    fingerprint: identity.fingerprint,
    projectId: identity.projectId,
    issuedAgainst: identity.issuedAgainst,
    target: identity.target,
    planning: identity.planning,
    recommendationIdentity: identity,
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
  const identity = envelope.recommendationIdentity || {
    contractVersion: "1.0.0",
    recommendationId: envelope.recommendationId,
    fingerprint: envelope.fingerprint,
    projectId: envelope.projectId,
    issuedAgainst: envelope.issuedAgainst,
    target: envelope.target,
    planning: envelope.planning,
  };

  if (envelope.contractVersion !== JOURNEY_RECOMMENDATION_ENVELOPE_CONTRACT_VERSION) reasons.push("contract-version-mismatch");
  if (envelope.authority?.class !== "advisory-only" || envelope.authority?.mayAdvanceJourney !== false || envelope.authority?.creatorChoiceRequired !== true) reasons.push("authority-contract-invalid");
  if (!validateCanonicalJourneyRecommendationIdentity(identity)) reasons.push("identity-tampered");
  if (cleanString(envelope.recommendationId) !== cleanString(identity.recommendationId) || cleanString(envelope.fingerprint) !== cleanString(identity.fingerprint)) reasons.push("identity-envelope-mismatch");

  if (reasons.length) {
    return Object.freeze({ status: RECOMMENDATION_FRESHNESS.INVALID, fresh: false, reasons: Object.freeze(Array.from(new Set(reasons))) });
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

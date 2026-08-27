const JOURNEY_RECOMMENDATION_IDENTITY_VERSION = "1.0.0";
const JOURNEY_RECOMMENDATION_IDENTITY_CONTRACT_VERSION = "1.0.0";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
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

function createJourneyRecommendationIdentityPayload({
  projectId,
  progressionRevision,
  currentStageId,
  currentTaskId,
  creatorAuthorityRevision,
  turnRevision,
  targetStageId,
  targetTaskId,
  planningContractVersion,
  bridgeVersion,
} = {}) {
  return stableValue({
    contractVersion: JOURNEY_RECOMMENDATION_IDENTITY_CONTRACT_VERSION,
    projectId: cleanString(projectId),
    progressionRevision: safeRevision(progressionRevision),
    currentStageId: cleanString(currentStageId) || null,
    currentTaskId: cleanString(currentTaskId) || null,
    creatorAuthorityRevision: safeRevision(creatorAuthorityRevision),
    turnRevision: safeRevision(turnRevision),
    targetStageId: cleanString(targetStageId) || null,
    targetTaskId: cleanString(targetTaskId) || null,
    planningContractVersion: cleanString(planningContractVersion) || null,
    bridgeVersion: cleanString(bridgeVersion) || null,
  });
}

function createJourneyRecommendationFingerprint(input = {}) {
  return hashString(JSON.stringify(createJourneyRecommendationIdentityPayload(input)));
}

function createCanonicalJourneyRecommendationIdentity({
  projectId,
  projectJourney,
  planningEvidence,
} = {}) {
  const pid = cleanString(projectId || projectJourney?.projectId);
  const progressionRevision = safeRevision(projectJourney?.progression?.revision ?? 0);
  const currentStageId = cleanString(projectJourney?.currentStageId || planningEvidence?.currentStageId) || null;
  const currentTaskId = cleanString(projectJourney?.currentTaskId || planningEvidence?.currentTaskId) || null;
  const creatorAuthorityRevision = safeRevision(planningEvidence?.creatorAuthorityRevision);
  const turnRevision = safeRevision(planningEvidence?.provenance?.turnRevision);
  const targetStageId = cleanString(planningEvidence?.recommendation?.recommendedStageId) || null;
  const targetTaskId = cleanString(planningEvidence?.recommendation?.recommendedTaskId) || null;
  const planningContractVersion = cleanString(planningEvidence?.contractVersion) || null;
  const bridgeVersion = cleanString(planningEvidence?.provenance?.bridgeVersion) || null;

  if (!pid || progressionRevision === null || !planningEvidence?.recommendation) return null;
  if (planningEvidence?.clarification?.required === true) return null;
  if (!targetStageId && !targetTaskId) return null;

  const identityPayload = createJourneyRecommendationIdentityPayload({
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
  });
  const fingerprint = createJourneyRecommendationFingerprint(identityPayload);

  return Object.freeze({
    contractVersion: JOURNEY_RECOMMENDATION_IDENTITY_CONTRACT_VERSION,
    version: JOURNEY_RECOMMENDATION_IDENTITY_VERSION,
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
  });
}

function validateCanonicalJourneyRecommendationIdentity(identity) {
  if (!identity || typeof identity !== "object") return false;
  const expectedFingerprint = createJourneyRecommendationFingerprint({
    projectId: identity.projectId,
    progressionRevision: identity?.issuedAgainst?.progressionRevision,
    currentStageId: identity?.issuedAgainst?.currentStageId,
    currentTaskId: identity?.issuedAgainst?.currentTaskId,
    creatorAuthorityRevision: identity?.issuedAgainst?.creatorAuthorityRevision,
    turnRevision: identity?.issuedAgainst?.turnRevision,
    targetStageId: identity?.target?.stageId,
    targetTaskId: identity?.target?.taskId,
    planningContractVersion: identity?.planning?.planningContractVersion,
    bridgeVersion: identity?.planning?.bridgeVersion,
  });
  return (
    identity.contractVersion === JOURNEY_RECOMMENDATION_IDENTITY_CONTRACT_VERSION &&
    cleanString(identity.fingerprint) === expectedFingerprint &&
    cleanString(identity.recommendationId) === `journey-recommendation:${expectedFingerprint}`
  );
}

export {
  JOURNEY_RECOMMENDATION_IDENTITY_VERSION,
  JOURNEY_RECOMMENDATION_IDENTITY_CONTRACT_VERSION,
  createJourneyRecommendationIdentityPayload,
  createJourneyRecommendationFingerprint,
  createCanonicalJourneyRecommendationIdentity,
  validateCanonicalJourneyRecommendationIdentity,
};

export default createCanonicalJourneyRecommendationIdentity;

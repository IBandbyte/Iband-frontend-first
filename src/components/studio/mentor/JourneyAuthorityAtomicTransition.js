import {
  createAuthorityRecommendationRecord,
  findAuthorityRecommendation,
  upsertAuthorityRecommendation,
  consumeAuthorityRecommendation,
  invalidateAuthorityRecommendations,
} from "./JourneyAuthorityRecommendationLifecycle.js";

const JOURNEY_AUTHORITY_ATOMIC_TRANSITION_VERSION = "1.1.0";

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

function fail(code, message, extras = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, extras);
  throw error;
}

function materialiseAcceptedRecommendation(records, acceptedRecommendationReference, {
  projectId,
  recommendationId,
  fingerprint,
  expectedProgressionRevision,
} = {}) {
  const rid = cleanString(recommendationId);
  if (!rid) return Array.isArray(records) ? cloneValue(records) : [];

  const existing = findAuthorityRecommendation(records, rid);
  if (existing) return Array.isArray(records) ? cloneValue(records) : [];
  if (!acceptedRecommendationReference) {
    fail(
      "JOURNEY_AUTHORITY_RECOMMENDATION_NOT_FOUND",
      "Accepted recommendation is absent from Journey Authority and no certified materialization evidence was supplied."
    );
  }

  const materialised = createAuthorityRecommendationRecord(acceptedRecommendationReference);
  if (
    cleanString(materialised.recommendationId) !== rid ||
    cleanString(materialised.projectId) !== cleanString(projectId) ||
    safeRevision(materialised.issuedAgainstProgressionRevision) !== safeRevision(expectedProgressionRevision) ||
    (cleanString(fingerprint) && cleanString(materialised.fingerprint) !== cleanString(fingerprint)) ||
    materialised.lifecycle?.current !== true
  ) {
    fail(
      "JOURNEY_AUTHORITY_RECOMMENDATION_MATERIALIZATION_CONFLICT",
      "Certified recommendation materialization evidence does not match the accepted recommendation reality."
    );
  }

  return upsertAuthorityRecommendation(records, materialised);
}

function transitionRecommendations({
  records,
  projectId,
  fromRevision,
  toRevision,
  operationId,
  acceptedRecommendationId = null,
  recommendationFingerprint = null,
  acceptedRecommendationReference = null,
  creatorActId = null,
  withoutMovement = false,
} = {}) {
  const pid = cleanString(projectId);
  const from = safeRevision(fromRevision);
  const to = safeRevision(toRevision);
  const opId = cleanString(operationId);
  const acceptedId = cleanString(acceptedRecommendationId);

  if (!pid || from === null || to === null || !opId) {
    fail("JOURNEY_AUTHORITY_TRANSITION_LINEAGE_INVALID", "Authority transition requires exact project, revision and operation lineage.");
  }
  if (withoutMovement && to !== from) {
    fail("JOURNEY_AUTHORITY_TRANSITION_NOOP_REVISION_CHANGED", "No-op recommendation consumption cannot advance Journey revision.");
  }
  if (!withoutMovement && to !== from + 1) {
    fail("JOURNEY_AUTHORITY_TRANSITION_PROGRESSION_INVALID", "Journey movement must advance progression revision exactly once.");
  }
  if (withoutMovement && !acceptedId) {
    fail("JOURNEY_AUTHORITY_TRANSITION_NOOP_RECOMMENDATION_REQUIRED", "No-op authority transition requires an accepted recommendation.");
  }

  let nextRecords = Array.isArray(records) ? cloneValue(records) : [];
  let consumed = null;

  if (acceptedId) {
    // Advisory recommendation issuance does not itself need an authoritative write.
    // If this exact, already-certified recommendation has not previously entered the
    // authority record, materialise it here and consume it in the same generation.
    // Existing authority lifecycle always wins and is never overwritten by caller evidence.
    nextRecords = materialiseAcceptedRecommendation(nextRecords, acceptedRecommendationReference, {
      projectId: pid,
      recommendationId: acceptedId,
      fingerprint: recommendationFingerprint,
      expectedProgressionRevision: from,
    });

    const consumption = consumeAuthorityRecommendation(nextRecords, {
      recommendationId: acceptedId,
      fingerprint: recommendationFingerprint,
      expectedProgressionRevision: from,
      terminalProgressionRevision: to,
      operationId: opId,
      creatorActId,
      withoutMovement,
    });
    nextRecords = cloneValue(consumption.records);
    consumed = cloneValue(consumption.record);
  }

  if (!withoutMovement) {
    nextRecords = invalidateAuthorityRecommendations(nextRecords, {
      projectId: pid,
      issuedAgainstProgressionRevision: from,
      terminalProgressionRevision: to,
      operationId: opId,
      exceptRecommendationId: acceptedId || null,
    });
  }

  return Object.freeze({
    records: cloneValue(nextRecords),
    consumedRecommendation: consumed,
  });
}

function commitJourneyAuthorityTransitionUnderLock({
  authorityStore,
  resolvedAuthority,
  nextJourney,
  operationId,
  acceptedRecommendationId = null,
  recommendationFingerprint = null,
  acceptedRecommendationReference = null,
  creatorActId = null,
  withoutMovement = false,
  serialization = null,
} = {}) {
  if (!authorityStore || typeof authorityStore.compareAndCommitUnderLock !== "function") {
    fail("JOURNEY_AUTHORITY_TRANSITION_STORE_REQUIRED", "Atomic Journey authority transition requires the under-lock authority-store CAS boundary.");
  }
  const project = resolvedAuthority?.project;
  const projectId = cleanString(resolvedAuthority?.projectId || project?.id);
  const expectedGeneration = safeRevision(resolvedAuthority?.authorityGeneration);
  const fromRevision = safeRevision(resolvedAuthority?.progressionRevision);
  const toRevision = safeRevision(nextJourney?.progression?.revision);
  if (!project || !projectId || expectedGeneration === null || fromRevision === null || toRevision === null) {
    fail("JOURNEY_AUTHORITY_TRANSITION_CONTEXT_INVALID", "Atomic Journey authority transition requires resolved authority context and exact revisions.");
  }

  return authorityStore.compareAndCommitUnderLock({
    project,
    expectedGeneration,
    expectedProgressionRevision: fromRevision,
    nextJourney,
    serialization,
    mutateRecord(candidate) {
      const lifecycle = transitionRecommendations({
        records: candidate.recommendations,
        projectId,
        fromRevision,
        toRevision,
        operationId,
        acceptedRecommendationId,
        recommendationFingerprint,
        acceptedRecommendationReference,
        creatorActId,
        withoutMovement,
      });
      candidate.recommendations = cloneValue(lifecycle.records);
      candidate.lastTransition = {
        operationId: cleanString(operationId),
        creatorActId: cleanString(creatorActId) || null,
        fromProgressionRevision: fromRevision,
        toProgressionRevision: toRevision,
        acceptedRecommendationId: cleanString(acceptedRecommendationId) || null,
        withoutMovement: withoutMovement === true,
        committedAt: new Date().toISOString(),
      };
      return candidate;
    },
  });
}

export {
  JOURNEY_AUTHORITY_ATOMIC_TRANSITION_VERSION,
  materialiseAcceptedRecommendation,
  transitionRecommendations,
  commitJourneyAuthorityTransitionUnderLock,
};

export default commitJourneyAuthorityTransitionUnderLock;

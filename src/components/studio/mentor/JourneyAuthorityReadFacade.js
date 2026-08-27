import createJourneyDurableAuthorityStore from "./JourneyDurableAuthorityStore.js";

const JOURNEY_AUTHORITY_READ_FACADE_VERSION = "1.1.0";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cloneValue(value) {
  if (value === undefined) return undefined;
  try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
}

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function authorityLifecycleToReferenceLifecycle(authorityLifecycle = {}) {
  const terminalReason = cleanString(authorityLifecycle?.terminalReason) || null;
  const lifecycle = {
    current: authorityLifecycle?.current === true,
    terminalReason,
  };

  if (terminalReason === "consumed") {
    lifecycle.consumedByOperationId = cleanString(authorityLifecycle?.operationId) || null;
    lifecycle.consumedByCreatorActId = cleanString(authorityLifecycle?.creatorActId) || null;
    lifecycle.consumedAtProgressionRevision = authorityLifecycle?.terminalProgressionRevision ?? null;
    lifecycle.consumedWithoutMovement = authorityLifecycle?.consumedWithoutMovement === true;
  } else if (terminalReason === "invalidated-by-progression") {
    lifecycle.invalidatedByOperationId = cleanString(authorityLifecycle?.operationId) || null;
    lifecycle.invalidatedAtProgressionRevision = authorityLifecycle?.terminalProgressionRevision ?? null;
  }

  return lifecycle;
}

function createJourneyAuthorityReadFacade({ authorityStore = createJourneyDurableAuthorityStore() } = {}) {
  if (!authorityStore || typeof authorityStore.read !== "function") {
    fail("JOURNEY_AUTHORITY_READ_STORE_REQUIRED", "Journey authority read facade requires the durable authority store.");
  }

  function readPreferred({ project, projectedJourney = null } = {}) {
    const projectId = cleanString(project?.id || project?.projectId);
    if (!projectId) fail("JOURNEY_AUTHORITY_READ_PROJECT_REQUIRED", "Journey authority read requires canonical project identity.");

    // If authority exists it is supreme. Malformed/identity-conflicting authority
    // throws from the store and must never silently fall back to Creator Memory.
    const authority = authorityStore.read(projectId, { project });
    if (authority) {
      const projection = authorityStore.compareProjection({ project, projectedJourney });
      return Object.freeze({
        status: "authority",
        source: "journey-authority-store",
        projectId,
        projectJourney: cloneValue(authority.journey),
        authorityGeneration: authority?.authority?.generation ?? null,
        progressionRevision: authority?.journey?.progression?.revision ?? 0,
        projectionStatus: projection.status,
        mechanicalAuthority: true,
        bootstrapRequiredBeforeMechanicalWrite: false,
      });
    }

    if (!projectedJourney || typeof projectedJourney !== "object") {
      return Object.freeze({
        status: "journey-absent",
        source: null,
        projectId,
        projectJourney: null,
        authorityGeneration: null,
        progressionRevision: null,
        projectionStatus: "authority-absent",
        mechanicalAuthority: false,
        bootstrapRequiredBeforeMechanicalWrite: true,
      });
    }

    // Legacy projection may remain useful for presentation before the first
    // mechanical operation. It is explicitly NOT authority and must be bootstrapped
    // under the canonical project lock before it can participate in a write.
    return Object.freeze({
      status: "legacy-unbootstrapped",
      source: "creator-memory-projection",
      projectId,
      projectJourney: cloneValue(projectedJourney),
      authorityGeneration: null,
      progressionRevision: projectedJourney?.progression?.revision ?? 0,
      projectionStatus: "authority-absent",
      mechanicalAuthority: false,
      bootstrapRequiredBeforeMechanicalWrite: true,
    });
  }

  function overlayRecommendationReferences({ project, entries = [] } = {}) {
    const projectId = cleanString(project?.id || project?.projectId);
    if (!projectId) fail("JOURNEY_AUTHORITY_READ_PROJECT_REQUIRED", "Recommendation lifecycle authority read requires canonical project identity.");

    const list = Array.isArray(entries) ? cloneValue(entries) : [];
    const authority = authorityStore.read(projectId, { project });
    if (!authority) return Object.freeze(list);

    const authoritativeRecommendations = Array.isArray(authority?.recommendations)
      ? authority.recommendations
      : [];

    const reconciled = list.map((entry) => {
      const reference = entry?.metadata?.recommendationReference;
      const recommendationId = cleanString(reference?.recommendationId);
      if (!reference || !recommendationId || cleanString(reference?.projectId) !== projectId) return entry;

      const authoritative = authoritativeRecommendations.find(
        (record) => cleanString(record?.recommendationId) === recommendationId
      ) || null;

      // Advisory recommendations do not need to enter authority merely because
      // Mentor uttered them. Absence from authority therefore leaves the advisory
      // Creator Memory reference unchanged until a creator act makes it mechanical.
      if (!authoritative) return entry;

      const referenceFingerprint = cleanString(reference?.recommendationFingerprint);
      const authorityFingerprint = cleanString(authoritative?.fingerprint);
      if (!referenceFingerprint || !authorityFingerprint || referenceFingerprint !== authorityFingerprint) {
        fail(
          "JOURNEY_AUTHORITY_RECOMMENDATION_IDENTITY_CONFLICT",
          "Creator Memory recommendation identity conflicts with Journey Authority lifecycle truth."
        );
      }

      return {
        ...entry,
        metadata: {
          ...(entry.metadata || {}),
          recommendationReference: {
            ...reference,
            lifecycle: authorityLifecycleToReferenceLifecycle(authoritative.lifecycle),
          },
        },
      };
    });

    return Object.freeze(reconciled);
  }

  return Object.freeze({
    version: JOURNEY_AUTHORITY_READ_FACADE_VERSION,
    readPreferred,
    overlayRecommendationReferences,
  });
}

export {
  JOURNEY_AUTHORITY_READ_FACADE_VERSION,
  authorityLifecycleToReferenceLifecycle,
  createJourneyAuthorityReadFacade,
};

export default createJourneyAuthorityReadFacade;

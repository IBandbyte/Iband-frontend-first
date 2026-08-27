const JOURNEY_RECOMMENDATION_LIFECYCLE_PERSISTENCE_VERSION = "1.0.0";
const RECOMMENDATION_REFERENCE_DOMAIN = "iband.movie-mentor.journey-recommendation-reference";

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

function effectiveProgressionRevision(projectJourney) {
  const revision = safeRevision(projectJourney?.progression?.revision);
  return revision === null && (projectJourney?.progression === undefined || projectJourney?.progression === null)
    ? 0
    : revision;
}

function fail(code, message, extras = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, extras);
  throw error;
}

function findProjectIndex(state, projectId) {
  const pid = cleanString(projectId);
  return Array.isArray(state?.projects)
    ? state.projects.findIndex((project) => cleanString(project?.id) === pid)
    : -1;
}

function isRecommendationReference(reference, projectId) {
  return Boolean(
    reference &&
    reference.domain === RECOMMENDATION_REFERENCE_DOMAIN &&
    cleanString(reference.projectId) === cleanString(projectId)
  );
}

function matchingRecommendationEntries(state, projectId, recommendationId) {
  const rid = cleanString(recommendationId);
  return (Array.isArray(state?.projectMemories) ? state.projectMemories : [])
    .map((entry, index) => ({ entry, index, reference: entry?.metadata?.recommendationReference || null }))
    .filter(({ reference }) => isRecommendationReference(reference, projectId) && cleanString(reference?.recommendationId) === rid);
}

function verifyCanonicalCurrentRecommendation(reference, {
  recommendationId,
  recommendationFingerprint = null,
  expectedProgressionRevision,
} = {}) {
  if (!reference) fail("JOURNEY_RECOMMENDATION_REFERENCE_NOT_FOUND", "Canonical recommendation reference was not found.");
  if (reference.lifecycle?.current !== true) {
    const reason = cleanString(reference.lifecycle?.terminalReason) || "not-current";
    fail(
      reason === "superseded" ? "JOURNEY_RECOMMENDATION_SUPERSEDED" : "JOURNEY_RECOMMENDATION_NOT_CURRENT",
      "Recommendation is no longer current.",
      { terminalReason: reason }
    );
  }
  if (cleanString(reference.recommendationId) !== cleanString(recommendationId)) {
    fail("JOURNEY_RECOMMENDATION_IDENTITY_INVALID", "Recommendation identity does not match the canonical durable reference.");
  }
  if (recommendationFingerprint && cleanString(reference.recommendationFingerprint) !== cleanString(recommendationFingerprint)) {
    fail("JOURNEY_RECOMMENDATION_IDENTITY_INVALID", "Recommendation fingerprint does not match the canonical durable reference.");
  }
  const issuedRevision = safeRevision(reference?.issuedAgainst?.progressionRevision);
  if (issuedRevision === null) {
    fail("JOURNEY_RECOMMENDATION_REFERENCE_RECOVERY_REQUIRED", "Recommendation reference lacks a valid progression revision binding.");
  }
  if (issuedRevision !== expectedProgressionRevision) {
    fail("JOURNEY_RECOMMENDATION_STALE", "Recommendation was issued against a different Journey progression revision.", {
      issuedAgainstProgressionRevision: issuedRevision,
      expectedProgressionRevision,
    });
  }
}

function consumedLifecycle(reference, {
  operationId,
  creatorActId,
  progressionRevision,
  withoutMovement = false,
  timestamp,
} = {}) {
  return {
    ...(cloneValue(reference?.lifecycle) || {}),
    current: false,
    terminalReason: "consumed",
    consumedByOperationId: cleanString(operationId) || null,
    consumedByCreatorActId: cleanString(creatorActId) || null,
    consumedAtProgressionRevision: progressionRevision,
    consumedWithoutMovement: withoutMovement === true,
    consumedAt: timestamp,
  };
}

function invalidatedLifecycle(reference, {
  operationId,
  progressionRevision,
  timestamp,
} = {}) {
  return {
    ...(cloneValue(reference?.lifecycle) || {}),
    current: false,
    terminalReason: "invalidated-by-progression",
    invalidatedByOperationId: cleanString(operationId) || null,
    invalidatedAtProgressionRevision: progressionRevision,
    invalidatedAt: timestamp,
  };
}

function rewriteRecommendationReferences(state, {
  projectId,
  expectedProgressionRevision,
  nextProgressionRevision,
  acceptedRecommendationId = null,
  recommendationFingerprint = null,
  operationId = null,
  creatorActId = null,
  withoutMovement = false,
} = {}) {
  const pid = cleanString(projectId);
  const acceptedId = cleanString(acceptedRecommendationId);
  const timestamp = new Date().toISOString();
  const matching = acceptedId ? matchingRecommendationEntries(state, pid, acceptedId) : [];

  if (acceptedId) {
    if (matching.length !== 1) {
      fail(
        matching.length ? "JOURNEY_RECOMMENDATION_REFERENCE_DUPLICATE" : "JOURNEY_RECOMMENDATION_REFERENCE_NOT_FOUND",
        "Acceptance requires exactly one canonical durable recommendation reference.",
        { matchingRecommendationReferenceCount: matching.length }
      );
    }
    verifyCanonicalCurrentRecommendation(matching[0].reference, {
      recommendationId: acceptedId,
      recommendationFingerprint,
      expectedProgressionRevision,
    });
  }

  state.projectMemories = (Array.isArray(state.projectMemories) ? state.projectMemories : []).map((entry) => {
    const reference = entry?.metadata?.recommendationReference;
    if (!isRecommendationReference(reference, pid) || reference.lifecycle?.current !== true) return entry;

    const issuedRevision = safeRevision(reference?.issuedAgainst?.progressionRevision);
    const isAccepted = acceptedId && cleanString(reference.recommendationId) === acceptedId;

    if (isAccepted) {
      const updatedReference = cloneValue(reference);
      updatedReference.lifecycle = consumedLifecycle(reference, {
        operationId,
        creatorActId,
        progressionRevision: withoutMovement ? expectedProgressionRevision : nextProgressionRevision,
        withoutMovement,
        timestamp,
      });
      return {
        ...entry,
        updatedAt: timestamp,
        metadata: { ...(entry.metadata || {}), recommendationReference: updatedReference },
      };
    }

    if (!withoutMovement && issuedRevision !== null && issuedRevision === expectedProgressionRevision) {
      const updatedReference = cloneValue(reference);
      updatedReference.lifecycle = invalidatedLifecycle(reference, {
        operationId,
        progressionRevision: nextProgressionRevision,
        timestamp,
      });
      return {
        ...entry,
        updatedAt: timestamp,
        metadata: { ...(entry.metadata || {}), recommendationReference: updatedReference },
      };
    }

    return entry;
  });
}

function verifyPersistedRecommendationLifecycle(state, projectId, recommendationId, terminalReason) {
  const matches = matchingRecommendationEntries(state, projectId, recommendationId);
  if (matches.length !== 1) return false;
  const lifecycle = matches[0].reference?.lifecycle || {};
  return lifecycle.current === false && lifecycle.terminalReason === terminalReason;
}

function persistJourneyAndRecommendationLifecycle({
  identityRuntime,
  projectId,
  candidateJourney,
  expectedProgressionRevision,
  acceptedRecommendationId = null,
  recommendationFingerprint = null,
  operationId = null,
  creatorActId = null,
} = {}) {
  const memory = identityRuntime?.memory;
  if (!memory?.getState || !memory?.replaceState || !memory?.getProject) {
    return null;
  }

  const pid = cleanString(projectId);
  const expected = safeRevision(expectedProgressionRevision);
  const nextRevision = safeRevision(candidateJourney?.progression?.revision);
  if (!pid || expected === null || nextRevision !== expected + 1) {
    fail("JOURNEY_RECOMMENDATION_ATOMIC_CANDIDATE_INVALID", "Atomic Journey lifecycle persistence requires exact N to N+1 candidate reality.");
  }

  const state = memory.getState();
  const projectIndex = findProjectIndex(state, pid);
  if (projectIndex < 0) fail("JOURNEY_RECOMMENDATION_ATOMIC_PROJECT_NOT_FOUND", "Atomic Journey lifecycle persistence could not find the project.");

  const project = state.projects[projectIndex];
  const currentRevision = effectiveProgressionRevision(project?.metadata?.projectJourney);
  if (currentRevision === null) fail("JOURNEY_RECOMMENDATION_ATOMIC_RECOVERY_REQUIRED", "Persisted Journey progression metadata is malformed.");
  if (currentRevision !== expected) {
    fail("MOVIE_MENTOR_JOURNEY_PROGRESSION_STALE", "Persisted Journey changed before atomic lifecycle commit.", {
      expectedProgressionRevision: expected,
      currentProgressionRevision: currentRevision,
    });
  }

  const nextState = cloneValue(state);
  rewriteRecommendationReferences(nextState, {
    projectId: pid,
    expectedProgressionRevision: expected,
    nextProgressionRevision: nextRevision,
    acceptedRecommendationId,
    recommendationFingerprint,
    operationId,
    creatorActId,
    withoutMovement: false,
  });

  const originalIdentity = cloneValue(project.identity || null);
  const nextProject = nextState.projects[projectIndex];
  nextState.projects[projectIndex] = {
    ...nextProject,
    identity: originalIdentity,
    metadata: {
      ...(nextProject.metadata || {}),
      creatorMode: "ai-movie",
      creatorModeLabel: nextProject.metadata?.creatorModeLabel || "AI Movie Making",
      projectJourney: cloneValue(candidateJourney),
    },
    updatedAt: new Date().toISOString(),
  };

  memory.replaceState(nextState);

  const persistedProject = memory.getProject(pid);
  const persistedJourney = persistedProject?.metadata?.projectJourney || null;
  if (effectiveProgressionRevision(persistedJourney) !== nextRevision) {
    fail("JOURNEY_RECOMMENDATION_ATOMIC_VERIFICATION_FAILED", "Atomic persistence could not verify the committed Journey revision.");
  }
  if (JSON.stringify(persistedProject?.identity || null) !== JSON.stringify(originalIdentity)) {
    fail("JOURNEY_RECOMMENDATION_ATOMIC_IDENTITY_VIOLATION", "Atomic persistence changed immutable project identity.");
  }
  if (acceptedRecommendationId) {
    const persistedState = memory.getState();
    if (!verifyPersistedRecommendationLifecycle(persistedState, pid, acceptedRecommendationId, "consumed")) {
      fail("JOURNEY_RECOMMENDATION_ATOMIC_VERIFICATION_FAILED", "Atomic persistence could not verify recommendation consumption.");
    }
  }

  return cloneValue(persistedProject);
}

function consumeRecommendationWithoutMovement({
  identityRuntime,
  projectId,
  recommendationId,
  recommendationFingerprint = null,
  expectedProgressionRevision,
  operationId,
  creatorActId,
} = {}) {
  const memory = identityRuntime?.memory;
  if (!memory?.getState || !memory?.replaceState || !memory?.getProject) {
    fail("JOURNEY_RECOMMENDATION_LIFECYCLE_PERSISTENCE_REQUIRED", "No-op recommendation acceptance requires durable lifecycle persistence.");
  }

  const pid = cleanString(projectId);
  const expected = safeRevision(expectedProgressionRevision);
  if (!pid || expected === null) fail("JOURNEY_RECOMMENDATION_NOOP_EXPECTED_REVISION_INVALID", "No-op acceptance requires an exact Journey revision.");

  const state = memory.getState();
  const projectIndex = findProjectIndex(state, pid);
  if (projectIndex < 0) fail("JOURNEY_RECOMMENDATION_ATOMIC_PROJECT_NOT_FOUND", "No-op acceptance could not find the project.");
  const project = state.projects[projectIndex];
  const currentRevision = effectiveProgressionRevision(project?.metadata?.projectJourney);
  if (currentRevision !== expected) {
    fail("MOVIE_MENTOR_JOURNEY_PROGRESSION_STALE", "Journey changed before no-op recommendation consumption could commit.", {
      expectedProgressionRevision: expected,
      currentProgressionRevision: currentRevision,
    });
  }

  const existing = matchingRecommendationEntries(state, pid, recommendationId);
  if (existing.length === 1 && existing[0].reference?.lifecycle?.current === false && existing[0].reference?.lifecycle?.terminalReason === "consumed") {
    return Object.freeze({
      status: "already-consumed-no-movement",
      recommendationId: cleanString(recommendationId),
      operationId: cleanString(existing[0].reference?.lifecycle?.consumedByOperationId) || cleanString(operationId) || null,
      creatorActId: cleanString(existing[0].reference?.lifecycle?.consumedByCreatorActId) || null,
      projectJourney: cloneValue(project?.metadata?.projectJourney || null),
      progressionRevision: currentRevision,
      newCreatorAuthorityIssued: false,
    });
  }

  const nextState = cloneValue(state);
  rewriteRecommendationReferences(nextState, {
    projectId: pid,
    expectedProgressionRevision: expected,
    nextProgressionRevision: expected,
    acceptedRecommendationId: recommendationId,
    recommendationFingerprint,
    operationId,
    creatorActId,
    withoutMovement: true,
  });
  memory.replaceState(nextState);

  const persistedState = memory.getState();
  const persistedProject = memory.getProject(pid);
  if (effectiveProgressionRevision(persistedProject?.metadata?.projectJourney) !== expected) {
    fail("JOURNEY_RECOMMENDATION_ATOMIC_VERIFICATION_FAILED", "No-op consumption unexpectedly changed Journey progression revision.");
  }
  if (!verifyPersistedRecommendationLifecycle(persistedState, pid, recommendationId, "consumed")) {
    fail("JOURNEY_RECOMMENDATION_ATOMIC_VERIFICATION_FAILED", "No-op recommendation consumption could not be verified.");
  }

  return Object.freeze({
    status: "accepted-no-movement-required",
    recommendationId: cleanString(recommendationId),
    operationId: cleanString(operationId) || null,
    creatorActId: cleanString(creatorActId) || null,
    projectJourney: cloneValue(persistedProject?.metadata?.projectJourney || null),
    progressionRevision: expected,
    newCreatorAuthorityIssued: false,
  });
}

function classifyRecommendationLifecycleRecovery({ projectJourney, recommendationReference } = {}) {
  if (!recommendationReference || recommendationReference.domain !== RECOMMENDATION_REFERENCE_DOMAIN) {
    return Object.freeze({ status: "historical-only", reason: "reference-invalid-or-legacy" });
  }
  const issuedRevision = safeRevision(recommendationReference?.issuedAgainst?.progressionRevision);
  const currentRevision = effectiveProgressionRevision(projectJourney);
  if (issuedRevision === null || currentRevision === null) {
    return Object.freeze({ status: "historical-only", reason: "revision-binding-invalid" });
  }
  if (recommendationReference.lifecycle?.current !== true) {
    return Object.freeze({ status: "healthy-historical", reason: cleanString(recommendationReference.lifecycle?.terminalReason) || "not-current" });
  }
  if (currentRevision === issuedRevision) {
    return Object.freeze({ status: "potentially-current", reason: "journey-revision-unchanged" });
  }
  if (currentRevision < issuedRevision) {
    return Object.freeze({ status: "recovery-required", reason: "recommendation-issued-ahead-of-journey" });
  }

  const recommendationId = cleanString(recommendationReference.recommendationId);
  const receipts = Array.isArray(projectJourney?.progression?.committedOperations)
    ? projectJourney.progression.committedOperations
    : [];
  const consumingReceipt = receipts.find((receipt) => cleanString(receipt?.recommendation?.recommendationId) === recommendationId) || null;
  if (consumingReceipt) {
    return Object.freeze({ status: "repair-consumed", reason: "exact-receipt-lineage", receipt: cloneValue(consumingReceipt) });
  }
  return Object.freeze({ status: "repair-invalidated", reason: "journey-advanced-without-consumption-proof" });
}

export {
  JOURNEY_RECOMMENDATION_LIFECYCLE_PERSISTENCE_VERSION,
  persistJourneyAndRecommendationLifecycle,
  consumeRecommendationWithoutMovement,
  classifyRecommendationLifecycleRecovery,
};

export default persistJourneyAndRecommendationLifecycle;

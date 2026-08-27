import { classifyRecommendationLifecycleRecovery } from "./JourneyRecommendationLifecyclePersistence.js";

const JOURNEY_RECOMMENDATION_LIFECYCLE_RECOVERY_VERSION = "1.0.0";
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

function findProject(state, projectId) {
  const pid = cleanString(projectId);
  return Array.isArray(state?.projects)
    ? state.projects.find((project) => cleanString(project?.id) === pid) || null
    : null;
}

function recommendationEntries(state, projectId) {
  const pid = cleanString(projectId);
  return (Array.isArray(state?.projectMemories) ? state.projectMemories : [])
    .map((entry, index) => ({ entry, index, reference: entry?.metadata?.recommendationReference || null }))
    .filter(({ reference }) => reference && cleanString(reference.projectId) === pid);
}

function exactReferenceIdentity(reference) {
  return JSON.stringify({
    domain: reference?.domain || null,
    recommendationId: reference?.recommendationId || null,
    recommendationFingerprint: reference?.recommendationFingerprint || null,
    issuedAgainst: reference?.issuedAgainst || null,
    target: reference?.target || null,
    lifecycle: reference?.lifecycle || null,
  });
}

function recoveryLifecycle(reference, classification, journeyRevision, timestamp) {
  const base = cloneValue(reference?.lifecycle) || {};
  if (classification.status === "repair-consumed") {
    const receipt = classification.receipt || {};
    return {
      ...base,
      current: false,
      terminalReason: "consumed",
      consumedByOperationId: cleanString(receipt.operationId) || null,
      consumedByCreatorActId: cleanString(receipt.creatorActId) || null,
      consumedAtProgressionRevision: safeRevision(receipt.nextProgressionRevision) ?? journeyRevision,
      consumedWithoutMovement: false,
      recoveredAt: timestamp,
      recoveredBy: "durable-receipt-lineage",
      recoveryVersion: JOURNEY_RECOMMENDATION_LIFECYCLE_RECOVERY_VERSION,
    };
  }
  if (classification.status === "repair-invalidated") {
    return {
      ...base,
      current: false,
      terminalReason: "invalidated-by-progression",
      invalidatedAtProgressionRevision: journeyRevision,
      recoveredAt: timestamp,
      recoveredBy: "durable-journey-revision",
      recoveryVersion: JOURNEY_RECOMMENDATION_LIFECYCLE_RECOVERY_VERSION,
    };
  }
  if (classification.status === "historical-only" && reference?.lifecycle?.current === true) {
    return {
      ...base,
      current: false,
      terminalReason: "legacy-quarantined",
      recoveredAt: timestamp,
      recoveredBy: "conservative-legacy-quarantine",
      recoveryVersion: JOURNEY_RECOMMENDATION_LIFECYCLE_RECOVERY_VERSION,
    };
  }
  return null;
}

function planJourneyRecommendationLifecycleRecovery({ state, projectId } = {}) {
  const pid = cleanString(projectId);
  const project = findProject(state, pid);
  if (!pid || !project) {
    fail("JOURNEY_RECOMMENDATION_RECOVERY_PROJECT_NOT_FOUND", "Recommendation lifecycle recovery requires an existing project.");
  }
  const projectJourney = project?.metadata?.projectJourney || null;
  const journeyRevision = effectiveProgressionRevision(projectJourney);
  if (journeyRevision === null) {
    fail("JOURNEY_RECOMMENDATION_RECOVERY_JOURNEY_MALFORMED", "Recommendation lifecycle recovery refuses malformed Journey progression metadata.");
  }

  const repairs = [];
  const observations = [];
  for (const { index, reference } of recommendationEntries(state, pid)) {
    const classification = classifyRecommendationLifecycleRecovery({ projectJourney, recommendationReference: reference });
    observations.push({ index, recommendationId: cleanString(reference?.recommendationId) || null, classification });
    if (["repair-consumed", "repair-invalidated"].includes(classification.status) ||
        (classification.status === "historical-only" && reference?.lifecycle?.current === true)) {
      repairs.push({
        index,
        expectedIdentity: exactReferenceIdentity(reference),
        classification,
      });
    }
  }

  return Object.freeze({
    projectId: pid,
    expectedJourneyRevision: journeyRevision,
    repairs: Object.freeze(repairs),
    observations: Object.freeze(observations),
  });
}

function executeJourneyRecommendationLifecycleRecovery({ identityRuntime, projectId } = {}) {
  const memory = identityRuntime?.memory;
  if (!memory?.getState || !memory?.replaceState || !memory?.getProject) {
    fail("JOURNEY_RECOMMENDATION_RECOVERY_PERSISTENCE_REQUIRED", "Recommendation lifecycle recovery requires durable Creator Memory persistence.");
  }

  const initialState = memory.getState();
  const plan = planJourneyRecommendationLifecycleRecovery({ state: initialState, projectId });
  if (!plan.repairs.length) {
    return Object.freeze({ status: "no-repair-required", projectId: plan.projectId, repaired: Object.freeze([]), observations: plan.observations });
  }

  // Recovery authority is deliberately metadata-only. Re-read immediately before the write,
  // then prove both Journey revision and each recommendation identity still match the plan.
  const latestState = memory.getState();
  const latestProject = findProject(latestState, plan.projectId);
  const latestJourney = latestProject?.metadata?.projectJourney || null;
  const latestRevision = effectiveProgressionRevision(latestJourney);
  if (latestRevision !== plan.expectedJourneyRevision) {
    fail("JOURNEY_RECOMMENDATION_RECOVERY_STALE", "Journey changed while recommendation lifecycle recovery was being prepared.", {
      expectedProgressionRevision: plan.expectedJourneyRevision,
      currentProgressionRevision: latestRevision,
    });
  }

  const latestEntries = recommendationEntries(latestState, plan.projectId);
  for (const repair of plan.repairs) {
    const current = latestEntries.find(({ index }) => index === repair.index);
    if (!current || exactReferenceIdentity(current.reference) !== repair.expectedIdentity) {
      fail("JOURNEY_RECOMMENDATION_RECOVERY_STALE", "Recommendation reference changed while recovery was being prepared.");
    }
  }

  const beforeJourney = JSON.stringify(latestJourney);
  const nextState = cloneValue(latestState);
  const timestamp = new Date().toISOString();
  const repaired = [];

  for (const repair of plan.repairs) {
    const entry = nextState.projectMemories[repair.index];
    const reference = entry?.metadata?.recommendationReference;
    const lifecycle = recoveryLifecycle(reference, repair.classification, plan.expectedJourneyRevision, timestamp);
    if (!lifecycle) continue;
    const nextReference = cloneValue(reference);
    nextReference.lifecycle = lifecycle;
    nextState.projectMemories[repair.index] = {
      ...entry,
      updatedAt: timestamp,
      metadata: { ...(entry.metadata || {}), recommendationReference: nextReference },
    };
    repaired.push(Object.freeze({
      recommendationId: cleanString(reference?.recommendationId) || null,
      terminalReason: lifecycle.terminalReason,
      recoveryProof: lifecycle.recoveredBy,
    }));
  }

  // Absolute recovery law: this boundary cannot rewrite Journey reality.
  const nextProject = findProject(nextState, plan.projectId);
  if (JSON.stringify(nextProject?.metadata?.projectJourney || null) !== beforeJourney) {
    fail("JOURNEY_RECOMMENDATION_RECOVERY_AUTHORITY_VIOLATION", "Recovery attempted to alter authoritative Journey reality.");
  }

  memory.replaceState(nextState);

  const persistedProject = memory.getProject(plan.projectId);
  const persistedJourney = persistedProject?.metadata?.projectJourney || null;
  if (JSON.stringify(persistedJourney) !== beforeJourney || effectiveProgressionRevision(persistedJourney) !== plan.expectedJourneyRevision) {
    fail("JOURNEY_RECOMMENDATION_RECOVERY_VERIFICATION_FAILED", "Recovery could not prove that Journey reality remained unchanged.");
  }

  const persistedState = memory.getState();
  for (const item of repaired) {
    const matches = recommendationEntries(persistedState, plan.projectId)
      .filter(({ reference }) => cleanString(reference?.recommendationId) === cleanString(item.recommendationId));
    if (item.recommendationId && matches.length !== 1) {
      fail("JOURNEY_RECOMMENDATION_RECOVERY_VERIFICATION_FAILED", "Recovery could not uniquely verify the repaired recommendation reference.");
    }
    if (matches.length === 1 && (matches[0].reference?.lifecycle?.current !== false || matches[0].reference?.lifecycle?.terminalReason !== item.terminalReason)) {
      fail("JOURNEY_RECOMMENDATION_RECOVERY_VERIFICATION_FAILED", "Recovery could not verify the terminal recommendation lifecycle state.");
    }
  }

  return Object.freeze({
    status: "repaired",
    projectId: plan.projectId,
    progressionRevision: plan.expectedJourneyRevision,
    repaired: Object.freeze(repaired),
    journeyMutated: false,
  });
}

export {
  JOURNEY_RECOMMENDATION_LIFECYCLE_RECOVERY_VERSION,
  planJourneyRecommendationLifecycleRecovery,
  executeJourneyRecommendationLifecycleRecovery,
};

export default executeJourneyRecommendationLifecycleRecovery;

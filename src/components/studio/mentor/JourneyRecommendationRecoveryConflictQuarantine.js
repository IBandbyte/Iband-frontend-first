import { planJourneyRecommendationLifecycleRecovery } from "./JourneyRecommendationLifecycleRecovery.js";

const JOURNEY_RECOMMENDATION_RECOVERY_CONFLICT_QUARANTINE_VERSION = "1.0.0";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cloneValue(value) {
  if (value === undefined) return undefined;
  try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
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

function quarantineJourneyRecommendationRecoveryConflicts({ identityRuntime, projectId } = {}) {
  const memory = identityRuntime?.memory;
  if (!memory?.getState || !memory?.replaceState || !memory?.getProject) {
    fail("JOURNEY_RECOMMENDATION_CONFLICT_QUARANTINE_PERSISTENCE_REQUIRED", "Proof-conflict quarantine requires durable Creator Memory persistence.");
  }

  const initialState = memory.getState();
  const plan = planJourneyRecommendationLifecycleRecovery({ state: initialState, projectId });
  if (!plan.blockers.length) {
    return Object.freeze({
      status: "no-conflict-quarantine-required",
      projectId: plan.projectId,
      quarantined: Object.freeze([]),
      journeyMutated: false,
    });
  }

  const conflictBlockers = plan.blockers.filter((blocker) => blocker?.classification?.reason === "consumption-receipt-lineage-inconsistent");
  if (conflictBlockers.length !== plan.blockers.length) {
    fail("JOURNEY_RECOMMENDATION_CONFLICT_QUARANTINE_UNSUPPORTED_BLOCKER", "Recovery contains a blocker that cannot be safely quarantined as a receipt proof conflict.", {
      blockers: cloneValue(plan.blockers),
    });
  }

  const expected = conflictBlockers.map((blocker) => ({
    index: blocker.index,
    recommendationId: cleanString(blocker.recommendationId) || null,
    identity: exactReferenceIdentity(initialState?.projectMemories?.[blocker.index]?.metadata?.recommendationReference || null),
    classification: cloneValue(blocker.classification),
  }));

  // Re-read immediately before the write. Quarantine is metadata-only and loses
  // authority if either the Journey or the conflicted reference changed.
  const latestState = memory.getState();
  const latestPlan = planJourneyRecommendationLifecycleRecovery({ state: latestState, projectId: plan.projectId });
  if (latestPlan.expectedJourneyRevision !== plan.expectedJourneyRevision) {
    fail("JOURNEY_RECOMMENDATION_CONFLICT_QUARANTINE_STALE", "Journey changed before proof-conflict quarantine could commit.");
  }
  for (const item of expected) {
    const reference = latestState?.projectMemories?.[item.index]?.metadata?.recommendationReference || null;
    if (exactReferenceIdentity(reference) !== item.identity) {
      fail("JOURNEY_RECOMMENDATION_CONFLICT_QUARANTINE_STALE", "Recommendation proof-conflict reality changed before quarantine could commit.");
    }
  }

  const beforeJourney = JSON.stringify(findProject(latestState, plan.projectId)?.metadata?.projectJourney || null);
  const nextState = cloneValue(latestState);
  const timestamp = new Date().toISOString();
  const quarantined = [];

  for (const item of expected) {
    const entry = nextState.projectMemories[item.index];
    const reference = entry?.metadata?.recommendationReference;
    if (!reference || reference.lifecycle?.current !== true) {
      fail("JOURNEY_RECOMMENDATION_CONFLICT_QUARANTINE_STALE", "Conflicted recommendation is no longer current at quarantine commit time.");
    }
    const nextReference = cloneValue(reference);
    nextReference.lifecycle = {
      ...(nextReference.lifecycle || {}),
      current: false,
      terminalReason: "proof-conflict-quarantined",
      quarantinedAt: timestamp,
      quarantinedBy: "durable-recovery-proof-conflict",
      quarantineVersion: JOURNEY_RECOMMENDATION_RECOVERY_CONFLICT_QUARANTINE_VERSION,
      recoveryConflict: {
        reason: item.classification?.reason || null,
        proof: cloneValue(item.classification?.proof || null),
        receipt: cloneValue(item.classification?.receipt || null),
      },
    };
    nextState.projectMemories[item.index] = {
      ...entry,
      updatedAt: timestamp,
      metadata: { ...(entry.metadata || {}), recommendationReference: nextReference },
    };
    quarantined.push(Object.freeze({
      recommendationId: cleanString(reference.recommendationId) || null,
      terminalReason: "proof-conflict-quarantined",
    }));
  }

  const nextJourney = JSON.stringify(findProject(nextState, plan.projectId)?.metadata?.projectJourney || null);
  if (nextJourney !== beforeJourney) {
    fail("JOURNEY_RECOMMENDATION_CONFLICT_QUARANTINE_AUTHORITY_VIOLATION", "Proof-conflict quarantine attempted to alter authoritative Journey reality.");
  }

  memory.replaceState(nextState);

  const persistedState = memory.getState();
  const persistedJourney = JSON.stringify(findProject(persistedState, plan.projectId)?.metadata?.projectJourney || null);
  if (persistedJourney !== beforeJourney) {
    fail("JOURNEY_RECOMMENDATION_CONFLICT_QUARANTINE_VERIFICATION_FAILED", "Proof-conflict quarantine could not prove Journey immutability.");
  }
  for (const item of quarantined) {
    const matches = (Array.isArray(persistedState.projectMemories) ? persistedState.projectMemories : [])
      .map((entry) => entry?.metadata?.recommendationReference || null)
      .filter((reference) => cleanString(reference?.recommendationId) === cleanString(item.recommendationId));
    if (matches.length !== 1 || matches[0]?.lifecycle?.current !== false || matches[0]?.lifecycle?.terminalReason !== "proof-conflict-quarantined") {
      fail("JOURNEY_RECOMMENDATION_CONFLICT_QUARANTINE_VERIFICATION_FAILED", "Proof-conflict quarantine could not verify the terminal lifecycle state.");
    }
  }

  return Object.freeze({
    status: "proof-conflict-quarantined",
    projectId: plan.projectId,
    progressionRevision: plan.expectedJourneyRevision,
    quarantined: Object.freeze(quarantined),
    journeyMutated: false,
  });
}

export {
  JOURNEY_RECOMMENDATION_RECOVERY_CONFLICT_QUARANTINE_VERSION,
  quarantineJourneyRecommendationRecoveryConflicts,
};

export default quarantineJourneyRecommendationRecoveryConflicts;

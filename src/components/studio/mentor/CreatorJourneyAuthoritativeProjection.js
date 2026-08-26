const CREATOR_JOURNEY_AUTHORITATIVE_PROJECTION_VERSION = "1.0.1";
const PROJECTION_SOURCE = "durable-post-commit-creator-state";

function cleanString(value) { return typeof value === "string" ? value.trim() : ""; }
function clone(value) { if (value === undefined) return undefined; try { return JSON.parse(JSON.stringify(value)); } catch { return value; } }
function asArray(value) { return Array.isArray(value) ? value : []; }
function safeRevision(value) { const n = Number(value); return Number.isSafeInteger(n) && n >= 0 ? n : null; }
function fail(code, message) { const error = new Error(message); error.code = code; throw error; }

function semanticProjectionKey(item = {}) {
  const semanticKey = cleanString(item.semanticKey || item?.metadata?.semanticKey);
  if (semanticKey) return semanticKey;
  const decisionKey = cleanString(item.decisionKey);
  if (decisionKey.startsWith("semantic.")) return decisionKey.slice("semantic.".length);
  if (decisionKey.startsWith("continuation.")) return `creator.${decisionKey}`;
  const key = cleanString(item.key);
  if (key.startsWith("creatorDecision.semantic.")) return key.slice("creatorDecision.semantic.".length);
  if (key.startsWith("creatorDecision.continuation.")) return `creator.${key.slice("creatorDecision.".length)}`;
  return key;
}

function validateAuthorityEnvelope(authority = {}) {
  if (!authority || typeof authority !== "object") fail("CREATOR_JOURNEY_AUTHORITY_REQUIRED", "Authoritative Journey projection requires a post-commit creator authority envelope.");
  const revision = safeRevision(authority.revision);
  const truth = Array.isArray(authority.currentCreatorTruth) ? authority.currentCreatorTruth : Array.isArray(authority.creatorConfirmedContext) ? authority.creatorConfirmedContext : null;
  if (revision === null || !truth) fail("CREATOR_JOURNEY_AUTHORITY_INVALID", "Authoritative Journey projection received malformed creator authority.");
  for (const item of truth) {
    if (!item || typeof item !== "object" || item.authority !== "creator" || item.current !== true || !cleanString(item.decisionId) || !cleanString(item.decisionKey)) {
      fail("CREATOR_JOURNEY_AUTHORITY_INVALID", "Authoritative Journey projection accepts current durable creator decisions only.");
    }
  }
  return { revision, truth: clone(truth) };
}

function getProjectionRevision(journey = {}) {
  return safeRevision(journey?.metadata?.authoritativeCreatorProjectionRevision);
}

function sameDurableDecision(decision = {}, item = {}) {
  return cleanString(decision?.metadata?.durableDecisionId) === cleanString(item.decisionId) && cleanString(item.decisionId) !== "";
}

function sameDurableDecisionKey(decision = {}, item = {}) {
  return cleanString(decision?.metadata?.durableDecisionKey) === cleanString(item.decisionKey) && cleanString(item.decisionKey) !== "";
}

function projectedDecision(item, revision) {
  const key = semanticProjectionKey(item);
  if (!key) fail("CREATOR_JOURNEY_AUTHORITY_ITEM_KEY_REQUIRED", "Durable creator truth cannot be projected without a semantic Journey key.");
  return {
    id: cleanString(item.decisionId),
    key,
    value: clone(item.value),
    authority: "creator",
    status: "active",
    stageId: cleanString(item.stageId) || null,
    sceneId: cleanString(item.sceneId) || null,
    confidence: null,
    reason: cleanString(item.evidence) || null,
    metadata: {
      source: PROJECTION_SOURCE,
      durableDecisionKey: cleanString(item.decisionKey),
      durableDecisionId: cleanString(item.decisionId),
      durableDecisionFingerprint: cleanString(item.decisionFingerprint) || null,
      decisionIntent: cleanString(item.decisionIntent) || null,
      evidenceSource: cleanString(item.evidenceSource) || null,
      authorityRevision: revision,
      originalKey: cleanString(item.key) || null,
    },
    createdAt: cleanString(item.createdAt) || null,
    supersededAt: null,
  };
}

function reconcileAuthoritativeCreatorTruth(journey, authority) {
  const original = clone(journey);
  if (!original || typeof original !== "object") fail("CREATOR_JOURNEY_REQUIRED", "Authoritative creator truth requires an existing Journey document.");
  const { revision, truth } = validateAuthorityEnvelope(authority);
  const priorRevision = getProjectionRevision(original);
  if (priorRevision !== null && revision < priorRevision) fail("CREATOR_JOURNEY_STALE_AUTHORITY", "Older creator authority cannot regress the Journey projection.");
  if (priorRevision !== null && revision === priorRevision) return original;

  const positionBefore = {
    currentStageId: original.currentStageId ?? null,
    currentTaskId: original.currentTaskId ?? null,
    resumePoint: clone(original.resumePoint ?? null),
    stageStatuses: asArray(original.stages).map(stage => ({ id: stage?.id, status: stage?.status, tasks: asArray(stage?.tasks).map(task => ({ id: task?.id, status: task?.status })) })),
  };

  const next = clone(original);
  next.decisions = asArray(next.decisions);
  const incomingByKey = new Map(truth.map(item => [cleanString(item.decisionKey), item]).filter(([key]) => key));
  const now = new Date().toISOString();

  // Supersede only projected durable creator decisions whose durable key is
  // explicitly replaced in this authority revision. Absence is never deletion.
  // Preserve the replacement decision identity at the moment supersession occurs.
  for (const decision of next.decisions) {
    if (decision?.authority !== "creator" || decision?.status !== "active") continue;
    const durableId = cleanString(decision?.metadata?.durableDecisionId);
    const durableKey = cleanString(decision?.metadata?.durableDecisionKey);
    if (!durableId || !durableKey) continue;
    const replacement = incomingByKey.get(durableKey);
    if (!replacement) continue;
    const replacementId = cleanString(replacement.decisionId);
    if (!replacementId || replacementId === durableId) continue;
    decision.status = "superseded";
    decision.supersededAt = now;
    decision.metadata = {
      ...(decision.metadata || {}),
      supersededByDecisionId: replacementId,
      supersededByAuthorityRevision: revision,
    };
  }

  for (const item of truth) {
    const existingExact = next.decisions.find(decision => sameDurableDecision(decision, item));
    if (existingExact) {
      existingExact.status = "active";
      existingExact.supersededAt = null;
      existingExact.metadata = { ...(existingExact.metadata || {}), authorityRevision: revision };
      continue;
    }
    for (const decision of next.decisions) {
      if (decision?.authority === "creator" && decision?.status === "active" && sameDurableDecisionKey(decision, item)) {
        decision.status = "superseded";
        decision.supersededAt = now;
        decision.metadata = {
          ...(decision.metadata || {}),
          supersededByDecisionId: cleanString(item.decisionId),
          supersededByAuthorityRevision: revision,
        };
      }
    }
    next.decisions.push(projectedDecision(item, revision));
  }

  next.metadata = {
    ...(next.metadata || {}),
    authoritativeCreatorProjectionRevision: revision,
    authoritativeCreatorProjectionSource: PROJECTION_SOURCE,
    authoritativeCreatorProjectionVersion: CREATOR_JOURNEY_AUTHORITATIVE_PROJECTION_VERSION,
  };

  const positionAfter = {
    currentStageId: next.currentStageId ?? null,
    currentTaskId: next.currentTaskId ?? null,
    resumePoint: clone(next.resumePoint ?? null),
    stageStatuses: asArray(next.stages).map(stage => ({ id: stage?.id, status: stage?.status, tasks: asArray(stage?.tasks).map(task => ({ id: task?.id, status: task?.status })) })),
  };
  if (JSON.stringify(positionBefore) !== JSON.stringify(positionAfter)) fail("CREATOR_JOURNEY_PROJECTION_MOVED_POSITION", "Creator authority projection must never move Journey stage/task position.");
  return next;
}

export { CREATOR_JOURNEY_AUTHORITATIVE_PROJECTION_VERSION, PROJECTION_SOURCE, semanticProjectionKey, validateAuthorityEnvelope, getProjectionRevision, reconcileAuthoritativeCreatorTruth };
export default reconcileAuthoritativeCreatorTruth;

const JOURNEY_AUTHORITY_RECOMMENDATION_LIFECYCLE_VERSION = "1.0.0";
const AUTHORITY_RECOMMENDATION_DOMAIN = "iband.movie-mentor.journey-authority-recommendation";
const AUTHORITY_RECOMMENDATION_SCHEMA = 1;

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

function createAuthorityRecommendationRecord(reference) {
  const recommendationId = cleanString(reference?.recommendationId);
  const fingerprint = cleanString(reference?.recommendationFingerprint);
  const projectId = cleanString(reference?.projectId);
  const issuedRevision = safeRevision(reference?.issuedAgainst?.progressionRevision);
  if (!recommendationId || !fingerprint || !projectId || issuedRevision === null) {
    fail(
      "JOURNEY_AUTHORITY_RECOMMENDATION_INVALID",
      "Authority recommendation lifecycle requires canonical recommendation identity and exact issued Journey revision."
    );
  }

  return Object.freeze({
    domain: AUTHORITY_RECOMMENDATION_DOMAIN,
    schema: AUTHORITY_RECOMMENDATION_SCHEMA,
    recommendationId,
    fingerprint,
    projectId,
    issuedAgainstProgressionRevision: issuedRevision,
    target: Object.freeze({
      stageId: cleanString(reference?.target?.stageId) || null,
      taskId: cleanString(reference?.target?.taskId) || null,
    }),
    lifecycle: Object.freeze({
      current: reference?.lifecycle?.current === true,
      terminalReason: cleanString(reference?.lifecycle?.terminalReason) || null,
      operationId:
        cleanString(reference?.lifecycle?.consumedByOperationId) ||
        cleanString(reference?.lifecycle?.invalidatedByOperationId) ||
        null,
      creatorActId: cleanString(reference?.lifecycle?.consumedByCreatorActId) || null,
      terminalProgressionRevision:
        safeRevision(reference?.lifecycle?.consumedAtProgressionRevision) ??
        safeRevision(reference?.lifecycle?.invalidatedAtProgressionRevision),
      consumedWithoutMovement: reference?.lifecycle?.consumedWithoutMovement === true,
    }),
  });
}

function findAuthorityRecommendation(records, recommendationId) {
  const rid = cleanString(recommendationId);
  return (Array.isArray(records) ? records : []).find((record) => cleanString(record?.recommendationId) === rid) || null;
}

function upsertAuthorityRecommendation(records, nextRecord) {
  const list = Array.isArray(records) ? cloneValue(records) : [];
  const rid = cleanString(nextRecord?.recommendationId);
  if (!rid) fail("JOURNEY_AUTHORITY_RECOMMENDATION_ID_REQUIRED", "Authority recommendation upsert requires recommendationId.");
  const index = list.findIndex((record) => cleanString(record?.recommendationId) === rid);
  if (index >= 0) list[index] = cloneValue(nextRecord);
  else list.push(cloneValue(nextRecord));
  return list;
}

function consumeAuthorityRecommendation(records, {
  recommendationId,
  fingerprint = null,
  expectedProgressionRevision,
  terminalProgressionRevision,
  operationId,
  creatorActId = null,
  withoutMovement = false,
} = {}) {
  const rid = cleanString(recommendationId);
  const expected = safeRevision(expectedProgressionRevision);
  const terminalRevision = safeRevision(terminalProgressionRevision);
  if (!rid || expected === null || terminalRevision === null) {
    fail("JOURNEY_AUTHORITY_RECOMMENDATION_CONSUME_INVALID", "Recommendation consumption requires exact identity and Journey revision lineage.");
  }
  const current = findAuthorityRecommendation(records, rid);
  if (!current) fail("JOURNEY_AUTHORITY_RECOMMENDATION_NOT_FOUND", "Authority recommendation record was not found.");
  if (fingerprint && cleanString(current.fingerprint) !== cleanString(fingerprint)) {
    fail("JOURNEY_AUTHORITY_RECOMMENDATION_IDENTITY_CONFLICT", "Recommendation fingerprint does not match authority lifecycle reality.");
  }
  if (safeRevision(current.issuedAgainstProgressionRevision) !== expected) {
    fail("JOURNEY_AUTHORITY_RECOMMENDATION_STALE", "Recommendation was issued against another Journey revision.");
  }
  if (current.lifecycle?.current !== true) {
    if (current.lifecycle?.terminalReason === "consumed" && cleanString(current.lifecycle?.operationId) === cleanString(operationId)) {
      return Object.freeze({ records: cloneValue(records), status: "already-consumed", record: cloneValue(current) });
    }
    fail("JOURNEY_AUTHORITY_RECOMMENDATION_NOT_CURRENT", "Recommendation is no longer current.", {
      terminalReason: current.lifecycle?.terminalReason || null,
    });
  }

  const next = cloneValue(current);
  next.lifecycle = {
    current: false,
    terminalReason: "consumed",
    operationId: cleanString(operationId) || null,
    creatorActId: cleanString(creatorActId) || null,
    terminalProgressionRevision: terminalRevision,
    consumedWithoutMovement: withoutMovement === true,
  };
  return Object.freeze({
    records: upsertAuthorityRecommendation(records, next),
    status: "consumed",
    record: cloneValue(next),
  });
}

function invalidateAuthorityRecommendations(records, {
  projectId,
  issuedAgainstProgressionRevision,
  terminalProgressionRevision,
  operationId,
  exceptRecommendationId = null,
} = {}) {
  const pid = cleanString(projectId);
  const issuedRevision = safeRevision(issuedAgainstProgressionRevision);
  const terminalRevision = safeRevision(terminalProgressionRevision);
  const exceptId = cleanString(exceptRecommendationId);
  if (!pid || issuedRevision === null || terminalRevision === null) {
    fail("JOURNEY_AUTHORITY_RECOMMENDATION_INVALIDATION_INVALID", "Recommendation invalidation requires exact project and Journey revision lineage.");
  }

  const next = (Array.isArray(records) ? records : []).map((record) => {
    if (
      cleanString(record?.projectId) !== pid ||
      record?.lifecycle?.current !== true ||
      safeRevision(record?.issuedAgainstProgressionRevision) !== issuedRevision ||
      (exceptId && cleanString(record?.recommendationId) === exceptId)
    ) {
      return cloneValue(record);
    }
    return {
      ...cloneValue(record),
      lifecycle: {
        current: false,
        terminalReason: "invalidated-by-progression",
        operationId: cleanString(operationId) || null,
        creatorActId: null,
        terminalProgressionRevision: terminalRevision,
        consumedWithoutMovement: false,
      },
    };
  });
  return Object.freeze(next);
}

export {
  JOURNEY_AUTHORITY_RECOMMENDATION_LIFECYCLE_VERSION,
  AUTHORITY_RECOMMENDATION_DOMAIN,
  AUTHORITY_RECOMMENDATION_SCHEMA,
  createAuthorityRecommendationRecord,
  findAuthorityRecommendation,
  upsertAuthorityRecommendation,
  consumeAuthorityRecommendation,
  invalidateAuthorityRecommendations,
};

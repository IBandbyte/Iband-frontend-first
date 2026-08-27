import { inspectAuthorityRecord } from "./JourneyDurableAuthorityStore.js";
import { inspectLineageRecord } from "./JourneyAuthoritySovereigntyLineage.js";

const JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_VERSION = "1.0.0";
const JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_DOMAIN = "iband.movie-mentor.journey-authority-recovery-envelope";
const JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_SCHEMA = 1;

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cloneValue(value) {
  if (value === undefined) return undefined;
  try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
}

function safeInteger(value) {
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

function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

function fingerprint(value) {
  const text = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function fail(code, message, extras = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, extras);
  throw error;
}

function sameProjectIdentity(left, right) {
  return cleanString(left?.projectId) === cleanString(right?.projectId) &&
    (left?.identityDomain || null) === (right?.identityDomain || null) &&
    (left?.identitySchema ?? null) === (right?.identitySchema ?? null) &&
    (left?.identityIssuance || null) === (right?.identityIssuance || null) &&
    Boolean(left?.legacy) === Boolean(right?.legacy);
}

function authoritySnapshotFingerprint(authorityRecord) {
  return fingerprint(authorityRecord);
}

function recoveryEnvelopeFingerprintPayload(envelope) {
  return {
    domain: envelope.domain,
    schema: envelope.schema,
    lineageId: envelope.lineageId,
    project: cloneValue(envelope.project),
    authorityGeneration: envelope.authorityGeneration,
    progressionRevision: envelope.progressionRevision,
    journeyFingerprint: envelope.journeyFingerprint,
    authoritySnapshotFingerprint: envelope.authoritySnapshotFingerprint,
    authorityRecord: cloneValue(envelope.authorityRecord),
  };
}

function inspectJourneyAuthorityRecoveryEnvelope(envelope, { project = null, lineageRecord = null } = {}) {
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) {
    return Object.freeze({ valid: false, status: "malformed", reason: "record-not-object" });
  }
  if (envelope.domain !== JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_DOMAIN || envelope.schema !== JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_SCHEMA) {
    return Object.freeze({ valid: false, status: "malformed", reason: "domain-or-schema-invalid" });
  }
  const lineageId = cleanString(envelope.lineageId);
  const authorityGeneration = safeInteger(envelope.authorityGeneration);
  const progressionRevision = safeInteger(envelope.progressionRevision);
  const journeyFingerprint = cleanString(envelope.journeyFingerprint);
  const snapshotFingerprint = cleanString(envelope.authoritySnapshotFingerprint);
  const envelopeFingerprint = cleanString(envelope.envelopeFingerprint);
  if (!lineageId) return Object.freeze({ valid: false, status: "malformed", reason: "lineage-id-missing" });
  if (authorityGeneration === null) return Object.freeze({ valid: false, status: "malformed", reason: "generation-invalid" });
  if (progressionRevision === null) return Object.freeze({ valid: false, status: "malformed", reason: "progression-revision-invalid" });
  if (!journeyFingerprint || !snapshotFingerprint || !envelopeFingerprint) {
    return Object.freeze({ valid: false, status: "malformed", reason: "fingerprint-missing" });
  }
  if (!Object.prototype.hasOwnProperty.call(envelope, "authorityRecord")) {
    return Object.freeze({ valid: false, status: "malformed", reason: "authority-record-missing" });
  }
  if (!Object.prototype.hasOwnProperty.call(envelope.authorityRecord || {}, "recommendations")) {
    return Object.freeze({ valid: false, status: "malformed", reason: "recommendation-lifecycle-missing" });
  }
  if (!Object.prototype.hasOwnProperty.call(envelope.authorityRecord || {}, "projection")) {
    return Object.freeze({ valid: false, status: "malformed", reason: "creator-truth-projection-missing" });
  }

  const authorityInspection = inspectAuthorityRecord(envelope.authorityRecord, { project });
  if (!authorityInspection.valid) {
    return Object.freeze({ valid: false, status: authorityInspection.status, reason: `authority-${authorityInspection.reason}` });
  }
  if (authorityInspection.generation !== authorityGeneration || authorityInspection.progressionRevision !== progressionRevision) {
    return Object.freeze({ valid: false, status: "malformed", reason: "authority-coordinate-mismatch" });
  }
  if (authorityInspection.journeyFingerprint !== journeyFingerprint) {
    return Object.freeze({ valid: false, status: "malformed", reason: "journey-fingerprint-mismatch" });
  }
  if (authoritySnapshotFingerprint(envelope.authorityRecord) !== snapshotFingerprint) {
    return Object.freeze({ valid: false, status: "tampered", reason: "authority-snapshot-fingerprint-mismatch" });
  }
  if (fingerprint(recoveryEnvelopeFingerprintPayload(envelope)) !== envelopeFingerprint) {
    return Object.freeze({ valid: false, status: "tampered", reason: "envelope-fingerprint-mismatch" });
  }

  if (lineageRecord) {
    const lineageInspection = inspectLineageRecord(lineageRecord, { project });
    if (!lineageInspection.valid) {
      return Object.freeze({ valid: false, status: "lineage-invalid", reason: lineageInspection.reason });
    }
    if (lineageInspection.phase !== "established") {
      return Object.freeze({ valid: false, status: "lineage-invalid", reason: "lineage-not-established" });
    }
    if (lineageInspection.lineageId !== lineageId) {
      return Object.freeze({ valid: false, status: "lineage-conflict", reason: "lineage-id-conflict" });
    }
    if (!sameProjectIdentity(lineageRecord.project, envelope.project)) {
      return Object.freeze({ valid: false, status: "identity-conflict", reason: "project-identity-conflict" });
    }
    if (authorityGeneration < lineageInspection.highestKnownGeneration || progressionRevision < lineageInspection.highestKnownProgressionRevision) {
      return Object.freeze({ valid: false, status: "rollback", reason: "below-lineage-floor" });
    }
    if (authorityGeneration === lineageInspection.highestKnownGeneration &&
        progressionRevision === lineageInspection.highestKnownProgressionRevision &&
        journeyFingerprint !== lineageInspection.lastAuthorityJourneyFingerprint) {
      return Object.freeze({ valid: false, status: "lineage-conflict", reason: "lineage-fingerprint-conflict" });
    }
  }

  return Object.freeze({
    valid: true,
    status: "eligible-evidence",
    lineageId,
    authorityGeneration,
    progressionRevision,
    journeyFingerprint,
    authoritySnapshotFingerprint: snapshotFingerprint,
    envelopeFingerprint,
  });
}

function mintJourneyAuthorityRecoveryEnvelope({ project, authorityRecord, lineageRecord } = {}) {
  const authorityInspection = inspectAuthorityRecord(authorityRecord, { project });
  if (!authorityInspection.valid) {
    fail("JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_AUTHORITY_INVALID", "Recovery envelope requires a validated Journey Authority record.", { reason: authorityInspection.reason });
  }
  const lineageInspection = inspectLineageRecord(lineageRecord, { project });
  if (!lineageInspection.valid || lineageInspection.phase !== "established") {
    fail("JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_LINEAGE_INVALID", "Recovery envelope requires established sovereignty lineage.", { reason: lineageInspection.reason || "lineage-not-established" });
  }
  if (!sameProjectIdentity(authorityRecord.project, lineageRecord.project)) {
    fail("JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_IDENTITY_CONFLICT", "Authority and sovereignty lineage do not describe the same project identity.");
  }
  if (authorityInspection.generation !== lineageInspection.highestKnownGeneration ||
      authorityInspection.progressionRevision !== lineageInspection.highestKnownProgressionRevision ||
      authorityInspection.journeyFingerprint !== lineageInspection.lastAuthorityJourneyFingerprint) {
    fail(
      "JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_NOT_CHECKPOINT_ELIGIBLE",
      "Recovery envelope may only be minted from authority exactly certified by the established lineage floor.",
      {
        authorityGeneration: authorityInspection.generation,
        lineageGeneration: lineageInspection.highestKnownGeneration,
        authorityProgressionRevision: authorityInspection.progressionRevision,
        lineageProgressionRevision: lineageInspection.highestKnownProgressionRevision,
      }
    );
  }
  if (!Object.prototype.hasOwnProperty.call(authorityRecord, "recommendations") || !Array.isArray(authorityRecord.recommendations)) {
    fail("JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_LIFECYCLE_REQUIRED", "Recovery envelope requires recommendation lifecycle state from Journey Authority.");
  }
  if (!Object.prototype.hasOwnProperty.call(authorityRecord, "projection") || !authorityRecord.projection || typeof authorityRecord.projection !== "object") {
    fail("JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_PROJECTION_REQUIRED", "Recovery envelope requires creator-truth projection state from Journey Authority.");
  }

  const candidate = {
    domain: JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_DOMAIN,
    schema: JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_SCHEMA,
    lineageId: lineageInspection.lineageId,
    project: cloneValue(authorityRecord.project),
    authorityGeneration: authorityInspection.generation,
    progressionRevision: authorityInspection.progressionRevision,
    journeyFingerprint: authorityInspection.journeyFingerprint,
    authoritySnapshotFingerprint: authoritySnapshotFingerprint(authorityRecord),
    authorityRecord: cloneValue(authorityRecord),
  };
  candidate.envelopeFingerprint = fingerprint(recoveryEnvelopeFingerprintPayload(candidate));
  const inspection = inspectJourneyAuthorityRecoveryEnvelope(candidate, { project, lineageRecord });
  if (!inspection.valid) {
    fail("JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_MINT_FAILED", "Minted recovery envelope failed self-verification.", { reason: inspection.reason });
  }
  return Object.freeze(cloneValue(candidate));
}

function compareJourneyAuthorityRecoveryEnvelopes(currentEnvelope, candidateEnvelope, { project = null, lineageRecord = null } = {}) {
  const current = inspectJourneyAuthorityRecoveryEnvelope(currentEnvelope, { project, lineageRecord });
  const candidate = inspectJourneyAuthorityRecoveryEnvelope(candidateEnvelope, { project, lineageRecord });
  if (!current.valid) fail("JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_CURRENT_INVALID", "Current recovery envelope is invalid.", { reason: current.reason });
  if (!candidate.valid) fail("JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_CANDIDATE_INVALID", "Candidate recovery envelope is invalid.", { reason: candidate.reason });
  if (current.lineageId !== candidate.lineageId) {
    fail("JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_LINEAGE_CONFLICT", "Recovery envelopes belong to different sovereignty lineages.");
  }
  if (candidate.authorityGeneration < current.authorityGeneration || candidate.progressionRevision < current.progressionRevision) {
    return Object.freeze({ status: "rollback-rejected", current, candidate });
  }
  if (candidate.authorityGeneration === current.authorityGeneration && candidate.progressionRevision === current.progressionRevision) {
    return Object.freeze({
      status: candidate.envelopeFingerprint === current.envelopeFingerprint ? "idempotent" : "same-coordinate-conflict",
      current,
      candidate,
    });
  }
  return Object.freeze({ status: "advance-eligible", current, candidate });
}

export {
  JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_VERSION,
  JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_DOMAIN,
  JOURNEY_AUTHORITY_RECOVERY_ENVELOPE_SCHEMA,
  authoritySnapshotFingerprint,
  inspectJourneyAuthorityRecoveryEnvelope,
  mintJourneyAuthorityRecoveryEnvelope,
  compareJourneyAuthorityRecoveryEnvelopes,
};

export default mintJourneyAuthorityRecoveryEnvelope;

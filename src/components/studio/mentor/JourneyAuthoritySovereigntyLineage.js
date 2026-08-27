const JOURNEY_AUTHORITY_SOVEREIGNTY_LINEAGE_VERSION = "1.0.0";
const JOURNEY_AUTHORITY_SOVEREIGNTY_LINEAGE_DOMAIN = "iband.movie-mentor.journey-authority-lineage";
const JOURNEY_AUTHORITY_SOVEREIGNTY_LINEAGE_SCHEMA = 1;
const JOURNEY_AUTHORITY_SOVEREIGNTY_LINEAGE_STORAGE_PREFIX = "iband:movie-mentor:journey-authority-lineage";

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

function fail(code, message, extras = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, extras);
  throw error;
}

function normaliseProjectIdentity(project) {
  const projectId = cleanString(project?.id || project?.projectId);
  if (!projectId) fail("JOURNEY_AUTHORITY_LINEAGE_PROJECT_REQUIRED", "Journey authority lineage requires canonical project identity.");
  const identity = cloneValue(project?.identity || null);
  return Object.freeze({
    projectId,
    identityDomain: cleanString(identity?.domain) || null,
    identitySchema: safeInteger(identity?.schema),
    identityIssuance: cleanString(identity?.issuance) || null,
    legacy: identity?.legacy === true || cleanString(identity?.issuance) === "legacy-preserved",
  });
}

function sameProjectIdentity(left, right) {
  return cleanString(left?.projectId) === cleanString(right?.projectId) &&
    (left?.identityDomain || null) === (right?.identityDomain || null) &&
    (left?.identitySchema ?? null) === (right?.identitySchema ?? null) &&
    (left?.identityIssuance || null) === (right?.identityIssuance || null) &&
    Boolean(left?.legacy) === Boolean(right?.legacy);
}

function sovereigntyLineageStorageKey(projectId) {
  const pid = cleanString(projectId);
  if (!pid) fail("JOURNEY_AUTHORITY_LINEAGE_PROJECT_REQUIRED", "Journey authority lineage storage requires a projectId.");
  return `${JOURNEY_AUTHORITY_SOVEREIGNTY_LINEAGE_STORAGE_PREFIX}:${pid}`;
}

function createLineageId(randomUUID) {
  const uuid = typeof randomUUID === "function" ? cleanString(randomUUID()) : "";
  if (uuid) return `journey-authority-lineage:${uuid}`;
  return `journey-authority-lineage:${Date.now()}:${Math.random().toString(36).slice(2, 12)}`;
}

function inspectLineageRecord(record, { project = null } = {}) {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return Object.freeze({ valid: false, status: "malformed", reason: "record-not-object" });
  }
  if (record.domain !== JOURNEY_AUTHORITY_SOVEREIGNTY_LINEAGE_DOMAIN || record.schema !== JOURNEY_AUTHORITY_SOVEREIGNTY_LINEAGE_SCHEMA) {
    return Object.freeze({ valid: false, status: "malformed", reason: "domain-or-schema-invalid" });
  }
  const lineageId = cleanString(record.lineageId);
  const phase = cleanString(record.phase);
  const highestKnownGeneration = safeInteger(record.highestKnownGeneration);
  const highestKnownProgressionRevision = safeInteger(record.highestKnownProgressionRevision);
  const birthJourneyFingerprint = cleanString(record.birthJourneyFingerprint);
  const lastAuthorityJourneyFingerprint = cleanString(record.lastAuthorityJourneyFingerprint);
  if (!lineageId) return Object.freeze({ valid: false, status: "malformed", reason: "lineage-id-missing" });
  if (!["establishing", "established"].includes(phase)) return Object.freeze({ valid: false, status: "malformed", reason: "phase-invalid" });
  if (highestKnownGeneration === null) return Object.freeze({ valid: false, status: "malformed", reason: "generation-floor-invalid" });
  if (highestKnownProgressionRevision === null) return Object.freeze({ valid: false, status: "malformed", reason: "progression-floor-invalid" });
  if (!birthJourneyFingerprint) return Object.freeze({ valid: false, status: "malformed", reason: "birth-fingerprint-missing" });
  if (!lastAuthorityJourneyFingerprint) return Object.freeze({ valid: false, status: "malformed", reason: "authority-fingerprint-missing" });
  const recordIdentity = record.project || {};
  if (!cleanString(recordIdentity.projectId)) return Object.freeze({ valid: false, status: "malformed", reason: "project-identity-missing" });
  if (project) {
    let expectedIdentity;
    try { expectedIdentity = normaliseProjectIdentity(project); } catch {
      return Object.freeze({ valid: false, status: "identity-conflict", reason: "expected-project-invalid" });
    }
    if (!sameProjectIdentity(recordIdentity, expectedIdentity)) {
      return Object.freeze({ valid: false, status: "identity-conflict", reason: "project-identity-conflict" });
    }
  }
  return Object.freeze({
    valid: true,
    status: phase,
    lineageId,
    phase,
    highestKnownGeneration,
    highestKnownProgressionRevision,
    birthJourneyFingerprint,
    lastAuthorityJourneyFingerprint,
  });
}

function createJourneyAuthoritySovereigntyLineage({
  storage,
  randomUUID = globalThis?.crypto?.randomUUID?.bind?.(globalThis.crypto) || null,
} = {}) {
  if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function") {
    fail("JOURNEY_AUTHORITY_LINEAGE_STORAGE_REQUIRED", "Journey authority lineage requires getItem/setItem storage.");
  }

  function parse(raw, project) {
    if (raw === null || raw === undefined || raw === "") return null;
    let record;
    try { record = JSON.parse(raw); } catch {
      fail("JOURNEY_AUTHORITY_LINEAGE_RECOVERY_REQUIRED", "Persisted Journey authority lineage is not valid JSON.", { reason: "json-invalid" });
    }
    const inspection = inspectLineageRecord(record, { project });
    if (!inspection.valid) {
      fail(
        inspection.status === "identity-conflict" ? "JOURNEY_AUTHORITY_LINEAGE_IDENTITY_CONFLICT" : "JOURNEY_AUTHORITY_LINEAGE_RECOVERY_REQUIRED",
        inspection.status === "identity-conflict" ? "Journey authority lineage belongs to a different project identity." : "Persisted Journey authority lineage is malformed.",
        { reason: inspection.reason }
      );
    }
    return { record: cloneValue(record), inspection };
  }

  function writeVerified(project, candidate) {
    const key = sovereigntyLineageStorageKey(project?.id || project?.projectId);
    const serialized = JSON.stringify(candidate);
    storage.setItem(key, serialized);
    const reread = parse(storage.getItem(key), project);
    if (!reread || JSON.stringify(reread.record) !== serialized) {
      fail("JOURNEY_AUTHORITY_LINEAGE_PERSISTENCE_VERIFICATION_FAILED", "Journey authority lineage write could not be verified.");
    }
    return cloneValue(reread.record);
  }

  function read(projectId, { project = null } = {}) {
    const parsed = parse(storage.getItem(sovereigntyLineageStorageKey(projectId)), project);
    return parsed ? cloneValue(parsed.record) : null;
  }

  function beginBirthUnderLock({ project, birthJourneyFingerprint, birthProgressionRevision = 0 } = {}) {
    const identity = normaliseProjectIdentity(project);
    const fingerprint = cleanString(birthJourneyFingerprint);
    const revision = safeInteger(birthProgressionRevision);
    if (!fingerprint || revision === null) {
      fail("JOURNEY_AUTHORITY_LINEAGE_BIRTH_INVALID", "Journey authority lineage birth requires exact Journey fingerprint and progression revision.");
    }
    const existing = read(identity.projectId, { project });
    if (existing) {
      const inspection = inspectLineageRecord(existing, { project });
      if (inspection.phase === "established") {
        fail("JOURNEY_AUTHORITY_RECOVERY_REQUIRED", "Journey authority lineage proves sovereignty already existed; silent bootstrap is forbidden.", { reason: "authority-missing-after-established-lineage" });
      }
      if (inspection.birthJourneyFingerprint !== fingerprint || inspection.highestKnownProgressionRevision !== revision) {
        fail("JOURNEY_AUTHORITY_RECOVERY_REQUIRED", "Interrupted Journey authority birth does not match the original sovereignty source.", { reason: "interrupted-birth-source-mismatch" });
      }
      return Object.freeze({ status: "birth-resumed", record: cloneValue(existing) });
    }

    const timestamp = new Date().toISOString();
    const candidate = {
      domain: JOURNEY_AUTHORITY_SOVEREIGNTY_LINEAGE_DOMAIN,
      schema: JOURNEY_AUTHORITY_SOVEREIGNTY_LINEAGE_SCHEMA,
      lineageId: createLineageId(randomUUID),
      phase: "establishing",
      project: cloneValue(identity),
      birthJourneyFingerprint: fingerprint,
      highestKnownGeneration: 0,
      highestKnownProgressionRevision: revision,
      lastAuthorityJourneyFingerprint: fingerprint,
      establishedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    return Object.freeze({ status: "birth-started", record: writeVerified(project, candidate) });
  }

  function observeAuthorityUnderLock({ project, authorityRecord, allowAdoption = false } = {}) {
    const identity = normaliseProjectIdentity(project);
    const generation = safeInteger(authorityRecord?.authority?.generation);
    const progressionRevision = safeInteger(authorityRecord?.journey?.progression?.revision ?? 0);
    const journeyFingerprint = cleanString(authorityRecord?.journeyFingerprint);
    if (generation === null || progressionRevision === null || !journeyFingerprint) {
      fail("JOURNEY_AUTHORITY_LINEAGE_AUTHORITY_INVALID", "Journey authority lineage observation requires a validated authority record.");
    }

    let current = read(identity.projectId, { project });
    if (!current) {
      if (!allowAdoption) {
        fail("JOURNEY_AUTHORITY_LINEAGE_ADOPTION_REQUIRED", "Valid Journey authority has no sovereignty lineage and requires explicit adoption.");
      }
      const timestamp = new Date().toISOString();
      current = writeVerified(project, {
        domain: JOURNEY_AUTHORITY_SOVEREIGNTY_LINEAGE_DOMAIN,
        schema: JOURNEY_AUTHORITY_SOVEREIGNTY_LINEAGE_SCHEMA,
        lineageId: createLineageId(randomUUID),
        phase: "established",
        project: cloneValue(identity),
        birthJourneyFingerprint: journeyFingerprint,
        highestKnownGeneration: generation,
        highestKnownProgressionRevision: progressionRevision,
        lastAuthorityJourneyFingerprint: journeyFingerprint,
        establishedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return Object.freeze({ status: "authority-adopted", record: cloneValue(current) });
    }

    const inspection = inspectLineageRecord(current, { project });
    if (generation < inspection.highestKnownGeneration) {
      fail("JOURNEY_AUTHORITY_ROLLBACK_DETECTED", "Journey authority generation is below the sovereignty lineage floor.", {
        authorityGeneration: generation,
        highestKnownGeneration: inspection.highestKnownGeneration,
      });
    }
    if (progressionRevision < inspection.highestKnownProgressionRevision) {
      fail("JOURNEY_AUTHORITY_ROLLBACK_DETECTED", "Journey progression revision is below the sovereignty lineage floor.", {
        authorityProgressionRevision: progressionRevision,
        highestKnownProgressionRevision: inspection.highestKnownProgressionRevision,
      });
    }

    const changed = inspection.phase !== "established" ||
      generation > inspection.highestKnownGeneration ||
      progressionRevision > inspection.highestKnownProgressionRevision ||
      inspection.lastAuthorityJourneyFingerprint !== journeyFingerprint;
    if (!changed) return Object.freeze({ status: "lineage-current", record: cloneValue(current) });

    const next = {
      ...cloneValue(current),
      phase: "established",
      highestKnownGeneration: Math.max(inspection.highestKnownGeneration, generation),
      highestKnownProgressionRevision: Math.max(inspection.highestKnownProgressionRevision, progressionRevision),
      lastAuthorityJourneyFingerprint: journeyFingerprint,
      establishedAt: current.establishedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return Object.freeze({ status: inspection.phase === "establishing" ? "birth-established" : "lineage-advanced", record: writeVerified(project, next) });
  }

  function classifyAbsence({ project } = {}) {
    const identity = normaliseProjectIdentity(project);
    const lineage = read(identity.projectId, { project });
    if (!lineage) return Object.freeze({ status: "virgin", bootstrapAllowed: true, lineage: null });
    const inspection = inspectLineageRecord(lineage, { project });
    return Object.freeze({
      status: inspection.phase === "establishing" ? "interrupted-birth" : "authority-destroyed-or-missing",
      bootstrapAllowed: inspection.phase === "establishing",
      lineage: cloneValue(lineage),
    });
  }

  return Object.freeze({
    version: JOURNEY_AUTHORITY_SOVEREIGNTY_LINEAGE_VERSION,
    domain: JOURNEY_AUTHORITY_SOVEREIGNTY_LINEAGE_DOMAIN,
    schema: JOURNEY_AUTHORITY_SOVEREIGNTY_LINEAGE_SCHEMA,
    storageKey: sovereigntyLineageStorageKey,
    inspect: inspectLineageRecord,
    read,
    classifyAbsence,
    beginBirthUnderLock,
    observeAuthorityUnderLock,
  });
}

export {
  JOURNEY_AUTHORITY_SOVEREIGNTY_LINEAGE_VERSION,
  JOURNEY_AUTHORITY_SOVEREIGNTY_LINEAGE_DOMAIN,
  JOURNEY_AUTHORITY_SOVEREIGNTY_LINEAGE_SCHEMA,
  JOURNEY_AUTHORITY_SOVEREIGNTY_LINEAGE_STORAGE_PREFIX,
  sovereigntyLineageStorageKey,
  inspectLineageRecord,
  createJourneyAuthoritySovereigntyLineage,
};

export default createJourneyAuthoritySovereigntyLineage;

import { withJourneyProgressionProjectLock } from "./JourneyProgressionProjectLock.js";
import createJourneyAuthoritySovereigntyLineage from "./JourneyAuthoritySovereigntyLineage.js";

const JOURNEY_DURABLE_AUTHORITY_STORE_VERSION = "1.2.0";
const JOURNEY_AUTHORITY_DOMAIN = "iband.movie-mentor.journey-authority";
const JOURNEY_AUTHORITY_SCHEMA = 1;
const JOURNEY_AUTHORITY_STORAGE_PREFIX = "iband:movie-mentor:journey-authority";

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

function effectiveProgressionRevision(projectJourney) {
  const revision = safeInteger(projectJourney?.progression?.revision);
  if (revision !== null) return revision;
  if (projectJourney?.progression === undefined || projectJourney?.progression === null) return 0;
  return null;
}

function authorityStorageKey(projectId) {
  const pid = cleanString(projectId);
  if (!pid) fail("JOURNEY_AUTHORITY_PROJECT_REQUIRED", "Journey authority storage requires a projectId.");
  return `${JOURNEY_AUTHORITY_STORAGE_PREFIX}:${pid}`;
}

function createDefaultStorage() {
  if (typeof globalThis?.localStorage !== "undefined" && globalThis.localStorage) return globalThis.localStorage;
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

function normaliseProjectIdentity(project) {
  const projectId = cleanString(project?.id || project?.projectId);
  if (!projectId) fail("JOURNEY_AUTHORITY_PROJECT_REQUIRED", "Journey authority requires canonical project identity.");
  const identity = cloneValue(project?.identity || null);
  const identityDomain = cleanString(identity?.domain) || null;
  const identitySchema = safeInteger(identity?.schema);
  const identityIssuance = cleanString(identity?.issuance) || null;
  return Object.freeze({
    projectId,
    identityDomain,
    identitySchema,
    identityIssuance,
    legacy: identity?.legacy === true || identityIssuance === "legacy-preserved",
  });
}

function sameProjectIdentity(left, right) {
  return cleanString(left?.projectId) === cleanString(right?.projectId) &&
    (left?.identityDomain || null) === (right?.identityDomain || null) &&
    (left?.identitySchema ?? null) === (right?.identitySchema ?? null) &&
    (left?.identityIssuance || null) === (right?.identityIssuance || null) &&
    Boolean(left?.legacy) === Boolean(right?.legacy);
}

function validateJourney(projectJourney, code = "JOURNEY_AUTHORITY_JOURNEY_INVALID") {
  if (!projectJourney || typeof projectJourney !== "object" || Array.isArray(projectJourney)) {
    fail(code, "Journey authority requires a canonical Journey object.");
  }
  const revision = effectiveProgressionRevision(projectJourney);
  if (revision === null) fail(code, "Journey progression metadata is malformed.");
  return Object.freeze({ journey: cloneValue(projectJourney), progressionRevision: revision, fingerprint: fingerprint(projectJourney) });
}

function buildAuthorityRecord({ project, projectJourney, bootstrapSource, generation = 0, recommendations = [], projection = null } = {}) {
  const identity = normaliseProjectIdentity(project);
  const journey = validateJourney(projectJourney, "JOURNEY_AUTHORITY_BOOTSTRAP_SOURCE_INVALID");
  const source = cleanString(bootstrapSource);
  if (!source || !["legacy-creator-memory", "native"].includes(source)) {
    fail("JOURNEY_AUTHORITY_BOOTSTRAP_SOURCE_INVALID", "Journey authority bootstrap source is invalid.");
  }
  const timestamp = new Date().toISOString();
  return {
    domain: JOURNEY_AUTHORITY_DOMAIN,
    schema: JOURNEY_AUTHORITY_SCHEMA,
    project: cloneValue(identity),
    authority: { generation: safeInteger(generation) ?? 0, createdAt: timestamp, updatedAt: timestamp },
    bootstrap: {
      status: source === "legacy-creator-memory" ? "bootstrapped-from-legacy" : "created-native",
      source,
      sourceJourneyRevision: journey.progressionRevision,
      bootstrappedAt: timestamp,
    },
    journey: journey.journey,
    journeyFingerprint: journey.fingerprint,
    recommendations: Array.isArray(recommendations) ? cloneValue(recommendations) : [],
    projection: projection ? cloneValue(projection) : { lastProjectedAuthorityGeneration: null, projectedAt: null },
  };
}

function inspectAuthorityRecord(record, { project = null } = {}) {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return Object.freeze({ valid: false, status: "malformed", reason: "record-not-object" });
  }
  if (record.domain !== JOURNEY_AUTHORITY_DOMAIN || record.schema !== JOURNEY_AUTHORITY_SCHEMA) {
    return Object.freeze({ valid: false, status: "malformed", reason: "domain-or-schema-invalid" });
  }
  const generation = safeInteger(record?.authority?.generation);
  if (generation === null) return Object.freeze({ valid: false, status: "malformed", reason: "generation-invalid" });
  let journey;
  try { journey = validateJourney(record.journey); } catch { return Object.freeze({ valid: false, status: "malformed", reason: "journey-invalid" }); }
  if (cleanString(record.journeyFingerprint) !== journey.fingerprint) {
    return Object.freeze({ valid: false, status: "malformed", reason: "journey-fingerprint-invalid" });
  }
  const recordIdentity = record.project || {};
  if (!cleanString(recordIdentity.projectId)) return Object.freeze({ valid: false, status: "malformed", reason: "project-identity-missing" });
  if (project) {
    let expectedIdentity;
    try { expectedIdentity = normaliseProjectIdentity(project); } catch {
      return Object.freeze({ valid: false, status: "identity-conflict", reason: "expected-project-invalid" });
    }
    if (!sameProjectIdentity(recordIdentity, expectedIdentity)) {
      return Object.freeze({ valid: false, status: "identity-conflict", reason: "project-identity-conflict", expectedIdentity, recordIdentity: cloneValue(recordIdentity) });
    }
  }
  return Object.freeze({ valid: true, status: "healthy", generation, progressionRevision: journey.progressionRevision, journeyFingerprint: journey.fingerprint });
}

function parseAuthority(raw, project) {
  if (raw === null || raw === undefined || raw === "") return null;
  let record;
  try { record = JSON.parse(raw); } catch {
    fail("JOURNEY_AUTHORITY_RECOVERY_REQUIRED", "Persisted Journey authority record is not valid JSON.", { reason: "json-invalid" });
  }
  const inspection = inspectAuthorityRecord(record, { project });
  if (!inspection.valid) {
    fail(
      inspection.status === "identity-conflict" ? "JOURNEY_AUTHORITY_IDENTITY_CONFLICT" : "JOURNEY_AUTHORITY_RECOVERY_REQUIRED",
      inspection.status === "identity-conflict" ? "Persisted Journey authority belongs to a different project identity." : "Persisted Journey authority record is malformed.",
      { reason: inspection.reason }
    );
  }
  return { record: cloneValue(record), inspection };
}

function createJourneyDurableAuthorityStore({
  storage = createDefaultStorage(),
  locksApi = globalThis?.navigator?.locks || null,
  browserRuntime = typeof window !== "undefined" && typeof document !== "undefined",
} = {}) {
  if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function") {
    fail("JOURNEY_AUTHORITY_STORAGE_REQUIRED", "Journey authority store requires getItem/setItem storage.");
  }
  const sovereigntyLineage = createJourneyAuthoritySovereigntyLineage({ storage });

  function read(projectId, { project = null } = {}) {
    const parsed = parseAuthority(storage.getItem(authorityStorageKey(projectId)), project);
    if (!parsed) {
      if (project) {
        const absence = sovereigntyLineage.classifyAbsence({ project });
        if (absence.status === "authority-destroyed-or-missing") {
          fail(
            "JOURNEY_AUTHORITY_RECOVERY_REQUIRED",
            "Journey authority is missing but sovereignty lineage proves authority previously existed.",
            { reason: "authority-missing-after-established-lineage" }
          );
        }
      }
      return null;
    }

    const lineageRecord = sovereigntyLineage.read(projectId, { project });
    if (lineageRecord) {
      const generation = safeInteger(parsed.record?.authority?.generation);
      const progressionRevision = effectiveProgressionRevision(parsed.record?.journey);
      if (generation < lineageRecord.highestKnownGeneration || progressionRevision < lineageRecord.highestKnownProgressionRevision) {
        fail(
          "JOURNEY_AUTHORITY_ROLLBACK_DETECTED",
          "Journey authority is below the established sovereignty lineage floor.",
          {
            authorityGeneration: generation,
            highestKnownGeneration: lineageRecord.highestKnownGeneration,
            authorityProgressionRevision: progressionRevision,
            highestKnownProgressionRevision: lineageRecord.highestKnownProgressionRevision,
          }
        );
      }
    }
    return cloneValue(parsed.record);
  }

  function writeCandidate(key, candidate, { project } = {}) {
    const serialized = JSON.stringify(candidate);
    let writeError = null;
    try { storage.setItem(key, serialized); } catch (error) { writeError = error; }
    const reread = parseAuthority(storage.getItem(key), project);
    if (reread && stableStringify(reread.record) === stableStringify(candidate)) {
      return Object.freeze({ committed: true, acknowledgementLost: Boolean(writeError), record: cloneValue(reread.record) });
    }
    if (writeError) throw writeError;
    fail("JOURNEY_AUTHORITY_PERSISTENCE_VERIFICATION_FAILED", "Journey authority write could not be verified.");
  }

  function bootstrapUnderLock({ project, legacyJourney = null, nativeJourney = null, serialization = null } = {}) {
    const identity = normaliseProjectIdentity(project);
    const source = nativeJourney ? "native" : "legacy-creator-memory";
    const sourceJourney = nativeJourney || legacyJourney;
    const sourceJourneyInspection = validateJourney(sourceJourney, "JOURNEY_AUTHORITY_BOOTSTRAP_SOURCE_INVALID");
    const key = authorityStorageKey(identity.projectId);
    const existing = parseAuthority(storage.getItem(key), project);
    if (existing) {
      sovereigntyLineage.observeAuthorityUnderLock({ project, authorityRecord: existing.record, allowAdoption: true });
      return Object.freeze({
        status: "already-bootstrapped",
        record: cloneValue(existing.record),
        authorityGeneration: existing.inspection.generation,
        progressionRevision: existing.inspection.progressionRevision,
        serialization: cloneValue(serialization),
      });
    }
    sovereigntyLineage.beginBirthUnderLock({
      project,
      birthJourneyFingerprint: sourceJourneyInspection.fingerprint,
      birthProgressionRevision: sourceJourneyInspection.progressionRevision,
    });
    const candidate = buildAuthorityRecord({ project, projectJourney: sourceJourney, bootstrapSource: source, generation: 0 });
    const persisted = writeCandidate(key, candidate, { project });
    sovereigntyLineage.observeAuthorityUnderLock({ project, authorityRecord: persisted.record });
    return Object.freeze({
      status: persisted.acknowledgementLost ? "bootstrapped-after-ack-loss" : "bootstrapped",
      record: cloneValue(persisted.record),
      authorityGeneration: 0,
      progressionRevision: effectiveProgressionRevision(persisted.record.journey),
      serialization: cloneValue(serialization),
    });
  }

  function compareAndCommitUnderLock({
    project,
    expectedGeneration,
    expectedProgressionRevision = null,
    nextJourney,
    mutateRecord = null,
    serialization = null,
  } = {}) {
    const identity = normaliseProjectIdentity(project);
    const expectedGen = safeInteger(expectedGeneration);
    if (expectedGen === null) fail("JOURNEY_AUTHORITY_EXPECTED_GENERATION_INVALID", "Journey authority commit requires exact expected generation.");
    const nextJourneyInspection = validateJourney(nextJourney);
    const key = authorityStorageKey(identity.projectId);
    const current = parseAuthority(storage.getItem(key), project);
    if (!current) fail("JOURNEY_AUTHORITY_NOT_INITIALISED", "Journey authority must be bootstrapped before commit.");
    sovereigntyLineage.observeAuthorityUnderLock({ project, authorityRecord: current.record, allowAdoption: true });
    if (current.inspection.generation !== expectedGen) {
      fail("JOURNEY_AUTHORITY_GENERATION_STALE", "Journey authority generation changed before commit.", {
        expectedGeneration: expectedGen,
        currentGeneration: current.inspection.generation,
      });
    }
    if (expectedProgressionRevision !== null && expectedProgressionRevision !== undefined) {
      const expectedRevision = safeInteger(expectedProgressionRevision);
      if (expectedRevision === null) fail("JOURNEY_AUTHORITY_EXPECTED_REVISION_INVALID", "Journey authority commit requires valid expected Journey revision.");
      if (current.inspection.progressionRevision !== expectedRevision) {
        fail("JOURNEY_AUTHORITY_PROGRESSION_STALE", "Journey authority progression revision changed before commit.", {
          expectedProgressionRevision: expectedRevision,
          currentProgressionRevision: current.inspection.progressionRevision,
        });
      }
    }

    let candidate = cloneValue(current.record);
    candidate.journey = cloneValue(nextJourneyInspection.journey);
    candidate.journeyFingerprint = nextJourneyInspection.fingerprint;
    candidate.authority = { ...candidate.authority, generation: expectedGen + 1, updatedAt: new Date().toISOString() };
    if (typeof mutateRecord === "function") {
      const mutated = mutateRecord(cloneValue(candidate));
      if (!mutated || typeof mutated !== "object") fail("JOURNEY_AUTHORITY_MUTATION_INVALID", "Authority record mutation must return a record.");
      candidate = cloneValue(mutated);
    }

    if (!sameProjectIdentity(candidate.project, current.record.project)) fail("JOURNEY_AUTHORITY_IDENTITY_CONFLICT", "Authority mutation attempted to alter project identity.");
    if (candidate.authority?.generation !== expectedGen + 1) fail("JOURNEY_AUTHORITY_GENERATION_VIOLATION", "Authority mutation attempted to alter committed generation.");
    if (stableStringify(candidate.journey) !== stableStringify(nextJourneyInspection.journey) || candidate.journeyFingerprint !== nextJourneyInspection.fingerprint) {
      fail("JOURNEY_AUTHORITY_JOURNEY_MUTATION_VIOLATION", "Authority metadata mutation attempted to alter committed Journey reality.");
    }

    const persisted = writeCandidate(key, candidate, { project });
    sovereigntyLineage.observeAuthorityUnderLock({ project, authorityRecord: persisted.record });
    const inspection = inspectAuthorityRecord(persisted.record, { project });
    return Object.freeze({
      status: persisted.acknowledgementLost ? "committed-after-ack-loss" : "committed",
      record: cloneValue(persisted.record),
      authorityGeneration: inspection.generation,
      progressionRevision: inspection.progressionRevision,
      serialization: cloneValue(serialization),
    });
  }

  async function bootstrap(args = {}) {
    const identity = normaliseProjectIdentity(args.project);
    return withJourneyProgressionProjectLock({
      projectId: identity.projectId,
      locksApi,
      browserRuntime,
      callback: async (lockProof) => bootstrapUnderLock({ ...args, serialization: lockProof }),
    });
  }

  async function compareAndCommit(args = {}) {
    const identity = normaliseProjectIdentity(args.project);
    return withJourneyProgressionProjectLock({
      projectId: identity.projectId,
      locksApi,
      browserRuntime,
      callback: async (lockProof) => compareAndCommitUnderLock({ ...args, serialization: lockProof }),
    });
  }

  function compareProjection({ project, projectedJourney } = {}) {
    const identity = normaliseProjectIdentity(project);
    const authority = read(identity.projectId, { project });
    if (!authority) return Object.freeze({ status: "authority-absent", authoritativeJourney: null });
    const authorityJourney = validateJourney(authority.journey);
    let projection;
    try { projection = validateJourney(projectedJourney); } catch {
      return Object.freeze({ status: "projection-invalid", authoritativeJourney: cloneValue(authority.journey), authorityGeneration: authority.authority.generation });
    }
    if (authorityJourney.fingerprint === projection.fingerprint) {
      return Object.freeze({ status: "in-sync", authoritativeJourney: cloneValue(authority.journey), authorityGeneration: authority.authority.generation });
    }
    if (authorityJourney.progressionRevision === projection.progressionRevision) {
      return Object.freeze({ status: "split-brain-same-revision", authoritativeJourney: cloneValue(authority.journey), authorityGeneration: authority.authority.generation });
    }
    return Object.freeze({
      status: projection.progressionRevision < authorityJourney.progressionRevision ? "projection-stale" : "projection-ahead-untrusted",
      authoritativeJourney: cloneValue(authority.journey),
      authorityGeneration: authority.authority.generation,
    });
  }

  return Object.freeze({
    version: JOURNEY_DURABLE_AUTHORITY_STORE_VERSION,
    domain: JOURNEY_AUTHORITY_DOMAIN,
    schema: JOURNEY_AUTHORITY_SCHEMA,
    storageKey: authorityStorageKey,
    inspect: inspectAuthorityRecord,
    read,
    bootstrap,
    bootstrapUnderLock,
    compareAndCommit,
    compareAndCommitUnderLock,
    compareProjection,
    readSovereigntyLineage: (projectId, options = {}) => sovereigntyLineage.read(projectId, options),
    classifySovereigntyAbsence: (options = {}) => sovereigntyLineage.classifyAbsence(options),
  });
}

export {
  JOURNEY_DURABLE_AUTHORITY_STORE_VERSION,
  JOURNEY_AUTHORITY_DOMAIN,
  JOURNEY_AUTHORITY_SCHEMA,
  JOURNEY_AUTHORITY_STORAGE_PREFIX,
  authorityStorageKey,
  inspectAuthorityRecord,
  createJourneyDurableAuthorityStore,
};

export default createJourneyDurableAuthorityStore;

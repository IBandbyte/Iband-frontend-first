import createJourneyDurableAuthorityStore from "./JourneyDurableAuthorityStore.js";

const JOURNEY_PROGRESSION_AUTHORITY_ADAPTER_VERSION = "1.0.0";

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

function createJourneyProgressionAuthorityAdapter({
  identityRuntime,
  authorityStore = createJourneyDurableAuthorityStore(),
} = {}) {
  const memory = identityRuntime?.memory;
  if (!memory?.getProject) {
    fail(
      "JOURNEY_PROGRESSION_AUTHORITY_MEMORY_REQUIRED",
      "Journey progression authority adapter requires canonical project access."
    );
  }
  if (!authorityStore?.read || !authorityStore?.bootstrapUnderLock || !authorityStore?.compareProjection) {
    fail(
      "JOURNEY_PROGRESSION_AUTHORITY_STORE_REQUIRED",
      "Journey progression authority adapter requires the durable Journey authority store."
    );
  }

  function readProject(projectId) {
    const pid = cleanString(projectId);
    if (!pid) fail("JOURNEY_PROGRESSION_AUTHORITY_PROJECT_REQUIRED", "Journey authority read requires a projectId.");
    const project = typeof memory.getPersistedProject === "function"
      ? memory.getPersistedProject(pid)
      : memory.getProject(pid);
    if (!project) {
      fail("JOURNEY_PROGRESSION_AUTHORITY_PROJECT_NOT_FOUND", "Journey authority could not resolve the canonical project.");
    }
    return cloneValue(project);
  }

  function resolveUnderLock({ projectId, fallbackJourney = null, serialization = null } = {}) {
    const project = readProject(projectId);
    const pid = cleanString(project.id);
    const projectedJourney = cloneValue(project?.metadata?.projectJourney || fallbackJourney || null);

    let authorityRecord = authorityStore.read(pid, { project });
    let bootstrapStatus = "authority-present";

    if (!authorityRecord) {
      if (!projectedJourney) {
        fail(
          "JOURNEY_PROGRESSION_AUTHORITY_BOOTSTRAP_SOURCE_REQUIRED",
          "Journey authority is absent and no legacy Journey exists to bootstrap it."
        );
      }
      const bootstrap = authorityStore.bootstrapUnderLock({
        project,
        legacyJourney: projectedJourney,
        serialization,
      });
      authorityRecord = cloneValue(bootstrap.record);
      bootstrapStatus = bootstrap.status;
    }

    const projection = authorityStore.compareProjection({
      project,
      projectedJourney,
    });

    return Object.freeze({
      status: "authority-resolved",
      project: cloneValue(project),
      projectId: pid,
      authorityRecord: cloneValue(authorityRecord),
      projectJourney: cloneValue(authorityRecord.journey),
      authorityGeneration: authorityRecord?.authority?.generation ?? null,
      progressionRevision: authorityRecord?.journey?.progression?.revision ?? 0,
      bootstrapStatus,
      projectionStatus: projection.status,
      projectedJourney: cloneValue(projectedJourney),
      serialization: cloneValue(serialization),
    });
  }

  return Object.freeze({
    version: JOURNEY_PROGRESSION_AUTHORITY_ADAPTER_VERSION,
    resolveUnderLock,
  });
}

export {
  JOURNEY_PROGRESSION_AUTHORITY_ADAPTER_VERSION,
  createJourneyProgressionAuthorityAdapter,
};

export default createJourneyProgressionAuthorityAdapter;

import createJourneyDurableAuthorityStore from "./JourneyDurableAuthorityStore.js";

const JOURNEY_AUTHORITY_READ_FACADE_VERSION = "1.0.0";

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

  return Object.freeze({
    version: JOURNEY_AUTHORITY_READ_FACADE_VERSION,
    readPreferred,
  });
}

export {
  JOURNEY_AUTHORITY_READ_FACADE_VERSION,
  createJourneyAuthorityReadFacade,
};

export default createJourneyAuthorityReadFacade;

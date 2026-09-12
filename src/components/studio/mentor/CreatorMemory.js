import createCreatorMemoryCore, {
  CREATOR_MEMORY_VERSION,
  DEFAULT_STORAGE_KEY,
  MEMORY_ENTRY_TYPES,
  IDEA_STATUSES,
  PROJECT_STATUSES,
  PATTERN_STATUSES,
  MEMORY_IMPORTANCE,
  MEMORY_STATUSES,
  MEMORY_SCOPES,
  MEMORY_HORIZONS,
  MEMORY_SOURCES,
  MEMORY_CERTAINTY,
  MEMORY_AUTHORITY,
  DEFERRED_MEMORY_STATUSES,
  SESSION_HANDOFF_STATUSES,
  createDefaultMemoryState,
  createMemoryStorageAdapter,
} from "./CreatorMemoryCore.js";
import {
  MOVIE_MENTOR_PROJECT_IDENTITY_DOMAIN,
  MOVIE_MENTOR_PROJECT_IDENTITY_SCHEMA,
  withMovieProjectIdentity,
} from "./MovieMentorProjectIdentity.js";
import createJourneyAuthorityReadFacade from "./JourneyAuthorityReadFacade.js";

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function legacyIdentity() {
  return {
    domain: MOVIE_MENTOR_PROJECT_IDENTITY_DOMAIN,
    schema: 0,
    issuance: "legacy-preserved",
    legacy: true,
  };
}

function ensureLegacyIdentityMetadata(memory) {
  const state = memory.getState();
  let changed = false;
  state.projects = (state.projects || []).map((project) => {
    if (!project?.id || project.identity) return project;
    changed = true;
    return { ...project, identity: legacyIdentity() };
  });
  if (changed) memory.replaceState(state);
}

function isMovieMentorProject(project) {
  return Boolean(
    project?.id &&
    project.creatorType === "video" &&
    project.metadata?.creatorMode === "ai-movie"
  );
}

function metadataWithoutJourney(metadata) {
  const copy = clone(metadata) || {};
  delete copy.projectJourney;
  return copy;
}

function sameValue(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function cleanIdentity(value) {
  return typeof value === "string" ? value.trim() : "";
}

function resolveFacadeDurableStorage(storageAdapter) {
  if (storageAdapter) return storageAdapter;
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  } catch {
    // Fall through to the same in-memory compatibility used by CreatorMemoryCore.
  }
  return createMemoryStorageAdapter();
}

/**
 * CreatorMemoryCore intentionally owns persistence and verifies every durable
 * write by reading it back. The facade occasionally needs to adopt a snapshot
 * that it has just read from the same durable store while a higher-level lock is
 * already held. Re-persisting that snapshot would create a second whole-blob
 * write and reopen a clobber window.
 *
 * This controller leaves every ordinary Core write untouched. Only a synchronous
 * facade-owned refresh section virtualises setItem/getItem long enough for Core
 * to update its private working cache and persistence baseline. No durable bytes
 * are changed, no async work may run inside the shield, and no CAS/atomic storage
 * semantics are claimed.
 */
function createFacadeStorageController(storage) {
  let refreshShieldActive = false;
  const virtualWrites = new Map();

  const adapter = {
    getItem(key) {
      if (refreshShieldActive && virtualWrites.has(key)) {
        return virtualWrites.get(key);
      }
      return storage.getItem(key);
    },
    setItem(key, value) {
      if (refreshShieldActive) {
        virtualWrites.set(key, value);
        return;
      }
      return storage.setItem(key, value);
    },
    removeItem(key) {
      if (refreshShieldActive) {
        virtualWrites.set(key, null);
        return;
      }
      return storage.removeItem(key);
    },
  };

  function refreshWithoutDurableWrite(operation) {
    if (refreshShieldActive) {
      const error = new Error("Creator Memory refresh shield cannot be nested.");
      error.code = "CREATOR_MEMORY_REFRESH_SHIELD_NESTED";
      throw error;
    }
    refreshShieldActive = true;
    virtualWrites.clear();
    try {
      return operation();
    } finally {
      refreshShieldActive = false;
      virtualWrites.clear();
    }
  }

  return { adapter, refreshWithoutDurableWrite };
}

function createCreatorMemory(options = {}) {
  const {
    projectIdentityCrypto = globalThis?.crypto,
    journeyAuthorityReadFacade = createJourneyAuthorityReadFacade(),
    ...coreOptions
  } = options || {};
  const durableStorage = resolveFacadeDurableStorage(coreOptions.storageAdapter);
  const storageController = createFacadeStorageController(durableStorage);
  const resolvedCoreOptions = {
    ...coreOptions,
    storageAdapter: storageController.adapter,
  };
  const memory = createCreatorMemoryCore(resolvedCoreOptions);
  ensureLegacyIdentityMetadata(memory);
  const getCoreProject = typeof memory.getProject === "function"
    ? memory.getProject.bind(memory)
    : null;
  const getCoreActiveProject = typeof memory.getActiveProject === "function"
    ? memory.getActiveProject.bind(memory)
    : null;
  const getCoreProjectMemories = typeof memory.getProjectMemories === "function"
    ? memory.getProjectMemories.bind(memory)
    : null;

  /**
   * Cross-context durability read.
   *
   * CreatorMemoryCore intentionally keeps an in-memory working state. A second
   * browser tab can therefore have an older working snapshot even after another
   * tab commits to the shared storage adapter. This helper constructs a fresh
   * read-only Core view against the same storage configuration and returns its
   * hydrated persisted state without mutating or persisting the current runtime.
   */
  function readPersistedState() {
    const freshReader = createCreatorMemoryCore(resolvedCoreOptions);
    return clone(freshReader.getState());
  }

  function getPersistedProject(projectId) {
    const pid = typeof projectId === "string" ? projectId.trim() : "";
    if (!pid) return null;
    const state = readPersistedState();
    return clone((state.projects || []).find((project) => project?.id === pid) || null);
  }

  function adoptPersistedStateWithoutWrite(state) {
    return storageController.refreshWithoutDurableWrite(() => memory.replaceState(state));
  }

  /**
   * Exact-turn durable convergence primitive.
   *
   * This operation does not claim to serialize writers. Its caller must already
   * hold the cross-context settlement authority. While that authority is held we
   * construct a fresh Core view, let an existing {projectId, creatorTurnId}
   * record win, or append exactly once to the fresh durable state. The working
   * facade then adopts that persisted reality through a synchronous write shield,
   * so later handoff/recommendation writes start from the committed snapshot
   * without issuing a redundant whole-memory persistence write.
   */
  function convergeConversationSettlement(input = {}) {
    const projectId = cleanIdentity(input?.metadata?.projectId);
    const creatorTurnId = cleanIdentity(input?.metadata?.creatorTurnId);
    if (!projectId || !creatorTurnId) {
      return {
        status: "legacy-unkeyed",
        conversation: memory.rememberConversation?.(input) || null,
      };
    }

    const freshMemory = createCreatorMemoryCore(resolvedCoreOptions);
    const freshState = clone(freshMemory.getState());
    const existing = (freshState?.conversations || []).find(
      (entry) =>
        cleanIdentity(entry?.metadata?.projectId) === projectId &&
        cleanIdentity(entry?.metadata?.creatorTurnId) === creatorTurnId
    ) || null;

    if (existing) {
      adoptPersistedStateWithoutWrite(freshState);
      return {
        status: "already-settled",
        conversation: clone(existing),
      };
    }

    const conversation = freshMemory.rememberConversation?.(input) || null;
    if (!conversation?.id) {
      return { status: "not-settled", conversation: null };
    }

    adoptPersistedStateWithoutWrite(freshMemory.getState());
    return {
      status: "committed",
      conversation: clone(conversation),
    };
  }

  function overlayAuthorityJourney(project) {
    const safeProject = clone(project || null);
    if (!isMovieMentorProject(safeProject)) return safeProject;

    const preferred = journeyAuthorityReadFacade.readPreferred({
      project: safeProject,
      projectedJourney: safeProject?.metadata?.projectJourney || null,
    });
    if (!preferred?.projectJourney) return safeProject;

    return {
      ...safeProject,
      metadata: {
        ...(safeProject.metadata || {}),
        projectJourney: clone(preferred.projectJourney),
      },
    };
  }

  /**
   * Public project read compatibility projection.
   *
   * Some legacy UI recovery paths still call CreatorMemory.getProject(). Once
   * Journey Authority exists, returning the stale Creator Memory Journey there
   * would allow exception handling to resurrect an obsolete Journey after a
   * valid authority commit. Overlay only the returned clone. getPersistedProject()
   * intentionally remains raw for bootstrap, split-brain comparison and repair.
   */
  function getProject(projectId) {
    return overlayAuthorityJourney(getCoreProject?.(projectId) || null);
  }

  /**
   * Movie Mentor active-project compatibility projection.
   *
   * CreatorWorkspace still obtains an existing AI Movie project through
   * getActiveProject(). Once Journey Authority exists, returning the stale
   * Creator Memory Journey here would reopen a live re-entry path around the
   * authority-first read facade. Overlay only the returned clone; never persist
   * the authority Journey back into Creator Memory from this read.
   */
  function getActiveProject() {
    return overlayAuthorityJourney(getCoreActiveProject?.() || null);
  }

  /**
   * Recommendation lifecycle compatibility projection.
   *
   * Creator Memory remains the rich advisory/history store. Once a creator act
   * causes a recommendation to enter Journey Authority, however, the authority
   * lifecycle must outrank any stale `current:true` advisory flag on reads. This
   * overlays only returned clones and never writes authority lifecycle back into
   * the general Creator Memory blob.
   */
  function getProjectMemories(query = {}) {
    const entries = clone(getCoreProjectMemories?.(query) || []);
    const projectId = typeof query?.projectId === "string" ? query.projectId.trim() : "";
    if (!projectId || typeof journeyAuthorityReadFacade?.overlayRecommendationReferences !== "function") {
      return entries;
    }

    const project = getPersistedProject(projectId);
    if (!isMovieMentorProject(project)) return entries;

    return clone(journeyAuthorityReadFacade.overlayRecommendationReferences({
      project,
      entries,
    }));
  }

  function saveProject({
    title = "",
    description = "",
    creatorType = "",
    status = PROJECT_STATUSES.IDEA,
    relatedIdeaIds = [],
    tags = [],
    metadata = {},
  } = {}) {
    const cleanTitle = typeof title === "string" ? title.trim() : "";
    if (!cleanTitle) return null;

    const coreState = memory.getState();
    const timestamp = new Date().toISOString();
    const allowedStatuses = Object.values(PROJECT_STATUSES);
    const resolvedStatus = allowedStatuses.includes(status) ? status : PROJECT_STATUSES.IDEA;
    const project = withMovieProjectIdentity({
      type: MEMORY_ENTRY_TYPES.PROJECT,
      title: cleanTitle,
      description: typeof description === "string" ? description.trim() : "",
      creatorType: typeof creatorType === "string" ? creatorType.trim() : "",
      status: resolvedStatus,
      relatedIdeaIds: Array.isArray(relatedIdeaIds) ? [...new Set(relatedIdeaIds.filter((v) => typeof v === "string" && v.trim()).map((v) => v.trim()))] : [],
      tags: Array.isArray(tags) ? [...new Set(tags.filter((v) => typeof v === "string" && v.trim()).map((v) => v.trim()))] : [],
      metadata: clone(metadata) || {},
      createdAt: timestamp,
      updatedAt: timestamp,
      publishedAt: resolvedStatus === PROJECT_STATUSES.PUBLISHED ? timestamp : null,
      completedAt: resolvedStatus === PROJECT_STATUSES.COMPLETED ? timestamp : null,
    }, { cryptoImpl: projectIdentityCrypto });

    coreState.projects = [...(coreState.projects || []), project];
    if ([PROJECT_STATUSES.CREATING, PROJECT_STATUSES.REFINING].includes(resolvedStatus)) {
      coreState.journey = { ...(coreState.journey || {}), activeProjectId: project.id };
    }
    memory.replaceState(coreState);
    return clone(getProject(project.id));
  }

  function isRedundantAuthorityProjectionEcho(current, safeUpdates) {
    if (!isMovieMentorProject(current)) return false;
    if (!safeUpdates?.metadata || !Object.prototype.hasOwnProperty.call(safeUpdates.metadata, "projectJourney")) return false;
    if (Object.keys(safeUpdates).some((key) => key !== "metadata")) return false;

    const preferred = journeyAuthorityReadFacade.readPreferred({
      project: current,
      projectedJourney: current?.metadata?.projectJourney || null,
    });
    if (preferred?.status !== "authority" || !preferred?.projectJourney) return false;
    if (!sameValue(safeUpdates.metadata.projectJourney, preferred.projectJourney)) return false;
    if (!sameValue(metadataWithoutJourney(safeUpdates.metadata), metadataWithoutJourney(current.metadata))) return false;
    return true;
  }

  function updateProject(projectId, updates = {}) {
    if (!updates || typeof updates !== "object") return getProject(projectId);
    const current = getCoreProject?.(projectId) || null;
    if (!current) return null;
    const safeUpdates = clone(updates) || {};
    delete safeUpdates.id;
    delete safeUpdates.projectId;
    delete safeUpdates.identity;

    // Once Journey Authority exists, a compatibility caller may echo the exact
    // authoritative Journey back through the old Creator Memory update path.
    // Persisting that echo would write the entire cached Creator Memory blob and
    // could clobber unrelated newer cross-tab memory. Treat only an exact,
    // otherwise-no-change authority echo as a read-side no-op.
    if (isRedundantAuthorityProjectionEcho(current, safeUpdates)) {
      return overlayAuthorityJourney(current);
    }

    const updated = memory.updateProject(projectId, safeUpdates);
    if (!updated) return null;
    if (JSON.stringify(updated.identity || null) !== JSON.stringify(current.identity || null)) {
      const state = memory.getState();
      state.projects = (state.projects || []).map((project) => project?.id === projectId ? { ...project, identity: clone(current.identity) } : project);
      memory.replaceState(state);
      return getProject(projectId);
    }
    return overlayAuthorityJourney(updated);
  }

  return {
    ...memory,
    readPersistedState,
    getPersistedProject,
    convergeConversationSettlement,
    getProject,
    getActiveProject,
    getProjectMemories,
    saveProject,
    updateProject,
  };
}

export {
  CREATOR_MEMORY_VERSION,
  DEFAULT_STORAGE_KEY,
  MEMORY_ENTRY_TYPES,
  IDEA_STATUSES,
  PROJECT_STATUSES,
  PATTERN_STATUSES,
  MEMORY_IMPORTANCE,
  MEMORY_STATUSES,
  MEMORY_SCOPES,
  MEMORY_HORIZONS,
  MEMORY_SOURCES,
  MEMORY_CERTAINTY,
  MEMORY_AUTHORITY,
  DEFERRED_MEMORY_STATUSES,
  SESSION_HANDOFF_STATUSES,
  createDefaultMemoryState,
  createMemoryStorageAdapter,
  createCreatorMemory,
};

export default createCreatorMemory;

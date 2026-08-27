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

function createCreatorMemory(options = {}) {
  const {
    projectIdentityCrypto = globalThis?.crypto,
    journeyAuthorityReadFacade = createJourneyAuthorityReadFacade(),
    ...coreOptions
  } = options || {};
  const memory = createCreatorMemoryCore(coreOptions);
  ensureLegacyIdentityMetadata(memory);
  const getCoreActiveProject = typeof memory.getActiveProject === "function"
    ? memory.getActiveProject.bind(memory)
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
    const freshReader = createCreatorMemoryCore(coreOptions);
    return clone(freshReader.getState());
  }

  function getPersistedProject(projectId) {
    const pid = typeof projectId === "string" ? projectId.trim() : "";
    if (!pid) return null;
    const state = readPersistedState();
    return clone((state.projects || []).find((project) => project?.id === pid) || null);
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
    const project = clone(getCoreActiveProject?.() || null);
    if (!isMovieMentorProject(project)) return project;

    const preferred = journeyAuthorityReadFacade.readPreferred({
      project,
      projectedJourney: project?.metadata?.projectJourney || null,
    });
    if (!preferred?.projectJourney) return project;

    return {
      ...project,
      metadata: {
        ...(project.metadata || {}),
        projectJourney: clone(preferred.projectJourney),
      },
    };
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
    return clone(memory.getProject(project.id));
  }

  function updateProject(projectId, updates = {}) {
    if (!updates || typeof updates !== "object") return memory.getProject(projectId);
    const current = memory.getProject(projectId);
    if (!current) return null;
    const safeUpdates = clone(updates) || {};
    delete safeUpdates.id;
    delete safeUpdates.projectId;
    delete safeUpdates.identity;
    const updated = memory.updateProject(projectId, safeUpdates);
    if (!updated) return null;
    if (JSON.stringify(updated.identity || null) !== JSON.stringify(current.identity || null)) {
      const state = memory.getState();
      state.projects = (state.projects || []).map((project) => project?.id === projectId ? { ...project, identity: clone(current.identity) } : project);
      memory.replaceState(state);
      return memory.getProject(projectId);
    }
    return updated;
  }

  return {
    ...memory,
    readPersistedState,
    getPersistedProject,
    getActiveProject,
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

import assert from "node:assert/strict";
import createCreatorMemory, {
  createMemoryStorageAdapter,
  PROJECT_STATUSES,
  MEMORY_SOURCES,
  MEMORY_CERTAINTY,
} from "../src/components/studio/mentor/CreatorMemory.js";
import { syncMovieMentorDurableState } from "../src/components/studio/mentor/MovieMentorDurableStateSync.js";

const deterministicCrypto = { randomUUID: () => "11111111-2222-4333-8444-555555555555" };
const storage = createMemoryStorageAdapter();
const memory = createCreatorMemory({ storageAdapter: storage, projectIdentityCrypto: deterministicCrypto });
const project = memory.saveProject({ title: "The Red Door", creatorType: "video", status: PROJECT_STATUSES.CREATING });
assert.equal(project.id, "movie-project-11111111-2222-4333-8444-555555555555");
assert.deepEqual(project.identity, { domain: "iband.movie-mentor.project", schema: 1, issuance: "secure-web-crypto", legacy: false });
assert.equal(memory.getActiveProject().id, project.id);

memory.saveProjectMemory({ projectId: project.id, memoryKey: "premise", content: "A locked red door appears every midnight.", source: MEMORY_SOURCES.CREATOR, certainty: MEMORY_CERTAINTY.EXPLICIT });
const handoff = memory.saveSessionHandoff({ projectId: project.id, sessionId: "session-a", content: "Continue from the red door reveal." });
assert.equal(handoff.projectId, project.id);
assert.equal(memory.getProjectMemories({ projectId: project.id })[0].projectId, project.id);

const attemptedMutation = memory.updateProject(project.id, { id: "zorg-project", projectId: "zorg-project", identity: { domain: "purple.universe", schema: 999, issuance: "trust-me-bro" }, title: "The Red Door — Revised" });
assert.equal(attemptedMutation.id, project.id);
assert.equal(attemptedMutation.identity.domain, "iband.movie-mentor.project");
assert.equal(attemptedMutation.identity.schema, 1);

const reloaded = createCreatorMemory({ storageAdapter: storage, projectIdentityCrypto: deterministicCrypto });
assert.equal(reloaded.getProject(project.id).id, project.id);
assert.equal(reloaded.getProjectMemories({ projectId: project.id })[0].projectId, project.id);
assert.equal(reloaded.getLatestSessionHandoff(project.id).projectId, project.id);

const legacyId = "project-1699999999999-abcd1234";
const legacyStorage = createMemoryStorageAdapter({
  version: "2.3.0", creatorProfile: {}, ideas: [],
  projects: [{ id: legacyId, type: "project", title: "Legacy Film", status: "creating", metadata: {}, createdAt: "2025-01-01T00:00:00.000Z", updatedAt: "2025-01-01T00:00:00.000Z" }],
  projectMemories: [{ id: "pm1", type: "project-memory", projectId: legacyId, memoryKey: "legacy", content: "Keep me attached", status: "emerging", lifecycleStatus: "active", source: "creator", certainty: "explicit", confidence: 1, metadata: {}, createdAt: "2025-01-01T00:00:00.000Z", updatedAt: "2025-01-01T00:00:00.000Z" }],
  sessionHandoffs: [], conversations: [], observations: [], patterns: [], milestones: [], reflections: [], deferredMemories: [], journey: { activeProjectId: legacyId }, metadata: {},
});
const legacy = createCreatorMemory({ storageAdapter: legacyStorage, projectIdentityCrypto: deterministicCrypto });
const legacyProject = legacy.getProject(legacyId);
assert.equal(legacyProject.id, legacyId);
assert.equal(legacyProject.identity.issuance, "legacy-preserved");
assert.equal(legacy.getProjectMemories({ projectId: legacyId })[0].projectId, legacyId);

let syncBody = null;
let syncAuthorization = null;
await syncMovieMentorDurableState({
  projectId: project.id,
  creatorSessionId: "session-a",
  memoryState: reloaded.getState(),
  storage: { getItem: () => null, setItem() {} },
  getAuthToken: async () => "project-identity-test-token",
  fetchImpl: async (_url, options) => {
    syncAuthorization = options.headers?.Authorization || null;
    syncBody = JSON.parse(options.body);
    return { ok: true, status: 200, json: async () => ({ success: true, state: { revision: 1 } }) };
  },
});
assert.equal(syncAuthorization, "Bearer project-identity-test-token");
assert.equal(syncBody.projectId, project.id);
assert.equal(syncBody.state.creatorConfirmedContext.find((item) => item.key === "project").value.id, project.id);
assert.equal(syncBody.state.memoryContext.projectMemories[0].projectId, project.id);

console.log("Movie Mentor canonical project identity continuity verification: PASS");

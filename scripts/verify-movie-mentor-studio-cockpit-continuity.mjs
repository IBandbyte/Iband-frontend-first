import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import createCreatorMemory, { createMemoryStorageAdapter } from "../src/components/studio/mentor/CreatorMemory.js";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";
import { resolveWorkspaceIdentity } from "../src/components/studio/mentor/MovieMentorLiveGatewayService.js";

const storage = createMemoryStorageAdapter();
const projectCrypto = { randomUUID: () => "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" };
const sessionACrypto = { randomUUID: () => "11111111-2222-4333-8444-555555555555" };
const sessionBCrypto = { randomUUID: () => "66666666-7777-4888-8999-aaaaaaaaaaaa" };

const memoryA = createCreatorMemory({ storageAdapter: storage, projectIdentityCrypto: projectCrypto });
const runtimeA = createMovieMentorStudioIdentityRuntime({ memory: memoryA, cryptoImpl: sessionACrypto });
const journey = { id: "journey-1", creatorJourney: "guide", currentStageId: "idea" };
const projectA = runtimeA.ensureProject({ projectJourney: journey, title: "Continuity Movie" });
runtimeA.persistJourney(projectA.id, { ...journey, currentStageId: "characters" });

assert.equal(projectA.id, "movie-project-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
assert.equal(runtimeA.creatorSessionId, "movie-session-11111111-2222-4333-8444-555555555555");

const memoryB = createCreatorMemory({ storageAdapter: storage, projectIdentityCrypto: projectCrypto });
const runtimeB = createMovieMentorStudioIdentityRuntime({ memory: memoryB, cryptoImpl: sessionBCrypto });
const resumed = runtimeB.getResumeSnapshot();

assert.ok(resumed, "A new Studio mount must discover the active Movie Mentor project.");
assert.equal(resumed.projectId, projectA.id, "Leave/re-enter must preserve canonical project identity.");
assert.equal(resumed.projectJourney.currentStageId, "characters", "Leave/re-enter must preserve project journey reality.");
assert.notEqual(runtimeB.creatorSessionId, runtimeA.creatorSessionId, "A new working session must have a separate session identity.");

const identity = resolveWorkspaceIdentity({
  request: { projectId: resumed.projectId, creatorSessionId: runtimeB.creatorSessionId },
  storage: { getItem: () => null, setItem() {} },
  cryptoImpl: sessionBCrypto,
});
assert.deepEqual(identity, { projectId: projectA.id, creatorSessionId: runtimeB.creatorSessionId });

const workspaceSource = await readFile(new URL("../src/components/studio/CreatorWorkspace.jsx", import.meta.url), "utf8");
assert.match(workspaceSource, /MovieMentorConversation/);
assert.match(workspaceSource, /projectId=\{activeMovieProject\.id\}/);
assert.match(workspaceSource, /creatorSessionId=\{identityRuntime\.creatorSessionId\}/);
assert.equal(/Math\.random\s*\(/.test(workspaceSource), false, "CreatorWorkspace must not issue identity with Math.random().");

console.log("Movie Mentor live Studio cockpit identity continuity verification: PASS");

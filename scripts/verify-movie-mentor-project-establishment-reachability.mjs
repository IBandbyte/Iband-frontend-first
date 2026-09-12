import assert from "node:assert/strict";
import { generateMovieMentorLiveResponse } from "../src/components/studio/mentor/MovieMentorLiveGatewayService.js";

const projectId = "movie-project-11111111-2222-4333-8444-555555555555";
const identity = { domain: "iband.movie-mentor.project", schema: 1, issuance: "secure-web-crypto", legacy: false };
const calls = [];
const memory = new Map();
const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
const fetchImpl = async (url, options = {}) => {
  const body = JSON.parse(options.body || "{}");
  calls.push({ url, body });
  if (url.endsWith("/api/movie-mentor/projects")) {
    assert.equal(body.projectId, projectId);
    assert.deepEqual(body.identity, identity);
    assert.equal("principalId" in body, false);
    assert.equal("ownership" in body, false);
    assert.equal("establishmentAuthority" in body, false);
    return { ok: true, status: 201, json: async () => ({ success: true, projectId }) };
  }
  if (url.endsWith("/api/movie-mentor/state/sync")) return { ok: true, status: 200, json: async () => ({ success: true, state: { revision: 1 } }) };
  if (url.endsWith("/api/movie-mentor/turn")) return { ok: true, status: 200, json: async () => ({ success: true, text: "Ready.", turnContextProof: { verified: true }, authority: {}, mayAdvanceJourney: false }) };
  throw new Error(`Unexpected URL: ${url}`);
};

await generateMovieMentorLiveResponse({ projectId, projectIdentity: identity, creatorSessionId: "session-1", idea: "A detective finds a red door.", projectJourneySnapshot: { projectId, stageId: "idea" } }, { fetchImpl, storage, sessionStorage: storage, getAuthToken: async () => "test-credential" });

assert.equal(calls.length, 3, "RED: live turn must cross project establishment, state sync, then turn");
assert.ok(calls[0].url.endsWith("/api/movie-mentor/projects"), "RED: project establishment must precede state sync");
assert.ok(calls[1].url.endsWith("/api/movie-mentor/state/sync"));
assert.ok(calls[2].url.endsWith("/api/movie-mentor/turn"));
console.log("Movie Mentor project establishment reachability: PASS");

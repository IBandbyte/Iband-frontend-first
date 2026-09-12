import assert from "node:assert/strict";
import { generateMovieMentorLiveResponse } from "../src/components/studio/mentor/MovieMentorLiveGatewayService.js";

const projectId = "movie-project-11111111-2222-4333-8444-555555555555";
const identity = { domain: "iband.movie-mentor.project", schema: 1, issuance: "secure-web-crypto", legacy: false };
const memory = new Map();
const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
const request = { projectId, projectIdentity: identity, creatorSessionId: "session-1", idea: "A detective finds a red door.", projectJourneySnapshot: { projectId, stageId: "idea" } };
const getAuthToken = async () => "test-credential";

const calls = [];
const fetchImpl = async (url, options = {}) => {
  const body = JSON.parse(options.body || "{}");
  calls.push({ url, body, headers: options.headers || {} });
  if (url.endsWith("/api/movie-mentor/projects")) {
    assert.equal(options.headers?.Authorization, "Bearer test-credential");
    assert.deepEqual(body, { projectId, identity });
    assert.equal("principalId" in body, false);
    assert.equal("ownerPrincipalId" in body, false);
    assert.equal("authorityId" in body, false);
    assert.equal("verified" in body, false);
    assert.equal("ownership" in body, false);
    assert.equal("establishmentAuthority" in body, false);
    return { ok: true, status: 201, json: async () => ({ success: true, projectId }) };
  }
  if (url.endsWith("/api/movie-mentor/state/sync")) return { ok: true, status: 200, json: async () => ({ success: true, state: { revision: 1 } }) };
  if (url.endsWith("/api/movie-mentor/turn")) return { ok: true, status: 200, json: async () => ({ success: true, text: "Ready.", turnContextProof: { verified: true }, authority: {}, mayAdvanceJourney: false }) };
  throw new Error(`Unexpected URL: ${url}`);
};

await generateMovieMentorLiveResponse(request, { fetchImpl, storage, sessionStorage: storage, getAuthToken });

assert.equal(calls.length, 4, "live gateway and authoritative turn client must both cross the shared idempotent project-establishment authority");
assert.ok(calls[0].url.endsWith("/api/movie-mentor/projects"), "project establishment must precede state sync");
assert.ok(calls[1].url.endsWith("/api/movie-mentor/state/sync"), "workspace durable sync must follow successful project establishment");
assert.ok(calls[2].url.endsWith("/api/movie-mentor/projects"), "authoritative turn client must independently re-establish through the same idempotent authority before turn transport");
assert.ok(calls[3].url.endsWith("/api/movie-mentor/turn"), "turn transport must remain last");

const failedCalls = [];
await assert.rejects(
  generateMovieMentorLiveResponse(request, {
    storage,
    sessionStorage: storage,
    getAuthToken,
    fetchImpl: async (url, options = {}) => {
      failedCalls.push({ url, body: JSON.parse(options.body || "{}") });
      if (url.endsWith("/api/movie-mentor/projects")) return { ok: false, status: 503, json: async () => ({ success: false, code: "MOVIE_MENTOR_PROJECT_ESTABLISHMENT_UNAVAILABLE" }) };
      throw new Error(`Forbidden call after failed project establishment: ${url}`);
    },
  }),
  error => error?.code === "MOVIE_MENTOR_PROJECT_ESTABLISHMENT_UNAVAILABLE",
);
assert.equal(failedCalls.length, 1, "failed project establishment must produce zero state-sync and zero turn calls");
assert.ok(failedCalls[0].url.endsWith("/api/movie-mentor/projects"));

let invalidIdentityFetches = 0;
await assert.rejects(
  generateMovieMentorLiveResponse({ ...request, projectIdentity: { ...identity, schema: 0, issuance: "legacy-preserved", legacy: true } }, {
    storage,
    sessionStorage: storage,
    getAuthToken,
    fetchImpl: async () => { invalidIdentityFetches += 1; throw new Error("invalid identity must fail before network"); },
  }),
  error => error?.code === "MOVIE_MENTOR_PROJECT_IDENTITY_INVALID",
);
assert.equal(invalidIdentityFetches, 0, "legacy/non-current identity must fail closed before project establishment, sync, or turn network traffic");

console.log("Movie Mentor project establishment reachability: PASS — canonical authenticated establishment precedes sync and turn, repeats idempotently at the turn boundary, and fails closed before downstream authority.");

import assert from "node:assert/strict";
import {
  MOVIE_MENTOR_PROJECT_IDENTITY_DOMAIN,
  MOVIE_MENTOR_PROJECT_IDENTITY_SCHEMA,
  issueCanonicalMovieProjectId,
  classifyMovieProjectIdentity,
  withMovieProjectIdentity,
} from "../src/components/studio/mentor/MovieMentorProjectIdentity.js";

const cryptoImpl = { randomUUID: () => "11111111-2222-4333-8444-555555555555" };
const issued = issueCanonicalMovieProjectId({ cryptoImpl });
assert.equal(issued, "movie-project-11111111-2222-4333-8444-555555555555");
assert.equal(/Math\.random/.test(issueCanonicalMovieProjectId.toString()), false);

const canonical = withMovieProjectIdentity({ title: "The Red Door" }, { cryptoImpl });
assert.equal(canonical.id, issued);
assert.equal(canonical.identity.domain, MOVIE_MENTOR_PROJECT_IDENTITY_DOMAIN);
assert.equal(canonical.identity.schema, MOVIE_MENTOR_PROJECT_IDENTITY_SCHEMA);
assert.equal(canonical.identity.issuance, "secure-web-crypto");
assert.equal(classifyMovieProjectIdentity(canonical).canonical, true);

const legacyId = "project-1720000000000-abc123xy";
const legacy = withMovieProjectIdentity({ id: legacyId, title: "Legacy Project" }, { cryptoImpl });
assert.equal(legacy.id, legacyId);
assert.equal(legacy.identity.issuance, "legacy-preserved");
assert.equal(classifyMovieProjectIdentity(legacy).legacy, true);

assert.throws(
  () => issueCanonicalMovieProjectId({ cryptoImpl: {} }),
  (error) => error?.code === "MOVIE_MENTOR_PROJECT_IDENTITY_CRYPTO_REQUIRED"
);

console.log("Movie Mentor canonical project identity verification: PASS");

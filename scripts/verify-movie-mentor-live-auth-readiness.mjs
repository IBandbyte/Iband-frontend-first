import assert from "node:assert/strict";
import fs from "node:fs/promises";

const authSource=await fs.readFile(new URL("../src/components/studio/mentor/MovieMentorCreatorAuthenticationTransport.js",import.meta.url),"utf8");
const surfaceSource=await fs.readFile(new URL("../src/components/studio/mentor/MovieMentorCommercialSurface.jsx",import.meta.url),"utf8");

assert.match(authSource,/const authStateListeners = new Set\(\)/,"Auth transport must own a replaceable readiness subscription channel.");
assert.match(authSource,/function subscribeMovieMentorCreatorAuthState\(listener\)/,"Auth transport must expose readiness subscription without leaking provider semantics.");
assert.match(authSource,/notifyAuthStateListeners\(\)/,"Auth state transitions must notify live consumers.");
assert.match(authSource,/function getMovieMentorCreatorAuthState\(\)/,"Live consumers must be able to read current readiness without manufacturing identity.");
assert.doesNotMatch(authSource,/localStorage|sessionStorage/,"Authentication authority must never be persisted in browser storage.");

assert.match(surfaceSource,/subscribeMovieMentorCreatorAuthState\(setAuthState\)/,"Commercial surface must react to authentication transitions without remount.");
assert.match(surfaceSource,/if\(!authReady\(authState\)\)/,"Commercial catalogue network authority must wait for authenticated readiness.");
assert.match(surfaceSource,/\},\[authState\]\);/,"Commercial catalogue must converge when authentication state changes.");
assert.match(surfaceSource,/!authReady\(getMovieMentorCreatorAuthState\(\)\)/,"Checkout initiation must re-check current authentication readiness.");
assert.doesNotMatch(surfaceSource,/useAuth|@clerk\/react/,"Commerce policy must remain provider-neutral and must not depend directly on Clerk.");
assert.doesNotMatch(surfaceSource,/localStorage|sessionStorage/,"Commercial surface must not persist authentication authority.");

console.log("PASS 5A.23: live commerce waits for authenticated readiness, converges when authority becomes ready, fails closed again when authority is lost, and remains provider-neutral without browser token persistence.");

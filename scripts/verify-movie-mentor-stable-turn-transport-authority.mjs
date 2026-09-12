import assert from "node:assert/strict";
import fs from "node:fs";
import { resolvePendingTurn, readPendingTurn, clearPendingTurn } from "../src/components/studio/mentor/MovieMentorTurnIdentity.js";

const map = new Map();
const storage = {
  getItem: key => map.get(key) ?? null,
  setItem: (key, value) => map.set(key, String(value)),
  removeItem: key => map.delete(key),
};
const identity = { projectId: "project-stable-turn", creatorSessionId: "session-stable-turn" };
const message = "A detective finds a red door that should not exist.";
let mintCount = 0;
const cryptoImpl = { randomUUID: () => `creator-turn-${++mintCount}` };

const first = resolvePendingTurn({ identity, message, storage, cryptoImpl });
assert.equal(first.creatorTurnId, "creator-turn-1");
assert.deepEqual(readPendingTurn({ identity, storage }), first);

const retry = resolvePendingTurn({ identity, message, storage, cryptoImpl });
assert.equal(retry.creatorTurnId, first.creatorTurnId);
assert.equal(mintCount, 1);

const reload = resolvePendingTurn({ identity, message, storage, cryptoImpl });
assert.equal(reload.creatorTurnId, first.creatorTurnId);
assert.equal(mintCount, 1);

assert.throws(
  () => resolvePendingTurn({ identity, message: "A different turn", storage, cryptoImpl }),
  error => error?.code === "MOVIE_MENTOR_PENDING_TURN_UNRESOLVED" && error?.creatorTurnId === first.creatorTurnId,
);
assert.equal(mintCount, 1);

clearPendingTurn({ identity, creatorTurnId: first.creatorTurnId, storage });
assert.equal(readPendingTurn({ identity, storage }), null);
const next = resolvePendingTurn({ identity, message: "A different turn", storage, cryptoImpl });
assert.equal(next.creatorTurnId, "creator-turn-2");
assert.equal(mintCount, 2);

// A same-project sibling can acquire the transport lock after the backend call
// returns but before the first tab's React publication retires pending reality.
// Backend idempotency makes that replay commercially safe, but both tabs can
// still receive the same settled creatorTurnId. The durable conversation owner
// must therefore reject a second mentor publication for that exact settlement.
const workspaceSource = fs.readFileSync(
  new URL("../src/components/studio/CreatorWorkspace.jsx", import.meta.url),
  "utf8",
);
assert.match(
  workspaceSource,
  /handleMovieMessage[\s\S]*backendMetadata\?\.creatorTurnId[\s\S]*(some|find)\([\s\S]*backendMetadata\?\.creatorTurnId/,
  "RED: a convergent same-creatorTurnId replay can append the same mentor settlement twice after the transport lock releases but before pending retirement.",
);

console.log("PASS: stable creatorTurnId survives retries and reloads, and convergent settlement replay cannot duplicate durable mentor publication.");

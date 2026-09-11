import assert from "node:assert/strict";
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

// First send owns an identity before transport.
const first = resolvePendingTurn({ identity, message, storage, cryptoImpl });
assert.equal(first.creatorTurnId, "creator-turn-1");
assert.deepEqual(readPendingTurn({ identity, storage }), first);

// Ambiguous transport failure leaves the pending identity durable. Retrying the
// same creator action must converge on exactly the same creatorTurnId.
const retry = resolvePendingTurn({ identity, message, storage, cryptoImpl });
assert.equal(retry.creatorTurnId, first.creatorTurnId);
assert.equal(mintCount, 1);

// A reload gets a fresh helper invocation but the same durable storage. It must
// recover the same pending commercial turn rather than minting a second one.
const reload = resolvePendingTurn({ identity, message, storage, cryptoImpl });
assert.equal(reload.creatorTurnId, first.creatorTurnId);
assert.equal(mintCount, 1);

// While outcome is uncertain, a different creator action cannot silently steal
// or replace the pending identity.
assert.throws(
  () => resolvePendingTurn({ identity, message: "A different turn", storage, cryptoImpl }),
  error => error?.code === "MOVIE_MENTOR_PENDING_TURN_UNRESOLVED" && error?.creatorTurnId === first.creatorTurnId,
);
assert.equal(mintCount, 1);

// Only authoritative completion may clear the pending identity; the next real
// creator action then receives a fresh identity.
clearPendingTurn({ identity, creatorTurnId: first.creatorTurnId, storage });
assert.equal(readPendingTurn({ identity, storage }), null);
const next = resolvePendingTurn({ identity, message: "A different turn", storage, cryptoImpl });
assert.equal(next.creatorTurnId, "creator-turn-2");
assert.equal(mintCount, 2);

console.log("PASS: stable creatorTurnId is minted before first send, reused after ambiguous failure and reload, and retired only after acknowledgement.");

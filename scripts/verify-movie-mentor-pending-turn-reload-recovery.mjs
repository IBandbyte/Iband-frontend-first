import assert from "node:assert/strict";
import fs from "node:fs";
import { readPendingTurn, resolvePendingTurn, clearPendingTurn } from "../src/components/studio/mentor/MovieMentorTurnIdentity.js";
import * as turnClient from "../src/components/studio/mentor/MovieMentorTurnClient.js";

const wrapper = fs.readFileSync(new URL("../src/components/studio/mentor/MovieMentorConversation.jsx", import.meta.url), "utf8");
const map = new Map();
const storage = { getItem:key=>map.get(key)??null, setItem:(key,value)=>map.set(key,String(value)), removeItem:key=>map.delete(key) };
const identity = { projectId:"project-reload-recovery", creatorSessionId:"session-before-reload" };
let minted = 0;
const cryptoImpl = { randomUUID:()=>`turn-${++minted}` };
const message = "Keep the detective outside the red door until the storm ends.";

// First send persists the creator action and its transport identity before the
// network outcome is known.
const first = resolvePendingTurn({ identity, message, storage, cryptoImpl });
assert.equal(first.creatorTurnId,"turn-1");
assert.equal(readPendingTurn({ identity, storage })?.message,message);

// Simulate a reload: working-session identity changes, but project identity and
// durable storage remain. The exact creator action and creatorTurnId must survive.
const reloadedIdentity = { projectId:identity.projectId, creatorSessionId:"session-after-reload" };
const recovered = readPendingTurn({ identity:reloadedIdentity, storage });
assert.deepEqual(recovered,first);
const retry = resolvePendingTurn({ identity:reloadedIdentity, message:recovered.message, storage, cryptoImpl });
assert.equal(retry.creatorTurnId,first.creatorTurnId);
assert.equal(minted,1);

// A different action cannot bypass the uncertain turn.
assert.throws(
  ()=>resolvePendingTurn({ identity:reloadedIdentity, message:"Open the door now.", storage, cryptoImpl }),
  error=>error?.code==="MOVIE_MENTOR_PENDING_TURN_UNRESOLVED"&&error?.creatorTurnId===first.creatorTurnId,
);

// Production composition must surface the recovered action into the parent
// conversation/identity runtime, explicitly carrying the pending turn binding.
assert.match(wrapper,/readPendingTurn/,"Recovered pending transport reality is not read by the live conversation composition.");
assert.match(wrapper,/onSendMessage\s*\(\s*\{/s,"Recovered creator action is not restored into creator-visible conversation state.");
assert.match(wrapper,/recoveredPendingCreatorAction\s*:\s*true/,"Recovered action is not marked as reload recovery evidence.");
assert.match(wrapper,/pendingCreatorTurnId\s*:\s*pendingTurn\.creatorTurnId/,"Recovered creator action is not explicitly bound to its pending creatorTurnId.");
assert.match(wrapper,/retryRequiresSameMessage\s*:\s*true/,"Recovered action does not declare same-message retry ownership.");

// Authoritative acknowledgement retires the pending action; a later intentional
// creator turn can then receive a fresh identity.
clearPendingTurn({ identity:reloadedIdentity, creatorTurnId:first.creatorTurnId, storage });
assert.equal(readPendingTurn({ identity:reloadedIdentity, storage }),null);
const next = resolvePendingTurn({ identity:reloadedIdentity, message:"Open the door now.", storage, cryptoImpl });
assert.equal(next.creatorTurnId,"turn-2");

// Same-project tabs must not independently enter the pending-turn critical
// section. The turn client owns the cross-context serialization boundary so one
// unresolved creator action cannot be overwritten by another tab before ACK.
assert.equal(
  typeof turnClient.withPendingTurnLock,
  "function",
  "RED: live turn transport has no same-project cross-tab pending-turn lock authority.",
);

const queued = [];
const fakeLockManager = {
  tails: new Map(),
  request(name, callback) {
    const prior = this.tails.get(name) || Promise.resolve();
    const current = prior.then(() => callback());
    this.tails.set(name, current.catch(() => {}));
    return current;
  },
};
const lockIdentityA = { projectId:"project-multi-tab", creatorSessionId:"tab-a" };
const lockIdentityB = { projectId:"project-multi-tab", creatorSessionId:"tab-b" };
let releaseFirst;
const firstEntered = new Promise(resolve => {
  turnClient.withPendingTurnLock({
    identity:lockIdentityA,
    lockManager:fakeLockManager,
    operation:async()=>{
      queued.push("A-enter");
      resolve();
      await new Promise(release=>{ releaseFirst=release; });
      queued.push("A-exit");
    },
  });
});
await firstEntered;
const second = turnClient.withPendingTurnLock({
  identity:lockIdentityB,
  lockManager:fakeLockManager,
  operation:async()=>{ queued.push("B-enter"); },
});
await Promise.resolve();
assert.deepEqual(queued,["A-enter"],"Same-project tab B entered before tab A released the pending-turn authority.");
releaseFirst();
await second;
assert.deepEqual(queued,["A-enter","A-exit","B-enter"]);

console.log("PASS: pending creator action survives reload, stays creator-visible, and same-project tabs serialize pending-turn ownership until acknowledgement.");

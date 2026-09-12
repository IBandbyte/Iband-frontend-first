import assert from "node:assert/strict";
import fs from "node:fs";
import { readPendingTurn, resolvePendingTurn, clearPendingTurn } from "../src/components/studio/mentor/MovieMentorTurnIdentity.js";
import * as turnClient from "../src/components/studio/mentor/MovieMentorTurnClient.js";

const wrapper = fs.readFileSync(new URL("../src/components/studio/mentor/MovieMentorConversation.jsx", import.meta.url), "utf8");
const workspace = fs.readFileSync(new URL("../src/components/studio/CreatorWorkspace.jsx", import.meta.url), "utf8");
const map = new Map();
const storage = { getItem:key=>map.get(key)??null, setItem:(key,value)=>map.set(key,String(value)), removeItem:key=>map.delete(key) };
const identity = { projectId:"project-reload-recovery", creatorSessionId:"session-before-reload" };
let minted = 0;
const cryptoImpl = { randomUUID:()=>`turn-${++minted}` };
const message = "Keep the detective outside the red door until the storm ends.";

const first = resolvePendingTurn({ identity, message, storage, cryptoImpl });
assert.equal(first.creatorTurnId,"turn-1");
assert.equal(readPendingTurn({ identity, storage })?.message,message);

const reloadedIdentity = { projectId:identity.projectId, creatorSessionId:"session-after-reload" };
const recovered = readPendingTurn({ identity:reloadedIdentity, storage });
assert.deepEqual(recovered,first);
const retry = resolvePendingTurn({ identity:reloadedIdentity, message:recovered.message, storage, cryptoImpl });
assert.equal(retry.creatorTurnId,first.creatorTurnId);
assert.equal(minted,1);

assert.throws(
  ()=>resolvePendingTurn({ identity:reloadedIdentity, message:"Open the door now.", storage, cryptoImpl }),
  error=>error?.code==="MOVIE_MENTOR_PENDING_TURN_UNRESOLVED"&&error?.creatorTurnId===first.creatorTurnId,
);

assert.match(wrapper,/readPendingTurn/,"Recovered pending transport reality is not read by the live conversation composition.");
assert.match(wrapper,/onSendMessage\s*\(\s*\{/s,"Recovered creator action is not restored into creator-visible conversation state.");
assert.match(wrapper,/recoveredPendingCreatorAction\s*:\s*true/,"Recovered action is not marked as reload recovery evidence.");
assert.match(wrapper,/pendingCreatorTurnId\s*:\s*pendingTurn\.creatorTurnId/,"Recovered creator action is not explicitly bound to its pending creatorTurnId.");
assert.match(wrapper,/retryRequiresSameMessage\s*:\s*true/,"Recovered action does not declare same-message retry ownership.");
assert.match(wrapper,/addEventListener\(\s*["']storage["']/,"RED: an already-open same-project tab does not observe pending-turn reality created or retired by another tab.");
assert.match(wrapper,/removeEventListener\(\s*["']storage["']/,"Cross-tab pending-turn observation must retire its storage listener on unmount.");
assert.match(wrapper,/recoveryDelivered\.current\s*=\s*pendingTurn\.creatorTurnId/,"Cross-tab recovery must track the exact delivered creatorTurnId rather than a once-per-mount boolean.");
assert.match(wrapper,/onConversationStorageChange\?\.\(/,"RED: an already-open same-project tab can observe pending retirement but never refresh the authoritative conversation that settled it.");
assert.match(workspace,/resumeProjectConversation\(activeMovieProject\.id\)/,"Cross-tab settlement refresh must reload the project's persisted authoritative conversation.");
assert.match(workspace,/onConversationStorageChange=\{handleMovieConversationStorageChange\}/,"The live Movie Mentor composition does not receive cross-tab conversation settlement refresh authority.");

clearPendingTurn({ identity:reloadedIdentity, creatorTurnId:first.creatorTurnId, storage });
assert.equal(readPendingTurn({ identity:reloadedIdentity, storage }),null);
const next = resolvePendingTurn({ identity:reloadedIdentity, message:"Open the door now.", storage, cryptoImpl });
assert.equal(next.creatorTurnId,"turn-2");

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

console.log("PASS: pending creator action survives reload, becomes visible across open tabs, transport serializes same-project turns, and sibling tabs refresh the persisted conversation after settlement.");

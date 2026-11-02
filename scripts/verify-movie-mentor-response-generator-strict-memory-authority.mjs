import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import createCreatorMemory, {createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";

// RED-first: cover the default Response Generator construction, creator-switch
// reconstruction, and the executable memory-operation fallback. This is a
// production-call-path contract, not a claim that source text alone proves
// browser-lock atomicity.
const source=readFileSync(new URL("../src/components/studio/mentor/ResponseGenerator.js",import.meta.url),"utf8");
const slice=(start,end)=>{
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,`Missing Response Generator section: ${start}`);
  return source.slice(a,b);
};
const factory=slice("const resolvedMemoryFactory =","let activeMemory =");
const initial=slice("let activeMemory =","let activeMemoryCreatorId =");
const switching=slice("function ensureMemoryForContext(","async function executeMemoryOperations(");
const execution=slice("async function executeMemoryOperations(","async function applyMemoryOperations(");

// Both factory invocations must explicitly require strict shared authority,
// including when creator identity changes. An injected memory service remains
// supported, but the default may never silently create a permissive writer.
assert.match(factory,/requireSharedWriteAuthority:\s*true/,
  "RED: default Response Generator memory factory is not strict.");
assert.match(initial,/resolvedMemoryFactory\(/,
  "Initial construction must use the audited factory.");
assert.match(switching,/resolvedMemoryFactory\(/,
  "Creator switching must use the same audited factory.");
assert.match(execution,/applyMemoryInstructions\(/,
  "The executable legacy memory mutation fallback must remain visible to this court.");

// A strict Creator Memory must retain useful read-side access while denying
// an uncoordinated synchronous whole-state mutation without changing bytes.
const storage=createMemoryStorageAdapter();
const memory=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
const before=storage.getItem("iband.creator-memory");
assert.ok(memory.getState(),"Strict Creator Memory must preserve read-side access.");
assert.equal(typeof memory.readPersistedState,"function");
assert.equal(typeof memory.replaceStateWithSharedAuthority,"function");
assert.throws(()=>memory.replaceState(memory.getState()),
  error=>error?.code==="CREATOR_MEMORY_WRITE_AUTHORITY_DENIED",
  "RED: strict Creator Memory accepted an uncoordinated synchronous mutation.");
assert.equal(storage.getItem("iband.creator-memory"),before,
  "Denied synchronous mutation must leave durable bytes unchanged.");
console.log("GREEN: Response Generator initial and switched memory are strict; read-only and denied-write contracts survive.");

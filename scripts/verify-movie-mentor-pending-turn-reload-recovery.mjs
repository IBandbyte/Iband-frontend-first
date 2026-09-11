import assert from "node:assert/strict";
import fs from "node:fs";

const workspace = fs.readFileSync(new URL("../src/components/studio/CreatorWorkspace.jsx", import.meta.url), "utf8");
const conversation = fs.readFileSync(new URL("../src/components/studio/mentor/MovieMentorConversationCore.jsx", import.meta.url), "utf8");
const identity = fs.readFileSync(new URL("../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js", import.meta.url), "utf8");

// Creator-visible recovery law: an uncertain live turn may survive reload in the
// transport, but the creator action that owns it must survive too. Otherwise the
// UI can tell the creator to retry while no durable creator-visible action exists
// from which to reconstruct that retry.
assert.match(
  identity,
  /(pendingCreatorMessage|pending.*turn|unresolved.*turn)/i,
  "RED: Studio identity runtime has no durable/recoverable pending creator action contract."
);
assert.match(
  identity,
  /(getResumeSnapshot|resumeProjectConversation)[\s\S]{0,5000}(pendingCreatorMessage|pending.*turn|unresolved.*turn)/i,
  "RED: reload resume does not expose the pending creator action that owns an uncertain live turn."
);
assert.match(
  workspace,
  /resumeSnapshot[\s\S]{0,5000}(pendingCreatorMessage|pending.*turn|unresolved.*turn)/i,
  "RED: CreatorWorkspace does not restore a pending creator action after reload."
);
assert.match(
  conversation,
  /(retry|try again)[\s\S]{0,3000}(pendingCreatorMessage|pending.*turn|creatorTurnId)/i,
  "RED: creator-facing retry has no explicit ownership link to the pending live turn."
);

console.log("PASS: creator-visible pending action survives reload and remains explicitly bound to the uncertain live turn retry.");

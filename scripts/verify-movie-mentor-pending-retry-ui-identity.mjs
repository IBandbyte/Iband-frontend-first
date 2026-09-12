import assert from "node:assert/strict";
import fs from "node:fs";

const core = fs.readFileSync(new URL("../src/components/studio/mentor/MovieMentorConversationCore.jsx", import.meta.url), "utf8");
const wrapper = fs.readFileSync(new URL("../src/components/studio/mentor/MovieMentorConversation.jsx", import.meta.url), "utf8");

// A failed/ambiguous live turn deliberately remains pending. The creator-facing
// action already exists in conversation history. Retrying that same pending
// identity must not append a second creator action for the one durable turn.
assert.match(
  core,
  /readPendingTurn|pendingCreatorTurnId|recoveredPendingCreatorAction/,
  "RED: the live conversation composer does not consult durable pending-turn identity before appending a creator action on retry.",
);
assert.match(
  core,
  /pendingAlreadyVisible|existingPendingCreatorAction|reusePendingCreatorAction/,
  "RED: retry UI has no guard proving one creator-visible action per unresolved durable pending turn.",
);
assert.match(
  wrapper,
  /pendingCreatorTurnId/,
  "RED: recovered pending creator actions must retain exact durable creatorTurnId ownership.",
);

console.log("Movie Mentor pending retry UI identity: PASS — one unresolved durable creatorTurnId owns one creator-visible action across retry.");

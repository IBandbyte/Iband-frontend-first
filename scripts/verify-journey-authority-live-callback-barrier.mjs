import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const workspace = fs.readFileSync(path.join(ROOT, "src/components/studio/CreatorWorkspace.jsx"), "utf8");
const conversation = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/MovieMentorConversation.jsx"), "utf8");
const projection = fs.readFileSync(path.join(ROOT, "src/components/studio/mentor/MovieMentorJourneyProjectionRuntime.js"), "utf8");

const workspaceCallback = workspace.indexOf("const handleMovieMentorTurnResult = async (turnResult) =>");
const workspaceAwait = workspace.indexOf("await projectCommittedCreatorAuthorityIntoJourney({", workspaceCallback);
const planningAfter = workspace.indexOf("consumeTurnForJourneyPlanning(authoritativeJourney, turnResult", workspaceAwait);
assert.ok(workspaceCallback >= 0, "Workspace Mentor-turn callback must be async.");
assert.ok(workspaceAwait > workspaceCallback, "Workspace must await Journey Authority projection.");
assert.ok(planningAfter > workspaceAwait, "Journey planning must consume the committed authoritative Journey only after projection resolves.");
assert.ok(!workspace.includes("const handleMovieMentorTurnResult = (turnResult) => { const projection = projectCommittedCreatorAuthorityIntoJourney("), "Synchronous Workspace projection seam must remain quarantined.");

const turnResultBuild = conversation.indexOf("const turnResult = {");
const callbackAwait = conversation.indexOf("await onMentorTurnResult?.(turnResult);", turnResultBuild);
const mentorPublish = conversation.indexOf('onSendMessage?.({ id: createId("mentor-message")', callbackAwait);
const thinkingFinally = conversation.indexOf("finally { setLocalIsThinking(false)", mentorPublish);
assert.ok(callbackAwait > turnResultBuild, "Conversation must await the Mentor-turn integration callback.");
assert.ok(mentorPublish > callbackAwait, "Mentor response must not publish before Journey Authority integration completes.");
assert.ok(thinkingFinally > mentorPublish, "Thinking state must remain active through the authority commit barrier.");
const callbackStatements = [...conversation.matchAll(/(?:await\s+)?onMentorTurnResult\?\.\(turnResult\);/g)].map((match) => match[0]);
assert.deepEqual(callbackStatements, ["await onMentorTurnResult?.(turnResult);"], "Every live Mentor-turn callback invocation must be awaited exactly once.");

assert.ok(projection.includes("async function projectCommittedCreatorAuthorityIntoJourney"), "Live projection runtime must remain explicitly asynchronous.");
assert.ok(projection.includes("await runtime.execute({"), "Live projection runtime must await the Journey Authority execution runtime.");
assert.ok(!projection.includes("identityRuntime.persistJourney(projectId, projectedJourney)"), "Live projection must never fall back to Creator Memory Journey persistence.");

console.log("Journey Authority live callback barrier verification passed.");
console.log("- Workspace awaits authoritative creator-truth projection before planning");
console.log("- Conversation awaits Workspace integration before publishing the Mentor response");
console.log("- thinking state spans the authority commit barrier");
console.log("- live projection remains async and Creator Memory persistence stays quarantined");

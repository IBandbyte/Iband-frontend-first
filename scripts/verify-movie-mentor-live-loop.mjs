import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import createCreatorJourneyEngine from "../src/components/studio/mentor/CreatorJourneyEngine.js";
import createMovieJourneyIntelligenceBridge from "../src/components/studio/mentor/MovieJourneyIntelligenceBridge.js";

const BASE_URL = (process.env.IBAND_LIVE_BACKEND_URL || "https://iband-backend-first-1.onrender.com").replace(/\/$/, "");
const INTERPRET_URL = `${BASE_URL}/api/movie-mentor-semantic/interpret`;
const REPORT_PATH = process.env.IBAND_LIVE_LOOP_REPORT_PATH || "verification-results/movie-mentor-live-loop.json";

const journeyEngine = createCreatorJourneyEngine();
const bridge = createMovieJourneyIntelligenceBridge({ journeyEngine });
const report = { generatedAt: new Date().toISOString(), baseUrl: BASE_URL, passed: false, bridgeVersion: bridge.version, cases: [], error: null };

function writeReport() {
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function createJourney() {
  return journeyEngine.createMovieJourney({ creatorType: "video", creatorMode: "ai-movie", creatorJourney: "guide" });
}

async function readJson(response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : null; } catch { return { raw: text }; }
}

async function semantic(message, context = {}, name = "case") {
  const response = await fetch(INTERPRET_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ input: { message }, context, options: { metadata: { verificationCase: `frontend-live-loop:${name}` } } }),
  });
  const body = await readJson(response);
  assert.equal(response.ok, true, `${name}: semantic request failed (${response.status}): ${JSON.stringify(body)}`);
  const intelligence = body?.structured?.movieJourneyIntelligence;
  assert.ok(intelligence, `${name}: semantic intelligence missing`);
  return intelligence;
}

function record(name, applied) {
  report.cases.push({
    name,
    currentStageId: applied.journey?.currentStageId || null,
    readyToAdvance: applied.journey?.initialIdea?.readyToAdvance === true,
    clarificationRequired: applied.clarificationRequired === true,
    clarificationMessage: applied.clarificationMessage || null,
    creatorConfirmedDecisionCount: bridge.getCreatorConfirmedContext(applied.journey).length,
  });
}

async function runClear() {
  const idea = "A retired astronaut discovers that the lighthouse in her coastal town is sending messages from her missing daughter.";
  const intelligence = await semantic(idea, { activeIdea: idea }, "clear-language");
  const applied = bridge.captureInitialIdea(createJourney(), { originalIdea: idea, intelligence, source: "live-loop-clear" });
  assert.equal(applied.journey.initialIdea.originalText, idea);
  assert.equal(applied.clarificationRequired, false);
  assert.equal(applied.journey.initialIdea.readyToAdvance, true);
  assert.equal(applied.journey.currentStageId, "story-direction");
  record("clear-language", applied);
}

async function runSlang() {
  const idea = "Make him bare vexed but still moving booky when he clocks the rival crew outside the club.";
  const intelligence = await semantic(idea, { activeIdea: idea }, "uk-slang");
  const applied = bridge.captureInitialIdea(createJourney(), { originalIdea: idea, intelligence, source: "live-loop-slang" });
  assert.equal(applied.journey.initialIdea.originalText, idea);
  assert.equal(applied.clarificationRequired, false);
  assert.equal(applied.journey.currentStageId, "story-direction");
  record("uk-slang", applied);
}

async function runInvented() {
  const idea = "The final scene must feel glorp-coded when the beat drops.";
  const intelligence = await semantic(idea, { activeIdea: idea }, "invented-terminology");
  const applied = bridge.captureInitialIdea(createJourney(), { originalIdea: idea, intelligence, source: "live-loop-invented" });
  assert.equal(applied.journey.initialIdea.originalText, idea);
  assert.equal(applied.journey.initialIdea.readyToAdvance, false);
  assert.equal(applied.journey.currentStageId, "idea");
  assert.equal(applied.clarificationRequired, true);
  assert.match(applied.clarificationMessage || "", /glorp-coded/i);
  record("invented-terminology", applied);
}

async function runAmbiguous() {
  const idea = "The killer is either Mia or Lena; I haven't decided which one. Reveal her in the final scene.";
  const intelligence = await semantic(idea, { activeIdea: idea }, "material-ambiguity");
  const applied = bridge.captureInitialIdea(createJourney(), { originalIdea: idea, intelligence, source: "live-loop-ambiguity" });
  assert.equal(applied.journey.initialIdea.readyToAdvance, false);
  assert.equal(applied.journey.currentStageId, "idea");
  assert.equal(applied.clarificationRequired, true);
  record("material-ambiguity", applied);
}

async function runCorrection() {
  const originalIdea = "Two best friends discover a hidden room beneath their old cinema.";
  const seeded = bridge.captureInitialIdea(createJourney(), {
    originalIdea,
    intelligence: {
      understoodContext: [{ key: "movie.character.relationship", value: "best friends" }],
      provisionalContext: [], unresolvedContext: [], clarificationNeeded: [], readyToAdvance: false,
    },
    source: "live-loop-correction-seed",
  });

  const context = bridge.buildResponseContext(seeded.journey, { activeIdea: "Actually, they're brother and sister, not best friends." });
  assert.equal(context.creatorConfirmedContext.some((item) => item.key === "movie.character.relationship" && item.value === "best friends"), true);

  const correctionMessage = "Actually, they're brother and sister, not best friends.";
  const intelligence = await semantic(correctionMessage, context, "creator-correction");
  const applied = bridge.captureInitialIdea(seeded.journey, {
    originalIdea: originalIdea,
    intelligence,
    source: "live-loop-correction-apply",
  });

  const decision = journeyEngine.getActiveDecision(applied.journey, "movie.character.relationship");
  assert.equal(decision?.authority, "creator");
  assert.match(String(decision?.value || ""), /brother and sister/i);
  assert.equal(bridge.getCreatorConfirmedContext(applied.journey).some((item) => item.key === "movie.character.relationship" && /best friends/i.test(String(item.value || ""))), false);
  record("creator-correction", applied);
}

async function run() {
  await runClear();
  await runSlang();
  await runInvented();
  await runAmbiguous();
  await runCorrection();
  report.passed = true;
  console.log("Live Movie Mentor semantic → Bridge → CreatorJourneyEngine verification passed.");
}

try { await run(); }
catch (error) {
  report.error = { message: error instanceof Error ? error.message : String(error), code: error?.code || null };
  console.error(`Live Movie Mentor journey loop verification failed: ${report.error.message}`);
  process.exitCode = 1;
}
finally { writeReport(); }

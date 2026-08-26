import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveMovieMentorJourneyRecommendation,
} from "../src/components/studio/mentor/MovieMentorJourneyRecommendationPresenter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function baseEvidence(overrides = {}) {
  return {
    contractVersion: "1.0.0",
    authority: "advisory-only",
    creatorConfirmed: false,
    mayCreateCanon: false,
    mayAdvanceJourney: false,
    semanticDirection: {
      nextAction: { label: "Explore Maya's objective after the escape" },
    },
    recommendation: {
      recommendedStageId: "story-direction",
      recommendedTaskId: "character-objective",
      reasonCodes: [
        "story-advice-considered",
        "character-advice-considered",
        "continuity-advice-considered",
        "creator-override-applied",
      ],
      confidence: 0.88,
      alternatives: [
        { key: "escape-detail", label: "Develop the escape itself" },
        { key: "pursuit", label: "Explore the pursuit" },
      ],
    },
    clarification: { required: false, reasons: [] },
    provenance: {
      source: "MovieMentorConversation",
      sourceAgents: ["story", "character", "continuity"],
      turnRevision: 12,
    },
    ...overrides,
  };
}

{
  const result = resolveMovieMentorJourneyRecommendation(null);
  assert.equal(result.mode, "no-recommendation");
  assert.equal(result.authority, "advisory-only");
  assert.equal(result.creatorConfirmed, false);
  assert.equal(result.mayCreateCanon, false);
  assert.equal(result.mayAdvanceJourney, false);
  assert.equal(result.creatorChoiceRequired, true);
}

{
  const evidence = baseEvidence();
  const before = clone(evidence);
  const result = resolveMovieMentorJourneyRecommendation(evidence);

  assert.deepEqual(evidence, before, "presenter must not mutate Journey planning evidence");
  assert.equal(result.mode, "recommendation");
  assert.equal(result.authority, "advisory-only");
  assert.equal(result.creatorConfirmed, false);
  assert.equal(result.mayCreateCanon, false);
  assert.equal(result.mayAdvanceJourney, false);
  assert.equal(result.creatorChoiceRequired, true);
  assert.match(result.message, /most useful next step/i);
  assert.match(result.explanation, /you’re still in control/i);
  assert.equal(result.recommendedNextStep, "Explore Maya's objective after the escape");
  assert.deepEqual(result.alternatives, ["Develop the escape itself", "Explore the pursuit"]);
  assert.equal(result.provenance.recommendedStageId, "story-direction");
  assert.equal(result.provenance.recommendedTaskId, "character-objective");
}

{
  const evidence = baseEvidence({
    clarification: {
      required: true,
      reasons: [
        {
          type: "semantic",
          value: { question: "When you say she leaves, do you mean Maya leaves the city?" },
        },
      ],
    },
  });
  const result = resolveMovieMentorJourneyRecommendation(evidence);

  assert.equal(result.mode, "clarification");
  assert.match(result.message, /Maya leaves the city/);
  assert.equal(result.recommendedNextStep, null);
  assert.deepEqual(result.alternatives, []);
  assert.equal(result.mayAdvanceJourney, false);
  assert.equal(result.mayCreateCanon, false);
}

{
  const evidence = baseEvidence({ recommendation: null });
  const result = resolveMovieMentorJourneyRecommendation(evidence);
  assert.equal(result.mode, "no-recommendation");
  assert.equal(result.message, null);
  assert.equal(result.mayAdvanceJourney, false);
}

{
  const aiMentorSource = fs.readFileSync(
    path.join(repoRoot, "src/components/studio/AiMentor.jsx"),
    "utf8"
  );
  const workspaceSource = fs.readFileSync(
    path.join(repoRoot, "src/components/studio/CreatorWorkspace.jsx"),
    "utf8"
  );
  const presenterSource = fs.readFileSync(
    path.join(
      repoRoot,
      "src/components/studio/mentor/MovieMentorJourneyRecommendationPresenter.js"
    ),
    "utf8"
  );

  assert.match(aiMentorSource, /resolveMovieMentorJourneyRecommendation/);
  assert.match(aiMentorSource, /mentorContext\?\.journeyPlanningEvidence/);
  assert.match(aiMentorSource, /Your choice decides what happens next\./);
  assert.match(workspaceSource, /journeyPlanningEvidence:\s*movieJourneyPlanningEvidence/);

  for (const forbidden of [
    "setProjectJourney(",
    "persistMovieJourney(",
    "captureCreatorDecision(",
    "advanceStage(",
    "setCurrentStage",
  ]) {
    assert.equal(
      presenterSource.includes(forbidden),
      false,
      `pure presenter must not contain mutation authority: ${forbidden}`
    );
  }
}

console.log("Movie Mentor Journey Recommendation Presenter: GREEN");

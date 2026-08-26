const MOVIE_MENTOR_JOURNEY_RECOMMENDATION_PRESENTER_VERSION = "1.0.0";
const MENTOR_JOURNEY_RECOMMENDATION_CONTRACT_VERSION = "1.0.0";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cloneValue(value) {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function humaniseId(value) {
  const text = cleanString(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

function describeAlternative(item) {
  if (!item || typeof item !== "object") return null;
  const label =
    cleanString(item.label) ||
    cleanString(item.title) ||
    cleanString(item.description) ||
    cleanString(item.text) ||
    cleanString(item.key);

  if (label) return label;
  if (typeof item.value === "string") return cleanString(item.value) || null;
  return null;
}

function buildClarificationMessage(planningEvidence) {
  const reasons = asArray(planningEvidence?.clarification?.reasons);

  for (const reason of reasons) {
    const value = reason?.value;
    if (value && typeof value === "object") {
      const question =
        cleanString(value.question) ||
        cleanString(value.clarificationQuestion) ||
        cleanString(value.message);
      if (question) return question;
    }
  }

  return "I want to make sure I follow your intention before suggesting the next step. Can you clarify that part for me?";
}

function buildRecommendationMessage(planningEvidence) {
  const recommendation = planningEvidence?.recommendation;
  if (!recommendation || typeof recommendation !== "object") return null;

  const semanticNextAction = planningEvidence?.semanticDirection?.nextAction;
  const nextActionText =
    cleanString(semanticNextAction?.label) ||
    cleanString(semanticNextAction?.text) ||
    cleanString(semanticNextAction?.description);

  const taskLabel = humaniseId(recommendation.recommendedTaskId);
  const stageLabel = humaniseId(recommendation.recommendedStageId);
  const nextStep = nextActionText || taskLabel || stageLabel;

  if (!nextStep) return null;

  return `I think the most useful next step is ${nextStep.charAt(0).toLowerCase()}${nextStep.slice(1)}.`;
}

function buildExplanation(planningEvidence) {
  const reasons = asArray(planningEvidence?.recommendation?.reasonCodes);
  const creatorOverrideApplied = reasons.includes("creator-override-applied");
  const continuityConsidered = reasons.includes("continuity-advice-considered");
  const storyConsidered = reasons.includes("story-advice-considered");
  const characterConsidered = reasons.includes("character-advice-considered");

  const clauses = [];
  if (creatorOverrideApplied) clauses.push("your confirmed choices remain the starting point");
  if (storyConsidered && characterConsidered) clauses.push("the story and character analysis support that direction");
  else if (storyConsidered) clauses.push("the story analysis supports that direction");
  else if (characterConsidered) clauses.push("the character analysis supports that direction");
  if (continuityConsidered) clauses.push("it also fits the current continuity");

  if (!clauses.length) {
    return "It is only a recommendation, so you can stay where you are or choose a different direction.";
  }

  const first = clauses[0];
  const rest = clauses.slice(1);
  const reasonText = rest.length
    ? `${first}, ${rest.slice(0, -1).join(", ")}${rest.length > 1 ? "," : ""} and ${rest[rest.length - 1]}`
    : first;

  return `I’m suggesting it because ${reasonText}. You’re still in control of what we do next.`;
}

function resolveMovieMentorJourneyRecommendation(planningEvidence) {
  const evidence = planningEvidence && typeof planningEvidence === "object"
    ? planningEvidence
    : null;

  const base = {
    contractVersion: MENTOR_JOURNEY_RECOMMENDATION_CONTRACT_VERSION,
    presenterVersion: MOVIE_MENTOR_JOURNEY_RECOMMENDATION_PRESENTER_VERSION,
    authority: "advisory-only",
    creatorConfirmed: false,
    mayCreateCanon: false,
    mayAdvanceJourney: false,
    creatorChoiceRequired: true,
  };

  if (!evidence) {
    return {
      ...base,
      mode: "no-recommendation",
      message: null,
      recommendedNextStep: null,
      explanation: null,
      alternatives: [],
      provenance: null,
    };
  }

  const provenance = {
    planningContractVersion: cleanString(evidence.contractVersion) || null,
    recommendedStageId: cleanString(evidence?.recommendation?.recommendedStageId) || null,
    recommendedTaskId: cleanString(evidence?.recommendation?.recommendedTaskId) || null,
    sourceEvidence: cloneValue(evidence.provenance || null),
  };

  if (evidence?.clarification?.required === true) {
    return {
      ...base,
      mode: "clarification",
      message: buildClarificationMessage(evidence),
      recommendedNextStep: null,
      explanation: "I won’t recommend or advance anything until your meaning is clear.",
      alternatives: [],
      provenance,
    };
  }

  const message = buildRecommendationMessage(evidence);
  if (!message) {
    return {
      ...base,
      mode: "no-recommendation",
      message: null,
      recommendedNextStep: null,
      explanation: null,
      alternatives: [],
      provenance,
    };
  }

  const alternatives = asArray(evidence?.recommendation?.alternatives)
    .map(describeAlternative)
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
    .slice(0, 3);

  return {
    ...base,
    mode: "recommendation",
    message,
    recommendedNextStep:
      cleanString(evidence?.semanticDirection?.nextAction?.label) ||
      cleanString(evidence?.semanticDirection?.nextAction?.text) ||
      humaniseId(evidence?.recommendation?.recommendedTaskId) ||
      humaniseId(evidence?.recommendation?.recommendedStageId) ||
      null,
    explanation: buildExplanation(evidence),
    alternatives,
    provenance,
  };
}

export {
  MOVIE_MENTOR_JOURNEY_RECOMMENDATION_PRESENTER_VERSION,
  MENTOR_JOURNEY_RECOMMENDATION_CONTRACT_VERSION,
  resolveMovieMentorJourneyRecommendation,
};

export default resolveMovieMentorJourneyRecommendation;

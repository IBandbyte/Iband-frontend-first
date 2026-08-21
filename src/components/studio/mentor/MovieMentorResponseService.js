import createResponseGenerator from "./ResponseGenerator";

const MOVIE_MENTOR_RESPONSE_SERVICE_VERSION = "1.1.0";

const responseGenerator = createResponseGenerator();

const ADVANCE_ACTIONS = new Set([
  "move-to-creation",
  "move-to-next-task",
  "yield-to-execution",
]);

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function cloneValue(value) {
  if (value === undefined) return undefined;

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function getStructuredMovieIntelligence(result) {
  const structured = result?.response?.structured;
  const providerMetadata = result?.provider?.metadata;

  const candidate =
    structured?.movieJourneyIntelligence ||
    structured?.journeyIntelligence ||
    structured?.creatorJourneyIntelligence ||
    providerMetadata?.movieJourneyIntelligence ||
    providerMetadata?.journeyIntelligence ||
    null;

  return candidate && typeof candidate === "object" ? candidate : null;
}

function getAdaptiveAction(result) {
  return cleanString(
    result?.adaptivePlan?.primaryAction?.action ||
      result?.blueprint?.action ||
      ""
  );
}

function getQuestionPolicy(result) {
  return cleanString(
    result?.adaptivePlan?.behaviour?.questionPolicy?.policy ||
      result?.adaptivePlan?.behaviour?.questionPolicy ||
      ""
  );
}

function adaptivePlanRequiresMeaningClarification(result) {
  const action = getAdaptiveAction(result);

  return (
    action.includes("clarify") ||
    result?.diagnostics?.contextSnapshot?.creatorAppearsConfused === true
  );
}

function adaptivePlanIsReadyToAdvance(result) {
  const action = getAdaptiveAction(result);
  const questionPolicy = getQuestionPolicy(result);

  if (questionPolicy === "one-required") {
    return false;
  }

  return ADVANCE_ACTIONS.has(action);
}

function createSafeMovieJourneyIntelligence(result, request = {}) {
  const providerIntelligence = getStructuredMovieIntelligence(result);

  if (providerIntelligence) {
    return {
      understoodContext: asArray(providerIntelligence.understoodContext),
      provisionalContext: asArray(providerIntelligence.provisionalContext),
      unresolvedContext: asArray(providerIntelligence.unresolvedContext),
      clarificationNeeded: asArray(providerIntelligence.clarificationNeeded),
      readyToAdvance: providerIntelligence.readyToAdvance === true,
      recommendedStageId:
        cleanString(providerIntelligence.recommendedStageId) ||
        "story-direction",
      recommendedTaskId:
        cleanString(providerIntelligence.recommendedTaskId) || null,
      nextAction:
        providerIntelligence.nextAction &&
        typeof providerIntelligence.nextAction === "object"
          ? cloneValue(providerIntelligence.nextAction)
          : null,
      resumeNote: cleanString(providerIntelligence.resumeNote) || null,
      metadata: {
        ...(providerIntelligence.metadata || {}),
        source: "response-generator-provider-intelligence",
        serviceVersion: MOVIE_MENTOR_RESPONSE_SERVICE_VERSION,
        semanticInterpretationApplied: true,
      },
    };
  }

  const originalIdea = cleanString(request.idea);
  const clarificationRequired =
    adaptivePlanRequiresMeaningClarification(result);
  const readyToAdvance =
    Boolean(originalIdea) &&
    !clarificationRequired &&
    adaptivePlanIsReadyToAdvance(result);
  const action = getAdaptiveAction(result);
  const questionPolicy = getQuestionPolicy(result);

  return {
    understoodContext: [],
    provisionalContext: [],
    unresolvedContext: [],
    clarificationNeeded: clarificationRequired
      ? [
          {
            key: "movie.idea.meaning",
            expression: null,
            question:
              "I want to make sure I understand what you mean before we build on it. Can you explain that part a little further?",
            reason:
              "Adaptive Mentor indicates that meaning requires clarification before the movie journey advances.",
            material: true,
          },
        ]
      : [],
    readyToAdvance,
    recommendedStageId: "story-direction",
    recommendedTaskId: null,
    nextAction: null,
    resumeNote: readyToAdvance
      ? "Adaptive Mentor has explicitly cleared the initial movie idea to continue into story direction without treating unstated details as creator decisions."
      : "The creator's original idea is preserved. Keep working in the Idea stage until Mentor intelligence explicitly confirms that it is safe to advance.",
    metadata: {
      source: "adaptive-mentor-safe-fallback",
      serviceVersion: MOVIE_MENTOR_RESPONSE_SERVICE_VERSION,
      semanticInterpretationApplied: false,
      adaptiveAction: action || null,
      questionPolicy: questionPolicy || null,
      explicitAdvanceSignalRequired: true,
    },
  };
}

async function generateMovieMentorResponse(request = {}) {
  const idea = cleanString(request.idea);
  const movieJourneyContext =
    request.movieJourneyContext && typeof request.movieJourneyContext === "object"
      ? request.movieJourneyContext
      : {};

  const context = {
    ...cloneValue(movieJourneyContext),
    creatorType: request.creatorType || movieJourneyContext.creatorType || "video",
    creatorJourney:
      request.creatorJourney || movieJourneyContext.creatorJourney || "guide",
    conversationMode:
      request.creatorMode || movieJourneyContext.conversationMode || "ai-movie",
    activeIdea: idea || movieJourneyContext.activeIdea || null,
    projectJourney:
      cloneValue(request.projectJourneySnapshot) ||
      cloneValue(movieJourneyContext.projectJourney) ||
      null,
    projectJourneyOrientation:
      cloneValue(request.projectJourneyOrientation) ||
      cloneValue(movieJourneyContext.projectJourneyOrientation) ||
      null,
  };

  const result = await responseGenerator.generateResponse({
    message: idea,
    context,
    options: {
      includeDiagnostics: true,
      includeSpecialistPlans: false,
      includeBlueprint: true,
      includeCommunicationPlan: true,
      metadata: {
        creatorMode: request.creatorMode || "ai-movie",
        movieJourneyIntelligenceRequested: true,
        movieJourneyIntelligenceContract: {
          fields: [
            "understoodContext",
            "provisionalContext",
            "unresolvedContext",
            "clarificationNeeded",
            "readyToAdvance",
            "recommendedStageId",
            "recommendedTaskId",
            "nextAction",
            "resumeNote",
          ],
          rule:
            "Return structured movie journey intelligence only when meaning is supported. Never invent creator decisions; material ambiguity requires clarification and advancement requires an explicit safe signal.",
        },
      },
    },
  });

  const movieJourneyIntelligence = createSafeMovieJourneyIntelligence(
    result,
    request
  );

  const text = cleanString(result?.response?.text);

  return {
    ...result,
    prompt: text || idea,
    content: text || idea,
    preview: text || idea,
    movieJourneyIntelligence,
    metadata: {
      ...(result?.metadata || {}),
      movieJourneyIntelligence,
      movieMentorResponseServiceVersion:
        MOVIE_MENTOR_RESPONSE_SERVICE_VERSION,
    },
  };
}

export {
  MOVIE_MENTOR_RESPONSE_SERVICE_VERSION,
  createSafeMovieJourneyIntelligence,
  generateMovieMentorResponse,
};

export default generateMovieMentorResponse;
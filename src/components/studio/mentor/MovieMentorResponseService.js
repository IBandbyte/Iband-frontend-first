import createResponseGenerator from "./ResponseGenerator";

const MOVIE_MENTOR_RESPONSE_SERVICE_VERSION = "1.0.0";

const responseGenerator = createResponseGenerator();

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

function adaptivePlanRequiresClarification(result) {
  const action = cleanString(result?.adaptivePlan?.primaryAction?.action);
  const questionPolicy = cleanString(
    result?.adaptivePlan?.behaviour?.questionPolicy?.policy
  );

  return (
    action.includes("clarify") ||
    questionPolicy === "one-required" ||
    result?.diagnostics?.contextSnapshot?.creatorAppearsConfused === true
  );
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
      },
    };
  }

  const originalIdea = cleanString(request.idea);
  const clarificationRequired = adaptivePlanRequiresClarification(result);

  return {
    understoodContext: [],
    provisionalContext: [],
    unresolvedContext: [],
    clarificationNeeded: clarificationRequired
      ? [
          {
            key: "movie.idea.meaning",
            expression: originalIdea || null,
            question:
              "I want to make sure I understand your idea before we build on it. Can you explain that part a little further?",
            reason:
              "Adaptive Mentor requires clarification before the movie journey advances.",
            material: true,
          },
        ]
      : [],
    readyToAdvance: Boolean(originalIdea) && !clarificationRequired,
    recommendedStageId: "story-direction",
    recommendedTaskId: null,
    nextAction: null,
    resumeNote:
      Boolean(originalIdea) && !clarificationRequired
        ? "Initial movie idea captured. Continue into story direction without treating unstated details as creator decisions."
        : null,
    metadata: {
      source: "adaptive-mentor-safe-fallback",
      serviceVersion: MOVIE_MENTOR_RESPONSE_SERVICE_VERSION,
      semanticInterpretationApplied: false,
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
            "Return structured movie journey intelligence only when meaning is supported. Never invent creator decisions; material ambiguity requires clarification.",
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

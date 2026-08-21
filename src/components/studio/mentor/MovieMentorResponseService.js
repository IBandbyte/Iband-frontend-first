import createResponseGenerator from "./ResponseGenerator";
import createMovieSemanticResponseProvider from "./MovieSemanticResponseProvider";
import createMovieMentorAgentPlan from "./MovieMentorAgentOrchestrator";

const MOVIE_MENTOR_RESPONSE_SERVICE_VERSION = "1.4.0";

const semanticResponseProvider = createMovieSemanticResponseProvider();
const responseGenerator = createResponseGenerator({ responseProvider: semanticResponseProvider });

function cleanString(value) { return typeof value === "string" ? value.trim() : ""; }
function asArray(value) { return Array.isArray(value) ? value : []; }
function cloneValue(value) { if (value === undefined) return undefined; try { return JSON.parse(JSON.stringify(value)); } catch { return value; } }

function getStructuredMovieIntelligence(result) {
  const structured = result?.response?.structured;
  const providerMetadata = result?.provider?.metadata;
  const candidate = structured?.movieJourneyIntelligence || structured?.journeyIntelligence || structured?.creatorJourneyIntelligence || providerMetadata?.movieJourneyIntelligence || providerMetadata?.journeyIntelligence || null;
  return candidate && typeof candidate === "object" ? candidate : null;
}

function getAdaptiveAction(result) {
  return cleanString(result?.adaptivePlan?.primaryAction?.action || result?.blueprint?.action || "");
}

function getQuestionPolicy(result) {
  return cleanString(result?.adaptivePlan?.behaviour?.questionPolicy?.policy || result?.adaptivePlan?.behaviour?.questionPolicy || "");
}

function adaptivePlanRequiresMeaningClarification(result) {
  const action = getAdaptiveAction(result);
  return action.includes("clarify") || result?.diagnostics?.contextSnapshot?.creatorAppearsConfused === true;
}

function createSafeMovieJourneyIntelligence(result, request = {}) {
  const providerIntelligence = getStructuredMovieIntelligence(result);

  if (providerIntelligence) {
    const clarificationNeeded = asArray(providerIntelligence.clarificationNeeded);
    const materialClarificationRequired = clarificationNeeded.some((item) => item?.material !== false);
    return {
      understoodContext: asArray(providerIntelligence.understoodContext),
      provisionalContext: asArray(providerIntelligence.provisionalContext),
      unresolvedContext: asArray(providerIntelligence.unresolvedContext),
      clarificationNeeded,
      readyToAdvance: providerIntelligence.readyToAdvance === true && !materialClarificationRequired,
      recommendedStageId: cleanString(providerIntelligence.recommendedStageId) || "story-direction",
      recommendedTaskId: cleanString(providerIntelligence.recommendedTaskId) || null,
      nextAction: providerIntelligence.nextAction && typeof providerIntelligence.nextAction === "object" ? cloneValue(providerIntelligence.nextAction) : null,
      resumeNote: cleanString(providerIntelligence.resumeNote) || null,
      metadata: {
        ...(providerIntelligence.metadata || {}),
        source: "response-generator-provider-intelligence",
        serviceVersion: MOVIE_MENTOR_RESPONSE_SERVICE_VERSION,
        semanticInterpretationAvailable: true,
        semanticInterpretationApplied: true,
        materialClarificationOverridesAdvance: true,
      },
    };
  }

  const originalIdea = cleanString(request.idea);
  const clarificationRequired = adaptivePlanRequiresMeaningClarification(result);
  const action = getAdaptiveAction(result);
  const questionPolicy = getQuestionPolicy(result);

  return {
    understoodContext: [],
    provisionalContext: [],
    unresolvedContext: [],
    clarificationNeeded: clarificationRequired ? [{
      key: "movie.idea.meaning",
      expression: null,
      question: "I want to make sure I understand what you mean before we build on it. Can you explain that part a little further?",
      reason: "Adaptive Mentor indicates that meaning requires clarification before the movie journey advances.",
      material: true,
    }] : [],
    readyToAdvance: false,
    recommendedStageId: "story-direction",
    recommendedTaskId: null,
    nextAction: null,
    resumeNote: originalIdea ? "The creator's original idea is preserved. Remain in the Idea stage until semantic Mentor intelligence explicitly confirms that the meaning is understood well enough to advance." : null,
    metadata: {
      source: "adaptive-mentor-safe-fallback",
      serviceVersion: MOVIE_MENTOR_RESPONSE_SERVICE_VERSION,
      semanticInterpretationAvailable: false,
      semanticInterpretationApplied: false,
      adaptiveAction: action || null,
      questionPolicy: questionPolicy || null,
      adaptiveAdvanceSignalObserved: ["move-to-creation", "move-to-next-task", "yield-to-execution"].includes(action),
      blockedFromAdvancingWithoutSemanticIntelligence: true,
    },
  };
}

function createSpecialistAgentPlan({ request = {}, context = {}, movieJourneyIntelligence = {} } = {}) {
  return createMovieMentorAgentPlan({
    stageId: cleanString(movieJourneyIntelligence.recommendedStageId) || cleanString(context.activeStage) || "idea",
    taskId: cleanString(movieJourneyIntelligence.recommendedTaskId) || cleanString(context.nextTask) || null,
    creatorMessage: cleanString(request.idea),
    semanticIntelligence: movieJourneyIntelligence,
    creatorConfirmedContext: cloneValue(context.creatorConfirmedContext || []),
    projectJourney: cloneValue(context.projectJourney || null),
  });
}

async function generateMovieMentorResponse(request = {}) {
  const idea = cleanString(request.idea);
  const movieJourneyContext = request.movieJourneyContext && typeof request.movieJourneyContext === "object" ? request.movieJourneyContext : {};

  const context = {
    ...cloneValue(movieJourneyContext),
    creatorType: request.creatorType || movieJourneyContext.creatorType || "video",
    creatorJourney: request.creatorJourney || movieJourneyContext.creatorJourney || "guide",
    conversationMode: request.creatorMode || movieJourneyContext.conversationMode || "ai-movie",
    activeIdea: idea || movieJourneyContext.activeIdea || null,
    projectJourney: cloneValue(request.projectJourneySnapshot) || cloneValue(movieJourneyContext.projectJourney) || null,
    projectJourneyOrientation: cloneValue(request.projectJourneyOrientation) || cloneValue(movieJourneyContext.projectJourneyOrientation) || null,
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
        semanticProvider: "movie-mentor-semantic-gateway",
        specialistAgentOrchestrationRequested: true,
        movieJourneyIntelligenceContract: {
          fields: ["understoodContext", "provisionalContext", "unresolvedContext", "clarificationNeeded", "readyToAdvance", "recommendedStageId", "recommendedTaskId", "nextAction", "resumeNote"],
          rule: "Return structured movie journey intelligence only when meaning is supported. Never invent creator decisions; material ambiguity requires clarification. Advancement requires explicit semantic intelligence, not merely a deterministic progression signal.",
        },
      },
    },
  });

  const movieJourneyIntelligence = createSafeMovieJourneyIntelligence(result, request);
  const specialistAgentPlan = createSpecialistAgentPlan({ request, context, movieJourneyIntelligence });
  const text = cleanString(result?.response?.text);

  return {
    ...result,
    prompt: text || idea,
    content: text || idea,
    preview: text || idea,
    movieJourneyIntelligence,
    specialistAgentPlan,
    metadata: {
      ...(result?.metadata || {}),
      movieJourneyIntelligence,
      specialistAgentPlan,
      movieMentorResponseServiceVersion: MOVIE_MENTOR_RESPONSE_SERVICE_VERSION,
      semanticResponseProviderVersion: semanticResponseProvider.version || null,
      specialistAgentsAreAdvisoryOnly: true,
      specialistAgentsMayAdvanceJourney: false,
      specialistAgentsSpeakThroughMentorOnly: true,
    },
  };
}

export {
  MOVIE_MENTOR_RESPONSE_SERVICE_VERSION,
  createSafeMovieJourneyIntelligence,
  createSpecialistAgentPlan,
  generateMovieMentorResponse,
};

export default generateMovieMentorResponse;

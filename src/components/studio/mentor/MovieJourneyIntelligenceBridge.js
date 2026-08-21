/**
 * Movie Journey Intelligence Bridge
 * ------------------------------------------------------------
 * Connects creator-facing Movie Mentor input to the canonical
 * CreatorJourneyEngine project state without moving language
 * interpretation into the journey engine itself.
 *
 * Responsibilities:
 * - Preserve the creator's original movie idea immediately.
 * - Accept structured Mentor intelligence when it becomes available.
 * - Apply understood, provisional, unresolved and clarification state.
 * - Keep materially ambiguous meaning from silently becoming truth.
 * - Build a clean journey context for ResponseGenerator/provider layers.
 * - Expose active creator-confirmed decisions to semantic intelligence.
 * - Return updated journey, snapshot, orientation and creator-facing
 *   clarification guidance as one integration result.
 *
 * This bridge DOES NOT:
 * - Guess what unfamiliar language means.
 * - Invent creator decisions.
 * - Call a language model.
 * - Own persistence.
 * - Generate final Mentor wording beyond safe clarification fallback text.
 */

import createCreatorJourneyEngine from "./CreatorJourneyEngine.js";

const MOVIE_JOURNEY_INTELLIGENCE_BRIDGE_VERSION = "1.2.1";

const DEFAULT_CLARIFICATION_MESSAGE =
  "I’m sorry, I lost you there. Can you explain what you mean a little further?";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cloneValue(value) {
  if (value === undefined) {
    return undefined;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normaliseIntelligence(input = {}) {
  const source =
    input && typeof input === "object"
      ? input
      : {};

  return {
    understoodContext: asArray(source.understoodContext),
    provisionalContext: asArray(source.provisionalContext),
    unresolvedContext: asArray(source.unresolvedContext),
    clarificationNeeded: asArray(source.clarificationNeeded),
    readyToAdvance: source.readyToAdvance === true,
    recommendedStageId:
      cleanString(source.recommendedStageId) || "story-direction",
    recommendedTaskId:
      cleanString(source.recommendedTaskId) || null,
    nextAction:
      source.nextAction && typeof source.nextAction === "object"
        ? cloneValue(source.nextAction)
        : null,
    resumeNote: cleanString(source.resumeNote) || null,
    metadata:
      source.metadata && typeof source.metadata === "object"
        ? cloneValue(source.metadata)
        : {},
  };
}

function extractGenerationIntelligence(result) {
  if (!result || typeof result !== "object") {
    return null;
  }

  const candidate =
    result.movieJourneyIntelligence ||
    result.journeyIntelligence ||
    result.creatorJourneyIntelligence ||
    result?.metadata?.movieJourneyIntelligence ||
    result?.metadata?.journeyIntelligence ||
    null;

  return candidate && typeof candidate === "object"
    ? candidate
    : null;
}

function getClarificationMessage(orientation) {
  const clarification =
    orientation?.present?.clarifications?.[0] || null;

  if (!clarification) {
    return null;
  }

  const explicitQuestion = cleanString(clarification.question);

  if (explicitQuestion) {
    return explicitQuestion;
  }

  const expression = cleanString(clarification.expression);

  if (expression) {
    return `I’m sorry, I lost you at “${expression}”. Can you explain what you mean by that?`;
  }

  return DEFAULT_CLARIFICATION_MESSAGE;
}

function getCreatorConfirmedContext(journey) {
  return asArray(journey?.decisions)
    .filter(
      (decision) =>
        decision?.authority === "creator" &&
        decision?.status === "active" &&
        cleanString(decision?.key)
    )
    .map((decision) => ({
      key: cleanString(decision.key),
      value: cloneValue(decision.value),
      stageId: cleanString(decision.stageId) || null,
      sceneId: cleanString(decision.sceneId) || null,
      reason: cleanString(decision.reason) || null,
      createdAt: decision.createdAt || null,
      metadata:
        decision?.metadata && typeof decision.metadata === "object"
          ? cloneValue(decision.metadata)
          : {},
      authority: "creator",
    }));
}

function createMovieJourneyIntelligenceBridge({
  journeyEngine = null,
} = {}) {
  const engine =
    journeyEngine || createCreatorJourneyEngine();

  function describeJourney(journey) {
    if (!journey) {
      return {
        journey: null,
        snapshot: null,
        orientation: null,
        clarificationRequired: false,
        clarificationMessage: null,
      };
    }

    const snapshot = engine.createSnapshot(journey);
    const orientation = engine.getOrientation(journey);
    const clarificationRequired =
      orientation?.present?.clarificationRequired === true;

    return {
      journey,
      snapshot,
      orientation,
      clarificationRequired,
      clarificationMessage:
        clarificationRequired
          ? getClarificationMessage(orientation)
          : null,
    };
  }

  function captureInitialIdea(
    journey,
    {
      originalIdea,
      intelligence = {},
      source = "CreatorWorkspace",
      metadata = {},
    } = {}
  ) {
    const idea = cleanString(originalIdea);

    if (!journey || !idea) {
      return describeJourney(journey);
    }

    const structured = normaliseIntelligence(intelligence);

    const nextJourney = engine.captureInitialMovieIdea(journey, {
      originalIdea: idea,
      understoodContext: structured.understoodContext,
      provisionalContext: structured.provisionalContext,
      unresolvedContext: structured.unresolvedContext,
      clarificationNeeded: structured.clarificationNeeded,
      readyToAdvance: structured.readyToAdvance,
      recommendedStageId: structured.recommendedStageId,
      recommendedTaskId: structured.recommendedTaskId,
      nextAction: structured.nextAction,
      resumeNote: structured.resumeNote,
      metadata: {
        ...structured.metadata,
        ...cloneValue(metadata),
        bridgeVersion: MOVIE_JOURNEY_INTELLIGENCE_BRIDGE_VERSION,
        source,
      },
    });

    return describeJourney(nextJourney);
  }

  function applyGenerationResult(
    journey,
    result,
    {
      originalIdea,
      source = "generation-result",
    } = {}
  ) {
    const intelligence = extractGenerationIntelligence(result);

    if (!intelligence) {
      return describeJourney(journey);
    }

    const idea =
      cleanString(originalIdea) ||
      cleanString(journey?.initialIdea?.originalText);

    if (!idea) {
      return describeJourney(journey);
    }

    return captureInitialIdea(journey, {
      originalIdea: idea,
      intelligence,
      source,
      metadata: {
        generationId: result?.id || null,
        generationStatus: result?.status || null,
      },
    });
  }

  function buildResponseContext(
    journey,
    context = {}
  ) {
    const described = describeJourney(journey);
    const orientation = described.orientation;
    const journeyReadyToAdvance =
      journey?.initialIdea?.readyToAdvance === true &&
      described.clarificationRequired !== true;
    const creatorConfirmedContext =
      getCreatorConfirmedContext(journey);

    return {
      ...cloneValue(context),
      projectType: "movie",
      projectJourney: described.snapshot,
      projectJourneyOrientation: orientation,
      creatorConfirmedContext,
      activeProjectId:
        journey?.projectId ||
        context?.activeProjectId ||
        null,
      activeStage:
        orientation?.present?.stage?.id ||
        context?.activeStage ||
        null,
      nextTask:
        orientation?.present?.task?.id ||
        context?.nextTask ||
        null,
      returnPoint:
        orientation?.present?.resumePoint ||
        context?.returnPoint ||
        null,
      minimumCreationContextReady:
        journeyReadyToAdvance,
      requiredInformationComplete:
        journeyReadyToAdvance,
      creatorAppearsConfused:
        described.clarificationRequired === true
          ? true
          : Boolean(context?.creatorAppearsConfused),
      metadata: {
        ...(context?.metadata && typeof context.metadata === "object"
          ? cloneValue(context.metadata)
          : {}),
        movieJourneyBridgeVersion:
          MOVIE_JOURNEY_INTELLIGENCE_BRIDGE_VERSION,
        journeyReadinessIsExplicit: true,
        creatorConfirmedContextIncluded: true,
        creatorConfirmedDecisionCount:
          creatorConfirmedContext.length,
      },
    };
  }

  return {
    version: MOVIE_JOURNEY_INTELLIGENCE_BRIDGE_VERSION,
    captureInitialIdea,
    applyGenerationResult,
    buildResponseContext,
    describeJourney,
    extractGenerationIntelligence,
    getClarificationMessage,
    getCreatorConfirmedContext,
  };
}

export {
  MOVIE_JOURNEY_INTELLIGENCE_BRIDGE_VERSION,
  DEFAULT_CLARIFICATION_MESSAGE,
  normaliseIntelligence,
  extractGenerationIntelligence,
  getClarificationMessage,
  getCreatorConfirmedContext,
  createMovieJourneyIntelligenceBridge,
};

export default createMovieJourneyIntelligenceBridge;

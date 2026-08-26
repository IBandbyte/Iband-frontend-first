/**
 * Movie Journey Intelligence Bridge
 * ------------------------------------------------------------
 * Connects creator-facing Movie Mentor input to canonical CreatorJourneyEngine
 * state while preserving the authority boundary between creator truth and
 * advisory planning intelligence.
 */

import createCreatorJourneyEngine from "./CreatorJourneyEngine.js";

const MOVIE_JOURNEY_INTELLIGENCE_BRIDGE_VERSION = "1.4.0";
const JOURNEY_PLANNING_EVIDENCE_CONTRACT_VERSION = "1.0.0";
const DEFAULT_CLARIFICATION_MESSAGE =
  "I’m sorry, I lost you there. Can you explain what you mean a little further?";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cloneValue(value) {
  if (value === undefined) return undefined;
  try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
}

function asArray(value) { return Array.isArray(value) ? value : []; }

function valuesEqual(left, right) {
  try { return JSON.stringify(left) === JSON.stringify(right); } catch { return left === right; }
}

function normaliseIntelligence(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  const requestedStageId = cleanString(source.recommendedStageId);
  const readyToAdvance = source.readyToAdvance === true;
  const recommendedStageId =
    readyToAdvance && (!requestedStageId || requestedStageId === "idea")
      ? "story-direction"
      : requestedStageId || "story-direction";

  return {
    understoodContext: asArray(source.understoodContext),
    provisionalContext: asArray(source.provisionalContext),
    unresolvedContext: asArray(source.unresolvedContext),
    clarificationNeeded: asArray(source.clarificationNeeded),
    readyToAdvance,
    recommendedStageId,
    recommendedTaskId: cleanString(source.recommendedTaskId) || null,
    nextAction: source.nextAction && typeof source.nextAction === "object" ? cloneValue(source.nextAction) : null,
    resumeNote: cleanString(source.resumeNote) || null,
    metadata: source.metadata && typeof source.metadata === "object" ? cloneValue(source.metadata) : {},
  };
}

function extractGenerationIntelligence(result) {
  if (!result || typeof result !== "object") return null;
  const candidate =
    result.movieJourneyIntelligence ||
    result.journeyIntelligence ||
    result.creatorJourneyIntelligence ||
    result?.metadata?.movieJourneyIntelligence ||
    result?.metadata?.journeyIntelligence ||
    null;
  return candidate && typeof candidate === "object" ? candidate : null;
}

function normaliseContinuityConsequenceEnvelope(input) {
  if (!input || typeof input !== "object") return null;
  return {
    status: cleanString(input.status) || "unknown",
    authority: cleanString(input.authority) || "derived-continuity",
    creatorConfirmed: input.creatorConfirmed === true,
    mayCreateCanon: input.mayCreateCanon === true,
    requiresClarification: input.requiresClarification === true,
    derivedConstraints: cloneValue(asArray(input.derivedConstraints || input.constraints)),
    conflicts: cloneValue(asArray(input.conflicts)),
    unresolvedQuestions: cloneValue(asArray(input.unresolvedQuestions)),
  };
}

function createContinuityPlanningAdvice(input, metadata = {}) {
  const envelope = normaliseContinuityConsequenceEnvelope(input);
  if (!envelope) return null;
  return {
    source: "derived-continuity",
    authority: "advisory-only",
    status: envelope.status,
    requiresClarification: envelope.requiresClarification,
    derivedConstraints: cloneValue(envelope.derivedConstraints),
    conflicts: cloneValue(envelope.conflicts),
    unresolvedQuestions: cloneValue(envelope.unresolvedQuestions),
    creatorConfirmed: false,
    mayCreateCanon: false,
    mayAdvanceJourney: false,
    metadata: {
      ...cloneValue(metadata),
      originalAuthority: envelope.authority,
      originalCreatorConfirmed: envelope.creatorConfirmed,
      originalMayCreateCanon: envelope.mayCreateCanon,
      bridgeVersion: MOVIE_JOURNEY_INTELLIGENCE_BRIDGE_VERSION,
      creatorTruthDominates: true,
    },
  };
}

function getClarificationMessage(orientation) {
  const clarification = orientation?.present?.clarifications?.[0] || null;
  if (!clarification) return null;
  const explicitQuestion = cleanString(clarification.question);
  if (explicitQuestion) return explicitQuestion;
  const expression = cleanString(clarification.expression);
  if (expression) return `I’m sorry, I lost you at “${expression}”. Can you explain what you mean by that?`;
  return DEFAULT_CLARIFICATION_MESSAGE;
}

function getCreatorConfirmedContext(journey) {
  return asArray(journey?.decisions)
    .filter((decision) => decision?.authority === "creator" && decision?.status === "active" && cleanString(decision?.key))
    .map((decision) => ({
      key: cleanString(decision.key),
      value: cloneValue(decision.value),
      stageId: cleanString(decision.stageId) || null,
      sceneId: cleanString(decision.sceneId) || null,
      reason: cleanString(decision.reason) || null,
      createdAt: decision.createdAt || null,
      metadata: decision?.metadata && typeof decision.metadata === "object" ? cloneValue(decision.metadata) : {},
      authority: "creator",
    }));
}

function normaliseSpecialistContribution(input, expectedAgentId) {
  if (!input || typeof input !== "object") return null;
  if (cleanString(input.agentId) !== expectedAgentId) return null;
  if (input.authority !== "mentor-provisional") return null;
  if (input.creatorFacing !== false || input.mayAdvanceJourney !== false || input.mayOverwriteCreatorTruth !== false) return null;
  return {
    agentId: expectedAgentId,
    authority: "mentor-provisional",
    observations: cloneValue(asArray(input.observations)),
    provisionalSuggestions: cloneValue(asArray(input.provisionalSuggestions)),
    risksAndConflicts: cloneValue(asArray(input.risksAndConflicts)),
    creatorConfirmedDependencies: cloneValue(asArray(input.creatorConfirmedDependencies)),
    confidence: Number.isFinite(Number(input.confidence)) ? Number(input.confidence) : 0,
    creatorConfirmed: false,
    mayCreateCanon: false,
    mayAdvanceJourney: false,
  };
}

function findSpecialistContribution(specialistResult, agentId) {
  const contribution = asArray(specialistResult?.contributions).find(
    (item) => cleanString(item?.agentId) === agentId
  );
  return normaliseSpecialistContribution(contribution, agentId);
}

function materialSemanticClarifications(semantic) {
  return asArray(semantic?.clarificationNeeded).filter((item) => item?.material !== false);
}

function evidenceItemKey(item) { return cleanString(item?.key); }

function classifySpecialistSuggestions({ creatorAuthority, continuityAdvice, storyAdvice, characterAdvice }) {
  const creatorByKey = new Map(creatorAuthority.map((item) => [cleanString(item.key), item]));
  const continuityByKey = new Map(
    asArray(continuityAdvice?.derivedConstraints)
      .filter((item) => evidenceItemKey(item))
      .map((item) => [evidenceItemKey(item), item])
  );

  const viable = [];
  const overriddenByCreator = [];
  const rejectedByContinuity = [];

  for (const advice of [storyAdvice, characterAdvice].filter(Boolean)) {
    for (const suggestion of asArray(advice.provisionalSuggestions)) {
      const item = { ...cloneValue(suggestion), sourceAgentId: advice.agentId, authority: "mentor-provisional" };
      const key = evidenceItemKey(item);
      if (key && creatorByKey.has(key) && !valuesEqual(creatorByKey.get(key).value, item.value)) {
        overriddenByCreator.push(item);
        continue;
      }
      if (key && continuityByKey.has(key) && !valuesEqual(continuityByKey.get(key).value, item.value)) {
        rejectedByContinuity.push(item);
        continue;
      }
      viable.push(item);
    }
  }

  return { viable, overriddenByCreator, rejectedByContinuity };
}

function findUnresolvedSpecialistConflicts(viableSuggestions, creatorAuthority, continuityAdvice) {
  const creatorKeys = new Set(creatorAuthority.map((item) => cleanString(item.key)).filter(Boolean));
  const continuityKeys = new Set(asArray(continuityAdvice?.derivedConstraints).map(evidenceItemKey).filter(Boolean));
  const grouped = new Map();

  for (const item of viableSuggestions) {
    const key = evidenceItemKey(item);
    if (!key || creatorKeys.has(key) || continuityKeys.has(key)) continue;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  }

  const conflicts = [];
  for (const [key, items] of grouped.entries()) {
    const agents = new Set(items.map((item) => item.sourceAgentId));
    const values = [];
    for (const item of items) {
      if (!values.some((value) => valuesEqual(value, item.value))) values.push(cloneValue(item.value));
    }
    if (agents.has("story") && agents.has("character") && values.length > 1) {
      conflicts.push({
        type: "story-character-planning-disagreement",
        key,
        values,
        sourceAgentIds: [...agents],
        material: true,
      });
    }
  }
  return conflicts;
}

function createJourneyPlanningEvidence(journey, turnResult = {}, metadata = {}, describeJourney = null) {
  const described = typeof describeJourney === "function"
    ? describeJourney(journey)
    : { journey, snapshot: null, orientation: null, clarificationRequired: false, clarificationMessage: null };
  const creatorAuthority = getCreatorConfirmedContext(journey);
  const semanticDirection = normaliseIntelligence(turnResult?.semanticIntelligence || {});
  const storyAdvice = findSpecialistContribution(turnResult?.specialistResult, "story");
  const characterAdvice = findSpecialistContribution(turnResult?.specialistResult, "character");
  const continuityAdvice = createContinuityPlanningAdvice(turnResult?.continuityConsequenceEnvelope, metadata);
  const classified = classifySpecialistSuggestions({ creatorAuthority, continuityAdvice, storyAdvice, characterAdvice });
  const specialistDisagreements = findUnresolvedSpecialistConflicts(classified.viable, creatorAuthority, continuityAdvice);

  const clarificationReasons = [];
  for (const item of materialSemanticClarifications(semanticDirection)) {
    clarificationReasons.push({ type: "semantic", value: cloneValue(item) });
  }
  if (continuityAdvice?.requiresClarification === true) {
    clarificationReasons.push({ type: "continuity", value: "continuity-requires-clarification" });
  }
  for (const item of asArray(continuityAdvice?.conflicts)) clarificationReasons.push({ type: "continuity-conflict", value: cloneValue(item) });
  for (const item of asArray(continuityAdvice?.unresolvedQuestions)) clarificationReasons.push({ type: "continuity-question", value: cloneValue(item) });
  for (const item of specialistDisagreements) clarificationReasons.push({ type: "specialist-disagreement", value: cloneValue(item) });

  const clarificationRequired = clarificationReasons.length > 0;
  const currentStageId = cleanString(described?.orientation?.present?.stage?.id || journey?.currentStageId) || null;
  const currentTaskId = cleanString(described?.orientation?.present?.task?.id) || null;
  const sourceAgents = [storyAdvice?.agentId, characterAdvice?.agentId, continuityAdvice ? "continuity" : null].filter(Boolean);
  const evidenceStatus = storyAdvice || characterAdvice || continuityAdvice ? "available" : "partial";

  const recommendation = clarificationRequired
    ? null
    : {
        recommendedStageId: semanticDirection.recommendedStageId || currentStageId,
        recommendedTaskId: semanticDirection.recommendedTaskId || currentTaskId,
        reasonCodes: [
          semanticDirection.readyToAdvance ? "semantic-direction-ready" : "semantic-direction-not-ready",
          storyAdvice ? "story-advice-considered" : "story-advice-missing",
          characterAdvice ? "character-advice-considered" : "character-advice-missing",
          continuityAdvice ? "continuity-advice-considered" : "continuity-advice-missing",
          classified.overriddenByCreator.length ? "creator-override-applied" : null,
          classified.rejectedByContinuity.length ? "continuity-filter-applied" : null,
        ].filter(Boolean),
        confidence: Math.max(0, Math.min(1,
          [storyAdvice?.confidence, characterAdvice?.confidence]
            .filter((value) => Number.isFinite(value))
            .reduce((sum, value, _, list) => sum + value / list.length, semanticDirection.readyToAdvance ? 0.2 : 0)
        )),
        alternatives: cloneValue(classified.viable),
      };

  return {
    ...described,
    journeyPlanningEvidence: {
      contractVersion: JOURNEY_PLANNING_EVIDENCE_CONTRACT_VERSION,
      authority: "advisory-only",
      creatorConfirmed: false,
      mayCreateCanon: false,
      mayAdvanceJourney: false,
      currentStageId,
      currentTaskId,
      creatorAuthority: cloneValue(creatorAuthority),
      semanticDirection: cloneValue(semanticDirection),
      storyAdvice: cloneValue(storyAdvice),
      characterAdvice: cloneValue(characterAdvice),
      continuityAdvice: cloneValue(continuityAdvice),
      filteredEvidence: {
        viableSuggestions: cloneValue(classified.viable),
        overriddenByCreator: cloneValue(classified.overriddenByCreator),
        rejectedByContinuity: cloneValue(classified.rejectedByContinuity),
      },
      recommendation,
      clarification: {
        required: clarificationRequired,
        reasons: cloneValue(clarificationReasons),
      },
      evidenceStatus,
      provenance: {
        source: "MovieMentorConversation",
        sourceAgents,
        turnStatus: cleanString(turnResult?.status) || null,
        turnRevision: turnResult?.turnContextProof?.revision ?? null,
        bridgeVersion: MOVIE_JOURNEY_INTELLIGENCE_BRIDGE_VERSION,
        ...cloneValue(metadata),
      },
    },
    journeyMutated: false,
    creatorCanonChanged: false,
    stageChanged: false,
    authority: {
      creatorTruthDominates: true,
      semanticMeaningOutranksSpecialistAdvice: true,
      continuityIsAdvisoryButConstraining: true,
      specialistsAreProvisional: true,
      planningEvidenceMayCreateCanon: false,
      planningEvidenceMayAdvanceJourney: false,
    },
  };
}

function createMovieJourneyIntelligenceBridge({ journeyEngine = null } = {}) {
  const engine = journeyEngine || createCreatorJourneyEngine();

  function describeJourney(journey) {
    if (!journey) return { journey:null, snapshot:null, orientation:null, clarificationRequired:false, clarificationMessage:null };
    const snapshot = engine.createSnapshot(journey);
    const orientation = engine.getOrientation(journey);
    const clarificationRequired = orientation?.present?.clarificationRequired === true;
    return { journey, snapshot, orientation, clarificationRequired, clarificationMessage: clarificationRequired ? getClarificationMessage(orientation) : null };
  }

  function captureInitialIdea(journey,{ originalIdea, intelligence = {}, source = "CreatorWorkspace", metadata = {} } = {}) {
    const idea = cleanString(originalIdea);
    if (!journey || !idea) return describeJourney(journey);
    const structured = normaliseIntelligence(intelligence);
    const nextJourney = engine.captureInitialMovieIdea(journey, {
      originalIdea:idea,
      understoodContext:structured.understoodContext,
      provisionalContext:structured.provisionalContext,
      unresolvedContext:structured.unresolvedContext,
      clarificationNeeded:structured.clarificationNeeded,
      readyToAdvance:structured.readyToAdvance,
      recommendedStageId:structured.recommendedStageId,
      recommendedTaskId:structured.recommendedTaskId,
      nextAction:structured.nextAction,
      resumeNote:structured.resumeNote,
      metadata:{ ...structured.metadata, ...cloneValue(metadata), bridgeVersion:MOVIE_JOURNEY_INTELLIGENCE_BRIDGE_VERSION, source },
    });
    return describeJourney(nextJourney);
  }

  function applyGenerationResult(journey,result,{ originalIdea, source = "generation-result" } = {}) {
    const intelligence = extractGenerationIntelligence(result);
    if (!intelligence) return describeJourney(journey);
    const idea = cleanString(originalIdea) || cleanString(journey?.initialIdea?.originalText);
    if (!idea) return describeJourney(journey);
    return captureInitialIdea(journey,{ originalIdea:idea, intelligence, source, metadata:{ generationId:result?.id || null, generationStatus:result?.status || null } });
  }

  function consumeContinuityConsequenceForPlanning(journey, envelope, metadata = {}) {
    const described = describeJourney(journey);
    const continuityPlanningAdvice = createContinuityPlanningAdvice(envelope, metadata);
    return {
      ...described,
      continuityPlanningAdvice,
      journeyMutated: false,
      creatorCanonChanged: false,
      stageChanged: false,
      authority: {
        creatorTruthDominates: true,
        continuityIsAdvisoryOnly: true,
        continuityMayCreateCanon: false,
        continuityMayAdvanceJourney: false,
      },
    };
  }

  function consumeTurnForJourneyPlanning(journey, turnResult = {}, metadata = {}) {
    return createJourneyPlanningEvidence(journey, turnResult, metadata, describeJourney);
  }

  function buildResponseContext(journey,context = {}) {
    const described = describeJourney(journey);
    const orientation = described.orientation;
    const journeyReadyToAdvance = journey?.initialIdea?.readyToAdvance === true && described.clarificationRequired !== true;
    const creatorConfirmedContext = getCreatorConfirmedContext(journey);
    return {
      ...cloneValue(context),
      projectType:"movie",
      projectJourney:described.snapshot,
      projectJourneyOrientation:orientation,
      creatorConfirmedContext,
      activeProjectId:journey?.projectId || context?.activeProjectId || null,
      activeStage:orientation?.present?.stage?.id || context?.activeStage || null,
      nextTask:orientation?.present?.task?.id || context?.nextTask || null,
      returnPoint:orientation?.present?.resumePoint || context?.returnPoint || null,
      minimumCreationContextReady:journeyReadyToAdvance,
      requiredInformationComplete:journeyReadyToAdvance,
      creatorAppearsConfused:described.clarificationRequired === true ? true : Boolean(context?.creatorAppearsConfused),
      metadata:{
        ...(context?.metadata && typeof context.metadata === "object" ? cloneValue(context.metadata) : {}),
        movieJourneyBridgeVersion:MOVIE_JOURNEY_INTELLIGENCE_BRIDGE_VERSION,
        journeyPlanningEvidenceContractVersion:JOURNEY_PLANNING_EVIDENCE_CONTRACT_VERSION,
        journeyReadinessIsExplicit:true,
        creatorConfirmedContextIncluded:true,
        creatorConfirmedDecisionCount:creatorConfirmedContext.length,
      },
    };
  }

  return {
    version:MOVIE_JOURNEY_INTELLIGENCE_BRIDGE_VERSION,
    planningEvidenceContractVersion:JOURNEY_PLANNING_EVIDENCE_CONTRACT_VERSION,
    captureInitialIdea,
    applyGenerationResult,
    consumeContinuityConsequenceForPlanning,
    consumeTurnForJourneyPlanning,
    buildResponseContext,
    describeJourney,
    extractGenerationIntelligence,
    getClarificationMessage,
    getCreatorConfirmedContext,
  };
}

export {
  MOVIE_JOURNEY_INTELLIGENCE_BRIDGE_VERSION,
  JOURNEY_PLANNING_EVIDENCE_CONTRACT_VERSION,
  DEFAULT_CLARIFICATION_MESSAGE,
  normaliseIntelligence,
  extractGenerationIntelligence,
  normaliseContinuityConsequenceEnvelope,
  createContinuityPlanningAdvice,
  normaliseSpecialistContribution,
  findSpecialistContribution,
  classifySpecialistSuggestions,
  findUnresolvedSpecialistConflicts,
  createJourneyPlanningEvidence,
  getClarificationMessage,
  getCreatorConfirmedContext,
  createMovieJourneyIntelligenceBridge,
};

export default createMovieJourneyIntelligenceBridge;

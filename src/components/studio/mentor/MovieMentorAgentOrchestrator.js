/**
 * Movie Mentor Agent Orchestrator
 * ------------------------------------------------------------
 * Internal orchestration layer for specialist filmmaking intelligence.
 *
 * This module does not call models and does not speak to the creator.
 * It creates safe specialist work orders that may later be executed by
 * vendor-neutral provider adapters behind the backend.
 *
 * Core authority contract:
 * - The creator remains the authority on meaning and decisions.
 * - Semantic clarification gates outrank agent work.
 * - Specialist output is advisory / mentor-provisional only.
 * - No specialist may advance CreatorJourneyEngine directly.
 * - The Mentor remains the single creator-facing relationship.
 */

const MOVIE_MENTOR_AGENT_ORCHESTRATOR_VERSION = "1.0.0";

const AGENT_AUTHORITY = Object.freeze({
  MENTOR_PROVISIONAL: "mentor-provisional",
});

const MOVIE_SPECIALIST_AGENTS = Object.freeze({
  STORY: "story",
  CHARACTER: "character",
  SCENE: "scene",
  CINEMATOGRAPHY: "cinematography",
  CONTINUITY: "continuity",
  SOUND_MUSIC: "sound-music",
  PRODUCTION: "production",
});

const AGENT_DEFINITIONS = Object.freeze({
  [MOVIE_SPECIALIST_AGENTS.STORY]: {
    id: MOVIE_SPECIALIST_AGENTS.STORY,
    purpose: "Story structure, dramatic direction, stakes and narrative coherence.",
    stageAffinity: ["idea", "story-direction", "story", "outline"],
  },
  [MOVIE_SPECIALIST_AGENTS.CHARACTER]: {
    id: MOVIE_SPECIALIST_AGENTS.CHARACTER,
    purpose: "Character goals, relationships, arcs, motivation and emotional logic.",
    stageAffinity: ["idea", "story-direction", "character", "characters"],
  },
  [MOVIE_SPECIALIST_AGENTS.SCENE]: {
    id: MOVIE_SPECIALIST_AGENTS.SCENE,
    purpose: "Scene purpose, beats, conflict, transitions and local dramatic function.",
    stageAffinity: ["scene", "scenes", "screenplay", "script"],
  },
  [MOVIE_SPECIALIST_AGENTS.CINEMATOGRAPHY]: {
    id: MOVIE_SPECIALIST_AGENTS.CINEMATOGRAPHY,
    purpose: "Visual grammar, camera, lighting, composition and cinematic execution.",
    stageAffinity: ["visual", "cinematography", "shot", "shots", "scene"],
  },
  [MOVIE_SPECIALIST_AGENTS.CONTINUITY]: {
    id: MOVIE_SPECIALIST_AGENTS.CONTINUITY,
    purpose: "Cross-scene consistency, factual continuity and contradiction detection.",
    stageAffinity: ["story-direction", "scene", "scenes", "screenplay", "production"],
  },
  [MOVIE_SPECIALIST_AGENTS.SOUND_MUSIC]: {
    id: MOVIE_SPECIALIST_AGENTS.SOUND_MUSIC,
    purpose: "Sound design, music, score, sonic rhythm and audio storytelling.",
    stageAffinity: ["sound", "music", "score", "audio", "scene"],
  },
  [MOVIE_SPECIALIST_AGENTS.PRODUCTION]: {
    id: MOVIE_SPECIALIST_AGENTS.PRODUCTION,
    purpose: "Practical feasibility, production dependencies, assets and execution constraints.",
    stageAffinity: ["production", "execution", "render", "publish"],
  },
});

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

function hasMaterialClarification(semanticIntelligence = {}) {
  return asArray(semanticIntelligence.clarificationNeeded).some(
    (item) => item?.material !== false
  );
}

function collectSemanticKeys(semanticIntelligence = {}) {
  return [
    ...asArray(semanticIntelligence.understoodContext),
    ...asArray(semanticIntelligence.provisionalContext),
    ...asArray(semanticIntelligence.unresolvedContext),
  ]
    .map((item) => cleanString(item?.key).toLowerCase())
    .filter(Boolean);
}

function selectAgents({ stageId = null, semanticIntelligence = {} } = {}) {
  if (hasMaterialClarification(semanticIntelligence)) {
    return [];
  }

  const stage = cleanString(stageId).toLowerCase();
  const semanticKeys = collectSemanticKeys(semanticIntelligence).join(" ");
  const selected = new Set();

  for (const definition of Object.values(AGENT_DEFINITIONS)) {
    if (definition.stageAffinity.some((token) => stage.includes(token))) {
      selected.add(definition.id);
    }
  }

  const match = (patterns) => patterns.some((pattern) => semanticKeys.includes(pattern));

  if (match(["story", "plot", "ending", "theme", "stakes", "premise"])) {
    selected.add(MOVIE_SPECIALIST_AGENTS.STORY);
  }
  if (match(["character", "relationship", "protagonist", "antagonist", "motivation"])) {
    selected.add(MOVIE_SPECIALIST_AGENTS.CHARACTER);
  }
  if (match(["scene", "beat", "dialogue", "location"])) {
    selected.add(MOVIE_SPECIALIST_AGENTS.SCENE);
  }
  if (match(["camera", "visual", "shot", "lighting", "composition"])) {
    selected.add(MOVIE_SPECIALIST_AGENTS.CINEMATOGRAPHY);
  }
  if (match(["continuity", "timeline", "costume", "prop", "contradiction"])) {
    selected.add(MOVIE_SPECIALIST_AGENTS.CONTINUITY);
  }
  if (match(["sound", "music", "score", "audio", "song"])) {
    selected.add(MOVIE_SPECIALIST_AGENTS.SOUND_MUSIC);
  }
  if (match(["production", "asset", "budget", "render", "schedule", "location logistics"])) {
    selected.add(MOVIE_SPECIALIST_AGENTS.PRODUCTION);
  }

  // Minimum useful foundation for early movie development.
  if (selected.size === 0 && ["idea", "story-direction"].includes(stage)) {
    selected.add(MOVIE_SPECIALIST_AGENTS.STORY);
    selected.add(MOVIE_SPECIALIST_AGENTS.CHARACTER);
  }

  return [...selected];
}

function buildWorkOrder(agentId, context = {}) {
  const definition = AGENT_DEFINITIONS[agentId];
  if (!definition) return null;

  return {
    agentId,
    purpose: definition.purpose,
    input: {
      stageId: cleanString(context.stageId) || null,
      taskId: cleanString(context.taskId) || null,
      creatorMessage: cleanString(context.creatorMessage) || null,
      semanticIntelligence: cloneValue(context.semanticIntelligence || {}),
      creatorConfirmedContext: cloneValue(context.creatorConfirmedContext || []),
      projectJourney: cloneValue(context.projectJourney || null),
    },
    authority: AGENT_AUTHORITY.MENTOR_PROVISIONAL,
    creatorFacing: false,
    mayAdvanceJourney: false,
    mayOverwriteCreatorTruth: false,
    requiresMentorSynthesis: true,
  };
}

function createMovieMentorAgentPlan({
  stageId = null,
  taskId = null,
  creatorMessage = null,
  semanticIntelligence = {},
  creatorConfirmedContext = [],
  projectJourney = null,
} = {}) {
  const clarificationBlocked = hasMaterialClarification(semanticIntelligence);
  const selectedAgents = clarificationBlocked
    ? []
    : selectAgents({ stageId, semanticIntelligence });

  const workOrders = selectedAgents
    .map((agentId) =>
      buildWorkOrder(agentId, {
        stageId,
        taskId,
        creatorMessage,
        semanticIntelligence,
        creatorConfirmedContext,
        projectJourney,
      })
    )
    .filter(Boolean);

  return {
    version: MOVIE_MENTOR_AGENT_ORCHESTRATOR_VERSION,
    status: clarificationBlocked ? "blocked-by-clarification" : "planned",
    selectedAgents,
    workOrders,
    authority: {
      creatorTruthDominates: true,
      specialistAuthority: AGENT_AUTHORITY.MENTOR_PROVISIONAL,
      specialistsMayAdvanceJourney: false,
      specialistsMaySpeakDirectlyToCreator: false,
      mentorMustSynthesize: true,
    },
    routing: {
      vendorNeutral: true,
      providerExecutionOwnedByBackend: true,
      semanticUnderstandingOwnedBySemanticInterpreter: true,
    },
  };
}

export {
  MOVIE_MENTOR_AGENT_ORCHESTRATOR_VERSION,
  AGENT_AUTHORITY,
  MOVIE_SPECIALIST_AGENTS,
  AGENT_DEFINITIONS,
  hasMaterialClarification,
  selectAgents,
  buildWorkOrder,
  createMovieMentorAgentPlan,
};

export default createMovieMentorAgentPlan;

/**
 * Adaptive Mentor Engine
 * ------------------------------------------------------------
 * The final behavioural orchestration layer for iBand's
 * AI Mentor — The Creator.
 *
 * This engine combines specialist plans from:
 *
 * - ConversationPlanner
 * - ReflectionEngine
 * - ProgressionEngine
 * - CreatorMemoryEngine
 *
 * It does not generate the final Mentor response.
 *
 * It decides:
 * - How the Mentor should behave now.
 * - Whether to lead, follow, listen, reflect or wait.
 * - How much information should be provided.
 * - Whether another question should be asked.
 * - Whether memory should be captured or recalled.
 * - Whether conversation should continue or move into action.
 * - Which specialist-engine decision takes priority.
 *
 * Core philosophy:
 * - Protect the creator.
 * - Present behaviour leads.
 * - Long-term memory informs.
 * - Conversation exists in service of creation.
 * - Match the creator's rhythm before attempting to guide it.
 * - Meet first. Lead second.
 * - Never interrupt flow merely because more help is available.
 * - The creator remains the authority on their own experience.
 */

import createConversationPlanner from "./ConversationPlanner";
import createReflectionEngine from "./ReflectionEngine";
import createProgressionEngine from "./ProgressionEngine";
import createCreatorMemoryEngine from "./CreatorMemoryEngine";

const ADAPTIVE_MENTOR_ENGINE_VERSION = "1.0.0";

const MENTOR_ROLES = Object.freeze({
  LISTENER: "listener",
  GUIDE: "guide",
  COLLABORATOR: "collaborator",
  TEACHER: "teacher",
  REFLECTOR: "reflector",
  CREATIVE_DIRECTOR: "creative-director",
  FACILITATOR: "facilitator",
  QUIET_COMPANION: "quiet-companion",
});

const LEADERSHIP_STANCES = Object.freeze({
  LEAD: "lead",
  FOLLOW: "follow",
  WALK_BESIDE: "walk-beside",
  HOLD_POSITION: "hold-position",
  HAND_BACK_CONTROL: "hand-back-control",
});

const INTERVENTION_LEVELS = Object.freeze({
  NONE: "none",
  MINIMAL: "minimal",
  LIGHT: "light",
  MODERATE: "moderate",
  DEEP: "deep",
});

const RESPONSE_DEPTHS = Object.freeze({
  SILENT: "silent",
  ONE_LINE: "one-line",
  SHORT: "short",
  MEDIUM: "medium",
  DETAILED: "detailed",
});

const QUESTION_POLICIES = Object.freeze({
  NONE: "none",
  ONE_OPTIONAL: "one-optional",
  ONE_REQUIRED: "one-required",
  CREATOR_LED: "creator-led",
});

const MEMORY_POLICIES = Object.freeze({
  DO_NOT_USE: "do-not-use",
  INFORM_SILENTLY: "inform-silently",
  CAPTURE_ONLY: "capture-only",
  RECALL_WITH_PERMISSION: "recall-with-permission",
  CAPTURE_AND_RECALL: "capture-and-recall",
});

const ACTION_PRIORITIES = Object.freeze({
  SAFETY: 100,
  CREATOR_EXPLICIT_DIRECTION: 90,
  HOLD_SPACE: 80,
  PROTECT_FLOW: 75,
  RELEASE_PRESSURE: 70,
  MOVE_TO_ACTION: 65,
  MEMORY_RECALL: 55,
  REFLECTION: 50,
  EXPLORATION: 40,
  LEARNING: 35,
  GENERAL_LISTENING: 20,
});

const ADAPTIVE_ACTIONS = Object.freeze({
  WAIT: "wait",
  ACKNOWLEDGE_BRIEFLY: "acknowledge-briefly",
  LISTEN_AND_INVITE: "listen-and-invite",
  REFLECT_GENTLY: "reflect-gently",
  RELEASE_PRESSURE: "release-pressure",
  RESTORE_CONTEXT: "restore-context",
  CAPTURE_AND_CONTINUE: "capture-and-continue",
  RECALL_WITH_PERMISSION: "recall-with-permission",
  ASK_ONE_QUESTION: "ask-one-question",
  OFFER_ONE_RECOMMENDATION: "offer-one-recommendation",
  TEACH_ONE_CONCEPT: "teach-one-concept",
  CONTINUE_BRAINSTORMING: "continue-brainstorming",
  MOVE_TO_CREATION: "move-to-creation",
  MOVE_TO_NEXT_TASK: "move-to-next-task",
  MOVE_TO_REFINEMENT: "move-to-refinement",
  MOVE_TO_PUBLISHING: "move-to-publishing",
  SAVE_AND_PAUSE: "save-and-pause",
  END_POSITIVELY: "end-positively",
});

const ADAPTATION_SIGNALS = Object.freeze({
  BUILD_MODE: "build-mode",
  FLOW_MODE: "flow-mode",
  EXPLORATION_MODE: "exploration-mode",
  LEARNING_MODE: "learning-mode",
  REFLECTION_MODE: "reflection-mode",
  RECOVERY_MODE: "recovery-mode",
  INCUBATION_MODE: "incubation-mode",

  HIGH_MOMENTUM: "high-momentum",
  LOW_ENERGY: "low-energy",
  INFORMATION_OVERLOAD: "information-overload",
  GUIDANCE_REQUESTED: "guidance-requested",
  GUIDANCE_NOT_WANTED: "guidance-not-wanted",

  BRIEF_DETOUR: "brief-detour",
  DEFERRED_TOPIC: "deferred-topic",
  RECALL_AVAILABLE: "recall-available",
  CREATOR_NOT_FINISHED: "creator-not-finished",
});

const DEFAULT_ADAPTIVE_CONTEXT = Object.freeze({
  creatorJourney: "guide",
  creatorType: null,
  projectType: null,

  activeProject: null,
  activeIdea: null,

  thinkingMode: null,
  creatorEnergy: null,
  momentum: null,
  guidanceWindow: null,
  informationSaturation: null,

  creatorExplicitlyAskedForGuidance: false,
  creatorExplicitlyAskedToContinue: false,
  creatorExplicitlyAskedForNextStep: false,
  creatorExplicitlyAskedToPause: false,
  creatorExplicitlyAskedToStop: false,
  creatorExplicitlyAskedToCreate: false,

  preferredResponseDepth: null,
  preferredGuidanceStyle: null,
  preferredMentorRole: null,

  recentCreatorMessages: [],
  recentMentorMessages: [],

  existingMemories: [],
  existingPatterns: [],
  existingObservations: [],

  minimumCreationContextReady: false,
  requiredInformationComplete: false,
  projectReadyToGenerate: false,
  projectReadyToRefine: false,
  projectReadyToPublish: false,

  currentTimestamp: null,
});

/**
 * Returns the current ISO timestamp.
 */
function createTimestamp() {
  return new Date().toISOString();
}

/**
 * Creates a lightweight unique identifier.
 */
function createAdaptivePlanId() {
  const randomValue = Math.random()
    .toString(36)
    .slice(2, 10);

  return `adaptive-mentor-plan-${Date.now()}-${randomValue}`;
}

/**
 * Safely clones plain data.
 */
function cloneValue(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

/**
 * Produces a clean string.
 */
function cleanString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

/**
 * Returns unique meaningful values.
 */
function uniqueValues(values = []) {
  return [
    ...new Set(
      values.filter(
        (value) =>
          value !== null &&
          value !== undefined &&
          value !== ""
      )
    ),
  ];
}

/**
 * Safely reads nested values.
 */
function getNestedValue(
  value,
  path,
  fallback = null
) {
  const keys = path.split(".");

  let currentValue = value;

  for (const key of keys) {
    if (
      currentValue === null ||
      currentValue === undefined ||
      typeof currentValue !== "object"
    ) {
      return fallback;
    }

    currentValue = currentValue[key];
  }

  return currentValue ?? fallback;
}

/**
 * Determines whether one of the supplied values is present.
 */
function includesValue(value, possibilities = []) {
  return possibilities.includes(value);
}

/**
 * Adds a scored candidate action.
 */
function addCandidateAction(
  candidates,
  {
    action,
    priority,
    reason,
    source,
  }
) {
  if (!action) {
    return;
  }

  candidates.push({
    action,
    priority,
    reason,
    source,
  });
}

/**
 * Extracts adaptation signals from all specialist plans.
 */
function collectAdaptationSignals({
  context,
  conversationPlan,
  reflectionPlan,
  progressionPlan,
  memoryPlan,
}) {
  const signals = [];

  const thinkingMode =
    getNestedValue(
      reflectionPlan,
      "creatorState.thinkingMode.value",
      context?.thinkingMode
    );

  const creatorEnergy =
    getNestedValue(
      progressionPlan,
      "creatorState.creatorEnergy.value",
      context?.creatorEnergy
    );

  const momentum =
    getNestedValue(
      progressionPlan,
      "creatorState.momentum.value",
      context?.momentum
    );

  const guidanceWindow =
    getNestedValue(
      progressionPlan,
      "creatorState.guidanceWindow.value",
      context?.guidanceWindow
    );

  const informationSaturation =
    getNestedValue(
      progressionPlan,
      "creatorState.informationSaturation.value",
      context?.informationSaturation
    );

  const appearsFinished =
    getNestedValue(
      reflectionPlan,
      "creatorState.appearsFinished.value",
      true
    );

  if (thinkingMode === "build") {
    signals.push(
      ADAPTATION_SIGNALS.BUILD_MODE
    );
  }

  if (thinkingMode === "flow") {
    signals.push(
      ADAPTATION_SIGNALS.FLOW_MODE
    );
  }

  if (thinkingMode === "exploration") {
    signals.push(
      ADAPTATION_SIGNALS.EXPLORATION_MODE
    );
  }

  if (thinkingMode === "learning") {
    signals.push(
      ADAPTATION_SIGNALS.LEARNING_MODE
    );
  }

  if (thinkingMode === "reflection") {
    signals.push(
      ADAPTATION_SIGNALS.REFLECTION_MODE
    );
  }

  if (thinkingMode === "recovery") {
    signals.push(
      ADAPTATION_SIGNALS.RECOVERY_MODE
    );
  }

  if (thinkingMode === "incubation") {
    signals.push(
      ADAPTATION_SIGNALS.INCUBATION_MODE
    );
  }

  if (
    includesValue(momentum, [
      "strong",
      "rising",
    ])
  ) {
    signals.push(
      ADAPTATION_SIGNALS.HIGH_MOMENTUM
    );
  }

  if (
    includesValue(creatorEnergy, [
      "low",
      "depleted",
    ])
  ) {
    signals.push(
      ADAPTATION_SIGNALS.LOW_ENERGY
    );
  }

  if (
    includesValue(
      informationSaturation,
      ["high", "overloaded"]
    )
  ) {
    signals.push(
      ADAPTATION_SIGNALS.INFORMATION_OVERLOAD
    );
  }

  if (
    context?.creatorExplicitlyAskedForGuidance ||
    guidanceWindow === "wide-open"
  ) {
    signals.push(
      ADAPTATION_SIGNALS.GUIDANCE_REQUESTED
    );
  }

  if (
    guidanceWindow === "closed-for-now"
  ) {
    signals.push(
      ADAPTATION_SIGNALS.GUIDANCE_NOT_WANTED
    );
  }

  if (
    getNestedValue(
      memoryPlan,
      "detections.briefDetour.value",
      false
    )
  ) {
    signals.push(
      ADAPTATION_SIGNALS.BRIEF_DETOUR
    );
  }

  if (
    getNestedValue(
      memoryPlan,
      "detections.deferredTopic.value",
      false
    )
  ) {
    signals.push(
      ADAPTATION_SIGNALS.DEFERRED_TOPIC
    );
  }

  if (
    getNestedValue(
      memoryPlan,
      "recall.shouldRecall",
      false
    )
  ) {
    signals.push(
      ADAPTATION_SIGNALS.RECALL_AVAILABLE
    );
  }

  if (appearsFinished === false) {
    signals.push(
      ADAPTATION_SIGNALS.CREATOR_NOT_FINISHED
    );
  }

  const conversationMode =
    getNestedValue(
      conversationPlan,
      "conversation.mode",
      null
    );

  if (
    conversationMode === "learning" &&
    !signals.includes(
      ADAPTATION_SIGNALS.LEARNING_MODE
    )
  ) {
    signals.push(
      ADAPTATION_SIGNALS.LEARNING_MODE
    );
  }

  return uniqueValues(signals);
}

/**
 * Produces candidate actions from specialist-engine decisions.
 */
function collectCandidateActions({
  context,
  conversationPlan,
  reflectionPlan,
  progressionPlan,
  memoryPlan,
  signals,
}) {
  const candidates = [];

  const reflectionDecision =
    reflectionPlan?.decision;

  const progressionDecision =
    progressionPlan?.decision;

  const conversationAction =
    getNestedValue(
      conversationPlan,
      "conversation.primaryAction",
      null
    );

  if (
    context?.creatorExplicitlyAskedToPause
  ) {
    addCandidateAction(candidates, {
      action:
        ADAPTIVE_ACTIONS.SAVE_AND_PAUSE,
      priority:
        ACTION_PRIORITIES
          .CREATOR_EXPLICIT_DIRECTION,
      reason:
        "The creator explicitly requested a pause.",
      source: "context",
    });
  }

  if (
    context?.creatorExplicitlyAskedToStop
  ) {
    addCandidateAction(candidates, {
      action:
        ADAPTIVE_ACTIONS.END_POSITIVELY,
      priority:
        ACTION_PRIORITIES
          .CREATOR_EXPLICIT_DIRECTION,
      reason:
        "The creator explicitly requested to stop.",
      source: "context",
    });
  }

  if (
    includesValue(reflectionDecision, [
      "hold-space",
      "stay-silent",
    ])
  ) {
    addCandidateAction(candidates, {
      action: ADAPTIVE_ACTIONS.WAIT,
      priority:
        ACTION_PRIORITIES.HOLD_SPACE,
      reason:
        "The creator may still be thinking or speaking.",
      source: "reflection-engine",
    });
  }

  if (
    reflectionDecision ===
    "release-pressure"
  ) {
    addCandidateAction(candidates, {
      action:
        ADAPTIVE_ACTIONS.RELEASE_PRESSURE,
      priority:
        ACTION_PRIORITIES.RELEASE_PRESSURE,
      reason:
        "Pressure should be removed before continuing.",
      source: "reflection-engine",
    });
  }

  if (
    reflectionDecision ===
    "restore-context"
  ) {
    addCandidateAction(candidates, {
      action:
        ADAPTIVE_ACTIONS.RESTORE_CONTEXT,
      priority:
        ACTION_PRIORITIES.RELEASE_PRESSURE,
      reason:
        "The creator may benefit from returning to recent conversation landmarks.",
      source: "reflection-engine",
    });
  }

  if (
    reflectionDecision === "reflect"
  ) {
    addCandidateAction(candidates, {
      action:
        ADAPTIVE_ACTIONS.REFLECT_GENTLY,
      priority:
        ACTION_PRIORITIES.REFLECTION,
      reason:
        "An evidence-based reflection candidate is available.",
      source: "reflection-engine",
    });
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS.BRIEF_DETOUR
    )
  ) {
    addCandidateAction(candidates, {
      action:
        ADAPTIVE_ACTIONS
          .CAPTURE_AND_CONTINUE,
      priority:
        ACTION_PRIORITIES.PROTECT_FLOW,
      reason:
        "The creator appears to want the thought captured without opening a long discussion.",
      source: "creator-memory-engine",
    });
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS.RECALL_AVAILABLE
    )
  ) {
    addCandidateAction(candidates, {
      action:
        ADAPTIVE_ACTIONS
          .RECALL_WITH_PERMISSION,
      priority:
        ACTION_PRIORITIES.MEMORY_RECALL,
      reason:
        "A deferred memory appears relevant to the current conversation.",
      source: "creator-memory-engine",
    });
  }

  switch (progressionDecision) {
    case "move-to-creation":
      addCandidateAction(candidates, {
        action:
          ADAPTIVE_ACTIONS.MOVE_TO_CREATION,
        priority:
          ACTION_PRIORITIES.MOVE_TO_ACTION,
        reason:
          "Enough information exists to begin creation.",
        source: "progression-engine",
      });
      break;

    case "move-to-next-task":
      addCandidateAction(candidates, {
        action:
          ADAPTIVE_ACTIONS.MOVE_TO_NEXT_TASK,
        priority:
          ACTION_PRIORITIES.MOVE_TO_ACTION,
        reason:
          "The creator requested or is ready for the next task.",
        source: "progression-engine",
      });
      break;

    case "move-to-refinement":
      addCandidateAction(candidates, {
        action:
          ADAPTIVE_ACTIONS
            .MOVE_TO_REFINEMENT,
        priority:
          ACTION_PRIORITIES.MOVE_TO_ACTION,
        reason:
          "The project is ready for refinement.",
        source: "progression-engine",
      });
      break;

    case "move-to-publishing":
      addCandidateAction(candidates, {
        action:
          ADAPTIVE_ACTIONS
            .MOVE_TO_PUBLISHING,
        priority:
          ACTION_PRIORITIES.MOVE_TO_ACTION,
        reason:
          "The project is ready for publishing.",
        source: "progression-engine",
      });
      break;

    case "continue-exploring":
      addCandidateAction(candidates, {
        action:
          ADAPTIVE_ACTIONS
            .CONTINUE_BRAINSTORMING,
        priority:
          ACTION_PRIORITIES.EXPLORATION,
        reason:
          "The creator remains in exploratory mode.",
        source: "progression-engine",
      });
      break;

    case "continue-learning":
      addCandidateAction(candidates, {
        action:
          ADAPTIVE_ACTIONS.TEACH_ONE_CONCEPT,
        priority:
          ACTION_PRIORITIES.LEARNING,
        reason:
          "The creator remains in learning mode.",
        source: "progression-engine",
      });
      break;

    case "offer-one-small-step":
    case "reduce-information":
      addCandidateAction(candidates, {
        action:
          ADAPTIVE_ACTIONS
            .OFFER_ONE_RECOMMENDATION,
        priority:
          ACTION_PRIORITIES.PROTECT_FLOW,
        reason:
          "The creator needs reduced cognitive load.",
        source: "progression-engine",
      });
      break;

    case "save-and-return-later":
    case "pause-session":
      addCandidateAction(candidates, {
        action:
          ADAPTIVE_ACTIONS.SAVE_AND_PAUSE,
        priority:
          ACTION_PRIORITIES
            .CREATOR_EXPLICIT_DIRECTION,
        reason:
          "Progress should be preserved for a later return.",
        source: "progression-engine",
      });
      break;

    case "end-session-positively":
      addCandidateAction(candidates, {
        action:
          ADAPTIVE_ACTIONS.END_POSITIVELY,
        priority:
          ACTION_PRIORITIES
            .CREATOR_EXPLICIT_DIRECTION,
        reason:
          "The current session should close without introducing another task.",
        source: "progression-engine",
      });
      break;

    case "hold-space":
    case "wait-for-creator":
      addCandidateAction(candidates, {
        action: ADAPTIVE_ACTIONS.WAIT,
        priority:
          ACTION_PRIORITIES.HOLD_SPACE,
        reason:
          "The creator should be given room to continue.",
        source: "progression-engine",
      });
      break;

    default:
      break;
  }

  if (
    conversationAction ===
    "ask-one-question"
  ) {
    addCandidateAction(candidates, {
      action:
        ADAPTIVE_ACTIONS.ASK_ONE_QUESTION,
      priority:
        ACTION_PRIORITIES
          .GENERAL_LISTENING,
      reason:
        "The conversation planner recommends one meaningful question.",
      source: "conversation-planner",
    });
  }

  if (
    conversationAction === "listen"
  ) {
    addCandidateAction(candidates, {
      action:
        ADAPTIVE_ACTIONS
          .LISTEN_AND_INVITE,
      priority:
        ACTION_PRIORITIES
          .GENERAL_LISTENING,
      reason:
        "No stronger intervention is currently required.",
      source: "conversation-planner",
    });
  }

  if (candidates.length === 0) {
    addCandidateAction(candidates, {
      action:
        ADAPTIVE_ACTIONS
          .ACKNOWLEDGE_BRIEFLY,
      priority:
        ACTION_PRIORITIES
          .GENERAL_LISTENING,
      reason:
        "No specialist engine identified a stronger action.",
      source: "adaptive-mentor-engine",
    });
  }

  return candidates.sort(
    (a, b) => b.priority - a.priority
  );
}

/**
 * Applies conflict-resolution rules to candidate actions.
 */
function resolvePrimaryAction({
  candidates,
  signals,
  context,
}) {
  const firstCandidate = candidates[0];

  if (!firstCandidate) {
    return {
      action:
        ADAPTIVE_ACTIONS.ACKNOWLEDGE_BRIEFLY,
      priority:
        ACTION_PRIORITIES.GENERAL_LISTENING,
      reason:
        "No candidate actions were available.",
      source: "adaptive-mentor-engine",
    };
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS.CREATOR_NOT_FINISHED
    )
  ) {
    return {
      action: ADAPTIVE_ACTIONS.WAIT,
      priority:
        ACTION_PRIORITIES.HOLD_SPACE,
      reason:
        "The creator appears not to have finished their thought.",
      source: "adaptive-conflict-resolution",
    };
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS.BRIEF_DETOUR
    ) &&
    !context?.creatorExplicitlyAskedToPause
  ) {
    return {
      action:
        ADAPTIVE_ACTIONS
          .CAPTURE_AND_CONTINUE,
      priority:
        ACTION_PRIORITIES.PROTECT_FLOW,
      reason:
        "Capture the brief thought and return to the previous task.",
      source: "adaptive-conflict-resolution",
    };
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS.FLOW_MODE
    ) &&
    firstCandidate.action ===
      ADAPTIVE_ACTIONS
        .RECALL_WITH_PERMISSION
  ) {
    const moveCandidate = candidates.find(
      (candidate) =>
        includesValue(candidate.action, [
          ADAPTIVE_ACTIONS
            .MOVE_TO_CREATION,
          ADAPTIVE_ACTIONS
            .MOVE_TO_NEXT_TASK,
          ADAPTIVE_ACTIONS
            .MOVE_TO_REFINEMENT,
        ])
    );

    if (moveCandidate) {
      return moveCandidate;
    }

    return {
      action:
        ADAPTIVE_ACTIONS
          .ACKNOWLEDGE_BRIEFLY,
      priority:
        ACTION_PRIORITIES.PROTECT_FLOW,
      reason:
        "The memory may be relevant, but active flow should not be interrupted.",
      source: "adaptive-conflict-resolution",
    };
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS.INFORMATION_OVERLOAD
    ) &&
    !includesValue(firstCandidate.action, [
      ADAPTIVE_ACTIONS.WAIT,
      ADAPTIVE_ACTIONS.SAVE_AND_PAUSE,
      ADAPTIVE_ACTIONS.END_POSITIVELY,
    ])
  ) {
    return {
      action:
        ADAPTIVE_ACTIONS
          .OFFER_ONE_RECOMMENDATION,
      priority:
        ACTION_PRIORITIES.PROTECT_FLOW,
      reason:
        "Information saturation requires one concise recommendation.",
      source: "adaptive-conflict-resolution",
    };
  }

  return firstCandidate;
}

/**
 * Chooses the Mentor's active role.
 */
function chooseMentorRole({
  primaryAction,
  signals,
  context,
}) {
  if (context?.preferredMentorRole) {
    return context.preferredMentorRole;
  }

  switch (primaryAction.action) {
    case ADAPTIVE_ACTIONS.WAIT:
      return MENTOR_ROLES.QUIET_COMPANION;

    case ADAPTIVE_ACTIONS
      .REFLECT_GENTLY:
    case ADAPTIVE_ACTIONS
      .RESTORE_CONTEXT:
    case ADAPTIVE_ACTIONS
      .RELEASE_PRESSURE:
      return MENTOR_ROLES.REFLECTOR;

    case ADAPTIVE_ACTIONS
      .TEACH_ONE_CONCEPT:
      return MENTOR_ROLES.TEACHER;

    case ADAPTIVE_ACTIONS
      .MOVE_TO_CREATION:
    case ADAPTIVE_ACTIONS
      .MOVE_TO_NEXT_TASK:
    case ADAPTIVE_ACTIONS
      .MOVE_TO_REFINEMENT:
    case ADAPTIVE_ACTIONS
      .MOVE_TO_PUBLISHING:
      return MENTOR_ROLES.CREATIVE_DIRECTOR;

    case ADAPTIVE_ACTIONS
      .CONTINUE_BRAINSTORMING:
      return MENTOR_ROLES.COLLABORATOR;

    case ADAPTIVE_ACTIONS
      .CAPTURE_AND_CONTINUE:
    case ADAPTIVE_ACTIONS
      .RECALL_WITH_PERMISSION:
      return MENTOR_ROLES.FACILITATOR;

    default:
      break;
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS.GUIDANCE_REQUESTED
    )
  ) {
    return MENTOR_ROLES.GUIDE;
  }

  return MENTOR_ROLES.LISTENER;
}

/**
 * Chooses the current leadership stance.
 */
function chooseLeadershipStance({
  role,
  primaryAction,
  signals,
  context,
}) {
  if (
    context?.creatorExplicitlyAskedForGuidance ||
    context?.creatorExplicitlyAskedForNextStep
  ) {
    return LEADERSHIP_STANCES.LEAD;
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS.WAIT
  ) {
    return LEADERSHIP_STANCES.HOLD_POSITION;
  }

  if (
    includesValue(primaryAction.action, [
      ADAPTIVE_ACTIONS.MOVE_TO_CREATION,
      ADAPTIVE_ACTIONS.MOVE_TO_NEXT_TASK,
      ADAPTIVE_ACTIONS
        .MOVE_TO_REFINEMENT,
      ADAPTIVE_ACTIONS
        .MOVE_TO_PUBLISHING,
      ADAPTIVE_ACTIONS
        .TEACH_ONE_CONCEPT,
    ])
  ) {
    return LEADERSHIP_STANCES.LEAD;
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS.FLOW_MODE
    )
  ) {
    return LEADERSHIP_STANCES.FOLLOW;
  }

  if (
    role === MENTOR_ROLES.COLLABORATOR
  ) {
    return LEADERSHIP_STANCES.WALK_BESIDE;
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS.END_POSITIVELY
  ) {
    return LEADERSHIP_STANCES
      .HAND_BACK_CONTROL;
  }

  return LEADERSHIP_STANCES.WALK_BESIDE;
}

/**
 * Chooses the amount of Mentor intervention.
 */
function chooseInterventionLevel({
  primaryAction,
  signals,
}) {
  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS.WAIT
  ) {
    return INTERVENTION_LEVELS.NONE;
  }

  if (
    includesValue(primaryAction.action, [
      ADAPTIVE_ACTIONS
        .ACKNOWLEDGE_BRIEFLY,
      ADAPTIVE_ACTIONS
        .CAPTURE_AND_CONTINUE,
      ADAPTIVE_ACTIONS
        .MOVE_TO_NEXT_TASK,
    ])
  ) {
    return INTERVENTION_LEVELS.MINIMAL;
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS.INFORMATION_OVERLOAD
    ) ||
    signals.includes(
      ADAPTATION_SIGNALS.HIGH_MOMENTUM
    )
  ) {
    return INTERVENTION_LEVELS.LIGHT;
  }

  if (
    includesValue(primaryAction.action, [
      ADAPTIVE_ACTIONS
        .REFLECT_GENTLY,
      ADAPTIVE_ACTIONS
        .CONTINUE_BRAINSTORMING,
      ADAPTIVE_ACTIONS
        .TEACH_ONE_CONCEPT,
    ])
  ) {
    return INTERVENTION_LEVELS.MODERATE;
  }

  return INTERVENTION_LEVELS.LIGHT;
}

/**
 * Chooses final response depth.
 */
function chooseResponseDepth({
  primaryAction,
  interventionLevel,
  signals,
  context,
  progressionPlan,
}) {
  if (context?.preferredResponseDepth) {
    return context.preferredResponseDepth;
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS.WAIT
  ) {
    return RESPONSE_DEPTHS.SILENT;
  }

  if (
    includesValue(primaryAction.action, [
      ADAPTIVE_ACTIONS
        .ACKNOWLEDGE_BRIEFLY,
      ADAPTIVE_ACTIONS
        .CAPTURE_AND_CONTINUE,
      ADAPTIVE_ACTIONS
        .MOVE_TO_NEXT_TASK,
      ADAPTIVE_ACTIONS
        .MOVE_TO_CREATION,
    ])
  ) {
    return RESPONSE_DEPTHS.ONE_LINE;
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS.INFORMATION_OVERLOAD
    ) ||
    signals.includes(
      ADAPTATION_SIGNALS.LOW_ENERGY
    ) ||
    interventionLevel ===
      INTERVENTION_LEVELS.MINIMAL
  ) {
    return RESPONSE_DEPTHS.SHORT;
  }

  const progressionLength =
    getNestedValue(
      progressionPlan,
      "progression.responseLength",
      null
    );

  if (
    progressionLength === "detailed"
  ) {
    return RESPONSE_DEPTHS.DETAILED;
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS.EXPLORATION_MODE
    ) ||
    signals.includes(
      ADAPTATION_SIGNALS.LEARNING_MODE
    ) ||
    signals.includes(
      ADAPTATION_SIGNALS.REFLECTION_MODE
    )
  ) {
    return RESPONSE_DEPTHS.MEDIUM;
  }

  return RESPONSE_DEPTHS.SHORT;
}

/**
 * Chooses final question behaviour.
 */
function chooseQuestionPolicy({
  primaryAction,
  signals,
  progressionPlan,
}) {
  if (
    includesValue(primaryAction.action, [
      ADAPTIVE_ACTIONS.WAIT,
      ADAPTIVE_ACTIONS.MOVE_TO_CREATION,
      ADAPTIVE_ACTIONS.MOVE_TO_NEXT_TASK,
      ADAPTIVE_ACTIONS.MOVE_TO_REFINEMENT,
      ADAPTIVE_ACTIONS.MOVE_TO_PUBLISHING,
      ADAPTIVE_ACTIONS.SAVE_AND_PAUSE,
      ADAPTIVE_ACTIONS.END_POSITIVELY,
    ])
  ) {
    return {
      policy: QUESTION_POLICIES.NONE,
      maximumQuestions: 0,
    };
  }

  if (
    signals.includes(
      ADAPTATION_SIGNALS.GUIDANCE_NOT_WANTED
    ) ||
    signals.includes(
      ADAPTATION_SIGNALS.INFORMATION_OVERLOAD
    )
  ) {
    return {
      policy: QUESTION_POLICIES.NONE,
      maximumQuestions: 0,
    };
  }

  const plannedMaximum =
    getNestedValue(
      progressionPlan,
      "progression.maximumQuestions",
      1
    );

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS.ASK_ONE_QUESTION
  ) {
    return {
      policy: QUESTION_POLICIES.ONE_REQUIRED,
      maximumQuestions: 1,
    };
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS.CONTINUE_BRAINSTORMING
  ) {
    return {
      policy: QUESTION_POLICIES.ONE_OPTIONAL,
      maximumQuestions:
        Math.min(plannedMaximum, 1),
    };
  }

  return {
    policy: QUESTION_POLICIES.CREATOR_LED,
    maximumQuestions:
      Math.min(plannedMaximum, 1),
  };
}

/**
 * Chooses how memory may influence the response.
 */
function chooseMemoryPolicy({
  memoryPlan,
  signals,
}) {
  const hasInstructions =
    Array.isArray(memoryPlan?.instructions) &&
    memoryPlan.instructions.length > 0;

  const shouldRecall =
    Boolean(memoryPlan?.recall?.shouldRecall);

  if (
    signals.includes(
      ADAPTATION_SIGNALS.FLOW_MODE
    ) &&
    !signals.includes(
      ADAPTATION_SIGNALS.BRIEF_DETOUR
    )
  ) {
    return hasInstructions
      ? MEMORY_POLICIES.CAPTURE_ONLY
      : MEMORY_POLICIES.INFORM_SILENTLY;
  }

  if (hasInstructions && shouldRecall) {
    return MEMORY_POLICIES
      .CAPTURE_AND_RECALL;
  }

  if (shouldRecall) {
    return MEMORY_POLICIES
      .RECALL_WITH_PERMISSION;
  }

  if (hasInstructions) {
    return MEMORY_POLICIES.CAPTURE_ONLY;
  }

  return MEMORY_POLICIES.INFORM_SILENTLY;
}

/**
 * Combines response guidance from all specialist engines.
 */
function combineResponseGuidance({
  primaryAction,
  role,
  leadershipStance,
  interventionLevel,
  responseDepth,
  questionPolicy,
  memoryPolicy,
  conversationPlan,
  reflectionPlan,
  progressionPlan,
  memoryPlan,
}) {
  const guidance = [
    ...(
      conversationPlan?.responseGuidance ||
      []
    ),

    ...(
      reflectionPlan?.responseGuidance ||
      []
    ),

    ...(
      progressionPlan?.responseGuidance ||
      []
    ),

    ...(
      memoryPlan?.responseGuidance ||
      []
    ),

    `Active Mentor role: ${role}.`,

    `Leadership stance: ${leadershipStance}.`,

    `Intervention level: ${interventionLevel}.`,

    `Response depth: ${responseDepth}.`,

    `Question policy: ${questionPolicy.policy}.`,

    `Maximum questions: ${questionPolicy.maximumQuestions}.`,

    `Memory policy: ${memoryPolicy}.`,

    `Primary adaptive action: ${primaryAction.action}.`,

    "Demonstrate understanding before introducing a new direction.",

    "Prefer the creator's present state over historical assumptions.",

    "Use remembered preferences as guidance, not fixed rules.",

    "Do not maximise response length.",

    "Do not compete with the creator for control of the conversation.",

    "Leave the creator with greater clarity, confidence or momentum.",
  ];

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .CAPTURE_AND_CONTINUE
  ) {
    guidance.push(
      "Confirm that the thought has been captured.",
      "Reflect that the creator appears not to want a deep discussion right now.",
      "Return to the previous task smoothly.",
      "Remind the creator that the topic can be revisited whenever they are ready."
    );
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS
        .RECALL_WITH_PERMISSION
  ) {
    guidance.push(
      "Explain briefly why the earlier memory seems relevant now.",
      "Mention that it was previously left alone to protect creative flow when appropriate.",
      "Ask permission before opening the subject.",
      "Give the creator a clear option to keep moving instead."
    );
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS.MOVE_TO_NEXT_TASK
  ) {
    guidance.push(
      "Do not reopen completed philosophy or architecture discussions.",
      "Provide the next concrete task immediately.",
      "Follow the creator's established build workflow."
    );
  }

  if (
    primaryAction.action ===
      ADAPTIVE_ACTIONS.MOVE_TO_CREATION
  ) {
    guidance.push(
      "Treat the available context as sufficient for a first version.",
      "Allow discovery to continue through creation.",
      "Do not require perfect clarity before beginning."
    );
  }

  return uniqueValues(guidance);
}

/**
 * Combines guard rails from all specialist engines.
 */
function combineGuardRails({
  conversationPlan,
  reflectionPlan,
  progressionPlan,
  memoryPlan,
}) {
  return uniqueValues([
    ...(
      conversationPlan?.guardRails ||
      []
    ),

    ...(
      reflectionPlan?.guardRails ||
      []
    ),

    ...(
      progressionPlan?.guardRails ||
      []
    ),

    ...(
      memoryPlan?.guardRails ||
      []
    ),

    "Do not diagnose the creator.",

    "Do not claim certainty about the creator's internal state.",

    "Do not use personalisation to manipulate engagement.",

    "Do not surface memory merely to demonstrate recall.",

    "Do not interrupt active flow with optional information.",

    "Do not use historical behaviour to override explicit present direction.",

    "Do not imitate the creator's language unnaturally.",

    "Do not produce multiple next steps when one is sufficient.",

    "Do not make the creator dependent on the Mentor.",

    "Do not treat agreement as the goal; useful alignment is the goal.",
  ]);
}

/**
 * Builds execution instructions for the future response layer.
 */
function createExecutionPlan({
  primaryAction,
  role,
  leadershipStance,
  interventionLevel,
  responseDepth,
  questionPolicy,
  memoryPolicy,
  reflectionPlan,
  progressionPlan,
  memoryPlan,
}) {
  return {
    action: primaryAction.action,

    MentorRole: role,

    leadershipStance,

    interventionLevel,

    responseDepth,

    questionPolicy,

    memoryPolicy,

    timing: cloneValue(
      reflectionPlan?.timing || {
        responseDelayMs: 0,
        silenceWindowMs: 0,
        allowCreatorToContinue: false,
        canCancelResponseIfCreatorContinues:
          true,
      }
    ),

    shouldGenerateResponse:
      primaryAction.action !==
      ADAPTIVE_ACTIONS.WAIT,

    shouldWait:
      primaryAction.action ===
      ADAPTIVE_ACTIONS.WAIT,

    shouldMoveForward:
      includesValue(primaryAction.action, [
        ADAPTIVE_ACTIONS.MOVE_TO_CREATION,
        ADAPTIVE_ACTIONS.MOVE_TO_NEXT_TASK,
        ADAPTIVE_ACTIONS
          .MOVE_TO_REFINEMENT,
        ADAPTIVE_ACTIONS
          .MOVE_TO_PUBLISHING,
      ]),

    shouldCaptureMemory:
      includesValue(memoryPolicy, [
        MEMORY_POLICIES.CAPTURE_ONLY,
        MEMORY_POLICIES.CAPTURE_AND_RECALL,
      ]),

    shouldRecallMemory:
      includesValue(memoryPolicy, [
        MEMORY_POLICIES
          .RECALL_WITH_PERMISSION,
        MEMORY_POLICIES
          .CAPTURE_AND_RECALL,
      ]),

    memoryInstructions:
      cloneValue(memoryPlan?.instructions || []),

    recallPlan:
      cloneValue(memoryPlan?.recall || null),

    reflectionCandidate:
      cloneValue(
        reflectionPlan?.reflection
          ?.candidate || null
      ),

    progressionTarget:
      getNestedValue(
        progressionPlan,
        "progression.primaryAction",
        null
      ),
  };
}

/**
 * Produces a concise adaptive decision summary.
 */
function createDecisionSummary({
  primaryAction,
  role,
  leadershipStance,
  interventionLevel,
  responseDepth,
  signals,
}) {
  return (
    `Use ${primaryAction.action} as the primary action. ` +
    `The Mentor should act as ${role}, ` +
    `using a ${leadershipStance} stance with ` +
    `${interventionLevel} intervention and ` +
    `${responseDepth} response depth. ` +
    `Active signals: ${
      signals.length > 0
        ? signals.join(", ")
        : "none"
    }.`
  );
}

/**
 * Creates a safe fallback adaptive plan.
 */
function createFallbackAdaptivePlan({
  message,
  context,
  error = null,
}) {
  return {
    id: createAdaptivePlanId(),
    engine: "adaptive-mentor-engine",
    version:
      ADAPTIVE_MENTOR_ENGINE_VERSION,

    input: {
      message: cleanString(message),
    },

    primaryAction: {
      action:
        ADAPTIVE_ACTIONS
          .ACKNOWLEDGE_BRIEFLY,
      priority:
        ACTION_PRIORITIES
          .GENERAL_LISTENING,
      reason:
        "Adaptive planning was unavailable.",
      source: "fallback",
    },

    behaviour: {
      role: MENTOR_ROLES.LISTENER,

      leadershipStance:
        LEADERSHIP_STANCES.WALK_BESIDE,

      interventionLevel:
        INTERVENTION_LEVELS.MINIMAL,

      responseDepth:
        RESPONSE_DEPTHS.SHORT,

      questionPolicy: {
        policy:
          QUESTION_POLICIES.ONE_OPTIONAL,
        maximumQuestions: 1,
      },

      memoryPolicy:
        MEMORY_POLICIES.DO_NOT_USE,
    },

    execution: {
      action:
        ADAPTIVE_ACTIONS
          .ACKNOWLEDGE_BRIEFLY,

      shouldGenerateResponse: true,
      shouldWait: false,
      shouldMoveForward: false,
      shouldCaptureMemory: false,
      shouldRecallMemory: false,

      timing: {
        responseDelayMs: 600,
        silenceWindowMs: 0,
        allowCreatorToContinue: false,
        canCancelResponseIfCreatorContinues:
          true,
      },

      memoryInstructions: [],
      recallPlan: null,
      reflectionCandidate: null,
      progressionTarget: null,
    },

    signals: [],

    responseGuidance: [
      "Use a short, warm acknowledgement.",
      "Do not introduce multiple new directions.",
      "Ask no more than one question.",
      "Keep the creator in ownership.",
    ],

    guardRails: [
      "Do not diagnose.",
      "Do not make assumptions from unavailable context.",
      "Do not overwhelm the creator.",
    ],

    contextSnapshot: cloneValue(context),

    decisionSummary:
      "Adaptive planning failed. Use minimal listening behaviour.",

    status: "fallback",

    error: error
      ? {
          message:
            error instanceof Error
              ? error.message
              : String(error),
        }
      : null,

    createdAt: createTimestamp(),
  };
}

/**
 * Creates the Adaptive Mentor Engine service.
 */
function createAdaptiveMentorEngine({
  conversationPlanner = null,
  reflectionEngine = null,
  progressionEngine = null,
  creatorMemoryEngine = null,
  memory = null,
} = {}) {
  let activeMemory = memory;

  const resolvedConversationPlanner =
    conversationPlanner ||
    createConversationPlanner({
      memory: activeMemory,
    });

  const resolvedReflectionEngine =
    reflectionEngine ||
    createReflectionEngine();

  const resolvedProgressionEngine =
    progressionEngine ||
    createProgressionEngine();

  const resolvedCreatorMemoryEngine =
    creatorMemoryEngine ||
    createCreatorMemoryEngine();

  /**
   * Produces one unified Mentor behaviour plan.
   */
  function planMentorBehaviour({
    message = "",
    context = {},
    conversationPlan = null,
    reflectionPlan = null,
    progressionPlan = null,
    memoryPlan = null,
  } = {}) {
    try {
      const combinedContext = {
        ...cloneValue(
          DEFAULT_ADAPTIVE_CONTEXT
        ),
        ...cloneValue(context),

        currentTimestamp:
          context?.currentTimestamp ||
          createTimestamp(),
      };

      const resolvedConversationPlan =
        conversationPlan ||
        resolvedConversationPlanner
          .planConversation({
            message,
            context: combinedContext,
          });

      const resolvedReflectionPlan =
        reflectionPlan ||
        resolvedReflectionEngine
          .planReflection({
            message,
            context: combinedContext,
            conversationPlan:
              resolvedConversationPlan,
          });

      const resolvedProgressionPlan =
        progressionPlan ||
        resolvedProgressionEngine
          .planProgression({
            message,
            context: combinedContext,
            conversationPlan:
              resolvedConversationPlan,
            reflectionPlan:
              resolvedReflectionPlan,
          });

      const resolvedMemoryPlan =
        memoryPlan ||
        resolvedCreatorMemoryEngine
          .planMemory({
            message,
            context: combinedContext,
          });

      const signals =
        collectAdaptationSignals({
          context: combinedContext,
          conversationPlan:
            resolvedConversationPlan,
          reflectionPlan:
            resolvedReflectionPlan,
          progressionPlan:
            resolvedProgressionPlan,
          memoryPlan:
            resolvedMemoryPlan,
        });

      const candidateActions =
        collectCandidateActions({
          context: combinedContext,
          conversationPlan:
            resolvedConversationPlan,
          reflectionPlan:
            resolvedReflectionPlan,
          progressionPlan:
            resolvedProgressionPlan,
          memoryPlan:
            resolvedMemoryPlan,
          signals,
        });

      const primaryAction =
        resolvePrimaryAction({
          candidates: candidateActions,
          signals,
          context: combinedContext,
        });

      const role = chooseMentorRole({
        primaryAction,
        signals,
        context: combinedContext,
      });

      const leadershipStance =
        chooseLeadershipStance({
          role,
          primaryAction,
          signals,
          context: combinedContext,
        });

      const interventionLevel =
        chooseInterventionLevel({
          primaryAction,
          signals,
        });

      const responseDepth =
        chooseResponseDepth({
          primaryAction,
          interventionLevel,
          signals,
          context: combinedContext,
          progressionPlan:
            resolvedProgressionPlan,
        });

      const questionPolicy =
        chooseQuestionPolicy({
          primaryAction,
          signals,
          progressionPlan:
            resolvedProgressionPlan,
        });

      const memoryPolicy =
        chooseMemoryPolicy({
          memoryPlan: resolvedMemoryPlan,
          signals,
        });

      const responseGuidance =
        combineResponseGuidance({
          primaryAction,
          role,
          leadershipStance,
          interventionLevel,
          responseDepth,
          questionPolicy,
          memoryPolicy,
          conversationPlan:
            resolvedConversationPlan,
          reflectionPlan:
            resolvedReflectionPlan,
          progressionPlan:
            resolvedProgressionPlan,
          memoryPlan:
            resolvedMemoryPlan,
        });

      const guardRails =
        combineGuardRails({
          conversationPlan:
            resolvedConversationPlan,
          reflectionPlan:
            resolvedReflectionPlan,
          progressionPlan:
            resolvedProgressionPlan,
          memoryPlan:
            resolvedMemoryPlan,
        });

      const execution =
        createExecutionPlan({
          primaryAction,
          role,
          leadershipStance,
          interventionLevel,
          responseDepth,
          questionPolicy,
          memoryPolicy,
          reflectionPlan:
            resolvedReflectionPlan,
          progressionPlan:
            resolvedProgressionPlan,
          memoryPlan:
            resolvedMemoryPlan,
        });

      return {
        id: createAdaptivePlanId(),
        engine: "adaptive-mentor-engine",
        version:
          ADAPTIVE_MENTOR_ENGINE_VERSION,

        input: {
          message: cleanString(message),
        },

        primaryAction,

        candidateActions:
          cloneValue(candidateActions),

        behaviour: {
          role,
          leadershipStance,
          interventionLevel,
          responseDepth,
          questionPolicy,
          memoryPolicy,
        },

        execution,

        signals,

        responseGuidance,

        guardRails,

        creatorProtocol: {
          protectTheCreator: true,
          understandBeforeGuiding: true,
          meetBeforeLeading: true,
          presentBehaviourLeads: true,
          longTermMemoryInforms: true,
          conversationServesCreation: true,
          protectMomentum: true,
          protectEmergence: true,
          protectThinkingTime: true,
          matchTempoBeforeChangingTempo: true,
          guidanceMustBeTimely: true,
          oneUsefulStepAtATime: true,
          creatorOwnsTheIdea: true,
          creatorMayRejectReflection: true,
          memoryMustProtectAutonomy: true,
          MentorShouldReduceDependence:
            true,
        },

        specialistPlans: {
          conversation:
            cloneValue(
              resolvedConversationPlan
            ),

          reflection:
            cloneValue(
              resolvedReflectionPlan
            ),

          progression:
            cloneValue(
              resolvedProgressionPlan
            ),

          memory:
            cloneValue(
              resolvedMemoryPlan
            ),
        },

        contextSnapshot:
          cloneValue(combinedContext),

        decisionSummary:
          createDecisionSummary({
            primaryAction,
            role,
            leadershipStance,
            interventionLevel,
            responseDepth,
            signals,
          }),

        status: "planned",

        createdAt: createTimestamp(),
      };
    } catch (error) {
      console.error(
        "AdaptiveMentorEngine planning error:",
        error
      );

      return createFallbackAdaptivePlan({
        message,
        context,
        error,
      });
    }
  }

  /**
   * Applies memory instructions using CreatorMemory.js.
   */
  function applyMemoryPlan(plan) {
    if (!activeMemory) {
      return {
        applied: [],
        skipped:
          plan?.execution
            ?.memoryInstructions || [],
        errors: [],
        reason:
          "No Creator Memory service is connected.",
      };
    }

    const memoryPlan =
      plan?.specialistPlans?.memory;

    return resolvedCreatorMemoryEngine
      .applyMemoryPlan({
        plan: memoryPlan,
        memory: activeMemory,
      });
  }

  /**
   * Replaces the connected Creator Memory service.
   */
  function setMemory(nextMemory) {
    activeMemory = nextMemory || null;

    if (
      typeof resolvedConversationPlanner
        .setMemory === "function"
    ) {
      resolvedConversationPlanner.setMemory(
        activeMemory
      );
    }

    return activeMemory;
  }

  function getMemory() {
    return activeMemory;
  }

  function shouldWait(plan) {
    return Boolean(
      plan?.execution?.shouldWait
    );
  }

  function shouldMoveForward(plan) {
    return Boolean(
      plan?.execution?.shouldMoveForward
    );
  }

  function shouldCaptureMemory(plan) {
    return Boolean(
      plan?.execution?.shouldCaptureMemory
    );
  }

  function shouldRecallMemory(plan) {
    return Boolean(
      plan?.execution?.shouldRecallMemory
    );
  }

  return {
    planMentorBehaviour,
    applyMemoryPlan,

    setMemory,
    getMemory,

    shouldWait,
    shouldMoveForward,
    shouldCaptureMemory,
    shouldRecallMemory,
  };
}

/**
 * Convenience method for one-off adaptive planning.
 */
function planMentorBehaviour({
  message = "",
  context = {},
  conversationPlan = null,
  reflectionPlan = null,
  progressionPlan = null,
  memoryPlan = null,
  memory = null,
} = {}) {
  const engine =
    createAdaptiveMentorEngine({
      memory,
    });

  return engine.planMentorBehaviour({
    message,
    context,
    conversationPlan,
    reflectionPlan,
    progressionPlan,
    memoryPlan,
  });
}

export {
  ADAPTIVE_MENTOR_ENGINE_VERSION,
  MENTOR_ROLES,
  LEADERSHIP_STANCES,
  INTERVENTION_LEVELS,
  RESPONSE_DEPTHS,
  QUESTION_POLICIES,
  MEMORY_POLICIES,
  ACTION_PRIORITIES,
  ADAPTIVE_ACTIONS,
  ADAPTATION_SIGNALS,
  createAdaptiveMentorEngine,
  planMentorBehaviour,
};

export default createAdaptiveMentorEngine;
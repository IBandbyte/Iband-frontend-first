/**
 * Response Generator
 * ------------------------------------------------------------
 * The executable response pipeline for iBand's AI Mentor —
 * The Creator.
 *
 * This service connects:
 *
 * - AdaptiveMentorEngine
 * - ResponseComposer
 * - CommunicationVoiceEngine
 * - CreatorMemory
 * - A future language-model or response-provider adapter
 *
 * Responsibilities:
 * - Accept a creator message and conversation context.
 * - Hydrate that context from CreatorMemory before reasoning.
 * - Produce one unified Adaptive Mentor behaviour plan.
 * - Convert that plan into a response blueprint.
 * - Produce a communication voice plan.
 * - Execute approved memory operations at the correct lifecycle point.
 * - Verify memory truth before generated language may claim success.
 * - Apply communication intelligence to the provider request.
 * - Execute the blueprint through a supplied response provider.
 * - Validate and normalise the generated response.
 * - Preserve intentional silence without losing valid memory work.
 * - Preserve project continuity and session handoffs.
 * - Handle explicit forget operations safely.
 * - Keep specialist-agent machinery invisible.
 * - Return structured diagnostics and lifecycle information.
 * - Recover safely when a provider or specialist engine fails.
 *
 * This file does not own:
 * - Model credentials.
 * - Network requests.
 * - UI rendering.
 * - Speech synthesis.
 * - Specialist-agent routing.
 *
 * CreatorMemory remains the persistence authority.
 *
 * Core principles:
 * - Protect the Creator.
 * - Present behaviour leads; memory informs.
 * - Intelligence and expression remain separate.
 * - Communication performance must not alter meaning.
 * - Never fabricate successful memory storage.
 * - Never fabricate successful memory deletion.
 * - Never fabricate successful session handoff persistence.
 * - Never generate speech when silence is the correct response.
 * - A provider executes the blueprint; it does not redesign it.
 * - Specialist agents contribute intelligence, not separate voices.
 * - Many intelligences may contribute underneath.
 *   The creator experiences one relationship.
 * - Every failure should degrade into a safe, useful response.
 */

import createAdaptiveMentorEngine from "./AdaptiveMentorEngine.js";
import createResponseComposer from "./ResponseComposer.js";
import createCommunicationVoiceEngine from "./CommunicationVoiceEngine.js";
import createCreatorMemory from "./CreatorMemory.js";

const RESPONSE_GENERATOR_VERSION = "3.0.0";

const GENERATION_STATUSES = Object.freeze({
  IDLE: "idle",
  HYDRATING_MEMORY: "hydrating-memory",
  PLANNING: "planning",
  COMPOSING: "composing",

  PLANNING_COMMUNICATION:
    "planning-communication",

  APPLYING_MEMORY:
    "applying-memory",

  GENERATING: "generating",
  VALIDATING: "validating",

  COMPLETED: "completed",
  SILENT: "silent",
  PARTIAL: "partial",
  FALLBACK: "fallback",
  FAILED: "failed",
  CANCELLED: "cancelled",
});

const GENERATION_STAGES = Object.freeze({
  INITIALISE: "initialise",

  HYDRATE_MEMORY:
    "hydrate-memory",

  PLAN_BEHAVIOUR:
    "plan-behaviour",

  COMPOSE_BLUEPRINT:
    "compose-blueprint",

  PLAN_COMMUNICATION:
    "plan-communication",

  APPLY_MEMORY:
    "apply-memory",

  EXECUTE_BLUEPRINT:
    "execute-blueprint",

  VALIDATE_RESPONSE:
    "validate-response",

  FINALISE: "finalise",
});

const PROVIDER_TYPES = Object.freeze({
  EXTERNAL: "external",
  DETERMINISTIC: "deterministic",
  CUSTOM: "custom",
  NONE: "none",
});

const OUTPUT_FORMATS = Object.freeze({
  TEXT: "text",
  MARKDOWN: "markdown",
  STRUCTURED: "structured",
});

const RESPONSE_SOURCES = Object.freeze({
  PROVIDER: "provider",

  DETERMINISTIC_RENDERER:
    "deterministic-renderer",

  FALLBACK_RENDERER:
    "fallback-renderer",

  SILENCE: "silence",
});

const MEMORY_APPLICATION_POLICIES =
  Object.freeze({
    BEFORE_GENERATION:
      "before-generation",

    AFTER_GENERATION:
      "after-generation",

    MANUAL: "manual",
    DISABLED: "disabled",
  });

const MEMORY_OPERATION_TYPES =
  Object.freeze({
    CAPTURE: "capture",
    FORGET: "forget",
    SESSION_HANDOFF:
      "session-handoff",
    UPDATE: "update",
    UNKNOWN: "unknown",
  });

const VALIDATION_SEVERITIES =
  Object.freeze({
    INFO: "info",
    WARNING: "warning",
    ERROR: "error",
  });

const DEFAULT_GENERATOR_OPTIONS =
  Object.freeze({
    outputFormat:
      OUTPUT_FORMATS.TEXT,

    memoryApplicationPolicy:
      MEMORY_APPLICATION_POLICIES
        .BEFORE_GENERATION,

    applyMemoryAutomatically:
      true,

    hydrateContextFromMemory:
      true,

    useDeterministicFallback:
      true,

    validateProviderOutput:
      true,

    includeDiagnostics:
      true,

    includeSpecialistPlans:
      false,

    includeBlueprint:
      true,

    includeCommunicationPlan:
      true,

    trimOutput:
      true,

    rejectEmptyProviderOutput:
      true,

    maximumResponseCharacters:
      24000,

    maximumProviderAttempts:
      1,

    abortSignal: null,

    metadata: {},
  });

const DEFAULT_GENERATION_CONTEXT =
  Object.freeze({
    creatorId: null,
    creatorName: null,
    creatorType: null,
    creatorJourney: "guide",

    projectType: null,

    activeProject: null,
    activeProjectId: null,

    activeIdea: null,
    activeStage: null,
    activeScene: null,
    activeCharacter: null,
    activeAsset: null,

    sessionId: null,

    previousTask: null,
    nextTask: null,
    returnPoint: null,

    conversationMode: null,
    thinkingMode: null,

    creatorEnergy: null,
    momentum: null,

    guidanceWindow: null,
    informationSaturation: null,

    creatorExplicitlyAskedForGuidance:
      false,

    creatorExplicitlyAskedToContinue:
      false,

    creatorExplicitlyAskedForNextStep:
      false,

    creatorExplicitlyAskedToPause:
      false,

    creatorExplicitlyAskedToStop:
      false,

    creatorExplicitlyAskedToCreate:
      false,

    creatorExplicitlyAskedForHelp:
      false,

    creatorExplicitlyAskedForExplanation:
      false,

    creatorExplicitlyAskedToRemember:
      false,

    creatorExplicitlyAskedNotToRemember:
      false,

    creatorExplicitlyAskedToRevisit:
      false,

    creatorAppearsConfused:
      false,

    creatorIsReturning:
      false,

    elapsedSinceLastMessageMs:
      null,

    relationshipStage: null,
    interactionCount: 0,
    knownDurationDays: 0,

    preferredResponseDepth:
      null,

    preferredGuidanceStyle:
      null,

    preferredMentorRole:
      null,

    preferredCommunicationPace:
      null,

    preferredVoiceProfile:
      null,

    preferredChannel:
      null,

    recentCreatorMessages: [],
    recentMentorMessages: [],
    recentConversations: [],

    existingMemories: [],
    existingProjectMemories: [],
    existingPatterns: [],
    existingObservations: [],

    creatorProfile: null,
    memoryContext: null,

    memorySignals: [],
    projectMemorySignals: [],

    captureSessionHandoff:
      false,

    sessionHandoff:
      null,

    sourceAgent: null,
    sourceSystem: null,

    targetMemoryIds: [],

    minimumCreationContextReady:
      false,

    requiredInformationComplete:
      false,

    projectReadyToGenerate:
      false,

    projectReadyToRefine:
      false,

    projectReadyToPublish:
      false,

    establishedVocabulary: [],
    sharedMeanings: [],
    sharedRituals: [],
    sharedJokes: [],

    participants: [],
    primaryCreatorId: null,
    currentSpeakerId: null,
    participationMode: null,

    humourAllowed: true,
    emojisAllowed: true,
    useCreatorName: false,

    language: "en",
    locale: "en-GB",

    currentTimestamp: null,
  });

function createTimestamp() {
  return new Date().toISOString();
}

function createGenerationId() {
  const randomValue = Math.random()
    .toString(36)
    .slice(2, 10);

  return (
    `mentor-response-` +
    `${Date.now()}-${randomValue}`
  );
}

function cloneValue(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(
    JSON.stringify(value)
  );
}

function cleanString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normaliseText(value) {
  return cleanString(value)
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ");
}

function asArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function clampNumber(
  value,
  minimum,
  maximum,
  fallback = minimum
) {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return fallback;
  }

  return Math.max(
    minimum,
    Math.min(
      maximum,
      numericValue
    )
  );
}

function uniqueValues(
  values = []
) {
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

function getNestedValue(
  value,
  path,
  fallback = null
) {
  const keys =
    path.split(".");

  let currentValue =
    value;

  for (
    const key
    of keys
  ) {
    if (
      currentValue === null ||
      currentValue === undefined ||
      typeof currentValue !==
        "object"
    ) {
      return fallback;
    }

    currentValue =
      currentValue[key];
  }

  return (
    currentValue ??
    fallback
  );
}

function isPlainObject(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isResponseProvider(
  provider
) {
  return Boolean(
    provider &&
      typeof provider ===
        "object" &&
      (
        typeof provider
          .generateResponse ===
          "function" ||

        typeof provider
          .generate ===
          "function" ||

        typeof provider
          .executeBlueprint ===
          "function"
      )
  );
}

function isMemoryService(
  memory
) {
  return Boolean(
    memory &&
    typeof memory === "object" &&
    (
      typeof memory
        .getMemoryContext ===
        "function" ||

      typeof memory
        .applyMemoryInstructions ===
        "function" ||

      typeof memory
        .getState ===
        "function"
    )
  );
}

function resolveGeneratorOptions(
  options = {}
) {
  return {
    ...cloneValue(
      DEFAULT_GENERATOR_OPTIONS
    ),

    ...cloneValue(
      options
    ),

    maximumResponseCharacters:
      clampNumber(
        options
          ?.maximumResponseCharacters,

        200,
        100000,

        DEFAULT_GENERATOR_OPTIONS
          .maximumResponseCharacters
      ),

    maximumProviderAttempts:
      clampNumber(
        options
          ?.maximumProviderAttempts,

        1,
        3,

        DEFAULT_GENERATOR_OPTIONS
          .maximumProviderAttempts
      ),

    metadata: {
      ...cloneValue(
        DEFAULT_GENERATOR_OPTIONS
          .metadata
      ),

      ...cloneValue(
        options?.metadata ||
        {}
      ),
    },
  };
}

function resolveGenerationContext(
  context = {}
) {
  return {
    ...cloneValue(
      DEFAULT_GENERATION_CONTEXT
    ),

    ...cloneValue(
      context
    ),

    recentCreatorMessages:
      asArray(
        context
          ?.recentCreatorMessages
      ),

    recentMentorMessages:
      asArray(
        context
          ?.recentMentorMessages
      ),

    recentConversations:
      asArray(
        context
          ?.recentConversations
      ),

    existingMemories:
      asArray(
        context
          ?.existingMemories
      ),

    existingProjectMemories:
      asArray(
        context
          ?.existingProjectMemories
      ),

    existingPatterns:
      asArray(
        context
          ?.existingPatterns
      ),

    existingObservations:
      asArray(
        context
          ?.existingObservations
      ),

    memorySignals:
      asArray(
        context
          ?.memorySignals
      ),

    projectMemorySignals:
      asArray(
        context
          ?.projectMemorySignals
      ),

    establishedVocabulary:
      asArray(
        context
          ?.establishedVocabulary
      ),

    sharedMeanings:
      asArray(
        context
          ?.sharedMeanings
      ),

    sharedRituals:
      asArray(
        context
          ?.sharedRituals
      ),

    sharedJokes:
      asArray(
        context
          ?.sharedJokes
      ),

    currentTimestamp:
      context
        ?.currentTimestamp ||
      createTimestamp(),
  };
}

function createLifecycleEvent({
  stage,
  status,
  message = "",
  metadata = {},
}) {
  return {
    stage,
    status,

    message:
      cleanString(
        message
      ),

    metadata:
      cloneValue(
        metadata
      ),

    createdAt:
      createTimestamp(),
  };
}

function recordLifecycleEvent(
  lifecycle,
  event
) {
  lifecycle.push(
    createLifecycleEvent(
      event
    )
  );

  return lifecycle;
}

function assertNotAborted(
  abortSignal
) {
  if (
    abortSignal?.aborted
  ) {
    const error =
      new Error(
        "Mentor response generation was cancelled."
      );

    error.name =
      "AbortError";

    throw error;
  }
}

function resolveProviderMethod(
  provider
) {
  if (
    !isResponseProvider(
      provider
    )
  ) {
    return null;
  }

  if (
    typeof provider
      .generateResponse ===
      "function"
  ) {
    return "generateResponse";
  }

  if (
    typeof provider
      .executeBlueprint ===
      "function"
  ) {
    return "executeBlueprint";
  }

  if (
    typeof provider
      .generate ===
      "function"
  ) {
    return "generate";
  }

  return null;
}

function describeProvider(
  provider
) {
  if (
    !isResponseProvider(
      provider
    )
  ) {
    return {
      available: false,
      type: PROVIDER_TYPES.NONE,
      name: null,
      version: null,
      method: null,
    };
  }

  const method =
    resolveProviderMethod(
      provider
    );

  return {
    available: true,

    type:
      provider.type ||
      PROVIDER_TYPES.CUSTOM,

    name:
      provider.name ||
      provider.id ||
      provider.constructor
        ?.name ||
      "custom-response-provider",

    version:
      provider.version ||
      null,

    method,
  };
}

function getProjectId(
  context,
  adaptivePlan,
  blueprint
) {
  const candidates = [
    context?.activeProjectId,

    getNestedValue(
      blueprint,
      "project.activeProjectId",
      null
    ),

    getNestedValue(
      adaptivePlan,
      "execution.activeProjectId",
      null
    ),

    getNestedValue(
      adaptivePlan,
      "projectState.activeProjectId",
      null
    ),

    context
      ?.activeProject
      ?.id,

    context
      ?.activeProject
      ?.projectId,
  ];

  for (
    const candidate
    of candidates
  ) {
    const cleaned =
      cleanString(
        candidate
      );

    if (cleaned) {
      return cleaned;
    }
  }

  return null;
}

function getMemoryContextSafely(
  memory,
  options = {}
) {
  if (
    !isMemoryService(
      memory
    ) ||
    typeof memory
      .getMemoryContext !==
      "function"
  ) {
    return null;
  }

  try {
    const result =
      memory
        .getMemoryContext(
          options
        );

    return (
      result &&
      typeof result ===
        "object"
        ? result
        : null
    );
  } catch (error) {
    console.warn(
      "ResponseGenerator memory context hydration error:",
      error
    );

    return null;
  }
}

function mergeMemoryContext({
  context,
  memoryContext,
}) {
  const suppliedContext =
    resolveGenerationContext(
      context
    );

  if (
    !memoryContext ||
    typeof memoryContext !==
      "object"
  ) {
    return suppliedContext;
  }

  const memoryCommunicationPreferences =
    memoryContext
      ?.communicationPreferences ||
    memoryContext
      ?.creatorProfile
      ?.communicationPreferences ||
    {};

  const memoryJourney =
    memoryContext
      ?.journey ||
    {};

  const memoryRelationship =
    memoryContext
      ?.relationship ||
    {};

  const activeProject =
    suppliedContext
      .activeProject ||
    memoryContext
      ?.activeProject ||
    null;

  const activeProjectId =
    suppliedContext
      .activeProjectId ||
    activeProject?.id ||
    activeProject
      ?.projectId ||
    memoryJourney
      ?.activeProjectId ||
    null;

  const existingMemories =
    suppliedContext
      .existingMemories
      .length > 0
      ? suppliedContext
          .existingMemories
      : asArray(
          memoryContext
            ?.existingMemories
        );

  const existingProjectMemories =
    suppliedContext
      .existingProjectMemories
      .length > 0
      ? suppliedContext
          .existingProjectMemories
      : asArray(
          memoryContext
            ?.existingProjectMemories
        );

  const existingPatterns =
    suppliedContext
      .existingPatterns
      .length > 0
      ? suppliedContext
          .existingPatterns
      : asArray(
          memoryContext
            ?.existingPatterns ||
          memoryContext
            ?.patterns
        );

  const existingObservations =
    suppliedContext
      .existingObservations
      .length > 0
      ? suppliedContext
          .existingObservations
      : asArray(
          memoryContext
            ?.existingObservations ||
          memoryContext
            ?.observations
        );

  const recentConversations =
    suppliedContext
      .recentConversations
      .length > 0
      ? suppliedContext
          .recentConversations
      : asArray(
          memoryContext
            ?.recentConversations
        );

  return {
    ...suppliedContext,

    creatorProfile:
      suppliedContext
        .creatorProfile ||
      memoryContext
        ?.creatorProfile ||
      null,

    memoryContext:
      cloneValue(
        memoryContext
      ),

    activeProject,

    activeProjectId,

    activeIdea:
      suppliedContext
        .activeIdea ||
      memoryContext
        ?.activeIdea ||
      null,

    existingMemories,

    existingProjectMemories,

    existingPatterns,

    existingObservations,

    recentConversations,

    interactionCount:
      suppliedContext
        .interactionCount ||
      memoryRelationship
        ?.interactionCount ||
      memoryJourney
        ?.conversationCount ||
      0,

    relationshipStage:
      suppliedContext
        .relationshipStage ||
      memoryRelationship
        ?.stage ||
      null,

    preferredResponseDepth:
      suppliedContext
        .preferredResponseDepth ||
      memoryCommunicationPreferences
        ?.preferredResponseDepth ||
      null,

    preferredGuidanceStyle:
      suppliedContext
        .preferredGuidanceStyle ||
      memoryCommunicationPreferences
        ?.preferredGuidanceStyle ||
      null,

    preferredMentorRole:
      suppliedContext
        .preferredMentorRole ||
      memoryCommunicationPreferences
        ?.preferredMentorRole ||
      null,

    preferredCommunicationPace:
      suppliedContext
        .preferredCommunicationPace ||
      memoryCommunicationPreferences
        ?.preferredCommunicationPace ||
      null,

    preferredVoiceProfile:
      suppliedContext
        .preferredVoiceProfile ||
      memoryCommunicationPreferences
        ?.preferredVoiceProfile ||
      null,

    preferredChannel:
      suppliedContext
        .preferredChannel ||
      memoryCommunicationPreferences
        ?.preferredChannel ||
      null,

    currentTimestamp:
      suppliedContext
        .currentTimestamp ||
      createTimestamp(),
  };
}

function classifyMemoryInstruction(
  instruction
) {
  const action =
    normaliseText(
      instruction?.action
    );

  const preferredTargetMethod =
    normaliseText(
      instruction
        ?.preferredTargetMethod
    );

  const targetMethod =
    normaliseText(
      instruction
        ?.targetMethod
    );

  const category =
    normaliseText(
      instruction?.category ||
      instruction
        ?.payload
        ?.category
    );

  const combined =
    normaliseText(
      [
        action,
        preferredTargetMethod,
        targetMethod,
        category,
      ]
        .filter(Boolean)
        .join(" ")
    );

  if (
    action ===
      "forget-memory" ||
    preferredTargetMethod ===
      "forgetmemory" ||
    [
      "forget",
      "delete",
      "remove",
      "erase",
    ].some(
      (value) =>
        combined.includes(
          value
        )
    )
  ) {
    return (
      MEMORY_OPERATION_TYPES
        .FORGET
    );
  }

  if (
    action ===
      "save-session-handoff" ||
    category ===
      "session-handoff" ||
    preferredTargetMethod ===
      "savesessionhandoff" ||
    combined.includes(
      "session-handoff"
    )
  ) {
    return (
      MEMORY_OPERATION_TYPES
        .SESSION_HANDOFF
    );
  }

  if (
    [
      "reinforce-memory",
      "weaken-memory",
      "supersede-memory",
      "archive-as-history",
      "resolve-thread",
      "update-profile",
    ].includes(action) ||
    [
      "reinforce",
      "supersede",
      "weaken",
      "archive",
      "resolve",
      "update",
    ].some(
      (value) =>
        combined.includes(
          value
        )
    )
  ) {
    return (
      MEMORY_OPERATION_TYPES
        .UPDATE
    );
  }

  if (
    [
      "capture-observation",
      "save-pattern",
      "save-project-memory",
      "save-deferred-topic",
      "hold-for-more-evidence",
    ].includes(action) ||
    [
      "save",
      "capture",
      "observation",
      "pattern",
      "remember",
    ].some(
      (value) =>
        combined.includes(
          value
        )
    )
  ) {
    return (
      MEMORY_OPERATION_TYPES
        .CAPTURE
    );
  }

  return (
    MEMORY_OPERATION_TYPES
      .UNKNOWN
  );
}

function getMemoryExecutionIntent(
  adaptivePlan
) {
  return {
    shouldCapture:
      Boolean(
        adaptivePlan
          ?.execution
          ?.shouldCaptureMemory
      ),

    shouldRecall:
      Boolean(
        adaptivePlan
          ?.execution
          ?.shouldRecallMemory
      ),

    shouldPreserveSessionHandoff:
      Boolean(
        adaptivePlan
          ?.execution
          ?.shouldPreserveSessionHandoff
      ),

    shouldApplyForget:
      Boolean(
        adaptivePlan
          ?.execution
          ?.shouldApplyForget
      ),

    shouldClarifyForget:
      Boolean(
        adaptivePlan
          ?.execution
          ?.shouldClarifyForget
      ),
  };
}

function getMemoryInstructions(
  adaptivePlan
) {
  return asArray(
    adaptivePlan
      ?.execution
      ?.memoryInstructions ||
    adaptivePlan
      ?.specialistPlans
      ?.memory
      ?.instructions
  );
}

function shouldExecuteMemoryOperations({
  adaptivePlan,
  options,
}) {
  if (
    !options
      .applyMemoryAutomatically
  ) {
    return false;
  }

  if (
    options
      .memoryApplicationPolicy ===
      MEMORY_APPLICATION_POLICIES
        .DISABLED ||
    options
      .memoryApplicationPolicy ===
      MEMORY_APPLICATION_POLICIES
        .MANUAL
  ) {
    return false;
  }

  const intent =
    getMemoryExecutionIntent(
      adaptivePlan
    );

  if (
    intent
      .shouldClarifyForget
  ) {
    return false;
  }

  const instructions =
    getMemoryInstructions(
      adaptivePlan
    );

  return Boolean(
    intent.shouldCapture ||
    intent
      .shouldPreserveSessionHandoff ||
    intent.shouldApplyForget ||
    instructions.length > 0
  );
}

function shouldForceMemoryBeforeGeneration({
  adaptivePlan,
}) {
  const intent =
    getMemoryExecutionIntent(
      adaptivePlan
    );

  if (
    intent.shouldApplyForget
  ) {
    return true;
  }

  if (
    intent
      .shouldPreserveSessionHandoff
  ) {
    return true;
  }

  return false;
}

function createEmptyMemoryApplicationSummary({
  adaptivePlan = null,
  reason = null,
} = {}) {
  const intent =
    getMemoryExecutionIntent(
      adaptivePlan
    );

  return {
    attempted: false,

    applied: [],
    skipped: [],
    errors: [],
    pending: [],

    operations: {
      capture: {
        attempted: false,
        successful: false,
        count: 0,
      },

      forget: {
        attempted: false,
        successful: false,
        count: 0,
      },

      sessionHandoff: {
        attempted: false,
        successful: false,
        count: 0,
      },

      update: {
        attempted: false,
        successful: false,
        count: 0,
      },

      unknown: {
        attempted: false,
        successful: false,
        count: 0,
      },
    },

    intent:
      cloneValue(
        intent
      ),

    successful: false,

    canClaimStorageSuccess:
      false,

    canClaimDeletionSuccess:
      false,

    canClaimHandoffSuccess:
      false,

    reason:
      reason ||
      null,
  };
}

function createMemoryApplicationSummary({
  result = null,
  adaptivePlan = null,
} = {}) {
  if (!result) {
    return (
      createEmptyMemoryApplicationSummary({
        adaptivePlan,
      })
    );
  }

  const applied =
    asArray(
      result.applied
    );

  const skipped =
    asArray(
      result.skipped
    );

  const errors =
    asArray(
      result.errors
    );

  const pending =
    skipped.filter(
      (item) =>
        item
          ?.instruction
          ?.requiresMemoryAdapterResolution ||
        normaliseText(
          item?.reason
        ).includes(
          "future"
        ) ||
        normaliseText(
          item?.reason
        ).includes(
          "pending"
        ) ||
        normaliseText(
          item?.reason
        ).includes(
          "adapter"
        )
    );

  const operationBuckets = {
    capture: [],
    forget: [],
    sessionHandoff: [],
    update: [],
    unknown: [],
  };

  applied.forEach(
    (item) => {
      const type =
        classifyMemoryInstruction(
          item?.instruction
        );

      switch (type) {
        case MEMORY_OPERATION_TYPES
          .CAPTURE:
          operationBuckets
            .capture
            .push(item);
          break;

        case MEMORY_OPERATION_TYPES
          .FORGET:
          operationBuckets
            .forget
            .push(item);
          break;

        case MEMORY_OPERATION_TYPES
          .SESSION_HANDOFF:
          operationBuckets
            .sessionHandoff
            .push(item);
          break;

        case MEMORY_OPERATION_TYPES
          .UPDATE:
          operationBuckets
            .update
            .push(item);
          break;

        default:
          operationBuckets
            .unknown
            .push(item);
          break;
      }
    }
  );

  const attemptedInstructions = [
    ...applied,
    ...skipped,
    ...errors,
  ];

  const attemptedTypes =
    attemptedInstructions.map(
      (item) =>
        classifyMemoryInstruction(
          item?.instruction
        )
    );

  const intent =
    getMemoryExecutionIntent(
      adaptivePlan
    );

  const captureSuccessful =
    operationBuckets
      .capture
      .length > 0;

  const updateSuccessful =
    operationBuckets
      .update
      .length > 0;

  const forgetSuccessful =
    operationBuckets
      .forget
      .length > 0;

  const handoffSuccessful =
    operationBuckets
      .sessionHandoff
      .length > 0;

  const successful =
    errors.length === 0 &&
    applied.length > 0;

  return {
    attempted:
      attemptedInstructions
        .length > 0,

    applied:
      cloneValue(
        applied
      ),

    skipped:
      cloneValue(
        skipped
      ),

    errors:
      cloneValue(
        errors
      ),

    pending:
      cloneValue(
        pending
      ),

    operations: {
      capture: {
        attempted:
          intent.shouldCapture ||
          attemptedTypes.includes(
            MEMORY_OPERATION_TYPES
              .CAPTURE
          ),

        successful:
          captureSuccessful,

        count:
          operationBuckets
            .capture
            .length,
      },

      forget: {
        attempted:
          intent.shouldApplyForget ||
          attemptedTypes.includes(
            MEMORY_OPERATION_TYPES
              .FORGET
          ),

        successful:
          forgetSuccessful,

        count:
          operationBuckets
            .forget
            .length,
      },

      sessionHandoff: {
        attempted:
          intent
            .shouldPreserveSessionHandoff ||
          attemptedTypes.includes(
            MEMORY_OPERATION_TYPES
              .SESSION_HANDOFF
          ),

        successful:
          handoffSuccessful,

        count:
          operationBuckets
            .sessionHandoff
            .length,
      },

      update: {
        attempted:
          attemptedTypes.includes(
            MEMORY_OPERATION_TYPES
              .UPDATE
          ),

        successful:
          updateSuccessful,

        count:
          operationBuckets
            .update
            .length,
      },

      unknown: {
        attempted:
          attemptedTypes.includes(
            MEMORY_OPERATION_TYPES
              .UNKNOWN
          ),

        successful:
          operationBuckets
            .unknown
            .length > 0,

        count:
          operationBuckets
            .unknown
            .length,
      },
    },

    intent:
      cloneValue(
        intent
      ),

    successful,

    canClaimStorageSuccess:
      Boolean(
        captureSuccessful ||
        updateSuccessful
      ),

    canClaimDeletionSuccess:
      Boolean(
        forgetSuccessful
      ),

    canClaimHandoffSuccess:
      Boolean(
        handoffSuccessful
      ),

    reason:
      result.reason ||
      null,
  };
}

function createProviderRequest({
  generationId,
  message,
  context,
  adaptivePlan,
  blueprint,
  communicationPlan,
  options,
  memoryApplication,
}) {
  const activeProjectId =
    getProjectId(
      context,
      adaptivePlan,
      blueprint
    );

  return {
    id:
      generationId,

    input: {
      creatorMessage:
        cleanString(
          message
        ),
    },

    context:
      cloneValue(
        context
      ),

    adaptivePlan:
      cloneValue(
        adaptivePlan
      ),

    blueprint:
      cloneValue(
        blueprint
      ),

    communicationPlan:
      cloneValue(
        communicationPlan
      ),

    project: {
      activeProjectId,

      activeProject:
        cloneValue(
          context
            ?.activeProject ||
          blueprint
            ?.project
            ?.activeProject ||
          null
        ),

      activeStage:
        cloneValue(
          context
            ?.activeStage ||
          blueprint
            ?.project
            ?.activeStage ||
          null
        ),

      activeScene:
        cloneValue(
          context
            ?.activeScene ||
          blueprint
            ?.project
            ?.activeScene ||
          null
        ),

      activeCharacter:
        cloneValue(
          context
            ?.activeCharacter ||
          blueprint
            ?.project
            ?.activeCharacter ||
          null
        ),

      returnPoint:
        context
          ?.returnPoint ||
        null,

      continuity:
        cloneValue(
          blueprint
            ?.project ||
          {}
        ),
    },

    memoryExecution:
      cloneValue(
        memoryApplication
      ),

    memoryIntent:
      cloneValue(
        getMemoryExecutionIntent(
          adaptivePlan
        )
      ),

    output: {
      format:
        options.outputFormat,

      maximumCharacters:
        options
          .maximumResponseCharacters,
    },

    constraints: {
      ...cloneValue(
        blueprint
          ?.constraints ||
        {}
      ),

      obeySectionOrder:
        true,

      doNotExposeInternalPlanning:
        true,

      doNotExposeSpecialistAgents:
        true,

      doNotInventMemorySuccess:
        true,

      doNotInventMemoryDeletion:
        true,

      doNotInventSessionHandoffSuccess:
        true,

      doNotOverrideSilence:
        true,

      creatorCorrectionsOverrideMemory:
        true,

      creatorCorrectionsOverrideAgentAssumptions:
        true,

      memoryStorageVerified:
        Boolean(
          memoryApplication
            ?.canClaimStorageSuccess
        ),

      memoryDeletionVerified:
        Boolean(
          memoryApplication
            ?.canClaimDeletionSuccess
        ),

      sessionHandoffVerified:
        Boolean(
          memoryApplication
            ?.canClaimHandoffSuccess
        ),
    },

    style:
      cloneValue(
        blueprint
          ?.style ||
        {}
      ),

    languageGuidance:
      cloneValue(
        blueprint
          ?.languageGuidance ||
        []
      ),

    sourceGuidance:
      cloneValue(
        blueprint
          ?.sourceGuidance ||
        []
      ),

    executionIntent:
      cloneValue(
        blueprint
          ?.executionIntent ||
        {}
      ),

    metadata:
      cloneValue(
        options.metadata ||
        {}
      ),
  };
}

function normaliseProviderResult(
  providerResult
) {
  if (
    typeof providerResult ===
    "string"
  ) {
    return {
      text:
        providerResult,

      structured:
        null,

      usage:
        null,

      metadata: {},

      raw:
        providerResult,
    };
  }

  if (
    !providerResult ||
    typeof providerResult !==
      "object"
  ) {
    return {
      text: "",
      structured: null,
      usage: null,
      metadata: {},
      raw: providerResult,
    };
  }

  const text =
    providerResult.text ??
    providerResult.content ??
    providerResult.response ??
    providerResult.output ??
    providerResult.message ??
    "";

  return {
    text:
      typeof text ===
      "string"
        ? text
        : "",

    structured:
      providerResult
        .structured ??
      providerResult
        .data ??
      null,

    usage:
      providerResult
        .usage ??
      null,

    metadata: {
      ...cloneValue(
        providerResult
          .metadata ||
        {}
      ),

      finishReason:
        providerResult
          .finishReason ??
        providerResult
          .finish_reason ??
        null,

      model:
        providerResult
          .model ??
        null,
    },

    raw:
      providerResult,
  };
}

async function executeProvider({
  provider,
  request,
  options,
}) {
  const providerMethod =
    resolveProviderMethod(
      provider
    );

  if (!providerMethod) {
    throw new TypeError(
      "No compatible response-provider method is available."
    );
  }

  let latestError =
    null;

  for (
    let attempt = 1;
    attempt <=
      options
        .maximumProviderAttempts;
    attempt += 1
  ) {
    assertNotAborted(
      options.abortSignal
    );

    try {
      const result =
        await provider[
          providerMethod
        ](request);

      return {
        result:
          normaliseProviderResult(
            result
          ),

        attempt,

        providerMethod,
      };
    } catch (error) {
      latestError =
        error;

      if (
        error?.name ===
          "AbortError" ||
        attempt >=
          options
            .maximumProviderAttempts
      ) {
        throw error;
      }
    }
  }

  throw (
    latestError ||
    new Error(
      "Response provider failed without returning an error."
    )
  );
}

function resolveSectionSourceText(
  section
) {
  const sourceData =
    section?.sourceData;

  if (!sourceData) {
    return "";
  }

  if (
    typeof sourceData ===
    "string"
  ) {
    return cleanString(
      sourceData
    );
  }

  if (
    Array.isArray(
      sourceData
    )
  ) {
    return sourceData
      .map((value) => {
        if (
          typeof value ===
          "string"
        ) {
          return value;
        }

        return (
          value?.text ||
          value?.content ||
          value?.summary ||
          value?.title ||
          value?.description ||
          (
            typeof value?.value ===
              "string"
              ? value.value
              : ""
          ) ||
          ""
        );
      })
      .filter(Boolean)
      .join(" ");
  }

  return cleanString(
    sourceData.text ||
    sourceData.content ||
    sourceData.summary ||
    sourceData.description ||
    sourceData.title ||
    (
      typeof sourceData.value ===
        "string"
        ? sourceData.value
        : ""
    ) ||
    ""
  );
}

function resolveRecallMemoryText(
  blueprint
) {
  const recallPlan =
    blueprint
      ?.memory
      ?.recallPlan;

  const rankedMemories =
    asArray(
      recallPlan
        ?.memories
    );

  const rankedMemory =
    rankedMemories[0]
      ?.memory ||
    rankedMemories[0] ||
    null;

  const memory =
    recallPlan
      ?.memory ||
    rankedMemory ||
    null;

  return cleanString(
    memory?.content ||
    memory?.text ||
    memory?.description ||
    memory?.summary ||
    memory?.title ||
    ""
  );
}

function renderAcknowledgement({
  context,
}) {
  if (
    context
      ?.creatorExplicitlyAskedForNextStep ||
    context
      ?.creatorExplicitlyAskedToContinue
  ) {
    return (
      "Aye. Let’s continue."
    );
  }

  return (
    "I’m with you."
  );
}

function renderUnderstanding() {
  return (
    "I can see the direction you’re taking."
  );
}

function renderReflection({
  section,
}) {
  const sourceText =
    resolveSectionSourceText(
      section
    );

  if (sourceText) {
    return (
      "Something I’m noticing is " +
      `${sourceText}. ` +
      "Treat that as an observation rather than a fixed conclusion."
    );
  }

  return (
    "Something seems to be taking shape here. " +
    "We can explore it without forcing it into a final answer too early."
  );
}

function renderReassurance() {
  return (
    "We already have enough useful material to keep moving. " +
    "There’s no need to force the missing part."
  );
}

function renderMemoryCapture({
  memoryApplication,
}) {
  if (
    memoryApplication
      ?.canClaimStorageSuccess
  ) {
    return (
      "I’ve saved that."
    );
  }

  if (
    memoryApplication
      ?.attempted &&
    memoryApplication
      ?.errors
      ?.length > 0
  ) {
    return (
      "That’s worth preserving. " +
      "The memory save wasn’t confirmed, so I won’t pretend it was."
    );
  }

  if (
    memoryApplication
      ?.pending
      ?.length > 0
  ) {
    return (
      "That’s worth preserving. " +
      "Storage isn’t confirmed yet."
    );
  }

  return (
    "That’s worth keeping in view."
  );
}

function renderMemoryRecall({
  blueprint,
}) {
  const memoryText =
    resolveRecallMemoryText(
      blueprint
    );

  if (!memoryText) {
    return (
      "Something we established earlier is useful here, so I’ll use only the part that helps us continue."
    );
  }

  return (
    `Earlier we established ${memoryText}. ` +
    "That looks useful again here."
  );
}

function renderContextRestoration({
  section,
}) {
  const sourceText =
    resolveSectionSourceText(
      section
    );

  if (!sourceText) {
    return (
      "We can return to the last useful point without rebuilding the whole conversation."
    );
  }

  return (
    "The thread we were following was " +
    `${sourceText}.`
  );
}

function renderProjectContext({
  section,
  context,
}) {
  const sourceData =
    section
      ?.sourceData ||
    {};

  const projectTitle =
    cleanString(
      context
        ?.activeProject
        ?.title ||
      context
        ?.activeProject
        ?.name ||
      sourceData
        ?.activeProject
        ?.title ||
      sourceData
        ?.activeProject
        ?.name ||
      ""
    );

  const activeStage =
    cleanString(
      context
        ?.activeStage
        ?.title ||
      context
        ?.activeStage
        ?.name ||
      (
        typeof context
          ?.activeStage ===
          "string"
          ? context.activeStage
          : ""
      ) ||
      sourceData
        ?.activeStage
        ?.title ||
      sourceData
        ?.activeStage
        ?.name ||
      (
        typeof sourceData
          ?.activeStage ===
          "string"
          ? sourceData.activeStage
          : ""
      ) ||
      ""
    );

  if (
    projectTitle &&
    activeStage
  ) {
    return (
      `We’re back in ${projectTitle}, at ${activeStage}.`
    );
  }

  if (projectTitle) {
    return (
      `We’re back in ${projectTitle}.`
    );
  }

  if (activeStage) {
    return (
      `We left off at ${activeStage}.`
    );
  }

  return (
    "I’ve got the working context. We can continue from where we stopped."
  );
}

function renderMemoryForgetClarification({
  blueprint,
}) {
  const forgetPlan =
    blueprint
      ?.memory
      ?.forgetPlan;

  const matchedMemories =
    asArray(
      forgetPlan
        ?.matchedMemories
    );

  if (
    matchedMemories.length ===
    1
  ) {
    const memoryText =
      cleanString(
        matchedMemories[0]
          ?.title ||
        matchedMemories[0]
          ?.description ||
        matchedMemories[0]
          ?.content ||
        ""
      );

    if (memoryText) {
      return (
        `Just to make sure I remove the right thing: do you mean ${memoryText}?`
      );
    }
  }

  return (
    "Which specific thing would you like me to forget?"
  );
}

function renderMemoryForget({
  memoryApplication,
}) {
  if (
    memoryApplication
      ?.canClaimDeletionSuccess
  ) {
    return (
      "Done. I’ve removed it from memory."
    );
  }

  if (
    memoryApplication
      ?.attempted &&
    memoryApplication
      ?.errors
      ?.length > 0
  ) {
    return (
      "I haven’t claimed it was removed because the deletion wasn’t confirmed."
    );
  }

  return (
    "I haven’t removed anything yet because deletion hasn’t been confirmed."
  );
}

function renderRecommendation({
  context,
}) {
  if (
    context?.nextTask
  ) {
    return (
      `My recommendation: ${context.nextTask}.`
    );
  }

  return (
    "My recommendation is to take the smallest useful next step."
  );
}

function renderCreativeDirection({
  blueprint,
}) {
  switch (
    blueprint?.action
  ) {
    case "compose-next-task":
      return (
        "We’re ready for the next task."
      );

    case "compose-creation-handoff":
      return (
        "We know enough to create the first version."
      );

    case "compose-refinement-handoff":
      return (
        "The first version exists. Now we refine the highest-value part."
      );

    case "compose-publishing-handoff":
      return (
        "The creation is ready to move into publishing."
      );

    default:
      return (
        "We’re ready to move forward."
      );
  }
}

function renderNextStep({
  context,
}) {
  if (
    context?.nextTask
  ) {
    return cleanString(
      context.nextTask
    );
  }

  if (
    context?.returnPoint
  ) {
    return (
      `Next: ${context.returnPoint}.`
    );
  }

  return (
    "Let’s take the next concrete step."
  );
}

function renderQuestion({
  blueprint,
}) {
  switch (
    blueprint?.action
  ) {
    case "compose-reflection":
      return (
        "Does that feel accurate to you?"
      );

    case "compose-context-restoration":
      return (
        "Does returning to that point reconnect you with the thought?"
      );

    case "compose-memory-recall":
      return (
        "Would you like to reopen that, or shall we keep moving?"
      );

    case "compose-forget-clarification":
      return (
        "Which specific memory do you mean?"
      );

    case "compose-brainstorming-turn":
      return (
        "What part of that idea has the most energy for you?"
      );

    case "compose-acknowledgement":
    default:
      return (
        "Where would you like to take it next?"
      );
  }
}

function renderSessionRecap({
  context,
}) {
  const projectTitle =
    cleanString(
      context
        ?.activeProject
        ?.title ||
      context
        ?.activeProject
        ?.name ||
      ""
    );

  if (projectTitle) {
    return (
      `We’ve reached a clear stopping point on ${projectTitle}.`
    );
  }

  return (
    "We’ve reached a clear stopping point."
  );
}

function renderSessionHandoff({
  context,
  memoryApplication,
}) {
  const returnPoint =
    cleanString(
      context
        ?.returnPoint ||
      context
        ?.nextTask ||
      ""
    );

  if (
    memoryApplication
      ?.canClaimHandoffSuccess
  ) {
    if (returnPoint) {
      return (
        `Your place is saved. We’ll come back at ${returnPoint}.`
      );
    }

    return (
      "Your place is saved for next time."
    );
  }

  if (returnPoint) {
    return (
      `Our return point is ${returnPoint}.`
    );
  }

  return (
    "We’ve got a clear point to return to."
  );
}

function renderOpenDoor({
  blueprint,
}) {
  if (
    blueprint?.action ===
      "compose-capture-and-continue"
  ) {
    return (
      "We can come back to it whenever it becomes useful."
    );
  }

  return (
    "We can pick this up again whenever you’re ready."
  );
}

function renderClosing() {
  return (
    "We’ll continue from here."
  );
}

function renderSectionDeterministically({
  section,
  message,
  blueprint,
  context,
  memoryApplication,
}) {
  switch (
    section?.type
  ) {
    case "opening":
      return "";

    case "acknowledgement":
      return (
        renderAcknowledgement({
          context,
        })
      );

    case "understanding":
      return (
        renderUnderstanding()
      );

    case "reflection":
      return (
        renderReflection({
          section,
        })
      );

    case "reassurance":
      return (
        renderReassurance()
      );

    case "memory-capture":
      return (
        renderMemoryCapture({
          memoryApplication,
        })
      );

    case "memory-recall":
      return (
        renderMemoryRecall({
          blueprint,
        })
      );

    case "memory-forget-clarification":
      return (
        renderMemoryForgetClarification({
          blueprint,
        })
      );

    case "memory-forget":
      return (
        renderMemoryForget({
          memoryApplication,
        })
      );

    case "context-restoration":
      return (
        renderContextRestoration({
          section,
        })
      );

    case "project-context":
      return (
        renderProjectContext({
          section,
          context,
        })
      );

    case "session-handoff":
      return (
        renderSessionHandoff({
          context,
          memoryApplication,
        })
      );

    case "teaching":
      return (
        "Let’s keep this to one concept, understand why it works, then apply it."
      );

    case "recommendation":
      return (
        renderRecommendation({
          context,
        })
      );

    case "creative-direction":
      return (
        renderCreativeDirection({
          blueprint,
        })
      );

    case "next-step":
      return (
        renderNextStep({
          context,
        })
      );

    case "question":
      return (
        renderQuestion({
          blueprint,
        })
      );

    case "pause":
      return "";

    case "session-recap":
      return (
        renderSessionRecap({
          context,
        })
      );

    case "open-door":
      return (
        renderOpenDoor({
          blueprint,
        })
      );

    case "closing":
      return (
        renderClosing()
      );

    default:
      return "";
  }
}

function renderBlueprintDeterministically({
  message,
  blueprint,
  context,
  memoryApplication,
}) {
  const sections =
    asArray(
      blueprint?.sections
    );

  return sections
    .map(
      (section) =>
        renderSectionDeterministically({
          section,
          message,
          blueprint,
          context,
          memoryApplication,
        })
    )
    .map(
      cleanString
    )
    .filter(Boolean)
    .join("\n\n");
}

function createValidationIssue({
  code,
  severity,
  message,
  metadata = {},
}) {
  return {
    code,
    severity,

    message:
      cleanString(
        message
      ),

    metadata:
      cloneValue(
        metadata
      ),
  };
}

function countQuestions(
  text
) {
  const matches =
    cleanString(
      text
    ).match(/\?/g);

  return (
    matches?.length ||
    0
  );
}

function findForbiddenPatterns({
  text,
  forbiddenPatterns,
}) {
  const normalisedText =
    cleanString(
      text
    )
      .toLowerCase();

  return asArray(
    forbiddenPatterns
  ).filter(
    (pattern) => {
      const cleanedPattern =
        cleanString(
          pattern
        )
          .toLowerCase();

      return Boolean(
        cleanedPattern &&
        normalisedText.includes(
          cleanedPattern
        )
      );
    }
  );
}

function detectsStorageSuccessClaim(
  text
) {
  const normalised =
    normaliseText(
      text
    );

  const phrases = [
    "i've saved that",
    "ive saved that",
    "i saved that",
    "i've added it to memory",
    "ive added it to memory",
    "i added it to memory",
    "it's saved in memory",
    "its saved in memory",
    "i've remembered that",
    "ive remembered that",
    "i've stored that",
    "ive stored that",
  ];

  return phrases.some(
    (phrase) =>
      normalised.includes(
        phrase
      )
  );
}

function detectsDeletionSuccessClaim(
  text
) {
  const normalised =
    normaliseText(
      text
    );

  const phrases = [
    "i've removed it from memory",
    "ive removed it from memory",
    "i removed it from memory",
    "i've deleted it from memory",
    "ive deleted it from memory",
    "i deleted it from memory",
    "i've forgotten it",
    "ive forgotten it",
    "i forgot it",
    "it's been deleted",
    "its been deleted",
    "it's been removed",
    "its been removed",
  ];

  return phrases.some(
    (phrase) =>
      normalised.includes(
        phrase
      )
  );
}

function detectsHandoffSuccessClaim(
  text
) {
  const normalised =
    normaliseText(
      text
    );

  const phrases = [
    "your place is saved",
    "i've saved our place",
    "ive saved our place",
    "i saved our place",
    "the handoff is saved",
    "i've saved where we stopped",
    "ive saved where we stopped",
    "i've saved your return point",
    "ive saved your return point",
  ];

  return phrases.some(
    (phrase) =>
      normalised.includes(
        phrase
      )
  );
}

function detectsAgentExposure(
  text
) {
  const normalised =
    normaliseText(
      text
    );

  const phrases = [
    "story agent says",
    "continuity agent says",
    "character agent says",
    "editing agent says",
    "retention agent says",
    "publishing agent says",
    "specialist agent says",
    "according to the story agent",
    "according to the continuity agent",
    "adaptive mentor engine says",
    "creator memory engine says",
    "response composer says",
    "progression engine says",
    "reflection engine says",
  ];

  return phrases.some(
    (phrase) =>
      normalised.includes(
        phrase
      )
  );
}

function validateGeneratedResponse({
  text,
  blueprint,
  options,
  memoryApplication,
}) {
  const issues = [];

  const cleanedText =
    cleanString(
      text
    );

  const constraints =
    blueprint
      ?.constraints ||
    {};

  if (
    constraints
      .shouldGenerateText ===
      false &&
    cleanedText
  ) {
    issues.push(
      createValidationIssue({
        code:
          "TEXT_GENERATED_DURING_SILENCE",

        severity:
          VALIDATION_SEVERITIES
            .ERROR,

        message:
          "The blueprint requested silence, but text was generated.",
      })
    );
  }

  if (
    constraints
      .shouldGenerateText !==
      false &&
    options
      .rejectEmptyProviderOutput &&
    !cleanedText
  ) {
    issues.push(
      createValidationIssue({
        code:
          "EMPTY_RESPONSE",

        severity:
          VALIDATION_SEVERITIES
            .ERROR,

        message:
          "The provider returned no response text.",
      })
    );
  }

  if (
    cleanedText.length >
    options
      .maximumResponseCharacters
  ) {
    issues.push(
      createValidationIssue({
        code:
          "RESPONSE_TOO_LONG",

        severity:
          VALIDATION_SEVERITIES
            .ERROR,

        message:
          "The generated response exceeds the configured character limit.",

        metadata: {
          actualCharacters:
            cleanedText.length,

          maximumCharacters:
            options
              .maximumResponseCharacters,
        },
      })
    );
  }

  const maximumQuestions =
    constraints
      .maximumQuestions !=
      null
      ? Number(
          constraints
            .maximumQuestions
        )
      : null;

  const questionCount =
    countQuestions(
      cleanedText
    );

  if (
    maximumQuestions !==
      null &&
    Number.isFinite(
      maximumQuestions
    ) &&
    questionCount >
      maximumQuestions
  ) {
    issues.push(
      createValidationIssue({
        code:
          "TOO_MANY_QUESTIONS",

        severity:
          VALIDATION_SEVERITIES
            .WARNING,

        message:
          "The generated response contains more questions than the blueprint allows.",

        metadata: {
          questionCount,
          maximumQuestions,
        },
      })
    );
  }

  const forbiddenPatterns =
    findForbiddenPatterns({
      text:
        cleanedText,

      forbiddenPatterns:
        constraints
          .forbiddenPatterns ||
        [],
    });

  if (
    forbiddenPatterns.length >
    0
  ) {
    issues.push(
      createValidationIssue({
        code:
          "FORBIDDEN_LANGUAGE_PATTERN",

        severity:
          VALIDATION_SEVERITIES
            .ERROR,

        message:
          "The generated response contains prohibited language.",

        metadata: {
          patterns:
            forbiddenPatterns,
        },
      })
    );
  }

  if (
    detectsStorageSuccessClaim(
      cleanedText
    ) &&
    !memoryApplication
      ?.canClaimStorageSuccess
  ) {
    issues.push(
      createValidationIssue({
        code:
          "UNVERIFIED_MEMORY_STORAGE_CLAIM",

        severity:
          VALIDATION_SEVERITIES
            .ERROR,

        message:
          "The response claims memory storage succeeded without persistence confirmation.",
      })
    );
  }

  if (
    detectsDeletionSuccessClaim(
      cleanedText
    ) &&
    !memoryApplication
      ?.canClaimDeletionSuccess
  ) {
    issues.push(
      createValidationIssue({
        code:
          "UNVERIFIED_MEMORY_DELETION_CLAIM",

        severity:
          VALIDATION_SEVERITIES
            .ERROR,

        message:
          "The response claims memory deletion succeeded without persistence confirmation.",
      })
    );
  }

  if (
    detectsHandoffSuccessClaim(
      cleanedText
    ) &&
    !memoryApplication
      ?.canClaimHandoffSuccess
  ) {
    issues.push(
      createValidationIssue({
        code:
          "UNVERIFIED_SESSION_HANDOFF_CLAIM",

        severity:
          VALIDATION_SEVERITIES
            .ERROR,

        message:
          "The response claims the creator's return position was saved without persistence confirmation.",
      })
    );
  }

  if (
    detectsAgentExposure(
      cleanedText
    )
  ) {
    issues.push(
      createValidationIssue({
        code:
          "SPECIALIST_AGENT_EXPOSED",

        severity:
          VALIDATION_SEVERITIES
            .ERROR,

        message:
          "The response exposed internal Mentor machinery.",
      })
    );
  }

  return {
    valid:
      !issues.some(
        (issue) =>
          issue.severity ===
          VALIDATION_SEVERITIES
            .ERROR
      ),

    issues,

    metrics: {
      characters:
        cleanedText.length,

      words:
        cleanedText
          ? cleanedText
              .split(/\s+/)
              .length
          : 0,

      questions:
        questionCount,

      paragraphs:
        cleanedText
          ? cleanedText
              .split(
                /\n\s*\n/
              )
              .filter(Boolean)
              .length
          : 0,
    },
  };
}

function normaliseGeneratedText({
  text,
  blueprint,
  options,
}) {
  if (
    blueprint
      ?.constraints
      ?.shouldGenerateText ===
      false
  ) {
    return "";
  }

  let nextText =
    typeof text ===
      "string"
      ? text
      : "";

  if (
    options.trimOutput
  ) {
    nextText =
      nextText.trim();
  }

  if (
    nextText.length >
    options
      .maximumResponseCharacters
  ) {
    nextText =
      nextText
        .slice(
          0,
          options
            .maximumResponseCharacters
        )
        .trimEnd();
  }

  return nextText;
}

function mergeValidationIssues(
  firstIssues = [],
  secondIssues = []
) {
  const serialised =
    uniqueValues([
      ...asArray(
        firstIssues
      ).map(
        (issue) =>
          JSON.stringify(
            issue
          )
      ),

      ...asArray(
        secondIssues
      ).map(
        (issue) =>
          JSON.stringify(
            issue
          )
      ),
    ]);

  return serialised.map(
    (issue) =>
      JSON.parse(
        issue
      )
  );
}

function createCompletedResponse({
  generationId,
  message,
  text,
  structured,
  source,
  status,
  context,
  adaptivePlan,
  blueprint,
  communicationPlan,
  memoryApplication,
  memoryContext,
  provider,
  providerExecution,
  validation,
  lifecycle,
  options,
  startedAt,
}) {
  const completedAt =
    createTimestamp();

  const startedTime =
    new Date(
      startedAt
    ).getTime();

  const completedTime =
    new Date(
      completedAt
    ).getTime();

  return {
    id:
      generationId,

    generator:
      "response-generator",

    version:
      RESPONSE_GENERATOR_VERSION,

    status,

    source,

    input: {
      message:
        cleanString(
          message
        ),
    },

    response: {
      text:
        cleanString(
          text
        ),

      structured:
        cloneValue(
          structured
        ),

      format:
        options.outputFormat,

      isSilent:
        status ===
          GENERATION_STATUSES
            .SILENT ||
        !cleanString(
          text
        ),
    },

    provider: {
      ...cloneValue(
        provider
      ),

      attempt:
        providerExecution
          ?.attempt ||
        null,

      method:
        providerExecution
          ?.providerMethod ||
        provider?.method ||
        null,

      usage:
        cloneValue(
          providerExecution
            ?.result
            ?.usage ||
          null
        ),

      metadata:
        cloneValue(
          providerExecution
            ?.result
            ?.metadata ||
          {}
        ),
    },

    memory:
      cloneValue(
        memoryApplication
      ),

    memoryContext:
      cloneValue(
        memoryContext
      ),

    project: {
      activeProjectId:
        getProjectId(
          context,
          adaptivePlan,
          blueprint
        ),

      activeProject:
        cloneValue(
          context
            ?.activeProject ||
          blueprint
            ?.project
            ?.activeProject ||
          null
        ),

      activeStage:
        cloneValue(
          context
            ?.activeStage ||
          blueprint
            ?.project
            ?.activeStage ||
          null
        ),

      activeScene:
        cloneValue(
          context
            ?.activeScene ||
          blueprint
            ?.project
            ?.activeScene ||
          null
        ),

      returnPoint:
        context
          ?.returnPoint ||
        null,

      sessionHandoffPreserved:
        Boolean(
          memoryApplication
            ?.canClaimHandoffSuccess
        ),
    },

    validation:
      cloneValue(
        validation
      ),

    adaptivePlan:
      options
        .includeSpecialistPlans
        ? cloneValue(
            adaptivePlan
          )
        : {
            id:
              adaptivePlan
                ?.id ||
              null,

            primaryAction:
              cloneValue(
                adaptivePlan
                  ?.primaryAction ||
                null
              ),

            behaviour:
              cloneValue(
                adaptivePlan
                  ?.behaviour ||
                null
              ),

            execution:
              cloneValue(
                adaptivePlan
                  ?.execution ||
                null
              ),

            signals:
              cloneValue(
                adaptivePlan
                  ?.signals ||
                []
              ),

            projectState:
              cloneValue(
                adaptivePlan
                  ?.projectState ||
                null
              ),

            decisionSummary:
              adaptivePlan
                ?.decisionSummary ||
              null,
          },

    blueprint:
      options
        .includeBlueprint
        ? cloneValue(
            blueprint
          )
        : {
            id:
              blueprint?.id ||
              null,

            action:
              blueprint?.action ||
              null,

            length:
              blueprint?.length ||
              null,

            style:
              cloneValue(
                blueprint
                  ?.style ||
                null
              ),

            executionIntent:
              cloneValue(
                blueprint
                  ?.executionIntent ||
                null
              ),

            blueprintSummary:
              blueprint
                ?.blueprintSummary ||
              null,
          },

    communicationPlan:
      options
        .includeCommunicationPlan
        ? cloneValue(
            communicationPlan
          )
        : {
            id:
              communicationPlan
                ?.id ||
              null,

            mode:
              communicationPlan
                ?.mode ||
              null,

            conversationPhase:
              communicationPlan
                ?.conversationPhase ||
              null,

            landingStyle:
              communicationPlan
                ?.landingStyle ||
              null,

            style:
              cloneValue(
                communicationPlan
                  ?.style ||
                null
              ),

            primaryEffect:
              communicationPlan
                ?.primaryEffect ||
              null,

            summary:
              communicationPlan
                ?.summary ||
              null,
          },

    diagnostics:
      options
        .includeDiagnostics
        ? {
            lifecycle:
              cloneValue(
                lifecycle
              ),

            durationMs:
              Number.isFinite(
                completedTime -
                startedTime
              )
                ? completedTime -
                  startedTime
                : null,

            contextSnapshot:
              cloneValue(
                context
              ),

            memoryTruth: {
              storageConfirmed:
                Boolean(
                  memoryApplication
                    ?.canClaimStorageSuccess
                ),

              deletionConfirmed:
                Boolean(
                  memoryApplication
                    ?.canClaimDeletionSuccess
                ),

              handoffConfirmed:
                Boolean(
                  memoryApplication
                    ?.canClaimHandoffSuccess
                ),
            },
          }
        : null,

    createdAt:
      startedAt,

    completedAt,
  };
}

function createFailureResponse({
  generationId,
  message,
  context,
  lifecycle,
  error,
  startedAt,
  source =
    RESPONSE_SOURCES
      .FALLBACK_RENDERER,
  adaptivePlan = null,
  blueprint = null,
  communicationPlan = null,
  memoryApplication = null,
  memoryContext = null,
}) {
  const isCancelled =
    error?.name ===
    "AbortError";

  return {
    id:
      generationId,

    generator:
      "response-generator",

    version:
      RESPONSE_GENERATOR_VERSION,

    status:
      isCancelled
        ? GENERATION_STATUSES
            .CANCELLED
        : GENERATION_STATUSES
            .FAILED,

    source,

    input: {
      message:
        cleanString(
          message
        ),
    },

    response: {
      text:
        isCancelled
          ? ""
          : (
              "I’m still with you. " +
              "Something interrupted the response pipeline, so I’ve stopped rather than guessing."
            ),

      structured:
        null,

      format:
        OUTPUT_FORMATS.TEXT,

      isSilent:
        isCancelled,
    },

    memory:
      cloneValue(
        memoryApplication ||
        createEmptyMemoryApplicationSummary({
          adaptivePlan,
        })
      ),

    memoryContext:
      cloneValue(
        memoryContext
      ),

    error: {
      name:
        error?.name ||
        "Error",

      message:
        error instanceof Error
          ? error.message
          : String(error),

      stack:
        error instanceof Error
          ? error.stack ||
            null
          : null,
    },

    adaptivePlan:
      adaptivePlan
        ? cloneValue(
            adaptivePlan
          )
        : null,

    blueprint:
      blueprint
        ? cloneValue(
            blueprint
          )
        : null,

    communicationPlan:
      communicationPlan
        ? cloneValue(
            communicationPlan
          )
        : null,

    diagnostics: {
      lifecycle:
        cloneValue(
          lifecycle
        ),

      contextSnapshot:
        cloneValue(
          context
        ),
    },

    createdAt:
      startedAt,

    completedAt:
      createTimestamp(),
  };
}

function createResponseGenerator({
  adaptiveMentorEngine = null,
  responseComposer = null,
  communicationVoiceEngine = null,
  responseProvider = null,
  memory = null,
  memoryFactory = null,
  creatorId = null,
  defaultOptions = {},
  onLifecycleEvent = null,
} = {}) {
  const ownsAdaptiveMentorEngine =
    !adaptiveMentorEngine;

  const resolvedMemoryFactory =
    typeof memoryFactory ===
      "function"
      ? memoryFactory
      : (options = {}) =>
          createCreatorMemory(
            options
          );

  let activeMemory =
    memory ||
    resolvedMemoryFactory({
      creatorId:
        creatorId ||
        null,
    });

  let activeMemoryCreatorId =
    creatorId ||
    null;

  let memoryIsExternallyOwned =
    isMemoryService(
      memory
    );

  let activeResponseProvider =
    responseProvider ||
    null;

  let activeDefaultOptions =
    resolveGeneratorOptions(
      defaultOptions
    );

  let activeAdaptiveMentorEngine =
    adaptiveMentorEngine ||
    createAdaptiveMentorEngine({
      memory:
        activeMemory,
    });

  const resolvedResponseComposer =
    responseComposer ||
    createResponseComposer();

  const resolvedCommunicationVoiceEngine =
    communicationVoiceEngine ||
    createCommunicationVoiceEngine();

  function publishLifecycleEvent(
    lifecycle,
    event
  ) {
    recordLifecycleEvent(
      lifecycle,
      event
    );

    if (
      typeof onLifecycleEvent ===
      "function"
    ) {
      try {
        onLifecycleEvent(
          cloneValue(
            lifecycle[
              lifecycle.length -
              1
            ]
          )
        );
      } catch (error) {
        console.warn(
          "ResponseGenerator lifecycle listener error:",
          error
        );
      }
    }
  }

  function bindMemoryToAdaptiveEngine() {
    if (
      typeof activeAdaptiveMentorEngine
        ?.setMemory ===
      "function"
    ) {
      activeAdaptiveMentorEngine
        .setMemory(
          activeMemory
        );

      return;
    }

    if (
      ownsAdaptiveMentorEngine
    ) {
      activeAdaptiveMentorEngine =
        createAdaptiveMentorEngine({
          memory:
            activeMemory,
        });
    }
  }

  function ensureMemoryForContext(
    context = {}
  ) {
    const requestedCreatorId =
      cleanString(
        context?.creatorId
      ) ||
      null;

    if (
      activeMemory &&
      (
        memoryIsExternallyOwned ||
        !requestedCreatorId ||
        requestedCreatorId ===
          activeMemoryCreatorId
      )
    ) {
      return activeMemory;
    }

    if (
      requestedCreatorId &&
      requestedCreatorId !==
        activeMemoryCreatorId
    ) {
      activeMemory =
        resolvedMemoryFactory({
          creatorId:
            requestedCreatorId,
        });

      activeMemoryCreatorId =
        requestedCreatorId;

      bindMemoryToAdaptiveEngine();
    }

    return activeMemory;
  }

  async function executeMemoryOperations(
    adaptivePlan
  ) {
    if (
      typeof activeAdaptiveMentorEngine
        ?.applyMemoryPlan ===
      "function"
    ) {
      const result =
        await Promise.resolve(
          activeAdaptiveMentorEngine
            .applyMemoryPlan(
              adaptivePlan
            )
        );

      if (
        result &&
        typeof result ===
          "object"
      ) {
        return result;
      }
    }

    const instructions =
      getMemoryInstructions(
        adaptivePlan
      );

    if (
      activeMemory &&
      typeof activeMemory
        .applyMemoryInstructions ===
        "function"
    ) {
      return Promise.resolve(
        activeMemory
          .applyMemoryInstructions(
            instructions
          )
      );
    }

    return {
      applied: [],
      skipped:
        instructions.map(
          (instruction) => ({
            instruction:
              cloneValue(
                instruction
              ),

            reason:
              "No compatible memory executor is available.",
          })
        ),
      errors: [],
      reason:
        "Memory execution unavailable.",
    };
  }

  async function applyMemoryOperations({
    adaptivePlan,
    options,
  }) {
    if (
      !shouldExecuteMemoryOperations({
        adaptivePlan,
        options,
      })
    ) {
      let reason =
        "No automatic memory operation was required.";

      if (
        !options
          .applyMemoryAutomatically
      ) {
        reason =
          "Automatic memory application is disabled.";
      } else if (
        options
          .memoryApplicationPolicy ===
          MEMORY_APPLICATION_POLICIES
            .MANUAL
      ) {
        reason =
          "Memory application is configured for manual execution.";
      } else if (
        options
          .memoryApplicationPolicy ===
          MEMORY_APPLICATION_POLICIES
            .DISABLED
      ) {
        reason =
          "Memory application is disabled.";
      } else if (
        adaptivePlan
          ?.execution
          ?.shouldClarifyForget
      ) {
        reason =
          "Forget execution is waiting for creator clarification.";
      }

      return (
        createEmptyMemoryApplicationSummary({
          adaptivePlan,
          reason,
        })
      );
    }

    if (
      !activeMemory
    ) {
      return (
        createEmptyMemoryApplicationSummary({
          adaptivePlan,

          reason:
            "No CreatorMemory service is available.",
        })
      );
    }

    try {
      const result =
        await executeMemoryOperations(
          adaptivePlan
        );

      return (
        createMemoryApplicationSummary({
          result,
          adaptivePlan,
        })
      );
    } catch (error) {
      return (
        createMemoryApplicationSummary({
          adaptivePlan,

          result: {
            applied: [],
            skipped: [],
            errors: [
              {
                instruction:
                  null,

                error:
                  error instanceof Error
                    ? error.message
                    : String(error),
              },
            ],

            reason:
              "Memory execution failed.",
          },
        })
      );
    }
  }

  function shouldApplyBeforeGeneration({
    adaptivePlan,
    options,
  }) {
    if (
      !shouldExecuteMemoryOperations({
        adaptivePlan,
        options,
      })
    ) {
      return false;
    }

    if (
      shouldForceMemoryBeforeGeneration({
        adaptivePlan,
      })
    ) {
      return true;
    }

    return (
      options
        .memoryApplicationPolicy ===
      MEMORY_APPLICATION_POLICIES
        .BEFORE_GENERATION
    );
  }

  function shouldApplyAfterGeneration({
    adaptivePlan,
    options,
    memoryApplication,
  }) {
    if (
      memoryApplication
        ?.attempted
    ) {
      return false;
    }

    if (
      !shouldExecuteMemoryOperations({
        adaptivePlan,
        options,
      })
    ) {
      return false;
    }

    if (
      shouldForceMemoryBeforeGeneration({
        adaptivePlan,
      })
    ) {
      return false;
    }

    return (
      options
        .memoryApplicationPolicy ===
      MEMORY_APPLICATION_POLICIES
        .AFTER_GENERATION
    );
  }

  async function generateResponse({
    message = "",
    context = {},
    options = {},
    adaptivePlan = null,
    blueprint = null,
    communicationPlan = null,
    voiceProfile = null,
  } = {}) {
    const generationId =
      createGenerationId();

    const startedAt =
      createTimestamp();

    const lifecycle = [];

    const resolvedOptions =
      resolveGeneratorOptions({
        ...cloneValue(
          activeDefaultOptions
        ),

        ...cloneValue(
          options
        ),
      });

    let currentAdaptivePlan =
      adaptivePlan;

    let currentBlueprint =
      blueprint;

    let currentCommunicationPlan =
      communicationPlan;

    let currentMemoryContext =
      null;

    let resolvedContext =
      resolveGenerationContext(
        context
      );

    let memoryApplication =
      createEmptyMemoryApplicationSummary();

    let source =
      RESPONSE_SOURCES
        .DETERMINISTIC_RENDERER;

    try {
      assertNotAborted(
        resolvedOptions
          .abortSignal
      );

      publishLifecycleEvent(
        lifecycle,
        {
          stage:
            GENERATION_STAGES
              .INITIALISE,

          status:
            GENERATION_STATUSES
              .IDLE,

          message:
            "Response generation initialised.",
        }
      );

      if (
        !cleanString(
          message
        )
      ) {
        throw new TypeError(
          "ResponseGenerator requires a creator message."
        );
      }

      ensureMemoryForContext(
        resolvedContext
      );

      if (
        resolvedOptions
          .hydrateContextFromMemory &&
        activeMemory
      ) {
        publishLifecycleEvent(
          lifecycle,
          {
            stage:
              GENERATION_STAGES
                .HYDRATE_MEMORY,

            status:
              GENERATION_STATUSES
                .HYDRATING_MEMORY,

            message:
              "Hydrating Mentor context from CreatorMemory.",
          }
        );

        currentMemoryContext =
          getMemoryContextSafely(
            activeMemory,

            {
              projectId:
                cleanString(
                  resolvedContext
                    ?.activeProjectId
                ) ||
                undefined,
            }
          );

        resolvedContext =
          mergeMemoryContext({
            context:
              resolvedContext,

            memoryContext:
              currentMemoryContext,
          });
      }

      bindMemoryToAdaptiveEngine();

      if (
        !currentAdaptivePlan
      ) {
        assertNotAborted(
          resolvedOptions
            .abortSignal
        );

        publishLifecycleEvent(
          lifecycle,
          {
            stage:
              GENERATION_STAGES
                .PLAN_BEHAVIOUR,

            status:
              GENERATION_STATUSES
                .PLANNING,

            message:
              "Planning Mentor behaviour.",
          }
        );

        currentAdaptivePlan =
          activeAdaptiveMentorEngine
            .planMentorBehaviour({
              message,

              context:
                resolvedContext,
            });
      }

      if (
        !currentAdaptivePlan ||
        typeof currentAdaptivePlan !==
          "object"
      ) {
        throw new TypeError(
          "Adaptive Mentor Engine did not return a valid plan."
        );
      }

      memoryApplication =
        createEmptyMemoryApplicationSummary({
          adaptivePlan:
            currentAdaptivePlan,
        });

      if (
        !currentBlueprint
      ) {
        assertNotAborted(
          resolvedOptions
            .abortSignal
        );

        publishLifecycleEvent(
          lifecycle,
          {
            stage:
              GENERATION_STAGES
                .COMPOSE_BLUEPRINT,

            status:
              GENERATION_STATUSES
                .COMPOSING,

            message:
              "Composing response blueprint.",
          }
        );

        currentBlueprint =
          resolvedResponseComposer
            .composeResponseBlueprint({
              message,

              adaptivePlan:
                currentAdaptivePlan,

              context:
                resolvedContext,
            });
      }

      if (
        !currentBlueprint ||
        typeof currentBlueprint !==
          "object"
      ) {
        throw new TypeError(
          "Response Composer did not return a valid blueprint."
        );
      }

      if (
        shouldApplyBeforeGeneration({
          adaptivePlan:
            currentAdaptivePlan,

          options:
            resolvedOptions,
        })
      ) {
        assertNotAborted(
          resolvedOptions
            .abortSignal
        );

        publishLifecycleEvent(
          lifecycle,
          {
            stage:
              GENERATION_STAGES
                .APPLY_MEMORY,

            status:
              GENERATION_STATUSES
                .APPLYING_MEMORY,

            message:
              "Applying approved memory operations before response generation.",
          }
        );

        memoryApplication =
          await applyMemoryOperations({
            adaptivePlan:
              currentAdaptivePlan,

            options:
              resolvedOptions,
          });

        currentMemoryContext =
          getMemoryContextSafely(
            activeMemory,

            {
              projectId:
                getProjectId(
                  resolvedContext,
                  currentAdaptivePlan,
                  currentBlueprint
                ) ||
                undefined,
            }
          ) ||
          currentMemoryContext;
      }

      const shouldRemainSilent =
        resolvedResponseComposer
          .shouldRemainSilent(
            currentBlueprint
          );

      if (
        shouldRemainSilent
      ) {
        if (
          shouldApplyAfterGeneration({
            adaptivePlan:
              currentAdaptivePlan,

            options:
              resolvedOptions,

            memoryApplication,
          })
        ) {
          assertNotAborted(
            resolvedOptions
              .abortSignal
          );

          publishLifecycleEvent(
            lifecycle,
            {
              stage:
                GENERATION_STAGES
                  .APPLY_MEMORY,

              status:
                GENERATION_STATUSES
                  .APPLYING_MEMORY,

              message:
                "Applying approved memory operations after intentional silence.",
            }
          );

          memoryApplication =
            await applyMemoryOperations({
              adaptivePlan:
                currentAdaptivePlan,

              options:
                resolvedOptions,
            });

          currentMemoryContext =
            getMemoryContextSafely(
              activeMemory,

              {
                projectId:
                  getProjectId(
                    resolvedContext,
                    currentAdaptivePlan,
                    currentBlueprint
                  ) ||
                  undefined,
              }
            ) ||
            currentMemoryContext;
        }

        publishLifecycleEvent(
          lifecycle,
          {
            stage:
              GENERATION_STAGES
                .FINALISE,

            status:
              GENERATION_STATUSES
                .SILENT,

            message:
              "The response blueprint requested intentional silence.",
          }
        );

        const silentValidation = {
          valid: true,

          issues: [],

          metrics: {
            characters: 0,
            words: 0,
            questions: 0,
            paragraphs: 0,
          },
        };

        return (
          createCompletedResponse({
            generationId,
            message,

            text: "",
            structured: null,

            source:
              RESPONSE_SOURCES
                .SILENCE,

            status:
              GENERATION_STATUSES
                .SILENT,

            context:
              resolvedContext,

            adaptivePlan:
              currentAdaptivePlan,

            blueprint:
              currentBlueprint,

            communicationPlan:
              currentCommunicationPlan,

            memoryApplication,

            memoryContext:
              currentMemoryContext,

            provider:
              describeProvider(
                activeResponseProvider
              ),

            providerExecution:
              null,

            validation:
              silentValidation,

            lifecycle,

            options:
              resolvedOptions,

            startedAt,
          })
        );
      }

      if (
        !currentCommunicationPlan
      ) {
        assertNotAborted(
          resolvedOptions
            .abortSignal
        );

        publishLifecycleEvent(
          lifecycle,
          {
            stage:
              GENERATION_STAGES
                .PLAN_COMMUNICATION,

            status:
              GENERATION_STATUSES
                .PLANNING_COMMUNICATION,

            message:
              "Planning Mentor communication voice.",
          }
        );

        currentCommunicationPlan =
          resolvedCommunicationVoiceEngine
            .planCommunication({
              message,

              context:
                resolvedContext,

              adaptivePlan:
                currentAdaptivePlan,

              responseBlueprint:
                currentBlueprint,

              voiceProfile,
            });
      }

      if (
        !currentCommunicationPlan ||
        typeof currentCommunicationPlan !==
          "object"
      ) {
        throw new TypeError(
          "Communication Voice Engine did not return a valid plan."
        );
      }

      assertNotAborted(
        resolvedOptions
          .abortSignal
      );

      publishLifecycleEvent(
        lifecycle,
        {
          stage:
            GENERATION_STAGES
              .EXECUTE_BLUEPRINT,

          status:
            GENERATION_STATUSES
              .GENERATING,

          message:
            "Executing response blueprint.",
        }
      );

      const providerDescription =
        describeProvider(
          activeResponseProvider
        );

      let generatedText =
        "";

      let generatedStructured =
        null;

      let providerExecution =
        null;

      if (
        providerDescription
          .available
      ) {
        const baseProviderRequest =
          createProviderRequest({
            generationId,
            message,

            context:
              resolvedContext,

            adaptivePlan:
              currentAdaptivePlan,

            blueprint:
              currentBlueprint,

            communicationPlan:
              currentCommunicationPlan,

            options:
              resolvedOptions,

            memoryApplication,
          });

        const providerRequest =
          resolvedCommunicationVoiceEngine
            .applyToProviderRequest({
              providerRequest:
                baseProviderRequest,

              communicationPlan:
                currentCommunicationPlan,
            });

        try {
          providerExecution =
            await executeProvider({
              provider:
                activeResponseProvider,

              request:
                providerRequest,

              options:
                resolvedOptions,
            });

          generatedText =
            providerExecution
              .result
              .text;

          generatedStructured =
            providerExecution
              .result
              .structured;

          source =
            RESPONSE_SOURCES
              .PROVIDER;
        } catch (
          providerError
        ) {
          if (
            providerError
              ?.name ===
              "AbortError"
          ) {
            throw providerError;
          }

          publishLifecycleEvent(
            lifecycle,
            {
              stage:
                GENERATION_STAGES
                  .EXECUTE_BLUEPRINT,

              status:
                GENERATION_STATUSES
                  .PARTIAL,

              message:
                "The response provider failed. Falling back to deterministic blueprint rendering.",

              metadata: {
                error:
                  providerError instanceof
                    Error
                    ? providerError
                        .message
                    : String(
                        providerError
                      ),
              },
            }
          );

          if (
            !resolvedOptions
              .useDeterministicFallback
          ) {
            throw providerError;
          }

          generatedText =
            renderBlueprintDeterministically({
              message,

              blueprint:
                currentBlueprint,

              context:
                resolvedContext,

              memoryApplication,
            });

          source =
            RESPONSE_SOURCES
              .FALLBACK_RENDERER;
        }
      } else {
        generatedText =
          renderBlueprintDeterministically({
            message,

            blueprint:
              currentBlueprint,

            context:
              resolvedContext,

            memoryApplication,
          });
      }

      const memoryApplicationAtGenerationTime =
        memoryApplication;

      if (
        shouldApplyAfterGeneration({
          adaptivePlan:
            currentAdaptivePlan,

          options:
            resolvedOptions,

          memoryApplication,
        })
      ) {
        assertNotAborted(
          resolvedOptions
            .abortSignal
        );

        publishLifecycleEvent(
          lifecycle,
          {
            stage:
              GENERATION_STAGES
                .APPLY_MEMORY,

            status:
              GENERATION_STATUSES
                .APPLYING_MEMORY,

            message:
              "Applying approved memory operations after response generation.",
          }
        );

        memoryApplication =
          await applyMemoryOperations({
            adaptivePlan:
              currentAdaptivePlan,

            options:
              resolvedOptions,
          });

        currentMemoryContext =
          getMemoryContextSafely(
            activeMemory,

            {
              projectId:
                getProjectId(
                  resolvedContext,
                  currentAdaptivePlan,
                  currentBlueprint
                ) ||
                undefined,
            }
          ) ||
          currentMemoryContext;

        /**
         * Text is deliberately not rewritten after an
         * AFTER_GENERATION save.
         *
         * Language generated before persistence confirmation
         * must never retroactively claim that persistence
         * succeeded.
         */
      }

      generatedText =
        normaliseGeneratedText({
          text:
            generatedText,

          blueprint:
            currentBlueprint,

          options:
            resolvedOptions,
        });

      assertNotAborted(
        resolvedOptions
          .abortSignal
      );

      publishLifecycleEvent(
        lifecycle,
        {
          stage:
            GENERATION_STAGES
              .VALIDATE_RESPONSE,

          status:
            GENERATION_STATUSES
              .VALIDATING,

          message:
            "Validating generated Mentor response.",
        }
      );

      let validation =
        resolvedOptions
          .validateProviderOutput
          ? validateGeneratedResponse({
              text:
                generatedText,

              blueprint:
                currentBlueprint,

              options:
                resolvedOptions,

              memoryApplication:
                memoryApplicationAtGenerationTime,
            })
          : {
              valid: true,

              issues: [],

              metrics: {
                characters:
                  generatedText
                    .length,

                words:
                  generatedText
                    ? generatedText
                        .split(/\s+/)
                        .length
                    : 0,

                questions:
                  countQuestions(
                    generatedText
                  ),

                paragraphs:
                  generatedText
                    ? generatedText
                        .split(
                          /\n\s*\n/
                        )
                        .filter(Boolean)
                        .length
                    : 0,
              },
            };

      if (
        !validation.valid &&
        source ===
          RESPONSE_SOURCES
            .PROVIDER &&
        resolvedOptions
          .useDeterministicFallback
      ) {
        publishLifecycleEvent(
          lifecycle,
          {
            stage:
              GENERATION_STAGES
                .VALIDATE_RESPONSE,

            status:
              GENERATION_STATUSES
                .PARTIAL,

            message:
              "Provider output failed blueprint validation. Replacing it with deterministic rendering.",

            metadata: {
              issues:
                validation.issues,
            },
          }
        );

        generatedText =
          renderBlueprintDeterministically({
            message,

            blueprint:
              currentBlueprint,

            context:
              resolvedContext,

            memoryApplication,
          });

        generatedText =
          normaliseGeneratedText({
            text:
              generatedText,

            blueprint:
              currentBlueprint,

            options:
              resolvedOptions,
          });

        source =
          RESPONSE_SOURCES
            .FALLBACK_RENDERER;

        const fallbackValidation =
          validateGeneratedResponse({
            text:
              generatedText,

            blueprint:
              currentBlueprint,

            options:
              resolvedOptions,

            memoryApplication:
              memoryApplicationAtGenerationTime,
          });

        validation = {
          valid:
            fallbackValidation
              .valid,

          issues:
            mergeValidationIssues(
              validation
                .issues,

              fallbackValidation
                .issues
            ),

          metrics:
            fallbackValidation
              .metrics,
        };
      }

      const finalStatus =
        validation.valid
          ? GENERATION_STATUSES
              .COMPLETED
          : GENERATION_STATUSES
              .PARTIAL;

      publishLifecycleEvent(
        lifecycle,
        {
          stage:
            GENERATION_STAGES
              .FINALISE,

          status:
            finalStatus,

          message:
            "Mentor response generation completed.",

          metadata: {
            source,

            memoryStorageConfirmed:
              Boolean(
                memoryApplication
                  ?.canClaimStorageSuccess
              ),

            memoryDeletionConfirmed:
              Boolean(
                memoryApplication
                  ?.canClaimDeletionSuccess
              ),

            sessionHandoffConfirmed:
              Boolean(
                memoryApplication
                  ?.canClaimHandoffSuccess
              ),
          },
        }
      );

      return (
        createCompletedResponse({
          generationId,
          message,

          text:
            generatedText,

          structured:
            generatedStructured,

          source,

          status:
            finalStatus,

          context:
            resolvedContext,

          adaptivePlan:
            currentAdaptivePlan,

          blueprint:
            currentBlueprint,

          communicationPlan:
            currentCommunicationPlan,

          memoryApplication,

          memoryContext:
            currentMemoryContext,

          provider:
            providerDescription,

          providerExecution,

          validation,

          lifecycle,

          options:
            resolvedOptions,

          startedAt,
        })
      );
    } catch (error) {
      publishLifecycleEvent(
        lifecycle,
        {
          stage:
            GENERATION_STAGES
              .FINALISE,

          status:
            error?.name ===
              "AbortError"
              ? GENERATION_STATUSES
                  .CANCELLED
              : GENERATION_STATUSES
                  .FAILED,

          message:
            error instanceof Error
              ? error.message
              : String(error),
        }
      );

      console.error(
        "ResponseGenerator generation error:",
        error
      );

      return (
        createFailureResponse({
          generationId,
          message,

          context:
            resolvedContext,

          lifecycle,

          error,

          startedAt,

          source,

          adaptivePlan:
            currentAdaptivePlan,

          blueprint:
            currentBlueprint,

          communicationPlan:
            currentCommunicationPlan,

          memoryApplication,

          memoryContext:
            currentMemoryContext,
        })
      );
    }
  }

  function previewResponsePlan({
    message = "",
    context = {},
    adaptivePlan = null,
    blueprint = null,
    communicationPlan = null,
    voiceProfile = null,
  } = {}) {
    let resolvedContext =
      resolveGenerationContext(
        context
      );

    ensureMemoryForContext(
      resolvedContext
    );

    const memoryContext =
      getMemoryContextSafely(
        activeMemory,

        {
          projectId:
            cleanString(
              resolvedContext
                ?.activeProjectId
            ) ||
            undefined,
        }
      );

    resolvedContext =
      mergeMemoryContext({
        context:
          resolvedContext,

        memoryContext,
      });

    bindMemoryToAdaptiveEngine();

    const resolvedAdaptivePlan =
      adaptivePlan ||
      activeAdaptiveMentorEngine
        .planMentorBehaviour({
          message,

          context:
            resolvedContext,
        });

    const resolvedBlueprint =
      blueprint ||
      resolvedResponseComposer
        .composeResponseBlueprint({
          message,

          adaptivePlan:
            resolvedAdaptivePlan,

          context:
            resolvedContext,
        });

    const resolvedCommunicationPlan =
      communicationPlan ||
      resolvedCommunicationVoiceEngine
        .planCommunication({
          message,

          context:
            resolvedContext,

          adaptivePlan:
            resolvedAdaptivePlan,

          responseBlueprint:
            resolvedBlueprint,

          voiceProfile,
        });

    const memoryIntent =
      getMemoryExecutionIntent(
        resolvedAdaptivePlan
      );

    return {
      adaptivePlan:
        resolvedAdaptivePlan,

      blueprint:
        resolvedBlueprint,

      communicationPlan:
        resolvedCommunicationPlan,

      memoryContext:
        cloneValue(
          memoryContext
        ),

      memoryIntent,

      shouldRemainSilent:
        resolvedResponseComposer
          .shouldRemainSilent(
            resolvedBlueprint
          ),

      sectionOrder:
        resolvedResponseComposer
          .getSectionOrder(
            resolvedBlueprint
          ),

      communicationSummary:
        resolvedCommunicationPlan
          ?.summary ||
        null,

      activeProjectId:
        getProjectId(
          resolvedContext,
          resolvedAdaptivePlan,
          resolvedBlueprint
        ),

      createdAt:
        createTimestamp(),
    };
  }

  async function applyMemoryPlan(
    adaptivePlan
  ) {
    const result =
      await executeMemoryOperations(
        adaptivePlan
      );

    return (
      createMemoryApplicationSummary({
        result,
        adaptivePlan,
      })
    );
  }

  function refreshMemoryContext(
    options = {}
  ) {
    return cloneValue(
      getMemoryContextSafely(
        activeMemory,
        options
      )
    );
  }

  function setResponseProvider(
    nextProvider
  ) {
    if (
      nextProvider !== null &&
      nextProvider !==
        undefined &&
      !isResponseProvider(
        nextProvider
      )
    ) {
      throw new TypeError(
        "Response provider must expose generateResponse, executeBlueprint or generate."
      );
    }

    activeResponseProvider =
      nextProvider ||
      null;

    return (
      describeProvider(
        activeResponseProvider
      )
    );
  }

  function getResponseProvider() {
    return (
      activeResponseProvider
    );
  }

  function getResponseProviderInfo() {
    return (
      describeProvider(
        activeResponseProvider
      )
    );
  }

  function setMemory(
    nextMemory
  ) {
    if (
      nextMemory !== null &&
      nextMemory !== undefined &&
      !isMemoryService(
        nextMemory
      )
    ) {
      throw new TypeError(
        "Memory must expose the CreatorMemory service contract."
      );
    }

    activeMemory =
      nextMemory ||
      null;

    activeMemoryCreatorId =
      null;

    memoryIsExternallyOwned =
      isMemoryService(
        nextMemory
      );

    bindMemoryToAdaptiveEngine();

    return activeMemory;
  }

  function getMemory() {
    return activeMemory;
  }

  function setDefaultOptions(
    nextOptions = {}
  ) {
    activeDefaultOptions =
      resolveGeneratorOptions({
        ...cloneValue(
          activeDefaultOptions
        ),

        ...cloneValue(
          nextOptions
        ),
      });

    return cloneValue(
      activeDefaultOptions
    );
  }

  function getDefaultOptions() {
    return cloneValue(
      activeDefaultOptions
    );
  }

  function getServices() {
    return {
      adaptiveMentorEngine:
        activeAdaptiveMentorEngine,

      responseComposer:
        resolvedResponseComposer,

      communicationVoiceEngine:
        resolvedCommunicationVoiceEngine,

      responseProvider:
        activeResponseProvider,

      memory:
        activeMemory,
    };
  }

  return {
    generateResponse,

    previewResponsePlan,

    applyMemoryPlan,
    refreshMemoryContext,

    setResponseProvider,
    getResponseProvider,
    getResponseProviderInfo,

    setMemory,
    getMemory,

    setDefaultOptions,
    getDefaultOptions,

    getServices,
  };
}

async function generateResponse({
  message = "",
  context = {},
  options = {},
  responseProvider = null,
  memory = null,
  adaptivePlan = null,
  blueprint = null,
  communicationPlan = null,
  voiceProfile = null,
} = {}) {
  const generator =
    createResponseGenerator({
      responseProvider,
      memory,
    });

  return (
    generator.generateResponse({
      message,
      context,
      options,

      adaptivePlan,
      blueprint,
      communicationPlan,
      voiceProfile,
    })
  );
}

export {
  RESPONSE_GENERATOR_VERSION,

  GENERATION_STATUSES,
  GENERATION_STAGES,

  PROVIDER_TYPES,
  OUTPUT_FORMATS,
  RESPONSE_SOURCES,

  MEMORY_APPLICATION_POLICIES,
  MEMORY_OPERATION_TYPES,

  VALIDATION_SEVERITIES,

  createResponseGenerator,
  generateResponse,
};

export default createResponseGenerator;
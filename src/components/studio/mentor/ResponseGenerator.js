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
 * - CreatorMemory
 * - A future language-model or response-provider adapter
 *
 * Responsibilities:
 * - Accept a creator message and conversation context.
 * - Produce one unified Adaptive Mentor behaviour plan.
 * - Convert that plan into a response blueprint.
 * - Apply memory instructions at the correct point.
 * - Execute the blueprint through a supplied response provider.
 * - Validate and normalise the generated response.
 * - Return structured diagnostics and lifecycle information.
 * - Recover safely when a provider or specialist engine fails.
 *
 * This file does not own:
 * - Long-term storage.
 * - Model credentials.
 * - Network requests.
 * - UI rendering.
 * - Speech synthesis.
 *
 * Those responsibilities are supplied through adapters.
 *
 * Core principles:
 * - Protect the Creator.
 * - Present behaviour leads; memory informs.
 * - Intelligence and expression remain separate.
 * - Never fabricate successful memory storage.
 * - Never generate speech when silence is the correct response.
 * - A provider executes the blueprint; it does not redesign it.
 * - Every failure should degrade into a safe, useful response.
 */

import createAdaptiveMentorEngine from "./AdaptiveMentorEngine";
import createResponseComposer from "./ResponseComposer";

const RESPONSE_GENERATOR_VERSION = "1.0.0";

const GENERATION_STATUSES = Object.freeze({
  IDLE: "idle",
  PLANNING: "planning",
  COMPOSING: "composing",
  APPLYING_MEMORY: "applying-memory",
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
  PLAN_BEHAVIOUR: "plan-behaviour",
  COMPOSE_BLUEPRINT: "compose-blueprint",
  APPLY_MEMORY: "apply-memory",
  EXECUTE_BLUEPRINT: "execute-blueprint",
  VALIDATE_RESPONSE: "validate-response",
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
  DETERMINISTIC_RENDERER: "deterministic-renderer",
  FALLBACK_RENDERER: "fallback-renderer",
  SILENCE: "silence",
});

const MEMORY_APPLICATION_POLICIES = Object.freeze({
  BEFORE_GENERATION: "before-generation",
  AFTER_GENERATION: "after-generation",
  MANUAL: "manual",
  DISABLED: "disabled",
});

const VALIDATION_SEVERITIES = Object.freeze({
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
});

const DEFAULT_GENERATOR_OPTIONS = Object.freeze({
  outputFormat: OUTPUT_FORMATS.TEXT,

  memoryApplicationPolicy:
    MEMORY_APPLICATION_POLICIES.BEFORE_GENERATION,

  applyMemoryAutomatically: true,
  useDeterministicFallback: true,
  validateProviderOutput: true,

  includeDiagnostics: true,
  includeSpecialistPlans: false,
  includeBlueprint: true,

  trimOutput: true,
  rejectEmptyProviderOutput: true,

  maximumResponseCharacters: 24000,
  maximumProviderAttempts: 1,

  abortSignal: null,
  metadata: {},
});

const DEFAULT_GENERATION_CONTEXT = Object.freeze({
  creatorId: null,
  creatorName: null,
  creatorType: null,
  creatorJourney: "guide",

  projectType: null,
  activeProject: null,
  activeIdea: null,

  previousTask: null,
  nextTask: null,
  returnPoint: null,

  conversationMode: null,
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
  recentConversations: [],

  existingMemories: [],
  existingPatterns: [],
  existingObservations: [],

  minimumCreationContextReady: false,
  requiredInformationComplete: false,
  projectReadyToGenerate: false,
  projectReadyToRefine: false,
  projectReadyToPublish: false,

  establishedVocabulary: [],
  sharedMeanings: [],
  sharedRituals: [],

  humourAllowed: true,
  emojisAllowed: true,
  useCreatorName: false,

  currentTimestamp: null,
});

/**
 * Returns the current ISO timestamp.
 */
function createTimestamp() {
  return new Date().toISOString();
}

/**
 * Creates a lightweight unique generation id.
 */
function createGenerationId() {
  const randomValue = Math.random()
    .toString(36)
    .slice(2, 10);

  return `mentor-response-${Date.now()}-${randomValue}`;
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
 * Returns a clean string.
 */
function cleanString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

/**
 * Restricts a number to a range.
 */
function clampNumber(
  value,
  minimum,
  maximum,
  fallback = minimum
) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.max(
    minimum,
    Math.min(maximum, numericValue)
  );
}

/**
 * Returns unique useful values.
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
 * Reads a nested value safely.
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
 * Returns true when a value appears in a collection.
 */
function includesValue(value, values = []) {
  return values.includes(value);
}

/**
 * Merges generator options safely.
 */
function resolveGeneratorOptions(options = {}) {
  return {
    ...cloneValue(DEFAULT_GENERATOR_OPTIONS),
    ...cloneValue(options),

    maximumResponseCharacters:
      clampNumber(
        options?.maximumResponseCharacters,
        200,
        100000,
        DEFAULT_GENERATOR_OPTIONS
          .maximumResponseCharacters
      ),

    maximumProviderAttempts:
      clampNumber(
        options?.maximumProviderAttempts,
        1,
        3,
        DEFAULT_GENERATOR_OPTIONS
          .maximumProviderAttempts
      ),

    metadata: {
      ...cloneValue(
        DEFAULT_GENERATOR_OPTIONS.metadata
      ),
      ...cloneValue(options?.metadata || {}),
    },
  };
}

/**
 * Merges generation context safely.
 */
function resolveGenerationContext(context = {}) {
  return {
    ...cloneValue(
      DEFAULT_GENERATION_CONTEXT
    ),
    ...cloneValue(context),

    currentTimestamp:
      context?.currentTimestamp ||
      createTimestamp(),
  };
}

/**
 * Creates one lifecycle event.
 */
function createLifecycleEvent({
  stage,
  status,
  message = "",
  metadata = {},
}) {
  return {
    stage,
    status,
    message: cleanString(message),
    metadata: cloneValue(metadata),
    createdAt: createTimestamp(),
  };
}

/**
 * Appends a lifecycle event.
 */
function recordLifecycleEvent(
  lifecycle,
  event
) {
  lifecycle.push(
    createLifecycleEvent(event)
  );

  return lifecycle;
}

/**
 * Throws when generation has been cancelled.
 */
function assertNotAborted(abortSignal) {
  if (abortSignal?.aborted) {
    const error = new Error(
      "Mentor response generation was cancelled."
    );

    error.name = "AbortError";

    throw error;
  }
}

/**
 * Determines whether a provider appears usable.
 */
function isResponseProvider(provider) {
  return Boolean(
    provider &&
      typeof provider === "object" &&
      (
        typeof provider.generateResponse ===
          "function" ||
        typeof provider.generate === "function" ||
        typeof provider.executeBlueprint ===
          "function"
      )
  );
}

/**
 * Resolves the provider invocation method.
 */
function resolveProviderMethod(provider) {
  if (!isResponseProvider(provider)) {
    return null;
  }

  if (
    typeof provider.generateResponse ===
    "function"
  ) {
    return "generateResponse";
  }

  if (
    typeof provider.executeBlueprint ===
    "function"
  ) {
    return "executeBlueprint";
  }

  if (
    typeof provider.generate === "function"
  ) {
    return "generate";
  }

  return null;
}

/**
 * Resolves provider metadata without requiring any particular
 * provider implementation.
 */
function describeProvider(provider) {
  if (!isResponseProvider(provider)) {
    return {
      available: false,
      type: PROVIDER_TYPES.NONE,
      name: null,
      version: null,
      method: null,
    };
  }

  const method = resolveProviderMethod(
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
      provider.constructor?.name ||
      "custom-response-provider",

    version:
      provider.version || null,

    method,
  };
}

/**
 * Creates a normalised provider request.
 */
function createProviderRequest({
  generationId,
  message,
  context,
  adaptivePlan,
  blueprint,
  options,
  memoryApplication,
}) {
  return {
    id: generationId,

    input: {
      creatorMessage: cleanString(message),
    },

    context: cloneValue(context),

    adaptivePlan: cloneValue(
      adaptivePlan
    ),

    blueprint: cloneValue(blueprint),

    memoryApplication:
      cloneValue(memoryApplication),

    output: {
      format: options.outputFormat,

      maximumCharacters:
        options.maximumResponseCharacters,
    },

    constraints: {
      ...(cloneValue(
        blueprint?.constraints || {}
      )),

      obeySectionOrder: true,
      doNotExposeInternalPlanning: true,
      doNotInventMemorySuccess: true,
      doNotOverrideSilence: true,
    },

    style: cloneValue(
      blueprint?.style || {}
    ),

    languageGuidance: cloneValue(
      blueprint?.languageGuidance || []
    ),

    sourceGuidance: cloneValue(
      blueprint?.sourceGuidance || []
    ),

    metadata: cloneValue(
      options.metadata || {}
    ),
  };
}

/**
 * Normalises provider output into one predictable structure.
 */
function normaliseProviderResult(
  providerResult
) {
  if (
    typeof providerResult === "string"
  ) {
    return {
      text: providerResult,
      structured: null,
      usage: null,
      metadata: {},
      raw: providerResult,
    };
  }

  if (
    !providerResult ||
    typeof providerResult !== "object"
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
      typeof text === "string"
        ? text
        : "",

    structured:
      providerResult.structured ??
      providerResult.data ??
      null,

    usage:
      providerResult.usage ?? null,

    metadata: {
      ...cloneValue(
        providerResult.metadata || {}
      ),

      finishReason:
        providerResult.finishReason ??
        providerResult.finish_reason ??
        null,

      model:
        providerResult.model ?? null,
    },

    raw: providerResult,
  };
}

/**
 * Executes a supplied response provider.
 */
async function executeProvider({
  provider,
  request,
  options,
}) {
  const providerMethod =
    resolveProviderMethod(provider);

  if (!providerMethod) {
    throw new TypeError(
      "No compatible response-provider method is available."
    );
  }

  let latestError = null;

  for (
    let attempt = 1;
    attempt <= options.maximumProviderAttempts;
    attempt += 1
  ) {
    assertNotAborted(
      options.abortSignal
    );

    try {
      const result = await provider[
        providerMethod
      ](request);

      return {
        result:
          normaliseProviderResult(result),

        attempt,

        providerMethod,
      };
    } catch (error) {
      latestError = error;

      if (
        error?.name === "AbortError" ||
        attempt >=
          options.maximumProviderAttempts
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

/**
 * Returns a human-readable source value from a section.
 */
function resolveSectionSourceText(
  section
) {
  const sourceData = section?.sourceData;

  if (!sourceData) {
    return "";
  }

  if (typeof sourceData === "string") {
    return cleanString(sourceData);
  }

  if (Array.isArray(sourceData)) {
    return sourceData
      .map((value) => {
        if (typeof value === "string") {
          return value;
        }

        return (
          value?.text ||
          value?.content ||
          value?.summary ||
          value?.title ||
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
      sourceData.value ||
      ""
  );
}

/**
 * Produces a conservative acknowledgement.
 */
function renderAcknowledgement({
  context,
}) {
  if (
    context?.creatorExplicitlyAskedForNextStep ||
    context?.creatorExplicitlyAskedToContinue
  ) {
    return "Aye. Let’s continue.";
  }

  return "I’m with you.";
}

/**
 * Produces a conservative understanding statement.
 */
function renderUnderstanding({
  message,
}) {
  const cleanedMessage =
    cleanString(message);

  if (!cleanedMessage) {
    return "I’m following.";
  }

  return "I can see the direction you’re taking.";
}

/**
 * Produces a conservative reflection.
 */
function renderReflection({
  section,
}) {
  const sourceText =
    resolveSectionSourceText(section);

  if (sourceText) {
    return (
      "Something I’m noticing is that " +
      sourceText +
      ". Treat that as an observation rather than a fixed conclusion."
    );
  }

  return (
    "Something seems to be taking shape here. " +
    "We can explore it without forcing it into a final answer too early."
  );
}

/**
 * Produces a pressure-release statement.
 */
function renderReassurance() {
  return (
    "We already have enough useful material to keep moving. " +
    "There’s no need to force the missing part—the thought can return in its own time."
  );
}

/**
 * Produces a safe memory-capture statement.
 */
function renderMemoryCapture({
  memoryApplication,
}) {
  const appliedCount =
    memoryApplication?.applied?.length || 0;

  const pendingCount =
    memoryApplication?.pending?.length || 0;

  if (appliedCount > 0) {
    return (
      "That’s worth capturing. " +
      "I’ve added it to memory."
    );
  }

  if (pendingCount > 0) {
    return (
      "That’s worth capturing. " +
      "I’ve marked it for memory."
    );
  }

  return (
    "That’s worth keeping in view. " +
    "I won’t pretend it has been stored when the memory system hasn’t confirmed it."
  );
}

/**
 * Produces a cautious deferred-memory recall.
 */
function renderMemoryRecall({
  blueprint,
}) {
  const recallPlan =
    blueprint?.memory?.recallPlan;

  const memory =
    recallPlan?.memory;

  const memoryText = cleanString(
    memory?.content ||
      memory?.text ||
      memory?.description ||
      memory?.title ||
      ""
  );

  if (!memoryText) {
    return (
      "Something from an earlier conversation may be relevant here. " +
      "We left it alone at the time so your flow wasn’t interrupted."
    );
  }

  return (
    `Earlier, you mentioned: “${memoryText}” ` +
    "We left it there at the time rather than interrupting your flow, and it seems relevant again now."
  );
}

/**
 * Produces a context-restoration statement.
 */
function renderContextRestoration({
  section,
}) {
  const sourceText =
    resolveSectionSourceText(section);

  if (!sourceText) {
    return (
      "We were following the thread you had just started, then the thought slipped away. " +
      "There’s no pressure to recover it immediately."
    );
  }

  return (
    "Just before the thought disappeared, we were talking about " +
    sourceText +
    "."
  );
}

/**
 * Produces a conservative recommendation.
 */
function renderRecommendation({
  context,
}) {
  if (context?.nextTask) {
    return `My recommendation: ${context.nextTask}.`;
  }

  return (
    "My recommendation is to choose the smallest useful next step and move."
  );
}

/**
 * Produces a conservative creative direction.
 */
function renderCreativeDirection({
  blueprint,
}) {
  switch (blueprint?.action) {
    case "compose-next-task":
      return "We’re ready for the next task.";

    case "compose-creation-handoff":
      return (
        "We know enough to create the first version. " +
        "We can discover the remaining detail through the work."
      );

    case "compose-refinement-handoff":
      return "The first version exists. Now we refine the highest-value part.";

    case "compose-publishing-handoff":
      return "The creation is ready to move into publishing.";

    default:
      return "We’re ready to move forward.";
  }
}

/**
 * Produces a next-step statement.
 */
function renderNextStep({
  context,
}) {
  if (context?.nextTask) {
    return cleanString(context.nextTask);
  }

  if (context?.returnPoint) {
    return `Next: ${context.returnPoint}.`;
  }

  return "Let’s take the next concrete step.";
}

/**
 * Produces a conservative question.
 */
function renderQuestion({
  blueprint,
}) {
  switch (blueprint?.action) {
    case "compose-reflection":
      return "Does that feel accurate to you?";

    case "compose-context-restoration":
      return "Does returning to that point reconnect you with the thought?";

    case "compose-deferred-recall":
      return "Would you like to revisit it now, or shall we keep moving?";

    case "compose-brainstorming-turn":
      return "What part of that idea has the most energy for you?";

    case "compose-acknowledgement":
    default:
      return "Where would you like to take it next?";
  }
}

/**
 * Produces a session recap.
 */
function renderSessionRecap({
  context,
}) {
  const projectTitle =
    cleanString(
      context?.activeProject?.title ||
      context?.activeProject?.name ||
      ""
    );

  if (projectTitle) {
    return (
      `We’ve preserved today’s progress on ${projectTitle}.`
    );
  }

  return "We’ve preserved where we reached today.";
}

/**
 * Produces an open-door statement.
 */
function renderOpenDoor({
  blueprint,
}) {
  if (
    blueprint?.action ===
    "compose-capture-and-continue"
  ) {
    return "We can always come back to that whenever you’re ready.";
  }

  return "The door is open whenever you’re ready to return.";
}

/**
 * Produces a simple closing statement.
 */
function renderClosing() {
  return "We’ll continue from solid ground.";
}

/**
 * Renders one blueprint section deterministically.
 *
 * This is deliberately conservative. It exists as:
 * - A development renderer.
 * - A test renderer.
 * - A safe fallback when no model provider is connected.
 *
 * It is not intended to replace the future language model.
 */
function renderSectionDeterministically({
  section,
  message,
  blueprint,
  context,
  memoryApplication,
}) {
  switch (section?.type) {
    case "opening":
      return "";

    case "acknowledgement":
      return renderAcknowledgement({
        context,
      });

    case "understanding":
      return renderUnderstanding({
        message,
      });

    case "reflection":
      return renderReflection({
        section,
      });

    case "reassurance":
      return renderReassurance();

    case "memory-capture":
      return renderMemoryCapture({
        memoryApplication,
      });

    case "memory-recall":
      return renderMemoryRecall({
        blueprint,
      });

    case "context-restoration":
      return renderContextRestoration({
        section,
      });

    case "teaching":
      return (
        "Let’s keep this to one concept at a time, then apply it immediately."
      );

    case "recommendation":
      return renderRecommendation({
        context,
      });

    case "creative-direction":
      return renderCreativeDirection({
        blueprint,
      });

    case "next-step":
      return renderNextStep({
        context,
      });

    case "question":
      return renderQuestion({
        blueprint,
      });

    case "pause":
      return "";

    case "session-recap":
      return renderSessionRecap({
        context,
      });

    case "open-door":
      return renderOpenDoor({
        blueprint,
      });

    case "closing":
      return renderClosing();

    default:
      return "";
  }
}

/**
 * Joins deterministic sections into one response.
 */
function renderBlueprintDeterministically({
  message,
  blueprint,
  context,
  memoryApplication,
}) {
  const sections = Array.isArray(
    blueprint?.sections
  )
    ? blueprint.sections
    : [];

  const renderedSections = sections
    .map((section) =>
      renderSectionDeterministically({
        section,
        message,
        blueprint,
        context,
        memoryApplication,
      })
    )
    .map(cleanString)
    .filter(Boolean);

  return renderedSections.join("\n\n");
}

/**
 * Creates one validation issue.
 */
function createValidationIssue({
  code,
  severity,
  message,
  metadata = {},
}) {
  return {
    code,
    severity,
    message: cleanString(message),
    metadata: cloneValue(metadata),
  };
}

/**
 * Counts visible questions approximately.
 */
function countQuestions(text) {
  const matches = cleanString(text).match(
    /\?/g
  );

  return matches?.length || 0;
}

/**
 * Tests forbidden patterns case-insensitively.
 */
function findForbiddenPatterns({
  text,
  forbiddenPatterns,
}) {
  const normalisedText =
    cleanString(text).toLowerCase();

  return (
    Array.isArray(forbiddenPatterns)
      ? forbiddenPatterns
      : []
  ).filter((pattern) => {
    const cleanedPattern =
      cleanString(pattern).toLowerCase();

    return (
      cleanedPattern &&
      normalisedText.includes(
        cleanedPattern
      )
    );
  });
}

/**
 * Validates generated response text against the blueprint.
 */
function validateGeneratedResponse({
  text,
  blueprint,
  options,
}) {
  const issues = [];
  const cleanedText =
    cleanString(text);

  const constraints =
    blueprint?.constraints || {};

  if (
    constraints.shouldGenerateText ===
      false &&
    cleanedText
  ) {
    issues.push(
      createValidationIssue({
        code:
          "TEXT_GENERATED_DURING_SILENCE",
        severity:
          VALIDATION_SEVERITIES.ERROR,
        message:
          "The blueprint requested silence, but text was generated.",
      })
    );
  }

  if (
    constraints.shouldGenerateText !==
      false &&
    options.rejectEmptyProviderOutput &&
    !cleanedText
  ) {
    issues.push(
      createValidationIssue({
        code: "EMPTY_RESPONSE",
        severity:
          VALIDATION_SEVERITIES.ERROR,
        message:
          "The provider returned no response text.",
      })
    );
  }

  if (
    cleanedText.length >
    options.maximumResponseCharacters
  ) {
    issues.push(
      createValidationIssue({
        code: "RESPONSE_TOO_LONG",
        severity:
          VALIDATION_SEVERITIES.ERROR,
        message:
          "The generated response exceeds the configured character limit.",
        metadata: {
          actualCharacters:
            cleanedText.length,

          maximumCharacters:
            options.maximumResponseCharacters,
        },
      })
    );
  }

  const maximumQuestions =
    Number(
      constraints.maximumQuestions ?? 0
    );

  const questionCount =
    countQuestions(cleanedText);

  if (
    Number.isFinite(maximumQuestions) &&
    questionCount > maximumQuestions
  ) {
    issues.push(
      createValidationIssue({
        code: "TOO_MANY_QUESTIONS",
        severity:
          VALIDATION_SEVERITIES.WARNING,
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
      text: cleanedText,

      forbiddenPatterns:
        constraints.forbiddenPatterns ||
        [],
    });

  if (forbiddenPatterns.length > 0) {
    issues.push(
      createValidationIssue({
        code:
          "FORBIDDEN_LANGUAGE_PATTERN",
        severity:
          VALIDATION_SEVERITIES.ERROR,
        message:
          "The generated response contains prohibited language.",
        metadata: {
          patterns: forbiddenPatterns,
        },
      })
    );
  }

  return {
    valid: !issues.some(
      (issue) =>
        issue.severity ===
        VALIDATION_SEVERITIES.ERROR
    ),

    issues,

    metrics: {
      characters: cleanedText.length,
      words: cleanedText
        ? cleanedText.split(/\s+/).length
        : 0,
      questions: questionCount,
      paragraphs: cleanedText
        ? cleanedText
            .split(/\n\s*\n/)
            .filter(Boolean).length
        : 0,
    },
  };
}

/**
 * Normalises generated text after validation.
 */
function normaliseGeneratedText({
  text,
  blueprint,
  options,
}) {
  if (
    blueprint?.constraints
      ?.shouldGenerateText === false
  ) {
    return "";
  }

  let nextText =
    typeof text === "string"
      ? text
      : "";

  if (options.trimOutput) {
    nextText = nextText.trim();
  }

  if (
    nextText.length >
    options.maximumResponseCharacters
  ) {
    nextText = nextText
      .slice(
        0,
        options.maximumResponseCharacters
      )
      .trimEnd();
  }

  return nextText;
}

/**
 * Creates a memory-application summary.
 */
function createMemoryApplicationSummary(
  result = null
) {
  if (!result) {
    return {
      attempted: false,
      applied: [],
      skipped: [],
      errors: [],
      pending: [],
      successful: false,
    };
  }

  const applied = Array.isArray(
    result.applied
  )
    ? result.applied
    : [];

  const skipped = Array.isArray(
    result.skipped
  )
    ? result.skipped
    : [];

  const errors = Array.isArray(
    result.errors
  )
    ? result.errors
    : [];

  const pending = skipped.filter(
    (item) =>
      item?.instruction
        ?.requiresMemoryAdapterResolution
  );

  return {
    attempted: true,
    applied: cloneValue(applied),
    skipped: cloneValue(skipped),
    errors: cloneValue(errors),
    pending: cloneValue(pending),

    successful:
      errors.length === 0 &&
      applied.length > 0,
  };
}

/**
 * Creates the final structured response object.
 */
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
  memoryApplication,
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
    new Date(startedAt).getTime();

  const completedTime =
    new Date(completedAt).getTime();

  return {
    id: generationId,
    generator: "response-generator",
    version: RESPONSE_GENERATOR_VERSION,

    status,
    source,

    input: {
      message: cleanString(message),
    },

    response: {
      text: cleanString(text),
      structured:
        cloneValue(structured),

      format: options.outputFormat,

      isSilent:
        status ===
          GENERATION_STATUSES.SILENT ||
        !cleanString(text),
    },

    provider: {
      ...cloneValue(provider),

      attempt:
        providerExecution?.attempt ||
        null,

      method:
        providerExecution
          ?.providerMethod ||
        provider?.method ||
        null,

      usage:
        cloneValue(
          providerExecution?.result
            ?.usage || null
        ),

      metadata:
        cloneValue(
          providerExecution?.result
            ?.metadata || {}
        ),
    },

    memory:
      cloneValue(memoryApplication),

    validation:
      cloneValue(validation),

    adaptivePlan:
      options.includeSpecialistPlans
        ? cloneValue(adaptivePlan)
        : {
            id: adaptivePlan?.id || null,

            primaryAction:
              cloneValue(
                adaptivePlan
                  ?.primaryAction ||
                  null
              ),

            behaviour:
              cloneValue(
                adaptivePlan
                  ?.behaviour || null
              ),

            execution:
              cloneValue(
                adaptivePlan
                  ?.execution || null
              ),

            signals:
              cloneValue(
                adaptivePlan?.signals ||
                  []
              ),

            decisionSummary:
              adaptivePlan
                ?.decisionSummary ||
              null,
          },

    blueprint:
      options.includeBlueprint
        ? cloneValue(blueprint)
        : {
            id: blueprint?.id || null,
            action:
              blueprint?.action || null,
            length:
              blueprint?.length || null,
            style:
              cloneValue(
                blueprint?.style || null
              ),
            blueprintSummary:
              blueprint
                ?.blueprintSummary ||
              null,
          },

    diagnostics:
      options.includeDiagnostics
        ? {
            lifecycle:
              cloneValue(lifecycle),

            durationMs:
              Number.isFinite(
                completedTime -
                  startedTime
              )
                ? completedTime -
                  startedTime
                : null,

            contextSnapshot:
              cloneValue(context),
          }
        : null,

    createdAt: startedAt,
    completedAt,
  };
}

/**
 * Creates a safe failure response.
 */
function createFailureResponse({
  generationId,
  message,
  context,
  lifecycle,
  error,
  startedAt,
  adaptivePlan = null,
  blueprint = null,
}) {
  const isCancelled =
    error?.name === "AbortError";

  return {
    id: generationId,
    generator: "response-generator",
    version: RESPONSE_GENERATOR_VERSION,

    status: isCancelled
      ? GENERATION_STATUSES.CANCELLED
      : GENERATION_STATUSES.FAILED,

    source:
      RESPONSE_SOURCES
        .FALLBACK_RENDERER,

    input: {
      message: cleanString(message),
    },

    response: {
      text: isCancelled
        ? ""
        : "I’m still with you. Something interrupted the response pipeline, so I’ve stopped rather than guessing.",

      structured: null,
      format: OUTPUT_FORMATS.TEXT,
      isSilent: isCancelled,
    },

    error: {
      name:
        error?.name || "Error",

      message:
        error instanceof Error
          ? error.message
          : String(error),

      stack:
        error instanceof Error
          ? error.stack || null
          : null,
    },

    adaptivePlan:
      adaptivePlan
        ? cloneValue(adaptivePlan)
        : null,

    blueprint:
      blueprint
        ? cloneValue(blueprint)
        : null,

    diagnostics: {
      lifecycle:
        cloneValue(lifecycle),

      contextSnapshot:
        cloneValue(context),
    },

    createdAt: startedAt,
    completedAt: createTimestamp(),
  };
}

/**
 * Creates the Response Generator service.
 */
function createResponseGenerator({
  adaptiveMentorEngine = null,
  responseComposer = null,
  responseProvider = null,
  memory = null,
  defaultOptions = {},
  onLifecycleEvent = null,
} = {}) {
  let activeMemory = memory || null;

  let activeResponseProvider =
    responseProvider || null;

  let activeDefaultOptions =
    resolveGeneratorOptions(
      defaultOptions
    );

  const resolvedAdaptiveMentorEngine =
    adaptiveMentorEngine ||
    createAdaptiveMentorEngine({
      memory: activeMemory,
    });

  const resolvedResponseComposer =
    responseComposer ||
    createResponseComposer();

  /**
   * Publishes lifecycle events to both internal history and
   * an optional external listener.
   */
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
              lifecycle.length - 1
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

  /**
   * Applies planned memory changes when allowed.
   */
  function applyMemoryIfRequired({
    adaptivePlan,
    options,
  }) {
    const shouldApply =
      Boolean(
        options.applyMemoryAutomatically
      ) &&
      options.memoryApplicationPolicy !==
        MEMORY_APPLICATION_POLICIES
          .DISABLED &&
      options.memoryApplicationPolicy !==
        MEMORY_APPLICATION_POLICIES
          .MANUAL &&
      Boolean(
        adaptivePlan?.execution
          ?.shouldCaptureMemory
      );

    if (!shouldApply) {
      return createMemoryApplicationSummary(
        null
      );
    }

    const result =
      resolvedAdaptiveMentorEngine
        .applyMemoryPlan(
          adaptivePlan
        );

    return createMemoryApplicationSummary(
      result
    );
  }

  /**
   * Generates a complete Mentor response.
   */
  async function generateResponse({
    message = "",
    context = {},
    options = {},
    adaptivePlan = null,
    blueprint = null,
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
        ...cloneValue(options),
      });

    const resolvedContext =
      resolveGenerationContext(context);

    let currentAdaptivePlan =
      adaptivePlan;

    let currentBlueprint =
      blueprint;

    let memoryApplication =
      createMemoryApplicationSummary(
        null
      );

    try {
      assertNotAborted(
        resolvedOptions.abortSignal
      );

      publishLifecycleEvent(
        lifecycle,
        {
          stage:
            GENERATION_STAGES.INITIALISE,

          status:
            GENERATION_STATUSES.IDLE,

          message:
            "Response generation initialised.",
        }
      );

      if (!cleanString(message)) {
        throw new TypeError(
          "ResponseGenerator requires a creator message."
        );
      }

      if (!currentAdaptivePlan) {
        assertNotAborted(
          resolvedOptions.abortSignal
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
          resolvedAdaptiveMentorEngine
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

      if (!currentBlueprint) {
        assertNotAborted(
          resolvedOptions.abortSignal
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

      const shouldRemainSilent =
        resolvedResponseComposer
          .shouldRemainSilent(
            currentBlueprint
          );

      if (shouldRemainSilent) {
        publishLifecycleEvent(
          lifecycle,
          {
            stage:
              GENERATION_STAGES.FINALISE,

            status:
              GENERATION_STATUSES.SILENT,

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

        return createCompletedResponse({
          generationId,
          message,
          text: "",
          structured: null,
          source:
            RESPONSE_SOURCES.SILENCE,
          status:
            GENERATION_STATUSES.SILENT,
          context:
            resolvedContext,
          adaptivePlan:
            currentAdaptivePlan,
          blueprint:
            currentBlueprint,
          memoryApplication,
          provider:
            describeProvider(
              activeResponseProvider
            ),
          providerExecution: null,
          validation:
            silentValidation,
          lifecycle,
          options:
            resolvedOptions,
          startedAt,
        });
      }

      if (
        resolvedOptions
          .memoryApplicationPolicy ===
        MEMORY_APPLICATION_POLICIES
          .BEFORE_GENERATION
      ) {
        assertNotAborted(
          resolvedOptions.abortSignal
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
              "Applying approved memory instructions before response generation.",
          }
        );

        memoryApplication =
          applyMemoryIfRequired({
            adaptivePlan:
              currentAdaptivePlan,

            options:
              resolvedOptions,
          });
      }

      assertNotAborted(
        resolvedOptions.abortSignal
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

      let generatedText = "";
      let generatedStructured = null;

      let source =
        RESPONSE_SOURCES
          .DETERMINISTIC_RENDERER;

      let providerExecution = null;

      if (
        providerDescription.available
      ) {
        const providerRequest =
          createProviderRequest({
            generationId,
            message,
            context:
              resolvedContext,
            adaptivePlan:
              currentAdaptivePlan,
            blueprint:
              currentBlueprint,
            options:
              resolvedOptions,
            memoryApplication,
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
            providerExecution.result.text;

          generatedStructured =
            providerExecution.result
              .structured;

          source =
            RESPONSE_SOURCES.PROVIDER;
        } catch (providerError) {
          if (
            providerError?.name ===
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
                GENERATION_STATUSES.PARTIAL,

              message:
                "The response provider failed. Falling back to deterministic blueprint rendering.",

              metadata: {
                error:
                  providerError instanceof
                  Error
                    ? providerError.message
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

      if (
        resolvedOptions
          .memoryApplicationPolicy ===
        MEMORY_APPLICATION_POLICIES
          .AFTER_GENERATION
      ) {
        assertNotAborted(
          resolvedOptions.abortSignal
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
              "Applying approved memory instructions after response generation.",
          }
        );

        memoryApplication =
          applyMemoryIfRequired({
            adaptivePlan:
              currentAdaptivePlan,

            options:
              resolvedOptions,
          });
      }

      generatedText =
        normaliseGeneratedText({
          text: generatedText,
          blueprint:
            currentBlueprint,
          options:
            resolvedOptions,
        });

      assertNotAborted(
        resolvedOptions.abortSignal
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

      const validation =
        resolvedOptions
          .validateProviderOutput
          ? validateGeneratedResponse({
              text: generatedText,
              blueprint:
                currentBlueprint,
              options:
                resolvedOptions,
            })
          : {
              valid: true,
              issues: [],
              metrics: {
                characters:
                  generatedText.length,
                words: generatedText
                  ? generatedText.split(
                      /\s+/
                    ).length
                  : 0,
                questions:
                  countQuestions(
                    generatedText
                  ),
                paragraphs:
                  generatedText
                    ? generatedText
                        .split(/\n\s*\n/)
                        .filter(Boolean)
                        .length
                    : 0,
              },
            };

      if (
        !validation.valid &&
        source ===
          RESPONSE_SOURCES.PROVIDER &&
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
              GENERATION_STATUSES.PARTIAL,

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
            text: generatedText,
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
            text: generatedText,
            blueprint:
              currentBlueprint,
            options:
              resolvedOptions,
          });

        validation.valid =
          fallbackValidation.valid;

        validation.issues =
          uniqueValues([
            ...validation.issues.map(
              (issue) =>
                JSON.stringify(issue)
            ),

            ...fallbackValidation.issues.map(
              (issue) =>
                JSON.stringify(issue)
            ),
          ]).map((issue) =>
            JSON.parse(issue)
          );

        validation.metrics =
          fallbackValidation.metrics;
      }

      const finalStatus =
        validation.valid
          ? GENERATION_STATUSES.COMPLETED
          : GENERATION_STATUSES.PARTIAL;

      publishLifecycleEvent(
        lifecycle,
        {
          stage:
            GENERATION_STAGES.FINALISE,

          status: finalStatus,

          message:
            "Mentor response generation completed.",
        }
      );

      return createCompletedResponse({
        generationId,
        message,
        text: generatedText,
        structured:
          generatedStructured,
        source,
        status: finalStatus,
        context:
          resolvedContext,
        adaptivePlan:
          currentAdaptivePlan,
        blueprint:
          currentBlueprint,
        memoryApplication,
        provider:
          providerDescription,
        providerExecution,
        validation,
        lifecycle,
        options:
          resolvedOptions,
        startedAt,
      });
    } catch (error) {
      publishLifecycleEvent(
        lifecycle,
        {
          stage:
            GENERATION_STAGES.FINALISE,

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

      return createFailureResponse({
        generationId,
        message,
        context:
          resolvedContext,
        lifecycle,
        error,
        startedAt,
        adaptivePlan:
          currentAdaptivePlan,
        blueprint:
          currentBlueprint,
      });
    }
  }

  /**
   * Creates the behaviour plan and blueprint without generating
   * the final response. Useful for previews, debugging and tests.
   */
  function previewResponsePlan({
    message = "",
    context = {},
    adaptivePlan = null,
  } = {}) {
    const resolvedContext =
      resolveGenerationContext(context);

    const resolvedAdaptivePlan =
      adaptivePlan ||
      resolvedAdaptiveMentorEngine
        .planMentorBehaviour({
          message,
          context:
            resolvedContext,
        });

    const resolvedBlueprint =
      resolvedResponseComposer
        .composeResponseBlueprint({
          message,
          adaptivePlan:
            resolvedAdaptivePlan,
          context:
            resolvedContext,
        });

    return {
      adaptivePlan:
        resolvedAdaptivePlan,

      blueprint:
        resolvedBlueprint,

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

      createdAt:
        createTimestamp(),
    };
  }

  /**
   * Applies memory instructions manually.
   */
  function applyMemoryPlan(
    adaptivePlan
  ) {
    return createMemoryApplicationSummary(
      resolvedAdaptiveMentorEngine
        .applyMemoryPlan(
          adaptivePlan
        )
    );
  }

  /**
   * Connects or replaces the response provider.
   */
  function setResponseProvider(
    nextProvider
  ) {
    if (
      nextProvider !== null &&
      nextProvider !== undefined &&
      !isResponseProvider(nextProvider)
    ) {
      throw new TypeError(
        "Response provider must expose generateResponse, executeBlueprint or generate."
      );
    }

    activeResponseProvider =
      nextProvider || null;

    return describeProvider(
      activeResponseProvider
    );
  }

  /**
   * Returns the connected provider.
   */
  function getResponseProvider() {
    return activeResponseProvider;
  }

  /**
   * Returns public provider metadata.
   */
  function getResponseProviderInfo() {
    return describeProvider(
      activeResponseProvider
    );
  }

  /**
   * Connects or replaces CreatorMemory.
   */
  function setMemory(nextMemory) {
    activeMemory =
      nextMemory || null;

    if (
      typeof resolvedAdaptiveMentorEngine
        .setMemory === "function"
    ) {
      resolvedAdaptiveMentorEngine
        .setMemory(activeMemory);
    }

    return activeMemory;
  }

  /**
   * Returns the connected memory service.
   */
  function getMemory() {
    return activeMemory;
  }

  /**
   * Updates default generator options.
   */
  function setDefaultOptions(
    nextOptions = {}
  ) {
    activeDefaultOptions =
      resolveGeneratorOptions({
        ...cloneValue(
          activeDefaultOptions
        ),
        ...cloneValue(nextOptions),
      });

    return cloneValue(
      activeDefaultOptions
    );
  }

  /**
   * Returns current default options.
   */
  function getDefaultOptions() {
    return cloneValue(
      activeDefaultOptions
    );
  }

  /**
   * Returns engine service references for advanced integration
   * and testing.
   */
  function getServices() {
    return {
      adaptiveMentorEngine:
        resolvedAdaptiveMentorEngine,

      responseComposer:
        resolvedResponseComposer,

      responseProvider:
        activeResponseProvider,

      memory: activeMemory,
    };
  }

  return {
    generateResponse,
    previewResponsePlan,
    applyMemoryPlan,

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

/**
 * Convenience method for one-off response generation.
 */
async function generateResponse({
  message = "",
  context = {},
  options = {},
  responseProvider = null,
  memory = null,
  adaptivePlan = null,
  blueprint = null,
} = {}) {
  const generator =
    createResponseGenerator({
      responseProvider,
      memory,
    });

  return generator.generateResponse({
    message,
    context,
    options,
    adaptivePlan,
    blueprint,
  });
}

export {
  RESPONSE_GENERATOR_VERSION,
  GENERATION_STATUSES,
  GENERATION_STAGES,
  PROVIDER_TYPES,
  OUTPUT_FORMATS,
  RESPONSE_SOURCES,
  MEMORY_APPLICATION_POLICIES,
  VALIDATION_SEVERITIES,
  createResponseGenerator,
  generateResponse,
};

export default createResponseGenerator;
/**
 * Creator Journey Engine
 * ------------------------------------------------------------
 * The canonical creative-project journey state layer for
 * iBand's AI Mentor — The Creator.
 *
 * CreatorJourneyEngine owns:
 *
 * - The creator's project map.
 * - Past -> Present -> Next orientation.
 * - Stage and task state.
 * - Completed-for-now rather than permanently locked work.
 * - Creator-confirmed decisions.
 * - Mentor provisional creative decisions.
 * - Unresolved creative decisions.
 * - Milestones and milestone significance.
 * - Precise resume points.
 * - Revisit history.
 * - Scene-level version history.
 * - Recoverable Deleted Scenes.
 * - Scene restoration.
 * - Non-destructive creative experimentation.
 *
 * CreatorJourneyEngine DOES NOT own:
 *
 * - Conversation pacing.
 * - Whether the Mentor should ask another question.
 * - Final Mentor wording.
 * - Long-term persistence.
 * - Memory execution.
 * - Adaptive Mentor behaviour.
 * - Generation itself.
 *
 * Those responsibilities remain with:
 *
 * - ConversationPlanner
 * - ReflectionEngine
 * - ProgressionEngine
 * - CreatorMemoryEngine / CreatorMemory
 * - AdaptiveMentorEngine
 * - ResponseComposer / ResponseGenerator
 *
 * Core philosophy:
 *
 * - The Mentor carries the map.
 * - The creator carries the imagination.
 * - Never hide the journey.
 * - Never force the journey.
 * - Protect the creator's headspace.
 * - Keep the destination visible without making it daunting.
 * - Completed means completed for now, never locked.
 * - Creator-confirmed truth outranks Mentor inference.
 * - Mentor inference should reduce unnecessary questioning.
 * - Do not ask for information the creator already supplied.
 * - Experimentation should feel safe.
 * - Creative work is non-destructive by default.
 * - A new version must not silently destroy an older version.
 * - Deleted scenes remain recoverable until deliberately purged.
 * - Past -> Present -> Next should always be reconstructable.
 */

const CREATOR_JOURNEY_ENGINE_VERSION = "1.0.0";

const DEFAULT_DELETED_SCENE_RETENTION_DAYS = 30;

const JOURNEY_STATUSES = Object.freeze({
  NOT_STARTED: "not-started",
  ACTIVE: "active",
  PAUSED: "paused",
  COMPLETED_FOR_NOW: "completed-for-now",
  REVISITING: "revisiting",
  ARCHIVED: "archived",
});

const STAGE_STATUSES = Object.freeze({
  NOT_STARTED: "not-started",
  ACTIVE: "active",
  COMPLETED_FOR_NOW: "completed-for-now",
  REVISITING: "revisiting",
  SKIPPED_FOR_NOW: "skipped-for-now",
});

const TASK_STATUSES = Object.freeze({
  NOT_STARTED: "not-started",
  ACTIVE: "active",
  COMPLETED_FOR_NOW: "completed-for-now",
  SKIPPED_FOR_NOW: "skipped-for-now",
  REVISITING: "revisiting",
});

const DECISION_AUTHORITIES = Object.freeze({
  CREATOR: "creator",
  MENTOR_PROVISIONAL: "mentor-provisional",
  SHARED: "shared",
  UNRESOLVED: "unresolved",
});

const DECISION_STATUSES = Object.freeze({
  ACTIVE: "active",
  SUPERSEDED: "superseded",
  REVISIT_NEEDED: "revisit-needed",
  UNRESOLVED: "unresolved",
});

const MILESTONE_SIGNIFICANCE = Object.freeze({
  SMALL: "small",
  IMPORTANT: "important",
  MAJOR: "major",
  SUMMIT_APPROACHING: "summit-approaching",
  COMPLETION: "completion",
});

const SCENE_STATUSES = Object.freeze({
  ACTIVE: "active",
  DELETED: "deleted",
  ARCHIVED: "archived",
});

const VERSION_STATUSES = Object.freeze({
  ACTIVE: "active",
  PREVIOUS: "previous",
  ARCHIVED: "archived",
});

const MOVIE_JOURNEY_STAGES = Object.freeze([
  {
    id: "idea",
    label: "Idea",
    shortLabel: "Idea",
    description:
      "Capture the creator's movie idea without requiring it to be fully formed.",
    significance: MILESTONE_SIGNIFICANCE.IMPORTANT,
    tasks: [
      {
        id: "capture-core-idea",
        label: "Capture the core idea",
      },
      {
        id: "identify-known-context",
        label: "Identify what the creator already knows",
      },
      {
        id: "identify-open-threads",
        label: "Identify what can be discovered later",
      },
    ],
  },

  {
    id: "story-direction",
    label: "Story & Direction",
    shortLabel: "Story",
    description:
      "Shape the story foundation, tone, purpose and creative direction.",
    significance: MILESTONE_SIGNIFICANCE.MAJOR,
    tasks: [
      {
        id: "story-foundation",
        label: "Shape the story foundation",
      },
      {
        id: "creative-direction",
        label: "Establish a working creative direction",
      },
      {
        id: "emotional-journey",
        label: "Understand or discover the emotional journey",
      },
    ],
  },

  {
    id: "characters",
    label: "Characters",
    shortLabel: "Characters",
    description:
      "Develop the people, creatures or personalities that carry the story.",
    significance: MILESTONE_SIGNIFICANCE.MAJOR,
    tasks: [
      {
        id: "main-characters",
        label: "Develop the main characters",
      },
      {
        id: "supporting-characters",
        label: "Develop supporting characters as needed",
      },
      {
        id: "character-motivations",
        label: "Understand motivations and relationships",
      },
    ],
  },

  {
    id: "script",
    label: "Script",
    shortLabel: "Script",
    description:
      "Turn the established story into scenes, action and dialogue.",
    significance: MILESTONE_SIGNIFICANCE.MAJOR,
    tasks: [
      {
        id: "script-structure",
        label: "Establish script structure",
      },
      {
        id: "write-script",
        label: "Develop the screenplay",
      },
      {
        id: "script-review",
        label: "Review story and character continuity",
      },
    ],
  },

  {
    id: "scenes-storyboard",
    label: "Scenes & Storyboard",
    shortLabel: "Scenes",
    description:
      "Translate the script into editable scenes and visual beats.",
    significance: MILESTONE_SIGNIFICANCE.MAJOR,
    tasks: [
      {
        id: "scene-breakdown",
        label: "Break the script into scenes",
      },
      {
        id: "scene-intent",
        label: "Define what each scene needs to achieve",
      },
      {
        id: "storyboard",
        label: "Develop visual scene planning",
      },
    ],
  },

  {
    id: "visual-direction",
    label: "Visual Direction",
    shortLabel: "Visuals",
    description:
      "Establish the movie's visual language while allowing scene-specific treatments.",
    significance: MILESTONE_SIGNIFICANCE.IMPORTANT,
    tasks: [
      {
        id: "visual-language",
        label: "Establish the working visual language",
      },
      {
        id: "cinematography",
        label: "Establish provisional cinematography",
      },
      {
        id: "scene-treatments",
        label: "Define special scene treatments where needed",
      },
    ],
  },

  {
    id: "voices-dialogue",
    label: "Voices & Dialogue",
    shortLabel: "Voices",
    description:
      "Shape dialogue delivery, voice choices and spoken performance.",
    significance: MILESTONE_SIGNIFICANCE.IMPORTANT,
    tasks: [
      {
        id: "voice-direction",
        label: "Establish voice direction",
      },
      {
        id: "dialogue-performance",
        label: "Refine dialogue performance",
      },
    ],
  },

  {
    id: "music-sound",
    label: "Music & Sound",
    shortLabel: "Sound",
    description:
      "Develop soundtrack, ambience, sound design and emotional audio cues.",
    significance: MILESTONE_SIGNIFICANCE.IMPORTANT,
    tasks: [
      {
        id: "music-direction",
        label: "Establish music direction",
      },
      {
        id: "sound-design",
        label: "Develop sound design and ambience",
      },
      {
        id: "scene-audio",
        label: "Apply scene-specific audio treatments",
      },
    ],
  },

  {
    id: "production",
    label: "Create the Movie",
    shortLabel: "Create",
    description:
      "Generate and assemble the movie from the established creative project state.",
    significance: MILESTONE_SIGNIFICANCE.MAJOR,
    tasks: [
      {
        id: "generate-scenes",
        label: "Generate movie scenes",
      },
      {
        id: "assemble-cut",
        label: "Assemble the working cut",
      },
    ],
  },

  {
    id: "review-refine",
    label: "Review & Refine",
    shortLabel: "Review",
    description:
      "Review the movie, identify improvements and revise only what needs changing.",
    significance: MILESTONE_SIGNIFICANCE.MAJOR,
    tasks: [
      {
        id: "creator-review",
        label: "Creator review",
      },
      {
        id: "mentor-review",
        label: "Mentor creative review",
      },
      {
        id: "targeted-revisions",
        label: "Make targeted revisions",
      },
    ],
  },

  {
    id: "release-assets",
    label: "Poster & Trailer",
    shortLabel: "Release",
    description:
      "Create supporting release material for the finished movie.",
    significance: MILESTONE_SIGNIFICANCE.IMPORTANT,
    tasks: [
      {
        id: "poster",
        label: "Create poster artwork",
      },
      {
        id: "trailer",
        label: "Create trailer or promotional cut",
      },
    ],
  },

  {
    id: "publish",
    label: "Publish",
    shortLabel: "Publish",
    description:
      "Prepare the completed creation for its audience.",
    significance: MILESTONE_SIGNIFICANCE.COMPLETION,
    tasks: [
      {
        id: "final-check",
        label: "Complete final checks",
      },
      {
        id: "publish-project",
        label: "Publish the project",
      },
    ],
  },
]);

function createTimestamp() {
  return new Date().toISOString();
}

function createId(prefix = "journey") {
  const randomValue = Math.random()
    .toString(36)
    .slice(2, 10);

  return `${prefix}-${Date.now()}-${randomValue}`;
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

function cleanString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function asArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function safeDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? null
    : parsed;
}

function addDays(timestamp, days) {
  const date =
    safeDate(timestamp) ||
    new Date();

  date.setDate(
    date.getDate() + Number(days || 0)
  );

  return date.toISOString();
}

function createTaskState(task, index) {
  return {
    id:
      cleanString(task?.id) ||
      `task-${index + 1}`,

    label:
      cleanString(task?.label) ||
      `Task ${index + 1}`,

    status:
      TASK_STATUSES.NOT_STARTED,

    completedAt: null,
    revisitedAt: null,
    skippedAt: null,

    metadata:
      cloneValue(task?.metadata || {}),
  };
}

function createStageState(stage, index) {
  return {
    id:
      cleanString(stage?.id) ||
      `stage-${index + 1}`,

    label:
      cleanString(stage?.label) ||
      `Stage ${index + 1}`,

    shortLabel:
      cleanString(stage?.shortLabel) ||
      cleanString(stage?.label) ||
      `Stage ${index + 1}`,

    description:
      cleanString(stage?.description),

    significance:
      stage?.significance ||
      MILESTONE_SIGNIFICANCE.IMPORTANT,

    status:
      index === 0
        ? STAGE_STATUSES.ACTIVE
        : STAGE_STATUSES.NOT_STARTED,

    startedAt:
      index === 0
        ? createTimestamp()
        : null,

    completedAt: null,
    revisitedAt: null,

    tasks:
      asArray(stage?.tasks).map(
        createTaskState
      ),

    metadata:
      cloneValue(stage?.metadata || {}),
  };
}

function createJourney({
  projectId = null,
  projectName = null,
  creatorType = null,
  creatorMode = null,
  creatorJourney = "guide",
  stages = MOVIE_JOURNEY_STAGES,
  metadata = {},
} = {}) {
  const now = createTimestamp();

  const stageStates =
    asArray(stages).map(
      createStageState
    );

  const firstStage =
    stageStates[0] || null;

  return {
    engineVersion:
      CREATOR_JOURNEY_ENGINE_VERSION,

    journeyId:
      createId("creator-journey"),

    projectId:
      cleanString(projectId) || null,

    projectName:
      cleanString(projectName) || null,

    creatorType:
      cleanString(creatorType) || null,

    creatorMode:
      cleanString(creatorMode) || null,

    creatorJourney:
      cleanString(creatorJourney) ||
      "guide",

    status:
      JOURNEY_STATUSES.ACTIVE,

    createdAt: now,
    updatedAt: now,
    completedAt: null,

    stages:
      stageStates,

    currentStageId:
      firstStage?.id || null,

    currentTaskId:
      firstStage?.tasks?.[0]?.id || null,

    resumePoint: {
      stageId:
        firstStage?.id || null,

      taskId:
        firstStage?.tasks?.[0]?.id || null,

      sceneId: null,

      note: null,

      savedAt: now,
    },

    nextAction: null,

    decisions: [],

    milestones: [],

    scenes: [],

    deletedScenes: [],

    revisitHistory: [],

    orientationPreference: {
      mode: "adaptive",
      showProgressOften: false,
      showFullRoadmapByDefault: false,
    },

    metadata:
      cloneValue(metadata),
  };
}

function getStage(
  journey,
  stageId
) {
  return asArray(
    journey?.stages
  ).find(
    (stage) =>
      stage?.id === stageId
  ) || null;
}

function getCurrentStage(
  journey
) {
  return getStage(
    journey,
    journey?.currentStageId
  );
}

function getCurrentTask(
  journey
) {
  const stage =
    getCurrentStage(journey);

  return asArray(
    stage?.tasks
  ).find(
    (task) =>
      task?.id ===
      journey?.currentTaskId
  ) || null;
}

function findNextIncompleteStage(
  journey,
  afterStageId = null
) {
  const stages =
    asArray(journey?.stages);

  const startIndex =
    afterStageId
      ? stages.findIndex(
          (stage) =>
            stage?.id ===
            afterStageId
        ) + 1
      : 0;

  return (
    stages
      .slice(
        Math.max(0, startIndex)
      )
      .find(
        (stage) =>
          stage?.status !==
          STAGE_STATUSES
            .COMPLETED_FOR_NOW
      ) ||
    null
  );
}

function getProgress(
  journey
) {
  const stages =
    asArray(journey?.stages);

  const completedStages =
    stages.filter(
      (stage) =>
        stage?.status ===
        STAGE_STATUSES
          .COMPLETED_FOR_NOW
    );

  const total =
    stages.length;

  const completed =
    completedStages.length;

  const percentage =
    total > 0
      ? Math.round(
          (completed / total) * 100
        )
      : 0;

  return {
    completedStages: completed,
    totalStages: total,
    percentage,
  };
}

function createOrientation(
  journey
) {
  const currentStage =
    getCurrentStage(journey);

  const currentTask =
    getCurrentTask(journey);

  const stages =
    asArray(journey?.stages);

  const currentStageIndex =
    stages.findIndex(
      (stage) =>
        stage?.id ===
        currentStage?.id
    );

  const previousStage =
    currentStageIndex > 0
      ? stages[currentStageIndex - 1]
      : null;

  const nextStage =
    findNextIncompleteStage(
      journey,
      currentStage?.id
    );

  const progress =
    getProgress(journey);

  return {
    past: {
      previousStage:
        cloneValue(previousStage),

      completedStages:
        stages
          .filter(
            (stage) =>
              stage?.status ===
              STAGE_STATUSES
                .COMPLETED_FOR_NOW
          )
          .map((stage) => ({
            id: stage.id,
            label: stage.label,
            completedAt:
              stage.completedAt,
          })),

      latestMilestone:
        cloneValue(
          asArray(
            journey?.milestones
          ).at(-1) || null
        ),
    },

    present: {
      stage:
        cloneValue(currentStage),

      task:
        cloneValue(currentTask),

      resumePoint:
        cloneValue(
          journey?.resumePoint ||
          null
        ),

      status:
        journey?.status || null,
    },

    next: {
      action:
        cloneValue(
          journey?.nextAction ||
          null
        ),

      nextStage:
        cloneValue(nextStage),
    },

    progress,
  };
}

function touchJourney(
  journey
) {
  return {
    ...journey,
    updatedAt:
      createTimestamp(),
  };
}

function setCurrentPosition(
  journey,
  {
    stageId,
    taskId = null,
    sceneId = null,
    note = null,
  } = {}
) {
  const next =
    cloneValue(journey);

  const stage =
    getStage(
      next,
      stageId
    );

  if (!stage) {
    return next;
  }

  next.currentStageId =
    stage.id;

  if (
    stage.status ===
    STAGE_STATUSES.NOT_STARTED
  ) {
    stage.status =
      STAGE_STATUSES.ACTIVE;

    stage.startedAt =
      createTimestamp();
  }

  const requestedTask =
    taskId
      ? asArray(stage.tasks).find(
          (task) =>
            task?.id === taskId
        )
      : null;

  const fallbackTask =
    asArray(stage.tasks).find(
      (task) =>
        task?.status !==
        TASK_STATUSES
          .COMPLETED_FOR_NOW
    ) ||
    stage.tasks?.[0] ||
    null;

  const activeTask =
    requestedTask ||
    fallbackTask;

  next.currentTaskId =
    activeTask?.id || null;

  if (
    activeTask &&
    activeTask.status ===
      TASK_STATUSES.NOT_STARTED
  ) {
    activeTask.status =
      TASK_STATUSES.ACTIVE;
  }

  next.resumePoint = {
    stageId:
      stage.id,

    taskId:
      activeTask?.id || null,

    sceneId:
      cleanString(sceneId) ||
      null,

    note:
      cleanString(note) ||
      null,

    savedAt:
      createTimestamp(),
  };

  next.status =
    JOURNEY_STATUSES.ACTIVE;

  return touchJourney(next);
}

function completeTask(
  journey,
  {
    stageId,
    taskId,
  } = {}
) {
  const next =
    cloneValue(journey);

  const stage =
    getStage(
      next,
      stageId
    );

  const task =
    asArray(stage?.tasks).find(
      (item) =>
        item?.id === taskId
    );

  if (!stage || !task) {
    return next;
  }

  task.status =
    TASK_STATUSES
      .COMPLETED_FOR_NOW;

  task.completedAt =
    createTimestamp();

  return touchJourney(next);
}

function completeStage(
  journey,
  {
    stageId,
    milestoneMessage = null,
  } = {}
) {
  const next =
    cloneValue(journey);

  const stage =
    getStage(
      next,
      stageId
    );

  if (!stage) {
    return next;
  }

  const now =
    createTimestamp();

  stage.status =
    STAGE_STATUSES
      .COMPLETED_FOR_NOW;

  stage.completedAt =
    now;

  stage.tasks =
    asArray(stage.tasks).map(
      (task) => ({
        ...task,

        status:
          task.status ===
          TASK_STATUSES
            .SKIPPED_FOR_NOW
            ? task.status
            : TASK_STATUSES
                .COMPLETED_FOR_NOW,

        completedAt:
          task.completedAt ||
          now,
      })
    );

  next.milestones.push({
    id:
      createId("milestone"),

    stageId:
      stage.id,

    label:
      stage.label,

    significance:
      stage.significance,

    message:
      cleanString(
        milestoneMessage
      ) || null,

    reachedAt:
      now,
  });

  const nextStage =
    findNextIncompleteStage(
      next,
      stage.id
    );

  if (nextStage) {
    next.currentStageId =
      nextStage.id;

    nextStage.status =
      STAGE_STATUSES.ACTIVE;

    nextStage.startedAt =
      nextStage.startedAt ||
      now;

    const nextTask =
      nextStage.tasks?.[0] ||
      null;

    if (
      nextTask &&
      nextTask.status ===
        TASK_STATUSES
          .NOT_STARTED
    ) {
      nextTask.status =
        TASK_STATUSES.ACTIVE;
    }

    next.currentTaskId =
      nextTask?.id || null;

    next.resumePoint = {
      stageId:
        nextStage.id,

      taskId:
        nextTask?.id || null,

      sceneId: null,
      note: null,
      savedAt: now,
    };
  } else {
    next.status =
      JOURNEY_STATUSES
        .COMPLETED_FOR_NOW;

    next.completedAt =
      now;
  }

  return touchJourney(next);
}

function revisitStage(
  journey,
  {
    stageId,
    reason = null,
  } = {}
) {
  const next =
    cloneValue(journey);

  const stage =
    getStage(
      next,
      stageId
    );

  if (!stage) {
    return next;
  }

  const now =
    createTimestamp();

  next.revisitHistory.push({
    id:
      createId("revisit"),

    stageId:
      stage.id,

    previousCurrentStageId:
      next.currentStageId,

    reason:
      cleanString(reason) ||
      null,

    revisitedAt:
      now,
  });

  stage.status =
    STAGE_STATUSES.REVISITING;

  stage.revisitedAt =
    now;

  next.currentStageId =
    stage.id;

  const task =
    asArray(stage.tasks).find(
      (item) =>
        item?.status !==
        TASK_STATUSES
          .COMPLETED_FOR_NOW
    ) ||
    stage.tasks?.[0] ||
    null;

  next.currentTaskId =
    task?.id || null;

  next.resumePoint = {
    stageId:
      stage.id,

    taskId:
      task?.id || null,

    sceneId: null,

    note:
      cleanString(reason) ||
      null,

    savedAt: now,
  };

  next.status =
    JOURNEY_STATUSES.REVISITING;

  return touchJourney(next);
}

function recordDecision(
  journey,
  {
    key,
    value,
    authority =
      DECISION_AUTHORITIES
        .UNRESOLVED,
    stageId = null,
    sceneId = null,
    confidence = null,
    reason = null,
    metadata = {},
  } = {}
) {
  const next =
    cloneValue(journey);

  const cleanKey =
    cleanString(key);

  if (!cleanKey) {
    return next;
  }

  const existingActive =
    asArray(next.decisions)
      .filter(
        (decision) =>
          decision?.key ===
            cleanKey &&
          decision?.status ===
            DECISION_STATUSES
              .ACTIVE
      );

  const creatorAuthority =
    authority ===
    DECISION_AUTHORITIES.CREATOR;

  if (creatorAuthority) {
    existingActive.forEach(
      (decision) => {
        decision.status =
          DECISION_STATUSES
            .SUPERSEDED;

        decision.supersededAt =
          createTimestamp();
      }
    );
  } else {
    const creatorDecision =
      existingActive.find(
        (decision) =>
          decision?.authority ===
          DECISION_AUTHORITIES
            .CREATOR
      );

    if (creatorDecision) {
      return next;
    }
  }

  next.decisions.push({
    id:
      createId("decision"),

    key:
      cleanKey,

    value:
      cloneValue(value),

    authority,

    status:
      authority ===
      DECISION_AUTHORITIES
        .UNRESOLVED
        ? DECISION_STATUSES
            .UNRESOLVED
        : DECISION_STATUSES
            .ACTIVE,

    stageId:
      cleanString(stageId) ||
      null,

    sceneId:
      cleanString(sceneId) ||
      null,

    confidence:
      Number.isFinite(
        Number(confidence)
      )
        ? Math.max(
            0,
            Math.min(
              1,
              Number(confidence)
            )
          )
        : null,

    reason:
      cleanString(reason) ||
      null,

    metadata:
      cloneValue(metadata),

    createdAt:
      createTimestamp(),

    supersededAt: null,
  });

  return touchJourney(next);
}

function getActiveDecision(
  journey,
  key
) {
  const cleanKey =
    cleanString(key);

  const active =
    asArray(journey?.decisions)
      .filter(
        (decision) =>
          decision?.key ===
            cleanKey &&
          decision?.status ===
            DECISION_STATUSES
              .ACTIVE
      );

  const creatorDecision =
    active.find(
      (decision) =>
        decision?.authority ===
        DECISION_AUTHORITIES
          .CREATOR
    );

  return (
    cloneValue(
      creatorDecision ||
      active.at(-1) ||
      null
    )
  );
}

function setNextAction(
  journey,
  {
    type = null,
    label = null,
    stageId = null,
    taskId = null,
    sceneId = null,
    reason = null,
    optional = false,
    metadata = {},
  } = {}
) {
  const next =
    cloneValue(journey);

  next.nextAction = {
    id:
      createId("next-action"),

    type:
      cleanString(type) ||
      null,

    label:
      cleanString(label) ||
      null,

    stageId:
      cleanString(stageId) ||
      null,

    taskId:
      cleanString(taskId) ||
      null,

    sceneId:
      cleanString(sceneId) ||
      null,

    reason:
      cleanString(reason) ||
      null,

    optional:
      Boolean(optional),

    metadata:
      cloneValue(metadata),

    createdAt:
      createTimestamp(),
  };

  return touchJourney(next);
}

function createScene({
  sceneId = null,
  sceneNumber = null,
  title = null,
  summary = null,
  stageId = "scenes-storyboard",
  metadata = {},
} = {}) {
  const now =
    createTimestamp();

  return {
    id:
      cleanString(sceneId) ||
      createId("scene"),

    sceneNumber:
      sceneNumber ?? null,

    title:
      cleanString(title) ||
      null,

    summary:
      cleanString(summary) ||
      null,

    stageId:
      cleanString(stageId) ||
      "scenes-storyboard",

    status:
      SCENE_STATUSES.ACTIVE,

    activeVersionId: null,

    versions: [],

    createdAt: now,
    updatedAt: now,

    deletedAt: null,
    deleteExpiresAt: null,

    metadata:
      cloneValue(metadata),
  };
}

function ensureScene(
  journey,
  sceneInput
) {
  const next =
    cloneValue(journey);

  const sceneId =
    cleanString(
      sceneInput?.sceneId
    );

  const existing =
    sceneId
      ? asArray(next.scenes).find(
          (scene) =>
            scene?.id === sceneId
        )
      : null;

  if (existing) {
    return {
      journey: next,
      scene: existing,
    };
  }

  const scene =
    createScene(sceneInput);

  next.scenes.push(scene);

  return {
    journey:
      touchJourney(next),

    scene,
  };
}

function createSceneVersion(
  journey,
  {
    sceneId,
    content = null,
    label = null,
    changeSummary = null,
    createdBy =
      DECISION_AUTHORITIES.CREATOR,
    visualTreatment = null,
    audioTreatment = null,
    metadata = {},
  } = {}
) {
  const next =
    cloneValue(journey);

  const scene =
    asArray(next.scenes).find(
      (item) =>
        item?.id === sceneId
    );

  if (!scene) {
    return next;
  }

  const now =
    createTimestamp();

  scene.versions =
    asArray(scene.versions).map(
      (version) => ({
        ...version,

        status:
          version?.status ===
          VERSION_STATUSES.ACTIVE
            ? VERSION_STATUSES
                .PREVIOUS
            : version?.status,
      })
    );

  const versionNumber =
    scene.versions.length + 1;

  const version = {
    id:
      createId(
        `scene-version-${versionNumber}`
      ),

    versionNumber,

    label:
      cleanString(label) ||
      `Version ${versionNumber}`,

    content:
      cloneValue(content),

    changeSummary:
      cleanString(
        changeSummary
      ) || null,

    createdBy:
      cleanString(createdBy) ||
      DECISION_AUTHORITIES.CREATOR,

    status:
      VERSION_STATUSES.ACTIVE,

    visualTreatment:
      cloneValue(
        visualTreatment
      ),

    audioTreatment:
      cloneValue(
        audioTreatment
      ),

    metadata:
      cloneValue(metadata),

    createdAt: now,
  };

  scene.versions.push(
    version
  );

  scene.activeVersionId =
    version.id;

  scene.updatedAt =
    now;

  return touchJourney(next);
}

function activateSceneVersion(
  journey,
  {
    sceneId,
    versionId,
    reason = null,
  } = {}
) {
  const next =
    cloneValue(journey);

  const scene =
    asArray(next.scenes).find(
      (item) =>
        item?.id === sceneId
    );

  if (!scene) {
    return next;
  }

  const targetVersion =
    asArray(scene.versions).find(
      (version) =>
        version?.id === versionId
    );

  if (!targetVersion) {
    return next;
  }

  scene.versions =
    scene.versions.map(
      (version) => ({
        ...version,

        status:
          version.id ===
          targetVersion.id
            ? VERSION_STATUSES.ACTIVE
            : VERSION_STATUSES
                .PREVIOUS,
      })
    );

  scene.activeVersionId =
    targetVersion.id;

  scene.updatedAt =
    createTimestamp();

  next.revisitHistory.push({
    id:
      createId(
        "scene-version-restore"
      ),

    sceneId:
      scene.id,

    versionId:
      targetVersion.id,

    reason:
      cleanString(reason) ||
      "Previous scene version restored.",

    revisitedAt:
      createTimestamp(),
  });

  return touchJourney(next);
}

function softDeleteScene(
  journey,
  {
    sceneId,
    reason = null,
    retentionDays =
      DEFAULT_DELETED_SCENE_RETENTION_DAYS,
  } = {}
) {
  const next =
    cloneValue(journey);

  const sceneIndex =
    asArray(next.scenes)
      .findIndex(
        (scene) =>
          scene?.id === sceneId
      );

  if (sceneIndex < 0) {
    return next;
  }

  const now =
    createTimestamp();

  const scene =
    next.scenes[
      sceneIndex
    ];

  const deletedScene = {
    ...scene,

    status:
      SCENE_STATUSES.DELETED,

    deletedAt:
      now,

    deleteReason:
      cleanString(reason) ||
      null,

    deleteExpiresAt:
      addDays(
        now,
        retentionDays
      ),
  };

  next.scenes.splice(
    sceneIndex,
    1
  );

  next.deletedScenes.push(
    deletedScene
  );

  return touchJourney(next);
}

function restoreDeletedScene(
  journey,
  {
    sceneId,
  } = {}
) {
  const next =
    cloneValue(journey);

  const deletedIndex =
    asArray(
      next.deletedScenes
    ).findIndex(
      (scene) =>
        scene?.id === sceneId
    );

  if (deletedIndex < 0) {
    return next;
  }

  const restored =
    next.deletedScenes[
      deletedIndex
    ];

  next.deletedScenes.splice(
    deletedIndex,
    1
  );

  restored.status =
    SCENE_STATUSES.ACTIVE;

  restored.deletedAt =
    null;

  restored.deleteExpiresAt =
    null;

  restored.restoredAt =
    createTimestamp();

  next.scenes.push(
    restored
  );

  return touchJourney(next);
}

function purgeExpiredDeletedScenes(
  journey,
  {
    currentTimestamp =
      createTimestamp(),
  } = {}
) {
  const next =
    cloneValue(journey);

  const now =
    safeDate(
      currentTimestamp
    ) || new Date();

  next.deletedScenes =
    asArray(
      next.deletedScenes
    ).filter(
      (scene) => {
        const expiry =
          safeDate(
            scene
              ?.deleteExpiresAt
          );

        if (!expiry) {
          return true;
        }

        return (
          expiry.getTime() >
          now.getTime()
        );
      }
    );

  return touchJourney(next);
}

function permanentlyDeleteScene(
  journey,
  {
    sceneId,
    confirmed = false,
  } = {}
) {
  const next =
    cloneValue(journey);

  if (!confirmed) {
    return next;
  }

  next.deletedScenes =
    asArray(
      next.deletedScenes
    ).filter(
      (scene) =>
        scene?.id !== sceneId
    );

  return touchJourney(next);
}

function pauseJourney(
  journey,
  {
    note = null,
    sceneId = null,
  } = {}
) {
  const next =
    cloneValue(journey);

  next.status =
    JOURNEY_STATUSES.PAUSED;

  next.resumePoint = {
    stageId:
      next.currentStageId ||
      null,

    taskId:
      next.currentTaskId ||
      null,

    sceneId:
      cleanString(sceneId) ||
      next.resumePoint
        ?.sceneId ||
      null,

    note:
      cleanString(note) ||
      null,

    savedAt:
      createTimestamp(),
  };

  return touchJourney(next);
}

function resumeJourney(
  journey
) {
  const next =
    cloneValue(journey);

  next.status =
    JOURNEY_STATUSES.ACTIVE;

  return touchJourney(next);
}

function createJourneySnapshot(
  journey
) {
  return {
    engineVersion:
      CREATOR_JOURNEY_ENGINE_VERSION,

    journeyId:
      journey?.journeyId ||
      null,

    projectId:
      journey?.projectId ||
      null,

    projectName:
      journey?.projectName ||
      null,

    creatorType:
      journey?.creatorType ||
      null,

    creatorMode:
      journey?.creatorMode ||
      null,

    creatorJourney:
      journey?.creatorJourney ||
      null,

    orientation:
      createOrientation(
        journey
      ),

    activeDecisionCount:
      asArray(
        journey?.decisions
      ).filter(
        (decision) =>
          decision?.status ===
          DECISION_STATUSES.ACTIVE
      ).length,

    unresolvedDecisionCount:
      asArray(
        journey?.decisions
      ).filter(
        (decision) =>
          decision?.status ===
          DECISION_STATUSES
            .UNRESOLVED
      ).length,

    sceneCount:
      asArray(
        journey?.scenes
      ).length,

    deletedSceneCount:
      asArray(
        journey?.deletedScenes
      ).length,

    milestoneCount:
      asArray(
        journey?.milestones
      ).length,

    status:
      journey?.status ||
      JOURNEY_STATUSES
        .NOT_STARTED,

    updatedAt:
      journey?.updatedAt ||
      null,
  };
}

function createCreatorJourneyEngine(
  options = {}
) {
  const defaultDeletedSceneRetentionDays =
    Number.isFinite(
      Number(
        options
          ?.deletedSceneRetentionDays
      )
    )
      ? Math.max(
          1,
          Number(
            options
              .deletedSceneRetentionDays
          )
        )
      : DEFAULT_DELETED_SCENE_RETENTION_DAYS;

  return {
    version:
      CREATOR_JOURNEY_ENGINE_VERSION,

    createJourney,

    createMovieJourney(
      input = {}
    ) {
      return createJourney({
        ...input,

        creatorType:
          input?.creatorType ||
          "video",

        creatorMode:
          input?.creatorMode ||
          "ai-movie",

        stages:
          MOVIE_JOURNEY_STAGES,
      });
    },

    getOrientation:
      createOrientation,

    getProgress,

    getCurrentStage,

    getCurrentTask,

    getStage,

    getActiveDecision,

    setCurrentPosition,

    completeTask,

    completeStage,

    revisitStage,

    recordDecision,

    setNextAction,

    pauseJourney,

    resumeJourney,

    ensureScene,

    createSceneVersion,

    activateSceneVersion,

    softDeleteScene(
      journey,
      input = {}
    ) {
      return softDeleteScene(
        journey,
        {
          ...input,

          retentionDays:
            input
              ?.retentionDays ??
            defaultDeletedSceneRetentionDays,
        }
      );
    },

    restoreDeletedScene,

    purgeExpiredDeletedScenes,

    permanentlyDeleteScene,

    createSnapshot:
      createJourneySnapshot,

    constants: {
      JOURNEY_STATUSES,
      STAGE_STATUSES,
      TASK_STATUSES,
      DECISION_AUTHORITIES,
      DECISION_STATUSES,
      MILESTONE_SIGNIFICANCE,
      SCENE_STATUSES,
      VERSION_STATUSES,
      MOVIE_JOURNEY_STAGES,
      DEFAULT_DELETED_SCENE_RETENTION_DAYS,
    },

    creatorProtocol: {
      protectTheCreator: true,

      mentorCarriesTheMap: true,

      creatorCarriesTheImagination: true,

      pastPresentNext:
        true,

      neverHideJourney:
        true,

      neverForceJourney:
        true,

      protectCreatorHeadspace:
        true,

      completedDoesNotMeanLocked:
        true,

      creatorTruthOutranksInference:
        true,

      mentorInferenceCanReduceQuestions:
        true,

      doNotAskForKnownInformation:
        true,

      experimentationShouldFeelSafe:
        true,

      nonDestructiveEditing:
        true,

      preservePreviousVersions:
        true,

      recoverDeletedScenes:
        true,

      permanentDeletionRequiresConfirmation:
        true,

      creatorCanRevisitAnything:
        true,

      mentorMaySuggestRevision:
        true,

      mentorMustNotSilentlyOverwriteCreatorWork:
        true,
    },
  };
}

export {
  CREATOR_JOURNEY_ENGINE_VERSION,
  DEFAULT_DELETED_SCENE_RETENTION_DAYS,
  JOURNEY_STATUSES,
  STAGE_STATUSES,
  TASK_STATUSES,
  DECISION_AUTHORITIES,
  DECISION_STATUSES,
  MILESTONE_SIGNIFICANCE,
  SCENE_STATUSES,
  VERSION_STATUSES,
  MOVIE_JOURNEY_STAGES,
  createJourney,
  createOrientation,
  createJourneySnapshot,
};

export default createCreatorJourneyEngine;
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import createResponseGenerator from "../mentor/ResponseGenerator";

/**
 * MovieMentorConversation
 * ------------------------------------------------------------
 * Creator-facing conversation experience for Movie Mentor.
 *
 * This component is intentionally NOT the whole Mentor brain.
 *
 * Cognitive responsibility remains with the wider Mentor
 * architecture:
 *
 * ConversationPlanner
 * ReflectionEngine
 * ProgressionEngine
 * CreatorMemoryEngine
 * AdaptiveMentorEngine
 * ResponseComposer
 * CommunicationVoiceEngine
 * ResponseGenerator
 *
 * MovieMentorConversation is responsible for making those
 * decisions feel natural to the creator.
 *
 * Core principles:
 *
 * - Start with the creator, not the tools.
 * - Find out where the creator is in their journey.
 * - Recognise intent before suggesting alternatives.
 * - Never compete with the creator.
 * - Never use blame as a teaching tool.
 * - Demonstrate before teaching when appropriate.
 * - Experience → Insight → Growth.
 * - Teach while creating.
 * - Reveal tools only when they become useful.
 * - Keep momentum.
 * - Allow the creator to reject suggestions without friction.
 * - Sometimes discuss.
 * - Sometimes ask.
 * - Sometimes suggest.
 * - Sometimes demonstrate.
 * - Sometimes teach.
 * - Sometimes simply show.
 * - Sometimes say very little.
 */

const CREATOR_START_POINTS = Object.freeze([
  {
    id: "idea",
    label: "I just have an idea",
    description:
      "Start with whatever is in your head. It does not need to be fully formed.",
    icon: "💡",
  },
  {
    id: "notes",
    label: "I have some notes",
    description:
      "Bring rough notes, fragments, ideas or an unfinished outline.",
    icon: "📝",
  },
  {
    id: "story",
    label: "I've started writing a story",
    description:
      "We can explore what you already have and build from there.",
    icon: "📖",
  },
  {
    id: "script",
    label: "I have a script",
    description:
      "Paste or upload your script and we'll work through it together.",
    icon: "🎬",
  },
  {
    id: "book",
    label: "I've written a book",
    description:
      "We can explore how your written world might translate visually.",
    icon: "📚",
  },
  {
    id: "characters",
    label: "I already have characters",
    description:
      "Let's meet them, understand them and bring them to life.",
    icon: "🎭",
  },
  {
    id: "pictures",
    label: "I have pictures or artwork",
    description:
      "Show me what you've got and we'll explore where it could lead.",
    icon: "🖼️",
  },
  {
    id: "video",
    label: "I already have video",
    description:
      "We can watch what you've created and work on the next stage together.",
    icon: "🎥",
  },
  {
    id: "explore",
    label: "I'd just like to explore",
    description:
      "No pressure. We can play with possibilities and see what sparks.",
    icon: "✨",
  },
]);

const CREATIVE_STAGES = Object.freeze([
  {
    id: "idea",
    label: "Idea",
    shortLabel: "Idea",
  },
  {
    id: "characters",
    label: "Characters",
    shortLabel: "Characters",
  },
  {
    id: "world",
    label: "World",
    shortLabel: "World",
  },
  {
    id: "story",
    label: "Story",
    shortLabel: "Story",
  },
  {
    id: "attention",
    label: "Capture Attention",
    shortLabel: "Attention",
  },
  {
    id: "structure",
    label: "Story Structure",
    shortLabel: "Structure",
  },
  {
    id: "curiosity",
    label: "Audience Curiosity",
    shortLabel: "Curiosity",
  },
  {
    id: "emotion",
    label: "Emotional Impact",
    shortLabel: "Emotion",
  },
  {
    id: "pacing",
    label: "Pacing",
    shortLabel: "Pacing",
  },
  {
    id: "editing",
    label: "Editing Rhythm",
    shortLabel: "Editing",
  },
  {
    id: "sound",
    label: "Music & Sound",
    shortLabel: "Sound",
  },
  {
    id: "cliffhanger",
    label: "Cliffhangers",
    shortLabel: "Cliffhanger",
  },
  {
    id: "packaging",
    label: "Title & Thumbnail",
    shortLabel: "Packaging",
  },
  {
    id: "publish",
    label: "Publish",
    shortLabel: "Publish",
  },
]);

const MENTOR_BEHAVIOURS = Object.freeze({
  DISCUSS: "discuss",
  ASK: "ask",
  SUGGEST: "suggest",
  DEMONSTRATE: "demonstrate",
  TEACH: "teach",
  EXPLORE: "explore",
  SHOW: "show",
  CONTINUE: "continue",
  REFLECT: "reflect",
});

const MESSAGE_TYPES = Object.freeze({
  TEXT: "text",
  DEMONSTRATION: "demonstration",
  LESSON: "lesson",
  JOURNEY: "journey",
  SYSTEM: "system",
});

const DEFAULT_WELCOME_MESSAGE = Object.freeze({
  id: "movie-mentor-welcome",
  role: "mentor",
  type: MESSAGE_TYPES.TEXT,
  behaviour: MENTOR_BEHAVIOURS.ASK,
  text:
    "Let's find out where you are in your creative journey. You don't need to have everything worked out — show me what you've got so far, or simply tell me what's in your head.",
  createdAt: null,
});

function createId(prefix = "message") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function createTimestamp() {
  return new Date().toISOString();
}

function normaliseMessage(message, index = 0) {
  if (typeof message === "string") {
    return {
      id: `message-${index}`,
      role: "mentor",
      type: MESSAGE_TYPES.TEXT,
      behaviour: MENTOR_BEHAVIOURS.DISCUSS,
      text: message,
      createdAt: null,
    };
  }

  return {
    id:
      message?.id ||
      `message-${index}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,

    role:
      message?.role === "creator"
        ? "creator"
        : message?.role === "system"
          ? "system"
          : "mentor",

    type:
      message?.type ||
      MESSAGE_TYPES.TEXT,

    behaviour:
      message?.behaviour ||
      MENTOR_BEHAVIOURS.DISCUSS,

    text:
      typeof message?.text === "string"
        ? message.text
        : "",

    title:
      typeof message?.title === "string"
        ? message.title
        : "",

    description:
      typeof message?.description === "string"
        ? message.description
        : "",

    media:
      message?.media || null,

    lesson:
      message?.lesson || null,

    actions: Array.isArray(message?.actions)
      ? message.actions
      : [],

    metadata:
      message?.metadata || {},

    createdAt:
      message?.createdAt || null,
  };
}

function mergeMessages(messages = []) {
  const baseMessages =
    Array.isArray(messages) &&
    messages.length > 0
      ? messages
      : [
          {
            ...DEFAULT_WELCOME_MESSAGE,
            createdAt: createTimestamp(),
          },
        ];

  return baseMessages.map(normaliseMessage);
}

function getStageIndex(stageId) {
  return CREATIVE_STAGES.findIndex(
    (stage) => stage.id === stageId
  );
}

function getBehaviourLabel(behaviour) {
  switch (behaviour) {
    case MENTOR_BEHAVIOURS.DEMONSTRATE:
      return "Demonstration";

    case MENTOR_BEHAVIOURS.TEACH:
      return "Creative Insight";

    case MENTOR_BEHAVIOURS.SHOW:
      return "Something to show you";

    case MENTOR_BEHAVIOURS.EXPLORE:
      return "Explore together";

    case MENTOR_BEHAVIOURS.REFLECT:
      return "Mentor thought";

    default:
      return "";
  }
}

function MentorAvatar({
  mentorName,
}) {
  return (
    <div
      aria-label={`${mentorName} avatar`}
      style={styles.mentorAvatar}
    >
      <span style={styles.mentorAvatarGlow} />
      <span style={styles.mentorAvatarCore}>
        ✦
      </span>
    </div>
  );
}

function JourneyProgress({
  activeStage,
  completedStages,
  onStageSelect,
  compact = false,
}) {
  const completedSet = useMemo(
    () =>
      new Set(
        Array.isArray(completedStages)
          ? completedStages
          : []
      ),
    [completedStages]
  );

  const activeIndex =
    getStageIndex(activeStage);

  return (
    <div style={styles.journeyShell}>
      <div style={styles.journeyHeader}>
        <div>
          <div style={styles.journeyEyebrow}>
            YOUR CREATIVE JOURNEY
          </div>

          <div style={styles.journeyTitle}>
            One step at a time.
          </div>
        </div>

        <div style={styles.journeyCounter}>
          {Math.max(activeIndex + 1, 1)}
          {" / "}
          {CREATIVE_STAGES.length}
        </div>
      </div>

      <div
        style={
          compact
            ? styles.journeyTrackCompact
            : styles.journeyTrack
        }
      >
        {CREATIVE_STAGES.map(
          (stage, index) => {
            const isCompleted =
              completedSet.has(stage.id);

            const isActive =
              stage.id === activeStage;

            const isBeforeActive =
              activeIndex >= 0 &&
              index < activeIndex;

            const visuallyComplete =
              isCompleted ||
              isBeforeActive;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() =>
                  onStageSelect?.(stage.id)
                }
                style={{
                  ...styles.journeyStage,
                  ...(isActive
                    ? styles.journeyStageActive
                    : {}),
                  ...(visuallyComplete
                    ? styles.journeyStageComplete
                    : {}),
                }}
                aria-current={
                  isActive ? "step" : undefined
                }
              >
                <span
                  style={{
                    ...styles.stageDot,
                    ...(isActive
                      ? styles.stageDotActive
                      : {}),
                    ...(visuallyComplete
                      ? styles.stageDotComplete
                      : {}),
                  }}
                >
                  {visuallyComplete
                    ? "✓"
                    : index + 1}
                </span>

                {!compact && (
                  <span
                    style={{
                      ...styles.stageLabel,
                      ...(isActive
                        ? styles.stageLabelActive
                        : {}),
                    }}
                  >
                    {stage.shortLabel}
                  </span>
                )}
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}

function StartPointChooser({
  onSelect,
}) {
  return (
    <div style={styles.startPointShell}>
      <div style={styles.startPointHeader}>
        <div style={styles.startPointEyebrow}>
          WHERE ARE YOU STARTING?
        </div>

        <div style={styles.startPointTitle}>
          Bring whatever you have.
        </div>

        <div style={styles.startPointDescription}>
          An idea is enough. If you've
          already created something, even
          better.
        </div>
      </div>

      <div style={styles.startPointGrid}>
        {CREATOR_START_POINTS.map(
          (option) => (
            <button
              key={option.id}
              type="button"
              onClick={() =>
                onSelect?.(option)
              }
              style={styles.startPointCard}
            >
              <span style={styles.startPointIcon}>
                {option.icon}
              </span>

              <span
                style={styles.startPointCardText}
              >
                <strong
                  style={
                    styles.startPointCardTitle
                  }
                >
                  {option.label}
                </strong>

                <span
                  style={
                    styles.startPointCardDescription
                  }
                >
                  {option.description}
                </span>
              </span>

              <span
                style={styles.startPointArrow}
              >
                →
              </span>
            </button>
          )
        )}
      </div>
    </div>
  );
}

function DemonstrationCard({
  message,
  onAction,
}) {
  const media = message.media;

  return (
    <div style={styles.demoCard}>
      <div style={styles.demoTopRow}>
        <div>
          <div style={styles.demoEyebrow}>
            {getBehaviourLabel(
              message.behaviour
            ) || "DEMONSTRATION"}
          </div>

          {message.title && (
            <div style={styles.demoTitle}>
              {message.title}
            </div>
          )}
        </div>

        <div style={styles.demoBadge}>
          ▶ Preview
        </div>
      </div>

      {message.description && (
        <div style={styles.demoDescription}>
          {message.description}
        </div>
      )}

      <div style={styles.demoMedia}>
        {media?.thumbnailUrl ? (
          <img
            src={media.thumbnailUrl}
            alt={
              media.alt ||
              "Movie Mentor demonstration"
            }
            style={styles.demoImage}
          />
        ) : (
          <div
            style={
              styles.demoMediaPlaceholder
            }
          >
            <div style={styles.playOrb}>
              ▶
            </div>

            <div
              style={
                styles.demoPlaceholderTitle
              }
            >
              Scene Preview
            </div>

            <div
              style={
                styles.demoPlaceholderText
              }
            >
              Movie Mentor can place a
              generated or edited scene here.
            </div>
          </div>
        )}
      </div>

      {message.text && (
        <div style={styles.demoPromptText}>
          {message.text}
        </div>
      )}

      <div style={styles.demoActions}>
        {(message.actions?.length
          ? message.actions
          : [
              {
                id: "play",
                label: "Play Scene",
                action: "play-demo",
              },
              {
                id: "thoughts",
                label: "Tell Mentor What I Think",
                action:
                  "respond-to-demo",
              },
            ]
        ).map((action) => (
          <button
            key={
              action.id ||
              action.action ||
              action.label
            }
            type="button"
            onClick={() =>
              onAction?.(
                action,
                message
              )
            }
            style={
              action.primary
                ? styles.primaryActionButton
                : styles.secondaryActionButton
            }
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function LessonCard({
  message,
  onAction,
}) {
  const lesson =
    message.lesson || {};

  return (
    <div style={styles.lessonCard}>
      <div style={styles.lessonEyebrow}>
        CREATIVE INSIGHT
      </div>

      <div style={styles.lessonTitle}>
        {lesson.title ||
          message.title ||
          "Why that worked"}
      </div>

      {(lesson.summary ||
        message.text) && (
        <div style={styles.lessonSummary}>
          {lesson.summary ||
            message.text}
        </div>
      )}

      {Array.isArray(
        lesson.points
      ) &&
        lesson.points.length > 0 && (
          <div style={styles.lessonPoints}>
            {lesson.points.map(
              (point, index) => (
                <div
                  key={`${index}-${point}`}
                  style={
                    styles.lessonPoint
                  }
                >
                  <span
                    style={
                      styles.lessonPointNumber
                    }
                  >
                    {index + 1}
                  </span>

                  <span>
                    {point}
                  </span>
                </div>
              )
            )}
          </div>
        )}

      {lesson.takeaway && (
        <div style={styles.lessonTakeaway}>
          <span
            style={
              styles.lessonTakeawayLabel
            }
          >
            TAKEAWAY
          </span>

          <span>
            {lesson.takeaway}
          </span>
        </div>
      )}

      <div style={styles.lessonFooter}>
        <button
          type="button"
          onClick={() =>
            onAction?.(
              {
                action:
                  "continue-after-lesson",
                label: "Continue",
              },
              message
            )
          }
          style={styles.primaryActionButton}
        >
          Continue Creating
        </button>
      </div>
    </div>
  );
}

function ConversationBubble({
  message,
  mentorName,
  onAction,
}) {
  const isCreator =
    message.role === "creator";

  const isSystem =
    message.role === "system";

  if (isSystem) {
    return (
      <div style={styles.systemMessage}>
        {message.text}
      </div>
    );
  }

  if (
    message.type ===
    MESSAGE_TYPES.DEMONSTRATION
  ) {
    return (
      <div style={styles.mentorMessageRow}>
        <MentorAvatar
          mentorName={mentorName}
        />

        <div style={styles.mentorContent}>
          <DemonstrationCard
            message={message}
            onAction={onAction}
          />
        </div>
      </div>
    );
  }

  if (
    message.type ===
    MESSAGE_TYPES.LESSON
  ) {
    return (
      <div style={styles.mentorMessageRow}>
        <MentorAvatar
          mentorName={mentorName}
        />

        <div style={styles.mentorContent}>
          <LessonCard
            message={message}
            onAction={onAction}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={
        isCreator
          ? styles.creatorMessageRow
          : styles.mentorMessageRow
      }
    >
      {!isCreator && (
        <MentorAvatar
          mentorName={mentorName}
        />
      )}

      <div
        style={
          isCreator
            ? styles.creatorBubble
            : styles.mentorBubble
        }
      >
        {!isCreator &&
          getBehaviourLabel(
            message.behaviour
          ) && (
            <div
              style={
                styles.behaviourLabel
              }
            >
              {getBehaviourLabel(
                message.behaviour
              )}
            </div>
          )}

        {message.title && (
          <div style={styles.messageTitle}>
            {message.title}
          </div>
        )}

        <div style={styles.messageText}>
          {message.text}
        </div>

        {message.actions?.length >
          0 && (
          <div
            style={
              styles.messageActionRow
            }
          >
            {message.actions.map(
              (action) => (
                <button
                  key={
                    action.id ||
                    action.action ||
                    action.label
                  }
                  type="button"
                  onClick={() =>
                    onAction?.(
                      action,
                      message
                    )
                  }
                  style={
                    action.primary
                      ? styles.primaryActionButton
                      : styles.secondaryActionButton
                  }
                >
                  {action.label}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickActions({
  actions,
  onAction,
}) {
  if (
    !Array.isArray(actions) ||
    actions.length === 0
  ) {
    return null;
  }

  return (
    <div style={styles.quickActionScroller}>
      {actions.map((action) => (
        <button
          key={
            action.id ||
            action.action ||
            action.label
          }
          type="button"
          onClick={() =>
            onAction?.(action)
          }
          style={styles.quickActionButton}
        >
          {action.icon && (
            <span>
              {action.icon}
            </span>
          )}

          {action.label}
        </button>
      ))}
    </div>
  );
}

export default function MovieMentorConversation({
  creatorName = "Creator",
  mentorName = "Movie Mentor",

  messages = [],

  activeStage = "idea",
  completedStages = [],

  startPoint = null,

  isThinking = false,
  isGenerating = false,

  placeholder =
    "Tell Movie Mentor what's on your mind...",

  quickActions = [],

  showJourney = true,
  showStartPointChooser = true,

  allowAttachments = true,
  allowVoice = true,

  onSendMessage,
  onStartPointSelect,
  onStageSelect,
  onAction,
  onAttach,
  onVoice,
  onDemonstrate,
  onTeach,
  onContinue,

  renderComposerExtra,
  renderAboveConversation,
  renderBelowConversation,
}) {
  const [draft, setDraft] =
    useState("");

    const [localStartPoint, setLocalStartPoint] =
    useState(startPoint);

  const responseGeneratorRef =
    useRef(null);

  if (!responseGeneratorRef.current) {
    responseGeneratorRef.current =
      createResponseGenerator();
  }

  const messagesEndRef =
    useRef(null);

  const normalisedMessages =
    useMemo(
      () => mergeMessages(messages),
      [messages]
    );

  const hasCreatorMessage =
    normalisedMessages.some(
      (message) =>
        message.role === "creator"
    );

  const shouldShowStartPoints =
    showStartPointChooser &&
    !localStartPoint &&
    !hasCreatorMessage;

  useEffect(() => {
    if (startPoint) {
      setLocalStartPoint(
        startPoint
      );
    }
  }, [startPoint]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.(
      {
        behavior: "smooth",
        block: "nearest",
      }
    );
  }, [
    normalisedMessages.length,
    isThinking,
    isGenerating,
  ]);

  function handleStartPointSelect(
    option
  ) {
    setLocalStartPoint(option);

    onStartPointSelect?.(
      option
    );
  }

    async function handleSend() {
    const text = draft.trim();

    if (!text) {
      return;
    }

    const creatorMessage = {
      id: createId(
        "creator-message"
      ),
      role: "creator",
      type: MESSAGE_TYPES.TEXT,
      behaviour:
        MENTOR_BEHAVIOURS.DISCUSS,
      text,
      createdAt:
        createTimestamp(),
    };

    onSendMessage?.(
      creatorMessage
    );

    setDraft("");

    const responseGenerator =
      responseGeneratorRef.current;

    if (!responseGenerator) {
      return;
    }

    const generatedResponse =
      await responseGenerator.generateResponse({
        message: text,
        context: {
          creatorName,
          creatorType: "movie",
          creatorJourney:
            localStartPoint?.id ||
            "guide",
          projectType: "movie",
          recentCreatorMessages: [
            ...normalisedMessages
              .filter(
                (message) =>
                  message.role ===
                  "creator"
              )
              .map(
                (message) =>
                  message.text
              ),
            text,
          ],
          recentMentorMessages:
            normalisedMessages
              .filter(
                (message) =>
                  message.role ===
                  "mentor"
              )
              .map(
                (message) =>
                  message.text
              ),
        },
      });

    if (
      generatedResponse?.response?.text
    ) {
      onSendMessage?.({
        id: createId(
          "mentor-message"
        ),
        role: "mentor",
        type: MESSAGE_TYPES.TEXT,
        behaviour:
          MENTOR_BEHAVIOURS.DISCUSS,
        text:
          generatedResponse.response
            .text,
        createdAt:
          createTimestamp(),
        metadata: {
          generationId:
            generatedResponse.id,
          generationStatus:
            generatedResponse.status,
          responseSource:
            generatedResponse.source,
        },
      });
    }
  }

  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleSend();
    }
  }

  function handleAction(
    action,
    message = null
  ) {
    onAction?.(
      action,
      message
    );

    switch (action?.action) {
      case "demonstrate":
      case "show-example":
      case "play-demo":
        onDemonstrate?.(
          action,
          message
        );
        break;

      case "teach":
      case "explain":
        onTeach?.(
          action,
          message
        );
        break;

      case "continue":
      case "continue-after-lesson":
        onContinue?.(
          action,
          message
        );
        break;

      default:
        break;
    }
  }

  const currentStage =
    CREATIVE_STAGES.find(
      (stage) =>
        stage.id === activeStage
    ) ||
    CREATIVE_STAGES[0];

  return (
    <section style={styles.shell}>
      <div style={styles.topGlow} />

      <header style={styles.header}>
        <div style={styles.headerIdentity}>
          <MentorAvatar
            mentorName={mentorName}
          />

          <div>
            <div style={styles.eyebrow}>
              MOVIE MENTOR
            </div>

            <div style={styles.title}>
              {mentorName}
            </div>

            <div style={styles.subtitle}>
              Creating with{" "}
              {creatorName}
            </div>
          </div>
        </div>

        <div style={styles.activeStageBadge}>
          <span
            style={
              styles.activeStageDot
            }
          />

          {currentStage.label}
        </div>
      </header>

      {showJourney && (
        <JourneyProgress
          activeStage={activeStage}
          completedStages={
            completedStages
          }
          onStageSelect={
            onStageSelect
          }
          compact
        />
      )}

      {renderAboveConversation?.()}

      <div
        style={styles.conversationViewport}
      >
        <div style={styles.conversationInner}>
          {normalisedMessages.map(
            (message) => (
              <ConversationBubble
                key={message.id}
                message={message}
                mentorName={
                  mentorName
                }
                onAction={
                  handleAction
                }
              />
            )
          )}

          {shouldShowStartPoints && (
            <StartPointChooser
              onSelect={
                handleStartPointSelect
              }
            />
          )}

          {isThinking && (
            <div
              style={
                styles.mentorMessageRow
              }
            >
              <MentorAvatar
                mentorName={
                  mentorName
                }
              />

              <div
                style={
                  styles.thinkingBubble
                }
              >
                <span
                  style={
                    styles.thinkingDot
                  }
                />
                <span
                  style={
                    styles.thinkingDot
                  }
                />
                <span
                  style={
                    styles.thinkingDot
                  }
                />

                <span
                  style={
                    styles.thinkingText
                  }
                >
                  Thinking with you...
                </span>
              </div>
            </div>
          )}

          {isGenerating && (
            <div
              style={
                styles.generatingCard
              }
            >
              <div
                style={
                  styles.generatingOrb
                }
              >
                ✦
              </div>

              <div>
                <div
                  style={
                    styles.generatingTitle
                  }
                >
                  Preparing something
                  for you...
                </div>

                <div
                  style={
                    styles.generatingText
                  }
                >
                  Sometimes it's quicker
                  to show than explain.
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div style={styles.composerSection}>
        <QuickActions
          actions={quickActions}
          onAction={handleAction}
        />

        {renderComposerExtra?.()}

        <div style={styles.composer}>
          <textarea
            value={draft}
            onChange={(event) =>
              setDraft(
                event.target.value
              )
            }
            onKeyDown={
              handleKeyDown
            }
            placeholder={
              placeholder
            }
            rows={1}
            style={
              styles.composerInput
            }
            aria-label="Message Movie Mentor"
          />

          <div
            style={
              styles.composerToolbar
            }
          >
            <div
              style={
                styles.composerTools
              }
            >
              {allowAttachments && (
                <button
                  type="button"
                  onClick={
                    onAttach
                  }
                  style={
                    styles.toolButton
                  }
                  aria-label="Add something"
                  title="Add something"
                >
                  ＋
                </button>
              )}

              {allowVoice && (
                <button
                  type="button"
                  onClick={
                    onVoice
                  }
                  style={
                    styles.toolButton
                  }
                  aria-label="Speak to Movie Mentor"
                  title="Speak"
                >
                  ◉
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={
                handleSend
              }
              disabled={
                !draft.trim()
              }
              style={{
                ...styles.sendButton,
                ...(!draft.trim()
                  ? styles.sendButtonDisabled
                  : {}),
              }}
            >
              Send
              <span
                style={
                  styles.sendArrow
                }
              >
                ↑
              </span>
            </button>
          </div>
        </div>

        <div style={styles.composerHint}>
          Bring an idea, script, image,
          scene or unfinished thought.
          We'll work from wherever you
          are.
        </div>
      </div>

      {renderBelowConversation?.()}
    </section>
  );
}

export {
  CREATOR_START_POINTS,
  CREATIVE_STAGES,
  MENTOR_BEHAVIOURS,
  MESSAGE_TYPES,
};

const styles = {
  shell: {
    position: "relative",
    width: "100%",
    maxWidth: "760px",
    margin: "0 auto",
    borderRadius: "28px",
    overflow: "hidden",
    background:
      "linear-gradient(180deg, rgba(13,14,22,0.99) 0%, rgba(8,9,15,0.99) 100%)",
    border:
      "1px solid rgba(255,255,255,0.08)",
    boxShadow:
      "0 28px 80px rgba(0,0,0,0.38)",
    color: "#f7f7fb",
  },

  topGlow: {
    position: "absolute",
    top: "-120px",
    left: "50%",
    width: "420px",
    height: "220px",
    transform:
      "translateX(-50%)",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(145,93,255,0.22) 0%, rgba(145,93,255,0) 72%)",
    pointerEvents: "none",
  },

  header: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "16px",
    padding: "20px 18px 14px",
    borderBottom:
      "1px solid rgba(255,255,255,0.06)",
  },

  headerIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
  },

  eyebrow: {
    marginBottom: "2px",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.16em",
    color:
      "rgba(192,166,255,0.9)",
  },

  title: {
    fontSize: "17px",
    lineHeight: 1.2,
    fontWeight: 800,
  },

  subtitle: {
    marginTop: "2px",
    fontSize: "12px",
    color:
      "rgba(255,255,255,0.52)",
  },

  mentorAvatar: {
    position: "relative",
    flex: "0 0 auto",
    width: "40px",
    height: "40px",
    display: "grid",
    placeItems: "center",
  },

  mentorAvatarGlow: {
    position: "absolute",
    inset: "0",
    borderRadius: "50%",
    background:
      "linear-gradient(135deg, rgba(145,93,255,0.7), rgba(72,192,255,0.42))",
    filter: "blur(5px)",
    opacity: 0.7,
  },

  mentorAvatarCore: {
    position: "relative",
    zIndex: 1,
    width: "34px",
    height: "34px",
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background:
      "linear-gradient(145deg, #24183d, #121522)",
    border:
      "1px solid rgba(255,255,255,0.18)",
    color: "#ffffff",
    fontSize: "16px",
  },

  activeStageBadge: {
    flex: "0 0 auto",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "8px 10px",
    borderRadius: "999px",
    background:
      "rgba(255,255,255,0.055)",
    border:
      "1px solid rgba(255,255,255,0.07)",
    fontSize: "11px",
    fontWeight: 700,
    color:
      "rgba(255,255,255,0.72)",
  },

  activeStageDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#9d7bff",
    boxShadow:
      "0 0 12px rgba(157,123,255,0.8)",
  },

  journeyShell: {
    position: "relative",
    zIndex: 1,
    padding: "13px 18px 14px",
    borderBottom:
      "1px solid rgba(255,255,255,0.05)",
    background:
      "rgba(255,255,255,0.015)",
  },

  journeyHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-end",
    gap: "14px",
    marginBottom: "12px",
  },

  journeyEyebrow: {
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "0.14em",
    color:
      "rgba(255,255,255,0.38)",
  },

  journeyTitle: {
    marginTop: "3px",
    fontSize: "13px",
    fontWeight: 700,
    color:
      "rgba(255,255,255,0.78)",
  },

  journeyCounter: {
    fontSize: "11px",
    fontWeight: 700,
    color:
      "rgba(255,255,255,0.36)",
  },

  journeyTrack: {
    display: "grid",
    gridTemplateColumns:
      "repeat(14, minmax(62px, 1fr))",
    gap: "7px",
    overflowX: "auto",
    paddingBottom: "4px",
  },

  journeyTrackCompact: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    overflowX: "auto",
    paddingBottom: "2px",
    scrollbarWidth: "none",
  },

  journeyStage: {
    appearance: "none",
    WebkitAppearance: "none",
    border: "0",
    margin: 0,
    padding: "3px",
    background: "transparent",
    color:
      "rgba(255,255,255,0.4)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "5px",
    minWidth: "24px",
  },

  journeyStageActive: {
    color: "#ffffff",
  },

  journeyStageComplete: {
    color:
      "rgba(200,184,255,0.86)",
  },

  stageDot: {
    width: "21px",
    height: "21px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    border:
      "1px solid rgba(255,255,255,0.12)",
    background:
      "rgba(255,255,255,0.035)",
    fontSize: "9px",
    fontWeight: 800,
    flex: "0 0 auto",
  },

  stageDotActive: {
    background:
      "linear-gradient(135deg, #7b52ff, #ad79ff)",
    border:
      "1px solid rgba(255,255,255,0.28)",
    boxShadow:
      "0 0 16px rgba(139,91,255,0.36)",
  },

  stageDotComplete: {
    background:
      "rgba(132,92,255,0.18)",
    border:
      "1px solid rgba(169,136,255,0.34)",
  },

  stageLabel: {
    fontSize: "9px",
    whiteSpace: "nowrap",
  },

  stageLabelActive: {
    fontWeight: 800,
    color: "#ffffff",
  },

  conversationViewport: {
    minHeight: "420px",
    maxHeight: "62vh",
    overflowY: "auto",
    overscrollBehavior:
      "contain",
  },

  conversationInner: {
    display: "flex",
    flexDirection: "column",
    gap: "17px",
    padding: "20px 16px 24px",
  },

  mentorMessageRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    width: "100%",
  },

  creatorMessageRow: {
    display: "flex",
    justifyContent: "flex-end",
    width: "100%",
  },

  mentorContent: {
    width: "calc(100% - 50px)",
    maxWidth: "640px",
  },

  mentorBubble: {
    width: "fit-content",
    maxWidth: "82%",
    padding: "13px 15px",
    borderRadius:
      "8px 18px 18px 18px",
    background:
      "rgba(255,255,255,0.055)",
    border:
      "1px solid rgba(255,255,255,0.065)",
    boxShadow:
      "0 9px 24px rgba(0,0,0,0.16)",
  },

  creatorBubble: {
    width: "fit-content",
    maxWidth: "82%",
    padding: "13px 15px",
    borderRadius:
      "18px 8px 18px 18px",
    background:
      "linear-gradient(145deg, rgba(116,76,220,0.9), rgba(91,63,172,0.92))",
    border:
      "1px solid rgba(255,255,255,0.12)",
    boxShadow:
      "0 10px 24px rgba(44,26,87,0.28)",
  },

  behaviourLabel: {
    marginBottom: "5px",
    fontSize: "9px",
    lineHeight: 1.2,
    fontWeight: 800,
    letterSpacing: "0.13em",
    textTransform: "uppercase",
    color:
      "rgba(191,164,255,0.82)",
  },

  messageTitle: {
    marginBottom: "5px",
    fontSize: "14px",
    fontWeight: 800,
  },

  messageText: {
    whiteSpace: "pre-wrap",
    fontSize: "14px",
    lineHeight: 1.55,
    color:
      "rgba(255,255,255,0.9)",
  },

  messageActionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "12px",
  },

  systemMessage: {
    alignSelf: "center",
    maxWidth: "90%",
    padding: "7px 10px",
    borderRadius: "999px",
    background:
      "rgba(255,255,255,0.035)",
    color:
      "rgba(255,255,255,0.42)",
    fontSize: "10px",
    textAlign: "center",
  },

  startPointShell: {
    marginTop: "4px",
    padding: "16px",
    borderRadius: "22px",
    background:
      "linear-gradient(145deg, rgba(112,72,204,0.10), rgba(46,64,112,0.08))",
    border:
      "1px solid rgba(164,128,255,0.12)",
  },

  startPointHeader: {
    marginBottom: "14px",
  },

  startPointEyebrow: {
    marginBottom: "5px",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "0.14em",
    color:
      "rgba(181,148,255,0.82)",
  },

  startPointTitle: {
    fontSize: "19px",
    fontWeight: 850,
    letterSpacing:
      "-0.02em",
  },

  startPointDescription: {
    marginTop: "5px",
    maxWidth: "500px",
    fontSize: "12px",
    lineHeight: 1.5,
    color:
      "rgba(255,255,255,0.52)",
  },

  startPointGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "8px",
  },

  startPointCard: {
    appearance: "none",
    WebkitAppearance: "none",
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px",
    textAlign: "left",
    borderRadius: "15px",
    background:
      "rgba(255,255,255,0.045)",
    border:
      "1px solid rgba(255,255,255,0.07)",
    color: "#ffffff",
    cursor: "pointer",
  },

  startPointIcon: {
    width: "30px",
    height: "30px",
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
    borderRadius: "10px",
    background:
      "rgba(255,255,255,0.055)",
    fontSize: "15px",
  },

  startPointCardText: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    minWidth: 0,
    flex: 1,
  },

  startPointCardTitle: {
    fontSize: "12px",
    lineHeight: 1.3,
  },

  startPointCardDescription: {
    fontSize: "10px",
    lineHeight: 1.4,
    color:
      "rgba(255,255,255,0.44)",
  },

  startPointArrow: {
    flex: "0 0 auto",
    fontSize: "14px",
    color:
      "rgba(255,255,255,0.32)",
  },

  demoCard: {
    width: "100%",
    padding: "15px",
    borderRadius: "20px",
    background:
      "linear-gradient(145deg, rgba(102,70,178,0.14), rgba(38,45,73,0.22))",
    border:
      "1px solid rgba(168,133,255,0.15)",
  },

  demoTopRow: {
    display: "flex",
    justifyContent:
      "space-between",
    gap: "12px",
    alignItems: "flex-start",
  },

  demoEyebrow: {
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color:
      "rgba(187,154,255,0.82)",
  },

  demoTitle: {
    marginTop: "4px",
    fontSize: "16px",
    fontWeight: 800,
  },

  demoBadge: {
    flex: "0 0 auto",
    padding: "6px 8px",
    borderRadius: "999px",
    background:
      "rgba(255,255,255,0.055)",
    border:
      "1px solid rgba(255,255,255,0.06)",
    fontSize: "9px",
    fontWeight: 700,
    color:
      "rgba(255,255,255,0.56)",
  },

  demoDescription: {
    marginTop: "6px",
    fontSize: "12px",
    lineHeight: 1.45,
    color:
      "rgba(255,255,255,0.55)",
  },

  demoMedia: {
    marginTop: "13px",
    overflow: "hidden",
    borderRadius: "16px",
    aspectRatio: "16 / 9",
    background: "#090a0f",
    border:
      "1px solid rgba(255,255,255,0.07)",
  },

  demoImage: {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  demoMediaPlaceholder: {
    width: "100%",
    height: "100%",
    minHeight: "180px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "7px",
    background:
      "radial-gradient(circle at 50% 42%, rgba(123,82,255,0.14), transparent 44%), linear-gradient(145deg, #12131c, #090a0e)",
  },

  playOrb: {
    width: "45px",
    height: "45px",
    display: "grid",
    placeItems: "center",
    paddingLeft: "3px",
    borderRadius: "50%",
    background:
      "linear-gradient(145deg, #855fff, #6040c8)",
    boxShadow:
      "0 10px 28px rgba(102,65,210,0.35)",
    fontSize: "14px",
  },

  demoPlaceholderTitle: {
    fontSize: "13px",
    fontWeight: 800,
  },

  demoPlaceholderText: {
    maxWidth: "280px",
    padding: "0 16px",
    textAlign: "center",
    fontSize: "10px",
    lineHeight: 1.4,
    color:
      "rgba(255,255,255,0.42)",
  },

  demoPromptText: {
    marginTop: "12px",
    fontSize: "13px",
    lineHeight: 1.5,
    color:
      "rgba(255,255,255,0.78)",
  },

  demoActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "13px",
  },

  lessonCard: {
    width: "100%",
    padding: "16px",
    borderRadius: "20px",
    background:
      "linear-gradient(145deg, rgba(42,76,74,0.19), rgba(44,41,69,0.18))",
    border:
      "1px solid rgba(126,220,190,0.13)",
  },

  lessonEyebrow: {
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "0.14em",
    color:
      "rgba(137,222,196,0.78)",
  },

  lessonTitle: {
    marginTop: "5px",
    fontSize: "17px",
    fontWeight: 850,
  },

  lessonSummary: {
    marginTop: "8px",
    fontSize: "13px",
    lineHeight: 1.55,
    color:
      "rgba(255,255,255,0.76)",
  },

  lessonPoints: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
    marginTop: "13px",
  },

  lessonPoint: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    fontSize: "12px",
    lineHeight: 1.45,
    color:
      "rgba(255,255,255,0.7)",
  },

  lessonPointNumber: {
    width: "20px",
    height: "20px",
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
    borderRadius: "50%",
    background:
      "rgba(124,217,191,0.1)",
    border:
      "1px solid rgba(124,217,191,0.14)",
    fontSize: "9px",
    fontWeight: 800,
    color:
      "rgba(173,239,221,0.86)",
  },

  lessonTakeaway: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginTop: "14px",
    padding: "11px 12px",
    borderRadius: "13px",
    background:
      "rgba(255,255,255,0.035)",
    fontSize: "12px",
    lineHeight: 1.45,
  },

  lessonTakeawayLabel: {
    fontSize: "8px",
    fontWeight: 900,
    letterSpacing: "0.14em",
    color:
      "rgba(137,222,196,0.72)",
  },

  lessonFooter: {
    marginTop: "13px",
  },

  primaryActionButton: {
    appearance: "none",
    WebkitAppearance: "none",
    border: 0,
    padding: "9px 12px",
    borderRadius: "11px",
    background:
      "linear-gradient(145deg, #8258f5, #6745c6)",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow:
      "0 8px 20px rgba(88,54,180,0.22)",
  },

  secondaryActionButton: {
    appearance: "none",
    WebkitAppearance: "none",
    padding: "9px 12px",
    borderRadius: "11px",
    background:
      "rgba(255,255,255,0.045)",
    border:
      "1px solid rgba(255,255,255,0.075)",
    color:
      "rgba(255,255,255,0.76)",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
  },

  thinkingBubble: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "11px 13px",
    borderRadius:
      "8px 17px 17px 17px",
    background:
      "rgba(255,255,255,0.045)",
    border:
      "1px solid rgba(255,255,255,0.055)",
  },

  thinkingDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background:
      "rgba(183,151,255,0.76)",
    boxShadow:
      "0 0 7px rgba(154,111,255,0.34)",
  },

  thinkingText: {
    marginLeft: "5px",
    fontSize: "10px",
    color:
      "rgba(255,255,255,0.42)",
  },

  generatingCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginLeft: "50px",
    padding: "13px 14px",
    maxWidth: "420px",
    borderRadius: "16px",
    background:
      "rgba(113,77,196,0.08)",
    border:
      "1px solid rgba(148,111,232,0.1)",
  },

  generatingOrb: {
    width: "34px",
    height: "34px",
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
    borderRadius: "50%",
    background:
      "linear-gradient(145deg, rgba(136,91,244,0.38), rgba(62,101,176,0.3))",
    color:
      "rgba(255,255,255,0.86)",
  },

  generatingTitle: {
    fontSize: "12px",
    fontWeight: 800,
  },

  generatingText: {
    marginTop: "2px",
    fontSize: "10px",
    color:
      "rgba(255,255,255,0.44)",
  },

  composerSection: {
    position: "relative",
    zIndex: 2,
    padding: "12px 14px 16px",
    borderTop:
      "1px solid rgba(255,255,255,0.06)",
    background:
      "rgba(8,9,15,0.92)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter:
      "blur(18px)",
  },

  quickActionScroller: {
    display: "flex",
    gap: "7px",
    overflowX: "auto",
    paddingBottom: "9px",
    scrollbarWidth: "none",
  },

  quickActionButton: {
    appearance: "none",
    WebkitAppearance: "none",
    flex: "0 0 auto",
    padding: "7px 10px",
    borderRadius: "999px",
    background:
      "rgba(255,255,255,0.04)",
    border:
      "1px solid rgba(255,255,255,0.065)",
    color:
      "rgba(255,255,255,0.68)",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  composer: {
    borderRadius: "19px",
    background:
      "rgba(255,255,255,0.05)",
    border:
      "1px solid rgba(255,255,255,0.085)",
    overflow: "hidden",
    boxShadow:
      "0 12px 34px rgba(0,0,0,0.18)",
  },

  composerInput: {
    display: "block",
    width: "100%",
    minHeight: "48px",
    maxHeight: "140px",
    resize: "none",
    border: 0,
    outline: 0,
    padding: "14px 14px 6px",
    background: "transparent",
    color: "#ffffff",
    fontFamily: "inherit",
    fontSize: "14px",
    lineHeight: 1.45,
    boxSizing: "border-box",
  },

  composerToolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "10px",
    padding: "7px 8px 8px",
  },

  composerTools: {
    display: "flex",
    gap: "6px",
  },

  toolButton: {
    appearance: "none",
    WebkitAppearance: "none",
    width: "31px",
    height: "31px",
    display: "grid",
    placeItems: "center",
    borderRadius: "10px",
    background:
      "rgba(255,255,255,0.035)",
    border:
      "1px solid rgba(255,255,255,0.06)",
    color:
      "rgba(255,255,255,0.66)",
    fontSize: "16px",
    cursor: "pointer",
  },

  sendButton: {
    appearance: "none",
    WebkitAppearance: "none",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    border: 0,
    padding: "8px 10px 8px 12px",
    borderRadius: "11px",
    background:
      "linear-gradient(145deg, #865cf6, #6944c8)",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },

  sendButtonDisabled: {
    opacity: 0.32,
    cursor: "default",
  },

  sendArrow: {
    width: "20px",
    height: "20px",
    display: "grid",
    placeItems: "center",
    borderRadius: "7px",
    background:
      "rgba(255,255,255,0.12)",
    fontSize: "11px",
  },

  composerHint: {
    padding: "7px 4px 0",
    textAlign: "center",
    fontSize: "9px",
    lineHeight: 1.4,
    color:
      "rgba(255,255,255,0.28)",
  },
};
import React from "react";

const FONT_STACK =
  '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const CREATION_MODES = [
  {
    id: "surprise",
    icon: "✨",
    title: "Surprise Me",
    subtitle: "Create something amazing for me.",
    mentor:
      "Fantastic. Leave the creative direction with me. I'll make the decisions I need to, while keeping your original idea at the heart of what we create.",
  },
  {
    id: "guide",
    icon: "🤝",
    title: "Guide Me",
    subtitle: "I'll guide you one step at a time.",
    mentor:
      "Perfect. We'll take this one manageable step at a time. I'll keep track of the journey and explain things when you need them.",
  },
  {
    id: "together",
    icon: "🎨",
    title: "Let's Build Together",
    subtitle: "We'll create side by side.",
    mentor:
      "Excellent. We'll build this together. You bring your ideas and instincts, and I'll help shape, challenge and develop them with you.",
  },
  {
    id: "expert",
    icon: "🚀",
    title: "I'll Do It",
    subtitle: "Stay nearby if I need help.",
    mentor:
      "Absolutely. You're in control. I'll stay nearby, keep the context in mind and step in whenever you want another perspective.",
  },
];

const MODE_QUESTIONS = {
  "ai-movie":
    "Tell me the movie idea you have in your head—even if it's only one sentence.",
  "movie-scene":
    "What moment, character or situation do you imagine happening in this scene?",
  "music-video":
    "Tell me about the song and the first image, feeling or moment you imagine on screen.",
  advert:
    "What are you promoting, and what is the main thing you want people to remember?",
  "short-reel":
    "What idea, message or moment do you want this Short or Reel to capture?",
  "lyric-video":
    "Tell me about the song, its mood and any visual ideas you already have.",
  "animation-cartoon":
    "Tell me about the character, world or scene you want to bring to life.",
  documentary:
    "What real story, subject or question do you want to explore?",

  songwriting:
    "What do you have in your head right now—a feeling, title, story, phrase or even one line?",
  lyrics:
    "What do you want the lyrics to say or make someone feel?",
  "full-song":
    "What feeling, story or idea do you want at the heart of the song?",
  instrumental:
    "What mood, energy or atmosphere should the instrumental create?",
  "soundtrack-score":
    "What scene, emotion or journey does the music need to support?",
  "music-idea":
    "Tell me anything you already hear or feel, even if you can't describe it in musical terms.",

  artwork:
    "What would you like the artwork to make people see or feel?",
  poster:
    "What is the poster for, and what should people notice first?",
  "cover-art":
    "What is the release about, and what feeling should the cover capture?",
  "advert-image":
    "What are you promoting, and what should the image communicate immediately?",
  character:
    "Who or what would you like this character to be?",
  "social-image":
    "What do you want people to notice or feel when they see the image?",

  episode:
    "What would you like this episode to be about?",
  script:
    "What should this podcast script help you say?",
  interview:
    "Who are you interviewing, and what would you most like to discover from them?",
  series:
    "What is the main idea that could carry across the whole podcast series?",

  "short-story":
    "Tell me the story idea you have in your head, even if it's only one sentence.",
  screenplay:
    "What story would you like to turn into a screenplay?",
  "movie-story":
    "What is the movie idea you want to develop?",
  "episode-story":
    "What happens in this episode, or what would you like it to achieve?",
  "character-world":
    "What character, place or world do you already have in your imagination?",

  "advert-campaign":
    "What are you promoting, and what would you like the advert to achieve?",
  campaign:
    "What are you promoting, and what result would make this campaign successful?",
  "product-promotion":
    "What product, service or offer would you like people to notice?",
  "business-campaign":
    "Tell me about the business and what you would like this campaign to achieve.",

  "social-post":
    "What would you like to say, show or share?",
  caption:
    "What is the post about, and what tone should the caption have?",
  "reel-short":
    "What idea, moment or message should the Reel or Short capture?",
  "social-campaign":
    "What would you like the social campaign to achieve?",

  "free-create":
    "Tell me the idea you have in your head. We can work out what it becomes together.",
};

const DEFAULT_CREATOR_QUESTIONS = {
  video: "Choose what kind of video you'd like to make first.",
  image: "Choose what kind of image you'd like to create first.",
  music: "Choose what you'd like to create with music first.",
  podcast: "Choose what you'd like to create for your podcast first.",
  story: "Choose what kind of story you'd like to create first.",
  marketing: "Choose what kind of marketing project you'd like to create first.",
  social: "Choose what you'd like to create for social media first.",
  other: "Tell me what you'd like to create.",
};

function MovieJourneyStatus({
  projectJourney,
  projectJourneyOrientation,
}) {
  if (!projectJourney || !projectJourneyOrientation) {
    return null;
  }

  const present = projectJourneyOrientation.present || {};
  const next = projectJourneyOrientation.next || {};
  const progress = projectJourneyOrientation.progress || {};
  const clarificationRequired =
    present.clarificationRequired === true;
  const clarification = present.clarifications?.[0] || null;

  const clarificationText =
    clarification?.question ||
    (clarification?.expression
      ? `I’m sorry, I lost you at “${clarification.expression}”. Can you explain what you mean by that?`
      : "I’m sorry, I lost you there. Can you explain what you mean a little further?");

  return (
    <div
      style={{
        marginTop: 18,
        padding: 18,
        borderRadius: 16,
        background: clarificationRequired
          ? "rgba(255, 179, 0, 0.08)"
          : "rgba(96,77,255,0.06)",
        border: clarificationRequired
          ? "1px solid rgba(198, 130, 0, 0.24)"
          : "1px solid rgba(96,77,255,0.16)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: "#777d89",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 8,
        }}
      >
        Movie Journey
      </div>

      {clarificationRequired ? (
        <div
          style={{
            color: "#4a3a12",
            lineHeight: 1.6,
            fontWeight: 700,
          }}
        >
          {clarificationText}
        </div>
      ) : (
        <>
          <div
            style={{
              color: "#16181d",
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            {present.stage?.label || "Idea"}
          </div>

          <div
            style={{
              marginTop: 5,
              color: "#606775",
              lineHeight: 1.5,
              fontSize: 13,
            }}
          >
            {present.task?.label ||
              "We’ll keep the next useful step clear without rushing you."}
          </div>

          {(next.action?.label || next.nextStage?.label) && (
            <div
              style={{
                marginTop: 10,
                color: "#5140d8",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Next: {next.action?.label || next.nextStage?.label}
            </div>
          )}

          {Number.isFinite(progress.percentage) && (
            <div
              style={{
                marginTop: 10,
                color: "#7b8190",
                fontSize: 11,
              }}
            >
              {progress.completedStages || 0} of {progress.totalStages || 0} stages completed for now
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function MentorConversation({
  creator,
  creatorMode = "",
  creatorModeLabel = "",
  message,
  idea,
  projectStatus,
  creatorJourney,
  onJourneyChange,
  projectJourney = null,
  projectJourneyOrientation = null,
}) {
  if (!creator) return null;

  const activeMode =
    CREATION_MODES.find((mode) => mode.id === creatorJourney) ||
    CREATION_MODES[1];

  const hasCreatorMode = Boolean(creatorMode);

  const firstQuestion = hasCreatorMode
    ? MODE_QUESTIONS[creatorMode] ||
      "Tell me what you already have in mind, even if it's only a rough idea."
    : DEFAULT_CREATOR_QUESTIONS[creator.id] || "Tell me your idea.";

  const showMovieJourney =
    creatorMode === "ai-movie" &&
    Boolean(projectJourney) &&
    Boolean(projectJourneyOrientation);

  return (
    <section
      style={{
        marginTop: 18,
        padding: 22,
        borderRadius: 20,
        background: "#ffffff",
        border: "1px solid rgba(17,24,39,0.08)",
        fontFamily: FONT_STACK,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: "#7b8190",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: 8,
        }}
      >
        AI Mentor Conversation
      </div>

      <h2
        style={{
          margin: 0,
          fontSize: 28,
          color: "#16181d",
          lineHeight: 1.2,
        }}
      >
        {creator.icon} {creatorModeLabel || creator.label}
      </h2>

      <p
        style={{
          marginTop: 16,
          marginBottom: hasCreatorMode ? 22 : 0,
          color: "#5f6673",
          lineHeight: 1.7,
          fontSize: 16,
        }}
      >
        {message}
      </p>

      {hasCreatorMode && (
        <>
          <div style={{ marginBottom: 22 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#7b8190",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: 10,
              }}
            >
              How would you like me to work with you?
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {CREATION_MODES.map((mode) => {
                const active = creatorJourney === mode.id;

                return (
                  <button
                    key={mode.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      if (typeof onJourneyChange === "function") {
                        onJourneyChange(mode.id);
                      }
                    }}
                    style={{
                      textAlign: "left",
                      padding: 14,
                      borderRadius: 14,
                      cursor: "pointer",
                      background: active
                        ? "rgba(96,77,255,0.08)"
                        : "#ffffff",
                      border: active
                        ? "2px solid #604dff"
                        : "1px solid rgba(17,24,39,0.08)",
                      transition: "all 160ms ease",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                        color: "#16181d",
                      }}
                    >
                      {mode.icon} {mode.title}
                    </div>

                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 13,
                        color: "#6b7280",
                      }}
                    >
                      {mode.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            style={{
              padding: 18,
              borderRadius: 16,
              background: "#f7f8fc",
              border: "1px solid rgba(17,24,39,0.05)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#7b8190",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Your First Step
            </div>

            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#16181d",
                lineHeight: 1.4,
              }}
            >
              {firstQuestion}
            </div>
          </div>

          {showMovieJourney && (
            <MovieJourneyStatus
              projectJourney={projectJourney}
              projectJourneyOrientation={projectJourneyOrientation}
            />
          )}

          {idea.trim() && (
            <div
              style={{
                marginTop: 18,
                padding: 18,
                borderRadius: 16,
                background: "#fafafa",
                border: "1px solid rgba(17,24,39,0.05)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#7b8190",
                  marginBottom: 8,
                }}
              >
                YOUR ANSWER
              </div>

              <div
                style={{
                  color: "#16181d",
                  lineHeight: 1.6,
                }}
              >
                {idea}
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: 22,
              padding: 18,
              borderRadius: 16,
              background: "rgba(96,77,255,0.08)",
              border: "1px solid rgba(96,77,255,0.20)",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                marginBottom: 8,
                color: "#4d3dd9",
              }}
            >
              Mentor Insight
            </div>

            <div
              style={{
                color: "#4b5563",
                lineHeight: 1.7,
              }}
            >
              {activeMode.mentor}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

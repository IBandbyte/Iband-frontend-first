import { useMemo, useState } from "react";
import resolveMovieMentorJourneyRecommendation from "./mentor/MovieMentorJourneyRecommendationPresenter.js";

const FONT_STACK =
  '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const SUGGESTIONS = [
  "Create a Facebook advert",
  "Create a TikTok video",
  "Write a song",
  "Design an image",
  "Create a storyboard",
  "Help me with an idea",
];

const JOURNEY_MESSAGES = {
  surprise:
    "Sit back and let your imagination wander. I'll surprise you with fresh ideas and creative directions.",
  guide:
    "We'll build this together one step at a time. I'll explain each stage and help you develop your idea.",
  together:
    "Let's brainstorm as a team. You bring the ideas, and I'll help shape and refine them.",
  expert:
    "You're in control. I'll stay nearby with suggestions whenever you want another perspective.",
};

export default function AiMentor({
  message,
  creatorJourney,
  mentorContext = {},
}) {
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  const currentJourney =
    mentorContext.creatorJourney || creatorJourney || "guide";

  const journeyMessage =
    JOURNEY_MESSAGES[currentJourney] || JOURNEY_MESSAGES.guide;

  const journeyRecommendation = useMemo(
    () =>
      resolveMovieMentorJourneyRecommendation(
        mentorContext?.journeyPlanningEvidence || null
      ),
    [mentorContext?.journeyPlanningEvidence]
  );

  const showJourneyRecommendation =
    journeyRecommendation?.mode === "recommendation" ||
    journeyRecommendation?.mode === "clarification";

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        fontFamily: FONT_STACK,
        color: "#16181d",
      }}
    >
      <div
        style={{
          padding: 20,
          borderRadius: 20,
          background: "#ffffff",
          border: "1px solid rgba(17,24,39,0.08)",
          boxShadow: "0 8px 24px rgba(17,24,39,0.05)",
        }}
      >
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
          AI Mentor
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            lineHeight: 1.3,
            marginBottom: 12,
            color: "#16181d",
          }}
        >
          {message || "Welcome back."}
        </div>

        <div
          style={{
            fontSize: 16,
            lineHeight: 1.6,
            color: "#5f6673",
          }}
        >
          {journeyMessage}
        </div>
      </div>

      {showJourneyRecommendation && (
        <div
          data-movie-mentor-journey-recommendation={journeyRecommendation.mode}
          style={{
            padding: 18,
            borderRadius: 18,
            background: "#ffffff",
            border: "1px solid rgba(17,24,39,0.08)",
            boxShadow: "0 6px 20px rgba(17,24,39,0.04)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "#7b8190",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 8,
            }}
          >
            {journeyRecommendation.mode === "clarification"
              ? "Before we continue"
              : "Suggested next step"}
          </div>

          <div
            style={{
              fontSize: 17,
              fontWeight: 750,
              lineHeight: 1.5,
              color: "#20232a",
            }}
          >
            {journeyRecommendation.message}
          </div>

          {journeyRecommendation.explanation && (
            <div
              style={{
                marginTop: 8,
                fontSize: 15,
                lineHeight: 1.55,
                color: "#5f6673",
              }}
            >
              {journeyRecommendation.explanation}
            </div>
          )}

          {journeyRecommendation.mode === "recommendation" &&
            journeyRecommendation.alternatives.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: "#5f6673",
                }}
              >
                Other directions we can explore: {journeyRecommendation.alternatives.join(" • ")}
              </div>
            )}

          <div
            style={{
              marginTop: 10,
              fontSize: 13,
              fontWeight: 700,
              lineHeight: 1.45,
              color: "#4d3dd9",
            }}
          >
            Your choice decides what happens next.
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {SUGGESTIONS.map((item) => {
          const active = selectedSuggestion === item;

          return (
            <button
              key={item}
              type="button"
              aria-pressed={active}
              onClick={() => setSelectedSuggestion(item)}
              style={{
                width: "100%",
                appearance: "none",
                border: active
                  ? "2px solid #604dff"
                  : "1px solid rgba(17,24,39,0.08)",
                background: active
                  ? "rgba(96,77,255,0.08)"
                  : "#ffffff",
                color: "#16181d",
                borderRadius: 16,
                padding: "16px 18px",
                textAlign: "left",
                cursor: "pointer",
                boxShadow: active
                  ? "0 8px 22px rgba(96,77,255,0.10)"
                  : "0 5px 18px rgba(17,24,39,0.04)",
                transition:
                  "border-color 160ms ease, background 160ms ease, box-shadow 160ms ease",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  lineHeight: 1.4,
                }}
              >
                {item}
              </div>
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 2,
          padding: 18,
          borderRadius: 18,
          background: "rgba(96,77,255,0.08)",
          border: "1px solid rgba(96,77,255,0.20)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            marginBottom: 7,
            color: "#4d3dd9",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Captain&apos;s Reminder
        </div>

        <div
          style={{
            fontSize: 15,
            lineHeight: 1.6,
            color: "#4b5563",
          }}
        >
          You don&apos;t need permission to create.
          <br />
          You only need to begin.
        </div>
      </div>
    </div>
  );
}

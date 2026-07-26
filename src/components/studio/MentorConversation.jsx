import React, { useState } from "react";

const FONT_STACK =
  '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const CREATION_MODES = [
  {
    id: "surprise",
    icon: "✨",
    title: "Surprise Me",
    subtitle: "Create something amazing for me.",
    mentor:
      "Fantastic. Leave it with me and I'll surprise you with something completely original.",
  },
  {
    id: "guide",
    icon: "🤝",
    title: "Guide Me",
    subtitle: "I'll guide you one step at a time.",
    mentor:
      "Perfect. We'll build this together one question at a time. No pressure. I'll explain every step as we go.",
  },
  {
    id: "together",
    icon: "🎨",
    title: "Let's Build Together",
    subtitle: "We'll create side by side.",
    mentor:
      "Excellent. You bring the ideas, I'll bring suggestions, and together we'll create something amazing.",
  },
  {
    id: "expert",
    icon: "🚀",
    title: "I'll Do It",
    subtitle: "Stay nearby if I need help.",
    mentor:
      "Absolutely. You're in control. I'll stay quietly in the background until you need me.",
  },
];
export default function MentorConversation({
  creator,
  message,
  idea,
  projectStatus,
}) {
  if (!creator) return null;
const [selectedMode, setSelectedMode] = useState("guide");
const activeMode =
  CREATION_MODES.find((mode) => mode.id === selectedMode) ||
  CREATION_MODES[1];
  const questions = {
    video: "What's happening in the opening scene?",
    image: "What would you like people to see first?",
    music: "What feeling should your music create?",
    podcast: "Who are you speaking to?",
    story: "Who is your main character?",
    marketing: "What are you promoting?",
    social: "What do you want people to do after seeing your post?",
    other: "Tell me your idea.",
  };

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
        {creator.icon} {creator.label}
      </h2>

      <p
        style={{
          marginTop: 16,
          marginBottom: 22,
          color: "#5f6673",
          lineHeight: 1.7,
          fontSize: 16,
        }}
      >
        {message}
      </p>
<div
  style={{
    marginBottom: 22,
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
    Choose Your Creative Journey
  </div>

  <div
    style={{
      display: "grid",
      gap: 10,
    }}
  >
    {CREATION_MODES.map((mode) => {
      const active = selectedMode === mode.id;

      return (
        <button
          key={mode.id}
          type="button"
          onClick={() => setSelectedMode(mode.id)}
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
            transition: "all .2s ease",
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
          }}
        >
          QUESTION 1
        </div>

        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#16181d",
            lineHeight: 1.4,
          }}
        >
          {questions[creator.id]}
        </div>
      </div>

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
    </section>
  );
}
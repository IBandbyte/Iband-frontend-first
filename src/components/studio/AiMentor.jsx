import { useState } from "react";

const FONT_STACK =
  '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const SUGGESTIONS = [
  "Create a Facebook advert",
  "Create a TikTok video",
  "Write a song",
  "Design an image",
  "Create a storyboard",
  "Help me with an idea"
];

export default function AiMentor() {
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        fontFamily: FONT_STACK,
        color: "#ffffff"
      }}
    >
      <div
        style={{
          padding: 20,
          borderRadius: 20,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            opacity: 0.7,
            marginBottom: 10
          }}
        >
          AI Mentor
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            lineHeight: 1.3,
            marginBottom: 12
          }}
        >
          Welcome back.
        </div>

        <div
          style={{
            fontSize: 16,
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.85)"
          }}
        >
          You're already a creator because you create.
          <br />
          What would you like to build today?
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}
      >
        {SUGGESTIONS.map((item) => {
          const active = selectedSuggestion === item;

          return (
            <button
              key={item}
              type="button"
              onClick={() => setSelectedSuggestion(item)}
              style={{
                appearance: "none",
                border: active
                  ? "1px solid rgba(255,255,255,0.30)"
                  : "1px solid rgba(255,255,255,0.10)",
                background: active
                  ? "rgba(255,255,255,0.10)"
                  : "rgba(255,255,255,0.04)",
                color: "#ffffff",
                borderRadius: 16,
                padding: "16px 18px",
                textAlign: "left",
                cursor: "pointer",
                transition: "0.2s"
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700
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
          marginTop: 6,
          padding: 18,
          borderRadius: 18,
          background: "rgba(124,58,237,0.12)",
          border: "1px solid rgba(124,58,237,0.30)"
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 6,
            opacity: 0.8
          }}
        >
          Captain's Reminder
        </div>

        <div
          style={{
            fontSize: 15,
            lineHeight: 1.5
          }}
        >
          You don't need permission to create.
          <br />
          You only need to begin.
        </div>
      </div>
    </div>
  );
}
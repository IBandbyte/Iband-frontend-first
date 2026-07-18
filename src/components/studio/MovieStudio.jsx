import { useState } from "react";

const FONT_STACK =
  '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const CREATE_OPTIONS = [
  "Song",
  "Music Video",
  "Advert",
  "Social Media Post",
  "Image",
  "Story",
  "Cartoon",
  "Movie Scene",
  "Podcast",
  "Something Else"
];

export default function MovieStudio() {
  const [selectedOption, setSelectedOption] = useState(null);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#000",
        color: "#fff",
        fontFamily: FONT_STACK,
        display: "flex",
        flexDirection: "column",
        padding: "28px 20px 40px"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 32
        }}
      >
        <img
          src="/circularlogo2.PNG"
          alt="iBand"
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            objectFit: "cover"
          }}
        />

        <div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800
            }}
          >
            iBand Studio
          </div>

          <div
            style={{
              fontSize: 13,
              opacity: 0.75
            }}
          >
            Powered by your AI Mentor
          </div>
        </div>
      </div>

      <div
        style={{
          marginBottom: 34
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            marginBottom: 10
          }}
        >
          Welcome back.
        </div>

        <div
          style={{
            fontSize: 18,
            lineHeight: 1.45,
            color: "rgba(255,255,255,0.82)"
          }}
        >
          What would you like to create today?
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 12
        }}
      >
        {CREATE_OPTIONS.map((option) => {
          const active = selectedOption === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => setSelectedOption(option)}
              style={{
                appearance: "none",
                border: active
                  ? "1px solid rgba(255,255,255,0.35)"
                  : "1px solid rgba(255,255,255,0.10)",
                background: active
                  ? "rgba(255,255,255,0.10)"
                  : "rgba(255,255,255,0.04)",
                color: "#fff",
                borderRadius: 18,
                padding: "18px 18px",
                textAlign: "left",
                cursor: "pointer",
                transition: "0.2s"
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700
                }}
              >
                {option}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      <div
        style={{
          marginTop: 40,
          borderRadius: 20,
          padding: 18,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            opacity: 0.7,
            marginBottom: 6
          }}
        >
          AI Mentor
        </div>

        <div
          style={{
            fontSize: 17,
            lineHeight: 1.45
          }}
        >
          I've got your back.
        </div>
      </div>
    </div>
  );
}
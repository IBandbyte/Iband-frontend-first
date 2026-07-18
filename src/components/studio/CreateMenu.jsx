import { useState } from "react";

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

export default function CreateMenu({
  value = null,
  onChange = () => {}
}) {
  const [selected, setSelected] = useState(value);

  function handleSelect(option) {
    setSelected(option);
    onChange(option);
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 12
      }}
    >
      {CREATE_OPTIONS.map((option) => {
        const active = selected === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => handleSelect(option)}
            style={{
              appearance: "none",
              border: active
                ? "1px solid rgba(255,255,255,0.35)"
                : "1px solid rgba(255,255,255,0.10)",
              background: active
                ? "rgba(255,255,255,0.10)"
                : "rgba(255,255,255,0.04)",
              color: "#ffffff",
              borderRadius: 18,
              padding: "18px",
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
  );
}
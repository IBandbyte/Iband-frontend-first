import React from "react";

const CreatorControls = ({
  creatorType = "",
  values = {},
  onChange,
}) => {
  const update = (key, value) => {
    if (typeof onChange === "function") {
      onChange({
        ...values,
        [key]: value,
      });
    }
  };

  const renderControls = () => {
    switch (creatorType) {
      case "video":
        return (
          <>
            <ControlSelect
              label="Duration"
              value={values.duration || "30 Seconds"}
              options={[
                "15 Seconds",
                "30 Seconds",
                "60 Seconds",
                "2 Minutes",
              ]}
              onChange={(value) =>
                update("duration", value)
              }
            />

            <ControlSelect
              label="Format"
              value={values.format || "Vertical"}
              options={[
                "Vertical",
                "Landscape",
                "Square",
              ]}
              onChange={(value) =>
                update("format", value)
              }
            />

            <ControlSelect
              label="Style"
              value={values.style || "Cinematic"}
              options={[
                "Cinematic",
                "Realistic",
                "Pixar",
                "Anime",
                "Cartoon",
              ]}
              onChange={(value) =>
                update("style", value)
              }
            />
          </>
        );

      case "image":
        return (
          <>
            <ControlSelect
              label="Orientation"
              value={values.orientation || "Portrait"}
              options={[
                "Portrait",
                "Landscape",
                "Square",
              ]}
              onChange={(value) =>
                update("orientation", value)
              }
            />

            <ControlSelect
              label="Style"
              value={values.style || "Photorealistic"}
              options={[
                "Photorealistic",
                "Illustration",
                "Watercolour",
                "Pixar",
                "Sketch",
              ]}
              onChange={(value) =>
                update("style", value)
              }
            />
          </>
        );

      case "music":
        return (
          <>
            <ControlSelect
              label="Genre"
              value={values.genre || "Pop"}
              options={[
                "Pop",
                "Rock",
                "Country",
                "Dance",
                "Classical",
              ]}
              onChange={(value) =>
                update("genre", value)
              }
            />

            <ControlSelect
              label="Mood"
              value={values.mood || "Uplifting"}
              options={[
                "Happy",
                "Uplifting",
                "Emotional",
                "Epic",
                "Relaxed",
              ]}
              onChange={(value) =>
                update("mood", value)
              }
            />
          </>
        );

      default:
        return (
          <div style={styles.emptyState}>
            Creator-specific options will appear here.
          </div>
        );
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <p style={styles.eyebrow}>
          Creator Controls
        </p>

        <h3 style={styles.title}>
          Fine Tune Your Creation
        </h3>
      </div>

      <div style={styles.grid}>
        {renderControls()}
      </div>
    </div>
  );
};

const ControlSelect = ({
  label,
  value,
  options,
  onChange,
}) => (
  <label style={styles.field}>
    <span style={styles.label}>{label}</span>

    <select
      value={value}
      onChange={(e) =>
        onChange(e.target.value)
      }
      style={styles.select}
    >
      {options.map((option) => (
        <option
          key={option}
          value={option}
        >
          {option}
        </option>
      ))}
    </select>
  </label>
);

const styles = {
  container: {
    marginTop: "18px",
  },

  header: {
    marginBottom: "14px",
  },

  eyebrow: {
    margin: "0 0 4px",
    color: "#737a88",
    fontSize: "11px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: ".12em",
  },

  title: {
    margin: 0,
    color: "#17191f",
    fontSize: "18px",
    fontWeight: "800",
  },

  grid: {
    display: "grid",
    gap: "14px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  label: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#30343d",
  },

  select: {
    minHeight: "46px",
    padding: "0 14px",
    border: "1px solid rgba(20,24,32,.12)",
    borderRadius: "14px",
    background: "#ffffff",
    fontFamily: "inherit",
    fontSize: "14px",
    color: "#17191f",
    outline: "none",
  },

  emptyState: {
    padding: "18px",
    borderRadius: "14px",
    background: "#f7f8fb",
    color: "#737a88",
    textAlign: "center",
    fontSize: "13px",
  },
};

export default CreatorControls;
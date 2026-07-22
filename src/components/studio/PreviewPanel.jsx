import React from "react";

const STATUS_CONFIG = {
  generating: {
    label: "Creating",
    color: "#604dff",
    background: "rgba(96,77,255,0.10)",
  },
  generated: {
    label: "Ready",
    color: "#19834f",
    background: "rgba(25,131,79,0.10)",
  },
  saved: {
    label: "Saved",
    color: "#19834f",
    background: "rgba(25,131,79,0.10)",
  },
  published: {
    label: "Published",
    color: "#19834f",
    background: "rgba(25,131,79,0.10)",
  },
  editing: {
    label: "Editing",
    color: "#ef8d00",
    background: "rgba(239,141,0,0.12)",
  },
  idle: {
    label: "Ready",
    color: "#555",
    background: "#f1f2f5",
  },
};

const PreviewPanel = ({
  creator,
  generatedIdea,
  projectStatus = "idle",
  renderPreview,
  onSave,
  onEdit,
  onPublish,
}) => {
  const status =
    STATUS_CONFIG[projectStatus] || STATUS_CONFIG.idle;

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Preview</p>

          <h2 style={styles.title}>
            Your Creation
          </h2>
        </div>

        <span
          style={{
            ...styles.statusBadge,
            background: status.background,
            color: status.color,
          }}
        >
          {status.label}
        </span>
      </div>

      <div style={styles.previewArea}>
        {projectStatus === "generating" ? (
          <div style={styles.generating}>
            <div style={styles.orb}>
              ✦
            </div>

            <h3 style={styles.generatingTitle}>
              Your idea is taking shape
            </h3>

            <p style={styles.generatingText}>
              The AI Mentor is preparing your
              first version.
            </p>
          </div>
        ) : typeof renderPreview === "function" ? (
          renderPreview({
            creator,
            generatedIdea,
            projectStatus,
          })
        ) : (
          <div style={styles.defaultPreview}>
            <div style={styles.previewIcon}>
              {creator?.icon || "✨"}
            </div>

            <h3 style={styles.previewTitle}>
              {creator?.label || "Creative"} Project
            </h3>

            <p style={styles.previewText}>
              {generatedIdea ||
                "Your generated creation will appear here."}
            </p>
          </div>
        )}
      </div>

      {projectStatus !== "generating" && (
        <div style={styles.actions}>
          <button
            style={styles.secondaryButton}
            onClick={onSave}
          >
            Save
          </button>

          <button
            style={styles.secondaryButton}
            onClick={onEdit}
          >
            Edit
          </button>

          <button
            style={styles.primaryButton}
            onClick={onPublish}
          >
            Publish
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  panel: {
    padding: "18px",
    border: "1px solid rgba(20,24,32,0.08)",
    borderRadius: "24px",
    background: "#fff",
    boxShadow: "0 12px 34px rgba(17,24,39,.06)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },

  eyebrow: {
    margin: "0 0 4px",
    color: "#737a88",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: ".12em",
    textTransform: "uppercase",
  },

  title: {
    margin: 0,
    fontSize: "21px",
    color: "#17191f",
  },

  statusBadge: {
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "800",
  },

  previewArea: {
    marginTop: "18px",
    minHeight: "240px",
    display: "grid",
    placeItems: "center",
    padding: "20px",
    borderRadius: "20px",
    border: "1px dashed rgba(20,24,32,.15)",
    background:
      "linear-gradient(145deg,#f7f8fb,#f1f2f6)",
    boxSizing: "border-box",
  },

  generating: {
    textAlign: "center",
    maxWidth: "320px",
  },

  orb: {
    width: "60px",
    height: "60px",
    margin: "0 auto 14px",
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background:
      "linear-gradient(135deg,rgba(96,77,255,.18),rgba(215,77,255,.18))",
    color: "#604dff",
    fontSize: "28px",
  },

  generatingTitle: {
    margin: 0,
    fontSize: "18px",
    color: "#20232a",
  },

  generatingText: {
    marginTop: "8px",
    color: "#6c727d",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  defaultPreview: {
    maxWidth: "460px",
    textAlign: "center",
  },

  previewIcon: {
    display: "block",
    marginBottom: "10px",
    fontSize: "40px",
  },

  previewTitle: {
    margin: "0",
    color: "#20232a",
    fontSize: "20px",
    fontWeight: "800",
  },

  previewText: {
    margin: "12px 0 0",
    color: "#626976",
    fontSize: "14px",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
  },

  actions: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0,1fr))",
    gap: "10px",
    marginTop: "18px",
  },

  secondaryButton: {
    minHeight: "46px",
    padding: "11px",
    border: "1px solid rgba(20,24,32,.12)",
    borderRadius: "15px",
    background: "#fff",
    color: "#30343d",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
    transition: "all .15s ease",
  },

  primaryButton: {
    minHeight: "46px",
    padding: "11px",
    border: "none",
    borderRadius: "15px",
    background:
      "linear-gradient(135deg,#604dff 0%,#8c4dff 55%,#d74dff 100%)",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow:
      "0 10px 22px rgba(96,77,255,.22)",
    transition: "all .15s ease",
  },
};

export default PreviewPanel;
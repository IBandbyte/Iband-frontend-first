import React from "react";

const ActionBar = ({
  onSave,
  onEdit,
  onPublish,
  isSaving = false,
  isPublishing = false,
  saveDisabled = false,
  editDisabled = false,
  publishDisabled = false,
}) => {
  const busy = isSaving || isPublishing;

  return (
    <div style={styles.actionBar}>
      <button
        type="button"
        onClick={onSave}
        disabled={saveDisabled || busy}
        style={{
          ...styles.secondaryButton,
          ...(saveDisabled || busy ? styles.disabledButton : {}),
        }}
      >
        <span aria-hidden="true" style={styles.buttonIcon}>
          {isSaving ? "⏳" : "💾"}
        </span>

        <span>{isSaving ? "Saving..." : "Save"}</span>
      </button>

      <button
        type="button"
        onClick={onEdit}
        disabled={editDisabled || busy}
        style={{
          ...styles.secondaryButton,
          ...(editDisabled || busy ? styles.disabledButton : {}),
        }}
      >
        <span aria-hidden="true" style={styles.buttonIcon}>
          ✏️
        </span>

        <span>Edit</span>
      </button>

      <button
        type="button"
        onClick={onPublish}
        disabled={publishDisabled || busy}
        style={{
          ...styles.primaryButton,
          ...(publishDisabled || busy ? styles.disabledPrimaryButton : {}),
        }}
      >
        <span aria-hidden="true" style={styles.buttonIcon}>
          {isPublishing ? "⏳" : "🚀"}
        </span>

        <span>{isPublishing ? "Publishing..." : "Publish"}</span>
      </button>
    </div>
  );
};

const styles = {
  actionBar: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "9px",
    marginTop: "14px",
  },

  secondaryButton: {
    minWidth: "0",
    minHeight: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    padding: "11px 8px",
    border: "1px solid rgba(20, 24, 32, 0.12)",
    borderRadius: "15px",
    background: "#ffffff",
    color: "#30343d",
    fontFamily: "inherit",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
    boxSizing: "border-box",
    WebkitTapHighlightColor: "transparent",
    transition:
      "transform 150ms ease, border-color 150ms ease, opacity 150ms ease",
  },

  primaryButton: {
    minWidth: "0",
    minHeight: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    padding: "11px 8px",
    border: "none",
    borderRadius: "15px",
    background:
      "linear-gradient(135deg, #604dff 0%, #8c4dff 55%, #d74dff 100%)",
    boxShadow: "0 10px 22px rgba(96, 77, 255, 0.22)",
    color: "#ffffff",
    fontFamily: "inherit",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
    boxSizing: "border-box",
    WebkitTapHighlightColor: "transparent",
    transition:
      "transform 150ms ease, box-shadow 150ms ease, opacity 150ms ease",
  },

  buttonIcon: {
    flexShrink: "0",
    fontSize: "15px",
    lineHeight: "1",
  },

  disabledButton: {
    borderColor: "rgba(20, 24, 32, 0.07)",
    background: "#f1f2f5",
    color: "#999ea8",
    cursor: "not-allowed",
    opacity: "0.72",
  },

  disabledPrimaryButton: {
    background: "#d6d8de",
    boxShadow: "none",
    color: "#8d929c",
    cursor: "not-allowed",
    opacity: "0.82",
  },
};

export default ActionBar;
import React from "react";

const PublishDialog = ({
  open = false,
  creatorName = "your project",
  publishing = false,
  onCancel,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <div style={styles.icon}>🚀</div>

        <h2 style={styles.title}>
          Publish {creatorName}?
        </h2>

        <p style={styles.description}>
          Your creation is ready to be shared.
          You can always come back later and
          improve it further.
        </p>

        <div style={styles.actions}>
          <button
            type="button"
            onClick={onCancel}
            disabled={publishing}
            style={styles.cancelButton}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={publishing}
            style={{
              ...styles.publishButton,
              ...(publishing
                ? styles.publishButtonDisabled
                : {}),
            }}
          >
            {publishing
              ? "Publishing..."
              : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(17,24,39,.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    zIndex: 1000,
    boxSizing: "border-box",
  },

  dialog: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    borderRadius: "24px",
    padding: "28px",
    textAlign: "center",
    boxShadow:
      "0 30px 70px rgba(17,24,39,.28)",
    boxSizing: "border-box",
  },

  icon: {
    fontSize: "46px",
    marginBottom: "14px",
  },

  title: {
    margin: 0,
    color: "#17191f",
    fontSize: "24px",
    fontWeight: "900",
  },

  description: {
    margin: "14px 0 24px",
    color: "#656c78",
    fontSize: "15px",
    lineHeight: "1.6",
  },

  actions: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2,minmax(0,1fr))",
    gap: "12px",
  },

  cancelButton: {
    minHeight: "48px",
    border: "1px solid rgba(20,24,32,.12)",
    borderRadius: "15px",
    background: "#ffffff",
    color: "#30343d",
    fontFamily: "inherit",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
  },

  publishButton: {
    minHeight: "48px",
    border: "none",
    borderRadius: "15px",
    background:
      "linear-gradient(135deg,#604dff 0%,#8c4dff 55%,#d74dff 100%)",
    color: "#ffffff",
    fontFamily: "inherit",
    fontSize: "14px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow:
      "0 12px 24px rgba(96,77,255,.22)",
  },

  publishButtonDisabled: {
    background: "#d6d8de",
    boxShadow: "none",
    color: "#8d929c",
    cursor: "not-allowed",
  },
};

export default PublishDialog;
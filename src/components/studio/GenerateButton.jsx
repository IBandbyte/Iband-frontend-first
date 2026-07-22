import React from "react";

const GenerateButton = ({
  onClick,
  disabled = false,
  generating = false,
  label = "Generate",
  loadingLabel = "Creating your first version...",
  icon = "✨",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || generating}
      style={{
        ...styles.button,
        ...(disabled || generating ? styles.disabled : {}),
      }}
    >
      <span
        aria-hidden="true"
        style={{
          ...styles.icon,
          ...(generating ? styles.spinning : {}),
        }}
      >
        {generating ? "✦" : icon}
      </span>

      <span>
        {generating ? loadingLabel : label}
      </span>
    </button>
  );
};

const styles = {
  button: {
    width: "100%",
    minHeight: "54px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "14px 20px",
    border: "none",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg,#604dff 0%,#8c4dff 52%,#d74dff 100%)",
    color: "#ffffff",
    fontFamily: "inherit",
    fontSize: "15px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 14px 30px rgba(96,77,255,.26)",
    transition:
      "transform .15s ease, box-shadow .15s ease, opacity .15s ease",
    WebkitTapHighlightColor: "transparent",
  },

  disabled: {
    background: "#d6d8de",
    color: "#8d929c",
    boxShadow: "none",
    cursor: "not-allowed",
    opacity: ".82",
  },

  icon: {
    fontSize: "18px",
    lineHeight: "1",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },

  spinning: {
    animation: "ibandGenerateSpin 1.2s linear infinite",
  },
};

export default GenerateButton;
export default function ProjectCard({
  title,
  subtitle,
  updated,
  onClick = () => {}
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        appearance: "none",
        width: "100%",
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.04)",
        borderRadius: 18,
        padding: 18,
        textAlign: "left",
        cursor: "pointer",
        color: "#ffffff",
        transition: "0.2s"
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 8
        }}
      >
        {title}
      </div>

      {subtitle && (
        <div
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.78)",
            marginBottom: 8,
            lineHeight: 1.45
          }}
        >
          {subtitle}
        </div>
      )}

      {updated && (
        <div
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.55)"
          }}
        >
          Last updated {updated}
        </div>
      )}
    </button>
  );
}
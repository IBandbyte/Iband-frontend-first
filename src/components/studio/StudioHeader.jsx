const FONT_STACK =
  '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export default function StudioHeader({
  title = "iBand Studio",
  subtitle = "Powered by your AI Mentor"
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 28,
        fontFamily: FONT_STACK
      }}
    >
      <img
        src="/circularlogo2.PNG"
        alt="iBand"
        draggable="false"
        style={{
          width: 54,
          height: 54,
          borderRadius: "50%",
          objectFit: "cover",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow:
            "0 0 18px rgba(124,58,237,0.28), 0 8px 18px rgba(0,0,0,0.35)"
        }}
      />

      <div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.1
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: 4,
            fontSize: 14,
            color: "rgba(255,255,255,0.72)",
            fontWeight: 500
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}
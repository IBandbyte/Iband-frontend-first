const FONT_STACK =
  '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export default function StudioLayout({ children }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#000000",
        color: "#ffffff",
        fontFamily: FONT_STACK,
        display: "flex",
        justifyContent: "center"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          padding: "28px 20px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 24
        }}
      >
        {children}
      </div>
    </div>
  );
}
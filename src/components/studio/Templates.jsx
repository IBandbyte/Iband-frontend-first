const DEFAULT_TEMPLATES = [
  {
    id: 1,
    title: "Facebook Advert",
    description: "Create an eye-catching advert for social media."
  },
  {
    id: 2,
    title: "TikTok Video",
    description: "Plan a short, engaging vertical video."
  },
  {
    id: 3,
    title: "YouTube Video",
    description: "Build a complete long-form video plan."
  },
  {
    id: 4,
    title: "Product Promotion",
    description: "Promote a product or service."
  },
  {
    id: 5,
    title: "Storytelling",
    description: "Turn an idea into a compelling story."
  },
  {
    id: 6,
    title: "Start From Scratch",
    description: "Begin with a blank canvas."
  }
];

export default function Templates({
  templates = DEFAULT_TEMPLATES,
  onSelect = () => {}
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#ffffff"
        }}
      >
        Templates
      </div>

      {templates.map((template) => (
        <button
          key={template.id}
          type="button"
          onClick={() => onSelect(template)}
          style={{
            appearance: "none",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            color: "#ffffff",
            borderRadius: 18,
            padding: 18,
            textAlign: "left",
            cursor: "pointer"
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 6
            }}
          >
            {template.title}
          </div>

          <div
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.70)",
              lineHeight: 1.5
            }}
          >
            {template.description}
          </div>
        </button>
      ))}
    </div>
  );
}
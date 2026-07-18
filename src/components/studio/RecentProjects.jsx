const RECENT_PROJECTS = [
  {
    id: 1,
    title: "Atlantis Summer Advert",
    type: "Advert",
    updated: "2 hours ago"
  },
  {
    id: 2,
    title: "England Match Promo",
    type: "Video",
    updated: "Yesterday"
  },
  {
    id: 3,
    title: "New Song Idea",
    type: "Song",
    updated: "3 days ago"
  }
];

export default function RecentProjects({
  projects = RECENT_PROJECTS,
  onOpen = () => {}
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
        Recent Projects
      </div>

      {projects.map((project) => (
        <button
          key={project.id}
          type="button"
          onClick={() => onOpen(project)}
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
            {project.title}
          </div>

          <div
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.70)"
            }}
          >
            {project.type} • {project.updated}
          </div>
        </button>
      ))}
    </div>
  );
}
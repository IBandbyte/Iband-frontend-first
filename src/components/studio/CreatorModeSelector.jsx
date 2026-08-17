import React from "react";

const CREATOR_MODES = {
  video: [
    {
      id: "ai-movie",
      icon: "🎞️",
      label: "AI Movie Making",
      description: "Build a complete AI-assisted movie from idea to finished film.",
    },
    {
      id: "movie-scene",
      icon: "🎬",
      label: "Movie Scene",
      description: "Create and develop a single cinematic scene.",
    },
    {
      id: "music-video",
      icon: "🎵",
      label: "Music Video",
      description: "Turn a song or music idea into a visual production.",
    },
    {
      id: "advert",
      icon: "📺",
      label: "Video Advert",
      description: "Create a promotional or commercial video.",
    },
    {
      id: "short-reel",
      icon: "📱",
      label: "Short / Reel",
      description: "Create short-form video for social platforms.",
    },
    {
      id: "lyric-video",
      icon: "📝",
      label: "Lyric Video",
      description: "Create a visual video built around song lyrics.",
    },
    {
      id: "animation-cartoon",
      icon: "✨",
      label: "Animation / Cartoon",
      description: "Create animated characters, stories and scenes.",
    },
    {
      id: "documentary",
      icon: "🎥",
      label: "Documentary",
      description: "Develop factual and real-world visual stories.",
    },
  ],

  music: [
    {
      id: "songwriting",
      icon: "✍️",
      label: "Songwriting",
      description: "Develop a song from an idea, feeling, theme or story.",
    },
    {
      id: "lyrics",
      icon: "📝",
      label: "Lyrics",
      description: "Write, rewrite or refine song lyrics.",
    },
    {
      id: "full-song",
      icon: "🎶",
      label: "Full Song",
      description: "Develop lyrics, structure and creative direction together.",
    },
    {
      id: "instrumental",
      icon: "🎹",
      label: "Instrumental",
      description: "Develop an instrumental concept, mood or arrangement.",
    },
    {
      id: "soundtrack-score",
      icon: "🎼",
      label: "Soundtrack / Score",
      description: "Create music for movies, scenes and visual projects.",
    },
    {
      id: "music-idea",
      icon: "💡",
      label: "Music Idea",
      description: "Explore melodies, moods, themes and musical directions.",
    },
  ],

  image: [
    {
      id: "artwork",
      icon: "🎨",
      label: "Artwork",
      description: "Create original visual artwork.",
    },
    {
      id: "poster",
      icon: "🖼️",
      label: "Poster",
      description: "Create a poster for a project, event or campaign.",
    },
    {
      id: "cover-art",
      icon: "💿",
      label: "Cover Art",
      description: "Create artwork for music, podcasts or releases.",
    },
    {
      id: "advert-image",
      icon: "📢",
      label: "Advert Image",
      description: "Create a promotional image for a business or product.",
    },
    {
      id: "character",
      icon: "🧑‍🎨",
      label: "Character",
      description: "Design or develop a visual character.",
    },
    {
      id: "social-image",
      icon: "📱",
      label: "Social Image",
      description: "Create imagery for social media.",
    },
  ],

  podcast: [
    {
      id: "episode",
      icon: "🎙️",
      label: "Episode",
      description: "Plan or create a complete podcast episode.",
    },
    {
      id: "script",
      icon: "📄",
      label: "Script",
      description: "Write a podcast script or structured talking points.",
    },
    {
      id: "interview",
      icon: "🗣️",
      label: "Interview",
      description: "Plan questions, structure and flow for an interview.",
    },
    {
      id: "series",
      icon: "📚",
      label: "Series",
      description: "Develop a multi-episode podcast concept.",
    },
  ],

  story: [
    {
      id: "short-story",
      icon: "📖",
      label: "Short Story",
      description: "Create a complete short-form story.",
    },
    {
      id: "screenplay",
      icon: "🎬",
      label: "Screenplay",
      description: "Develop scenes, dialogue and screenplay structure.",
    },
    {
      id: "movie-story",
      icon: "🎞️",
      label: "Movie Story",
      description: "Develop the story foundation for a film.",
    },
    {
      id: "episode-story",
      icon: "📺",
      label: "Episode",
      description: "Create a story for an episodic series.",
    },
    {
      id: "character-world",
      icon: "🌍",
      label: "Characters & World",
      description: "Develop characters, settings and fictional worlds.",
    },
  ],

  marketing: [
    {
      id: "advert-campaign",
      icon: "📢",
      label: "Advert",
      description: "Create a focused promotional advert.",
    },
    {
      id: "campaign",
      icon: "📣",
      label: "Campaign",
      description: "Develop a wider marketing campaign.",
    },
    {
      id: "product-promotion",
      icon: "🛍️",
      label: "Product Promotion",
      description: "Promote a product, service or offer.",
    },
    {
      id: "business-campaign",
      icon: "🏪",
      label: "Business Campaign",
      description: "Create promotional content for a business or brand.",
    },
  ],

  social: [
    {
      id: "social-post",
      icon: "📝",
      label: "Social Post",
      description: "Create a platform-ready social post.",
    },
    {
      id: "caption",
      icon: "💬",
      label: "Caption",
      description: "Write or refine a social media caption.",
    },
    {
      id: "reel-short",
      icon: "📱",
      label: "Reel / Short",
      description: "Create short-form social video content.",
    },
    {
      id: "social-campaign",
      icon: "📣",
      label: "Social Campaign",
      description: "Plan a connected series of social posts.",
    },
  ],

  other: [
    {
      id: "free-create",
      icon: "✨",
      label: "Something Else",
      description: "Start with your idea and let the Mentor help shape it.",
    },
  ],
};

export default function CreatorModeSelector({
  creatorType,
  selectedMode = "",
  onSelect,
}) {
  const modes = CREATOR_MODES[creatorType] || [];

  if (!creatorType || modes.length === 0) {
    return null;
  }

  return (
    <section style={styles.panel}>
      <p style={styles.eyebrow}>Creator Mode</p>
      <h2 style={styles.title}>What would you like to make?</h2>

      <div style={styles.grid}>
        {modes.map((mode) => {
          const active = selectedMode === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                if (typeof onSelect === "function") {
                  onSelect(mode);
                }
              }}
              style={{
                ...styles.card,
                ...(active ? styles.cardActive : {}),
              }}
            >
              <span style={styles.icon}>{mode.icon}</span>

              <span style={styles.copy}>
                <span style={styles.label}>{mode.label}</span>
                <span style={styles.description}>{mode.description}</span>
              </span>

              <span
                aria-hidden="true"
                style={{
                  ...styles.arrow,
                  ...(active ? styles.arrowActive : {}),
                }}
              >
                ›
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

const styles = {
  panel: {
    marginTop: "18px",
  },

  eyebrow: {
    margin: "0 0 4px",
    color: "#737a88",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },

  title: {
    margin: "0 0 12px",
    color: "#16181d",
    fontSize: "21px",
    lineHeight: "1.2",
    letterSpacing: "-0.025em",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))",
    gap: "10px",
  },

  card: {
    width: "100%",
    minHeight: "84px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px",
    border: "1px solid rgba(20,24,32,0.09)",
    borderRadius: "18px",
    background: "#ffffff",
    boxShadow: "0 8px 24px rgba(17,24,39,0.05)",
    color: "#17191f",
    textAlign: "left",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    transition:
      "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
  },

  cardActive: {
    border: "1px solid rgba(96,77,255,0.52)",
    background:
      "linear-gradient(145deg, rgba(96,77,255,0.10), rgba(255,255,255,1))",
    boxShadow: "0 12px 30px rgba(96,77,255,0.13)",
    transform: "translateY(-1px)",
  },

  icon: {
    width: "42px",
    height: "42px",
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    borderRadius: "14px",
    background: "#f3f4f7",
    fontSize: "21px",
  },

  copy: {
    minWidth: 0,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },

  label: {
    fontSize: "14px",
    fontWeight: "800",
  },

  description: {
    color: "#69707c",
    fontSize: "12px",
    lineHeight: "1.4",
  },

  arrow: {
    color: "#b0b4bc",
    fontSize: "25px",
    lineHeight: "1",
  },

  arrowActive: {
    color: "#604dff",
  },
};

export { CREATOR_MODES };
import React, { useMemo, useState } from "react";
import AiMentor from "./AiMentor";
import MentorConversation from "./MentorConversation";
import CreatorModeSelector, { CREATOR_MODES } from "./CreatorModeSelector";
import PromptBuilder from "./PromptBuilder";
import GenerateButton from "./GenerateButton";
import PreviewPanel from "./PreviewPanel";

const CREATOR_OPTIONS = [
  {
    id: "video",
    icon: "🎬",
    label: "Video",
    description: "Create movies, videos, reels, scenes and visual stories.",
  },
  {
    id: "image",
    icon: "🖼️",
    label: "Image",
    description: "Create artwork, posters, covers and promotional images.",
  },
  {
    id: "music",
    icon: "🎵",
    label: "Music",
    description: "Write songs, lyrics, music ideas and creative direction.",
  },
  {
    id: "podcast",
    icon: "🎙️",
    label: "Podcast",
    description: "Plan episodes, scripts, interviews and audio content.",
  },
  {
    id: "story",
    icon: "📖",
    label: "Story",
    description: "Build characters, scenes, episodes and complete stories.",
  },
  {
    id: "marketing",
    icon: "📢",
    label: "Marketing",
    description: "Create adverts, campaigns and promotional material.",
  },
  {
    id: "social",
    icon: "📱",
    label: "Social",
    description: "Create posts, captions, reels and platform campaigns.",
  },
  {
    id: "other",
    icon: "✨",
    label: "Something Else",
    description: "Start with an idea and let the Mentor help shape it.",
  },
];

const CreatorWorkspace = ({
  creatorName = "Creator",
  initialCreator = "",
  onGenerate,
  onSave,
  onEdit,
  onPublish,
  renderCreatorControls,
  renderPreview,
}) => {
  const [selectedCreator, setSelectedCreator] = useState(initialCreator);
  const [selectedCreatorMode, setSelectedCreatorMode] = useState("");
  const [idea, setIdea] = useState("");
  const [generatedIdea, setGeneratedIdea] = useState("");
  const [projectStatus, setProjectStatus] = useState("idle");
  const [creatorJourney, setCreatorJourney] = useState("guide");
  const [mentorMessage, setMentorMessage] = useState(
    "I've got your back. Choose what you would like to create, then tell me about your idea."
  );

  const activeCreator = useMemo(
    () =>
      CREATOR_OPTIONS.find((creator) => creator.id === selectedCreator) || null,
    [selectedCreator]
  );

  const activeCreatorMode = useMemo(() => {
    const modes = CREATOR_MODES[selectedCreator] || [];

    return (
      modes.find((mode) => mode.id === selectedCreatorMode) || null
    );
  }, [selectedCreator, selectedCreatorMode]);

  const mentorContext = useMemo(
    () => ({
      creatorName,
      creatorType: selectedCreator || null,
      creatorLabel: activeCreator?.label || null,
      creatorMode: selectedCreatorMode || null,
      creatorModeLabel: activeCreatorMode?.label || null,
      creatorJourney,
      idea,
      projectStatus,
      hasGeneratedIdea: Boolean(generatedIdea),
    }),
    [
      creatorName,
      selectedCreator,
      activeCreator,
      selectedCreatorMode,
      activeCreatorMode,
      creatorJourney,
      idea,
      projectStatus,
      generatedIdea,
    ]
  );

  const canGenerate =
    Boolean(selectedCreator) &&
    Boolean(selectedCreatorMode) &&
    Boolean(idea.trim()) &&
    projectStatus !== "generating";

  const createProjectPayload = () => ({
    creatorType: selectedCreator,
    creatorLabel: activeCreator?.label || selectedCreator,
    creatorMode: selectedCreatorMode,
    creatorModeLabel: activeCreatorMode?.label || selectedCreatorMode,
    creatorJourney,
    idea: idea.trim(),
    generatedIdea,
  });

  const handleCreatorSelect = (creator) => {
    setSelectedCreator(creator.id);
    setSelectedCreatorMode("");
    setIdea("");
    setGeneratedIdea("");
    setProjectStatus("idle");

    switch (creator.id) {
      case "video":
        setMentorMessage(
          "Great. What kind of video would you like to create? Choose a starting point and we'll take it from there."
        );
        break;

      case "image":
        setMentorMessage(
          "Great. What kind of image would you like to create? Choose a starting point and we'll shape it together."
        );
        break;

      case "music":
        setMentorMessage(
          "Great. What would you like to create with music? Choose a starting point and we'll build it together."
        );
        break;

      case "podcast":
        setMentorMessage(
          "Great. What would you like to create for your podcast? Choose a starting point and we'll take it one step at a time."
        );
        break;

      case "story":
        setMentorMessage(
          "Great. What kind of story would you like to create? Choose a starting point and we'll develop it together."
        );
        break;

      case "marketing":
        setMentorMessage(
          "Great. What would you like to promote? Choose the type of project and we'll build the campaign from there."
        );
        break;

      case "social":
        setMentorMessage(
          "Great. What would you like to create for social media? Choose a starting point and we'll shape it together."
        );
        break;

      default:
        setMentorMessage(
          "Tell me what you'd like to create. We can shape the idea together."
        );
    }
  };

  const handleCreatorModeSelect = (mode) => {
    setSelectedCreatorMode(mode.id);
    setIdea("");
    setGeneratedIdea("");
    setProjectStatus("idle");

    switch (mode.id) {
      case "ai-movie":
        setMentorMessage(
          "Perfect. Let's make a movie. You don't need to know how to make one yet—that's why I'm here. We'll take it one step at a time. For now, tell me the idea you have in your head, even if it's only one sentence."
        );
        break;

      case "songwriting":
        setMentorMessage(
          "Perfect. Let's write a song. You don't need to have everything worked out. Tell me the feeling, idea, story or even a single line you have in your head."
        );
        break;

      case "lyrics":
        setMentorMessage(
          "Let's work on your lyrics. Give me what you already have, even if it's only a line, a phrase or an idea."
        );
        break;

      case "movie-scene":
        setMentorMessage(
          "Let's build a cinematic scene. Tell me what you can already see happening, even if it's only a rough idea."
        );
        break;

      case "music-video":
        setMentorMessage(
          "Let's turn the music into something visual. Tell me about the song and the first image or feeling you imagine."
        );
        break;

      default:
        setMentorMessage(
          `Great choice. Let's create your ${mode.label.toLowerCase()}. Tell me what you already have in mind, even if it's only a rough idea.`
        );
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate) {
      setMentorMessage(
        "Choose what you would like to create, choose your creator mode, and tell me a little about your idea. We can shape the rest together."
      );
      return;
    }

    const request = {
      creatorType: selectedCreator,
      creatorLabel: activeCreator?.label || selectedCreator,
      creatorMode: selectedCreatorMode,
      creatorModeLabel: activeCreatorMode?.label || selectedCreatorMode,
      creatorJourney,
      idea: idea.trim(),
    };

    setProjectStatus("generating");
    setMentorMessage(
      "Great—your idea is taking shape. I’m preparing the first version now."
    );

    try {
      let result = null;

      if (typeof onGenerate === "function") {
        result = await onGenerate(request);
      }

      setGeneratedIdea(
        result?.prompt ||
          result?.content ||
          result?.preview ||
          idea.trim()
      );

      setProjectStatus("generated");
      setMentorMessage(
        "Your first version is ready. Take a look at the preview. Nothing is final—you can edit and develop it as much as you like."
      );
    } catch (error) {
      console.error("CreatorWorkspace generate error:", error);

      setProjectStatus("idle");
      setMentorMessage(
        "Nothing has been lost. I couldn’t complete that generation just now, but your idea is still here and ready to try again."
      );
    }
  };

  const handleSave = async () => {
    const project = createProjectPayload();

    try {
      if (typeof onSave === "function") {
        await onSave(project);
      }

      setProjectStatus("saved");
      setMentorMessage(
        "Your project has been saved safely. You can return and continue whenever you are ready."
      );
    } catch (error) {
      console.error("CreatorWorkspace save error:", error);

      setMentorMessage(
        "Your work is still here. The save did not complete, so please try once more when you’re ready."
      );
    }
  };

  const handleEdit = () => {
    setProjectStatus("editing");
    setMentorMessage(
      "Let’s keep developing it. Make any changes you need, then generate another version when you’re ready."
    );

    if (typeof onEdit === "function") {
      onEdit(createProjectPayload());
    }
  };

  const handlePublish = async () => {
    const project = createProjectPayload();

    try {
      if (typeof onPublish === "function") {
        await onPublish(project);
      }

      setProjectStatus("published");
      setMentorMessage(
        "Your creation is ready for its audience. You brought the idea to life."
      );
    } catch (error) {
      console.error("CreatorWorkspace publish error:", error);

      setMentorMessage(
        "Your creation is safe. Publishing did not complete, so nothing has been lost."
      );
    }
  };

  return (
    <main style={styles.workspace}>
      <section style={styles.welcomeSection}>
        <p style={styles.eyebrow}>iBand Studio</p>

        <h1 style={styles.title}>Welcome back, {creatorName}.</h1>

        <p style={styles.subtitle}>
          What would you like to create today?
        </p>
      </section>

      <section style={styles.section}>
        <AiMentor
          message={mentorMessage}
          creatorJourney={creatorJourney}
          mentorContext={mentorContext}
        />
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeadingRow}>
          <div>
            <p style={styles.sectionEyebrow}>Quick Create</p>
            <h2 style={styles.sectionTitle}>Choose your starting point</h2>
          </div>

          {activeCreator && (
            <span style={styles.activeCreatorBadge}>
              {activeCreator.icon} {activeCreator.label}
            </span>
          )}
        </div>

        <div style={styles.creatorGrid}>
          {CREATOR_OPTIONS.map((creator) => {
            const isSelected = selectedCreator === creator.id;

            return (
              <button
                key={creator.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleCreatorSelect(creator)}
                style={{
                  ...styles.creatorCard,
                  ...(isSelected ? styles.creatorCardActive : {}),
                }}
              >
                <span style={styles.creatorIcon}>{creator.icon}</span>

                <span style={styles.creatorCopy}>
                  <span style={styles.creatorLabel}>{creator.label}</span>

                  <span style={styles.creatorDescription}>
                    {creator.description}
                  </span>
                </span>

                <span
                  aria-hidden="true"
                  style={{
                    ...styles.creatorArrow,
                    ...(isSelected ? styles.creatorArrowActive : {}),
                  }}
                >
                  ›
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {activeCreator && (
        <CreatorModeSelector
          creatorType={selectedCreator}
          selectedMode={selectedCreatorMode}
          onSelect={handleCreatorModeSelect}
        />
      )}

      {activeCreator && activeCreatorMode && (
        <section style={styles.section}>
          <MentorConversation
            creator={activeCreator}
            message={mentorMessage}
            idea={idea}
            projectStatus={projectStatus}
            creatorJourney={creatorJourney}
            onJourneyChange={setCreatorJourney}
          />
        </section>
      )}

      {activeCreator && activeCreatorMode && (
        <section style={styles.section}>
          <PromptBuilder
            creatorType={selectedCreator}
            creatorLabel={activeCreator.label}
            creatorMode={selectedCreatorMode}
            creatorModeLabel={activeCreatorMode.label}
            creatorJourney={creatorJourney}
            value={idea}
            projectStatus={projectStatus}
            onChange={(value) => {
              setIdea(value);

              if (
                projectStatus !== "idle" &&
                projectStatus !== "generating"
              ) {
                setProjectStatus("editing");
              }
            }}
            renderCreatorControls={() =>
              typeof renderCreatorControls === "function"
                ? renderCreatorControls({
                    selectedCreator,
                    activeCreator,
                    selectedCreatorMode,
                    activeCreatorMode,
                    creatorJourney,
                    idea,
                    setIdea,
                    projectStatus,
                  })
                : null
            }
          />

          <GenerateButton
            creatorJourney={creatorJourney}
            onClick={handleGenerate}
            generating={projectStatus === "generating"}
            disabled={!canGenerate}
          />
        </section>
      )}

      {(generatedIdea || projectStatus === "generating") && (
        <PreviewPanel
          creator={activeCreator}
          generatedIdea={generatedIdea}
          creatorJourney={creatorJourney}
          projectStatus={projectStatus}
          renderPreview={renderPreview}
          onSave={handleSave}
          onEdit={handleEdit}
          onPublish={handlePublish}
        />
      )}
    </main>
  );
};

const styles = {
  workspace: {
    width: "100%",
    maxWidth: "760px",
    margin: "0 auto",
    padding: "22px 16px 120px",
    boxSizing: "border-box",
  },

  welcomeSection: {
    marginBottom: "22px",
  },

  eyebrow: {
    margin: "0 0 6px",
    color: "#777d89",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },

  title: {
    margin: "0",
    color: "#111319",
    fontSize: "clamp(28px, 8vw, 42px)",
    lineHeight: "1.08",
    letterSpacing: "-0.04em",
  },

  subtitle: {
    margin: "10px 0 0",
    color: "#616875",
    fontSize: "17px",
    lineHeight: "1.5",
  },

  section: {
    marginTop: "18px",
  },

  sectionHeadingRow: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "12px",
  },

  sectionEyebrow: {
    margin: "0 0 4px",
    color: "#737a88",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },

  sectionTitle: {
    margin: "0",
    color: "#16181d",
    fontSize: "21px",
    lineHeight: "1.2",
    letterSpacing: "-0.025em",
  },

  activeCreatorBadge: {
    flexShrink: "0",
    padding: "7px 10px",
    border: "1px solid rgba(96,77,255,0.2)",
    borderRadius: "999px",
    background: "rgba(96,77,255,0.08)",
    color: "#5140d8",
    fontSize: "12px",
    fontWeight: "800",
  },

  creatorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))",
    gap: "10px",
  },

  creatorCard: {
    width: "100%",
    minHeight: "92px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "15px",
    border: "1px solid rgba(20,24,32,0.09)",
    borderRadius: "20px",
    background: "#ffffff",
    boxShadow: "0 8px 24px rgba(17,24,39,0.05)",
    color: "#17191f",
    textAlign: "left",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    transition:
      "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
  },

  creatorCardActive: {
    border: "1px solid rgba(96,77,255,0.52)",
    background:
      "linear-gradient(145deg, rgba(96,77,255,0.1), rgba(255,255,255,1))",
    boxShadow: "0 12px 30px rgba(96,77,255,0.13)",
    transform: "translateY(-1px)",
  },

  creatorIcon: {
    width: "46px",
    height: "46px",
    flexShrink: "0",
    display: "grid",
    placeItems: "center",
    borderRadius: "15px",
    background: "#f3f4f7",
    fontSize: "23px",
  },

  creatorCopy: {
    minWidth: "0",
    display: "flex",
    flex: "1",
    flexDirection: "column",
    gap: "4px",
  },

  creatorLabel: {
    fontSize: "15px",
    fontWeight: "800",
  },

  creatorDescription: {
    color: "#69707c",
    fontSize: "12px",
    lineHeight: "1.4",
  },

  creatorArrow: {
    color: "#b0b4bc",
    fontSize: "27px",
    lineHeight: "1",
  },

  creatorArrowActive: {
    color: "#604dff",
  },
};

export default CreatorWorkspace;
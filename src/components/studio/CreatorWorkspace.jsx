import React, { useMemo, useState } from "react";
import AiMentor from "./AiMentor";
import PromptBuilder from "./PromptBuilder";
import GenerateButton from "./GenerateButton";
import PreviewPanel from "./PreviewPanel";

const CREATOR_OPTIONS = [
  {
    id: "video",
    icon: "🎬",
    label: "Video",
    description: "Create videos, reels, scenes and visual stories.",
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
    description: "Develop songs, music ideas, lyrics and creative direction.",
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
  const [idea, setIdea] = useState("");
  const [generatedIdea, setGeneratedIdea] = useState("");
  const [projectStatus, setProjectStatus] = useState("idle");
  const [mentorMessage, setMentorMessage] = useState(
    "I've got your back. Choose what you would like to create, then tell me about your idea."
  );

  const activeCreator = useMemo(
    () =>
      CREATOR_OPTIONS.find((creator) => creator.id === selectedCreator) || null,
    [selectedCreator]
  );

  const canGenerate =
    Boolean(selectedCreator) && Boolean(idea.trim()) && projectStatus !== "generating";

  const handleCreatorSelect = (creator) => {
    setSelectedCreator(creator.id);
    setGeneratedIdea("");
    setProjectStatus("idle");

    setMentorMessage(
      `Excellent choice. Tell me about the ${creator.label.toLowerCase()} you have in mind. You do not need to write a perfect prompt—just describe your idea naturally.`
    );
  };

  const handleGenerate = async () => {
    if (!canGenerate) {
      setMentorMessage(
        "Choose what you would like to create and tell me a little about your idea. We can shape the rest together."
      );
      return;
    }

    const request = {
      creatorType: selectedCreator,
      creatorLabel: activeCreator?.label || selectedCreator,
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
    const project = {
      creatorType: selectedCreator,
      idea: idea.trim(),
      generatedIdea,
    };

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
      onEdit({
        creatorType: selectedCreator,
        idea: idea.trim(),
        generatedIdea,
      });
    }
  };

  const handlePublish = async () => {
    const project = {
      creatorType: selectedCreator,
      idea: idea.trim(),
      generatedIdea,
    };

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
          selectedCreator={selectedCreator}
          projectStatus={projectStatus}
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
  <section style={styles.section}>
    <PromptBuilder
      creatorType={selectedCreator}
      creatorLabel={activeCreator.label}
      value={idea}
      projectStatus={projectStatus}
      onChange={(value) => {
        setIdea(value);

        if (projectStatus !== "idle") {
          setProjectStatus("editing");
        }
      }}
      renderCreatorControls={() =>
        typeof renderCreatorControls === "function"
          ? renderCreatorControls({
              selectedCreator,
              idea,
              setIdea,
              projectStatus,
            })
          : null
      }
    />

    <GenerateButton
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
    border: "1px solid rgba(96, 77, 255, 0.2)",
    borderRadius: "999px",
    background: "rgba(96, 77, 255, 0.08)",
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
    border: "1px solid rgba(20, 24, 32, 0.09)",
    borderRadius: "20px",
    background: "#ffffff",
    boxShadow: "0 8px 24px rgba(17, 24, 39, 0.05)",
    color: "#17191f",
    textAlign: "left",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    transition:
      "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
  },

  creatorCardActive: {
    border: "1px solid rgba(96, 77, 255, 0.52)",
    background:
      "linear-gradient(145deg, rgba(96, 77, 255, 0.1), rgba(255, 255, 255, 1))",
    boxShadow: "0 12px 30px rgba(96, 77, 255, 0.13)",
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

  panel: {
    padding: "18px",
    border: "1px solid rgba(20, 24, 32, 0.08)",
    borderRadius: "24px",
    background: "#ffffff",
    boxShadow: "0 12px 34px rgba(17, 24, 39, 0.06)",
  },

  panelHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
  },

  stepBadge: {
    flexShrink: "0",
    padding: "7px 10px",
    borderRadius: "999px",
    background: "#f1f2f5",
    color: "#626976",
    fontSize: "11px",
    fontWeight: "800",
  },

  supportingText: {
    margin: "11px 0 16px",
    color: "#69707c",
    fontSize: "14px",
    lineHeight: "1.5",
  },

  

  

  statusBadge: {
    flexShrink: "0",
    padding: "7px 10px",
    borderRadius: "999px",
    background: "rgba(38, 175, 111, 0.11)",
    color: "#19834f",
    fontSize: "11px",
    fontWeight: "800",
  },

  previewArea: {
    minHeight: "230px",
    display: "grid",
    placeItems: "center",
    marginTop: "16px",
    padding: "20px",
    border: "1px dashed rgba(20, 24, 32, 0.15)",
    borderRadius: "20px",
    background:
      "linear-gradient(145deg, rgba(247, 248, 251, 1), rgba(240, 241, 246, 1))",
    boxSizing: "border-box",
  },

  generatingState: {
    maxWidth: "330px",
    textAlign: "center",
  },

  generatingOrb: {
    width: "58px",
    height: "58px",
    display: "grid",
    placeItems: "center",
    margin: "0 auto 13px",
    borderRadius: "50%",
    background:
      "linear-gradient(135deg, rgba(96, 77, 255, 0.18), rgba(215, 77, 255, 0.18))",
    color: "#604dff",
    fontSize: "27px",
  },

  generatingTitle: {
    margin: "0",
    color: "#20232a",
    fontSize: "17px",
    fontWeight: "900",
  },

  generatingText: {
    margin: "7px 0 0",
    color: "#717783",
    fontSize: "13px",
  },

  defaultPreview: {
    maxWidth: "460px",
    textAlign: "center",
  },

  previewIcon: {
    display: "block",
    marginBottom: "10px",
    fontSize: "38px",
  },

  previewTitle: {
    margin: "0",
    color: "#20232a",
    fontSize: "19px",
  },

  previewText: {
    margin: "10px 0 0",
    color: "#626976",
    fontSize: "14px",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
  },

  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "9px",
    marginTop: "14px",
  },

  secondaryAction: {
    minHeight: "46px",
    padding: "11px",
    border: "1px solid rgba(20, 24, 32, 0.12)",
    borderRadius: "15px",
    background: "#ffffff",
    color: "#30343d",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
  },

  primaryAction: {
    minHeight: "46px",
    padding: "11px",
    border: "none",
    borderRadius: "15px",
    background: "#17191f",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
  },
};

export default CreatorWorkspace;
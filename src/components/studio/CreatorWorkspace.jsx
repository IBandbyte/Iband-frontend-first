import React, { useMemo, useState } from "react";
import AiMentor from "./AiMentor";
import MentorConversation from "./MentorConversation";
import PromptBuilder from "./PromptBuilder";
import GenerateButton from "./GenerateButton";
import PreviewPanel from "./PreviewPanel";
import CreatorModeSelector from "./CreatorModeSelector";

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
  const [selectedCreatorModeLabel, setSelectedCreatorModeLabel] = useState("");
  const [idea, setIdea] = useState("");
  const [generatedIdea, setGeneratedIdea] = useState("");
  const [projectStatus, setProjectStatus] = useState("idle");
  const [creatorJourney, setCreatorJourney] = useState("guide");

  const [showCreatorChoices, setShowCreatorChoices] = useState(
    !Boolean(initialCreator)
  );
  const [showCreatorModeChoices, setShowCreatorModeChoices] = useState(
    Boolean(initialCreator)
  );

  const [mentorMessage, setMentorMessage] = useState(
    "I've got your back. Choose what you would like to create, then tell me about your idea."
  );

  const activeCreator = useMemo(
    () =>
      CREATOR_OPTIONS.find((creator) => creator.id === selectedCreator) || null,
    [selectedCreator]
  );

  const journeyReady =
    Boolean(activeCreator) &&
    Boolean(selectedCreatorMode) &&
    !showCreatorChoices &&
    !showCreatorModeChoices;

  const mentorContext = useMemo(
    () => ({
      creatorName,
      creatorType: selectedCreator || null,
      creatorLabel: activeCreator?.label || null,
      creatorMode: selectedCreatorMode || null,
      creatorModeLabel: selectedCreatorModeLabel || null,
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
      selectedCreatorModeLabel,
      creatorJourney,
      idea,
      projectStatus,
      generatedIdea,
    ]
  );

  const canGenerate =
    journeyReady &&
    Boolean(idea.trim()) &&
    projectStatus !== "generating";

  const createProjectPayload = () => ({
    creatorType: selectedCreator,
    creatorLabel: activeCreator?.label || selectedCreator,
    creatorMode: selectedCreatorMode || null,
    creatorModeLabel: selectedCreatorModeLabel || null,
    creatorJourney,
    idea: idea.trim(),
    generatedIdea,
  });

  const handleCreatorSelect = (creator) => {
    const creatorChanged = selectedCreator !== creator.id;

    setSelectedCreator(creator.id);
    setShowCreatorChoices(false);
    setShowCreatorModeChoices(true);

    if (creatorChanged) {
      setSelectedCreatorMode("");
      setSelectedCreatorModeLabel("");
      setIdea("");
      setGeneratedIdea("");
      setProjectStatus("idle");
    }

    switch (creator.id) {
      case "video":
        setMentorMessage(
          "Let's create something visual. Choose what you'd like to make, and we'll take it from there."
        );
        break;

      case "image":
        setMentorMessage(
          "Let's create something visual. Choose what kind of image you'd like to make, and we'll shape it together."
        );
        break;

      case "music":
        setMentorMessage(
          "Let's create something with music. Choose where you'd like to begin, and we'll build from there."
        );
        break;

      case "podcast":
        setMentorMessage(
          "Let's build your podcast project. Choose what you'd like to create, and we'll take it one step at a time."
        );
        break;

      case "story":
        setMentorMessage(
          "Let's build your story. Choose what you'd like to create, and we'll develop it together."
        );
        break;

      case "marketing":
        setMentorMessage(
          "Let's create something that gets attention. Choose the kind of marketing project you want to make."
        );
        break;

      case "social":
        setMentorMessage(
          "Let's create something for social media. Choose what you'd like to make, and we'll shape it together."
        );
        break;

      default:
        setMentorMessage(
          "Tell me what you'd like to create. We can shape the idea together."
        );
    }
  };

  const handleCreatorModeSelect = (mode) => {
    const modeChanged = selectedCreatorMode !== mode.id;

    setSelectedCreatorMode(mode.id);
    setSelectedCreatorModeLabel(mode.label);
    setShowCreatorModeChoices(false);

    if (modeChanged) {
      setIdea("");
      setGeneratedIdea("");
      setProjectStatus("idle");
    }

    switch (mode.id) {
      case "ai-movie":
        setMentorMessage(
          "Welcome. That's exactly why I'm here. Since this is your first time, I'm not going to fill your head with a wall of instructions or expect you to know where to begin. You don't need to know how to make a movie. I'll help you through it. We'll take it one step at a time, and I'll explain things as we go. For now, tell me the idea you have in your head—even if it's only one sentence."
        );
        break;

      case "movie-scene":
        setMentorMessage(
          "Let's build your scene together. Tell me what you imagine happening, even if you only know one moment, character or location."
        );
        break;

      case "music-video":
        setMentorMessage(
          "Let's turn your music into a visual story. Tell me about the song and anything you already imagine seeing on screen."
        );
        break;

      case "advert":
        setMentorMessage(
          "Let's create a video advert that gets attention. Tell me what you're promoting and the main thing you want people to remember."
        );
        break;

      case "short-reel":
        setMentorMessage(
          "Let's make something short, clear and engaging. Tell me the idea, message or moment you want the Reel or Short to capture."
        );
        break;

      case "lyric-video":
        setMentorMessage(
          "Let's bring your lyrics to life visually. Tell me about the song, its mood and any visual ideas you already have."
        );
        break;

      case "animation-cartoon":
        setMentorMessage(
          "Let's build your animated world. Tell me the idea, character or scene you have in mind, even if it's only the beginning."
        );
        break;

      case "documentary":
        setMentorMessage(
          "Let's shape your documentary one step at a time. Tell me the real story, subject or question you want to explore."
        );
        break;

      case "songwriting":
        setMentorMessage(
          "Let's write your song together. Start with anything you have—a feeling, title, story, phrase or even a single line."
        );
        break;

      case "lyrics":
        setMentorMessage(
          "Let's work on the lyrics. Give me what you already have, or tell me what you want the song to say."
        );
        break;

      case "full-song":
        setMentorMessage(
          "Let's build the whole song together. Tell me the feeling, story or idea you want at the heart of it."
        );
        break;

      case "instrumental":
        setMentorMessage(
          "Let's shape the instrumental. Tell me the mood, energy or atmosphere you want it to create."
        );
        break;

      case "soundtrack-score":
        setMentorMessage(
          "Let's create music for the story on screen. Tell me about the scene, emotion or journey the score needs to support."
        );
        break;

      case "music-idea":
        setMentorMessage(
          "Let's explore the idea together. Tell me anything you already hear or feel, even if you can't describe it in musical terms."
        );
        break;

      default:
        setMentorMessage(
          `Great choice. Let's create your ${mode.label.toLowerCase()} together. Tell me what you already have in mind, even if it's only a rough idea.`
        );
    }
  };

  const handleChangeCreator = () => {
    setShowCreatorChoices(true);
    setShowCreatorModeChoices(false);
  };

  const handleChangeCreatorMode = () => {
    setShowCreatorChoices(false);
    setShowCreatorModeChoices(true);
  };

  const handleGenerate = async () => {
    if (!canGenerate) {
      setMentorMessage(
        "Choose what you would like to create, choose your Creator Mode, and tell me a little about your idea. We can shape the rest together."
      );
      return;
    }

    const request = {
      creatorType: selectedCreator,
      creatorLabel: activeCreator?.label || selectedCreator,
      creatorMode: selectedCreatorMode,
      creatorModeLabel: selectedCreatorModeLabel,
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
        "Your work is still here. The save did not complete, so please try once more when you're ready."
      );
    }
  };

  const handleEdit = () => {
    setProjectStatus("editing");
    setMentorMessage(
      "Let's keep developing it. Make any changes you need, then generate another version when you're ready."
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

      {showCreatorChoices && (
        <section style={styles.section}>
          <div style={styles.sectionHeadingRow}>
            <div>
              <p style={styles.sectionEyebrow}>Quick Create</p>
              <h2 style={styles.sectionTitle}>Choose your starting point</h2>
            </div>
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
      )}

      {!showCreatorChoices && activeCreator && (
        <section style={styles.section}>
          <div style={styles.choiceSummary}>
            <div style={styles.choiceSummaryCopy}>
              <span style={styles.choiceSummaryEyebrow}>Starting Point</span>

              <span style={styles.choiceSummaryValue}>
                {activeCreator.icon} {activeCreator.label}
              </span>
            </div>

            <button
              type="button"
              onClick={handleChangeCreator}
              style={styles.changeButton}
            >
              Change
            </button>
          </div>
        </section>
      )}

      {!showCreatorChoices &&
        activeCreator &&
        showCreatorModeChoices && (
          <section style={styles.section}>
            <CreatorModeSelector
              creatorType={selectedCreator}
              selectedMode={selectedCreatorMode}
              onSelect={handleCreatorModeSelect}
            />
          </section>
        )}

      {!showCreatorChoices &&
        activeCreator &&
        selectedCreatorMode &&
        !showCreatorModeChoices && (
          <section style={styles.section}>
            <div style={styles.choiceSummary}>
              <div style={styles.choiceSummaryCopy}>
                <span style={styles.choiceSummaryEyebrow}>Creator Mode</span>

                <span style={styles.choiceSummaryValue}>
                  {selectedCreatorModeLabel}
                </span>
              </div>

              <button
                type="button"
                onClick={handleChangeCreatorMode}
                style={styles.changeButton}
              >
                Change
              </button>
            </div>
          </section>
        )}

      {journeyReady && (
        <section style={styles.section}>
          <MentorConversation
            creator={activeCreator}
            creatorMode={selectedCreatorMode}
            creatorModeLabel={selectedCreatorModeLabel}
            message={mentorMessage}
            idea={idea}
            projectStatus={projectStatus}
            creatorJourney={creatorJourney}
            onJourneyChange={setCreatorJourney}
          />
        </section>
      )}

      {journeyReady && (
        <section style={styles.section}>
          <PromptBuilder
            creatorType={selectedCreator}
            creatorLabel={activeCreator.label}
            creatorMode={selectedCreatorMode}
            creatorModeLabel={selectedCreatorModeLabel}
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
                    selectedCreatorModeLabel,
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

  choiceSummary: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    padding: "15px 16px",
    boxSizing: "border-box",
    borderRadius: "18px",
    border: "1px solid rgba(96, 77, 255, 0.2)",
    background:
      "linear-gradient(145deg, rgba(96,77,255,0.08), rgba(255,255,255,1))",
    boxShadow: "0 8px 24px rgba(17,24,39,0.04)",
  },

  choiceSummaryCopy: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  choiceSummaryEyebrow: {
    color: "#777d89",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },

  choiceSummaryValue: {
    color: "#17191f",
    fontSize: "16px",
    fontWeight: "800",
    lineHeight: "1.3",
  },

  changeButton: {
    flexShrink: 0,
    appearance: "none",
    border: "1px solid rgba(96,77,255,0.22)",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#5140d8",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
};

export default CreatorWorkspace;
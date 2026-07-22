import React from "react";

const CREATOR_PLACEHOLDERS = {
  video:
    "Describe the video, reel, cartoon, advert, music video or scene you would like to create...",
  image:
    "Describe the artwork, poster, cover, character or image you would like to create...",
  music:
    "Describe your song, sound, mood, lyrics or music idea...",
  podcast:
    "Describe the podcast episode, subject, guest or conversation...",
  story:
    "Describe the story, character, world, episode or scene...",
  marketing:
    "Describe the product, business, audience and campaign you need...",
  social:
    "Describe the post, platform, message or social campaign...",
  other:
    "Tell the Mentor what you would like to create in your own words...",
};

const CREATOR_QUESTIONS = {
  video: [
    "What type of video are you creating?",
    "Who is it for?",
    "What mood or style should it have?",
  ],
  image: [
    "What should the image show?",
    "What visual style would you like?",
    "Where will the image be used?",
  ],
  music: [
    "What kind of song or music are you creating?",
    "What mood should it have?",
    "Are there any instruments or influences you have in mind?",
  ],
  podcast: [
    "What is the episode about?",
    "Who is the intended audience?",
    "What tone should the conversation have?",
  ],
  story: [
    "Who or what is the story about?",
    "Where does it take place?",
    "What should the audience feel?",
  ],
  marketing: [
    "What are you promoting?",
    "Who do you want to reach?",
    "What action should the audience take?",
  ],
  social: [
    "Which platform is this for?",
    "What message do you want to share?",
    "What response would you like from the audience?",
  ],
  other: [
    "What would you like to make?",
    "Who is it for?",
    "What would make the result feel right to you?",
  ],
};

const PromptBuilder = ({
  creatorType = "other",
  creatorLabel = "Creative",
  value = "",
  onChange,
  projectStatus = "idle",
  disabled = false,
  renderCreatorControls,
}) => {
  const placeholder =
    CREATOR_PLACEHOLDERS[creatorType] || CREATOR_PLACEHOLDERS.other;

  const guidanceQuestions =
    CREATOR_QUESTIONS[creatorType] || CREATOR_QUESTIONS.other;

  const handleChange = (event) => {
    if (typeof onChange === "function") {
      onChange(event.target.value);
    }
  };

  const handleQuestionSelect = (question) => {
    if (disabled || typeof onChange !== "function") {
      return;
    }

    const currentValue = value.trim();

    const nextValue = currentValue
      ? `${currentValue}\n\n${question}\n`
      : `${question}\n`;

    onChange(nextValue);
  };

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <div style={styles.headingCopy}>
          <p style={styles.eyebrow}>Prompt Builder</p>

          <h2 style={styles.title}>Tell the Mentor about your idea</h2>
        </div>

        <span style={styles.stepBadge}>Step 2</span>
      </div>

      <p style={styles.supportingText}>
        Speak naturally. You do not need to understand prompt engineering or
        know every detail before you begin.
      </p>

      <div style={styles.creatorSummary}>
        <span aria-hidden="true" style={styles.creatorSummaryIcon}>
          ✨
        </span>

        <div style={styles.creatorSummaryCopy}>
          <span style={styles.creatorSummaryLabel}>Creating</span>

          <strong style={styles.creatorSummaryValue}>
            {creatorLabel}
          </strong>
        </div>
      </div>

      <label htmlFor="creator-prompt" style={styles.label}>
        What are we creating?
      </label>

      <textarea
        id="creator-prompt"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={7}
        disabled={disabled}
        style={{
          ...styles.textarea,
          ...(disabled ? styles.textareaDisabled : {}),
        }}
      />

      <div style={styles.promptFooter}>
        <span style={styles.characterCount}>
          {value.length.toLocaleString()} characters
        </span>

        <span style={styles.reassurance}>
          Your first description does not need to be perfect.
        </span>
      </div>

      <div style={styles.guidanceSection}>
        <p style={styles.guidanceTitle}>
          Need a little help getting started?
        </p>

        <div style={styles.guidanceList}>
          {guidanceQuestions.map((question) => (
            <button
              key={question}
              type="button"
              disabled={disabled}
              onClick={() => handleQuestionSelect(question)}
              style={{
                ...styles.guidanceButton,
                ...(disabled ? styles.guidanceButtonDisabled : {}),
              }}
            >
              <span style={styles.guidancePlus}>+</span>

              <span>{question}</span>
            </button>
          ))}
        </div>
      </div>

      {typeof renderCreatorControls === "function" && (
        <div style={styles.creatorControls}>
          {renderCreatorControls({
            creatorType,
            idea: value,
            setIdea: onChange,
            projectStatus,
          })}
        </div>
      )}

      <div style={styles.mentorNote}>
        <span aria-hidden="true" style={styles.mentorNoteIcon}>
          😊
        </span>

        <p style={styles.mentorNoteText}>
          Start with what you already know. The Mentor will help you discover
          the rest as your idea develops.
        </p>
      </div>
    </div>
  );
};

const styles = {
  panel: {
    width: "100%",
    padding: "18px",
    border: "1px solid rgba(20, 24, 32, 0.08)",
    borderRadius: "24px",
    background: "#ffffff",
    boxShadow: "0 12px 34px rgba(17, 24, 39, 0.06)",
    boxSizing: "border-box",
  },

  panelHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
  },

  headingCopy: {
    minWidth: "0",
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
    margin: "0",
    color: "#16181d",
    fontSize: "21px",
    lineHeight: "1.2",
    letterSpacing: "-0.025em",
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

  creatorSummary: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px",
    padding: "11px 13px",
    border: "1px solid rgba(96, 77, 255, 0.14)",
    borderRadius: "16px",
    background:
      "linear-gradient(135deg, rgba(96, 77, 255, 0.07), rgba(215, 77, 255, 0.05))",
  },

  creatorSummaryIcon: {
    width: "36px",
    height: "36px",
    flexShrink: "0",
    display: "grid",
    placeItems: "center",
    borderRadius: "12px",
    background: "#ffffff",
    boxShadow: "0 5px 14px rgba(96, 77, 255, 0.12)",
    fontSize: "17px",
  },

  creatorSummaryCopy: {
    minWidth: "0",
    display: "flex",
    flexDirection: "column",
    gap: "1px",
  },

  creatorSummaryLabel: {
    color: "#777d89",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  creatorSummaryValue: {
    color: "#312a68",
    fontSize: "14px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    color: "#282c34",
    fontSize: "13px",
    fontWeight: "800",
  },

  textarea: {
    width: "100%",
    minHeight: "152px",
    display: "block",
    padding: "15px",
    border: "1px solid rgba(20, 24, 32, 0.12)",
    borderRadius: "17px",
    outline: "none",
    resize: "vertical",
    background: "#f8f9fb",
    color: "#17191f",
    fontFamily: "inherit",
    fontSize: "16px",
    lineHeight: "1.55",
    boxSizing: "border-box",
    WebkitAppearance: "none",
  },

  textareaDisabled: {
    background: "#f1f2f5",
    color: "#8d929c",
    cursor: "not-allowed",
  },

  promptFooter: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "6px 12px",
    marginTop: "8px",
  },

  characterCount: {
    color: "#9196a0",
    fontSize: "11px",
  },

  reassurance: {
    color: "#69707c",
    fontSize: "11px",
  },

  guidanceSection: {
    marginTop: "18px",
  },

  guidanceTitle: {
    margin: "0 0 9px",
    color: "#343842",
    fontSize: "13px",
    fontWeight: "800",
  },

  guidanceList: {
    display: "grid",
    gap: "8px",
  },

  guidanceButton: {
    width: "100%",
    minHeight: "43px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    border: "1px solid rgba(20, 24, 32, 0.09)",
    borderRadius: "14px",
    background: "#ffffff",
    color: "#4a505b",
    fontFamily: "inherit",
    fontSize: "12px",
    fontWeight: "700",
    lineHeight: "1.4",
    textAlign: "left",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },

  guidanceButtonDisabled: {
    opacity: "0.55",
    cursor: "not-allowed",
  },

  guidancePlus: {
    width: "23px",
    height: "23px",
    flexShrink: "0",
    display: "grid",
    placeItems: "center",
    borderRadius: "8px",
    background: "rgba(96, 77, 255, 0.09)",
    color: "#604dff",
    fontSize: "16px",
    fontWeight: "800",
    lineHeight: "1",
  },

  creatorControls: {
    marginTop: "16px",
  },

  mentorNote: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    marginTop: "18px",
    padding: "12px",
    borderRadius: "15px",
    background: "#f6f7fa",
  },

  mentorNoteIcon: {
    flexShrink: "0",
    fontSize: "18px",
  },

  mentorNoteText: {
    margin: "0",
    color: "#656c78",
    fontSize: "12px",
    lineHeight: "1.5",
  },
};

export default PromptBuilder;
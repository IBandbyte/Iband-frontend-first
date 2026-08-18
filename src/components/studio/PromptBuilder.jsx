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

const MODE_PLACEHOLDERS = {
  "ai-movie":
    "Tell me the movie idea you have in your head—even if it's only one sentence...",
  "movie-scene":
    "Describe the moment, character, location or situation you imagine in the scene...",
  "music-video":
    "Tell me about the song and what you imagine seeing on screen...",
  advert:
    "Tell me what you are promoting and the main thing you want people to remember...",
  "short-reel":
    "Describe the idea, message or moment you want your Short or Reel to capture...",
  "lyric-video":
    "Tell me about the song, its mood and the visual ideas you have for the lyrics...",
  "animation-cartoon":
    "Tell me about the character, world, story or scene you want to bring to life...",
  documentary:
    "Tell me about the real story, subject or question you want your documentary to explore...",

  songwriting:
    "Start with anything you have—a feeling, title, story, phrase or even a single line...",
  lyrics:
    "Tell me what you want the lyrics to say or make someone feel...",
  "full-song":
    "Tell me the feeling, story or idea you want at the heart of the song...",
  instrumental:
    "Describe the mood, energy or atmosphere you want the instrumental to create...",
  "soundtrack-score":
    "Tell me about the scene, emotion or journey the music needs to support...",
  "music-idea":
    "Tell me anything you already hear or feel, even if you cannot describe it in musical terms...",

  artwork:
    "Describe what you would like the artwork to show or make people feel...",
  poster:
    "Tell me what the poster is for and what people should notice first...",
  "cover-art":
    "Tell me what the release is about and the feeling the cover should capture...",
  "advert-image":
    "Tell me what you are promoting and what the image should communicate immediately...",
  character:
    "Tell me who or what this character is and anything you already imagine about them...",
  "social-image":
    "Tell me what you want people to notice or feel when they see the image...",

  episode:
    "Tell me what you would like this podcast episode to be about...",
  script:
    "Tell me what you want the podcast script to help you say...",
  interview:
    "Tell me who you are interviewing and what you would most like to discover...",
  series:
    "Tell me the main idea you think could carry across the podcast series...",

  "short-story":
    "Tell me the story idea you have in your head—even if it's only one sentence...",
  screenplay:
    "Tell me the story you would like to turn into a screenplay...",
  "movie-story":
    "Tell me the movie story you would like to develop...",
  "episode-story":
    "Tell me what happens in this episode or what you want it to achieve...",
  "character-world":
    "Tell me about the character, place or world already forming in your imagination...",

  "advert-campaign":
    "Tell me what you are promoting and what you want the advert to achieve...",
  campaign:
    "Tell me what you are promoting and what success would look like for the campaign...",
  "product-promotion":
    "Tell me about the product, service or offer you want people to notice...",
  "business-campaign":
    "Tell me about the business and what you want the campaign to achieve...",

  "social-post":
    "Tell me what you would like to say, show or share...",
  caption:
    "Tell me what the post is about and the tone you want for the caption...",
  "reel-short":
    "Tell me the idea, moment or message you want the Reel or Short to capture...",
  "social-campaign":
    "Tell me what you would like the social campaign to achieve...",

  "free-create":
    "Tell me the idea you have in your head. We can work out what it becomes together...",
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

const MODE_QUESTIONS = {
  "ai-movie": [
    "Who or what is the movie mainly about?",
    "How would you like the movie to feel — or should we discover that as we build it?",
    "Is there anything you already know about how the story begins?",
  ],
  "movie-scene": [
    "Who is in the scene?",
    "Where does the scene take place?",
    "What should change by the end of the scene?",
  ],
  "music-video": [
    "What feeling does the song create?",
    "Who or what do you imagine seeing?",
    "Should the visuals tell a story or focus more on mood?",
  ],
  advert: [
    "Who is the advert for?",
    "What should people remember?",
    "What action would you like them to take?",
  ],
  "short-reel": [
    "Who is the Short or Reel for?",
    "What should happen in the opening seconds?",
    "What should the viewer do or feel afterwards?",
  ],
  "lyric-video": [
    "What feeling should the visuals create?",
    "Are there any important lyrics we should emphasise?",
    "Do you imagine something cinematic, simple or animated?",
  ],
  "animation-cartoon": [
    "Who is the main character?",
    "What kind of world are they in?",
    "What feeling or style should the animation have?",
  ],
  documentary: [
    "Who or what is the documentary about?",
    "Why does this story matter?",
    "Who do you want the audience to understand better?",
  ],

  songwriting: [
    "What is the song really about?",
    "What feeling should it create?",
    "Is there a phrase, title or line you already want to keep?",
  ],
  lyrics: [
    "What is the central message?",
    "Who is speaking in the song?",
    "What tone should the lyrics have?",
  ],
  "full-song": [
    "What is the song about?",
    "What feeling should it create?",
    "Do you already imagine a genre or style?",
  ],
  instrumental: [
    "What atmosphere should it create?",
    "Should it feel calm, powerful, emotional or energetic?",
    "Are there any sounds or instruments you already imagine?",
  ],
  "soundtrack-score": [
    "What is happening in the scene?",
    "What should the audience feel?",
    "Should the music lead the emotion or sit quietly underneath it?",
  ],
  "music-idea": [
    "What feeling do you want to explore?",
    "Do you hear anything already?",
    "What kind of direction would you like to experiment with?",
  ],
};

const PromptBuilder = ({
  creatorType = "other",
  creatorLabel = "Creative",
  creatorMode = "",
  creatorModeLabel = "",
  creatorJourney = "guide",
  value = "",
  onChange,
  projectStatus = "idle",
  disabled = false,
  renderCreatorControls,
}) => {
  const placeholder =
    MODE_PLACEHOLDERS[creatorMode] ||
    CREATOR_PLACEHOLDERS[creatorType] ||
    CREATOR_PLACEHOLDERS.other;

  const guidanceQuestions =
    MODE_QUESTIONS[creatorMode] ||
    CREATOR_QUESTIONS[creatorType] ||
    CREATOR_QUESTIONS.other;

  const visibleQuestions =
    creatorJourney === "expert"
      ? guidanceQuestions.slice(0, 1)
      : guidanceQuestions;

  const creationLabel = creatorModeLabel || creatorLabel;

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

        <span style={styles.stepBadge}>Step 1</span>
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
            {creationLabel}
          </strong>
        </div>
      </div>

      <label htmlFor="creator-prompt" style={styles.label}>
        Tell me what you have in mind
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
          {visibleQuestions.map((question) => (
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
            creatorLabel,
            creatorMode,
            creatorModeLabel,
            creatorJourney,
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
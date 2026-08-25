import React, { useEffect, useMemo, useRef, useState } from "react";
import requestMovieMentorTurn from "./MovieMentorTurnClient.js";

/**
 * MovieMentorConversation
 * ------------------------------------------------------------
 * Creator-facing Movie Mentor conversation surface.
 *
 * Authority rule:
 *   This component is UI, never a Mentor brain.
 *   Every creator turn is settled against durable creator reality and
 *   answered by the authoritative backend through MovieMentorTurnClient.
 */

const CREATOR_START_POINTS = Object.freeze([
  ["idea", "💡", "I just have an idea"],
  ["notes", "📝", "I have some notes"],
  ["story", "📖", "I've started writing a story"],
  ["script", "🎬", "I have a script"],
  ["book", "📚", "I've written a book"],
  ["characters", "🎭", "I already have characters"],
  ["pictures", "🖼️", "I have pictures or artwork"],
  ["video", "🎥", "I already have video"],
  ["explore", "✨", "I'd just like to explore"],
].map(([id, icon, label]) => ({ id, icon, label }));

const CREATIVE_STAGES = Object.freeze([
  "Idea",
  "Characters",
  "World",
  "Story",
  "Capture Attention",
  "Story Structure",
  "Audience Curiosity",
  "Emotional Impact",
  "Pacing",
  "Editing Rhythm",
  "Music & Sound",
  "Cliffhangers",
  "Title & Thumbnail",
  "Publish",
].map((label) => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"), label })));

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function now() {
  return new Date().toISOString();
}

function normaliseMessages(messages) {
  if (Array.isArray(messages) && messages.length) return messages;
  return [{
    id: "movie-mentor-welcome",
    role: "mentor",
    text: "Let's find out where you are in your creative journey. You don't need to have everything worked out — show me what you've got so far, or simply tell me what's in your head.",
    createdAt: now(),
  }];
}

function MentorAvatar({ mentorName }) {
  return <div aria-label={`${mentorName} avatar`} style={styles.avatar}>✦</div>;
}

export default function MovieMentorConversation({
  creatorName = "Creator",
  mentorName = "Movie Mentor",
  projectId = null,
  creatorSessionId = null,
  messages = [],
  activeStage = "idea",
  completedStages = [],
  startPoint = null,
  isThinking = false,
  isGenerating = false,
  placeholder = "Tell Movie Mentor what's on your mind...",
  quickActions = [],
  showJourney = true,
  showStartPointChooser = true,
  allowAttachments = true,
  allowVoice = true,
  onSendMessage,
  onStartPointSelect,
  onStageSelect,
  onAction,
  onAttach,
  onVoice,
  onThinkingChange,
  renderComposerExtra,
  renderAboveConversation,
  renderBelowConversation,
}) {
  const [draft, setDraft] = useState("");
  const [localStartPoint, setLocalStartPoint] = useState(startPoint);
  const [localIsThinking, setLocalIsThinking] = useState(false);
  const endRef = useRef(null);
  const normalisedMessages = useMemo(() => normaliseMessages(messages), [messages]);
  const effectiveThinking = isThinking || localIsThinking;
  const completed = useMemo(() => new Set(completedStages || []), [completedStages]);
  const hasCreatorMessage = normalisedMessages.some((message) => message.role === "creator");

  useEffect(() => {
    if (startPoint) setLocalStartPoint(startPoint);
  }, [startPoint]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  }, [normalisedMessages.length, effectiveThinking, isGenerating]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || effectiveThinking || isGenerating) return;

    const creatorMessage = {
      id: createId("creator-message"),
      role: "creator",
      type: "text",
      behaviour: "discuss",
      text,
      createdAt: now(),
    };

    onSendMessage?.(creatorMessage);
    setDraft("");
    setLocalIsThinking(true);
    onThinkingChange?.(true);

    try {
      const turn = await requestMovieMentorTurn({
        message: text,
        projectId,
        creatorSessionId,
      });

      onSendMessage?.({
        id: createId("mentor-message"),
        role: "mentor",
        type: "text",
        behaviour: "discuss",
        text: turn.text,
        createdAt: now(),
        metadata: {
          liveBackendTurn: true,
          localResponseGeneratorUsed: false,
          durableSyncStatus: turn.durableSyncStatus || null,
          turnContextProof: turn.turnContextProof || null,
          semanticIntelligence: turn.semanticIntelligence || null,
          specialistPlan: turn.specialistPlan || null,
          specialistResult: turn.specialistResult || null,
          synthesisResult: turn.synthesisResult || null,
          authority: turn.authority || null,
          mayAdvanceJourney: turn.mayAdvanceJourney === true,
          backendMetadata: turn.metadata || null,
        },
      });
    } catch (error) {
      console.error("MovieMentorConversation authoritative turn error:", error);
      onSendMessage?.({
        id: createId("mentor-error-message"),
        role: "mentor",
        type: "text",
        behaviour: "continue",
        text: "I’m still with you. Your latest creative reality has not been lost, but I couldn't safely complete that turn yet. Please try again.",
        createdAt: now(),
        metadata: {
          generationError: true,
          authoritativeTurnFailed: true,
          errorCode: error?.code || "MOVIE_MENTOR_LIVE_TURN_FAILED",
          durableSyncStatus: error?.durableSyncStatus || null,
        },
      });
    } finally {
      setLocalIsThinking(false);
      onThinkingChange?.(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <section style={styles.shell}>
      <header style={styles.header}>
        <div style={styles.identity}>
          <MentorAvatar mentorName={mentorName} />
          <div>
            <div style={styles.eyebrow}>MOVIE MENTOR</div>
            <div style={styles.title}>{mentorName}</div>
            <div style={styles.subtitle}>Creating with {creatorName}</div>
          </div>
        </div>
        <div style={styles.badge}>● {CREATIVE_STAGES.find((stage) => stage.id === activeStage)?.label || "Idea"}</div>
      </header>

      {showJourney && (
        <div style={styles.journey}>
          {CREATIVE_STAGES.map((stage, index) => (
            <button
              key={stage.id}
              type="button"
              onClick={() => onStageSelect?.(stage.id)}
              aria-current={stage.id === activeStage ? "step" : undefined}
              style={{ ...styles.stage, ...(stage.id === activeStage ? styles.stageActive : {}) }}
              title={stage.label}
            >
              {completed.has(stage.id) ? "✓" : index + 1}
            </button>
          ))}
        </div>
      )}

      {renderAboveConversation?.()}

      <div style={styles.viewport}>
        {normalisedMessages.map((message) => {
          const creator = message.role === "creator";
          return (
            <div key={message.id || createId("message")} style={creator ? styles.creatorRow : styles.mentorRow}>
              {!creator && <MentorAvatar mentorName={mentorName} />}
              <div style={creator ? styles.creatorBubble : styles.mentorBubble}>
                {message.title && <strong style={styles.messageTitle}>{message.title}</strong>}
                <div>{message.text}</div>
                {Array.isArray(message.actions) && message.actions.length > 0 && (
                  <div style={styles.actionRow}>
                    {message.actions.map((action) => (
                      <button key={action.id || action.action || action.label} type="button" style={styles.secondaryButton} onClick={() => onAction?.(action, message)}>{action.label}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {showStartPointChooser && !localStartPoint && !hasCreatorMessage && (
          <div style={styles.startGrid}>
            {CREATOR_START_POINTS.map((option) => (
              <button key={option.id} type="button" style={styles.startCard} onClick={() => { setLocalStartPoint(option); onStartPointSelect?.(option); }}>
                <span>{option.icon}</span><span>{option.label}</span>
              </button>
            ))}
          </div>
        )}

        {effectiveThinking && (
          <div style={styles.mentorRow}>
            <MentorAvatar mentorName={mentorName} />
            <div style={styles.thinking}>● ● ● Thinking with you...</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {Array.isArray(quickActions) && quickActions.length > 0 && (
        <div style={styles.quickActions}>
          {quickActions.map((action) => <button key={action.id || action.action || action.label} type="button" style={styles.secondaryButton} onClick={() => onAction?.(action)}>{action.icon || ""} {action.label}</button>)}
        </div>
      )}

      <div style={styles.composer}>
        {allowAttachments && <button type="button" style={styles.iconButton} onClick={onAttach} aria-label="Attach">＋</button>}
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder} disabled={effectiveThinking || isGenerating} style={styles.textarea} rows={2} />
        {allowVoice && <button type="button" style={styles.iconButton} onClick={onVoice} aria-label="Voice">🎙</button>}
        <button type="button" onClick={handleSend} disabled={!draft.trim() || effectiveThinking || isGenerating} style={styles.sendButton}>Send</button>
      </div>

      {renderComposerExtra?.()}
      {renderBelowConversation?.()}
    </section>
  );
}

const styles = {
  shell: { maxWidth: 900, margin: "0 auto", padding: 18, borderRadius: 24, background: "linear-gradient(180deg,#10131d,#090b11)", color: "#f6f7fb", boxShadow: "0 24px 70px rgba(0,0,0,.28)", fontFamily: "Inter, system-ui, sans-serif" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, paddingBottom: 16 },
  identity: { display: "flex", alignItems: "center", gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: "50%", display: "grid", placeItems: "center", background: "linear-gradient(135deg,#7b61ff,#2dd4bf)", fontSize: 20, boxShadow: "0 0 26px rgba(123,97,255,.35)" },
  eyebrow: { fontSize: 10, letterSpacing: 2, opacity: .65 },
  title: { fontSize: 20, fontWeight: 800 },
  subtitle: { fontSize: 12, opacity: .65, marginTop: 2 },
  badge: { fontSize: 12, padding: "8px 11px", borderRadius: 999, background: "rgba(255,255,255,.07)" },
  journey: { display: "flex", gap: 6, overflowX: "auto", padding: "10px 0 16px" },
  stage: { minWidth: 30, height: 30, borderRadius: "50%", border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.04)", color: "#aeb4c3", cursor: "pointer" },
  stageActive: { background: "#f6f7fb", color: "#11131a", fontWeight: 800 },
  viewport: { minHeight: 360, maxHeight: "58vh", overflowY: "auto", padding: "14px 2px", display: "flex", flexDirection: "column", gap: 14 },
  mentorRow: { display: "flex", alignItems: "flex-start", gap: 10, maxWidth: "88%" },
  creatorRow: { display: "flex", justifyContent: "flex-end", alignSelf: "flex-end", maxWidth: "88%" },
  mentorBubble: { padding: "12px 14px", borderRadius: "6px 18px 18px 18px", background: "rgba(255,255,255,.08)", lineHeight: 1.5 },
  creatorBubble: { padding: "12px 14px", borderRadius: "18px 6px 18px 18px", background: "#f3f4f7", color: "#11131a", lineHeight: 1.5 },
  messageTitle: { display: "block", marginBottom: 5 },
  thinking: { padding: "12px 14px", opacity: .7, fontSize: 13 },
  startGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8, margin: "8px 0" },
  startCard: { display: "flex", gap: 9, alignItems: "center", textAlign: "left", padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.045)", color: "#f6f7fb", cursor: "pointer" },
  quickActions: { display: "flex", gap: 8, overflowX: "auto", padding: "8px 0" },
  actionRow: { display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 },
  secondaryButton: { border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.06)", color: "inherit", borderRadius: 999, padding: "7px 10px", cursor: "pointer", whiteSpace: "nowrap" },
  composer: { display: "flex", alignItems: "flex-end", gap: 8, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.08)" },
  textarea: { flex: 1, resize: "none", border: "1px solid rgba(255,255,255,.12)", outline: "none", borderRadius: 16, background: "rgba(255,255,255,.06)", color: "#f6f7fb", padding: "12px 13px", font: "inherit" },
  iconButton: { width: 40, height: 40, borderRadius: "50%", border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)", color: "#f6f7fb", cursor: "pointer" },
  sendButton: { height: 40, border: 0, borderRadius: 999, padding: "0 17px", fontWeight: 800, cursor: "pointer" },
};

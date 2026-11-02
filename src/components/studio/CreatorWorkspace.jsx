import React, { useEffect, useMemo, useState } from "react";
import { listOwnedMovieMentorProjects, recoverMovieMentorCreatorState } from "./mentor/MovieMentorDurableStateSync.js";
import { projectRecoveredCreatorWorkspace } from "./mentor/MovieMentorRecoveredWorkspaceProjection.js";
import AiMentor from "./AiMentor";
import MentorConversation from "./MentorConversation";
import PromptBuilder from "./PromptBuilder";
import GenerateButton from "./GenerateButton";
import PreviewPanel from "./PreviewPanel";
import CreatorModeSelector from "./CreatorModeSelector";
import createCreatorJourneyEngine from "./mentor/CreatorJourneyEngine";
import createMovieJourneyIntelligenceBridge from "./mentor/MovieJourneyIntelligenceBridge";
import MovieMentorConversation from "./mentor/MovieMentorConversation.jsx";
import createMovieMentorStudioIdentityRuntime from "./mentor/MovieMentorStudioIdentityRuntime.js";
import createJourneyProgressionExecutionRuntime from "./mentor/JourneyProgressionExecutionRuntime.js";
import createJourneyRecommendationAcceptanceExecutionRuntime from "./mentor/JourneyRecommendationAcceptanceExecutionRuntime.js";
import {
  createJourneyRecommendationActionSurface,
  acceptCurrentJourneyRecommendation,
  dismissCurrentJourneyRecommendation,
} from "./mentor/JourneyRecommendationActionSurface.js";
import {
  POSITION_ACTIONS,
  POSITION_AUTHORITY_SOURCES,
  issueJourneyPositionAuthority,
} from "./mentor/JourneyPositionAuthorityControl.js";
import projectCommittedCreatorAuthorityIntoJourney from "./mentor/MovieMentorJourneyProjectionRuntime.js";
import { resolveMovieMentorCreatorFacingMessage, resolveMovieMentorPreview } from "./mentor/MovieMentorCreatorFacingPresenter";

const creatorJourneyEngine = createCreatorJourneyEngine();
const movieJourneyIntelligenceBridge = createMovieJourneyIntelligenceBridge({ journeyEngine: creatorJourneyEngine });

const CREATOR_OPTIONS = [
  { id: "video", icon: "🎬", label: "Video", description: "Create movies, videos, reels, scenes and visual stories." },
  { id: "image", icon: "🖼️", label: "Image", description: "Create artwork, posters, covers and promotional images." },
  { id: "music", icon: "🎵", label: "Music", description: "Write songs, lyrics, music ideas and creative direction." },
  { id: "podcast", icon: "🎙️", label: "Podcast", description: "Plan episodes, scripts, interviews and audio content." },
  { id: "story", icon: "📖", label: "Story", description: "Build characters, scenes, episodes and complete stories." },
  { id: "marketing", icon: "📢", label: "Marketing", description: "Create adverts, campaigns and promotional material." },
  { id: "social", icon: "📱", label: "Social", description: "Create posts, captions, reels and platform campaigns." },
  { id: "other", icon: "✨", label: "Something Else", description: "Start with an idea and let the Mentor help shape it." },
];

let creatorActSequence = 0;

function createCreatorActId(prefix = "creator-act") {
  creatorActSequence += 1;
  const durableUuid = globalThis?.crypto?.randomUUID?.();
  return durableUuid
    ? `${prefix}-${durableUuid}`
    : `${prefix}-${Date.now()}-${creatorActSequence}`;
}

const CreatorWorkspace = ({ creatorName = "Creator", initialCreator = "", onGenerate, onSave, onEdit, onPublish, renderCreatorControls, renderPreview }) => {
  const identityRuntime = useMemo(() => createMovieMentorStudioIdentityRuntime(), []);
  const journeyProgressionRuntime = useMemo(
    () => createJourneyProgressionExecutionRuntime({ journeyEngine: creatorJourneyEngine, identityRuntime }),
    [identityRuntime]
  );
  const recommendationAcceptanceRuntime = useMemo(
    () => createJourneyRecommendationAcceptanceExecutionRuntime({ identityRuntime, progressionRuntime: journeyProgressionRuntime }),
    [identityRuntime, journeyProgressionRuntime]
  );
  const resumeSnapshot = useMemo(() => identityRuntime.getResumeSnapshot(), [identityRuntime]);
  const resumedMovie = Boolean(resumeSnapshot?.projectId);

  const [selectedCreator, setSelectedCreator] = useState(resumedMovie ? "video" : initialCreator);
  const [selectedCreatorMode, setSelectedCreatorMode] = useState(resumedMovie ? "ai-movie" : "");
  const [selectedCreatorModeLabel, setSelectedCreatorModeLabel] = useState(resumedMovie ? "AI Movie Making" : "");
  const [idea, setIdea] = useState("");
  const [generatedIdea, setGeneratedIdea] = useState("");
  const [projectStatus, setProjectStatus] = useState(resumedMovie ? "saved" : "idle");
  const [creatorJourney, setCreatorJourney] = useState(resumeSnapshot?.projectJourney?.creatorJourney || "guide");
  const [projectJourney, setProjectJourney] = useState(resumeSnapshot?.projectJourney || null);
  const [activeMovieProject, setActiveMovieProject] = useState(resumeSnapshot?.project || null);
  const [movieMessages, setMovieMessages] = useState(resumeSnapshot?.conversationMessages || []);
  const [movieJourneyPlanningEvidence, setMovieJourneyPlanningEvidence] = useState(null);
  const [dismissedRecommendationId, setDismissedRecommendationId] = useState(null);
  const [showCreatorChoices, setShowCreatorChoices] = useState(resumedMovie ? false : !Boolean(initialCreator));
  const [showCreatorModeChoices, setShowCreatorModeChoices] = useState(resumedMovie ? false : Boolean(initialCreator));
  const [mentorMessage, setMentorMessage] = useState(resumedMovie ? `Welcome back. Your movie project “${resumeSnapshot.project.title}” is ready to continue.` : "I've got your back. Choose what you would like to create, then tell me about your idea.");

  // Resume recommendation repair is a post-render operation. The initial
  // snapshot stays read-only and blocked; a cancelled effect never publishes
  // an outdated recovery result over a newer workspace session.
  const [resumeRepairStatus, setResumeRepairStatus] = useState(resumedMovie ? "pending" : "not-required");
  const [certifiedResumeSnapshot, setCertifiedResumeSnapshot] = useState(null);
  useEffect(() => {
    if (!resumeSnapshot?.projectId) return undefined;
    let cancelled = false;
    const projectId = resumeSnapshot.projectId;
    void (async () => {
      try {
        const result = await identityRuntime.recoverResumeRecommendationsWithSharedAuthority();
        if (cancelled) return;
        if (!result?.acquired) {
          setResumeRepairStatus("blocked");
          return;
        }
        const current = identityRuntime.getResumeSnapshot();
        if (current?.projectId !== projectId) {
          setResumeRepairStatus("stale");
          return;
        }
        const certified = identityRuntime.getCertifiedResumeSnapshot(result, projectId);
        if (!certified || certified.projectId !== projectId) {
          setResumeRepairStatus("blocked");
          return;
        }
        // Adopt the certified read as evidence only. Do not publish its
        // recommendation references into editable controls until competing
        // writers and fresh-browser recovery are independently certified.
        setCertifiedResumeSnapshot(certified);
        setResumeRepairStatus("certified-read-only");
      } catch {
        if (!cancelled) setResumeRepairStatus("blocked");
      }
    })();
    return () => { cancelled = true; };
  }, [identityRuntime, resumeSnapshot?.projectId]);

  const [ownedMovieProjects, setOwnedMovieProjects] = useState([]);
  const [ownedProjectsStatus, setOwnedProjectsStatus] = useState("idle");
  const [ownedProjectsError, setOwnedProjectsError] = useState(null);
  const [discoveryAttempt, setDiscoveryAttempt] = useState(0);
  useEffect(() => {
    if (!discoveryAttempt) return undefined;
    let cancelled = false;
    setOwnedProjectsStatus("loading");
    setOwnedProjectsError(null);
    setOwnedMovieProjects([]);
    void (async () => {
      try {
        const projects = await listOwnedMovieMentorProjects();
        if (cancelled) return;
        setOwnedMovieProjects(projects);
        setOwnedProjectsStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setOwnedProjectsStatus("failed");
        setOwnedProjectsError(error?.message || "Unable to discover your projects.");
      }
    })();
    return () => { cancelled = true; };
  }, [discoveryAttempt]);
  const [recoveryProjectId, setRecoveryProjectId] = useState("");
  const [recoveryRequest, setRecoveryRequest] = useState(null);
  const [recoveryStatus, setRecoveryStatus] = useState("idle");
  const [recoveryError, setRecoveryError] = useState(null);
  const [serverRecoveredPreview, setServerRecoveredPreview] = useState(null);
  useEffect(() => {
    if (!recoveryRequest) return undefined;
    let cancelled = false;
    setRecoveryStatus("loading");
    setRecoveryError(null);
    void (async () => {
      try {
        const state = await recoverMovieMentorCreatorState({ projectId: recoveryRequest });
        const recovered = projectRecoveredCreatorWorkspace({ projectId: recoveryRequest, state });
        if (cancelled) return;
        // The authoritative read is safe to display, but must not be written
        // into the local identity runtime without an explicit adoption fence.
        // Keep the existing workspace's mutation controls disabled by retaining
        // its separate local project identity until that gate is implemented.
        setServerRecoveredPreview(recovered);
        setRecoveryStatus("preview-ready");
      } catch (error) {
        if (cancelled) return;
        setRecoveryStatus("failed");
        setRecoveryError(error?.message || "Unable to recover this project.");
      }
    })();
    return () => { cancelled = true; };
  }, [recoveryRequest]);
  const requestServerRecovery = () => {
    const projectId = recoveryProjectId.trim();
    if (!projectId) { setRecoveryError("Enter your existing project ID."); return; }
    setRecoveryRequest(projectId);
    setRecoveryStatus("loading");
  };
  const activeCreator = useMemo(() => CREATOR_OPTIONS.find((creator) => creator.id === selectedCreator) || null, [selectedCreator]);
  const projectJourneySnapshot = useMemo(() => projectJourney ? creatorJourneyEngine.createSnapshot(projectJourney) : null, [projectJourney]);
  const projectJourneyOrientation = useMemo(() => projectJourney ? creatorJourneyEngine.getOrientation(projectJourney) : null, [projectJourney]);
  const canonicalMovieJourneyStages = useMemo(() => Array.isArray(projectJourney?.stages) ? projectJourney.stages : [], [projectJourney]);
  const canonicalMovieActiveStage = projectJourneyOrientation?.present?.stage?.id || projectJourney?.currentStageId || "idea";
  const canonicalMovieCurrentStage = useMemo(() => canonicalMovieJourneyStages.find((stage) => stage?.id === canonicalMovieActiveStage) || null, [canonicalMovieJourneyStages, canonicalMovieActiveStage]);
  const canonicalMovieCurrentTask = useMemo(() => { const taskId = projectJourneyOrientation?.present?.task?.id || projectJourney?.currentTaskId || null; return (canonicalMovieCurrentStage?.tasks || []).find((task) => task?.id === taskId) || null; }, [canonicalMovieCurrentStage, projectJourneyOrientation, projectJourney]);
  const canonicalMovieNextTask = useMemo(() => { const tasks = Array.isArray(canonicalMovieCurrentStage?.tasks) ? canonicalMovieCurrentStage.tasks : []; const currentIndex = tasks.findIndex((task) => task?.id === canonicalMovieCurrentTask?.id); const remaining = currentIndex >= 0 ? tasks.slice(currentIndex + 1) : tasks; return remaining.find((task) => task?.status !== "completed-for-now") || null; }, [canonicalMovieCurrentStage, canonicalMovieCurrentTask]);
  const canonicalMovieNextStage = projectJourneyOrientation?.next?.nextStage || null;
  const canonicalMovieCompletedStages = useMemo(() => canonicalMovieJourneyStages.filter((stage) => stage?.status === "completed-for-now").map((stage) => stage.id), [canonicalMovieJourneyStages]);
  const movieJourneyPlanningContext = useMemo(() => projectJourney ? movieJourneyIntelligenceBridge.buildResponseContext(projectJourney, { journeyPlanningEvidence: movieJourneyPlanningEvidence }) : null, [projectJourney, movieJourneyPlanningEvidence]);
  const journeyRecommendationAction = useMemo(() => createJourneyRecommendationActionSurface({ projectId: activeMovieProject?.id || null, projectJourney, planningEvidence: movieJourneyPlanningEvidence, dismissedRecommendationId }), [activeMovieProject, projectJourney, movieJourneyPlanningEvidence, dismissedRecommendationId]);
  const journeyReady = Boolean(activeCreator) && Boolean(selectedCreatorMode) && !showCreatorChoices && !showCreatorModeChoices;
  const movieCockpitActive = journeyReady && selectedCreatorMode === "ai-movie" && Boolean(activeMovieProject?.id);

  const mentorContext = useMemo(() => ({ creatorName, creatorType: selectedCreator || null, creatorLabel: activeCreator?.label || null, creatorMode: selectedCreatorMode || null, creatorModeLabel: selectedCreatorModeLabel || null, creatorJourney, projectId: activeMovieProject?.id || null, creatorSessionId: identityRuntime.creatorSessionId, projectJourney: projectJourneySnapshot, projectJourneyOrientation, movieJourneyPlanningContext, journeyPlanningEvidence: movieJourneyPlanningEvidence, idea, projectStatus, hasGeneratedIdea: Boolean(generatedIdea) }), [creatorName, selectedCreator, activeCreator, selectedCreatorMode, selectedCreatorModeLabel, creatorJourney, activeMovieProject, identityRuntime, projectJourneySnapshot, projectJourneyOrientation, movieJourneyPlanningContext, movieJourneyPlanningEvidence, idea, projectStatus, generatedIdea]);

  const canGenerate = journeyReady && selectedCreatorMode !== "ai-movie" && Boolean(idea.trim()) && projectStatus !== "generating";
  const createProjectPayload = () => ({ projectId: activeMovieProject?.id || null, creatorSessionId: identityRuntime.creatorSessionId, creatorType: selectedCreator, creatorLabel: activeCreator?.label || selectedCreator, creatorMode: selectedCreatorMode || null, creatorModeLabel: selectedCreatorModeLabel || null, creatorJourney, projectJourney, projectJourneySnapshot, projectJourneyOrientation, movieJourneyPlanningEvidence, idea: idea.trim(), generatedIdea });
  const createMovieJourney = ({ creatorModeLabel, workingMode = creatorJourney } = {}) => creatorJourneyEngine.createMovieJourney({ creatorType: "video", creatorMode: "ai-movie", creatorJourney: workingMode, metadata: { creatorModeLabel: creatorModeLabel || "AI Movie Making", createdFrom: "CreatorWorkspace" } });

  const handleCreatorSelect = (creator) => { const creatorChanged = selectedCreator !== creator.id; setSelectedCreator(creator.id); setShowCreatorChoices(false); setShowCreatorModeChoices(true); if (creatorChanged) { setSelectedCreatorMode(""); setSelectedCreatorModeLabel(""); setIdea(""); setGeneratedIdea(""); setProjectStatus("idle"); setProjectJourney(null); setActiveMovieProject(null); setMovieMessages([]); setMovieJourneyPlanningEvidence(null); setDismissedRecommendationId(null); } const messages = { video: "Let's create something visual. Choose what you'd like to make, and we'll take it from there.", image: "Let's create something visual. Choose what kind of image you'd like to make, and we'll shape it together.", music: "Let's create something with music. Choose where you'd like to begin, and we'll build from there.", podcast: "Let's build your podcast project. Choose what you'd like to create, and we'll take it one step at a time.", story: "Let's build your story. Choose what you'd like to create, and we'll develop it together.", marketing: "Let's create something that gets attention. Choose the kind of marketing project you want to make.", social: "Let's create something for social media. Choose what you'd like to make, and we'll shape it together." }; setMentorMessage(messages[creator.id] || "Tell me what you'd like to create. We can shape the idea together."); };

  const handleCreatorModeSelect = async (mode) => { const modeChanged = selectedCreatorMode !== mode.id; setSelectedCreatorMode(mode.id); setSelectedCreatorModeLabel(mode.label); setShowCreatorModeChoices(false); if (mode.id === "ai-movie") { const existing = identityRuntime.getActiveProject(); const nextJourney = existing?.metadata?.projectJourney || createMovieJourney({ creatorModeLabel: mode.label }); let project = existing; if (!project) { const creation = await identityRuntime.ensureProjectWithSharedAuthority({ projectJourney: nextJourney, locks: globalThis?.navigator?.locks }); if (creation.acquired !== true) { setProjectStatus("error"); setMentorMessage("Your movie project could not be safely saved. Please try again in a browser that supports secure shared storage."); return; } project = identityRuntime.getActiveProject(); if (!project?.id) { setProjectStatus("error"); setMentorMessage("Your movie project could not be confirmed after saving. Please try again."); return; } } const continuation = existing ? identityRuntime.resumeProjectConversation(project.id) : { messages: [] }; setActiveMovieProject(project); setProjectJourney(nextJourney); setProjectStatus(existing ? "saved" : "creating"); setMovieMessages(continuation.messages || []); setMovieJourneyPlanningEvidence(null); setDismissedRecommendationId(null); /* Initial Journey is already committed under shared authority; no second synchronous write. */ } else if (modeChanged) { setActiveMovieProject(null); setProjectJourney(null); setProjectStatus("idle"); setMovieMessages([]); setMovieJourneyPlanningEvidence(null); setDismissedRecommendationId(null); } if (modeChanged) { setIdea(""); setGeneratedIdea(""); } const messages = { "ai-movie": "Welcome. You don't need to know how to make a movie. I'll help you through it one step at a time. Tell me the idea in your head—even if it's only one sentence.", "movie-scene": "Let's build your scene together. Tell me what you imagine happening, even if you only know one moment, character or location.", "music-video": "Let's turn your music into a visual story. Tell me about the song and anything you already imagine seeing on screen.", advert: "Let's create a video advert that gets attention. Tell me what you're promoting and the main thing you want people to remember.", "short-reel": "Let's make something short, clear and engaging. Tell me the idea, message or moment you want the Reel or Short to capture.", "lyric-video": "Let's bring your lyrics to life visually. Tell me about the song, its mood and any visual ideas you already have.", "animation-cartoon": "Let's build your animated world. Tell me the idea, character or scene you have in mind, even if it's only the beginning.", documentary: "Let's shape your documentary one step at a time. Tell me the real story, subject or question you want to explore." }; setMentorMessage(messages[mode.id] || `Great choice. Let's create your ${mode.label.toLowerCase()} together. Tell me what you already have in mind, even if it's only a rough idea.`); };

  const handleCreatorJourneyChange = async (nextWorkingMode) => {
    const currentJourney = projectJourney;
    const projectId = activeMovieProject?.id;
    if (!currentJourney || !projectId) {
      setProjectStatus("error");
      setMentorMessage("Your movie Journey could not be safely saved. Please reopen the project and try again.");
      return;
    }
    const nextJourney = { ...currentJourney, creatorJourney: nextWorkingMode, updatedAt: new Date().toISOString() };
    const result = await identityRuntime.persistJourneyWithSharedAuthority(projectId, nextJourney, {
      locks: globalThis?.navigator?.locks,
    });
    if (result.acquired !== true) {
      setProjectStatus("error");
      setMentorMessage("Your Journey change was not saved because exclusive storage authority was unavailable. Please try again.");
      return;
    }
    setCreatorJourney(nextWorkingMode);
    setProjectJourney(nextJourney);
  };
  const handleMovieMessage = (message) => {
    setMovieMessages((current) => [...current, message]);
    if (!activeMovieProject?.id) return;
    const journey = projectJourneySnapshot || projectJourney;
    if (message?.role === "mentor") {
      void identityRuntime
        .settleConversationMessage(activeMovieProject.id, message, { projectJourney: journey })
        .catch((error) => {
          console.error("CreatorWorkspace durable mentor settlement error:", error);
          setProjectStatus("error");
          setMentorMessage("Your conversation is still here, but I couldn't complete the durable conversation save just now. The pending creator turn has been kept for a safe retry.");
        });
      return;
    }
    identityRuntime.recordPendingCreatorMessage(activeMovieProject.id, message);
  };
  const handleMovieMentorTurnResult = async (turnResult) => { const projection = await projectCommittedCreatorAuthorityIntoJourney({ journeyEngine: creatorJourneyEngine, identityRuntime, projectJourney, projectId: activeMovieProject?.id || null, turnResult }); const authoritativeJourney = projection.projectJourney || projectJourney; if (projection.projected) setProjectJourney(authoritativeJourney); const planning = movieJourneyIntelligenceBridge.consumeTurnForJourneyPlanning(authoritativeJourney, turnResult, { source: "MovieMentorConversation", turnStatus: turnResult?.status || null, turnRevision: turnResult?.turnContextProof?.revision ?? null }); setMovieJourneyPlanningEvidence(planning.journeyPlanningEvidence || null); };

  const recoverAuthoritativeJourney = (projectId) => identityRuntime?.getPreferredJourney?.(projectId)?.projectJourney || null;

  const executeCreatorJourneyOperation = async ({ source, action, target, creatorActPrefix, operationPrefix, successMessage }) => {
    const projectId = activeMovieProject?.id || null;
    if (!projectId || !projectJourney) return null;
    try {
      const progressionInspection = journeyProgressionRuntime.inspect(projectJourney);
      if (progressionInspection?.status === "progression-recovery-required") throw Object.assign(new Error("Journey progression needs recovery before this action can continue."), { code: "JOURNEY_PROGRESSION_RECOVERY_REQUIRED" });
      const creatorActId = createCreatorActId(creatorActPrefix);
      const authorityEnvelope = issueJourneyPositionAuthority({ projectId, source, action, target, expectedPositionRevision: progressionInspection?.revision ?? 0, issuedAt: new Date().toISOString(), evidence: { creatorGesture: true, creatorActId } });
      const result = await journeyProgressionRuntime.execute({ projectId, projectJourney, authorityEnvelope, operationId: `${operationPrefix}:${creatorActId}` });
      if ((result?.status === "committed" || result?.status === "already-committed") && result?.projectJourney) { setProjectJourney(result.projectJourney); setMovieJourneyPlanningEvidence(null); if (successMessage) setMentorMessage(successMessage); }
      return result;
    } catch (error) {
      console.error("CreatorWorkspace Journey creator operation error:", error);
      const durableJourney = recoverAuthoritativeJourney(projectId);
      if (durableJourney) setProjectJourney(durableJourney);
      setMentorMessage("Your movie journey is safe. I couldn't commit that change just now, so your last saved Journey state is still in place.");
      return null;
    }
  };

  const handleAcceptJourneyRecommendation = async () => {
    const projectId = activeMovieProject?.id || null;
    if (!projectId || !journeyRecommendationAction) return;
    const creatorActId = createCreatorActId("journey-recommendation-accept");
    try {
      const result = await acceptCurrentJourneyRecommendation({ actionSurface: journeyRecommendationAction, acceptanceExecutionRuntime: recommendationAcceptanceRuntime, projectId, creatorActId, creatorAuthorityRevision: movieJourneyPlanningEvidence?.creatorAuthorityRevision ?? null, turnRevision: movieJourneyPlanningEvidence?.provenance?.turnRevision ?? null, clarificationRequired: movieJourneyPlanningEvidence?.clarification?.required === true, issuedAt: new Date().toISOString() });
      if (result?.projectJourney) setProjectJourney(result.projectJourney);
      if (["committed", "already-committed", "accepted-no-movement-required"].includes(result?.status)) { setMovieJourneyPlanningEvidence(null); setDismissedRecommendationId(result?.recommendationId || journeyRecommendationAction.recommendationId); setMentorMessage(result?.status === "accepted-no-movement-required" ? "You're already at that point in the Journey, so nothing needed to move." : "Done. You chose that direction, and your Journey has moved to the committed next step."); }
      return result;
    } catch (error) {
      console.error("CreatorWorkspace Journey recommendation acceptance error:", error);
      const durableJourney = recoverAuthoritativeJourney(projectId);
      if (durableJourney) setProjectJourney(durableJourney);
      setMovieJourneyPlanningEvidence(null);
      setMentorMessage("That suggestion is no longer safe to apply to your current Journey, so I left your saved position unchanged.");
      return null;
    }
  };

  const handleDismissJourneyRecommendation = () => { if (!journeyRecommendationAction) return; const dismissal = dismissCurrentJourneyRecommendation(journeyRecommendationAction); if (dismissal.recommendationId) setDismissedRecommendationId(dismissal.recommendationId); };
  const handleMovieStageSelect = async (stageId) => { if (!stageId || stageId === canonicalMovieActiveStage) return; await executeCreatorJourneyOperation({ source: POSITION_AUTHORITY_SOURCES.STAGE_CLICK_UI, action: POSITION_ACTIONS.SET_POSITION, target: { stageId }, creatorActPrefix: "journey-stage-click", operationPrefix: "journey-stage-selection" }); };
  const handleMovieTaskComplete = async () => { if (!canonicalMovieCurrentStage?.id || !canonicalMovieCurrentTask?.id || canonicalMovieCurrentTask?.status === "completed-for-now") return; await executeCreatorJourneyOperation({ source: POSITION_AUTHORITY_SOURCES.TASK_COMPLETION_UI, action: POSITION_ACTIONS.COMPLETE_TASK, target: { stageId: canonicalMovieCurrentStage.id, taskId: canonicalMovieCurrentTask.id }, creatorActPrefix: "journey-task-complete", operationPrefix: "journey-task-completion", successMessage: "That task is marked complete for now. You can choose what happens next when you're ready." }); };
  const handleMovieStageComplete = async () => { if (!canonicalMovieCurrentStage?.id || canonicalMovieCurrentStage?.status === "completed-for-now") return; await executeCreatorJourneyOperation({ source: POSITION_AUTHORITY_SOURCES.STAGE_COMPLETION_UI, action: POSITION_ACTIONS.COMPLETE_STAGE, target: { stageId: canonicalMovieCurrentStage.id }, creatorActPrefix: "journey-stage-complete", operationPrefix: "journey-stage-completion", successMessage: "That stage is marked complete for now. I haven't moved you anywhere else—the next step stays your choice." }); };
  const handleMovieContinueTask = async () => { if (!canonicalMovieCurrentTask || canonicalMovieCurrentTask.status !== "completed-for-now" || !canonicalMovieNextTask?.id || !canonicalMovieCurrentStage?.id) return; await executeCreatorJourneyOperation({ source: POSITION_AUTHORITY_SOURCES.STAGE_CLICK_UI, action: POSITION_ACTIONS.SET_POSITION, target: { stageId: canonicalMovieCurrentStage.id, taskId: canonicalMovieNextTask.id }, creatorActPrefix: "journey-continue-task", operationPrefix: "journey-task-continuation", successMessage: `You're now on “${canonicalMovieNextTask.label || canonicalMovieNextTask.id}”.` }); };
  const handleMovieContinueStage = async () => { if (canonicalMovieCurrentStage?.status !== "completed-for-now" || !canonicalMovieNextStage?.id) return; await executeCreatorJourneyOperation({ source: POSITION_AUTHORITY_SOURCES.STAGE_CLICK_UI, action: POSITION_ACTIONS.SET_POSITION, target: { stageId: canonicalMovieNextStage.id }, creatorActPrefix: "journey-continue-stage", operationPrefix: "journey-stage-continuation", successMessage: `You're now on “${canonicalMovieNextStage.label || canonicalMovieNextStage.id}”.` }); };
  const handleChangeCreator = () => { setShowCreatorChoices(true); setShowCreatorModeChoices(false); };
  const handleChangeCreatorMode = () => { setShowCreatorChoices(false); setShowCreatorModeChoices(true); };
  const handleGenerate = async () => { if (!canGenerate) { setMentorMessage("Choose what you would like to create, choose your Creator Mode, and tell me a little about your idea. We can shape the rest together."); return; } const request = { ...createProjectPayload(), projectJourney, projectJourneySnapshot, projectJourneyOrientation, movieJourneyContext: null, idea: idea.trim() }; setProjectStatus("generating"); setMentorMessage("Great—your idea is taking shape. I’m preparing the first version now."); try { const result = typeof onGenerate === "function" ? await onGenerate(request) : null; const generatedPreview = result?.prompt || result?.content || result?.preview || idea.trim(); setGeneratedIdea(generatedPreview); setProjectStatus("generated"); setMentorMessage("Your first version is ready. Take a look at the preview. Nothing is final—you can edit and develop it as much as you like."); } catch (error) { console.error("CreatorWorkspace generate error:", error); setProjectStatus("idle"); setMentorMessage("Nothing has been lost. I couldn’t complete that generation just now, but your idea is still here and ready to try again."); } };
  const handleSave = async () => { const project = createProjectPayload(); try { if (typeof onSave === "function") await onSave(project); setProjectStatus("saved"); setMentorMessage("Your project has been saved safely. You can return and continue whenever you are ready."); } catch (error) { console.error("CreatorWorkspace save error:", error); setMentorMessage("Your work is still here. The save did not complete, so please try once more when you're ready."); } };
  const handleEdit = () => { setProjectStatus("editing"); setMentorMessage("Let's keep developing it. Make any changes you need, then generate another version when you're ready."); if (typeof onEdit === "function") onEdit(createProjectPayload()); };
  const handlePublish = async () => { const project = createProjectPayload(); try { if (typeof onPublish === "function") await onPublish(project); setProjectStatus("published"); setMentorMessage("Your creation is ready for its audience. You brought the idea to life."); } catch (error) { console.error("CreatorWorkspace publish error:", error); setMentorMessage("Your creation is safe. Publishing did not complete, so nothing has been lost."); } };

  return (
    <main style={styles.workspace}>
      <section style={styles.welcomeSection}><p style={styles.eyebrow}>iBand Studio</p><h1 style={styles.title}>Welcome back, {creatorName}.</h1><p style={styles.subtitle}>What would you like to create today?</p></section>
      <section style={styles.section} aria-label="Recover an existing Movie Mentor project">
        <h2 style={styles.sectionTitle}>Recover an existing movie</h2>
        <p>Enter a project ID you already own. Recovery requires your current sign-in. This is a read-only preview until safe workspace adoption is verified.</p>
        <button type="button" onClick={() => { setRecoveryProjectId(""); setRecoveryRequest(null); setServerRecoveredPreview(null); setRecoveryStatus("idle"); setDiscoveryAttempt(attempt => attempt + 1); }} disabled={ownedProjectsStatus === "loading"}>Find my saved movies</button>
        {ownedProjectsStatus === "loading" && <p role="status">Finding movies belonging to your account…</p>}
        {ownedProjectsStatus === "failed" && <p role="alert">{ownedProjectsError}</p>}
        {ownedProjectsStatus === "ready" && ownedMovieProjects.length === 0 && <p role="status">No saved movies were found for this account.</p>}
        {ownedProjectsStatus === "ready" && ownedMovieProjects.length > 0 && <label>Choose one of your movies
          <select aria-label="Your saved movie projects" value={recoveryProjectId} onChange={event => { setRecoveryProjectId(event.target.value); setRecoveryRequest(null); setRecoveryStatus("idle"); setServerRecoveredPreview(null); }}>
            <option value="">Select a saved movie</option>
            {ownedMovieProjects.map(project => <option key={project.projectId} value={project.projectId}>{project.projectId}</option>)}
          </select>
        </label>}
        <input aria-label="Existing movie project ID" value={recoveryProjectId} onChange={(event) => { setRecoveryProjectId(event.target.value); setRecoveryRequest(null); setRecoveryStatus("idle"); setServerRecoveredPreview(null); }} placeholder="Existing project ID" />
        <button type="button" onClick={requestServerRecovery} disabled={recoveryStatus === "loading"}>Recover movie preview</button>
        {recoveryStatus === "loading" && <p role="status">Checking your saved movie…</p>}
        {recoveryStatus === "failed" && <p role="alert">{recoveryError}</p>}
        {recoveryError && recoveryStatus === "idle" && <p role="alert">{recoveryError}</p>}
        {serverRecoveredPreview && recoveryStatus === "preview-ready" && <div role="status">
          <h3>{serverRecoveredPreview.project.title || "Recovered movie"}</h3>
          <p>Saved stage: {serverRecoveredPreview.projectJourney.currentStageId || "unknown"}; task: {serverRecoveredPreview.projectJourney.currentTaskId || "unknown"}</p>
          <p>Saved revision: {serverRecoveredPreview.revision}. This is a read-only preview; editing is not enabled.</p>
          <ol>{serverRecoveredPreview.conversationMessages.map((message, index) => <li key={index}>{String(message?.content || message?.text || "")}</li>)}</ol>
        </div>}
      </section>
      <section style={styles.section}><AiMentor message={mentorMessage} creatorJourney={creatorJourney} mentorContext={mentorContext} journeyRecommendationAction={journeyRecommendationAction} onAcceptJourneyRecommendation={handleAcceptJourneyRecommendation} onDismissJourneyRecommendation={handleDismissJourneyRecommendation} /></section>
      {showCreatorChoices && <section style={styles.section}><div style={styles.sectionHeadingRow}><div><p style={styles.sectionEyebrow}>Quick Create</p><h2 style={styles.sectionTitle}>Choose your starting point</h2></div></div><div style={styles.creatorGrid}>{CREATOR_OPTIONS.map((creator) => { const isSelected = selectedCreator === creator.id; return <button key={creator.id} type="button" aria-pressed={isSelected} onClick={() => handleCreatorSelect(creator)} style={{ ...styles.creatorCard, ...(isSelected ? styles.creatorCardActive : {}) }}><span style={styles.creatorIcon}>{creator.icon}</span><span style={styles.creatorCopy}><span style={styles.creatorLabel}>{creator.label}</span><span style={styles.creatorDescription}>{creator.description}</span></span><span aria-hidden="true" style={{ ...styles.creatorArrow, ...(isSelected ? styles.creatorArrowActive : {}) }}>›</span></button>; })}</div></section>}
      {!showCreatorChoices && activeCreator && <section style={styles.section}><div style={styles.choiceSummary}><div style={styles.choiceSummaryCopy}><span style={styles.choiceSummaryEyebrow}>Starting Point</span><span style={styles.choiceSummaryValue}>{activeCreator.icon} {activeCreator.label}</span></div><button type="button" onClick={handleChangeCreator} style={styles.changeButton}>Change</button></div></section>}
      {!showCreatorChoices && activeCreator && showCreatorModeChoices && <section style={styles.section}><CreatorModeSelector creatorType={selectedCreator} selectedMode={selectedCreatorMode} onSelect={handleCreatorModeSelect} /></section>}
      {!showCreatorChoices && activeCreator && selectedCreatorMode && !showCreatorModeChoices && <section style={styles.section}><div style={styles.choiceSummary}><div style={styles.choiceSummaryCopy}><span style={styles.choiceSummaryEyebrow}>Creator Mode</span><span style={styles.choiceSummaryValue}>{selectedCreatorModeLabel}</span>{activeMovieProject?.id && <span style={styles.projectIdentity}>Project: {activeMovieProject.id}</span>}</div><button type="button" onClick={handleChangeCreatorMode} style={styles.changeButton}>Change</button></div></section>}
      {movieCockpitActive ? <section style={styles.section}><MovieMentorConversation creatorName={creatorName} projectId={activeMovieProject.id} projectIdentity={activeMovieProject.identity} creatorSessionId={identityRuntime.creatorSessionId} messages={movieMessages} journeyStages={canonicalMovieJourneyStages} activeStage={canonicalMovieActiveStage} completedStages={canonicalMovieCompletedStages} currentStage={canonicalMovieCurrentStage} currentTask={canonicalMovieCurrentTask} nextTask={canonicalMovieNextTask} nextStage={canonicalMovieNextStage} onStageSelect={handleMovieStageSelect} onCompleteTask={handleMovieTaskComplete} onCompleteStage={handleMovieStageComplete} onContinueTask={handleMovieContinueTask} onContinueStage={handleMovieContinueStage} onSendMessage={handleMovieMessage} onMentorTurnResult={handleMovieMentorTurnResult} /></section> : journeyReady ? <section style={styles.section}><MentorConversation creator={activeCreator} creatorMode={selectedCreatorMode} creatorModeLabel={selectedCreatorModeLabel} message={mentorMessage} idea={idea} projectStatus={projectStatus} creatorJourney={creatorJourney} onJourneyChange={handleCreatorJourneyChange} projectJourney={projectJourneySnapshot} projectJourneyOrientation={projectJourneyOrientation} /></section> : null}
      {journeyReady && selectedCreatorMode !== "ai-movie" && <section style={styles.section}><PromptBuilder creatorType={selectedCreator} creatorLabel={activeCreator.label} creatorMode={selectedCreatorMode} creatorModeLabel={selectedCreatorModeLabel} creatorJourney={creatorJourney} value={idea} projectStatus={projectStatus} onChange={(value) => { setIdea(value); if (projectStatus !== "idle" && projectStatus !== "generating") setProjectStatus("editing"); }} renderCreatorControls={() => typeof renderCreatorControls === "function" ? renderCreatorControls({ selectedCreator, activeCreator, selectedCreatorMode, selectedCreatorModeLabel, creatorJourney, projectJourney, projectJourneySnapshot, projectJourneyOrientation, idea, setIdea, projectStatus }) : null} /><GenerateButton creatorJourney={creatorJourney} onClick={handleGenerate} generating={projectStatus === "generating"} disabled={!canGenerate} /></section>}
      {selectedCreatorMode !== "ai-movie" && (generatedIdea || projectStatus === "generating") && <PreviewPanel creator={activeCreator} generatedIdea={generatedIdea} creatorJourney={creatorJourney} projectStatus={projectStatus} renderPreview={renderPreview} onSave={handleSave} onEdit={handleEdit} onPublish={handlePublish} />}
    </main>
  );
};

const styles = {
  workspace: { width: "100%", maxWidth: "760px", margin: "0 auto", padding: "22px 16px 120px", boxSizing: "border-box" },
  welcomeSection: { marginBottom: "22px" }, eyebrow: { margin: "0 0 6px", color: "#777d89", fontSize: "12px", fontWeight: "800", letterSpacing: "0.12em", textTransform: "uppercase" }, title: { margin: "0", color: "#111319", fontSize: "clamp(28px, 8vw, 42px)", lineHeight: "1.08", letterSpacing: "-0.04em" }, subtitle: { margin: "10px 0 0", color: "#616875", fontSize: "17px", lineHeight: "1.5" }, section: { marginTop: "18px" }, sectionHeadingRow: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }, sectionEyebrow: { margin: "0 0 4px", color: "#737a88", fontSize: "11px", fontWeight: "800", letterSpacing: "0.12em", textTransform: "uppercase" }, sectionTitle: { margin: "0", color: "#16181d", fontSize: "21px", lineHeight: "1.2", letterSpacing: "-0.025em" }, creatorGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))", gap: "10px" }, creatorCard: { width: "100%", minHeight: "92px", display: "flex", alignItems: "center", gap: "12px", padding: "15px", border: "1px solid rgba(20, 24, 32, 0.09)", borderRadius: "20px", background: "#ffffff", boxShadow: "0 8px 24px rgba(17, 24, 39, 0.05)", color: "#17191f", textAlign: "left", cursor: "pointer", WebkitTapHighlightColor: "transparent", transition: "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease" }, creatorCardActive: { border: "1px solid rgba(96, 77, 255, 0.52)", background: "linear-gradient(145deg, rgba(96, 77, 255, 0.1), rgba(255, 255, 255, 1))", boxShadow: "0 12px 30px rgba(96, 77, 255, 0.13)", transform: "translateY(-1px)" }, creatorIcon: { width: "46px", height: "46px", flexShrink: "0", display: "grid", placeItems: "center", borderRadius: "15px", background: "#f3f4f7", fontSize: "23px" }, creatorCopy: { minWidth: "0", display: "flex", flex: "1", flexDirection: "column", gap: "4px" }, creatorLabel: { fontSize: "15px", fontWeight: "800" }, creatorDescription: { color: "#69707c", fontSize: "12px", lineHeight: "1.4" }, creatorArrow: { color: "#b0b4bc", fontSize: "27px", lineHeight: "1" }, creatorArrowActive: { color: "#604dff" }, choiceSummary: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", padding: "15px 16px", boxSizing: "border-box", borderRadius: "18px", border: "1px solid rgba(96,77,255,0.2)", background: "linear-gradient(145deg, rgba(96,77,255,0.08), rgba(255,255,255,1))", boxShadow: "0 8px 24px rgba(17,24,39,0.04)" }, choiceSummaryCopy: { minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }, choiceSummaryEyebrow: { color: "#777d89", fontSize: "10px", fontWeight: "800", letterSpacing: "0.12em", textTransform: "uppercase" }, choiceSummaryValue: { color: "#17191f", fontSize: "16px", fontWeight: "800", lineHeight: "1.3" }, projectIdentity: { color: "#777d89", fontSize: "10px", overflowWrap: "anywhere" }, changeButton: { flexShrink: 0, appearance: "none", border: "1px solid rgba(96,77,255,0.22)", borderRadius: "999px", background: "#ffffff", color: "#5140d8", padding: "8px 12px", fontSize: "12px", fontWeight: "800", cursor: "pointer", WebkitTapHighlightColor: "transparent" },
};

export default CreatorWorkspace;
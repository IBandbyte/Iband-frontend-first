from pathlib import Path

conversation = Path("src/components/studio/mentor/MovieMentorConversation.jsx")
s = conversation.read_text()
old = "        turnContextProof: cloneValue(turn?.turnContextProof || null),\n        semanticIntelligence: cloneValue(turn?.semanticIntelligence || null),"
new = "        turnContextProof: cloneValue(turn?.turnContextProof || null),\n        postCommitCreatorAuthority: cloneValue(turn?.postCommitCreatorAuthority || null),\n        semanticIntelligence: cloneValue(turn?.semanticIntelligence || null),"
if "postCommitCreatorAuthority: cloneValue(turn?.postCommitCreatorAuthority || null)" not in s:
    assert old in s, "turnResult insertion anchor missing"
    s = s.replace(old, new, 1)
old = "          turnContextProof: turn.turnContextProof || null,\n          semanticIntelligence: turn.semanticIntelligence || null,"
new = "          turnContextProof: turn.turnContextProof || null,\n          postCommitCreatorAuthority: turn.postCommitCreatorAuthority || null,\n          semanticIntelligence: turn.semanticIntelligence || null,"
if "postCommitCreatorAuthority: turn.postCommitCreatorAuthority || null" not in s:
    assert old in s, "mentor metadata insertion anchor missing"
    s = s.replace(old, new, 1)
conversation.write_text(s)

workspace = Path("src/components/studio/CreatorWorkspace.jsx")
s = workspace.read_text()
anchor = 'import createMovieMentorStudioIdentityRuntime from "./mentor/MovieMentorStudioIdentityRuntime.js";'
projection_import = 'import projectCommittedCreatorAuthorityIntoJourney from "./mentor/MovieMentorJourneyProjectionRuntime.js";'
if projection_import not in s:
    assert anchor in s, "workspace import anchor missing"
    s = s.replace(anchor, anchor + "\n" + projection_import, 1)
old = '''  const handleMovieMentorTurnResult = (turnResult) => {
    const planning = movieJourneyIntelligenceBridge.consumeTurnForJourneyPlanning(
      projectJourney,
      turnResult,
      {
        source: "MovieMentorConversation",
        turnStatus: turnResult?.status || null,
        turnRevision: turnResult?.turnContextProof?.revision ?? null,
      }
    );
    setMovieJourneyPlanningEvidence(planning.journeyPlanningEvidence || null);
  };'''
new = '''  const handleMovieMentorTurnResult = (turnResult) => {
    const projection = projectCommittedCreatorAuthorityIntoJourney({
      journeyEngine: creatorJourneyEngine,
      identityRuntime,
      projectJourney,
      projectId: activeMovieProject?.id || null,
      turnResult,
    });
    const authoritativeJourney = projection.projectJourney || projectJourney;
    if (projection.projected) setProjectJourney(authoritativeJourney);

    const planning = movieJourneyIntelligenceBridge.consumeTurnForJourneyPlanning(
      authoritativeJourney,
      turnResult,
      {
        source: "MovieMentorConversation",
        turnStatus: turnResult?.status || null,
        turnRevision: turnResult?.turnContextProof?.revision ?? null,
      }
    );
    setMovieJourneyPlanningEvidence(planning.journeyPlanningEvidence || null);
  };'''
if "projectCommittedCreatorAuthorityIntoJourney({" not in s:
    assert old in s, "workspace handler anchor missing"
    s = s.replace(old, new, 1)
workspace.write_text(s)

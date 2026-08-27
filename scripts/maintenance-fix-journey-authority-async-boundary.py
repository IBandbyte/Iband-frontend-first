from pathlib import Path

workspace = Path('src/components/studio/CreatorWorkspace.jsx')
conversation = Path('src/components/studio/mentor/MovieMentorConversation.jsx')

workspace_text = workspace.read_text()
conversation_text = conversation.read_text()

old_workspace = 'const handleMovieMentorTurnResult = (turnResult) => { const projection = projectCommittedCreatorAuthorityIntoJourney({ journeyEngine: creatorJourneyEngine, identityRuntime, projectJourney, projectId: activeMovieProject?.id || null, turnResult }); const authoritativeJourney = projection.projectJourney || projectJourney;'
new_workspace = 'const handleMovieMentorTurnResult = async (turnResult) => { const projection = await projectCommittedCreatorAuthorityIntoJourney({ journeyEngine: creatorJourneyEngine, identityRuntime, projectJourney, projectId: activeMovieProject?.id || null, turnResult }); const authoritativeJourney = projection.projectJourney || projectJourney;'

old_conversation = 'onMentorTurnResult?.(turnResult); onSendMessage?.({ id: createId("mentor-message")'
new_conversation = 'await onMentorTurnResult?.(turnResult); onSendMessage?.({ id: createId("mentor-message")'

if workspace_text.count(old_workspace) != 1:
    raise SystemExit(f'Expected exactly one Workspace async seam, found {workspace_text.count(old_workspace)}')
if conversation_text.count(old_conversation) != 1:
    raise SystemExit(f'Expected exactly one Conversation async seam, found {conversation_text.count(old_conversation)}')

workspace.write_text(workspace_text.replace(old_workspace, new_workspace, 1))
conversation.write_text(conversation_text.replace(old_conversation, new_conversation, 1))

print('Journey Authority async callback boundary patched successfully.')

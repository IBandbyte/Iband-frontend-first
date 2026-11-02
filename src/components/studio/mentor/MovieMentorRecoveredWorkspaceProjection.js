const clean=value=>typeof value==="string"?value.trim():"";
const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
function invalid(reason){throw Object.assign(new Error(reason),{code:"MOVIE_MENTOR_RECOVERY_PROJECTION_INVALID"});}
function projectRecoveredCreatorWorkspace({projectId,state}={}){
 const pid=clean(projectId);
 if(!pid||clean(state?.projectId)!==pid)invalid("Recovered project identity does not match requested project.");
 if(!Number.isSafeInteger(state.revision)||state.revision<1||!Number.isSafeInteger(state.creatorStateGeneration)||state.creatorStateGeneration<1)invalid("Recovered revision or generation is invalid.");
 const journey=state.projectJourney;
 if(!journey||typeof journey!=="object"||Array.isArray(journey)||clean(journey.projectId)&&clean(journey.projectId)!==pid)invalid("Recovered journey has a conflicting project identity.");
 const confirmed=Array.isArray(state.creatorConfirmedContext)?state.creatorConfirmedContext:[];
 const projectEntry=confirmed.find(entry=>entry?.key==="project"&&entry.value?.id===pid)?.value;
 if(!projectEntry||projectEntry.creatorType!=="video"||projectEntry.metadata?.creatorMode!=="ai-movie")invalid("Recovered state does not include a confirmed AI movie project.");
 const confirmedJourney=projectEntry.metadata?.projectJourney;
 if(confirmedJourney!==undefined&&confirmedJourney!==null&&(typeof confirmedJourney!=="object"||Array.isArray(confirmedJourney)))invalid("Confirmed project journey is malformed.");
 if(clean(confirmedJourney?.projectId)&&clean(confirmedJourney.projectId)!==pid)invalid("Confirmed project journey belongs to a different project.");
 const preferredJourney=confirmedJourney&&typeof confirmedJourney==="object"?confirmedJourney:{};
 const recoveredJourney={...clone(journey),...clone(preferredJourney)};
 if(clean(recoveredJourney.projectId)&&clean(recoveredJourney.projectId)!==pid)invalid("Recovered journey conflicts with the requested project.");
 const project={...clone(projectEntry),id:pid,metadata:{...clone(projectEntry.metadata),projectJourney:clone(recoveredJourney)}};
 const context=state.memoryContext&&typeof state.memoryContext==="object"?state.memoryContext:{};
 const conversations=Array.isArray(context.conversations)?context.conversations:[];
 if(conversations.some(message=>clean(message?.projectId)&&clean(message.projectId)!==pid))invalid("Recovered conversation belongs to a different project.");
 return Object.freeze({project:clone(project),projectJourney:clone(recoveredJourney),conversationMessages:clone(conversations),revision:state.revision,creatorStateGeneration:state.creatorStateGeneration});
}
export{projectRecoveredCreatorWorkspace};
export default projectRecoveredCreatorWorkspace;

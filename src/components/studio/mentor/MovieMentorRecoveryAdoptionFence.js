const clean=value=>typeof value==="string"?value.trim():"";
function deny(reason){return Object.freeze({allowed:false,reason});}
function assessMovieMentorRecoveryAdoption({projectId,recovered,localState}={}){
 const pid=clean(projectId);
 if(!pid||clean(recovered?.project?.id)!==pid)return deny("project-identity-mismatch");
 if(recovered.project.creatorType!=="video"||recovered.project.metadata?.creatorMode!=="ai-movie")return deny("not-confirmed-ai-movie");
 if(!Number.isSafeInteger(recovered.revision)||recovered.revision<1||!Number.isSafeInteger(recovered.creatorStateGeneration)||recovered.creatorStateGeneration<1)return deny("invalid-authoritative-revision");
 if(!localState||typeof localState!=="object"||Array.isArray(localState))return deny("local-state-unavailable");
 const collections=["projects","conversations","projectMemories","sessionHandoffs","ideas","observations","patterns","milestones","reflections","deferredMemories"];
 for(const key of collections){
   const records=localState[key];
   if(records!==undefined&&!Array.isArray(records))return deny("invalid-local-"+key);
   if(Array.isArray(records)&&records.length>0)return deny("local-work-must-be-preserved");
 }
 const localJourney=localState.journey;
 if(localJourney&&typeof localJourney==="object"&&!Array.isArray(localJourney)){
   const progressed=Object.keys(localJourney).some(key=>!["activeProjectId","firstSeenAt","lastSeenAt"].includes(key)&&localJourney[key]!==null&&localJourney[key]!==undefined&&localJourney[key]!==""&&!(Array.isArray(localJourney[key])&&localJourney[key].length===0));
   if(progressed)return deny("local-journey-progress-must-be-preserved");
 }
 const creatorProfile=localState.creatorProfile;
 if(creatorProfile!==undefined){
   if(!creatorProfile||typeof creatorProfile!=="object"||Array.isArray(creatorProfile))return deny("invalid-local-creator-profile");
   if(Object.keys(creatorProfile).some(key=>key!=="id"&&creatorProfile[key]!==null&&creatorProfile[key]!==undefined&&creatorProfile[key]!==""&&!(Array.isArray(creatorProfile[key])&&creatorProfile[key].length===0)))return deny("local-creator-profile-must-be-preserved");
 }
 if(localState.metadata&&typeof localState.metadata==="object"&&localState.metadata.pendingLocalChanges===true)return deny("local-metadata-must-be-preserved");
 const active=clean(localState.journey?.activeProjectId);
 if(active&&active!==pid)return deny("different-active-local-project");
 if(localState.journey!==undefined&&(typeof localState.journey!=="object"||localState.journey===null||Array.isArray(localState.journey)))return deny("invalid-local-journey");
 return Object.freeze({allowed:true,reason:"empty-local-workspace-only",projectId:pid,revision:recovered.revision,creatorStateGeneration:recovered.creatorStateGeneration});
}
export{assessMovieMentorRecoveryAdoption};
export default assessMovieMentorRecoveryAdoption;

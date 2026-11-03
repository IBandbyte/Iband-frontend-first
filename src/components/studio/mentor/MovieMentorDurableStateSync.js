import { getMovieMentorCreatorAuthToken } from "./MovieMentorCreatorAuthenticationTransport.js";

const MOVIE_MENTOR_DURABLE_STATE_SYNC_VERSION="1.2.2";
const REVISION_KEY_PREFIX="iband.movie-mentor.durable-revision";
const STATUS_KEY_PREFIX="iband.movie-mentor.durable-sync-status";
const CREATOR_MEMORY_KEY_PREFIX="iband.creator-memory";
const pendingByIdentity=new Map();
const inFlightByIdentity=new Map();
let bridgeInstalled=false;
function s(v){return typeof v==="string"?v.trim():"";}
function clone(v){if(v===undefined)return undefined;try{return JSON.parse(JSON.stringify(v));}catch{return v;}}
function apiBase(){return s(import.meta?.env?.VITE_API_BASE_URL||import.meta?.env?.VITE_BACKEND_URL||"").replace(/\/$/,"");}
function identityKey(projectId,creatorSessionId){return s(projectId)||`session:${s(creatorSessionId)}`;}
function revisionKey(projectId,creatorSessionId){return `${REVISION_KEY_PREFIX}:${identityKey(projectId,creatorSessionId)}`;}
function statusKey(projectId,creatorSessionId){return `${STATUS_KEY_PREFIX}:${identityKey(projectId,creatorSessionId)}`;}
function getExpectedRevision({projectId,creatorSessionId,storage=globalThis?.localStorage}={}){try{const value=Number(storage?.getItem?.(revisionKey(projectId,creatorSessionId)));return Number.isSafeInteger(value)&&value>=0?value:0;}catch{return 0;}}
function rememberRevision({projectId,creatorSessionId,revision,storage=globalThis?.localStorage}={}){if(!Number.isSafeInteger(revision)||revision<0)return;try{storage?.setItem?.(revisionKey(projectId,creatorSessionId),String(revision));}catch{}}
function writeStatus({projectId,creatorSessionId,status,storage=globalThis?.localStorage,error=null,revision=null}={}){const value={status,projectId:s(projectId)||null,creatorSessionId:s(creatorSessionId)||null,revision:Number.isSafeInteger(revision)?revision:null,error:error?{code:s(error.code)||null,message:s(error.message)||String(error)}:null,updatedAt:new Date().toISOString()};try{storage?.setItem?.(statusKey(projectId,creatorSessionId),JSON.stringify(value));}catch{}return value;}
function getDurableSyncStatus({projectId,creatorSessionId,storage=globalThis?.localStorage}={}){try{const raw=storage?.getItem?.(statusKey(projectId,creatorSessionId));return raw?JSON.parse(raw):null;}catch{return null;}}
function projectMemoryContext(memoryState,projectId){const pid=s(projectId);const relevant=(items=[])=>items.filter(item=>{const direct=s(item?.projectId||item?.relatedProjectId||item?.metadata?.projectId);const related=Array.isArray(item?.relatedProjectIds)?item.relatedProjectIds.map(s):[];return !direct&&!related.length||direct===pid||related.includes(pid);});return{creatorProfile:clone(memoryState?.creatorProfile||null),ideas:clone(relevant(memoryState?.ideas||[])),projectMemories:clone(relevant(memoryState?.projectMemories||[])),sessionHandoffs:clone(relevant(memoryState?.sessionHandoffs||[])),conversations:clone(relevant(memoryState?.conversations||[])),observations:clone(relevant(memoryState?.observations||[])),patterns:clone(relevant(memoryState?.patterns||[])),milestones:clone(relevant(memoryState?.milestones||[])),reflections:clone(relevant(memoryState?.reflections||[])),deferredMemories:clone(relevant(memoryState?.deferredMemories||[]))};}
function creatorConfirmedContext(memoryState,projectId){const pid=s(projectId);const project=(memoryState?.projects||[]).find(p=>s(p?.id||p?.projectId)===pid)||null;return[{key:"creatorProfile",value:clone(memoryState?.creatorProfile||null),source:"creator-memory",certainty:"confirmed"},{key:"project",value:clone(project),source:"creator-memory",certainty:"confirmed"}].filter(x=>x.value!==null);}
function syncIdentityFromMemory(memoryState={}){const projectId=s(memoryState?.journey?.activeProjectId)||s((memoryState?.projects||[]).find(p=>p?.active===true)?.id)||null;const creatorSessionId=!projectId?s(memoryState?.creatorProfile?.id)||null:null;return{projectId,creatorSessionId};}
// Explicit publishing remains disabled until a coordinated, non-forgeable
// creator-write authority is wired through the actual writer and recovery
// paths. A bearer token, caller-supplied snapshot or localStorage status is
// not evidence of exclusive write authority.
function syncAuthorityError(){return Object.assign(new Error("Creator Memory publication requires certified coordinated writer authority."),{code:"MOVIE_MENTOR_DURABLE_SYNC_WRITE_AUTHORITY_REQUIRED"});}
async function syncMovieMentorDurableState(){throw syncAuthorityError();}
async function drainIdentity(){return null;}
function enqueueMovieMentorDurableStateSync(){return null;}
async function flushMovieMentorDurableStateSync({projectId,creatorSessionId,fetchImpl=globalThis?.fetch,storage=globalThis?.localStorage,getAuthToken=getMovieMentorCreatorAuthToken}={}){const key=identityKey(projectId,creatorSessionId);await drainIdentity(key,{fetchImpl,storage,getAuthToken});return getDurableSyncStatus({projectId,creatorSessionId,storage});}
// Deliberately inert compatibility entry point. A localStorage mutation or
// startup replay cannot establish coordinated creator-write authority.
// Publishing must be migrated to an explicitly authorised writer path.
function installCreatorMemoryDurableSyncBridge(){return false;}
async function recoverMovieMentorCreatorState({projectId,fetchImpl=globalThis?.fetch,getAuthToken=getMovieMentorCreatorAuthToken}={}){
  const pid=s(projectId);
  if(!pid)throw Object.assign(new Error("Recovery requires an established project identity."),{code:"MOVIE_MENTOR_CREATOR_PROJECT_REQUIRED"});
  if(typeof fetchImpl!=="function"||typeof getAuthToken!=="function")throw Object.assign(new Error("Authenticated recovery transport is unavailable."),{code:"MOVIE_MENTOR_RECOVERY_TRANSPORT_UNAVAILABLE"});
  const token=s(await getAuthToken());
  if(!token)throw Object.assign(new Error("Recovery requires creator authentication."),{code:"MOVIE_MENTOR_AUTH_CREDENTIAL_REQUIRED"});
  const response=await fetchImpl(`${apiBase()}/api/movie-mentor/state/recovery/${encodeURIComponent(pid)}`,{method:"GET",headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw Object.assign(new Error(payload?.message||"Creator state recovery failed."),{code:payload?.code||"MOVIE_MENTOR_RECOVERY_FAILED",status:response.status});
  const state=payload?.state;
  if(payload?.success!==true||state?.projectId!==pid||!Number.isSafeInteger(state.revision)||state.revision<1||!Number.isSafeInteger(state.creatorStateGeneration)||state.creatorStateGeneration<1)throw Object.assign(new Error("Recovered creator state failed project or revision validation."),{code:"MOVIE_MENTOR_RECOVERY_INVALID_ACKNOWLEDGEMENT"});
  return clone(state);
}
async function listOwnedMovieMentorProjects({fetchImpl=globalThis?.fetch,getAuthToken=getMovieMentorCreatorAuthToken}={}){
  if(typeof fetchImpl!=="function"||typeof getAuthToken!=="function")throw Object.assign(new Error("Authenticated project discovery transport is unavailable."),{code:"MOVIE_MENTOR_DISCOVERY_TRANSPORT_UNAVAILABLE"});
  const token=s(await getAuthToken());
  if(!token)throw Object.assign(new Error("Project discovery requires creator authentication."),{code:"MOVIE_MENTOR_AUTH_CREDENTIAL_REQUIRED"});
  const response=await fetchImpl(`${apiBase()}/api/movie-mentor/projects/owned`,{method:"GET",headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw Object.assign(new Error(payload?.message||"Owned-project discovery failed."),{code:payload?.code||"MOVIE_MENTOR_DISCOVERY_FAILED",status:response.status});
  if(payload?.success!==true||!Array.isArray(payload.projects)||payload.projects.some(project=>!project||typeof project.projectId!=="string"||!s(project.projectId)))throw Object.assign(new Error("Owned-project discovery returned an invalid acknowledgement."),{code:"MOVIE_MENTOR_DISCOVERY_INVALID_ACKNOWLEDGEMENT"});
  const ids=new Set();
  for(const project of payload.projects){if(ids.has(project.projectId))throw Object.assign(new Error("Owned-project discovery returned duplicate identities."),{code:"MOVIE_MENTOR_DISCOVERY_INVALID_ACKNOWLEDGEMENT"});ids.add(project.projectId);}
  return clone(payload.projects);
}
export{listOwnedMovieMentorProjects,recoverMovieMentorCreatorState,MOVIE_MENTOR_DURABLE_STATE_SYNC_VERSION,getExpectedRevision,rememberRevision,getDurableSyncStatus,projectMemoryContext,creatorConfirmedContext,syncIdentityFromMemory,syncMovieMentorDurableState,enqueueMovieMentorDurableStateSync,flushMovieMentorDurableStateSync,installCreatorMemoryDurableSyncBridge};
export default syncMovieMentorDurableState;

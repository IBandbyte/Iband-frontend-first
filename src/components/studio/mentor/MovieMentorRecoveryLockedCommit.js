import {withMovieMentorMemoryWriteAuthority, MOVIE_MENTOR_SHARED_MEMORY_WRITE_COORDINATION} from "./MovieMentorMemoryWriteAuthority.js";
import {prepareMovieMentorRecoveryAdoption,confirmMovieMentorRecoveryAdoption} from "./MovieMentorRecoveryAdoptionTransaction.js";
const deny=reason=>Object.freeze({allowed:false,reason});
const clone=value=>JSON.parse(JSON.stringify(value));
async function commitMovieMentorRecoveryWithLock({projectId,recovered,readLocalState,commit,locks,beforeCommit}={}){
 if(typeof readLocalState!=="function"||typeof commit!=="function"||!locks||typeof locks.request!=="function")return deny("lock-or-storage-unavailable");
 try{
  const authority=await withMovieMentorMemoryWriteAuthority({locks,operation:async()=>{
   const original=readLocalState();
   const prepared=prepareMovieMentorRecoveryAdoption({projectId,recovered,localState:original});
   if(!prepared.allowed)return prepared;
   if(typeof beforeCommit==="function")await beforeCommit();
   const fresh=readLocalState();
   const confirmed=confirmMovieMentorRecoveryAdoption({prepared,projectId,recovered,localState:fresh});
   if(!confirmed.allowed)return confirmed;
   const next=clone(fresh);
   next.projects=[clone(recovered.project)];
   next.journey={...next.journey,activeProjectId:projectId};
   await commit(next);
   return Object.freeze({allowed:true,reason:"committed-under-exclusive-lock",projectId,revision:recovered.revision});
  }});
  return authority.acquired ? authority.value : deny(authority.reason);
 }catch{return deny("recovery-lock-or-commit-failed");}
}
export{commitMovieMentorRecoveryWithLock};

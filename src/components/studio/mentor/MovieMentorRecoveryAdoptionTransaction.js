import {assessMovieMentorRecoveryAdoption} from "./MovieMentorRecoveryAdoptionFence.js";
const clone=value=>JSON.parse(JSON.stringify(value));
const deny=reason=>Object.freeze({allowed:false,reason});
function prepareMovieMentorRecoveryAdoption({projectId,recovered,localState}={}){
 const assessment=assessMovieMentorRecoveryAdoption({projectId,recovered,localState});
 if(!assessment.allowed)return assessment;
 return Object.freeze({...assessment,localSnapshot:JSON.stringify(localState)});
}
function confirmMovieMentorRecoveryAdoption({prepared,projectId,recovered,localState}={}){
 if(prepared?.allowed!==true||typeof prepared.localSnapshot!=="string")return deny("adoption-not-prepared");
 const assessment=assessMovieMentorRecoveryAdoption({projectId,recovered,localState});
 if(!assessment.allowed)return assessment;
 if(prepared.projectId!==assessment.projectId||prepared.revision!==assessment.revision||prepared.creatorStateGeneration!==assessment.creatorStateGeneration)return deny("recovery-authority-changed");
 if(JSON.stringify(localState)!==prepared.localSnapshot)return deny("local-state-changed-after-preparation");
 return Object.freeze({...assessment,localState:clone(localState)});
}
export{prepareMovieMentorRecoveryAdoption,confirmMovieMentorRecoveryAdoption};

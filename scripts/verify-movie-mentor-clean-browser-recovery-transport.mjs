import assert from "node:assert/strict";
import {recoverMovieMentorCreatorState} from "../src/components/studio/mentor/MovieMentorDurableStateSync.js";
const emptyStorage={getItem(){throw Error("Recovery must not read old localStorage");},setItem(){throw Error("Recovery must not write old localStorage");}};
const previous=globalThis.localStorage;
Object.defineProperty(globalThis,"localStorage",{configurable:true,value:emptyStorage});
const state={projectId:"film-alpha",revision:4,creatorStateGeneration:4,projectJourney:{currentStageId:"story",currentTaskId:"outline"},memoryContext:{notes:"Scene preserved"}};
let calls=0;
const fetchImpl=async(url,options)=>{calls++;assert.match(url,/\/api\/movie-mentor\/state\/recovery\/film-alpha$/);assert.equal(options.method,"GET");assert.equal(options.headers.Authorization,"Bearer owner-token");return{ok:true,json:async()=>({success:true,state})};};
try{
 const result=await recoverMovieMentorCreatorState({projectId:"film-alpha",getAuthToken:async()=>"owner-token",fetchImpl});
 assert.deepEqual(result.projectJourney,state.projectJourney);
 assert.deepEqual(result.memoryContext,state.memoryContext);
 assert.equal(calls,1);
 await assert.rejects(recoverMovieMentorCreatorState({projectId:"film-beta",getAuthToken:async()=>"owner-token",fetchImpl:async()=>({ok:true,json:async()=>({success:true,state})})}),{code:"MOVIE_MENTOR_RECOVERY_INVALID_ACKNOWLEDGEMENT"});
 await assert.rejects(recoverMovieMentorCreatorState({projectId:"film-alpha",getAuthToken:async()=>"",fetchImpl}),{code:"MOVIE_MENTOR_AUTH_CREDENTIAL_REQUIRED"});
 console.log("GREEN: empty-storage authenticated GET transport, correct-project state and rejection cases.");
}finally{if(previous===undefined)delete globalThis.localStorage;else Object.defineProperty(globalThis,"localStorage",{configurable:true,value:previous});}

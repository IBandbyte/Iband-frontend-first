import assert from "node:assert/strict";
import createCreatorMemory, {createMemoryStorageAdapter,hasStrictCreatorMemoryAuthority} from "../src/components/studio/mentor/CreatorMemory.js";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";
import {MOVIE_MENTOR_SHARED_MEMORY_WRITE_COORDINATION} from "../src/components/studio/mentor/MovieMentorMemoryWriteAuthority.js";

// Migration court, separate from the historical permissive compatibility court.
// Real Studio runtime methods must preserve project and Journey across mounts
// using strict facades and a shared exclusive browser lock.
const storage=createMemoryStorageAdapter();
const projectCrypto={randomUUID:()=>"aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"};
let sessionIssue=0;
const sessionCrypto={randomUUID:()=>++sessionIssue===1?"11111111-2222-4333-8444-555555555555":"aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"};
const calls=[];
const locks={async request(name,options,callback){
  calls.push({name,options});
  assert.equal(name,MOVIE_MENTOR_SHARED_MEMORY_WRITE_COORDINATION);
  assert.equal(options?.mode,"exclusive");
  return callback({name,mode:"exclusive"});
}};
const memoryA=createCreatorMemory({storageAdapter:storage,projectIdentityCrypto:projectCrypto,requireSharedWriteAuthority:true});
assert.equal(hasStrictCreatorMemoryAuthority(memoryA),true);
const runtimeA=createMovieMentorStudioIdentityRuntime({memory:memoryA,cryptoImpl:sessionCrypto,settlementLockManager:locks});
const journey={id:"journey-1",creatorJourney:"guide",currentStageId:"idea"};
const created=await runtimeA.ensureProjectWithSharedAuthority({projectJourney:journey,title:"Continuity Movie"});
assert.equal(created.acquired,true);
const project=runtimeA.getActiveProject();
assert.equal(project?.id,"movie-project-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
const persisted=await runtimeA.persistJourneyWithSharedAuthority(project.id,{...journey,currentStageId:"characters"});
assert.equal(persisted.acquired,true);
assert.equal(calls.length,2);
const memoryB=createCreatorMemory({storageAdapter:storage,projectIdentityCrypto:projectCrypto,requireSharedWriteAuthority:true});
assert.equal(hasStrictCreatorMemoryAuthority(memoryB),true);
const runtimeB=createMovieMentorStudioIdentityRuntime({memory:memoryB,cryptoImpl:{randomUUID:()=>"66666666-7777-4888-8999-aaaaaaaaaaaa"}});
const resumed=runtimeB.getResumeSnapshot();
assert.equal(resumed?.projectId,project.id);
assert.equal(resumed?.projectJourney?.currentStageId,"characters");
assert.notEqual(runtimeB.creatorSessionId,runtimeA.creatorSessionId);
// Strict synchronous mutation must not become an alternate persistence path.
const before=storage.getItem("iband.creator-memory");
assert.throws(()=>memoryB.replaceState(memoryB.getState()),error=>error?.cause?.code==="CREATOR_MEMORY_WRITE_AUTHORITY_DENIED");
assert.equal(storage.getItem("iband.creator-memory"),before);
console.log("GREEN: strict Studio cockpit migrates coordinated project and Journey across mounts; sync bypass denied.");

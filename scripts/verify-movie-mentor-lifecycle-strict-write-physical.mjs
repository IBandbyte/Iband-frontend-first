import assert from "node:assert/strict";
import createCreatorMemory,{createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";
import {executeJourneyRecommendationLifecycleRecovery} from "../src/components/studio/mentor/JourneyRecommendationLifecycleRecovery.js";
import {persistJourneyAndRecommendationLifecycle,consumeRecommendationWithoutMovement} from "../src/components/studio/mentor/JourneyRecommendationLifecyclePersistence.js";

const KEY="iband.creator-memory";
const DOMAIN="iband.movie-mentor.journey-recommendation-reference";
const projectId="lifecycle-strict-court";
function fixture(issuedRevision=1) {
  const storage=createMemoryStorageAdapter();
  const initial=createCreatorMemory({storageAdapter:storage}).getState();
  const journey={progression:{revision:1,committedOperations:[]}};
  const state={...initial,
    projects:[...(initial.projects||[]),{id:projectId,title:"Lifecycle authority court",identity:{id:projectId},metadata:{creatorMode:"ai-movie",projectJourney:journey}}],
    projectMemories:[...(initial.projectMemories||[]),{id:"reference-court",projectId,metadata:{recommendationReference:{
      domain:DOMAIN,projectId,recommendationId:"rec-court",recommendationFingerprint:"fingerprint-court",
      issuedAgainst:{progressionRevision:issuedRevision},lifecycle:{current:true}
    }}}]
  };
  storage.setItem(KEY,JSON.stringify(state));
  const memory=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
  return {storage,memory,journey};
}
function denied(label,run,fixtureData) {
  const before=fixtureData.storage.getItem(KEY);
  let error;
  try { run(); } catch(caught) { error=caught; }
  assert.ok(error, `RED: ${label} allowed uncoordinated synchronous lifecycle commit`);
  const chain=[error,error?.cause,error?.cause?.cause];
  assert.ok(chain.some(e=>e?.code==="CREATOR_MEMORY_WRITE_AUTHORITY_DENIED"),
    `RED: ${label} failed for a different reason: ${error?.code||error?.message}`);
  assert.equal(fixtureData.storage.getItem(KEY),before,`RED: ${label} modified durable bytes`);
  console.log(`GREEN: ${label} reached strict Creator Memory write fence; durable bytes unchanged.`);
}
{
  const f=fixture(0);
  denied("lifecycle recovery repair",()=>executeJourneyRecommendationLifecycleRecovery({
    identityRuntime:{memory:f.memory},projectId
  }),f);
}
{
  const f=fixture(1);
  denied("Journey and lifecycle progression",()=>persistJourneyAndRecommendationLifecycle({
    identityRuntime:{memory:f.memory},projectId,
    candidateJourney:{progression:{revision:2,committedOperations:[]}},
    expectedProgressionRevision:1
  }),f);
}
{
  const f=fixture(1);
  denied("no-movement recommendation consumption",()=>consumeRecommendationWithoutMovement({
    identityRuntime:{memory:f.memory},projectId,recommendationId:"rec-court",
    recommendationFingerprint:"fingerprint-court",expectedProgressionRevision:1,
    operationId:"operation-court",creatorActId:"creator-act-court"
  }),f);
}
console.log("GREEN: three synchronous lifecycle persistence seams fail closed with strict memory; legacy permissive writers remain independently uncertified.");

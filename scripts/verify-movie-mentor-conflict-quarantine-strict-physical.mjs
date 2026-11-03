import assert from "node:assert/strict";
import createCreatorMemory,{createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";
import quarantineJourneyRecommendationRecoveryConflicts from "../src/components/studio/mentor/JourneyRecommendationRecoveryConflictQuarantine.js";

const KEY="iband.creator-memory";
const projectId="proof-conflict-physical-court";
const storage=createMemoryStorageAdapter();
const seed=createCreatorMemory({storageAdapter:storage}).getState();
const reference={
 domain:"iband.movie-mentor.journey-recommendation-reference",
 projectId,recommendationId:"rec-proof-conflict",recommendationFingerprint:"fingerprint-proof-conflict",
 issuedAgainst:{progressionRevision:0},lifecycle:{current:true}
};
const journey={progression:{revision:1,committedOperations:[{
 operationId:"operation-court",creatorActId:"creator-act-court",
 fromRevision:0,toRevision:1,
 recommendation:{recommendationId:"rec-proof-conflict",fingerprint:"WRONG-FINGERPRINT",disposition:"consumed",issuedAgainstProgressionRevision:0}
}]}};
storage.setItem(KEY,JSON.stringify({
 ...seed,
 projects:[...(seed.projects||[]),{id:projectId,identity:{id:projectId},metadata:{projectJourney:journey}}],
 projectMemories:[...(seed.projectMemories||[]),{id:"conflicted-reference",projectId,metadata:{recommendationReference:reference}}]
}));
const memory=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
const before=storage.getItem(KEY);
let error;
try { quarantineJourneyRecommendationRecoveryConflicts({identityRuntime:{memory},projectId}); }
catch(caught){error=caught;}
assert.ok(error,"RED: quarantine committed without shared authority");
const chain=[error,error?.cause,error?.cause?.cause];
assert.ok(chain.some(item=>item?.code==="CREATOR_MEMORY_WRITE_AUTHORITY_DENIED"),
 `RED: quarantine did not reach strict write fence: ${error.code||error.message}`);
assert.equal(storage.getItem(KEY),before,"RED: quarantine changed durable bytes without authority");
console.log("GREEN: physically constructed contradictory receipt/reference proof reaches quarantine write path; strict authority denies synchronous commit; durable bytes unchanged.");

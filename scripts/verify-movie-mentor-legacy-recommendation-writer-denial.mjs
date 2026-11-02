import assert from "node:assert/strict";
import createCreatorMemory,{createMemoryStorageAdapter} from "../src/components/studio/mentor/CreatorMemory.js";
import createMovieMentorStudioIdentityRuntime from "../src/components/studio/mentor/MovieMentorStudioIdentityRuntime.js";

// Exported synchronous recommendation writer must fail closed even when a
// permissive legacy Creator Memory facade is injected by another caller.
const storage=createMemoryStorageAdapter();
const memory=createCreatorMemory({storageAdapter:storage});
const runtime=createMovieMentorStudioIdentityRuntime({memory});
const original=storage.getItem("iband.creator-memory");
const evidence={
  recommendationId:"legacy-probe-1",
  projectId:"film-probe",
  domain:"movie-mentor-journey-recommendation",
  lifecycle:{current:true},
  recommendation:{recommendedNextStep:"must not persist",confidence:1},
};
let denied=false;
try{runtime.recordRecommendationReference("film-probe",evidence);}
catch(error){denied=error?.code==="MOVIE_MENTOR_LEGACY_RECOMMENDATION_WRITE_DENIED";}
assert.equal(denied,true,"RED: exported synchronous recommendation writer must deny uncoordinated access.");
assert.equal(storage.getItem("iband.creator-memory"),original,"Denied recommendation writer must not alter durable bytes.");
console.log("GREEN: exported synchronous recommendation writer denies uncoordinated access.");

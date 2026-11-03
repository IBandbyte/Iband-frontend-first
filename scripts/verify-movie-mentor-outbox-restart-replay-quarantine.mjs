import assert from "node:assert/strict";
import createCreatorMemory from "../src/components/studio/mentor/CreatorMemory.js";
import {syncMovieMentorDurableState,enqueueMovieMentorDurableStateSync,flushMovieMentorDurableStateSync,installCreatorMemoryDurableSyncBridge} from "../src/components/studio/mentor/MovieMentorDurableStateSync.js";

const bytes=new Map();
const storage={getItem:key=>bytes.get(key)||null,setItem:(key,value)=>bytes.set(key,value),removeItem:key=>bytes.delete(key)};
const locks={request:async(_name,_options,operation)=>operation({name:"exclusive"})};
const writer=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
const committed=await writer.replaceStateWithSharedAuthority({locks,transform:state=>({...state,creatorProfile:{id:"creator-replay-test"}})});
assert.equal(committed.acquired,true,"Test requires a genuine coordinated local commit");
assert.ok(committed.value?.durablePublicationOutbox?.length,"Test requires persisted pending intent");
const reloaded=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
const restored=reloaded.getState();
assert.ok(restored.durablePublicationOutbox?.length,"Pending local intent must survive reload for this replay court");

let networkCalls=0;
const fetchImpl=async()=>{networkCalls++;throw Error("UNAUTHORISED NETWORK CALL");};
assert.equal(installCreatorMemoryDurableSyncBridge({storage,fetchImpl}),false);
assert.equal(enqueueMovieMentorDurableStateSync({memoryState:restored,storage,fetchImpl}),null);
await assert.rejects(syncMovieMentorDurableState({memoryState:restored,storage,fetchImpl}),error=>error.code==="MOVIE_MENTOR_DURABLE_SYNC_WRITE_AUTHORITY_REQUIRED");
await flushMovieMentorDurableStateSync({projectId:"creator-replay-project",storage,fetchImpl});
await flushMovieMentorDurableStateSync({projectId:"creator-replay-project",storage,fetchImpl});
assert.equal(networkCalls,0,"Persisted genuine intent is not a replay capability after restart");
console.log("GREEN: genuine pending outbox survives reload but cannot independently authorise replay or network delivery.");

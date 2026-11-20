import assert from 'node:assert/strict';
import {createCreatorMemory,createMemoryStorageAdapter} from '../src/components/studio/mentor/CreatorMemory.js';
const storage=createMemoryStorageAdapter();
const facade=createCreatorMemory({storageAdapter:storage,requireSharedWriteAuthority:true});
const before=JSON.stringify(facade.getState());
const state={...facade.getState(),journey:{...facade.getState().journey,activeProjectId:'film-1'}};
const adapter={
 async commit(){return {status:'committed',projectId:'film-1',operationId:'turn-1',committedRevision:2,serverCommitId:'server-2'};},
 async readCommitted(){return {projectId:'film-1',operationId:'turn-1',committedRevision:2,serverCommitId:'server-2',state};}
};
const request={projectId:'film-1',operationId:'turn-1',expectedRevision:1,authenticatedSession:'opaque-server-session',proposedState:state,authorityAdapter:adapter};
const result=await facade.continueWithDurableServerAuthority(request);
assert.equal(result.acquired,true);
assert.equal(result.localStateAdopted,false);
assert.equal(JSON.stringify(facade.getState()),before);
assert.equal(JSON.stringify(facade.readPersistedState()),before);
const failed=await facade.continueWithDurableServerAuthority({...request,authorityAdapter:{...adapter,readCommitted:async()=>null}});
assert.equal(failed.acquired,false);
assert.equal(JSON.stringify(facade.readPersistedState()),before);
const ordinary=await facade.replaceStateWithSharedAuthority({locks:{request:async(name,opts,cb)=>cb()},transform:s=>s});
assert.equal(typeof ordinary.acquired,'boolean');
console.log('GREEN REAL_CREATOR_MEMORY_FACADE_SERVER_CONTINUATION_NO_LOCAL_WITNESS');
console.log('HELD PHYSICAL_AUTHENTICATED_MONGO_AND_LOCAL_ADOPTION_NOT_CERTIFIED');

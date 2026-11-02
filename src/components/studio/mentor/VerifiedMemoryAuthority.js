import {hasStrictCreatorMemoryAuthority} from "./CreatorMemory.js";

// A small, shared injection boundary for lower-level mentor engines.
// Only module-private branded strict facades may expose mutable methods.
// Plain data-only read services remain usable by legacy planning integrations.
const READ_METHODS=new Set(["getMemoryContext","getState","getProject","getActiveProject","getProjectMemories","readPersistedState","getPersistedProject"]);
function requireVerifiedMemoryAuthority(candidate){
  if(candidate===null || candidate===undefined)return candidate;
  if(hasStrictCreatorMemoryAuthority(candidate))return candidate;
  if(typeof candidate==="object"){
    const proto=Object.getPrototypeOf(candidate);
    const keys=Reflect.ownKeys(candidate);
    if((proto===Object.prototype || proto===null) && keys.length>0 &&
      keys.every(key=>{
        if(typeof key!=="string" || !READ_METHODS.has(key))return false;
        const descriptor=Object.getOwnPropertyDescriptor(candidate,key);
        return Boolean(descriptor && "value" in descriptor && typeof descriptor.value==="function");
      }))return candidate;
  }
  const error=new TypeError("Mutable memory injection requires verified strict shared-write authority.");
  error.code="MOVIE_MENTOR_UNSAFE_MEMORY_AUTHORITY";
  throw error;
}
export {requireVerifiedMemoryAuthority};

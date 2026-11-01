// One exclusive browser-lock authority for recovery-sensitive Creator Memory
// operations. This is an async boundary: synchronous legacy Core mutations do
// not acquire this authority and must not be represented as cross-tab safe.
const MOVIE_MENTOR_SHARED_MEMORY_WRITE_COORDINATION = "movie-mentor-creator-memory-recovery";

async function withMovieMentorMemoryWriteAuthority({locks, operation, waitForAuthority = false} = {}) {
  if (!locks || typeof locks.request !== "function" || typeof operation !== "function") {
    return Object.freeze({acquired:false,reason:"lock-or-operation-unavailable"});
  }
  try {
    return await locks.request(
      MOVIE_MENTOR_SHARED_MEMORY_WRITE_COORDINATION,
      waitForAuthority === true ? {mode:"exclusive"} : {mode:"exclusive",ifAvailable:true},
      async lock => {
        if (!lock) return Object.freeze({acquired:false,reason:"exclusive-lock-unavailable"});
        return Object.freeze({acquired:true,value:await operation()});
      },
    );
  } catch {
    return Object.freeze({acquired:false,reason:"exclusive-operation-failed"});
  }
}
export {MOVIE_MENTOR_SHARED_MEMORY_WRITE_COORDINATION,withMovieMentorMemoryWriteAuthority};

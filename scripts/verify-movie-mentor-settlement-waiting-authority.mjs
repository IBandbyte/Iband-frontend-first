import assert from "node:assert/strict";
import { withMovieMentorMemoryWriteAuthority } from "../src/components/studio/mentor/MovieMentorMemoryWriteAuthority.js";

// Settlement requires queued exclusive acquisition; recovery retains fail-fast.
let active = false;
let releaseFirst;
const gate = new Promise(resolve => { releaseFirst = resolve; });
let firstEntered;
const entered = new Promise(resolve => { firstEntered = resolve; });
let queue = Promise.resolve();
const optionsSeen = [];
const locks = {
  request(name, options, callback) {
    optionsSeen.push(options);
    assert.equal(name, "movie-mentor-creator-memory-recovery");
    if (options.ifAvailable === true) return Promise.resolve(callback(null));
    const previous = queue;
    let release;
    queue = new Promise(resolve => { release = resolve; });
    return previous.then(async () => {
      assert.equal(active, false);
      active = true;
      try { return await callback({ name }); }
      finally { active = false; release(); }
    });
  },
};
const first = withMovieMentorMemoryWriteAuthority({
  locks, waitForAuthority: true,
  operation: async () => { firstEntered(); await gate; return "first"; },
});
await entered;
const second = withMovieMentorMemoryWriteAuthority({
  locks, waitForAuthority: true,
  operation: () => "second",
});
releaseFirst();
const results = await Promise.all([first, second]);
assert.deepEqual(results.map(x => [x.acquired, x.value]), [[true, "first"], [true, "second"]]);
assert.equal(optionsSeen[0].ifAvailable, undefined);
assert.equal(optionsSeen[1].ifAvailable, undefined);
const recovery = await withMovieMentorMemoryWriteAuthority({ locks, operation: () => "recovery" });
assert.equal(recovery.acquired, false);
assert.equal(optionsSeen[2].ifAvailable, true);
console.log("GREEN: waiting settlement authority serializes while recovery remains fail-fast.");

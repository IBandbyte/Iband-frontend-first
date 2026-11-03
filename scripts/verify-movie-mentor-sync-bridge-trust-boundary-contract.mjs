import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../src/components/studio/mentor/MovieMentorDurableStateSync.js",import.meta.url),"utf8");
// Safety contract for proposed repair: localStorage is untrusted input, not
// automatic authority to publish creator state. The bridge must not enqueue
// state solely because Storage.setItem occurred, nor replay arbitrary startup
// localStorage values into the backend. Deliberately RED until repaired.
const install=source.slice(source.indexOf("function installCreatorMemoryDurableSyncBridge("),source.indexOf("async function recoverMovieMentorCreatorState("));
assert.ok(install.startsWith("function installCreatorMemoryDurableSyncBridge("),"Bridge implementation must be found");
assert.doesNotMatch(install,/Storage\.prototype\.setItem\s*=/,"RED: Storage.setItem hook remains a publish authority");
assert.doesNotMatch(install,/enqueueMovieMentorDurableStateSync\s*\(/,"RED: bridge still forwards untrusted localStorage snapshots");
console.log("GREEN: automatic storage-observation to backend-publish authority removed; explicit coordinated writer proof still requires independent physical certification.");

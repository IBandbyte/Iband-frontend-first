import assert from "node:assert/strict";
import {readdirSync,readFileSync} from "node:fs";
import {join,relative,resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"../src");
const targets=new Map([
 ["JourneyRecommendationLifecycleRecovery.js",new Set(["components/studio/mentor/JourneyRecommendationResumeRecovery.js"])],
 ["JourneyRecommendationLifecyclePersistence.js",new Set([
   "components/studio/mentor/JourneyRecommendationLifecycleRecovery.js",
   "components/studio/mentor/JourneyRecommendationLifecyclePersistence.js"
 ])],
]);
const consumers=new Map([...targets.keys()].map(name=>[name,[]]));
function walk(dir) {
 for(const item of readdirSync(dir,{withFileTypes:true})) {
  const path=join(dir,item.name);
  if(item.isDirectory()) {walk(path);continue;}
  if(!/\.(?:js|jsx|mjs|ts|tsx)$/.test(item.name))continue;
  const source=readFileSync(path,"utf8");
  const from=relative(root,path).replaceAll("\\","/");
  for(const [target,allowed] of targets) {
   const importPattern=new RegExp(`(?:from\\s*["']|import\\s*\\(["'])[^"']*${target.replaceAll(".","\\.")}["']`,"g");
   if(importPattern.test(source)) {
    consumers.get(target).push(from);
    assert.ok(allowed.has(from),`RED: unreviewed lifecycle import ${target} in ${from}`);
   }
  }
 }
}
walk(root);
assert.ok(consumers.get("JourneyRecommendationLifecycleRecovery.js").includes("components/studio/mentor/JourneyRecommendationResumeRecovery.js"),
 "RED: lifecycle recovery caller disappeared");
assert.ok(consumers.get("JourneyRecommendationLifecyclePersistence.js").includes("components/studio/mentor/JourneyRecommendationLifecycleRecovery.js"),
 "RED: lifecycle recovery classification dependency disappeared");
for(const [target,paths] of consumers)console.log(`GREEN: direct source import boundary ${target}: ${paths.join(", ")}`);
console.log("GREEN: audited direct source imports introduce no unreviewed lifecycle module consumers; dynamic imports, injected objects and runtime reachability are NOT certified.");

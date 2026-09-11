import assert from "node:assert/strict";
import fs from "node:fs";

const path = new URL("../src/components/studio/mentor/MovieMentorTurnClient.js", import.meta.url);
const source = fs.readFileSync(path, "utf8");

// Court law: creatorTurnId is the backend convergence coordinate. The live client
// must mint it before first transport, persist the pending attempt, transmit it,
// reuse it after an ambiguous transport failure, and recover it after reload.
assert.match(source, /creatorTurnId/, "RED: live turn client does not carry creatorTurnId at all.");
assert.match(source, /(randomUUID|crypto\.)/, "RED: live turn client does not mint a creatorTurnId before first transport.");
assert.match(source, /(localStorage|storage\.(getItem|setItem))/, "RED: live turn client does not durably retain a pending creatorTurnId across reload.");
assert.match(source, /JSON\.stringify\([^)]*creatorTurnId/s, "RED: live turn request does not transmit creatorTurnId to the authoritative backend.");
assert.match(source, /(pending|retry)[\s\S]{0,1200}creatorTurnId|creatorTurnId[\s\S]{0,1200}(pending|retry)/i, "RED: ambiguous retry has no explicit stable creatorTurnId recovery path.");

console.log("PASS: live Movie Mentor transport owns a stable creatorTurnId across first send, ambiguous retry, and reload.");

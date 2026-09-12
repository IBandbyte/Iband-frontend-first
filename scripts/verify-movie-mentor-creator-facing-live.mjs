import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const BASE_URL = (process.env.IBAND_LIVE_BACKEND_URL || "https://iband-backend-first-1.onrender.com").replace(/\/$/, "");
const AUTH_TOKEN = String(process.env.IBAND_LIVE_CREATOR_AUTH_TOKEN || "").trim();
const REPORT_PATH = process.env.IBAND_LIVE_REPORT_PATH || "verification-results/movie-mentor-creator-facing-live.json";
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  passed: false,
  productionPath: ["/api/movie-mentor/projects", "/api/movie-mentor/state/sync", "/api/movie-mentor/turn"],
  projectId: null,
  creatorSessionId: null,
  creatorTurnId: null,
  checks: [],
  error: null,
};

function writeReport() {
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function certificationError(code, message, extras = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, extras);
  return error;
}

async function readJson(response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : null; } catch { return { raw: text }; }
}

async function post(path, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
    body: JSON.stringify(body),
  });
  const payload = await readJson(response);
  if (!response.ok || payload?.success !== true) {
    throw certificationError(
      payload?.code || "MOVIE_MENTOR_LIVE_CERTIFICATION_REQUEST_FAILED",
      `${path} failed (${response.status}): ${JSON.stringify(payload)}`,
      { status: response.status, path, payload },
    );
  }
  return payload;
}

function recordCheck(name, details = {}) {
  report.checks.push({ name, passed: true, ...details });
}

async function run() {
  if (!AUTH_TOKEN) {
    throw certificationError(
      "MOVIE_MENTOR_LIVE_CERTIFICATION_AUTH_REQUIRED",
      "Live Movie Mentor certification requires the revocable non-privileged creator credential in IBAND_LIVE_CREATOR_AUTH_TOKEN.",
    );
  }

  const projectId = `movie-project-${randomUUID()}`;
  const creatorSessionId = `movie-live-cert-${randomUUID()}`;
  const creatorTurnId = randomUUID();
  const identity = {
    domain: "iband.movie-mentor.project",
    schema: 1,
    issuance: "secure-web-crypto",
    legacy: false,
  };

  report.projectId = projectId;
  report.creatorSessionId = creatorSessionId;
  report.creatorTurnId = creatorTurnId;

  const established = await post("/api/movie-mentor/projects", { projectId, identity });
  assert.equal(established.projectId, projectId, "project establishment must bind the exact canonical project id");
  recordCheck("authenticated-project-establishment", { status: established.status || null });

  const synced = await post("/api/movie-mentor/state/sync", {
    projectId,
    creatorSessionId,
    source: "creator-facing-live-certification",
    expectedRevision: 0,
    state: {
      creatorConfirmedContext: [
        {
          key: "creator-mode",
          value: { creatorType: "video", creatorMode: "ai-movie", creatorJourney: "guide" },
          source: "creator-facing-live-certification",
          certainty: "confirmed",
        },
      ],
      projectJourney: null,
      memoryContext: null,
    },
  });
  assert.ok(Number.isSafeInteger(synced?.state?.revision), "state sync must return a durable integer revision");
  assert.ok(synced.state.revision >= 1, "first durable state sync must advance revision");
  recordCheck("durable-state-sync", { revision: synced.state.revision });

  const message = "A filmmaker has a mystery idea about a lighthouse receiving a message from tomorrow. Help me decide the strongest next creative question without exposing internal system machinery.";
  const turn = await post("/api/movie-mentor/turn", {
    projectId,
    creatorSessionId,
    creatorTurnId,
    message,
  });

  assert.equal(typeof turn.text, "string", "production turn must return creator-facing text");
  assert.ok(turn.text.trim().length > 0, "production turn must return non-empty creator-facing text");
  assert.equal(/story agent|character agent|specialist agent|work order/i.test(turn.text), false, "creator-facing response must not expose internal specialist machinery");
  assert.equal(turn?.metadata?.creatorTurnId || creatorTurnId, creatorTurnId, "turn result must remain bound to the submitted creatorTurnId");
  assert.equal(turn?.authority?.singleCreatorFacingMentor, true, "production turn authority must preserve a single creator-facing Mentor");
  assert.equal(turn?.authority?.specialistsMaySpeakDirectlyToCreator, false, "specialists must remain non-creator-facing");
  assert.equal(turn?.authority?.authenticatedProjectOwnershipRequired, true, "production turn must require authenticated project ownership");
  recordCheck("authoritative-creator-turn", {
    status: turn.status || null,
    textLength: turn.text.trim().length,
    mayAdvanceJourney: turn.mayAdvanceJourney === true,
  });

  report.passed = true;
}

try {
  await run();
} catch (error) {
  report.error = {
    message: error instanceof Error ? error.message : String(error),
    code: error?.code || null,
    status: Number.isInteger(error?.status) ? error.status : null,
    path: error?.path || null,
  };
  process.exitCode = 1;
} finally {
  writeReport();
}

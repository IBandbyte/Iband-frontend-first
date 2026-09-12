import { getMovieMentorCreatorAuthToken } from "./MovieMentorCreatorAuthenticationTransport.js";

const PROJECT_IDENTITY_DOMAIN = "iband.movie-mentor.project";
const PROJECT_IDENTITY_SCHEMA = 1;

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function clone(value) {
  if (value === undefined) return undefined;
  try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
}

function apiBase() {
  return cleanString(import.meta?.env?.VITE_API_BASE_URL || import.meta?.env?.VITE_BACKEND_URL || "").replace(/\/$/, "");
}

function resolveCanonicalMovieMentorProjectIdentity({ projectId, projectIdentity } = {}) {
  const canonicalProjectId = cleanString(projectId);
  if (!canonicalProjectId || !projectIdentity || typeof projectIdentity !== "object" || Array.isArray(projectIdentity)) {
    const error = new Error("Movie Mentor project establishment requires canonical project identity from CreatorWorkspace.");
    error.code = "MOVIE_MENTOR_PROJECT_IDENTITY_REQUIRED";
    throw error;
  }
  if (
    projectIdentity.domain !== PROJECT_IDENTITY_DOMAIN ||
    Number(projectIdentity.schema) !== PROJECT_IDENTITY_SCHEMA ||
    projectIdentity.issuance !== "secure-web-crypto" ||
    projectIdentity.legacy === true
  ) {
    const error = new Error("Movie Mentor project establishment requires a current secure canonical project identity.");
    error.code = "MOVIE_MENTOR_PROJECT_IDENTITY_INVALID";
    throw error;
  }
  return clone(projectIdentity);
}

async function establishMovieMentorProject({
  projectId,
  projectIdentity,
  fetchImpl = globalThis?.fetch,
  getAuthToken = getMovieMentorCreatorAuthToken,
} = {}) {
  if (typeof fetchImpl !== "function") {
    const error = new Error("Movie Mentor cannot establish project reality because fetch is unavailable.");
    error.code = "MOVIE_MENTOR_PROJECT_ESTABLISHMENT_FETCH_UNAVAILABLE";
    throw error;
  }
  if (typeof getAuthToken !== "function") {
    const error = new Error("Movie Mentor project establishment requires creator authentication transport.");
    error.code = "MOVIE_MENTOR_PROJECT_ESTABLISHMENT_AUTH_REQUIRED";
    throw error;
  }

  const canonicalProjectId = cleanString(projectId);
  const canonicalIdentity = resolveCanonicalMovieMentorProjectIdentity({ projectId: canonicalProjectId, projectIdentity });
  const token = cleanString(await getAuthToken());
  if (!token) {
    const error = new Error("Movie Mentor project establishment requires a current creator authentication token.");
    error.code = "MOVIE_MENTOR_PROJECT_ESTABLISHMENT_AUTH_REQUIRED";
    throw error;
  }

  const response = await fetchImpl(`${apiBase()}/api/movie-mentor/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ projectId: canonicalProjectId, identity: canonicalIdentity }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success !== true) {
    const error = new Error(cleanString(payload?.message) || "Movie Mentor project establishment failed.");
    error.code = cleanString(payload?.code) || "MOVIE_MENTOR_PROJECT_ESTABLISHMENT_FAILED";
    error.status = response.status;
    throw error;
  }
  return payload;
}

export {
  PROJECT_IDENTITY_DOMAIN,
  PROJECT_IDENTITY_SCHEMA,
  resolveCanonicalMovieMentorProjectIdentity,
  establishMovieMentorProject,
};

export default establishMovieMentorProject;

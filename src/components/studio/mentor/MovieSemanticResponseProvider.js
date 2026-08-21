import { API_BASE } from "../../../services/api";

const MOVIE_SEMANTIC_RESPONSE_PROVIDER_VERSION = "1.0.0";
const DEFAULT_ENDPOINT = "/api/movie-mentor-semantic/interpret";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normaliseBase(value) {
  return cleanString(value).replace(/\/+$/, "");
}

function createMovieSemanticResponseProvider({
  apiBase = API_BASE,
  endpoint = DEFAULT_ENDPOINT,
  timeoutMs = 30000,
} = {}) {
  const resolvedBase = normaliseBase(apiBase);
  const resolvedEndpoint = cleanString(endpoint) || DEFAULT_ENDPOINT;

  async function generateResponse(providerRequest = {}) {
    if (!resolvedBase) {
      throw new Error("Movie semantic provider requires an API base URL.");
    }

    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;

    const timer = controller
      ? setTimeout(() => controller.abort(), Math.max(1000, Number(timeoutMs) || 30000))
      : null;

    try {
      const response = await fetch(
        `${resolvedBase}${resolvedEndpoint.startsWith("/") ? "" : "/"}${resolvedEndpoint}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(providerRequest),
          signal: controller?.signal,
        }
      );

      const text = await response.text();
      let payload = null;

      try {
        payload = text ? JSON.parse(text) : null;
      } catch {
        payload = { text };
      }

      if (!response.ok) {
        const error = new Error(
          cleanString(payload?.message) ||
            cleanString(payload?.error) ||
            `Movie semantic provider failed (${response.status}).`
        );

        error.status = response.status;
        error.data = payload;
        throw error;
      }

      return {
        text:
          cleanString(payload?.text) ||
          cleanString(payload?.content) ||
          cleanString(payload?.response?.text) ||
          "",
        structured:
          payload?.structured && typeof payload.structured === "object"
            ? payload.structured
            : null,
        usage: payload?.usage || null,
        metadata: {
          ...(payload?.metadata && typeof payload.metadata === "object"
            ? payload.metadata
            : {}),
          movieSemanticResponseProviderVersion:
            MOVIE_SEMANTIC_RESPONSE_PROVIDER_VERSION,
        },
      };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  return {
    type: "movie-semantic-backend",
    name: "Movie Mentor Semantic Intelligence",
    version: MOVIE_SEMANTIC_RESPONSE_PROVIDER_VERSION,
    endpoint: resolvedEndpoint,
    generateResponse,
  };
}

export {
  MOVIE_SEMANTIC_RESPONSE_PROVIDER_VERSION,
  DEFAULT_ENDPOINT,
  createMovieSemanticResponseProvider,
};

export default createMovieSemanticResponseProvider;

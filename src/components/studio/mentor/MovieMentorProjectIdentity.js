const MOVIE_MENTOR_PROJECT_IDENTITY_VERSION = "1.0.0";
const MOVIE_MENTOR_PROJECT_IDENTITY_DOMAIN = "iband.movie-mentor.project";
const MOVIE_MENTOR_PROJECT_IDENTITY_SCHEMA = 1;

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function resolveCrypto(cryptoImpl = globalThis?.crypto) {
  if (!cryptoImpl || typeof cryptoImpl !== "object") {
    const error = new Error("Secure project identity issuance requires Web Crypto.");
    error.code = "MOVIE_MENTOR_PROJECT_IDENTITY_CRYPTO_REQUIRED";
    throw error;
  }
  return cryptoImpl;
}

function issueCanonicalMovieProjectId({ cryptoImpl = globalThis?.crypto } = {}) {
  const cryptoApi = resolveCrypto(cryptoImpl);
  if (typeof cryptoApi.randomUUID === "function") {
    return `movie-project-${cryptoApi.randomUUID()}`;
  }
  if (typeof cryptoApi.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    return `movie-project-${bytesToHex(bytes)}`;
  }
  const error = new Error("Secure project identity issuance requires crypto.randomUUID() or crypto.getRandomValues().");
  error.code = "MOVIE_MENTOR_PROJECT_IDENTITY_CRYPTO_REQUIRED";
  throw error;
}

function classifyMovieProjectIdentity(project = {}) {
  const id = clean(project?.id || project?.projectId);
  const identity = project?.identity && typeof project.identity === "object" ? project.identity : null;
  if (
    id &&
    identity?.domain === MOVIE_MENTOR_PROJECT_IDENTITY_DOMAIN &&
    identity?.schema === MOVIE_MENTOR_PROJECT_IDENTITY_SCHEMA &&
    identity?.issuance === "secure-web-crypto"
  ) {
    return { id, canonical: true, legacy: false, domain: identity.domain, schema: identity.schema, issuance: identity.issuance };
  }
  return {
    id: id || null,
    canonical: false,
    legacy: Boolean(id),
    domain: MOVIE_MENTOR_PROJECT_IDENTITY_DOMAIN,
    schema: 0,
    issuance: id ? "legacy-preserved" : "missing",
  };
}

function withMovieProjectIdentity(project = {}, { cryptoImpl = globalThis?.crypto } = {}) {
  const existingId = clean(project?.id || project?.projectId);
  if (existingId) {
    return {
      ...project,
      id: existingId,
      identity: project.identity || {
        domain: MOVIE_MENTOR_PROJECT_IDENTITY_DOMAIN,
        schema: 0,
        issuance: "legacy-preserved",
        legacy: true,
      },
    };
  }
  const id = issueCanonicalMovieProjectId({ cryptoImpl });
  return {
    ...project,
    id,
    identity: {
      domain: MOVIE_MENTOR_PROJECT_IDENTITY_DOMAIN,
      schema: MOVIE_MENTOR_PROJECT_IDENTITY_SCHEMA,
      issuance: "secure-web-crypto",
      legacy: false,
    },
  };
}

export {
  MOVIE_MENTOR_PROJECT_IDENTITY_VERSION,
  MOVIE_MENTOR_PROJECT_IDENTITY_DOMAIN,
  MOVIE_MENTOR_PROJECT_IDENTITY_SCHEMA,
  issueCanonicalMovieProjectId,
  classifyMovieProjectIdentity,
  withMovieProjectIdentity,
};

export default issueCanonicalMovieProjectId;

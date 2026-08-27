const JOURNEY_PROGRESSION_PROJECT_LOCK_VERSION = "1.1.0";
const LOCK_PREFIX = "iband:movie-mentor:journey-progression";

const fallbackQueues = new Map();

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function lockNameForProject(projectId) {
  const pid = cleanString(projectId);
  if (!pid) fail("JOURNEY_PROGRESSION_LOCK_PROJECT_REQUIRED", "Journey progression lock requires a projectId.");
  return `${LOCK_PREFIX}:${pid}`;
}

function isBrowserRuntime() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

async function withFallbackProjectLock(lockName, callback) {
  const previous = fallbackQueues.get(lockName) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => { release = resolve; });
  const queueTail = previous.catch(() => undefined).then(() => current);
  fallbackQueues.set(lockName, queueTail);

  await previous.catch(() => undefined);
  try {
    return await callback(Object.freeze({
      mode: "in-process-fallback",
      lockName,
      crossTabSerialized: false,
    }));
  } finally {
    release();
    if (fallbackQueues.get(lockName) === queueTail) fallbackQueues.delete(lockName);
  }
}

async function withJourneyProgressionProjectLock({
  projectId,
  callback,
  locksApi = globalThis?.navigator?.locks || null,
  browserRuntime = isBrowserRuntime(),
} = {}) {
  if (typeof callback !== "function") {
    fail("JOURNEY_PROGRESSION_LOCK_CALLBACK_REQUIRED", "Journey progression lock requires a transaction callback.");
  }

  const lockName = lockNameForProject(projectId);

  if (locksApi && typeof locksApi.request === "function") {
    return locksApi.request(lockName, { mode: "exclusive" }, async () => callback(Object.freeze({
      mode: "web-locks",
      lockName,
      crossTabSerialized: true,
    })));
  }

  // Browser progression is backed by same-origin persistent state. An in-process
  // mutex cannot serialize another tab/window/worker, so claiming transactional
  // safety here would recreate the lost-update universe this boundary exists to
  // prevent. Browser execution therefore fails closed when Web Locks are absent.
  if (browserRuntime) {
    fail(
      "JOURNEY_PROGRESSION_CROSS_TAB_LOCK_UNAVAILABLE",
      "Journey progression requires a cross-context browser lock before durable state may change."
    );
  }

  // Tests, SSR and other single-JavaScript-runtime environments do not have a
  // second browser context sharing localStorage. Preserve deterministic local
  // serialization there without pretending it is cross-tab protection.
  return withFallbackProjectLock(lockName, callback);
}

export {
  JOURNEY_PROGRESSION_PROJECT_LOCK_VERSION,
  LOCK_PREFIX,
  lockNameForProject,
  withJourneyProgressionProjectLock,
};

export default withJourneyProgressionProjectLock;

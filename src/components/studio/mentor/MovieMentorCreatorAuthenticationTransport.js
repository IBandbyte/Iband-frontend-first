const MOVIE_MENTOR_CREATOR_AUTH_TRANSPORT_VERSION = "1.2.1";

let currentAuthState = Object.freeze({ isLoaded: false, isSignedIn: false, getToken: null });
const authStateListeners = new Set();

function clean(value) { return typeof value === "string" ? value.trim() : ""; }
function authError(code, message, extras = {}) { const error = new Error(message); error.code = code; Object.assign(error, extras); return error; }
function notifyAuthStateListeners() { for (const listener of [...authStateListeners]) { try { listener(currentAuthState); } catch {} } }
function getMovieMentorCreatorAuthState() { return currentAuthState; }
function subscribeMovieMentorCreatorAuthState(listener) {
  if (typeof listener !== "function") throw new TypeError("Movie Mentor auth state listener must be a function.");
  authStateListeners.add(listener);
  return () => authStateListeners.delete(listener);
}

function setMovieMentorCreatorAuthState(authState = {}) {
  currentAuthState = Object.freeze({
    isLoaded: authState?.isLoaded === true,
    isSignedIn: authState?.isSignedIn === true,
    getToken: typeof authState?.getToken === "function" ? authState.getToken : null,
  });
  notifyAuthStateListeners();
  return currentAuthState;
}

function clearMovieMentorCreatorAuthState() {
  currentAuthState = Object.freeze({ isLoaded: false, isSignedIn: false, getToken: null });
  notifyAuthStateListeners();
}

async function resolveMovieMentorCreatorAuthToken(authState = currentAuthState) {
  if (authState?.isLoaded !== true) throw authError("MOVIE_MENTOR_CREATOR_AUTH_NOT_READY", "Movie Mentor is still confirming your sign-in session.");
  if (authState?.isSignedIn !== true || typeof authState?.getToken !== "function") throw authError("MOVIE_MENTOR_CREATOR_AUTH_REQUIRED", "Sign in before using the live Movie Mentor creator service.");
  let token;
  try { token = await authState.getToken(); }
  catch (cause) { throw authError("MOVIE_MENTOR_CREATOR_AUTH_TOKEN_FAILED", "Movie Mentor could not obtain a current authenticated session token.", { cause }); }
  const value = clean(token);
  if (!value) throw authError("MOVIE_MENTOR_CREATOR_AUTH_TOKEN_MISSING", "Movie Mentor did not receive an authenticated session token.");
  return value;
}

function createMovieMentorCreatorAuthTokenProvider(authState = currentAuthState) { return () => resolveMovieMentorCreatorAuthToken(authState); }
function getMovieMentorCreatorAuthToken() { return resolveMovieMentorCreatorAuthToken(currentAuthState); }

export {
  MOVIE_MENTOR_CREATOR_AUTH_TRANSPORT_VERSION,
  setMovieMentorCreatorAuthState,
  clearMovieMentorCreatorAuthState,
  getMovieMentorCreatorAuthState,
  subscribeMovieMentorCreatorAuthState,
  resolveMovieMentorCreatorAuthToken,
  createMovieMentorCreatorAuthTokenProvider,
  getMovieMentorCreatorAuthToken,
};
export default getMovieMentorCreatorAuthToken;

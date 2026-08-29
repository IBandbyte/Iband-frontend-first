const MOVIE_MENTOR_CREATOR_AUTH_TRANSPORT_VERSION = "1.0.0";

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function authError(code, message, extras = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, extras);
  return error;
}

async function resolveMovieMentorCreatorAuthToken({
  isLoaded,
  isSignedIn,
  getToken,
} = {}) {
  if (isLoaded !== true) {
    throw authError(
      "MOVIE_MENTOR_CREATOR_AUTH_NOT_READY",
      "Movie Mentor is still confirming your sign-in session."
    );
  }

  if (isSignedIn !== true || typeof getToken !== "function") {
    throw authError(
      "MOVIE_MENTOR_CREATOR_AUTH_REQUIRED",
      "Sign in before using the live Movie Mentor creator service."
    );
  }

  let token;
  try {
    token = await getToken();
  } catch (cause) {
    throw authError(
      "MOVIE_MENTOR_CREATOR_AUTH_TOKEN_FAILED",
      "Movie Mentor could not obtain a current authenticated session token.",
      { cause }
    );
  }

  const value = clean(token);
  if (!value) {
    throw authError(
      "MOVIE_MENTOR_CREATOR_AUTH_TOKEN_MISSING",
      "Movie Mentor did not receive an authenticated session token."
    );
  }

  return value;
}

function createMovieMentorCreatorAuthTokenProvider(authState = {}) {
  const snapshot = {
    isLoaded: authState?.isLoaded === true,
    isSignedIn: authState?.isSignedIn === true,
    getToken: authState?.getToken,
  };

  return () => resolveMovieMentorCreatorAuthToken(snapshot);
}

export {
  MOVIE_MENTOR_CREATOR_AUTH_TRANSPORT_VERSION,
  resolveMovieMentorCreatorAuthToken,
  createMovieMentorCreatorAuthTokenProvider,
};

export default createMovieMentorCreatorAuthTokenProvider;

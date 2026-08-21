const MOVIE_MENTOR_CREATOR_FACING_PRESENTER_VERSION = "1.0.0";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function resolveMovieMentorCreatorFacingMessage({ result = null, appliedJourney = null } = {}) {
  if (appliedJourney?.clarificationRequired === true) {
    return {
      type: "clarification",
      text:
        cleanString(appliedJourney?.clarificationMessage) ||
        "I’m sorry, I lost you there. Can you explain what you mean a little further?",
      source: "canonical-journey-clarification",
    };
  }

  const text =
    cleanString(result?.response?.text) ||
    cleanString(result?.content) ||
    cleanString(result?.prompt) ||
    cleanString(result?.preview);

  if (text) {
    return {
      type: "mentor-response",
      text,
      source:
        result?.mentorSynthesis?.status === "completed"
          ? "mentor-synthesis"
          : "movie-mentor-response",
    };
  }

  return {
    type: "fallback",
    text:
      "Your idea is safe. I’ve captured it, and we can keep developing it together.",
    source: "creator-facing-fallback",
  };
}

function resolveMovieMentorPreview({ result = null, creatorIdea = "" } = {}) {
  return (
    cleanString(result?.preview) ||
    cleanString(result?.content) ||
    cleanString(result?.prompt) ||
    cleanString(result?.response?.text) ||
    cleanString(creatorIdea)
  );
}

export {
  MOVIE_MENTOR_CREATOR_FACING_PRESENTER_VERSION,
  resolveMovieMentorCreatorFacingMessage,
  resolveMovieMentorPreview,
};

export default resolveMovieMentorCreatorFacingMessage;

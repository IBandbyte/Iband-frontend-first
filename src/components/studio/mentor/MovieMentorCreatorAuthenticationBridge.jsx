import React, { useMemo } from "react";
import { useAuth } from "@clerk/react";
import { createMovieMentorCreatorAuthTokenProvider } from "./MovieMentorCreatorAuthenticationTransport.js";

export default function MovieMentorCreatorAuthenticationBridge({ children }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const getAuthToken = useMemo(
    () =>
      createMovieMentorCreatorAuthTokenProvider({
        isLoaded,
        isSignedIn,
        getToken,
      }),
    [isLoaded, isSignedIn, getToken]
  );

  if (typeof children === "function") {
    return children({
      authReady: isLoaded === true,
      isSignedIn: isSignedIn === true,
      getAuthToken,
    });
  }

  return children ?? null;
}

import React, { useEffect } from "react";
import { useAuth } from "@clerk/react";
import {
  setMovieMentorCreatorAuthState,
  clearMovieMentorCreatorAuthState,
} from "./MovieMentorCreatorAuthenticationTransport.js";

export default function MovieMentorCreatorAuthenticationBridge() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  useEffect(() => {
    setMovieMentorCreatorAuthState({ isLoaded, isSignedIn, getToken });
    return () => clearMovieMentorCreatorAuthState();
  }, [isLoaded, isSignedIn, getToken]);

  return null;
}

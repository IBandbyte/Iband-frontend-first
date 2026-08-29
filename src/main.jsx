import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/react";
import App from "./App";
import { installCreatorMemoryDurableSyncBridge } from "./components/studio/mentor/MovieMentorDurableStateSync";
import MovieMentorCreatorAuthenticationBridge from "./components/studio/mentor/MovieMentorCreatorAuthenticationBridge.jsx";

const clerkPublishableKey = String(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "").trim();
if (!clerkPublishableKey) throw new Error("VITE_CLERK_PUBLISHABLE_KEY is required for production creator authentication.");

installCreatorMemoryDurableSyncBridge();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <MovieMentorCreatorAuthenticationBridge />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);

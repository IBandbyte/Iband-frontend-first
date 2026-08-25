import { Route, Routes } from "react-router-dom";
import Feed from "./Feed";
import Artists from "./Artists";
import ArtistDetail from "./ArtistDetail";
import Submit from "./Submit";
import CreatorWorkspace from "./components/studio/CreatorWorkspace";
import generateMovieMentorLiveResponse from "./components/studio/mentor/MovieMentorLiveGatewayService.js";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Feed />} />
      <Route path="/artists" element={<Artists />} />
      <Route path="/artists/:id" element={<ArtistDetail />} />
      <Route path="/submit" element={<Submit />} />
      <Route
        path="/studio"
        element={<CreatorWorkspace onGenerate={generateMovieMentorLiveResponse} />}
      />
    </Routes>
  );
}

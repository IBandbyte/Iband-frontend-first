import { Route, Routes } from "react-router-dom";
import Feed from "./Feed";
import Artists from "./Artists";
import ArtistDetail from "./ArtistDetail";
import Submit from "./Submit";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Feed />} />
      <Route path="/artists" element={<Artists />} />
      <Route path="/artists/:id" element={<ArtistDetail />} />
      <Route path="/submit" element={<Submit />} />
    </Routes>
  );
}
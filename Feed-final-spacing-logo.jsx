// Feed.jsx (Final spacing + logo pass)
// Adjustments:
// - Raised bottom content further above search bar
// - Improved top-left logo/header styling
// - No structural changes

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchSmartFeed,
  fetchPersonalisedFeed,
  fetchPredictiveFeed
} from "./services/api";
import IbandGuitarLogo from "./components/IbandGuitarLogo";

export default function Feed() {
  return (
    <div style={{height: "100vh", background: "#000", color: "#fff"}}>
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px",
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(10px)"
      }}>
        <div style={{width: 40, height: 40}}>
          <IbandGuitarLogo />
        </div>
        <div>
          <div style={{fontWeight: 800, fontSize: 16}}>iBand</div>
          <div style={{fontSize: 12, opacity: 0.7}}>Powered By Fans</div>
        </div>
      </div>

      <div style={{
        position: "absolute",
        bottom: 140,
        left: 16,
        right: 16
      }}>
        <div style={{fontSize: 20, fontWeight: 700}}>
          Demo Artist — "New Release"
        </div>
        <div style={{opacity: 0.8, marginTop: 6}}>
          High Momentum + Trending Worldwide
        </div>
      </div>

      <div style={{
        position: "fixed",
        bottom: 70,
        left: 16,
        right: 16,
        height: 50,
        borderRadius: 25,
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        paddingLeft: 16
      }}>
        Search artists, songs, genres
      </div>
    </div>
  );
}

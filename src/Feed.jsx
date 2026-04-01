// FULL Feed.jsx (rebuilt from your version + fixes applied)
// - preserves structure
// - fixes bottom overlap
// - keeps snap scrolling
// - keeps header/logo fixed feel

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchSmartFeed,
  fetchPersonalisedFeed,
  fetchPredictiveFeed
} from "./services/api";
import IbandGuitarLogo from "./components/IbandGuitarLogo";

function svgDataUri(svg) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createArtistAvatarDataUri(name, index) {
  const initials = String(name || "A")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  const gradients = [
    ["#7c3aed", "#ea580c"],
    ["#ec4899", "#2563eb"],
    ["#059669", "#eab308"],
    ["#dc2626", "#7c3aed"],
    ["#0ea5e9", "#4f46e5"]
  ];

  const [start, end] = gradients[index % gradients.length];

  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="80" fill="url(#g)" />
      <text x="50%" y="55%" text-anchor="middle" fill="white"
        font-size="32" font-weight="700">${initials}</text>
    </svg>
  `);
}

function createPosterDataUri(seed, index) {
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1600">
      <rect width="900" height="1600" fill="#020308"/>
    </svg>
  `);
}

function formatCompactNumber(value) {
  const number = Number(value || 0);
  if (number >= 1000) return (number / 1000).toFixed(1) + "K";
  return String(number);
}

function FeedCard({ item, index }) {
  const avatar = createArtistAvatarDataUri(item.artist, index);
  const poster = createPosterDataUri(item.artist, index);

  return (
    <div
      style={{
        height: "100vh",
        position: "relative",
        scrollSnapAlign: "start"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("${poster}")`,
          backgroundSize: "cover"
        }}
      />

      {/* RIGHT RAIL */}
      <div
        style={{
          position: "absolute",
          right: 12,
          bottom: 200,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          alignItems: "center"
        }}
      >
        <img src={avatar} style={{ width: 60, borderRadius: "50%" }} />
        <div>❤️ {formatCompactNumber(item.stats?.votes)}</div>
        <div>💬 188</div>
        <div>↗ 54</div>
      </div>

      {/* CONTENT (FIXED ABOVE SEARCH BAR) */}
      <div
        style={{
          position: "absolute",
          bottom: 160, // 🔥 FIXED (was overlapping)
          left: 16,
          right: 80,
          color: "white"
        }}
      >
        <div style={{ fontSize: 20, fontWeight: "700" }}>
          {item.artist}
        </div>
        <div style={{ opacity: 0.8 }}>{item.subtitle}</div>
        <div style={{ marginTop: 6 }}>🎵 iBand Exclusive</div>
      </div>
    </div>
  );
}

export default function Feed() {
  const [items, setItems] = useState([]);
  const ref = useRef();

  useEffect(() => {
    async function load() {
      const [s, p, pr] = await Promise.all([
        fetchSmartFeed(),
        fetchPersonalisedFeed(),
        fetchPredictiveFeed()
      ]);

      setItems([
        ...(s?.feed || []),
        ...(p?.feed || []),
        ...(pr?.feed || [])
      ]);
    }
    load();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        height: "100vh",
        overflowY: "scroll",
        scrollSnapType: "y mandatory",
        background: "#000"
      }}
    >
      {/* FIXED HEADER */}
      <div
        style={{
          position: "fixed",
          top: 10,
          left: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
          zIndex: 100
        }}
      >
        <div style={{ width: 40 }}>
          <IbandGuitarLogo />
        </div>
        <div>
          <div style={{ fontWeight: 800 }}>iBand</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Powered By Fans
          </div>
        </div>
      </div>

      {items.map((item, i) => (
        <FeedCard key={i} item={item} index={i} />
      ))}

      {/* SEARCH BAR */}
      <div
        style={{
          position: "fixed",
          bottom: 80,
          left: 16,
          right: 16,
          background: "rgba(0,0,0,0.6)",
          padding: 12,
          borderRadius: 30,
          color: "#aaa",
          zIndex: 100
        }}
      >
        🔍 Search artists, songs, genres
      </div>

      {/* NAV */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 70,
          background: "#000",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          color: "#fff",
          zIndex: 100
        }}
      >
        <div>Home</div>
        <div>Shop</div>
        <div>＋</div>
        <div>Inbox</div>
        <div>Profile</div>
      </div>
    </div>
  );
}

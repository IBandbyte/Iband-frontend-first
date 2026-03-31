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
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="80" fill="url(#g)" />
      <circle cx="80" cy="58" r="24" fill="rgba(255,255,255,0.20)" />
      <path d="M38 128c10-22 27-34 42-34s32 12 42 34" fill="rgba(255,255,255,0.20)" />
      <text x="50%" y="55%" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="32" font-weight="700">${initials}</text>
    </svg>
  `);
}

function createPosterDataUri(seed, index) {
  const palettes = [
    ["#020611", "#0d2742", "#5ee7ff"],
    ["#060814", "#1b2248", "#8b5cf6"],
    ["#03050d", "#10324a", "#22d3ee"],
    ["#050816", "#122b4a", "#f59e0b"],
    ["#040510", "#21183f", "#fb7185"]
  ];

  const [bg, mid, accent] = palettes[index % palettes.length];
  const label = String(seed || "iBand").slice(0, 24);

  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1600" viewBox="0 0 900 1600">
      <defs>
        <linearGradient id="bg" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stop-color="${bg}" />
          <stop offset="45%" stop-color="${mid}" />
          <stop offset="100%" stop-color="#020308" />
        </linearGradient>
        <radialGradient id="sky" cx="50%" cy="20%" r="55%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.28)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </radialGradient>
        <linearGradient id="beam1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="rgba(255,255,255,0)" />
          <stop offset="50%" stop-color="${accent}" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <rect width="900" height="1600" fill="url(#bg)" />
      <circle cx="450" cy="300" r="420" fill="url(#sky)" />
      <g opacity="0.9">
        <path d="M120 210 C280 320, 620 300, 820 220" stroke="url(#beam1)" stroke-width="10" fill="none" />
        <path d="M100 260 C300 350, 600 340, 830 260" stroke="rgba(94,231,255,0.70)" stroke-width="6" fill="none" />
        <path d="M130 290 C300 380, 620 380, 820 310" stroke="rgba(255,255,255,0.28)" stroke-width="3" fill="none" />
      </g>
      <g opacity="0.95">
        <circle cx="210" cy="520" r="6" fill="white" />
        <circle cx="300" cy="420" r="4" fill="white" />
        <circle cx="430" cy="470" r="5" fill="white" />
        <circle cx="590" cy="430" r="6" fill="white" />
        <circle cx="720" cy="510" r="5" fill="white" />
        <circle cx="640" cy="580" r="4" fill="white" />
      </g>
      <g opacity="0.28">
        <ellipse cx="450" cy="650" rx="330" ry="170" fill="rgba(255,255,255,0.12)" />
        <ellipse cx="450" cy="710" rx="380" ry="210" fill="rgba(255,255,255,0.06)" />
      </g>
      <g opacity="0.35">
        <rect x="120" y="1060" width="660" height="360" rx="26" fill="rgba(0,0,0,0.24)" />
        <rect x="180" y="1120" width="220" height="18" rx="9" fill="rgba(255,255,255,0.16)" />
        <rect x="180" y="1160" width="320" height="18" rx="9" fill="rgba(255,255,255,0.11)" />
        <rect x="180" y="1200" width="260" height="18" rx="9" fill="rgba(255,255,255,0.09)" />
      </g>
      <text x="450" y="1380" text-anchor="middle" fill="rgba(255,255,255,0.92)" font-family="Arial, sans-serif" font-size="56" font-weight="700">${label}</text>
      <text x="450" y="1440" text-anchor="middle" fill="rgba(255,255,255,0.72)" font-family="Arial, sans-serif" font-size="28">Powered By Fans</text>
    </svg>
  `);
}

function normaliseSmartFeed(data) {
  const items = Array.isArray(data?.feed) ? data.feed : [];

  return items.map((item, index) => ({
    id: item.id || `smart-${index}`,
    source: "smart-feed",
    artist: item.artist || "Unknown Artist",
    country: item.country || "Unknown",
    trackTitle: item.trackTitle || item.songTitle || item.title || "New Release",
    subtitle: item.cardSubtitle || "High Momentum + Trending Worldwide",
    reason: item.feedReason || item.message || "Recommended by iBand",
    badge: "SMART",
    profileHandle: `@${String(item.artist || "artist")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")}`,
    genre: item.genre || "Global Pop",
    imageUrl: item.imageUrl || "",
    posterUrl: item.posterUrl || "",
    videoUrl: item.videoUrl || "",
    stats: {
      likes: Number(item.likes || item.votes || item.voteCount || 3100),
      comments: Number(item.comments || item.commentCount || 322),
      shares: Number(item.shares || item.shareCount || 118),
      momentum: Number(item.momentum || item.momentumScore || 88)
    }
  }));
}

function normalisePersonalisedFeed(data) {
  const items = Array.isArray(data?.feed) ? data.feed : [];

  return items.map((item, index) => ({
    id: item.id || `personalised-${index}`,
    source: "personalised-feed",
    artist: item.artist || "Unknown Artist",
    country: item.country || "Unknown",
    trackTitle: item.trackTitle || item.songTitle || item.title || "Exclusive Drop",
    subtitle: item.cardSubtitle || "High Momentum + Trending Worldwide",
    reason: item.feedReason || item.message || "Matched to your listening behavior",
    badge: "FOR YOU",
    profileHandle: `@${String(item.artist || "artist")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")}`,
    genre: item.genre || "Pop / Urban",
    imageUrl: item.imageUrl || "",
    posterUrl: item.posterUrl || "",
    videoUrl: item.videoUrl || "",
    stats: {
      likes: Number(item.likes || item.votes || item.voteCount || 4200),
      comments: Number(item.comments || item.commentCount || 245),
      shares: Number(item.shares || item.shareCount || 93),
      momentum: Number(item.momentum || item.momentumScore || 92)
    }
  }));
}

function normalisePredictiveFeed(data) {
  const items = Array.isArray(data?.feed) ? data.feed : [];

  return items.map((item, index) => ({
    id: item.id || `predictive-${index}`,
    source: "predictive-feed",
    artist: item.artist || "Unknown Artist",
    country: item.country || "Unknown",
    trackTitle: item.trackTitle || item.songTitle || item.title || "Breakout Signal",
    subtitle: item.cardSubtitle || "High Momentum + Trending Worldwide",
    reason:
      item.feedReason ||
      item.message ||
      "User is highly engaged and likely to respond well to another breakout signal",
    badge: "PREDICTED",
    profileHandle: `@${String(item.artist || "artist")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")}`,
    genre: item.genre || "Afrobeats / Pop",
    imageUrl: item.imageUrl || "",
    posterUrl: item.posterUrl || "",
    videoUrl: item.videoUrl || "",
    stats: {
      likes: Number(item.likes || item.votes || item.voteCount || 5100),
      comments: Number(item.comments || item.commentCount || 322),
      shares: Number(item.shares || item.shareCount || 141),
      momentum: Number(item.momentum || item.momentumScore || 95)
    }
  }));
}

function buildFallbackFeed() {
  return [
    {
      id: "fallback-1",
      source: "smart-feed",
      artist: "Sam Ryder",
      country: "United Kingdom",
      trackTitle: "Supernova Dreams",
      subtitle: "High Momentum + Trending Worldwide",
      reason: "Recommended by iBand",
      badge: "SMART",
      profileHandle: "@samryder",
      genre: "Pop / Electronic",
      imageUrl: "",
      posterUrl: "",
      videoUrl: "",
      stats: { likes: 3100, comments: 322, shares: 118, momentum: 94 }
    },
    {
      id: "fallback-2",
      source: "personalised-feed",
      artist: "Luna Nova",
      country: "Brazil",
      trackTitle: "Neon Hearts",
      subtitle: "High Momentum + Trending Worldwide",
      reason: "Matched to your listening behavior",
      badge: "FOR YOU",
      profileHandle: "@lunanova",
      genre: "Brazilian Pop",
      imageUrl: "",
      posterUrl: "",
      videoUrl: "",
      stats: { likes: 2800, comments: 208, shares: 97, momentum: 90 }
    },
    {
      id: "fallback-3",
      source: "predictive-feed",
      artist: "Kairo V",
      country: "Nigeria",
      trackTitle: "Midnight Motion",
      subtitle: "High Momentum + Trending Worldwide",
      reason: "Predicted breakout signal",
      badge: "PREDICTED",
      profileHandle: "@kairov",
      genre: "Afrobeats / Pop",
      imageUrl: "",
      posterUrl: "",
      videoUrl: "",
      stats: { likes: 4600, comments: 441, shares: 156, momentum: 97 }
    }
  ];
}

function dedupeFeed(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = `${item.artist}-${item.country}-${item.trackTitle}-${item.badge}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatCompactNumber(value) {
  const number = Number(value || 0);

  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  }

  if (number >= 1000) {
    return `${(number / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }

  return String(number);
}

function getActiveItemPosition(container) {
  if (!container) return 0;

  const height = container.clientHeight || window.innerHeight || 1;
  const index = Math.round(container.scrollTop / height);

  return Number.isFinite(index) ? index : 0;
}

function FixedHeader() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        pointerEvents: "none",
        paddingTop: "max(14px, env(safe-area-inset-top))",
        paddingLeft: 18,
        paddingRight: 18
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12
        }}
      >
        <div
          style={{
            width: 62,
            height: 62,
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
            boxShadow: "0 10px 28px rgba(0,0,0,0.32)"
          }}
        >
          <IbandGuitarLogo />
        </div>

        <div style={{ paddingTop: 2, minWidth: 0 }}>
          <div
            style={{
              color: "#ffffff",
              fontSize: 26,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              textShadow: "0 4px 18px rgba(0,0,0,0.28)"
            }}
          >
            iBand
          </div>

          <div
            style={{
              marginTop: 5,
              color: "rgba(255,255,255,0.90)",
              fontSize: 14,
              fontWeight: 500,
              lineHeight: 1.1,
              textShadow: "0 4px 16px rgba(0,0,0,0.28)"
            }}
          >
            Powered By Fans
          </div>
        </div>
      </div>
    </div>
  );
}

function CardRightRail({ item, index }) {
  const avatarSrc = item.imageUrl || createArtistAvatarDataUri(item.artist, index);

  const actions = [
    {
      icon: "♥",
      value: formatCompactNumber(item.stats.likes),
      label: "Like",
      iconSize: 24
    },
    {
      icon: "💬",
      value: formatCompactNumber(item.stats.comments),
      label: "Comment",
      iconSize: 24
    },
    {
      icon: "↗",
      value: formatCompactNumber(item.stats.shares),
      label: "Share",
      iconSize: 24
    }
  ];

  return (
    <div
      style={{
        position: "absolute",
        right: 10,
        bottom: "170px",
        zIndex: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        width: 64
      }}
    >
      <div
        style={{
          position: "relative",
          width: 54,
          height: 54
        }}
      >
        <img
          src={avatarSrc}
          alt={item.artist}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.94)",
            boxShadow: "0 12px 28px rgba(0,0,0,0.34)"
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -2,
            bottom: -2,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7c3aed 0%, #ea580c 100%)",
            color: "#ffffff",
            border: "2px solid #06070c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1
          }}
        >
          +
        </div>
      </div>

      {actions.map((action) => (
        <button
          key={`${item.id}-${action.label}`}
          type="button"
          aria-label={action.label}
          style={{
            border: "none",
            background: "transparent",
            color: "#ffffff",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 5,
            cursor: "pointer"
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: action.iconSize,
              fontWeight: 700,
              lineHeight: 1,
              textShadow: "0 8px 24px rgba(0,0,0,0.44)"
            }}
          >
            {action.icon}
          </div>
          <div
            style={{
              color: "#ffffff",
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1,
              textShadow: "0 4px 18px rgba(0,0,0,0.40)"
            }}
          >
            {action.value}
          </div>
        </button>
      ))}

      <button
        type="button"
        aria-label="Info"
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(170,190,220,0.16)",
          color: "#ffffff",
          fontSize: 24,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 12px 28px rgba(0,0,0,0.34)",
          cursor: "pointer"
        }}
      >
        i
      </button>

      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          padding: 3,
          background: "rgba(255,255,255,0.16)",
          boxShadow: "0 12px 28px rgba(0,0,0,0.34)"
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            backgroundImage: `url("${createPosterDataUri(item.trackTitle, index + 10)}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            border: "2px solid rgba(255,255,255,0.92)",
            animation: "iband-spin 8s linear infinite"
          }}
        />
      </div>
    </div>
  );
}

function CardBottomInfo({ item }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        right: 88,
        bottom: "150px",
        zIndex: 23
      }}
    >
      <div
        style={{
          color: "#ffffff",
          fontSize: 20,
          fontWeight: 800,
          lineHeight: 1.14,
          letterSpacing: "-0.02em",
          textShadow: "0 6px 24px rgba(0,0,0,0.42)"
        }}
      >
        {item.artist} — <span style={{ fontWeight: 500 }}>“{item.trackTitle}”</span>
      </div>

      <div
        style={{
          marginTop: 8,
          color: "rgba(255,255,255,0.94)",
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.25,
          textShadow: "0 4px 18px rgba(0,0,0,0.42)"
        }}
      >
        {item.subtitle}
      </div>

      <div
        style={{
          marginTop: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          color: "rgba(255,255,255,0.92)",
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1.25,
          textShadow: "0 4px 18px rgba(0,0,0,0.42)"
        }}
      >
        <span
          style={{
            color: "#36a8ff",
            fontSize: 18,
            lineHeight: 1
          }}
        >
          ♫
        </span>
        <span>iBand Exclusive — New Release</span>
      </div>

      <div
        style={{
          marginTop: 10,
          color: "rgba(255,255,255,0.82)",
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.25,
          textShadow: "0 4px 18px rgba(0,0,0,0.42)"
        }}
      >
        {formatCompactNumber(item.stats.comments)} Comments
      </div>
    </div>
  );
}

function FeedSlide({ item, index, active }) {
  const posterSrc =
    item.posterUrl || item.videoUrl || createPosterDataUri(`${item.artist} ${item.trackTitle}`, index);

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        height: "100vh",
        width: "100%",
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
        overflow: "hidden",
        background: "#020308"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("${posterSrc}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: active ? "scale(1.02)" : "scale(1)",
          transition: "transform 380ms ease"
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.08) 18%, rgba(0,0,0,0.08) 46%, rgba(0,0,0,0.44) 70%, rgba(0,0,0,0.88) 100%)"
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 22%, rgba(120,220,255,0.28) 0%, rgba(0,0,0,0) 34%), linear-gradient(90deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.02) 40%, rgba(0,0,0,0.16) 100%)"
        }}
      />

      <CardRightRail item={item} index={index} />
      <CardBottomInfo item={item} />
    </section>
  );
}

function SearchDock() {
  return (
    <div
      style={{
        position: "fixed",
        left: 14,
        right: 14,
        bottom: "calc(env(safe-area-inset-bottom) + 94px)",
        zIndex: 58
      }}
    >
      <button
        type="button"
        aria-label="Search artists songs genres"
        style={{
          width: "100%",
          minHeight: 54,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(18,24,38,0.34)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 14px 30px rgba(0,0,0,0.24)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          paddingLeft: 18,
          paddingRight: 18,
          color: "rgba(255,255,255,0.92)",
          cursor: "pointer"
        }}
      >
        <span
          style={{
            fontSize: 18,
            lineHeight: 1
          }}
        >
          ⌕
        </span>
        <span
          style={{
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: "0.01em"
          }}
        >
          Search artists, songs, genres
        </span>
      </button>
    </div>
  );
}

function BottomNav() {
  const navItems = [
    { icon: "⌂", label: "Home" },
    { icon: "👜", label: "Shop" },
    { icon: "+", label: "" },
    { icon: "💬", label: "Inbox", badge: "2" },
    { icon: "◡", label: "Profile" }
  ];

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 59,
        paddingBottom: "max(8px, env(safe-area-inset-bottom))"
      }}
    >
      <div
        style={{
          background: "rgba(6,8,14,0.84)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 -10px 30px rgba(0,0,0,0.26)",
          paddingTop: 10,
          paddingBottom: 8,
          paddingLeft: 14,
          paddingRight: 14
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            alignItems: "end",
            gap: 8
          }}
        >
          {navItems.map((item, index) => {
            if (index === 2) {
              return (
                <button
                  key="create"
                  type="button"
                  aria-label="Create"
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer"
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 38,
                      borderRadius: 12,
                      background:
                        "linear-gradient(90deg, #79d8ff 0 18%, #ffffff 18% 82%, #ff8daf 82% 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 10px 22px rgba(0,0,0,0.24)"
                    }}
                  >
                    <span
                      style={{
                        color: "#000000",
                        fontSize: 24,
                        fontWeight: 700,
                        lineHeight: 1
                      }}
                    >
                      +
                    </span>
                  </div>
                </button>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                aria-label={item.label}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  color: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  position: "relative",
                  cursor: "pointer"
                }}
              >
                <span
                  style={{
                    fontSize: index === 0 ? 28 : 24,
                    lineHeight: 1
                  }}
                >
                  {item.icon}
                </span>

                {item.badge ? (
                  <span
                    style={{
                      position: "absolute",
                      top: -2,
                      right: 14,
                      minWidth: 18,
                      height: 18,
                      paddingLeft: 4,
                      paddingRight: 4,
                      borderRadius: 999,
                      background: "#f55373",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontSize: 10,
                      fontWeight: 800,
                      boxShadow: "0 8px 20px rgba(245,83,115,0.35)"
                    }}
                  >
                    {item.badge}
                  </span>
                ) : null}

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    lineHeight: 1
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Feed() {
  const [smartFeed, setSmartFeed] = useState([]);
  const [personalisedFeed, setPersonalisedFeed] = useState([]);
  const [predictiveFeed, setPredictiveFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFeed() {
      setLoading(true);

      try {
        const [smart, personalised, predictive] = await Promise.allSettled([
          fetchSmartFeed(),
          fetchPersonalisedFeed(),
          fetchPredictiveFeed()
        ]);

        if (cancelled) return;

        setSmartFeed(
          smart.status === "fulfilled" ? normaliseSmartFeed(smart.value) : []
        );
        setPersonalisedFeed(
          personalised.status === "fulfilled"
            ? normalisePersonalisedFeed(personalised.value)
            : []
        );
        setPredictiveFeed(
          predictive.status === "fulfilled"
            ? normalisePredictiveFeed(predictive.value)
            : []
        );
      } catch (error) {
        if (!cancelled) {
          setSmartFeed([]);
          setPersonalisedFeed([]);
          setPredictiveFeed([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFeed();

    return () => {
      cancelled = true;
    };
  }, []);

  const feedItems = useMemo(() => {
    const merged = dedupeFeed([
      ...smartFeed,
      ...personalisedFeed,
      ...predictiveFeed
    ]);

    return merged.length > 0 ? merged : buildFallbackFeed();
  }, [smartFeed, personalisedFeed, predictiveFeed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ticking = false;

    const updateActive = () => {
      const nextIndex = getActiveItemPosition(container);
      setActiveIndex((prev) => {
        if (prev === nextIndex) return prev;
        return Math.max(0, Math.min(nextIndex, feedItems.length - 1));
      });
      ticking = false;
    };

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateActive);
    };

    updateActive();
    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [feedItems.length]);

  const displayItems = loading ? buildFallbackFeed() : feedItems;

  return (
    <>
      <style>{`
        @keyframes iband-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        html, body, #root {
          height: 100%;
          margin: 0;
          background: #020308;
          overflow: hidden;
        }

        * {
          box-sizing: border-box;
        }

        button,
        input,
        textarea,
        select {
          font: inherit;
        }

        main::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <main
        ref={containerRef}
        style={{
          position: "relative",
          height: "100vh",
          width: "100%",
          overflowY: "auto",
          overflowX: "hidden",
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          background: "#020308",
          msOverflowStyle: "none",
          scrollbarWidth: "none"
        }}
      >
        {displayItems.map((item, index) => (
          <div
            key={item.id}
            data-feed-card="true"
            data-index={index}
            style={{
              minHeight: "100vh",
              height: "100vh",
              width: "100%"
            }}
          >
            <FeedSlide item={item} index={index} active={activeIndex === index} />
          </div>
        ))}

        <FixedHeader />
        <SearchDock />
        <BottomNav />
      </main>
    </>
  );
}

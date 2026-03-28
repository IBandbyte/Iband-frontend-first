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
      <rect width="160" height="160" rx="40" fill="url(#g)" />
      <circle cx="80" cy="62" r="28" fill="rgba(255,255,255,0.18)" />
      <path d="M38 132c8-24 30-36 42-36s34 12 42 36" fill="rgba(255,255,255,0.18)" />
      <text x="50%" y="55%" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="34" font-weight="700">${initials}</text>
    </svg>
  `);
}

function createPosterDataUri(seed, index) {
  const palettes = [
    ["#12051f", "#45106b", "#ff7b00"],
    ["#07121f", "#143f6b", "#00c2ff"],
    ["#100718", "#5a189a", "#ff4d6d"],
    ["#06130f", "#0f766e", "#f59e0b"],
    ["#1a0d05", "#9a3412", "#fb7185"]
  ];

  const [bg, mid, accent] = palettes[index % palettes.length];
  const label = String(seed || "iBand").slice(0, 18);

  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1600" viewBox="0 0 900 1600">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bg}" />
          <stop offset="55%" stop-color="${mid}" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.28)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <rect width="900" height="1600" fill="url(#bg)" />
      <circle cx="450" cy="520" r="360" fill="url(#glow)" />
      <rect x="70" y="100" width="760" height="1400" rx="48" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.16)" />
      <circle cx="450" cy="560" r="150" fill="rgba(255,255,255,0.12)" />
      <circle cx="450" cy="560" r="88" fill="rgba(255,255,255,0.24)" />
      <rect x="240" y="1030" width="420" height="16" rx="8" fill="rgba(255,255,255,0.22)" />
      <rect x="210" y="1080" width="480" height="16" rx="8" fill="rgba(255,255,255,0.14)" />
      <rect x="260" y="1130" width="380" height="16" rx="8" fill="rgba(255,255,255,0.12)" />
      <text x="450" y="1260" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="56" font-weight="700">${label}</text>
      <text x="450" y="1320" text-anchor="middle" fill="rgba(255,255,255,0.82)" font-family="Arial, sans-serif" font-size="28">iBand Discovery Experience</text>
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
    title: item.cardTitle || "Smart Feed Pick",
    subtitle: item.cardSubtitle || "Recommended for discovery",
    reason: item.feedReason || item.message || "Recommended by iBand",
    icon: item.icon || "🎵",
    priority: item.priority || "medium",
    action: item.action || "discover_artist",
    badge: "SMART",
    profileHandle: `@${String(item.artist || "artist")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")}`,
    genre: item.genre || "Global Pop",
    imageUrl: item.imageUrl || "",
    posterUrl: item.posterUrl || "",
    videoUrl: item.videoUrl || "",
    stats: {
      votes: Number(item.votes || item.voteCount || 0),
      momentum: Number(item.momentum || item.momentumScore || 72),
      fans: Number(item.fans || item.fanCount || 1200)
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
    title: item.cardTitle || "Personalised Pick",
    subtitle: item.cardSubtitle || "Tailored to your taste",
    reason: item.feedReason || item.message || "Matched to your listening behavior",
    icon: item.icon || "✨",
    priority: item.priority || "high",
    action: item.action || "play_now",
    badge: "FOR YOU",
    profileHandle: `@${String(item.artist || "artist")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")}`,
    genre: item.genre || "Pop / Urban",
    imageUrl: item.imageUrl || "",
    posterUrl: item.posterUrl || "",
    videoUrl: item.videoUrl || "",
    stats: {
      votes: Number(item.votes || item.voteCount || 0),
      momentum: Number(item.momentum || item.momentumScore || 84),
      fans: Number(item.fans || item.fanCount || 2400)
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
    title: item.cardTitle || "Predicted Breakout",
    subtitle: item.cardSubtitle || "Likely to trend next",
    reason:
      item.feedReason ||
      item.message ||
      "User is highly engaged and likely to respond well to another breakout signal",
    icon: item.icon || "🚀",
    priority: item.priority || "high",
    action: item.action || "watch_breakout",
    badge: "PREDICTED",
    profileHandle: `@${String(item.artist || "artist")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")}`,
    genre: item.genre || "Afrobeats / Pop",
    imageUrl: item.imageUrl || "",
    posterUrl: item.posterUrl || "",
    videoUrl: item.videoUrl || "",
    stats: {
      votes: Number(item.votes || item.voteCount || 0),
      momentum: Number(item.momentum || item.momentumScore || 91),
      fans: Number(item.fans || item.fanCount || 3800)
    }
  }));
}

function buildFallbackFeed() {
  return [
    {
      id: "fallback-smart-1",
      source: "smart-feed",
      artist: "Demo Artist Brazil",
      country: "Brazil",
      title: "Smart Feed Pick",
      subtitle: "High Momentum + Global Discovery",
      reason: "High Momentum + strong regional traction across Brazil",
      icon: "🎵",
      priority: "high",
      action: "discover_artist",
      badge: "SMART",
      profileHandle: "@demoartistbrazil",
      genre: "Brazilian Pop",
      imageUrl: "",
      posterUrl: "",
      videoUrl: "",
      stats: { votes: 142, momentum: 87, fans: 3200 }
    },
    {
      id: "fallback-personalised-1",
      source: "personalised-feed",
      artist: "Demo Artist Nigeria",
      country: "Nigeria",
      title: "Personalised Pick",
      subtitle: "Watch this artist before the breakout",
      reason: "Strong match with your recent Afrobeats and crossover discovery pattern",
      icon: "✨",
      priority: "high",
      action: "play_now",
      badge: "FOR YOU",
      profileHandle: "@demoartistnigeria",
      genre: "Afrobeats",
      imageUrl: "",
      posterUrl: "",
      videoUrl: "",
      stats: { votes: 223, momentum: 92, fans: 4800 }
    },
    {
      id: "fallback-predictive-1",
      source: "predictive-feed",
      artist: "Demo Artist Japan",
      country: "Japan",
      title: "Predicted Breakout",
      subtitle: "Watch this artist before the breakout",
      reason: "Radar and momentum signals increasing",
      icon: "🚀",
      priority: "high",
      action: "watch_breakout",
      badge: "SMART",
      profileHandle: "@demoartistjapan",
      genre: "Global Pop",
      imageUrl: "",
      posterUrl: "",
      videoUrl: "",
      stats: { votes: 301, momentum: 72, fans: 1200 }
    }
  ];
}

function dedupeFeed(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = `${item.artist}-${item.country}-${item.badge}`;
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

function getThemeByBadge(badge) {
  if (badge === "PREDICTED") {
    return {
      badgeBg: "rgba(244,114,182,0.20)",
      badgeBorder: "rgba(244,114,182,0.52)",
      badgeText: "#ffe4f1",
      pillBg: "rgba(244,114,182,0.18)"
    };
  }

  if (badge === "FOR YOU") {
    return {
      badgeBg: "rgba(96,165,250,0.18)",
      badgeBorder: "rgba(96,165,250,0.5)",
      badgeText: "#dbeafe",
      pillBg: "rgba(96,165,250,0.16)"
    };
  }

  return {
    badgeBg: "rgba(251,146,60,0.18)",
    badgeBorder: "rgba(251,146,60,0.45)",
    badgeText: "#ffedd5",
    pillBg: "rgba(251,146,60,0.14)"
  };
}

function FeedCard({ item, index, active }) {
  const theme = getThemeByBadge(item.badge);
  const avatarSrc = item.imageUrl || createArtistAvatarDataUri(item.artist, index);
  const posterSrc =
    item.posterUrl || item.videoUrl || createPosterDataUri(`${item.artist} ${item.country}`, index);

  return (
    <section
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        background: "#050505",
        scrollSnapAlign: "start",
        scrollSnapStop: "always"
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
          transition: "transform 500ms ease"
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.06) 18%, rgba(0,0,0,0.10) 40%, rgba(0,0,0,0.52) 72%, rgba(0,0,0,0.88) 100%)"
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.00) 35%, rgba(0,0,0,0.16) 100%)"
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 10,
          left: 14,
          right: 14,
          zIndex: 30,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            minWidth: 0,
            flex: 1
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: "rgba(7,7,10,0.30)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: "0 10px 24px rgba(0,0,0,0.22)"
            }}
          >
            <IbandGuitarLogo />
          </div>

          <div
            style={{
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              flex: 1
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.15,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textShadow: "0 4px 12px rgba(0,0,0,0.35)"
              }}
            >
              {item.artist} • {item.badge === "SMART" ? "Smart Feed" : item.country} • {item.country} •{" "}
              {item.action}
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                alignSelf: "flex-start",
                maxWidth: "100%",
                padding: "7px 14px",
                borderRadius: 999,
                background: "rgba(10,10,14,0.40)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.92)",
                fontSize: 11,
                fontWeight: 700,
                lineHeight: 1,
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              Search artists, songs, genres
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0
          }}
        >
          <button
            type="button"
            aria-label="Notifications"
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(8,8,10,0.28)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              cursor: "pointer",
              flexShrink: 0
            }}
          >
            🔔
          </button>
          <button
            type="button"
            aria-label="Direct messages"
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(8,8,10,0.28)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              cursor: "pointer",
              flexShrink: 0
            }}
          >
            ✉️
          </button>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 12,
          top: 76,
          bottom: 120,
          zIndex: 22,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14
        }}
      >
        <div
          style={{
            position: "relative",
            width: 56,
            height: 56
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
              border: "2px solid rgba(255,255,255,0.92)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.28)"
            }}
          />
          <div
            style={{
              position: "absolute",
              right: -2,
              bottom: -2,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7c3aed 0%, #ea580c 100%)",
              color: "#ffffff",
              border: "2px solid #0a0a0a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700
            }}
          >
            +
          </div>
        </div>

        {[
          { icon: "❤️", value: formatCompactNumber(item.stats.votes) },
          { icon: "💬", value: "188" },
          { icon: "🔄", value: "54" },
          { icon: "⭐", value: formatCompactNumber(item.stats.momentum) },
          { icon: "🎁", value: "12" }
        ].map((action) => (
          <button
            key={`${item.id}-${action.icon}`}
            type="button"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              padding: 0
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                background: "rgba(8,8,10,0.30)",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)"
              }}
            >
              {action.icon}
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                lineHeight: 1,
                textShadow: "0 2px 10px rgba(0,0,0,0.45)"
              }}
            >
              {action.value}
            </span>
          </button>
        ))}

        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 16,
            background: "rgba(8,8,10,0.34)",
            border: "1px solid rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            boxShadow: "0 12px 24px rgba(0,0,0,0.24)"
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.9)",
              position: "relative"
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 3,
                borderRadius: "50%",
                borderTop: "2px solid #7c3aed",
                borderRight: "2px solid #ea580c",
                borderBottom: "2px solid #7c3aed",
                borderLeft: "2px solid #ea580c",
                animation: "iband-spin 4s linear infinite"
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 16,
          right: 76,
          bottom: 18,
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          gap: 10
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            alignSelf: "flex-start",
            gap: 8,
            padding: "7px 11px",
            borderRadius: 999,
            background: theme.badgeBg,
            border: `1px solid ${theme.badgeBorder}`,
            color: theme.badgeText,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)"
          }}
        >
          {item.badge}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.08,
              textShadow: "0 6px 24px rgba(0,0,0,0.35)"
            }}
          >
            {item.artist}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "rgba(255,255,255,0.86)",
              lineHeight: 1.1
            }}
          >
            {item.profileHandle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            padding: "10px 12px",
            borderRadius: 16,
            background: "rgba(8,8,10,0.32)",
            border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)"
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "rgba(255,255,255,0.94)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            WHY YOU ARE SEEING THIS
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "rgba(255,255,255,0.92)",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {item.subtitle}
          </span>
        </div>

        <div
          style={{
            fontSize: 13,
            lineHeight: 1.3,
            color: "rgba(255,255,255,0.94)",
            maxWidth: 420,
            textShadow: "0 4px 18px rgba(0,0,0,0.38)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
        >
          {item.reason}
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap"
          }}
        >
          {[
            item.genre,
            item.country,
            `Momentum ${item.stats.momentum}`,
            `${formatCompactNumber(item.stats.fans)} fans`
          ].map((pill) => (
            <div
              key={`${item.id}-${pill}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "7px 10px",
                borderRadius: 999,
                background: theme.pillBg,
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 600,
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)"
              }}
            >
              {pill}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10
          }}
        >
          <button
            type="button"
            style={{
              border: "none",
              borderRadius: 999,
              padding: "12px 18px",
              background: "linear-gradient(135deg, #7c3aed 0%, #ea580c 100%)",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 800,
              boxShadow: "0 14px 34px rgba(124,58,237,0.28)",
              cursor: "pointer"
            }}
          >
            Play Now
          </button>

          <button
            type="button"
            style={{
              borderRadius: 999,
              padding: "12px 16px",
              background: "rgba(8,8,10,0.30)",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.12)",
              fontSize: 14,
              fontWeight: 700,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              cursor: "pointer"
            }}
          >
            View Artist
          </button>
        </div>
      </div>
    </section>
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

    const cards = Array.from(container.querySelectorAll("[data-feed-card]"));
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        const index = Number(visible.target.getAttribute("data-index") || 0);
        setActiveIndex(index);
      },
      {
        root: container,
        threshold: [0.55, 0.7, 0.85]
      }
    );

    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [feedItems]);

  return (
    <>
      <style>{`
        @keyframes iband-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        * {
          box-sizing: border-box;
        }
      `}</style>

      <main
        ref={containerRef}
        style={{
          position: "relative",
          height: "100%",
          minHeight: 0,
          width: "100%",
          overflowY: "auto",
          overflowX: "hidden",
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          background: "#050505"
        }}
      >
        {(loading ? buildFallbackFeed() : feedItems).map((item, index) => (
          <div
            key={item.id}
            data-feed-card="true"
            data-index={index}
            style={{
              position: "relative",
              height: "100%",
              minHeight: "100%",
              width: "100%",
              overflow: "hidden"
            }}
          >
            <FeedCard item={item} index={index} active={activeIndex === index} />
          </div>
        ))}
      </main>
    </>
  );
}
import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchSmartFeed,
  fetchPersonalisedFeed,
  fetchPredictiveFeed
} from "./services/api";

const IBAND_LOGO_SRC = "/iband-logo.png";

function svgDataUri(svg) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createArtistAvatarDataUri(name, index = 0) {
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
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" fill="none">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
          <stop stop-color="${start}" />
          <stop offset="1" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="100" fill="url(#g)" />
      <circle cx="100" cy="78" r="30" fill="rgba(255,255,255,0.22)" />
      <path d="M50 162c10-30 34-46 50-46s40 16 50 46" fill="rgba(255,255,255,0.22)" />
      <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="44" font-family="Arial, Helvetica, sans-serif" font-weight="700">
        ${initials || "A"}
      </text>
    </svg>
  `);
}

function createArtworkDataUri(index = 0) {
  const palettes = [
    ["#0f172a", "#1d4ed8", "#06b6d4", "#eab308"],
    ["#111827", "#7c3aed", "#ec4899", "#f97316"],
    ["#052e16", "#059669", "#22c55e", "#fde047"],
    ["#1f2937", "#2563eb", "#60a5fa", "#f8fafc"],
    ["#172554", "#4338ca", "#a855f7", "#fb7185"]
  ];

  const [bg1, bg2, glow1, glow2] = palettes[index % palettes.length];

  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300" fill="none">
      <defs>
        <radialGradient id="bg" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(150 150) rotate(90) scale(180)">
          <stop stop-color="${bg2}" />
          <stop offset="1" stop-color="${bg1}" />
        </radialGradient>
        <radialGradient id="glowA" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(90 100) rotate(90) scale(80)">
          <stop stop-color="${glow1}" stop-opacity="0.95" />
          <stop offset="1" stop-color="${glow1}" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="glowB" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(220 210) rotate(90) scale(90)">
          <stop stop-color="${glow2}" stop-opacity="0.9" />
          <stop offset="1" stop-color="${glow2}" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="300" height="300" rx="150" fill="url(#bg)" />
      <circle cx="90" cy="100" r="84" fill="url(#glowA)" />
      <circle cx="220" cy="210" r="94" fill="url(#glowB)" />
      <circle cx="150" cy="150" r="76" stroke="rgba(255,255,255,0.3)" stroke-width="8" />
      <circle cx="150" cy="150" r="34" fill="rgba(255,255,255,0.22)" />
      <path d="M150 44v34" stroke="rgba(255,255,255,0.22)" stroke-width="4" stroke-linecap="round"/>
      <path d="M150 222v34" stroke="rgba(255,255,255,0.22)" stroke-width="4" stroke-linecap="round"/>
      <path d="M44 150h34" stroke="rgba(255,255,255,0.22)" stroke-width="4" stroke-linecap="round"/>
      <path d="M222 150h34" stroke="rgba(255,255,255,0.22)" stroke-width="4" stroke-linecap="round"/>
    </svg>
  `);
}

function formatCompactCount(value) {
  const num = Number(value || 0);

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(num >= 10_000_000 ? 0 : 1)}M`;
  }

  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(num >= 10_000 ? 0 : 1)}K`;
  }

  return String(num);
}

function getString(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normaliseSmartFeed(data) {
  const items = Array.isArray(data?.feed) ? data.feed : [];

  return items.map((item, index) => ({
    id: item.id || `smart-${index}`,
    feedType: "smart",
    badge: "SMART",
    artist: getString(item.artist, "Sam Ryder"),
    title: getString(item.cardTitle, "Smart Feed Pick"),
    reasonTitle: getString(item.feedReasonTitle, "High Momentum +"),
    reasonSubtitle: getString(item.feedReasonSubtitle, "Trending Worldwide"),
    reasonText: getString(item.feedReason, "Recommended by iBand intelligence."),
    handle: getString(
      item.profileHandle,
      `@${String(item.artist || "artist").replace(/\s+/g, "").toLowerCase()}`
    ),
    country: getString(item.country, "United Kingdom"),
    region: getString(item.region, "Global"),
    trackTitle: getString(item.trackTitle, "Supernova Dreams"),
    releaseLabel: getString(item.releaseLabel, "iBand Exclusive — New Release"),
    artistImage: getString(item.artistImage, ""),
    artwork: getString(item.artwork, ""),
    videoUrl: getString(item.videoUrl, ""),
    comments: getNumber(item.comments, 322),
    likes: getNumber(item.likes, 3100),
    shares: getNumber(item.shares, 322),
    infoMeta: {
      artist: getString(item.artist, "Sam Ryder"),
      feed: "Smart Feed",
      territory: getString(item.country, "United Kingdom"),
      action: getString(item.action, "play_now")
    }
  }));
}

function normalisePersonalisedFeed(data) {
  const items = Array.isArray(data?.feed) ? data.feed : [];

  return items.map((item, index) => ({
    id: item.id || `personalised-${index}`,
    feedType: "personalised",
    badge: "FOR YOU",
    artist: getString(item.artist, "Sam Ryder"),
    title: getString(item.cardTitle, "Personalised Pick"),
    reasonTitle: getString(item.feedReasonTitle, "High Momentum +"),
    reasonSubtitle: getString(item.feedReasonSubtitle, "Trending Worldwide"),
    reasonText: getString(
      item.feedReason || item.message,
      "Matches your genre taste and strong breakout momentum."
    ),
    handle: getString(
      item.profileHandle,
      `@${String(item.artist || "artist").replace(/\s+/g, "").toLowerCase()}`
    ),
    country: getString(item.country, "United Kingdom"),
    region: getString(item.region, "Europe"),
    trackTitle: getString(item.trackTitle, "Supernova Dreams"),
    releaseLabel: getString(item.releaseLabel, "iBand Exclusive — New Release"),
    artistImage: getString(item.artistImage, ""),
    artwork: getString(item.artwork, ""),
    videoUrl: getString(item.videoUrl, ""),
    comments: getNumber(item.comments, 322),
    likes: getNumber(item.likes, 3100),
    shares: getNumber(item.shares, 322),
    infoMeta: {
      artist: getString(item.artist, "Sam Ryder"),
      feed: "Personalised Feed",
      territory: getString(item.country, "United Kingdom"),
      action: getString(item.action, "play_now")
    }
  }));
}

function normalisePredictiveFeed(data) {
  const items = Array.isArray(data?.feed) ? data.feed : [];

  return items.map((item, index) => ({
    id: item.id || `predictive-${index}`,
    feedType: "predictive",
    badge: "PREDICTED",
    artist: getString(item.artist, "Sam Ryder"),
    title: getString(item.cardTitle, "Predictive Pick"),
    reasonTitle: getString(item.feedReasonTitle, "High Momentum +"),
    reasonSubtitle: getString(item.feedReasonSubtitle, "Trending Worldwide"),
    reasonText: getString(
      item.feedReason || item.message,
      "Watch this artist before the breakout."
    ),
    handle: getString(
      item.profileHandle,
      `@${String(item.artist || "artist").replace(/\s+/g, "").toLowerCase()}`
    ),
    country: getString(item.country, "United Kingdom"),
    region: getString(item.region, "Global"),
    trackTitle: getString(item.trackTitle, "Supernova Dreams"),
    releaseLabel: getString(item.releaseLabel, "iBand Exclusive — New Release"),
    artistImage: getString(item.artistImage, ""),
    artwork: getString(item.artwork, ""),
    videoUrl: getString(item.videoUrl, ""),
    comments: getNumber(item.comments, 322),
    likes: getNumber(item.likes, 3100),
    shares: getNumber(item.shares, 322),
    infoMeta: {
      artist: getString(item.artist, "Sam Ryder"),
      feed: "Predictive Feed",
      territory: getString(item.country, "United Kingdom"),
      action: getString(item.action, "play_now")
    }
  }));
}

function createFallbackFeed() {
  return [
    {
      id: "fallback-1",
      feedType: "personalised",
      badge: "FOR YOU",
      artist: "Sam Ryder",
      title: "Sam Ryder — “Supernova Dreams”",
      reasonTitle: "High Momentum +",
      reasonSubtitle: "Trending Worldwide",
      reasonText: "Matches your genre taste and strong breakout momentum.",
      handle: "@samryder",
      country: "United Kingdom",
      region: "Europe",
      trackTitle: "Supernova Dreams",
      releaseLabel: "iBand Exclusive — New Release",
      comments: 322,
      likes: 3100,
      shares: 322,
      infoMeta: {
        artist: "Sam Ryder",
        feed: "Personalised Feed",
        territory: "United Kingdom",
        action: "play_now"
      },
      artistImage: "",
      artwork: "",
      videoUrl: "",
      fallbackPoster:
        "https://images.unsplash.com/photo-1571266028243-d220c9c3b7dc?auto=format&fit=crop&w=1200&q=80",
      artistAvatarFallback: createArtistAvatarDataUri("Sam Ryder", 0),
      artworkFallback: createArtworkDataUri(0)
    }
  ];
}

function buildUnifiedFeed({ smart, personalised, predictive }) {
  const merged = [...personalised, ...smart, ...predictive];

  if (!merged.length) {
    return createFallbackFeed();
  }

  return merged.map((item, index) => ({
    ...item,
    title: item.title || `${item.artist} — “${item.trackTitle || "New Release"}”`,
    fallbackPoster:
      item.fallbackPoster ||
      "https://images.unsplash.com/photo-1571266028243-d220c9c3b7dc?auto=format&fit=crop&w=1200&q=80",
    artistAvatarFallback: createArtistAvatarDataUri(item.artist, index),
    artworkFallback: createArtworkDataUri(index)
  }));
}

function InfoOverlay({ item, onClose }) {
  if (!item) return null;

  const meta = item.infoMeta || {};

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        background: "rgba(3, 6, 16, 0.58)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "18px 14px calc(16px + env(safe-area-inset-bottom))"
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(760px, 100%)",
          borderRadius: 26,
          border: "1px solid rgba(255,255,255,0.12)",
          background:
            "linear-gradient(180deg, rgba(12,18,35,0.94) 0%, rgba(9,14,28,0.96) 100%)",
          boxShadow: "0 24px 50px rgba(0,0,0,0.35)",
          color: "white",
          padding: 20
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 14
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: "0.14em",
                color: "rgba(156,223,255,0.95)"
              }}
            >
              IBAND INFO
            </div>
            <h3
              style={{
                margin: "8px 0 0 0",
                fontSize: 28,
                lineHeight: 1.05,
                fontWeight: 900
              }}
            >
              {item.artist}
            </h3>
            <p
              style={{
                margin: "8px 0 0 0",
                color: "rgba(255,255,255,0.78)",
                fontSize: 16,
                fontWeight: 600
              }}
            >
              {item.trackTitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close info"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              fontSize: 22,
              lineHeight: 1,
              cursor: "pointer"
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            marginTop: 16,
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            padding: 16
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.66)"
            }}
          >
            PERSONALISATION DETAILS
          </div>

          <div
            style={{
              marginTop: 12,
              display: "grid",
              gap: 12
            }}
          >
            {[
              ["Artist", meta.artist || item.artist],
              ["Feed", meta.feed || "Personalised Feed"],
              ["Territory", meta.territory || item.country || "Global"],
              ["Action", meta.action || "play_now"]
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                  paddingBottom: 10
                }}
              >
                <span
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 15,
                    fontWeight: 700
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    color: "white",
                    fontSize: 16,
                    fontWeight: 800,
                    textAlign: "right"
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12
          }}
        >
          {["Artist bio", "Lyrics", "Concerts", "Merch"].map((label) => (
            <button
              key={label}
              type="button"
              style={{
                height: 48,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                fontSize: 15,
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeedCard({ item, isActive, onOpenInfo }) {
  const posterUrl = item.videoUrl || item.fallbackPoster;
  const avatarUrl = item.artistImage || item.artistAvatarFallback;
  const artworkUrl = item.artwork || item.artworkFallback;

  return (
    <article
      style={{
        position: "relative",
        minHeight: "100dvh",
        height: "100dvh",
        width: "100%",
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(7,10,26,1) 0%, rgba(5,9,20,1) 100%)"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("${posterUrl}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "saturate(1.02) contrast(1.02)",
          transform: isActive ? "scale(1.01)" : "scale(1)",
          transition: "transform 320ms ease"
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(6,8,20,0.42) 0%, rgba(6,8,20,0.12) 20%, rgba(6,8,20,0.10) 42%, rgba(6,8,20,0.34) 68%, rgba(6,8,20,0.74) 100%)"
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "calc(env(safe-area-inset-top) + 18px)",
          left: 20,
          zIndex: 6,
          display: "flex",
          alignItems: "flex-start",
          gap: 14
        }}
      >
        <img
          src={IBAND_LOGO_SRC}
          alt="iBand"
          style={{
            width: 86,
            height: 86,
            borderRadius: "50%",
            objectFit: "cover",
            boxShadow: "0 12px 28px rgba(0,0,0,0.25)"
          }}
        />

        <div style={{ paddingTop: 6 }}>
          <div
            style={{
              fontSize: "clamp(28px, 4.8vw, 44px)",
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: "-0.03em",
              color: "#ffffff",
              textShadow: "0 6px 18px rgba(0,0,0,0.3)"
            }}
          >
            iBand
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: "clamp(15px, 2.8vw, 23px)",
              fontWeight: 500,
              lineHeight: 1.08,
              color: "rgba(255,255,255,0.92)",
              textShadow: "0 4px 12px rgba(0,0,0,0.28)"
            }}
          >
            Powered By Fans
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "20.8dvh",
          right: 18,
          zIndex: 7,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8
          }}
        >
          <img
            src={avatarUrl}
            alt={item.artist}
            style={{
              width: 86,
              height: 86,
              borderRadius: "50%",
              objectFit: "cover",
              border: "3px solid rgba(255,255,255,0.92)",
              boxShadow: "0 12px 26px rgba(0,0,0,0.35)"
            }}
          />
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#ffffff",
              textShadow: "0 4px 10px rgba(0,0,0,0.32)"
            }}
          >
            Artist
          </div>
        </div>

        <div style={styles.rightRailGroup}>
          <button type="button" aria-label="Like" style={styles.rightRailButton}>
            <span style={styles.heartGlyph}>❤</span>
          </button>
          <div style={styles.rightRailCount}>{formatCompactCount(item.likes)}</div>
        </div>

        <div style={styles.rightRailGroup}>
          <button type="button" aria-label="Comments" style={styles.rightRailButton}>
            <span style={styles.commentGlyph}>💬</span>
          </button>
          <div style={styles.rightRailCount}>{item.comments}</div>
        </div>

        <div style={styles.rightRailGroup}>
          <button
            type="button"
            aria-label="Info"
            onClick={() => onOpenInfo(item)}
            style={styles.infoButton}
          >
            i
          </button>
        </div>

        <div style={styles.rightRailGroup}>
          <button type="button" aria-label="More" style={styles.dotsButton}>
            <span style={styles.dotsGlyph}>•••</span>
          </button>
        </div>

        <div style={styles.rightRailGroup}>
          <button
            type="button"
            aria-label="Open sound"
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              padding: 0,
              overflow: "hidden",
              border: "3px solid rgba(255,255,255,0.92)",
              boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
              background: "transparent",
              cursor: "pointer"
            }}
          >
            <img
              src={artworkUrl}
              alt={`${item.trackTitle} artwork`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />
          </button>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 22,
          right: 108,
          bottom: "calc(158px + env(safe-area-inset-bottom))",
          zIndex: 6,
          pointerEvents: "none"
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "white",
            fontSize: "clamp(32px, 5.4vw, 50px)",
            lineHeight: 1.06,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            textShadow: "0 4px 18px rgba(0,0,0,0.38)"
          }}
        >
          {item.artist} — <span style={{ fontWeight: 400 }}>“{item.trackTitle}”</span>
        </h2>

        <p
          style={{
            margin: "18px 0 0 0",
            color: "rgba(255,255,255,0.82)",
            fontSize: "clamp(16px, 3vw, 24px)",
            lineHeight: 1.14,
            fontWeight: 500,
            textShadow: "0 3px 10px rgba(0,0,0,0.32)"
          }}
        >
          {item.reasonTitle} {item.reasonSubtitle}
        </p>

        <p
          style={{
            margin: "18px 0 0 0",
            color: "rgba(255,255,255,0.92)",
            fontSize: "clamp(16px, 2.9vw, 22px)",
            lineHeight: 1.15,
            fontWeight: 500,
            textShadow: "0 3px 10px rgba(0,0,0,0.32)"
          }}
        >
          <span style={{ color: "#1e90ff", marginRight: 8 }}>♫</span>
          {item.releaseLabel}
        </p>

        <p
          style={{
            margin: "18px 0 0 0",
            color: "rgba(255,255,255,0.70)",
            fontSize: "clamp(15px, 2.6vw, 20px)",
            lineHeight: 1.1,
            fontWeight: 500
          }}
        >
          {item.comments} Comments
        </p>
      </div>
    </article>
  );
}

export default function Feed() {
  const [smartFeed, setSmartFeed] = useState([]);
  const [personalisedFeed, setPersonalisedFeed] = useState([]);
  const [predictiveFeed, setPredictiveFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [infoItem, setInfoItem] = useState(null);
  const [searchText, setSearchText] = useState("");

  const scrollRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    let isMounted = true;

    async function loadFeeds() {
      setLoading(true);

      const results = await Promise.allSettled([
        fetchSmartFeed(),
        fetchPersonalisedFeed(),
        fetchPredictiveFeed()
      ]);

      if (!isMounted) return;

      const [smartResult, personalisedResult, predictiveResult] = results;

      setSmartFeed(
        smartResult.status === "fulfilled"
          ? normaliseSmartFeed(smartResult.value)
          : []
      );

      setPersonalisedFeed(
        personalisedResult.status === "fulfilled"
          ? normalisePersonalisedFeed(personalisedResult.value)
          : []
      );

      setPredictiveFeed(
        predictiveResult.status === "fulfilled"
          ? normalisePredictiveFeed(predictiveResult.value)
          : []
      );

      setLoading(false);
    }

    loadFeeds();

    return () => {
      isMounted = false;
    };
  }, []);

  const unifiedFeed = useMemo(
    () =>
      buildUnifiedFeed({
        smart: smartFeed,
        personalised: personalisedFeed,
        predictive: predictiveFeed
      }),
    [smartFeed, personalisedFeed, predictiveFeed]
  );

  useEffect(() => {
    if (!scrollRef.current || !unifiedFeed.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) return;

        const index = Number(visibleEntry.target.getAttribute("data-index"));
        if (Number.isFinite(index)) {
          setActiveIndex(index);
        }
      },
      {
        root: scrollRef.current,
        threshold: [0.55, 0.7, 0.85]
      }
    );

    cardRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [unifiedFeed]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100dvh",
        background: "#030712",
        color: "white",
        overflow: "hidden"
      }}
    >
      <div
        ref={scrollRef}
        style={{
          position: "relative",
          height: "100dvh",
          overflowY: "auto",
          overflowX: "hidden",
          scrollSnapType: "y mandatory",
          scrollBehavior: "smooth",
          overscrollBehaviorY: "contain",
          WebkitOverflowScrolling: "touch",
          zIndex: 1
        }}
      >
        {loading && !unifiedFeed.length ? (
          <div
            style={{
              minHeight: "100dvh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.85)",
              fontSize: 18,
              fontWeight: 700
            }}
          >
            Loading iBand feed…
          </div>
        ) : (
          unifiedFeed.map((item, index) => (
            <div
              key={item.id}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
              data-index={index}
            >
              <FeedCard
                item={item}
                isActive={index === activeIndex}
                onOpenInfo={setInfoItem}
              />
            </div>
          ))
        )}
      </div>

      <div
        style={{
          position: "fixed",
          left: 14,
          right: 14,
          bottom: "calc(84px + env(safe-area-inset-bottom))",
          zIndex: 15,
          pointerEvents: "auto"
        }}
      >
        <div
          style={{
            height: 62,
            borderRadius: 32,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(10, 16, 32, 0.34)",
            boxShadow: "0 14px 30px rgba(0,0,0,0.28)",
            backdropFilter: "blur(18px)",
            display: "flex",
            alignItems: "center",
            padding: "0 18px",
            gap: 14
          }}
        >
          <span
            style={{
              fontSize: 30,
              lineHeight: 1,
              opacity: 0.98,
              color: "white"
            }}
          >
            ⌕
          </span>
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search artists, songs, genres"
            style={{
              flex: 1,
              height: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              color: "white",
              fontSize: 17,
              fontWeight: 500
            }}
          />
        </div>
      </div>

      <nav
        aria-label="Primary"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 14,
          height: "calc(82px + env(safe-area-inset-bottom))",
          paddingBottom: "env(safe-area-inset-bottom)",
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(2,6,18,0.90) 18%, rgba(2,6,18,0.98) 100%)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(18px)"
        }}
      >
        <div
          style={{
            height: 82,
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
            alignItems: "center",
            padding: "0 10px"
          }}
        >
          {[
            ["⌂", "Home"],
            ["⌑", "Shop"],
            ["+", ""],
            ["⌲", "Inbox"],
            ["◠", "Profile"]
          ].map(([icon, label], index) => {
            const isCenter = index === 2;

            if (isCenter) {
              return (
                <button
                  key="create"
                  type="button"
                  aria-label="Create"
                  style={{
                    justifySelf: "center",
                    width: 88,
                    height: 52,
                    borderRadius: 20,
                    border: "none",
                    background:
                      "linear-gradient(90deg, #7dd3fc 0%, #f8fafc 50%, #fb7185 100%)",
                    color: "#0f172a",
                    fontSize: 36,
                    fontWeight: 900,
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 14px 28px rgba(0,0,0,0.25)",
                    cursor: "pointer"
                  }}
                >
                  +
                </button>
              );
            }

            const isInbox = label === "Inbox";

            return (
              <button
                key={label}
                type="button"
                aria-label={label}
                style={{
                  position: "relative",
                  border: "none",
                  background: "transparent",
                  color: "white",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  cursor: "pointer"
                }}
              >
                <span
                  style={{
                    fontSize: 28,
                    lineHeight: 1
                  }}
                >
                  {icon}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.92)"
                  }}
                >
                  {label}
                </span>

                {isInbox ? (
                  <span
                    style={{
                      position: "absolute",
                      top: 4,
                      right: "calc(50% - 28px)",
                      minWidth: 24,
                      height: 24,
                      borderRadius: 12,
                      background: "#fb7185",
                      color: "white",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 900,
                      padding: "0 6px",
                      boxShadow: "0 8px 18px rgba(0,0,0,0.22)"
                    }}
                  >
                    2
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>

      <div
        style={{
          position: "fixed",
          left: "50%",
          bottom: "calc(6px + env(safe-area-inset-bottom))",
          transform: "translateX(-50%)",
          width: 132,
          height: 6,
          borderRadius: 999,
          background: "rgba(255,255,255,0.92)",
          zIndex: 20,
          pointerEvents: "none"
        }}
      />

      <InfoOverlay item={infoItem} onClose={() => setInfoItem(null)} />
    </div>
  );
}

const styles = {
  rightRailGroup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6
  },
  rightRailButton: {
    width: 58,
    height: 58,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(13, 19, 37, 0.18)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(12px)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.24)",
    cursor: "pointer"
  },
  infoButton: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(40, 56, 92, 0.30)",
    color: "white",
    fontSize: 42,
    fontWeight: 700,
    fontFamily: "Georgia, serif",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
    backdropFilter: "blur(12px)",
    cursor: "pointer"
  },
  dotsButton: {
    width: 58,
    height: 28,
    border: "none",
    background: "transparent",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer"
  },
  dotsGlyph: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: "0.06em",
    lineHeight: 1
  },
  heartGlyph: {
    fontSize: 38,
    lineHeight: 1,
    color: "white"
  },
  commentGlyph: {
    fontSize: 34,
    lineHeight: 1,
    color: "white"
  },
  rightRailCount: {
    color: "rgba(255,255,255,0.96)",
    fontSize: 16,
    fontWeight: 700,
    textShadow: "0 2px 6px rgba(0,0,0,0.35)"
  }
};
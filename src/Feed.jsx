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
    title: getString(item.cardTitle, "Sam Ryder — “Supernova Dreams”"),
    reasonTitle: getString(item.feedReasonTitle, "High Momentum +"),
    reasonSubtitle: getString(item.feedReasonSubtitle, "Trending Worldwide"),
    reasonText: getString(item.feedReason, "Recommended by iBand intelligence."),
    handle: getString(
      item.profileHandle,
      `@${String(item.artist || "samryder").replace(/\s+/g, "").toLowerCase()}`
    ),
    country: getString(item.country, "Nigeria"),
    region: getString(item.region, "Global"),
    trackTitle: getString(item.trackTitle, "Supernova Dreams"),
    releaseLabel: getString(item.releaseLabel, "iBand Exclusive — New Release"),
    artistImage: getString(item.artistImage, ""),
    artwork: getString(item.artwork, ""),
    videoUrl: getString(item.videoUrl, ""),
    comments: getNumber(item.comments, 322),
    likes: getNumber(item.likes, 3100),
    shares: getNumber(item.shares, 322)
  }));
}

function normalisePersonalisedFeed(data) {
  const items = Array.isArray(data?.feed)
    ? data.feed
    : Array.isArray(data?.profiles?.[0]?.feed)
    ? data.profiles[0].feed
    : [];

  return items.map((item, index) => ({
    id: item.id || `personalised-${index}`,
    feedType: "personalised",
    badge: "FOR YOU",
    artist: getString(item.artist, "Sam Ryder"),
    title: getString(item.cardTitle, "Sam Ryder — “Supernova Dreams”"),
    reasonTitle: getString(item.feedReasonTitle, "High Momentum +"),
    reasonSubtitle: getString(item.feedReasonSubtitle, "Trending Worldwide"),
    reasonText: getString(
      item.feedReason || item.message,
      "Matches your genre taste and strong breakout momentum."
    ),
    handle: getString(
      item.profileHandle,
      `@${String(item.artist || "samryder").replace(/\s+/g, "").toLowerCase()}`
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
    shares: getNumber(item.shares, 322)
  }));
}

function normalisePredictiveFeed(data) {
  const items = Array.isArray(data?.feed)
    ? data.feed
    : Array.isArray(data?.predictions)
    ? data.predictions
    : [];

  return items.map((item, index) => ({
    id: item.id || `predictive-${index}`,
    feedType: "predictive",
    badge: "PREDICTED",
    artist: getString(item.artist || item.recommendedArtist, "Sam Ryder"),
    title: getString(item.cardTitle, "Sam Ryder — “Supernova Dreams”"),
    reasonTitle: getString(item.feedReasonTitle, "High Momentum +"),
    reasonSubtitle: getString(item.feedReasonSubtitle, "Trending Worldwide"),
    reasonText: getString(
      item.feedReason || item.reason || item.message,
      "Watch this artist before the breakout."
    ),
    handle: getString(
      item.profileHandle,
      `@${String(item.artist || item.recommendedArtist || "samryder")
        .replace(/\s+/g, "")
        .toLowerCase()}`
    ),
    country: getString(item.country || item.userMode, "Brazil"),
    region: getString(item.region, "South America"),
    trackTitle: getString(item.trackTitle, "Supernova Dreams"),
    releaseLabel: getString(item.releaseLabel, "iBand Exclusive — New Release"),
    artistImage: getString(item.artistImage || item.profileImage, ""),
    artwork: getString(item.artwork, ""),
    videoUrl: getString(item.videoUrl, ""),
    comments: getNumber(item.comments, 322),
    likes: getNumber(item.likes, 3100),
    shares: getNumber(item.shares, 322)
  }));
}

function createFallbackFeed() {
  const base = [
    {
      id: "demo-ng",
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
      shares: 322
    },
    {
      id: "demo-jp",
      feedType: "smart",
      badge: "SMART",
      artist: "Demo Artist Japan",
      title: "Sam Ryder — “Supernova Dreams”",
      reasonTitle: "High Momentum +",
      reasonSubtitle: "Trending Worldwide",
      reasonText: "Radar and momentum signals increasing.",
      handle: "@demoartistjapan",
      country: "Japan",
      region: "Asia",
      trackTitle: "Supernova Dreams",
      releaseLabel: "iBand Exclusive — New Release",
      comments: 322,
      likes: 3100,
      shares: 322
    },
    {
      id: "demo-br",
      feedType: "predictive",
      badge: "PREDICTED",
      artist: "Demo Artist Brazil",
      title: "Sam Ryder — “Supernova Dreams”",
      reasonTitle: "High Momentum +",
      reasonSubtitle: "Trending Worldwide",
      reasonText: "Watch this artist before the breakout.",
      handle: "@demoartistbrazil",
      country: "Brazil",
      region: "South America",
      trackTitle: "Supernova Dreams",
      releaseLabel: "iBand Exclusive — New Release",
      comments: 322,
      likes: 3100,
      shares: 322
    }
  ];

  return base.map((item, index) => ({
    ...item,
    artistImage: "",
    artwork: "",
    videoUrl: "",
    fallbackPoster:
      "https://images.unsplash.com/photo-1571266028243-d220c9c3b7dc?auto=format&fit=crop&w=1200&q=80",
    artistAvatarFallback: createArtistAvatarDataUri(item.artist, index),
    artworkFallback: createArtworkDataUri(index)
  }));
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

function TikTokSearchIcon({ size = 18 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
      />
      <path
        d="M16.2 16.2l4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BottomNavHomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="27" height="27" aria-hidden="true">
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-4.8v-6h-4.4v6H5a1 1 0 01-1-1v-9.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function BottomNavShopIcon() {
  return (
    <svg viewBox="0 0 24 24" width="27" height="27" aria-hidden="true">
      <path
        d="M7 8V7a5 5 0 0110 0v1h2l-1.1 11H6.1L5 8h2zm2 0h6V7a3 3 0 00-6 0v1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BottomNavInboxIcon() {
  return (
    <svg viewBox="0 0 24 24" width="27" height="27" aria-hidden="true">
      <path
        d="M4 6h16l1 10h-5l-2 3h-4l-2-3H3L4 6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BottomNavProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" width="27" height="27" aria-hidden="true">
      <circle
        cx="12"
        cy="8"
        r="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path
        d="M5 20a7 7 0 0114 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FeedCard({ item, isActive, onOpenInfo, currentIndex, totalItems }) {
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
          filter: "saturate(1.04) contrast(1.02)",
          transform: isActive ? "scale(1.012)" : "scale(1)",
          transition: "transform 320ms ease"
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(4,7,20,0.38) 0%, rgba(4,7,20,0.12) 22%, rgba(4,7,20,0.08) 42%, rgba(4,7,20,0.30) 68%, rgba(4,7,20,0.84) 100%)"
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "calc(env(safe-area-inset-top) + 14px)",
          left: 16,
          zIndex: 6,
          display: "flex",
          alignItems: "center",
          gap: 10
        }}
      >
        <img
          src={IBAND_LOGO_SRC}
          alt="iBand"
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            objectFit: "cover",
            boxShadow: "0 8px 20px rgba(0,0,0,0.24)"
          }}
        />
        <div>
          <div
            style={{
              fontFamily:
                '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontSize: 18,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              textShadow: "0 2px 8px rgba(0,0,0,0.28)"
            }}
          >
            iBand
          </div>
          <div
            style={{
              marginTop: 4,
              fontFamily:
                '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontSize: 12,
              fontWeight: 500,
              lineHeight: 1.05,
              color: "rgba(255,255,255,0.88)",
              textShadow: "0 2px 8px rgba(0,0,0,0.24)"
            }}
          >
            Powered By Fans
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "25.2dvh",
          right: 14,
          zIndex: 6,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12
        }}
      >
        <div style={{ position: "relative", width: 68, height: 90 }}>
          <img
            src={avatarUrl}
            alt={item.artist}
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid rgba(255,255,255,0.94)",
              boxShadow: "0 10px 22px rgba(0,0,0,0.30)"
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 0,
              transform: "translateX(-50%)",
              color: "#ffffff",
              fontFamily:
                '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontSize: 11,
              fontWeight: 600,
              lineHeight: 1,
              textShadow: "0 2px 8px rgba(0,0,0,0.30)"
            }}
          >
            Artist
          </div>
        </div>

        {[
          { icon: "❤", count: formatCompactCount(item.likes), size: 33 },
          { icon: "💬", count: formatCompactCount(item.comments), size: 31 }
        ].map((action) => (
          <div
            key={action.icon}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 5
            }}
          >
            <button
              type="button"
              aria-label={action.icon}
              style={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(13,19,37,0.28)",
                color: "#ffffff",
                fontSize: action.size,
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(12px)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.22)",
                cursor: "pointer"
              }}
            >
              {action.icon}
            </button>
            <span
              style={{
                color: "rgba(255,255,255,0.96)",
                fontFamily:
                  '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                fontSize: 12,
                fontWeight: 700,
                lineHeight: 1,
                textShadow: "0 2px 6px rgba(0,0,0,0.30)"
              }}
            >
              {action.count}
            </span>
          </div>
        ))}

        <button
          type="button"
          aria-label="Open artist info"
          onClick={() => onOpenInfo(item)}
          style={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(13,19,37,0.28)",
            color: "#ffffff",
            fontSize: 30,
            fontWeight: 700,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 20px rgba(0,0,0,0.22)",
            cursor: "pointer"
          }}
        >
          ℹ
        </button>

        <button
          type="button"
          aria-label="More"
          style={{
            width: 54,
            height: 20,
            border: "none",
            background: "transparent",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.16em",
            cursor: "pointer",
            textShadow: "0 2px 8px rgba(0,0,0,0.30)"
          }}
        >
          •••
        </button>

        <button
          type="button"
          aria-label="Open sound"
          style={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            padding: 0,
            overflow: "hidden",
            border: "3px solid rgba(255,255,255,0.94)",
            boxShadow: "0 8px 20px rgba(0,0,0,0.22)",
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

      <div
        style={{
          position: "absolute",
          left: 18,
          right: 92,
          bottom: "20.2dvh",
          zIndex: 6,
          pointerEvents: "none"
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#ffffff",
            fontFamily:
              '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: 16,
            lineHeight: 1.16,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            textShadow: "0 3px 12px rgba(0,0,0,0.34)"
          }}
        >
          {item.title}
        </h2>

        <p
          style={{
            margin: "12px 0 0 0",
            color: "rgba(255,255,255,0.90)",
            fontFamily:
              '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: 11,
            lineHeight: 1.22,
            fontWeight: 500,
            textShadow: "0 2px 8px rgba(0,0,0,0.30)"
          }}
        >
          {item.reasonTitle} {item.reasonSubtitle}
        </p>

        <p
          style={{
            margin: "11px 0 0 0",
            color: "rgba(156,223,255,0.96)",
            fontFamily:
              '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: 10.5,
            lineHeight: 1.2,
            fontWeight: 600,
            textShadow: "0 2px 8px rgba(0,0,0,0.28)"
          }}
        >
          🎵 {item.releaseLabel}
        </p>

        <p
          style={{
            margin: "10px 0 0 0",
            color: "rgba(255,255,255,0.76)",
            fontFamily:
              '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: 10.5,
            lineHeight: 1.15,
            fontWeight: 500
          }}
        >
          {item.comments} Comments
        </p>
      </div>

      <div
        style={{
          position: "absolute",
          top: "11.8dvh",
          left: 18,
          zIndex: 6
        }}
      >
        <div
          style={{
            minWidth: 42,
            height: 34,
            borderRadius: 17,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 12px",
            background: "rgba(20,24,42,0.44)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.96)",
            fontFamily:
              '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: "0.01em",
            boxShadow: "0 10px 24px rgba(0,0,0,0.24)",
            backdropFilter: "blur(12px)"
          }}
        >
          #{Math.min(currentIndex + 1, totalItems)}
        </div>
      </div>
    </article>
  );
}

function InfoOverlay({ item, onClose }) {
  if (!item) return null;

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
          color: "#ffffff",
          padding: 20,
          fontFamily:
            '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
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
              color: "#ffffff",
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
              ["Artist", item.artist],
              ["Feed", item.badge],
              ["Territory", item.country || "Global"],
              ["Track", item.trackTitle]
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
                    color: "#ffffff",
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
        color: "#ffffff",
        overflow: "hidden",
        fontFamily:
          '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
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
                currentIndex={index}
                totalItems={unifiedFeed.length}
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
          bottom: "calc(86px + env(safe-area-inset-bottom))",
          zIndex: 15,
          pointerEvents: "auto"
        }}
      >
        <div
          style={{
            height: 50,
            borderRadius: 26,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(6, 10, 22, 0.28)",
            boxShadow: "0 12px 24px rgba(0,0,0,0.18)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            display: "flex",
            alignItems: "center",
            padding: "0 18px",
            gap: 12
          }}
        >
          <span
            style={{
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <TikTokSearchIcon size={18} />
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
              color: "#ffffff",
              fontFamily:
                '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontSize: 13,
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
            "linear-gradient(180deg, rgba(0,0,0,0.03) 0%, rgba(2,6,18,0.90) 18%, rgba(2,6,18,0.97) 100%)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
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
            [<BottomNavHomeIcon key="home" />, "Home"],
            [<BottomNavShopIcon key="shop" />, "Shop"],
            ["+", ""],
            [<BottomNavInboxIcon key="inbox" />, "Inbox"],
            [<BottomNavProfileIcon key="profile" />, "Profile"]
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
                    width: 86,
                    height: 46,
                    borderRadius: 16,
                    border: "none",
                    background:
                      "linear-gradient(90deg, #7dd3fc 0%, #f8fafc 50%, #fb7185 100%)",
                    color: "#0f172a",
                    fontSize: 34,
                    fontWeight: 900,
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 12px 24px rgba(0,0,0,0.18)",
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
                  color: "#ffffff",
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
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1
                  }}
                >
                  {icon}
                </span>

                <span
                  style={{
                    fontFamily:
                      '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    fontSize: 11,
                    fontWeight: label === "Home" ? 700 : 600,
                    color: "rgba(255,255,255,0.94)"
                  }}
                >
                  {label}
                </span>

                {isInbox ? (
                  <span
                    style={{
                      position: "absolute",
                      top: 4,
                      right: "calc(50% - 26px)",
                      minWidth: 22,
                      height: 22,
                      borderRadius: 11,
                      background: "#fb7185",
                      color: "#ffffff",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily:
                        '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                      fontSize: 12,
                      fontWeight: 800,
                      padding: "0 6px",
                      boxShadow: "0 8px 18px rgba(0,0,0,0.18)"
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

      <InfoOverlay item={infoItem} onClose={() => setInfoItem(null)} />
    </div>
  );
}
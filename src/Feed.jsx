import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchPersonalisedFeed,
  fetchPredictiveFeed,
  fetchSmartFeed
} from "./services/api";

const IBAND_LOGO_SRC = "/iband-logo.png";
const FEED_FONT_STACK =
  '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

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
    <svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220" fill="none">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="220" y2="220" gradientUnits="userSpaceOnUse">
          <stop stop-color="${start}" />
          <stop offset="1" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="220" height="220" rx="110" fill="url(#g)" />
      <circle cx="110" cy="84" r="32" fill="rgba(255,255,255,0.22)" />
      <path d="M54 178c11-30 35-47 56-47s45 17 56 47" fill="rgba(255,255,255,0.22)" />
      <text x="50%" y="57%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="46" font-family="Arial, Helvetica, sans-serif" font-weight="700">
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
      <circle cx="150" cy="150" r="76" stroke="rgba(255,255,255,0.30)" stroke-width="8" />
      <circle cx="150" cy="150" r="34" fill="rgba(255,255,255,0.22)" />
      <path d="M150 44v34" stroke="rgba(255,255,255,0.22)" stroke-width="4" stroke-linecap="round"/>
      <path d="M150 222v34" stroke="rgba(255,255,255,0.22)" stroke-width="4" stroke-linecap="round"/>
      <path d="M44 150h34" stroke="rgba(255,255,255,0.22)" stroke-width="4" stroke-linecap="round"/>
      <path d="M222 150h34" stroke="rgba(255,255,255,0.22)" stroke-width="4" stroke-linecap="round"/>
    </svg>
  `);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function isUsableImageSrc(value) {
  if (typeof value !== "string") return false;

  const src = value.trim();
  if (!src) return false;

  const invalidValues = new Set([
    "null",
    "undefined",
    "false",
    "none",
    "n/a",
    "na",
    "[object Object]"
  ]);

  if (invalidValues.has(src.toLowerCase())) return false;

  return (
    src.startsWith("/") ||
    src.startsWith("./") ||
    src.startsWith("../") ||
    src.startsWith("data:image/") ||
    src.startsWith("blob:") ||
    /^https?:\/\//i.test(src)
  );
}

function pickImageUrl(item) {
  const candidates = [
    item?.imageUrl,
    item?.artistImage,
    item?.avatarUrl,
    item?.profileImage,
    item?.coverImage,
    item?.thumbnailUrl,
    item?.photoUrl,
    item?.image,
    item?.artwork
  ];

  return candidates.find((value) => isUsableImageSrc(value)) || "";
}

function getString(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
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

function pickArtistLabel(item) {
  return getString(item.artistLabel, "Artist");
}

function getFeedBadge(feedType) {
  if (feedType === "smart") return "SMART";
  if (feedType === "predictive") return "PREDICTED";
  return "FOR YOU";
}

function normaliseSmartFeed(data) {
  const items = safeArray(data?.feed);

  return items.map((item, index) => {
    const artist = getString(item.artist, "Sam Ryder");
    const trackTitle = getString(item.trackTitle, "Supernova Dreams");
    const explicitTitle = getString(item.cardTitle, "");

    return {
      id: item.id || `smart-${index}`,
      feedType: "smart",
      badge: "SMART",
      artist,
      artistLabel: pickArtistLabel(item),
      title: explicitTitle || `${artist} — “${trackTitle}”`,
      reasonTitle: getString(item.feedReasonTitle, "High Momentum +"),
      reasonSubtitle: getString(item.feedReasonSubtitle, "Trending Worldwide"),
      reasonText: getString(
        item.feedReason || item.message,
        "Recommended by iBand intelligence."
      ),
      handle: getString(
        item.profileHandle,
        `@${artist.replace(/\s+/g, "").toLowerCase()}`
      ),
      country: getString(item.country, "Nigeria"),
      region: getString(item.region, "Global"),
      trackTitle,
      releaseLabel: getString(
        item.releaseLabel,
        "iBand Exclusive — New Release"
      ),
      artistImage: pickImageUrl(item),
      artwork: getString(item.artwork, ""),
      videoUrl: getString(item.videoUrl, ""),
      comments: getNumber(item.comments, 322),
      likes: getNumber(item.likes, 3100),
      saves: getNumber(item.saves, 451),
      shares: getNumber(item.shares, 322)
    };
  });
}

function normalisePersonalisedFeed(data) {
  const items = Array.isArray(data?.feed)
    ? data.feed
    : Array.isArray(data?.profiles?.[0]?.feed)
    ? data.profiles[0].feed
    : [];

  return items.map((item, index) => {
    const artist = getString(item.artist, "Sam Ryder");
    const trackTitle = getString(item.trackTitle, "Supernova Dreams");
    const explicitTitle = getString(item.cardTitle, "");

    return {
      id: item.id || `personalised-${index}`,
      feedType: "personalised",
      badge: "FOR YOU",
      artist,
      artistLabel: pickArtistLabel(item),
      title: explicitTitle || `${artist} — “${trackTitle}”`,
      reasonTitle: getString(item.feedReasonTitle, "High Momentum +"),
      reasonSubtitle: getString(item.feedReasonSubtitle, "Trending Worldwide"),
      reasonText: getString(
        item.feedReason || item.message,
        "Matches your genre taste and strong breakout momentum."
      ),
      handle: getString(
        item.profileHandle,
        `@${artist.replace(/\s+/g, "").toLowerCase()}`
      ),
      country: getString(item.country, "United Kingdom"),
      region: getString(item.region, "Europe"),
      trackTitle,
      releaseLabel: getString(
        item.releaseLabel,
        "iBand Exclusive — New Release"
      ),
      artistImage: pickImageUrl(item),
      artwork: getString(item.artwork, ""),
      videoUrl: getString(item.videoUrl, ""),
      comments: getNumber(item.comments, 322),
      likes: getNumber(item.likes, 3100),
      saves: getNumber(item.saves, 451),
      shares: getNumber(item.shares, 322)
    };
  });
}

function normalisePredictiveFeed(data) {
  const items = Array.isArray(data?.feed)
    ? data.feed
    : Array.isArray(data?.predictions)
    ? data.predictions
    : [];

  return items.map((item, index) => {
    const artist = getString(item.artist || item.recommendedArtist, "Sam Ryder");
    const trackTitle = getString(item.trackTitle, "Supernova Dreams");
    const explicitTitle = getString(item.cardTitle, "");

    return {
      id: item.id || `predictive-${index}`,
      feedType: "predictive",
      badge: "PREDICTED",
      artist,
      artistLabel: pickArtistLabel(item),
      title: explicitTitle || `${artist} — “${trackTitle}”`,
      reasonTitle: getString(item.feedReasonTitle, "High Momentum +"),
      reasonSubtitle: getString(item.feedReasonSubtitle, "Trending Worldwide"),
      reasonText: getString(
        item.feedReason || item.reason || item.message,
        "Watch this artist before the breakout."
      ),
      handle: getString(
        item.profileHandle,
        `@${artist.replace(/\s+/g, "").toLowerCase()}`
      ),
      country: getString(item.country || item.userMode, "Brazil"),
      region: getString(item.region, "South America"),
      trackTitle,
      releaseLabel: getString(
        item.releaseLabel,
        "iBand Exclusive — New Release"
      ),
      artistImage: pickImageUrl(item),
      artwork: getString(item.artwork, ""),
      videoUrl: getString(item.videoUrl, ""),
      comments: getNumber(item.comments, 322),
      likes: getNumber(item.likes, 3100),
      saves: getNumber(item.saves, 451),
      shares: getNumber(item.shares, 322)
    };
  });
}

function createFallbackFeed() {
  const base = [
    {
      id: "demo-ng",
      feedType: "personalised",
      badge: "FOR YOU",
      artist: "Sam Ryder",
      artistLabel: "Artist",
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
      saves: 451,
      shares: 322
    },
    {
      id: "demo-jp",
      feedType: "smart",
      badge: "SMART",
      artist: "Demo Artist Japan",
      artistLabel: "Artist",
      title: "Demo Artist Japan — “Supernova Dreams”",
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
      saves: 451,
      shares: 322
    },
    {
      id: "demo-br",
      feedType: "predictive",
      badge: "PREDICTED",
      artist: "Demo Artist Brazil",
      artistLabel: "Artist",
      title: "Demo Artist Brazil — “Supernova Dreams”",
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
      saves: 451,
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
    badge: item.badge || getFeedBadge(item.feedType),
    title: item.title || `${item.artist} — “${item.trackTitle || "New Release"}”`,
    fallbackPoster:
      item.fallbackPoster ||
      "https://images.unsplash.com/photo-1571266028243-d220c9c3b7dc?auto=format&fit=crop&w=1200&q=80",
    artistAvatarFallback:
      item.artistAvatarFallback || createArtistAvatarDataUri(item.artist, index),
    artworkFallback: item.artworkFallback || createArtworkDataUri(index)
  }));
}

function dedupeTitle(title, artist, trackTitle) {
  const cleanedTitle = getString(title, "");
  const cleanedArtist = getString(artist, "");
  const cleanedTrack = getString(trackTitle, "");

  const artistTrackPattern = new RegExp(
    `^${cleanedArtist.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+[—-]\\s+[“"]?${cleanedTrack.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[”"]?$`,
    "i"
  );

  if (artistTrackPattern.test(cleanedTitle)) {
    return { headingArtist: cleanedArtist, headingTrack: cleanedTrack };
  }

  return { headingArtist: cleanedArtist, headingTrack: cleanedTrack };
}

function IconLive() {
  return (
    <svg viewBox="0 0 24 24" style={styles.topIconSvg} aria-hidden="true">
      <rect
        x="4"
        y="6"
        width="16"
        height="12"
        rx="2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path
        d="M8 4.6h8M9.6 19.4h4.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <text
        x="12"
        y="14"
        textAnchor="middle"
        fontSize="5.4"
        fontWeight="800"
        fill="currentColor"
      >
        LIVE
      </text>
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" style={styles.topIconSvg} aria-hidden="true">
      <circle
        cx="11"
        cy="11"
        r="6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16 16l4.2 4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" style={styles.bottomIconSvg} aria-hidden="true">
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-4.8v-6H9.8v6H5a1 1 0 01-1-1v-9.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconBag() {
  return (
    <svg viewBox="0 0 24 24" style={styles.bottomIconSvg} aria-hidden="true">
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

function IconInbox() {
  return (
    <svg viewBox="0 0 24 24" style={styles.bottomIconSvg} aria-hidden="true">
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

function IconProfile() {
  return (
    <svg viewBox="0 0 24 24" style={styles.bottomIconSvg} aria-hidden="true">
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

function IconHeart() {
  return (
    <svg viewBox="0 0 24 24" style={styles.rightIconSvg} aria-hidden="true">
      <path
        d="M12 20.4l-1.1-1C5.3 14.4 2 11.4 2 7.8 2 5 4.2 3 7 3c1.7 0 3.4.8 5 2.7C13.6 3.8 15.3 3 17 3c2.8 0 5 2 5 4.8 0 3.6-3.3 6.6-8.9 11.6l-1.1 1z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconComment() {
  return (
    <svg viewBox="0 0 24 24" style={styles.rightIconSvg} aria-hidden="true">
      <path
        d="M6 6h12a3 3 0 013 3v4a3 3 0 01-3 3h-5l-4.5 3v-3H6a3 3 0 01-3-3V9a3 3 0 013-3z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconBookmark() {
  return (
    <svg viewBox="0 0 24 24" style={styles.rightIconSvg} aria-hidden="true">
      <path
        d="M7 4.5h10a1 1 0 011 1V20l-6-3.8L6 20V5.5a1 1 0 011-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconShare() {
  return (
    <svg viewBox="0 0 24 24" style={styles.rightIconSvg} aria-hidden="true">
      <path
        d="M7 17c5.7-1 8.8-4.6 10.5-9.2M12.2 7.1h5.3v5.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg viewBox="0 0 24 24" style={styles.rightIconSvg} aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="8" r="1.25" fill="currentColor" />
      <path
        d="M12 11v5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSoundDots() {
  return (
    <svg viewBox="0 0 28 8" style={styles.dotsSvg} aria-hidden="true">
      <circle cx="4" cy="4" r="2.2" fill="currentColor" />
      <circle cx="14" cy="4" r="2.2" fill="currentColor" />
      <circle cx="24" cy="4" r="2.2" fill="currentColor" />
    </svg>
  );
}

function InfoOverlay({ item, onClose }) {
  if (!item) return null;

  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={styles.infoOverlay}>
      <div
        onClick={(event) => event.stopPropagation()}
        style={styles.infoCard}
      >
        <div style={styles.infoHeader}>
          <div>
            <div style={styles.infoEyebrow}>IBAND INFO</div>
            <h3 style={styles.infoTitle}>{item.artist}</h3>
            <p style={styles.infoSubTitle}>{item.trackTitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close info"
            style={styles.infoCloseButton}
          >
            ×
          </button>
        </div>

        <div style={styles.infoSection}>
          <div style={styles.infoSectionLabel}>PERSONALISATION DETAILS</div>

          <div style={styles.infoGrid}>
            {[
              ["Artist", item.artist],
              ["Feed", item.badge],
              ["Territory", item.country || "Global"],
              ["Track", item.trackTitle]
            ].map(([label, value]) => (
              <div key={label} style={styles.infoRow}>
                <span style={styles.infoRowLabel}>{label}</span>
                <span style={styles.infoRowValue}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.infoButtonGrid}>
          {["Artist bio", "Lyrics", "Concerts", "Merch"].map((label) => (
            <button key={label} type="button" style={styles.infoActionButton}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeedCard({ item, isActive, onOpenInfo, currentIndex, totalItems }) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [artFailed, setArtFailed] = useState(false);

  const posterUrl = item.videoUrl || item.fallbackPoster;
  const avatarUrl =
    isUsableImageSrc(item.artistImage) && !avatarFailed
      ? item.artistImage
      : item.artistAvatarFallback;
  const artworkUrl =
    isUsableImageSrc(item.artwork) && !artFailed
      ? item.artwork
      : item.artworkFallback;

  const heading = dedupeTitle(item.title, item.artist, item.trackTitle);

  return (
    <article style={styles.slide}>
      <div
        style={{
          ...styles.posterLayer,
          backgroundImage: `url("${posterUrl}")`,
          transform: isActive ? "scale(1.015)" : "scale(1)"
        }}
      />

      <div style={styles.posterTopFade} />
      <div style={styles.posterBottomFade} />
      <div style={styles.posterMidFade} />

      <div style={styles.rankBadge}>#{Math.min(currentIndex + 1, totalItems)}</div>

      <div style={styles.rightRail}>
        <div style={styles.avatarRailBlock}>
          <div style={styles.avatarWrap}>
            <img
              src={avatarUrl}
              alt={item.artist}
              style={styles.avatarImage}
              onError={() => setAvatarFailed(true)}
            />
            <button type="button" aria-label={`Follow ${item.artist}`} style={styles.followPlusButton}>
              +
            </button>
          </div>
          <div style={styles.avatarLabel}>{item.artistLabel}</div>
        </div>

        <div style={styles.rightActionBlock}>
          <button type="button" aria-label="Like" style={styles.rightActionButton}>
            <IconHeart />
          </button>
          <div style={styles.rightActionCount}>{formatCompactCount(item.likes)}</div>
        </div>

        <div style={styles.rightActionBlock}>
          <button type="button" aria-label="Comments" style={styles.rightActionButton}>
            <IconComment />
          </button>
          <div style={styles.rightActionCount}>{formatCompactCount(item.comments)}</div>
        </div>

        <div style={styles.rightActionBlock}>
          <button type="button" aria-label="Save" style={styles.rightActionButton}>
            <IconBookmark />
          </button>
          <div style={styles.rightActionCount}>{formatCompactCount(item.saves)}</div>
        </div>

        <div style={styles.rightActionBlock}>
          <button type="button" aria-label="Share" style={styles.rightActionButton}>
            <IconShare />
          </button>
          <div style={styles.rightActionCount}>{formatCompactCount(item.shares)}</div>
        </div>

        <div style={styles.rightActionBlock}>
          <button
            type="button"
            aria-label="Open info"
            style={styles.rightActionButton}
            onClick={() => onOpenInfo(item)}
          >
            <IconInfo />
          </button>
        </div>

        <button type="button" aria-label="More" style={styles.soundDotsButton}>
          <IconSoundDots />
        </button>

        <button type="button" aria-label="Open sound" style={styles.soundDiscButton}>
          <img
            src={artworkUrl}
            alt={`${item.trackTitle} artwork`}
            style={styles.soundDiscImage}
            onError={() => setArtFailed(true)}
          />
        </button>
      </div>

      <div style={styles.contentOverlay}>
        <div style={styles.artistTitleRow}>
          <span style={styles.artistNameText}>{heading.headingArtist}</span>
          <span style={styles.artistVerified}>✓</span>
        </div>

        <div style={styles.trackTitleText}>— “{heading.headingTrack}”</div>

        <div style={styles.reasonLine}>
          {item.reasonTitle} {item.reasonSubtitle}
        </div>

        <div style={styles.musicLine}>
          <span style={styles.musicNote}>♫</span>
          <span>{item.releaseLabel}</span>
        </div>

        <div style={styles.commentLine}>{item.comments} Comments</div>

        <div style={styles.badgePill}>{item.badge}</div>
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
  const [activeTopTab, setActiveTopTab] = useState("for-you");
  const [logoFailed, setLogoFailed] = useState(false);

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

  const topTabs = [
    { key: "live", label: "LIVE", icon: true },
    { key: "country", label: "Oxfordshire" },
    { key: "following", label: "Following" },
    { key: "friends", label: "Friends" },
    { key: "for-you", label: "For You" }
  ];

  return (
    <div style={styles.page}>
      <div style={styles.fixedTopOverlay}>
        <div style={styles.logoCluster}>
          {!logoFailed ? (
            <img
              src={IBAND_LOGO_SRC}
              alt="iBand"
              style={styles.logoImage}
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <div style={styles.logoFallback}>iB</div>
          )}

          <div style={styles.logoCopy}>
            <div style={styles.logoWordmark}>iBand</div>
            <div style={styles.logoSubline}>Powered By Fans</div>
          </div>
        </div>

        <div style={styles.topTabsWrap}>
          {topTabs.map((tab) => {
            const isActive = activeTopTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTopTab(tab.key)}
                style={styles.topTabButton}
              >
                {tab.icon ? (
                  <span style={styles.liveIconWrap}>
                    <IconLive />
                  </span>
                ) : null}

                <span
                  style={{
                    ...styles.topTabLabel,
                    ...(isActive ? styles.topTabLabelActive : {})
                  }}
                >
                  {tab.label}
                </span>

                {isActive ? <span style={styles.topTabUnderline} /> : null}
              </button>
            );
          })}
        </div>

        <button type="button" aria-label="Search" style={styles.topSearchButton}>
          <IconSearch />
        </button>
      </div>

      <div ref={scrollRef} style={styles.scroller}>
        {loading && !unifiedFeed.length ? (
          <div style={styles.loadingState}>Loading iBand feed…</div>
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

      <div style={styles.searchDock}>
        <div style={styles.searchShell}>
          <div style={styles.searchIconWrap}>
            <IconSearch />
          </div>

          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search artists, songs, genres"
            style={styles.searchInput}
          />
        </div>
      </div>

      <nav aria-label="Primary" style={styles.bottomNav}>
        <div style={styles.bottomNavInner}>
          <button type="button" style={styles.bottomNavButton}>
            <IconHome />
            <span style={styles.bottomNavLabelActive}>Home</span>
          </button>

          <button type="button" style={styles.bottomNavButton}>
            <IconBag />
            <span style={styles.bottomNavLabel}>Shop</span>
          </button>

          <button type="button" aria-label="Create" style={styles.createButton}>
            <span style={styles.createButtonBlue} />
            <span style={styles.createButtonRed} />
            <span style={styles.createButtonCenter}>+</span>
          </button>

          <button type="button" style={styles.bottomNavButton}>
            <div style={styles.inboxBadgeWrap}>
              <IconInbox />
              <span style={styles.inboxBadge}>2</span>
            </div>
            <span style={styles.bottomNavLabel}>Inbox</span>
          </button>

          <button type="button" style={styles.bottomNavButton}>
            <IconProfile />
            <span style={styles.bottomNavLabel}>Profile</span>
          </button>
        </div>
      </nav>

      <InfoOverlay item={infoItem} onClose={() => setInfoItem(null)} />
    </div>
  );
}

const styles = {
  page: {
    position: "fixed",
    inset: 0,
    width: "100vw",
    height: "100dvh",
    overflow: "hidden",
    background: "#000000",
    color: "#ffffff",
    fontFamily: FEED_FONT_STACK
  },
  scroller: {
    position: "relative",
    width: "100%",
    height: "100dvh",
    overflowY: "auto",
    overflowX: "hidden",
    scrollSnapType: "y mandatory",
    overscrollBehaviorY: "contain",
    WebkitOverflowScrolling: "touch",
    background: "#000000"
  },
  slide: {
    position: "relative",
    width: "100%",
    height: "100dvh",
    minHeight: "100dvh",
    scrollSnapAlign: "start",
    scrollSnapStop: "always",
    overflow: "hidden",
    background: "#020617"
  },
  posterLayer: {
    position: "absolute",
    inset: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "saturate(1.05) contrast(1.04)",
    transition: "transform 320ms ease"
  },
  posterTopFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "24%",
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.16) 56%, rgba(0,0,0,0) 100%)"
  },
  posterBottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "42%",
    background:
      "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 22%, rgba(0,0,0,0.38) 70%, rgba(0,0,0,0.82) 100%)"
  },
  posterMidFade: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 24% 30%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 18%, rgba(255,255,255,0) 42%)"
  },
  fixedTopOverlay: {
    position: "fixed",
    top: "calc(env(safe-area-inset-top) + 8px)",
    left: 0,
    right: 0,
    zIndex: 30,
    pointerEvents: "none",
    height: 66
  },
  logoCluster: {
    position: "absolute",
    top: 2,
    left: "max(12px, calc(env(safe-area-inset-left) + 6px))",
    display: "flex",
    alignItems: "center",
    gap: 8,
    pointerEvents: "none",
    width: 132
  },
  logoImage: {
    width: 50,
    height: 50,
    objectFit: "contain",
    display: "block",
    filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.24))"
  },
  logoFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #7c3aed 0%, #f97316 100%)",
    fontSize: 20,
    fontWeight: 900,
    color: "#ffffff"
  },
  logoCopy: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minWidth: 0
  },
  logoWordmark: {
    fontSize: 15,
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: "-0.02em",
    color: "#ffffff",
    textShadow: "0 2px 10px rgba(0,0,0,0.40)"
  },
  logoSubline: {
    marginTop: 4,
    fontSize: 10.5,
    lineHeight: 1.05,
    fontWeight: 500,
    color: "rgba(255,255,255,0.90)",
    textShadow: "0 2px 10px rgba(0,0,0,0.36)"
  },
  topTabsWrap: {
    position: "absolute",
    top: 10,
    left: 148,
    right: 52,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  topTabButton: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    gap: 5,
    position: "relative",
    padding: 0,
    pointerEvents: "auto",
    cursor: "pointer",
    flexShrink: 0
  },
  liveIconWrap: {
    display: "inline-flex",
    alignItems: "center"
  },
  topTabLabel: {
    fontSize: 10.5,
    lineHeight: 1.1,
    fontWeight: 700,
    color: "rgba(255,255,255,0.70)",
    textShadow: "0 2px 8px rgba(0,0,0,0.35)",
    whiteSpace: "nowrap"
  },
  topTabLabelActive: {
    color: "#ffffff"
  },
  topTabUnderline: {
    position: "absolute",
    left: "50%",
    bottom: -8,
    transform: "translateX(-50%)",
    width: 28,
    height: 2.5,
    borderRadius: 999,
    background: "#ffffff"
  },
  topSearchButton: {
    position: "absolute",
    top: 8,
    right: "max(10px, calc(env(safe-area-inset-right) + 4px))",
    width: 34,
    height: 34,
    borderRadius: 17,
    border: "none",
    background: "transparent",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "auto",
    cursor: "pointer"
  },
  topIconSvg: {
    width: 26,
    height: 26,
    display: "block",
    color: "#ffffff",
    filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.38))"
  },
  rankBadge: {
    position: "absolute",
    top: "110px",
    left: "max(14px, calc(env(safe-area-inset-left) + 8px))",
    zIndex: 8,
    minWidth: 62,
    height: 42,
    padding: "0 16px",
    borderRadius: 22,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(255,255,255,0.96)",
    fontSize: 17,
    fontWeight: 900,
    background: "rgba(8,12,28,0.30)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.16)",
    backdropFilter: "blur(14px)"
  },
  rightRail: {
    position: "absolute",
    right: "max(8px, calc(env(safe-area-inset-right) + 2px))",
    top: "194px",
    bottom: "204px",
    zIndex: 9,
    width: 72,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 18
  },
  avatarRailBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 7
  },
  avatarWrap: {
    position: "relative",
    width: 74,
    height: 74
  },
  avatarImage: {
    width: 74,
    height: 74,
    borderRadius: "50%",
    objectFit: "cover",
    display: "block",
    border: "3px solid rgba(255,255,255,0.94)",
    boxShadow: "0 12px 26px rgba(0,0,0,0.32)"
  },
  followPlusButton: {
    position: "absolute",
    right: -3,
    bottom: -1,
    width: 22,
    height: 22,
    borderRadius: 11,
    border: "2px solid #ffffff",
    background: "#ff3d6e",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 900,
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(0,0,0,0.26)"
  },
  avatarLabel: {
    fontSize: 10.5,
    lineHeight: 1,
    fontWeight: 700,
    color: "#ffffff",
    textShadow: "0 2px 8px rgba(0,0,0,0.36)"
  },
  rightActionBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6
  },
  rightActionButton: {
    appearance: "none",
    width: 54,
    height: 54,
    borderRadius: 27,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(10,14,28,0.26)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(12px)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.20)",
    cursor: "pointer",
    padding: 0
  },
  rightIconSvg: {
    width: 27,
    height: 27,
    display: "block",
    color: "#ffffff"
  },
  rightActionCount: {
    fontSize: 11.5,
    lineHeight: 1,
    fontWeight: 800,
    color: "rgba(255,255,255,0.96)",
    textShadow: "0 2px 8px rgba(0,0,0,0.35)"
  },
  soundDotsButton: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 18,
    cursor: "pointer",
    padding: 0
  },
  dotsSvg: {
    width: 26,
    height: 8,
    display: "block",
    color: "#ffffff"
  },
  soundDiscButton: {
    appearance: "none",
    width: 58,
    height: 58,
    borderRadius: 29,
    border: "3px solid rgba(255,255,255,0.95)",
    padding: 0,
    overflow: "hidden",
    background: "transparent",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(0,0,0,0.24)"
  },
  soundDiscImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block"
  },
  contentOverlay: {
    position: "absolute",
    left: "max(14px, calc(env(safe-area-inset-left) + 8px))",
    right: "92px",
    bottom: "198px",
    zIndex: 8,
    maxWidth: "min(66vw, 470px)"
  },
  artistTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap"
  },
  artistNameText: {
    fontSize: 16.5,
    lineHeight: 1.08,
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "-0.02em",
    textShadow: "0 3px 12px rgba(0,0,0,0.38)"
  },
  artistVerified: {
    width: 16,
    height: 16,
    borderRadius: 8,
    background: "#3b82f6",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: 10,
    fontWeight: 900,
    lineHeight: 1,
    flexShrink: 0
  },
  trackTitleText: {
    marginTop: 4,
    fontSize: 16.5,
    lineHeight: 1.08,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: "-0.02em",
    textShadow: "0 3px 12px rgba(0,0,0,0.38)"
  },
  reasonLine: {
    marginTop: 13,
    fontSize: 12.5,
    lineHeight: 1.18,
    fontWeight: 500,
    color: "rgba(255,255,255,0.88)",
    textShadow: "0 2px 8px rgba(0,0,0,0.30)"
  },
  musicLine: {
    marginTop: 13,
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontSize: 11,
    lineHeight: 1.16,
    fontWeight: 600,
    color: "#9edfff",
    textShadow: "0 2px 8px rgba(0,0,0,0.26)"
  },
  musicNote: {
    fontSize: 16,
    lineHeight: 1
  },
  commentLine: {
    marginTop: 12,
    fontSize: 11,
    lineHeight: 1.1,
    fontWeight: 500,
    color: "rgba(255,255,255,0.76)"
  },
  badgePill: {
    marginTop: 14,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
    padding: "0 16px",
    borderRadius: 18,
    background: "rgba(8,12,28,0.28)",
    border: "1px solid rgba(255,255,255,0.13)",
    fontSize: 11,
    lineHeight: 1,
    fontWeight: 800,
    letterSpacing: "0.10em",
    color: "#ffffff",
    boxShadow: "0 8px 20px rgba(0,0,0,0.16)",
    backdropFilter: "blur(12px)"
  },
  searchDock: {
    position: "fixed",
    left: 12,
    right: 12,
    bottom: "calc(82px + env(safe-area-inset-bottom))",
    zIndex: 25
  },
  searchShell: {
    width: "100%",
    maxWidth: "calc(100vw - 24px)",
    height: 56,
    margin: "0 auto",
    borderRadius: 30,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(5,9,22,0.34)",
    boxShadow:
      "0 12px 28px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    overflow: "hidden"
  },
  searchIconWrap: {
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    flexShrink: 0
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#ffffff",
    fontSize: 13,
    lineHeight: 1.2,
    fontWeight: 500,
    fontFamily: FEED_FONT_STACK
  },
  bottomNav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 24,
    height: "calc(78px + env(safe-area-inset-bottom))",
    paddingBottom: "env(safe-area-inset-bottom)",
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(2,6,18,0.88) 18%, rgba(2,6,18,0.98) 100%)",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    backdropFilter: "blur(16px)"
  },
  bottomNavInner: {
    height: 78,
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
    alignItems: "center",
    padding: "0 8px"
  },
  bottomNavButton: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    cursor: "pointer",
    minWidth: 0
  },
  bottomIconSvg: {
    width: 25,
    height: 25,
    display: "block",
    color: "#ffffff"
  },
  bottomNavLabel: {
    fontSize: 10,
    lineHeight: 1,
    fontWeight: 600,
    color: "rgba(255,255,255,0.84)"
  },
  bottomNavLabelActive: {
    fontSize: 10,
    lineHeight: 1,
    fontWeight: 700,
    color: "#ffffff"
  },
  createButton: {
    appearance: "none",
    border: "none",
    background: "transparent",
    position: "relative",
    width: 84,
    height: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
    justifySelf: "center"
  },
  createButtonBlue: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    width: 52,
    height: 44,
    borderRadius: 14,
    background: "#7dd3fc"
  },
  createButtonRed: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    width: 52,
    height: 44,
    borderRadius: 14,
    background: "#fb7185"
  },
  createButtonCenter: {
    position: "relative",
    zIndex: 1,
    width: 52,
    height: 44,
    borderRadius: 14,
    background: "#ffffff",
    color: "#111111",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 34,
    lineHeight: 1,
    fontWeight: 700
  },
  inboxBadgeWrap: {
    position: "relative",
    display: "inline-flex"
  },
  inboxBadge: {
    position: "absolute",
    top: -7,
    right: -12,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    background: "#fb7185",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    lineHeight: 1,
    fontWeight: 800,
    padding: "0 6px",
    boxShadow: "0 8px 18px rgba(0,0,0,0.20)"
  },
  loadingState: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(255,255,255,0.88)",
    fontSize: 18,
    fontWeight: 700,
    fontFamily: FEED_FONT_STACK
  },
  infoOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 40,
    background: "rgba(3, 6, 16, 0.58)",
    backdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "18px 14px calc(16px + env(safe-area-inset-bottom))"
  },
  infoCard: {
    width: "min(760px, 100%)",
    borderRadius: 26,
    border: "1px solid rgba(255,255,255,0.12)",
    background:
      "linear-gradient(180deg, rgba(12,18,35,0.94) 0%, rgba(9,14,28,0.96) 100%)",
    boxShadow: "0 24px 50px rgba(0,0,0,0.35)",
    color: "white",
    padding: 20
  },
  infoHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14
  },
  infoEyebrow: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.14em",
    color: "rgba(156,223,255,0.95)"
  },
  infoTitle: {
    margin: "8px 0 0 0",
    fontSize: 28,
    lineHeight: 1.05,
    fontWeight: 900
  },
  infoSubTitle: {
    margin: "8px 0 0 0",
    color: "rgba(255,255,255,0.78)",
    fontSize: 16,
    fontWeight: 600
  },
  infoCloseButton: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    fontSize: 22,
    lineHeight: 1,
    cursor: "pointer"
  },
  infoSection: {
    marginTop: 16,
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    padding: 16
  },
  infoSectionLabel: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.12em",
    color: "rgba(255,255,255,0.66)"
  },
  infoGrid: {
    marginTop: 12,
    display: "grid",
    gap: 12
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    paddingBottom: 10
  },
  infoRowLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15,
    fontWeight: 700
  },
  infoRowValue: {
    color: "white",
    fontSize: 16,
    fontWeight: 800,
    textAlign: "right"
  },
  infoButtonGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12
  },
  infoActionButton: {
    height: 48,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer"
  }
};
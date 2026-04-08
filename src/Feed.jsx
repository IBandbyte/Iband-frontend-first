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
      <path d="M150 44v34" stroke="rgba(255,255,255,0.22)" stroke-width="4" stroke-linecap="round" />
      <path d="M150 222v34" stroke="rgba(255,255,255,0.22)" stroke-width="4" stroke-linecap="round" />
      <path d="M44 150h34" stroke="rgba(255,255,255,0.22)" stroke-width="4" stroke-linecap="round" />
      <path d="M222 150h34" stroke="rgba(255,255,255,0.22)" stroke-width="4" stroke-linecap="round" />
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

function normaliseSmartFeed(data) {
  const items = safeArray(data?.feed);

  return items.map((item, index) => {
    const artist = getString(item.artist, "Demo Artist Japan");
    const trackTitle = getString(item.trackTitle, "Tokyo Lights");

    return {
      id: item.id || `smart-${index}`,
      feedType: "smart",
      badge: "SMART",
      artist,
      title: getString(item.cardTitle, `${artist} — “${trackTitle}”`),
      reasonTitle: getString(item.feedReasonTitle, "High Momentum +"),
      reasonSubtitle: getString(item.feedReasonSubtitle, "Trending Worldwide"),
      reasonText: getString(
        item.feedReason || item.message,
        "Radar and momentum signals increasing."
      ),
      country: getString(item.country, "Japan"),
      region: getString(item.region, "Asia"),
      trackTitle,
      releaseLabel: getString(item.releaseLabel, "iBand Exclusive — New Release"),
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
    const artist = getString(item.artist, "Demo Artist Nigeria");
    const trackTitle = getString(item.trackTitle, "Supernova Dreams");

    return {
      id: item.id || `personalised-${index}`,
      feedType: "personalised",
      badge: "FOR YOU",
      artist,
      title: getString(item.cardTitle, `${artist} — “${trackTitle}”`),
      reasonTitle: getString(item.feedReasonTitle, "High Momentum +"),
      reasonSubtitle: getString(item.feedReasonSubtitle, "Trending Worldwide"),
      reasonText: getString(
        item.feedReason || item.message,
        "Matches your genre taste and strong breakout momentum."
      ),
      country: getString(item.country, "United Kingdom"),
      region: getString(item.region, "Europe"),
      trackTitle,
      releaseLabel: getString(item.releaseLabel, "iBand Exclusive — New Release"),
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
    const artist = getString(item.artist || item.recommendedArtist, "Demo Artist Brazil");
    const trackTitle = getString(item.trackTitle, "Rio Pulse");

    return {
      id: item.id || `predictive-${index}`,
      feedType: "predictive",
      badge: "PREDICTED",
      artist,
      title: getString(item.cardTitle, `${artist} — “${trackTitle}”`),
      reasonTitle: getString(item.feedReasonTitle, "High Momentum +"),
      reasonSubtitle: getString(item.feedReasonSubtitle, "Trending Worldwide"),
      reasonText: getString(
        item.feedReason || item.reason || item.message,
        "Watch this artist before the breakout."
      ),
      country: getString(item.country || item.userMode, "Brazil"),
      region: getString(item.region, "South America"),
      trackTitle,
      releaseLabel: getString(item.releaseLabel, "iBand Exclusive — New Release"),
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
      artist: "Demo Artist Nigeria",
      title: "Demo Artist Nigeria — “Supernova Dreams”",
      reasonTitle: "High Momentum +",
      reasonSubtitle: "Trending Worldwide",
      reasonText: "Matches your genre taste and strong breakout momentum.",
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
      title: "Demo Artist Japan — “Tokyo Lights”",
      reasonTitle: "High Momentum +",
      reasonSubtitle: "Trending Worldwide",
      reasonText: "Radar and momentum signals increasing.",
      country: "Japan",
      region: "Asia",
      trackTitle: "Tokyo Lights",
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
      title: "Demo Artist Brazil — “Rio Pulse”",
      reasonTitle: "High Momentum +",
      reasonSubtitle: "Trending Worldwide",
      reasonText: "Watch this artist before the breakout.",
      country: "Brazil",
      region: "South America",
      trackTitle: "Rio Pulse",
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
    title: item.title || `${item.artist} — “${item.trackTitle || "New Release"}”`,
    fallbackPoster:
      item.fallbackPoster ||
      "https://images.unsplash.com/photo-1571266028243-d220c9c3b7dc?auto=format&fit=crop&w=1200&q=80",
    artistAvatarFallback:
      item.artistAvatarFallback || createArtistAvatarDataUri(item.artist, index),
    artworkFallback: item.artworkFallback || createArtworkDataUri(index)
  }));
}

function splitArtistAndTrack(title, artist, trackTitle) {
  const cleanArtist = getString(artist, "Unknown Artist");
  const cleanTrack = getString(trackTitle, "New Release");
  const cleanTitle = getString(title, `${cleanArtist} — “${cleanTrack}”`);

  const regex = /^(.+?)\s+[—-]\s+[“"]?(.+?)[”"]?$/;
  const match = cleanTitle.match(regex);

  if (!match) {
    return {
      artistLine: cleanArtist,
      trackLine: `— “${cleanTrack}”`
    };
  }

  return {
    artistLine: match[1].trim() || cleanArtist,
    trackLine: `— “${match[2].trim() || cleanTrack}”`
  };
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
        strokeWidth="2.3"
      />
      <path
        d="M16 16l4.2 4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChevronCircle() {
  return (
    <svg viewBox="0 0 24 24" style={styles.topIconSvg} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.3" />
      <path
        d="M10 8.5L14 12l-4 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
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
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconShare() {
  return (
    <svg viewBox="0 0 24 24" style={styles.rightIconSvg} aria-hidden="true">
      <path
        d="M6 17c6.2-0.9 9.7-4.5 11.9-9.8M11.4 6.4h6.4v6.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IbandBrandBlock() {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div style={styles.brandBlock}>
      <div style={styles.brandLogoWrap}>
        {!logoFailed ? (
          <img
            src={IBAND_LOGO_SRC}
            alt="iBand"
            style={styles.brandLogoImage}
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <svg viewBox="0 0 64 64" style={styles.brandLogoSvgFallback} aria-hidden="true">
            <defs>
              <linearGradient id="ibandBrandGradientFinalCanon" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="31" fill="url(#ibandBrandGradientFinalCanon)" />
            <path
              d="M30 47V16h4.6c3.7 0 6.6 2.9 6.6 6.6V44h-4.6V33.5H30ZM23 52c-5.5 0-10-4.5-10-10s4.5-10 10-10c0.6 0 1.1 0 1.6 0.1V47c0 2.8-0.8 5-1.6 5Z"
              fill="white"
            />
            <circle cx="41.5" cy="18" r="2" fill="white" />
            <circle cx="41.5" cy="24" r="2" fill="white" />
            <circle cx="41.5" cy="30" r="2" fill="white" />
          </svg>
        )}
      </div>

      <div style={styles.brandTextBlock}>
        <div style={styles.brandWordmark}>iBand</div>
        <div style={styles.brandSubline}>Powered By Fans</div>
      </div>
    </div>
  );
}

function FeedCard({ item, isActive, currentIndex, totalItems }) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [artFailed, setArtFailed] = useState(false);

  const posterUrl = item.videoUrl || item.fallbackPoster;
  const avatarUrl =
    isUsableImageSrc(item.artistImage) && !avatarFailed
      ? item.artistImage
      : item.artistAvatarFallback;
  const soundArtworkUrl =
    isUsableImageSrc(item.artwork) && !artFailed
      ? item.artwork
      : item.artworkFallback;

  const heading = splitArtistAndTrack(item.title, item.artist, item.trackTitle);

  return (
    <article style={styles.slide}>
      <div
        style={{
          ...styles.posterLayer,
          backgroundImage: `url("${posterUrl}")`,
          transform: isActive ? "scale(1.008)" : "scale(1)"
        }}
      />

      <div style={styles.posterTopFade} />
      <div style={styles.posterBottomFade} />
      <div style={styles.posterMidFade} />

      <div style={styles.rightRail}>
        <div style={styles.avatarRailBlock}>
          <div style={styles.avatarWrap}>
            <img
              src={avatarUrl}
              alt={item.artist}
              style={styles.avatarImage}
              onError={() => setAvatarFailed(true)}
            />
            <button
              type="button"
              aria-label={`Follow ${item.artist}`}
              style={styles.followPlusButton}
            >
              +
            </button>
          </div>
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

        <button type="button" aria-label="Open original sound" style={styles.soundDiscButton}>
          <img
            src={soundArtworkUrl}
            alt={`${item.trackTitle} original sound`}
            style={styles.soundDiscImage}
            onError={() => setArtFailed(true)}
          />
        </button>
      </div>

      <div style={styles.contentOverlay}>
        <div style={styles.artistTitleRow}>
          <span style={styles.artistNameText}>{heading.artistLine}</span>
          <span style={styles.artistVerified}>✓</span>
        </div>

        <div style={styles.trackTitleText}>{heading.trackLine}</div>

        <div style={styles.reasonLine}>
          {item.reasonTitle} {item.reasonSubtitle}
        </div>

        <div style={styles.reasonSubline}>{item.reasonText}</div>

        <div style={styles.musicLine}>
          <span style={styles.musicNote}>♫</span>
          <span>{item.releaseLabel}</span>
        </div>

        <div style={styles.commentLine}>{item.comments} Comments</div>

        <div style={styles.searchShell}>
          <div style={styles.searchIconWrapInCard}>
            <IconSearch />
          </div>

          <div style={styles.searchInputWrap}>
            <div style={styles.searchPlaceholder}>Search artists, songs, genres</div>
          </div>
        </div>
      </div>

      <div style={styles.rankBadge}>#{Math.min(currentIndex + 1, totalItems)}</div>
    </article>
  );
}

export default function Feed() {
  const [smartFeed, setSmartFeed] = useState([]);
  const [personalisedFeed, setPersonalisedFeed] = useState([]);
  const [predictiveFeed, setPredictiveFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTopTab, setActiveTopTab] = useState("for-you");

  const scrollRef = useRef(null);
  const cardRefs = useRef([]);
  const topTabsScrollRef = useRef(null);

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
        threshold: [0.8, 0.9, 0.97]
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
    { key: "for-you", label: "For You" },
    { key: "stem", label: "STEM" },
    { key: "explore", label: "Explore" }
  ];

  return (
    <div style={styles.page}>
      <div style={styles.fixedTopOverlay}>
        <div style={styles.topNavRow}>
          <div ref={topTabsScrollRef} style={styles.topNavTabsScroller}>
            <div style={styles.topNavTabs}>
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
          </div>

          <button
            type="button"
            aria-label="Scroll top categories"
            style={styles.topArrowButton}
            onClick={() => {
              if (!topTabsScrollRef.current) return;
              topTabsScrollRef.current.scrollBy({ left: 120, behavior: "smooth" });
            }}
          >
            <IconChevronCircle />
          </button>

          <button type="button" aria-label="Search" style={styles.topSearchButton}>
            <IconSearch />
          </button>
        </div>

        <div style={styles.brandRow}>
          <IbandBrandBlock />
        </div>
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
              style={styles.slideWrap}
            >
              <FeedCard
                item={item}
                isActive={index === activeIndex}
                currentIndex={index}
                totalItems={unifiedFeed.length}
              />
            </div>
          ))
        )}
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
  slideWrap: {
    position: "relative",
    width: "100%",
    height: "100dvh",
    minHeight: "100dvh",
    scrollSnapAlign: "start",
    scrollSnapStop: "always"
  },
  slide: {
    position: "relative",
    width: "100%",
    height: "100dvh",
    minHeight: "100dvh",
    overflow: "hidden",
    background: "#020617"
  },
  posterLayer: {
    position: "absolute",
    inset: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "saturate(1.05) contrast(1.04)",
    transition: "transform 220ms ease"
  },
  posterTopFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "24%",
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.26) 58%, rgba(0,0,0,0) 100%)"
  },
  posterBottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "42%",
    background:
      "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 20%, rgba(0,0,0,0.42) 66%, rgba(0,0,0,0.90) 100%)"
  },
  posterMidFade: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 24% 30%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 18%, rgba(255,255,255,0) 42%)"
  },
  fixedTopOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    paddingTop: "env(safe-area-inset-top)",
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.78), rgba(0,0,0,0.14) 82%, rgba(0,0,0,0))",
    pointerEvents: "auto"
  },
  topNavRow: {
  height: 56,
  display: "flex",
  alignItems: "center",
  position: "relative",
  },
  
  topLiveFixedButton: {
  position: "absolute",
  left: "max(14px, calc(env(safe-area-inset-left) + 8px))",
  top: "50%",
  transform: "translateY(-50%)",
  width: 34,
  height: 34,
  borderRadius: 17,
  border: "none",
  background: "transparent",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2,
  cursor: "pointer"
  },
  paddingLeft: "max(14px, calc(env(safe-area-inset-left) + 8px))",
  paddingRight: "max(14px, calc(env(safe-area-inset-right) + 8px))"
  },
  topNavTabsScroller: {
  flex: 1,
  minWidth: 0,
  overflowX: "auto",
  overflowY: "hidden",
  WebkitOverflowScrolling: "touch",
  scrollbarWidth: "none",
  marginLeft: 0,
  paddingLeft: 54,
  paddingRight: 44
  },
  topNavTabs: {
    display: "flex",
    alignItems: "center",
    gap: 22,
    width: "max-content",
    paddingRight: 8
  },
  brandRow: {
    height: 86,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: "max(14px, calc(env(safe-area-inset-left) + 8px))",
    paddingRight: "max(14px, calc(env(safe-area-inset-right) + 8px))"
  },
  brandBlock: {
    display: "flex",
    alignItems: "center",
    gap: 10
  },
  brandLogoWrap: {
    width: 58,
    height: 58,
    position: "relative",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  brandLogoImage: {
    width: 58,
    height: 58,
    display: "block",
    objectFit: "contain",
    filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.26))"
  },
  brandLogoSvgFallback: {
    width: 58,
    height: 58,
    display: "block"
  },
  brandTextBlock: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },
  brandWordmark: {
    fontSize: 18,
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: "-0.03em",
    color: "#ffffff"
  },
  brandSubline: {
    marginTop: 5,
    fontSize: 8.8,
    lineHeight: 1.05,
    fontWeight: 600,
    color: "rgba(255,255,255,0.86)"
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
    fontSize: 9.8,
    lineHeight: 1.08,
    fontWeight: 700,
    color: "rgba(255,255,255,0.70)",
    whiteSpace: "nowrap"
  },
  topTabLabelActive: {
    color: "#ffffff"
  },
  topTabUnderline: {
    position: "absolute",
    left: "50%",
    bottom: -10,
    transform: "translateX(-50%)",
    width: 38,
    height: 2.8,
    borderRadius: 999,
    background: "#ffffff"
  },
    width: 34,
    height: 34,
    borderRadius: 17,
    border: "none",
    background: "transparent",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    cursor: "pointer"
  },
  topSearchButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    border: "none",
    background: "transparent",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    cursor: "pointer"
  },
  topIconSvg: {
    width: 25,
    height: 25,
    display: "block",
    color: "#ffffff"
  },
  rankBadge: {
    position: "absolute",
    top: "20px",
    left: "max(14px, calc(env(safe-area-inset-left) + 8px))",
    zIndex: 8,
    minWidth: 62,
    height: 42,
    padding: "0 16px",
    borderRadius: 21,
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
    right: 14,
    top: "108px",
    bottom: "112px",
    zIndex: 9,
    width: 72,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10
  },
  avatarRailBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 7
  },
  avatarWrap: {
    position: "relative",
    width: 82,
    height: 82
  },
  avatarImage: {
    width: 82,
    height: 82,
    borderRadius: "50%",
    objectFit: "cover",
    display: "block",
    border: "3px solid rgba(255,255,255,0.96)",
    boxShadow: "0 14px 28px rgba(0,0,0,0.34)"
  },
  followPlusButton: {
    position: "absolute",
    right: -3,
    bottom: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
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
  rightActionBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3
  },
  rightActionButton: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
    width: 40,
    height: 40
  },
  rightIconSvg: {
    width: 34,
    height: 34,
    display: "block",
    color: "#ffffff"
  },
  rightActionCount: {
    fontSize: 11.2,
    lineHeight: 1,
    fontWeight: 700,
    color: "rgba(255,255,255,0.96)"
  },
  soundDiscButton: {
    appearance: "none",
    width: 50,
    height: 50,
    borderRadius: 25,
    border: "2px solid rgba(255,255,255,0.96)",
    padding: 0,
    overflow: "hidden",
    background: "transparent",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(0,0,0,0.24)",
    marginTop: 2
  },
  soundDiscImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block"
  },
  contentOverlay: {
    position: "absolute",
    left: "max(16px, calc(env(safe-area-inset-left) + 10px))",
    right: "102px",
    bottom: "calc(88px + env(safe-area-inset-bottom))",
    zIndex: 8,
    maxWidth: "min(68vw, 490px)"
  },
  artistTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
  },
  artistNameText: {
    fontSize: 17,
    lineHeight: 1.06,
    fontWeight: 900,
    color: "#ffffff",
    letterSpacing: "-0.03em",
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
    fontSize: 16,
    lineHeight: 1.08,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: "-0.02em",
    textShadow: "0 3px 12px rgba(0,0,0,0.38)"
  },
  reasonLine: {
    marginTop: 12,
    fontSize: 12.2,
    lineHeight: 1.16,
    fontWeight: 500,
    color: "rgba(255,255,255,0.90)"
  },
  reasonSubline: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 1.18,
    fontWeight: 500,
    color: "rgba(255,255,255,0.74)"
  },
  musicLine: {
    marginTop: 11,
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 11.4,
    lineHeight: 1.16,
    fontWeight: 700,
    color: "#9edfff"
  },
  musicNote: {
    fontSize: 18,
    lineHeight: 1
  },
  commentLine: {
    marginTop: 11,
    fontSize: 11.1,
    lineHeight: 1.1,
    fontWeight: 500,
    color: "rgba(255,255,255,0.78)"
  },
  searchShell: {
    marginTop: 14,
    width: "100%",
    height: 48,
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.11)",
    background: "rgba(5,9,22,0.28)",
    boxShadow:
      "0 10px 24px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.03)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    display: "flex",
    alignItems: "center",
    padding: "0 14px"
  },
  searchIconWrapInCard: {
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    flexShrink: 0
  },
  searchInputWrap: {
    position: "relative",
    flex: 1,
    minWidth: 0,
    height: "100%",
    display: "flex",
    alignItems: "center"
  },
  searchPlaceholder: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 12.2,
    lineHeight: 1.2,
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  bottomNav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 35,
    height: "calc(84px + env(safe-area-inset-bottom))",
    paddingBottom: "env(safe-area-inset-bottom)",
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(2,6,18,0.90) 18%, rgba(2,6,18,0.99) 100%)",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    backdropFilter: "blur(16px)"
  },
  bottomNavInner: {
    height: 84,
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
    width: 86,
    height: 50,
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
    width: 54,
    height: 46,
    borderRadius: 14,
    background: "#7dd3fc"
  },
  createButtonRed: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    width: 54,
    height: 46,
    borderRadius: 14,
    background: "#fb7185"
  },
  createButtonCenter: {
    position: "relative",
    zIndex: 1,
    width: 54,
    height: 46,
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
  }
};
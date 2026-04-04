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

function isUsableImage(value) {
  return typeof value === "string" && value.trim().length > 0;
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

function buildHandle(artist, fallback = "artist") {
  return `@${String(artist || fallback)
    .replace(/\s+/g, "")
    .toLowerCase()}`;
}

function normaliseSmartFeed(data) {
  const items = Array.isArray(data?.feed) ? data.feed : [];

  return items.map((item, index) => ({
    id: item.id || `smart-${index}`,
    feedType: "smart",
    badge: "SMART",
    artist: getString(item.artist, "Demo Artist Nigeria"),
    title: getString(item.cardTitle, "Sam Ryder — “Supernova Dreams”"),
    reasonTitle: getString(item.feedReasonTitle, "High Momentum +"),
    reasonSubtitle: getString(item.feedReasonSubtitle, "Trending Worldwide"),
    reasonText: getString(item.feedReason || item.message, "Recommended by iBand intelligence."),
    handle: getString(item.profileHandle, buildHandle(item.artist, "demoartist")),
    country: getString(item.country, "Nigeria"),
    region: getString(item.region, "Global"),
    trackTitle: getString(item.trackTitle, "Supernova Dreams"),
    releaseLabel: getString(item.releaseLabel, "iBand Exclusive — New Release"),
    artistImage: getString(item.artistImage || item.profileImage || item.avatarUrl, ""),
    artwork: getString(item.artwork || item.coverImage, ""),
    videoUrl: getString(item.videoUrl || item.imageUrl || item.image, ""),
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
      item.feedReason || item.reason || item.message,
      "Matches your genre taste and strong breakout momentum."
    ),
    handle: getString(item.profileHandle, buildHandle(item.artist, "samryder")),
    country: getString(item.country, "United Kingdom"),
    region: getString(item.region, "Europe"),
    trackTitle: getString(item.trackTitle, "Supernova Dreams"),
    releaseLabel: getString(item.releaseLabel, "iBand Exclusive — New Release"),
    artistImage: getString(item.artistImage || item.profileImage || item.avatarUrl, ""),
    artwork: getString(item.artwork || item.coverImage, ""),
    videoUrl: getString(item.videoUrl || item.imageUrl || item.image, ""),
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
    artist: getString(item.artist || item.recommendedArtist, "Demo Artist Brazil"),
    title: getString(item.cardTitle, "Sam Ryder — “Supernova Dreams”"),
    reasonTitle: getString(item.feedReasonTitle, "High Momentum +"),
    reasonSubtitle: getString(item.feedReasonSubtitle, "Trending Worldwide"),
    reasonText: getString(
      item.feedReason || item.reason || item.message,
      "Watch this artist before the breakout."
    ),
    handle: getString(
      item.profileHandle,
      buildHandle(item.artist || item.recommendedArtist, "demoartist")
    ),
    country: getString(item.country || item.userMode, "Brazil"),
    region: getString(item.region, "South America"),
    trackTitle: getString(item.trackTitle, "Supernova Dreams"),
    releaseLabel: getString(item.releaseLabel, "iBand Exclusive — New Release"),
    artistImage: getString(item.artistImage || item.profileImage || item.avatarUrl, ""),
    artwork: getString(item.artwork || item.coverImage, ""),
    videoUrl: getString(item.videoUrl || item.imageUrl || item.image, ""),
    comments: getNumber(item.comments, 322),
    likes: getNumber(item.likes, 3100),
    shares: getNumber(item.shares, 322)
  }));
}

function createFallbackFeed() {
  const base = [
    {
      id: "demo-sam",
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
      id: "demo-ng",
      feedType: "smart",
      badge: "SMART",
      artist: "Demo Artist Nigeria",
      title: "Sam Ryder — “Supernova Dreams”",
      reasonTitle: "High Momentum +",
      reasonSubtitle: "Trending Worldwide",
      reasonText: "Radar and momentum signals increasing.",
      handle: "@demoartistnigeria",
      country: "Nigeria",
      region: "Africa",
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

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={styles.utilitySvg}>
      <circle
        cx="11"
        cy="11"
        r="6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path
        d="M16 16l4.2 4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={styles.utilitySvg}>
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <circle cx="12" cy="8" r="1.1" fill="currentColor" />
      <path
        d="M12 11.4v4.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconLive() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={styles.utilitySvg}>
      <rect
        x="4.2"
        y="6.5"
        width="15.6"
        height="11"
        rx="2.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9 4.7h6M10 19.4h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={styles.railSvg}>
      <path
        d="M12 20.3l-1.3-1.2C5.5 14.3 3 12 3 8.9 3 6.6 4.8 5 7 5c1.4 0 2.8.7 3.6 1.9C11.4 5.7 12.8 5 14.2 5 16.4 5 18.2 6.6 18.2 8.9c0 3.1-2.5 5.4-7.7 10.2L12 20.3z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconComment() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={styles.railSvg}>
      <path
        d="M6.2 6.1h11.6A2.7 2.7 0 0 1 20.5 8.8v4.2a2.7 2.7 0 0 1-2.7 2.7h-4.8l-3.8 2.6v-2.6H6.2A2.7 2.7 0 0 1 3.5 13V8.8a2.7 2.7 0 0 1 2.7-2.7z"
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
    <svg viewBox="0 0 24 24" aria-hidden="true" style={styles.railSvg}>
      <path
        d="M14.8 4.8l4.7 4.3-4.7 4.2V10c-4.1 0-6.4 1.3-8.3 4.7.5-5.5 3.7-8.7 8.3-9.1V4.8z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconBookmark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={styles.railSvg}>
      <path
        d="M7 4.8h10a1.4 1.4 0 0 1 1.4 1.4v13.1L12 15.6l-6.4 3.7V6.2A1.4 1.4 0 0 1 7 4.8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={styles.bottomNavSvg}>
      <path
        d="M4.3 10.5L12 4.4l7.7 6.1V20a1 1 0 0 1-1 1h-4.6v-5.7H9.9V21H5.3a1 1 0 0 1-1-1v-9.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconBag() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={styles.bottomNavSvg}>
      <path
        d="M7.3 8.3V7a4.7 4.7 0 0 1 9.4 0v1.3h2l-1.1 11.1H6.4L5.3 8.3h2zm2 0h5.4V7a2.7 2.7 0 0 0-5.4 0v1.3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconInbox() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={styles.bottomNavSvg}>
      <path
        d="M4.2 6.1h15.6l1.1 10.6h-5.1l-2 3h-3.6l-2-3H3.1L4.2 6.1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={styles.bottomNavSvg}>
      <circle
        cx="12"
        cy="8.2"
        r="3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5.2 19.6a6.8 6.8 0 0 1 13.6 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FeedCard({ item, isActive, onOpenInfo, currentIndex, totalItems }) {
  const posterUrl = item.videoUrl || item.fallbackPoster;
  const avatarUrl = isUsableImage(item.artistImage)
    ? item.artistImage
    : item.artistAvatarFallback;
  const artworkUrl = isUsableImage(item.artwork)
    ? item.artwork
    : item.artworkFallback;

  return (
    <article style={styles.card}>
      <div
        style={{
          ...styles.poster,
          backgroundImage: `url("${posterUrl}")`,
          transform: isActive ? "scale(1.015)" : "scale(1)"
        }}
      />

      <div style={styles.posterTint} />
      <div style={styles.posterBottomTint} />

      <div style={styles.rankWrap}>
        <div style={styles.rankBadge}>#{Math.min(currentIndex + 1, totalItems)}</div>
      </div>

      <div style={styles.rightRail}>
        <div style={styles.avatarBlock}>
          <img src={avatarUrl} alt={item.artist} style={styles.avatar} />
          <button type="button" aria-label={`Follow ${item.artist}`} style={styles.followButton}>
            +
          </button>
        </div>

        <div style={styles.railItem}>
          <button type="button" aria-label="Like" style={styles.railButton}>
            <IconHeart />
          </button>
          <span style={styles.railCount}>{formatCompactCount(item.likes)}</span>
        </div>

        <div style={styles.railItem}>
          <button type="button" aria-label="Comments" style={styles.railButton}>
            <IconComment />
          </button>
          <span style={styles.railCount}>{formatCompactCount(item.comments)}</span>
        </div>

        <div style={styles.railItem}>
          <button type="button" aria-label="Save" style={styles.railButton}>
            <IconBookmark />
          </button>
          <span style={styles.railCount}>Save</span>
        </div>

        <div style={styles.railItem}>
          <button type="button" aria-label="Share" style={styles.railButton}>
            <IconShare />
          </button>
          <span style={styles.railCount}>{formatCompactCount(item.shares)}</span>
        </div>

        <button type="button" aria-label="Open artist info" onClick={() => onOpenInfo(item)} style={styles.infoRailButton}>
          <IconInfo />
        </button>

        <button type="button" aria-label="Open sound" style={styles.soundButton}>
          <img
            src={artworkUrl}
            alt={`${item.trackTitle} artwork`}
            style={styles.soundArtwork}
          />
        </button>
      </div>

      <div style={styles.contentBlock}>
        <div style={styles.artistRow}>
          <span style={styles.artistName}>{item.artist}</span>
          <span style={styles.verifiedBadge}>✓</span>
        </div>

        <div style={styles.handleRow}>
          <span style={styles.handleText}>{item.handle}</span>
          <span style={styles.feedBadge}>{item.badge}</span>
        </div>

        <div style={styles.infoLine}>
          {item.artist} • {item.badge === "FOR YOU" ? "Personalised Feed" : item.badge === "SMART" ? "Smart Feed" : "Predictive Feed"} • {item.country} • play_now
        </div>

        <div style={styles.songLine}>
          {item.title}
        </div>

        <div style={styles.whyWrap}>
          <div style={styles.whyLabel}>WHY YOU ARE SEEING THIS</div>
          <div style={styles.whyText}>
            {item.reasonTitle} {item.reasonSubtitle}
          </div>
        </div>

        <div style={styles.musicRow}>
          <span style={styles.musicNote}>♫</span>
          <span style={styles.musicText}>{item.releaseLabel}</span>
        </div>
      </div>
    </article>
  );
}

function InfoOverlay({ item, onClose }) {
  if (!item) return null;

  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={styles.overlayBackdrop}>
      <div onClick={(event) => event.stopPropagation()} style={styles.overlayPanel}>
        <div style={styles.overlayHeader}>
          <div>
            <div style={styles.overlayEyebrow}>IBAND INFO</div>
            <h3 style={styles.overlayTitle}>{item.artist}</h3>
            <p style={styles.overlaySubtitle}>{item.trackTitle}</p>
          </div>

          <button type="button" onClick={onClose} aria-label="Close info" style={styles.overlayClose}>
            ×
          </button>
        </div>

        <div style={styles.overlayBody}>
          {[
            ["Artist", item.artist],
            ["Feed", item.badge],
            ["Territory", item.country || "Global"],
            ["Track", item.trackTitle],
            ["Reason", `${item.reasonTitle} ${item.reasonSubtitle}`]
          ].map(([label, value]) => (
            <div key={label} style={styles.overlayRow}>
              <span style={styles.overlayRowLabel}>{label}</span>
              <span style={styles.overlayRowValue}>{value}</span>
            </div>
          ))}
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
    <div style={styles.page}>
      <div style={styles.fixedLogoWrap}>
        <img src={IBAND_LOGO_SRC} alt="iBand" style={styles.fixedLogo} />
        <div style={styles.fixedBrandTextWrap}>
          <div style={styles.fixedBrandTitle}>iBand</div>
          <div style={styles.fixedBrandSubtitle}>Powered By Fans</div>
        </div>
      </div>

      <div style={styles.floatingTopControls}>
        <button type="button" aria-label="Live" style={styles.floatingIconButton}>
          <IconLive />
        </button>

        <button type="button" aria-label="Info" onClick={() => setInfoItem(unifiedFeed[activeIndex] || null)} style={styles.floatingIconButton}>
          <IconInfo />
        </button>

        <button type="button" aria-label="Search" style={styles.floatingIconButton}>
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
          <IconSearch />
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search artists, songs, genres"
            style={styles.searchInput}
          />
        </div>
      </div>

      <nav aria-label="Primary" style={styles.bottomNav}>
        <button type="button" aria-label="Home" style={styles.bottomNavItem}>
          <IconHome />
          <span style={styles.bottomNavLabelActive}>Home</span>
        </button>

        <button type="button" aria-label="Shop" style={styles.bottomNavItem}>
          <IconBag />
          <span style={styles.bottomNavLabel}>Shop</span>
        </button>

        <button type="button" aria-label="Create" style={styles.createButton}>
          <span style={styles.createButtonOuter}>
            <span style={styles.createButtonInner}>+</span>
          </span>
        </button>

        <button type="button" aria-label="Inbox" style={styles.bottomNavItem}>
          <div style={styles.inboxIconWrap}>
            <IconInbox />
            <span style={styles.inboxBadge}>2</span>
          </div>
          <span style={styles.bottomNavLabel}>Inbox</span>
        </button>

        <button type="button" aria-label="Profile" style={styles.bottomNavItem}>
          <IconProfile />
          <span style={styles.bottomNavLabel}>Profile</span>
        </button>
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
    background: "#030712",
    color: "#ffffff",
    overflow: "hidden",
    margin: 0,
    padding: 0,
    boxSizing: "border-box",
    fontFamily:
      '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  scroller: {
    position: "relative",
    height: "100dvh",
    overflowY: "auto",
    overflowX: "hidden",
    scrollSnapType: "y mandatory",
    scrollBehavior: "smooth",
    overscrollBehaviorY: "contain",
    WebkitOverflowScrolling: "touch",
    zIndex: 1,
    background: "#030712"
  },
  loadingState: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(255,255,255,0.85)",
    fontSize: 18,
    fontWeight: 700
  },
  card: {
    position: "relative",
    minHeight: "100dvh",
    height: "100dvh",
    width: "100%",
    scrollSnapAlign: "start",
    scrollSnapStop: "always",
    overflow: "hidden",
    background:
      "linear-gradient(180deg, rgba(7,10,26,1) 0%, rgba(5,9,20,1) 100%)"
  },
  poster: {
    position: "absolute",
    inset: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "saturate(1.06) contrast(1.04)",
    transition: "transform 320ms ease"
  },
  posterTint: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(4,7,20,0.24) 0%, rgba(4,7,20,0.08) 20%, rgba(4,7,20,0.04) 42%, rgba(4,7,20,0.18) 62%, rgba(4,7,20,0.34) 78%, rgba(4,7,20,0.68) 100%)"
  },
  posterBottomTint: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "38%",
    background:
      "linear-gradient(180deg, rgba(3,7,18,0) 0%, rgba(3,7,18,0.08) 18%, rgba(3,7,18,0.32) 58%, rgba(3,7,18,0.80) 100%)"
  },
  fixedLogoWrap: {
    position: "fixed",
    top: "calc(env(safe-area-inset-top) + 12px)",
    left: 14,
    zIndex: 20,
    display: "flex",
    alignItems: "center",
    gap: 8,
    pointerEvents: "none"
  },
  fixedLogo: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    objectFit: "cover",
    boxShadow: "0 8px 18px rgba(0,0,0,0.22)"
  },
  fixedBrandTextWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 1
  },
  fixedBrandTitle: {
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: "#ffffff",
    lineHeight: 1
  },
  fixedBrandSubtitle: {
    fontSize: 10,
    fontWeight: 600,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 1.05
  },
  floatingTopControls: {
    position: "fixed",
    top: "calc(env(safe-area-inset-top) + 10px)",
    right: 12,
    zIndex: 20,
    display: "flex",
    alignItems: "center",
    gap: 6
  },
  floatingIconButton: {
    appearance: "none",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(10,16,32,0.20)",
    color: "#ffffff",
    width: 34,
    height: 34,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(0,0,0,0.14)"
  },
  utilitySvg: {
    width: 18,
    height: 18,
    display: "block",
    color: "#ffffff"
  },
  rankWrap: {
    position: "absolute",
    top: "calc(env(safe-area-inset-top) + 54px)",
    left: 14,
    zIndex: 6
  },
  rankBadge: {
    minWidth: 34,
    height: 24,
    borderRadius: 12,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 10px",
    background: "rgba(10,16,32,0.26)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "rgba(255,255,255,0.96)",
    fontSize: 11,
    fontWeight: 800,
    backdropFilter: "blur(10px)"
  },
  rightRail: {
    position: "absolute",
    right: "max(6px, env(safe-area-inset-right))",
    bottom: "calc(212px + env(safe-area-inset-bottom))",
    zIndex: 8,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10
  },
  avatarBlock: {
    position: "relative",
    width: 58,
    height: 66,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center"
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(255,255,255,0.92)",
    boxShadow: "0 10px 22px rgba(0,0,0,0.28)"
  },
  followButton: {
    position: "absolute",
    left: "50%",
    bottom: 0,
    transform: "translateX(-50%)",
    width: 22,
    height: 22,
    borderRadius: "50%",
    border: "2px solid #ffffff",
    background: "#ff2f6f",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 800,
    lineHeight: 1,
    cursor: "pointer",
    boxShadow: "0 6px 14px rgba(0,0,0,0.18)"
  },
  railItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4
  },
  railButton: {
    appearance: "none",
    width: 42,
    height: 42,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(10,16,32,0.14)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    boxShadow: "0 8px 18px rgba(0,0,0,0.16)",
    cursor: "pointer"
  },
  railSvg: {
    width: 20,
    height: 20,
    display: "block",
    color: "#ffffff"
  },
  railCount: {
    fontSize: 11,
    fontWeight: 700,
    color: "rgba(255,255,255,0.94)",
    textShadow: "0 2px 6px rgba(0,0,0,0.24)"
  },
  infoRailButton: {
    appearance: "none",
    width: 42,
    height: 42,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(10,16,32,0.14)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    boxShadow: "0 8px 18px rgba(0,0,0,0.16)",
    cursor: "pointer"
  },
  soundButton: {
    appearance: "none",
    width: 42,
    height: 42,
    padding: 0,
    borderRadius: "50%",
    overflow: "hidden",
    border: "2px solid rgba(255,255,255,0.90)",
    background: "transparent",
    boxShadow: "0 8px 18px rgba(0,0,0,0.16)",
    cursor: "pointer"
  },
  soundArtwork: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  contentBlock: {
    position: "absolute",
    left: 16,
    right: 74,
    bottom: "calc(128px + env(safe-area-inset-bottom))",
    zIndex: 7,
    maxWidth: "min(69vw, 430px)"
  },
  artistRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 3
  },
  artistName: {
    fontSize: 16,
    fontWeight: 800,
    lineHeight: 1.08,
    color: "#ffffff",
    textShadow: "0 3px 10px rgba(0,0,0,0.32)"
  },
  verifiedBadge: {
    width: 15,
    height: 15,
    borderRadius: "50%",
    background: "#3b82f6",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 9,
    fontWeight: 800,
    flexShrink: 0
  },
  handleRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    flexWrap: "wrap"
  },
  handleText: {
    fontSize: 12,
    fontWeight: 600,
    color: "rgba(255,255,255,0.88)"
  },
  feedBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 20,
    padding: "0 8px",
    borderRadius: 999,
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: "0.08em",
    color: "#ffffff",
    background: "rgba(17,24,39,0.34)",
    border: "1px solid rgba(255,255,255,0.10)",
    backdropFilter: "blur(8px)"
  },
  infoLine: {
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1.25,
    color: "rgba(255,255,255,0.88)",
    marginBottom: 8,
    textShadow: "0 3px 10px rgba(0,0,0,0.28)"
  },
  songLine: {
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.26,
    color: "#ffffff",
    marginBottom: 8,
    textShadow: "0 3px 10px rgba(0,0,0,0.30)"
  },
  whyWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    marginBottom: 7
  },
  whyLabel: {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: "0.12em",
    color: "rgba(255,255,255,0.78)"
  },
  whyText: {
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1.28,
    color: "rgba(255,255,255,0.94)"
  },
  musicRow: {
    display: "flex",
    alignItems: "center",
    gap: 6
  },
  musicNote: {
    fontSize: 12,
    color: "rgba(255,255,255,0.96)"
  },
  musicText: {
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1.24,
    color: "rgba(255,255,255,0.88)"
  },
  searchDock: {
    position: "fixed",
    left: 12,
    right: 12,
    bottom: "calc(70px + env(safe-area-inset-bottom))",
    zIndex: 22
  },
  searchShell: {
    height: 46,
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(6,10,22,0.22)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
    gap: 10
  },
  searchInput: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 500,
    fontFamily:
      '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  bottomNav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 21,
    height: "calc(78px + env(safe-area-inset-bottom))",
    paddingBottom: "env(safe-area-inset-bottom)",
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(2,6,18,0.88) 22%, rgba(2,6,18,0.96) 100%)",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    backdropFilter: "blur(16px)"
  },
  bottomNavItem: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    cursor: "pointer"
  },
  bottomNavSvg: {
    width: 22,
    height: 22,
    display: "block",
    color: "#ffffff"
  },
  bottomNavLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "rgba(255,255,255,0.78)"
  },
  bottomNavLabelActive: {
    fontSize: 11,
    fontWeight: 700,
    color: "#ffffff"
  },
  createButton: {
    appearance: "none",
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer"
  },
  createButtonOuter: {
    width: 58,
    height: 34,
    borderRadius: 12,
    background:
      "linear-gradient(90deg, #60dbf8 0%, #ffffff 50%, #ff4f7f 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 22px rgba(0,0,0,0.18)"
  },
  createButtonInner: {
    width: 44,
    height: 34,
    borderRadius: 10,
    background: "#ffffff",
    color: "#111111",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    fontWeight: 500,
    lineHeight: 1
  },
  inboxIconWrap: {
    position: "relative",
    display: "inline-flex"
  },
  inboxBadge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    background: "#ff476f",
    color: "#ffffff",
    fontSize: 10,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 4px"
  },
  overlayBackdrop: {
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
  overlayPanel: {
    width: "min(760px, 100%)",
    borderRadius: 26,
    border: "1px solid rgba(255,255,255,0.12)",
    background:
      "linear-gradient(180deg, rgba(12,18,35,0.94) 0%, rgba(9,14,28,0.96) 100%)",
    boxShadow: "0 24px 50px rgba(0,0,0,0.35)",
    color: "white",
    padding: 20
  },
  overlayHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14
  },
  overlayEyebrow: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.14em",
    color: "rgba(156,223,255,0.95)"
  },
  overlayTitle: {
    margin: "8px 0 0 0",
    fontSize: 28,
    lineHeight: 1.05,
    fontWeight: 900
  },
  overlaySubtitle: {
    margin: "8px 0 0 0",
    color: "rgba(255,255,255,0.78)",
    fontSize: 16,
    fontWeight: 600
  },
  overlayClose: {
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
  overlayBody: {
    marginTop: 16,
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    padding: 16
  },
  overlayRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    paddingBottom: 10,
    marginBottom: 10
  },
  overlayRowLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15,
    fontWeight: 700
  },
  overlayRowValue: {
    color: "white",
    fontSize: 16,
    fontWeight: 800,
    textAlign: "right"
  }
};
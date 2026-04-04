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

function isUsableImageSrc(value) {
  if (typeof value !== "string") return false;

  const src = value.trim();
  if (!src) return false;

  if (
    src.startsWith("/") ||
    src.startsWith("./") ||
    src.startsWith("../") ||
    src.startsWith("data:image/") ||
    src.startsWith("blob:") ||
    /^https?:\/\//i.test(src)
  ) {
    return true;
  }

  return false;
}

function pickImageUrl(...values) {
  return values.find((value) => isUsableImageSrc(value)) || "";
}

function buildHandle(name, fallback = "artist") {
  return `@${String(name || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")}`;
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
    reasonText: getString(
      item.feedReason || item.message,
      "Recommended by iBand intelligence."
    ),
    handle: getString(item.profileHandle, buildHandle(item.artist, "samryder")),
    country: getString(item.country, "Nigeria"),
    region: getString(item.region, "Global"),
    trackTitle: getString(item.trackTitle, "Supernova Dreams"),
    releaseLabel: getString(item.releaseLabel, "iBand Exclusive — New Release"),
    artistImage: pickImageUrl(
      item.artistImage,
      item.profileImage,
      item.avatarUrl,
      item.imageUrl
    ),
    artwork: pickImageUrl(item.artwork, item.coverImage, item.thumbnailUrl),
    videoUrl: pickImageUrl(item.videoUrl, item.posterUrl, item.imageUrl),
    comments: getNumber(item.comments, 322),
    likes: getNumber(item.likes, 3100),
    shares: getNumber(item.shares, 27)
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
    handle: getString(item.profileHandle, buildHandle(item.artist, "samryder")),
    country: getString(item.country, "United Kingdom"),
    region: getString(item.region, "Europe"),
    trackTitle: getString(item.trackTitle, "Supernova Dreams"),
    releaseLabel: getString(item.releaseLabel, "iBand Exclusive — New Release"),
    artistImage: pickImageUrl(
      item.artistImage,
      item.profileImage,
      item.avatarUrl,
      item.imageUrl
    ),
    artwork: pickImageUrl(item.artwork, item.coverImage, item.thumbnailUrl),
    videoUrl: pickImageUrl(item.videoUrl, item.posterUrl, item.imageUrl),
    comments: getNumber(item.comments, 322),
    likes: getNumber(item.likes, 3100),
    shares: getNumber(item.shares, 27)
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
      buildHandle(item.artist || item.recommendedArtist, "samryder")
    ),
    country: getString(item.country || item.userMode, "Brazil"),
    region: getString(item.region, "South America"),
    trackTitle: getString(item.trackTitle, "Supernova Dreams"),
    releaseLabel: getString(item.releaseLabel, "iBand Exclusive — New Release"),
    artistImage: pickImageUrl(
      item.artistImage,
      item.profileImage,
      item.avatarUrl,
      item.imageUrl
    ),
    artwork: pickImageUrl(item.artwork, item.coverImage, item.thumbnailUrl),
    videoUrl: pickImageUrl(item.videoUrl, item.posterUrl, item.imageUrl),
    comments: getNumber(item.comments, 322),
    likes: getNumber(item.likes, 3100),
    shares: getNumber(item.shares, 27)
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
      shares: 27
    },
    {
      id: "demo-jp",
      feedType: "smart",
      badge: "SMART",
      artist: "Demo Artist Japan",
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
      shares: 27
    },
    {
      id: "demo-br",
      feedType: "predictive",
      badge: "PREDICTED",
      artist: "Demo Artist Brazil",
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
      shares: 27
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

function IconLive() {
  return (
    <svg viewBox="0 0 24 24" style={styles.topSvgIcon} aria-hidden="true">
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="13"
        rx="2.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7 4h10M8.5 20h7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <text
        x="12"
        y="14.2"
        textAnchor="middle"
        fontSize="5.2"
        fontWeight="700"
        fill="currentColor"
      >
        LIVE
      </text>
    </svg>
  );
}

function IconSearchTop() {
  return (
    <svg viewBox="0 0 24 24" style={styles.topSvgIcon} aria-hidden="true">
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

function IconHeart() {
  return (
    <svg viewBox="0 0 24 24" style={styles.railIconSvg} aria-hidden="true">
      <path
        d="M12 21s-7.4-4.6-9.2-9.2C1.4 8.2 3.5 5 7.1 5c2.1 0 3.7 1 4.9 2.5C13.2 6 14.8 5 16.9 5c3.6 0 5.7 3.2 4.3 6.8C19.4 16.4 12 21 12 21z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconComment() {
  return (
    <svg viewBox="0 0 24 24" style={styles.railIconSvg} aria-hidden="true">
      <path
        d="M6 6h12a3 3 0 013 3v4a3 3 0 01-3 3h-5.1l-4.4 3V16H6a3 3 0 01-3-3V9a3 3 0 013-3z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg viewBox="0 0 24 24" style={styles.railIconSvg} aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="8" r="1.35" fill="currentColor" />
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

function IconBookmark() {
  return (
    <svg viewBox="0 0 24 24" style={styles.railIconSvg} aria-hidden="true">
      <path
        d="M7 4.5h10a1 1 0 011 1V20l-6-3.8L6 20V5.5a1 1 0 011-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconShare() {
  return (
    <svg viewBox="0 0 24 24" style={styles.railIconSvg} aria-hidden="true">
      <path
        d="M18.5 5.5l-10 6.1 4.3 1.2 1.2 4.3 4.5-11.6z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" style={styles.bottomNavIconSvg} aria-hidden="true">
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-4.8v-6h-4.4v6H5a1 1 0 01-1-1v-9.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconBag() {
  return (
    <svg viewBox="0 0 24 24" style={styles.bottomNavIconSvg} aria-hidden="true">
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
    <svg viewBox="0 0 24 24" style={styles.bottomNavIconSvg} aria-hidden="true">
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
    <svg viewBox="0 0 24 24" style={styles.bottomNavIconSvg} aria-hidden="true">
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

function IconSearchDock() {
  return (
    <svg viewBox="0 0 24 24" style={styles.searchIconSvg} aria-hidden="true">
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

function InfoOverlay({ item, onClose }) {
  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={styles.infoOverlayBackdrop}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={styles.infoOverlayCard}
      >
        <div style={styles.infoOverlayHeader}>
          <div>
            <div style={styles.infoOverlayEyebrow}>IBAND INFO</div>
            <h3 style={styles.infoOverlayTitle}>{item.artist}</h3>
            <p style={styles.infoOverlayTrack}>{item.trackTitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close info"
            style={styles.infoOverlayClose}
          >
            ×
          </button>
        </div>

        <div style={styles.infoOverlaySection}>
          <div style={styles.infoOverlaySectionLabel}>PERSONALISATION DETAILS</div>

          <div style={styles.infoOverlayGrid}>
            {[
              ["Artist", item.artist],
              ["Feed", item.badge],
              ["Territory", item.country || "Global"],
              ["Track", item.trackTitle]
            ].map(([label, value]) => (
              <div key={label} style={styles.infoOverlayRow}>
                <span style={styles.infoOverlayRowLabel}>{label}</span>
                <span style={styles.infoOverlayRowValue}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedCard({ item, isActive, onOpenInfo, currentIndex }) {
  const posterUrl = item.videoUrl || item.fallbackPoster;
  const avatarUrl = item.artistImage || item.artistAvatarFallback;
  const artworkUrl = item.artwork || item.artworkFallback;
  const showBadge = item.badge === "FOR YOU";

  return (
    <article
      style={{
        ...styles.feedCard,
        transform: isActive ? "scale(1)" : "scale(1)"
      }}
    >
      <div
        style={{
          ...styles.posterLayer,
          backgroundImage: `url("${posterUrl}")`
        }}
      />

      <div style={styles.posterOverlayTop} />
      <div style={styles.posterOverlayBottom} />

      <div style={styles.rankBadge}>#{currentIndex + 1}</div>

      <div style={styles.rightRail}>
        <div style={styles.avatarBlock}>
          <div style={styles.avatarImageWrap}>
            <img src={avatarUrl} alt={item.artist} style={styles.avatarImage} />
            <button
              type="button"
              aria-label={`Follow ${item.artist}`}
              style={styles.followPlusButton}
            >
              +
            </button>
          </div>
        </div>

        <button type="button" style={styles.railButton} aria-label="Like">
          <IconHeart />
          <span style={styles.railCount}>{formatCompactCount(item.likes)}</span>
        </button>

        <button type="button" style={styles.railButton} aria-label="Comments">
          <IconComment />
          <span style={styles.railCount}>
            {formatCompactCount(item.comments)}
          </span>
        </button>

        <button
          type="button"
          style={styles.railButton}
          aria-label="Open info"
          onClick={() => onOpenInfo(item)}
        >
          <IconInfo />
        </button>

        <button type="button" style={styles.dotsButton} aria-label="More">
          <span style={styles.dotsGlyph}>•••</span>
        </button>

        <button type="button" style={styles.soundButton} aria-label="Open sound">
          <img
            src={artworkUrl}
            alt={`${item.trackTitle} artwork`}
            style={styles.soundArtwork}
          />
        </button>
      </div>

      <div style={styles.bottomCopyWrap}>
        <div style={styles.titleRow}>
          <h2 style={styles.feedTitle}>{item.title}</h2>
        </div>

        <div style={styles.reasonLine}>
          {item.reasonTitle} {item.reasonSubtitle}
        </div>

        <div style={styles.audioLine}>
          <span style={styles.audioNote}>♫</span>
          <span style={styles.audioText}>{item.releaseLabel}</span>
        </div>

        <div style={styles.commentsLine}>{item.comments} Comments</div>

        {showBadge ? (
          <div style={styles.badgeRow}>
            <span style={styles.feedBadge}>{item.badge}</span>
          </div>
        ) : null}
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
  const [topTab, setTopTab] = useState("for-you");

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
      <div style={styles.fixedTopChrome}>
        <div style={styles.logoCluster}>
          <img src={IBAND_LOGO_SRC} alt="iBand" style={styles.fixedLogo} />
          <div style={styles.logoTextWrap}>
            <div style={styles.logoTitle}>iBand</div>
            <div style={styles.logoSubtitle}>Powered By Fans</div>
          </div>
        </div>

        <div style={styles.topTabsWrap}>
          <button
            type="button"
            style={styles.topIconButton}
            aria-label="Live"
            onClick={() => setTopTab("live")}
          >
            <IconLive />
          </button>

          <button
            type="button"
            onClick={() => setTopTab("oxfordshire")}
            style={styles.topTabButton}
          >
            <span
              style={{
                ...styles.topTabLabel,
                ...(topTab === "oxfordshire" ? styles.topTabLabelActive : {})
              }}
            >
              Oxfordshire
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTopTab("following")}
            style={styles.topTabButton}
          >
            <span
              style={{
                ...styles.topTabLabel,
                ...(topTab === "following" ? styles.topTabLabelActive : {})
              }}
            >
              Following
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTopTab("friends")}
            style={styles.topTabButton}
          >
            <span
              style={{
                ...styles.topTabLabel,
                ...(topTab === "friends" ? styles.topTabLabelActive : {})
              }}
            >
              Friends
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTopTab("for-you")}
            style={styles.topTabButton}
          >
            <span
              style={{
                ...styles.topTabLabel,
                ...(topTab === "for-you" ? styles.topTabLabelActive : {})
              }}
            >
              For You
            </span>
            {topTab === "for-you" ? <span style={styles.topTabUnderline} /> : null}
          </button>

          <button
            type="button"
            style={styles.topIconButton}
            aria-label="Search"
          >
            <IconSearchTop />
          </button>
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
            >
              <FeedCard
                item={item}
                isActive={index === activeIndex}
                onOpenInfo={setInfoItem}
                currentIndex={index}
              />
            </div>
          ))
        )}
      </div>

      <div style={styles.searchDockWrap}>
        <div style={styles.searchDock}>
          <IconSearchDock />
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search artists, songs, genres"
            style={styles.searchInput}
          />
        </div>
      </div>

      <nav aria-label="Primary" style={styles.bottomNavBar}>
        <button type="button" style={styles.bottomNavItem}>
          <IconHome />
          <span style={styles.bottomNavLabelActive}>Home</span>
        </button>

        <button type="button" style={styles.bottomNavItem}>
          <IconBag />
          <span style={styles.bottomNavLabel}>Shop</span>
        </button>

        <button type="button" style={styles.createButton} aria-label="Create">
          <span style={styles.createButtonOuter}>
            <span style={styles.createButtonInner}>+</span>
          </span>
        </button>

        <button type="button" style={styles.bottomNavItem}>
          <div style={styles.bottomNavBadgeWrap}>
            <IconInbox />
            <span style={styles.bottomNavBadge}>2</span>
          </div>
          <span style={styles.bottomNavLabel}>Inbox</span>
        </button>

        <button type="button" style={styles.bottomNavItem}>
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
    overflow: "hidden",
    background: "#000000",
    color: "#ffffff",
    boxSizing: "border-box",
    fontFamily:
      '"TikTok Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },

  fixedTopChrome: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    pointerEvents: "none"
  },

  logoCluster: {
    position: "absolute",
    top: "calc(env(safe-area-inset-top) + 14px)",
    left: "14px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    pointerEvents: "none"
  },

  fixedLogo: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    objectFit: "cover",
    display: "block",
    filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.35))"
  },

  logoTextWrap: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },

  logoTitle: {
    fontSize: "16px",
    fontWeight: 800,
    lineHeight: 1.02,
    color: "#ffffff",
    textShadow: "0 3px 10px rgba(0,0,0,0.38)"
  },

  logoSubtitle: {
    marginTop: "3px",
    fontSize: "13px",
    fontWeight: 500,
    lineHeight: 1.05,
    color: "rgba(255,255,255,0.88)",
    textShadow: "0 3px 10px rgba(0,0,0,0.38)"
  },

  topTabsWrap: {
    position: "absolute",
    top: "calc(env(safe-area-inset-top) + 18px)",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    pointerEvents: "auto"
  },

  topTabButton: {
    appearance: "none",
    background: "transparent",
    border: "none",
    color: "#ffffff",
    padding: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "fit-content",
    cursor: "pointer"
  },

  topTabLabel: {
    fontSize: "13px",
    fontWeight: 700,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1
  },

  topTabLabelActive: {
    color: "#ffffff"
  },

  topTabUnderline: {
    marginTop: "6px",
    width: "34px",
    height: "2.5px",
    borderRadius: "999px",
    background: "#ffffff"
  },

  topIconButton: {
    appearance: "none",
    background: "transparent",
    border: "none",
    color: "#ffffff",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer"
  },

  topSvgIcon: {
    width: "26px",
    height: "26px",
    display: "block",
    color: "#ffffff",
    filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.34))"
  },

  scroller: {
    position: "relative",
    width: "100vw",
    height: "100dvh",
    overflowY: "auto",
    overflowX: "hidden",
    scrollSnapType: "y mandatory",
    scrollBehavior: "smooth",
    overscrollBehaviorY: "contain",
    WebkitOverflowScrolling: "touch",
    background: "#000000"
  },

  loadingState: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: 700,
    color: "rgba(255,255,255,0.88)"
  },

  feedCard: {
    position: "relative",
    width: "100vw",
    minHeight: "100dvh",
    height: "100dvh",
    overflow: "hidden",
    scrollSnapAlign: "start",
    scrollSnapStop: "always",
    background:
      "linear-gradient(180deg, rgba(7,10,26,1) 0%, rgba(5,9,20,1) 100%)"
  },

  posterLayer: {
    position: "absolute",
    inset: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    filter: "saturate(1.06) contrast(1.04)"
  },

  posterOverlayTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "26%",
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.05) 58%, rgba(0,0,0,0) 100%)"
  },

  posterOverlayBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "42%",
    background:
      "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.05) 18%, rgba(0,0,0,0.32) 66%, rgba(0,0,0,0.72) 100%)"
  },

  rankBadge: {
    position: "absolute",
    top: "calc(env(safe-area-inset-top) + 78px)",
    left: "16px",
    zIndex: 7,
    minWidth: "54px",
    height: "40px",
    padding: "0 16px",
    borderRadius: "22px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(12,16,30,0.34)",
    border: "1px solid rgba(255,255,255,0.14)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.20)",
    fontSize: "15px",
    fontWeight: 800,
    color: "#ffffff"
  },

  rightRail: {
    position: "absolute",
    right: "max(10px, env(safe-area-inset-right))",
    bottom: "calc(160px + env(safe-area-inset-bottom))",
    zIndex: 8,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px"
  },

  avatarBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    marginBottom: "2px"
  },

  avatarImageWrap: {
    position: "relative",
    width: "62px",
    height: "62px"
  },

  avatarImage: {
    width: "62px",
    height: "62px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2.5px solid rgba(255,255,255,0.92)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
    display: "block"
  },

  followPlusButton: {
    position: "absolute",
    right: "-3px",
    bottom: "-3px",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    border: "2px solid #ffffff",
    background: "#ff2f6f",
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 800,
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 18px rgba(0,0,0,0.24)",
    cursor: "pointer"
  },

  railButton: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "5px",
    padding: 0,
    cursor: "pointer"
  },

  railIconSvg: {
    width: "28px",
    height: "28px",
    display: "block",
    color: "#ffffff",
    filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.34))"
  },

  railCount: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#ffffff",
    lineHeight: 1,
    textShadow: "0 2px 8px rgba(0,0,0,0.34)"
  },

  dotsButton: {
    appearance: "none",
    background: "transparent",
    border: "none",
    color: "#ffffff",
    width: "48px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    cursor: "pointer"
  },

  dotsGlyph: {
    fontSize: "17px",
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: "0.18em",
    textShadow: "0 2px 8px rgba(0,0,0,0.34)"
  },

  soundButton: {
    appearance: "none",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    overflow: "hidden",
    padding: 0,
    background: "transparent",
    border: "3px solid rgba(255,255,255,0.92)",
    boxShadow: "0 10px 22px rgba(0,0,0,0.24)",
    cursor: "pointer"
  },

  soundArtwork: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block"
  },

  bottomCopyWrap: {
    position: "absolute",
    left: "16px",
    right: "92px",
    bottom: "calc(146px + env(safe-area-inset-bottom))",
    zIndex: 7,
    pointerEvents: "none"
  },

  titleRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px"
  },

  feedTitle: {
    margin: 0,
    fontSize: "16px",
    lineHeight: 1.18,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    color: "#ffffff",
    textShadow: "0 3px 10px rgba(0,0,0,0.34)"
  },

  reasonLine: {
    marginTop: "10px",
    fontSize: "13px",
    lineHeight: 1.22,
    fontWeight: 500,
    color: "rgba(255,255,255,0.88)",
    textShadow: "0 3px 10px rgba(0,0,0,0.34)"
  },

  audioLine: {
    marginTop: "10px",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "13px",
    lineHeight: 1.2,
    fontWeight: 600,
    color: "rgba(156,223,255,0.96)",
    textShadow: "0 3px 10px rgba(0,0,0,0.30)"
  },

  audioNote: {
    fontSize: "14px",
    lineHeight: 1
  },

  audioText: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },

  commentsLine: {
    marginTop: "10px",
    fontSize: "12px",
    lineHeight: 1.15,
    fontWeight: 500,
    color: "rgba(255,255,255,0.74)"
  },

  badgeRow: {
    marginTop: "10px",
    display: "flex",
    alignItems: "center"
  },

  feedBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "28px",
    padding: "0 12px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(14,18,32,0.34)",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    backdropFilter: "blur(8px)"
  },

  searchDockWrap: {
    position: "fixed",
    left: "14px",
    right: "14px",
    bottom: "calc(68px + env(safe-area-inset-bottom))",
    zIndex: 20
  },

  searchDock: {
    width: "100%",
    height: "56px",
    borderRadius: "28px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(6,10,22,0.28)",
    boxShadow:
      "0 12px 28px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "0 18px"
  },

  searchIconSvg: {
    width: "27px",
    height: "27px",
    display: "block",
    color: "rgba(255,255,255,0.96)",
    flexShrink: 0
  },

  searchInput: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#ffffff",
    fontSize: "15px",
    lineHeight: 1.2,
    fontWeight: 500,
    fontFamily:
      '"TikTok Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },

  bottomNavBar: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 21,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    padding: "8px 12px calc(8px + env(safe-area-inset-bottom))",
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(2,6,18,0.88) 18%, rgba(2,6,18,0.97) 100%)",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    backdropFilter: "blur(16px)"
  },

  bottomNavItem: {
    appearance: "none",
    background: "transparent",
    border: "none",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "3px",
    cursor: "pointer",
    minWidth: "52px"
  },

  bottomNavIconSvg: {
    width: "26px",
    height: "26px",
    display: "block",
    color: "#ffffff"
  },

  bottomNavLabel: {
    fontSize: "11px",
    lineHeight: 1.1,
    fontWeight: 600,
    color: "rgba(255,255,255,0.82)"
  },

  bottomNavLabelActive: {
    fontSize: "11px",
    lineHeight: 1.1,
    fontWeight: 700,
    color: "#ffffff"
  },

  createButton: {
    appearance: "none",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 0,
    marginTop: "-2px"
  },

  createButtonOuter: {
    width: "82px",
    height: "46px",
    borderRadius: "16px",
    background:
      "linear-gradient(90deg, #69c9d0 0%, #ffffff 50%, #ee1d52 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 24px rgba(0,0,0,0.22)"
  },

  createButtonInner: {
    width: "66px",
    height: "46px",
    borderRadius: "14px",
    background: "#ffffff",
    color: "#111111",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    fontWeight: 700,
    lineHeight: 1
  },

  bottomNavBadgeWrap: {
    position: "relative",
    display: "inline-flex"
  },

  bottomNavBadge: {
    position: "absolute",
    top: "-6px",
    right: "-10px",
    minWidth: "20px",
    height: "20px",
    borderRadius: "999px",
    background: "#ff476f",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 6px",
    boxShadow: "0 8px 18px rgba(0,0,0,0.22)"
  },

  infoOverlayBackdrop: {
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

  infoOverlayCard: {
    width: "min(760px, 100%)",
    borderRadius: "26px",
    border: "1px solid rgba(255,255,255,0.12)",
    background:
      "linear-gradient(180deg, rgba(12,18,35,0.94) 0%, rgba(9,14,28,0.96) 100%)",
    boxShadow: "0 24px 50px rgba(0,0,0,0.35)",
    color: "#ffffff",
    padding: "20px"
  },

  infoOverlayHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "14px"
  },

  infoOverlayEyebrow: {
    fontSize: "13px",
    fontWeight: 800,
    letterSpacing: "0.14em",
    color: "rgba(156,223,255,0.95)"
  },

  infoOverlayTitle: {
    margin: "8px 0 0 0",
    fontSize: "28px",
    lineHeight: 1.05,
    fontWeight: 900
  },

  infoOverlayTrack: {
    margin: "8px 0 0 0",
    color: "rgba(255,255,255,0.78)",
    fontSize: "16px",
    fontWeight: 600
  },

  infoOverlayClose: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#ffffff",
    fontSize: "22px",
    lineHeight: 1,
    cursor: "pointer"
  },

  infoOverlaySection: {
    marginTop: "16px",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    padding: "16px"
  },

  infoOverlaySectionLabel: {
    fontSize: "13px",
    fontWeight: 800,
    letterSpacing: "0.12em",
    color: "rgba(255,255,255,0.66)"
  },

  infoOverlayGrid: {
    marginTop: "12px",
    display: "grid",
    gap: "12px"
  },

  infoOverlayRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    paddingBottom: "10px"
  },

  infoOverlayRowLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: "15px",
    fontWeight: 700
  },

  infoOverlayRowValue: {
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 800,
    textAlign: "right"
  }
};
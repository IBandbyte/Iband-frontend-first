import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchSmartFeed,
  fetchPersonalisedFeed,
  fetchPredictiveFeed
} from "./services/api";

const IBAND_LOGO_SRC = "/iband-logo.png";
const DEFAULT_POSTER =
  "https://images.unsplash.com/photo-1571266028243-d220c9c3b7dc?auto=format&fit=crop&w=1400&q=80";

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

function getImage(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normaliseSmartFeed(data) {
  const items = Array.isArray(data?.feed) ? data.feed : [];

  return items.map((item, index) => ({
    id: item.id || `smart-${index}`,
    feedType: "smart",
    badge: "SMART",
    artist: getString(item.artist, "Demo Artist Nigeria"),
    handle: getString(
      item.profileHandle,
      `@${String(item.artist || "demoartist").replace(/\s+/g, "").toLowerCase()}`
    ),
    country: getString(item.country, "Nigeria"),
    title: getString(item.cardTitle, "Supernova Dreams"),
    momentumLine: getString(
      item.feedReasonTitle || item.feedReason,
      "High Momentum + Trending Worldwide"
    ),
    releaseLine: getString(
      item.releaseLabel,
      "iBand Exclusive — New Release"
    ),
    commentsLabel: getString(item.commentsLabel, "322 Comments"),
    likes: getNumber(item.likes, 3100),
    comments: getNumber(item.comments, 322),
    shares: getNumber(item.shares, 322),
    artistImage: getImage(item.artistImage || item.profileImage || item.avatarUrl),
    artwork: getImage(item.artwork || item.coverImage || item.thumbnailUrl),
    poster: getImage(item.videoPoster || item.poster || item.imageUrl || item.image),
    infoMeta: {
      artist: getString(item.artist, "Demo Artist Nigeria"),
      feed: "Smart Feed",
      territory: getString(item.country, "Nigeria"),
      action: getString(item.action, "play_now")
    }
  }));
}

function normalisePersonalisedFeed(data) {
  const profileFeed = Array.isArray(data?.feed)
    ? data.feed
    : Array.isArray(data?.profiles?.[0]?.feed)
    ? data.profiles[0].feed
    : [];

  const country = getString(data?.profiles?.[0]?.country, "United Kingdom");

  return profileFeed.map((item, index) => ({
    id: item.id || `personalised-${index}`,
    feedType: "personalised",
    badge: "FOR YOU",
    artist: getString(item.artist, "Demo Artist Nigeria"),
    handle: getString(
      item.profileHandle,
      `@${String(item.artist || "demoartist").replace(/\s+/g, "").toLowerCase()}`
    ),
    country,
    title: getString(item.cardTitle, "Supernova Dreams"),
    momentumLine: getString(
      item.feedReasonTitle || item.reason,
      "High Momentum + Trending Worldwide"
    ),
    releaseLine: getString(
      item.releaseLabel,
      "iBand Exclusive — New Release"
    ),
    commentsLabel: getString(item.commentsLabel, "322 Comments"),
    likes: getNumber(item.likes, 3100),
    comments: getNumber(item.comments, 322),
    shares: getNumber(item.shares, 322),
    artistImage: getImage(item.artistImage || item.profileImage || item.avatarUrl),
    artwork: getImage(item.artwork || item.coverImage || item.thumbnailUrl),
    poster: getImage(item.videoPoster || item.poster || item.imageUrl || item.image),
    infoMeta: {
      artist: getString(item.artist, "Demo Artist Nigeria"),
      feed: "Personalised Feed",
      territory: country,
      action: getString(item.action, "play_now")
    }
  }));
}

function normalisePredictiveFeed(data) {
  const items = Array.isArray(data?.predictions)
    ? data.predictions
    : Array.isArray(data?.feed)
    ? data.feed
    : [];

  return items.map((item, index) => ({
    id: item.id || `predictive-${index}`,
    feedType: "predictive",
    badge: "PREDICTED",
    artist: getString(item.recommendedArtist || item.artist, "Demo Artist Nigeria"),
    handle: getString(
      item.profileHandle,
      `@${String(item.recommendedArtist || item.artist || "demoartist")
        .replace(/\s+/g, "")
        .toLowerCase()}`
    ),
    country: getString(item.country || item.userMode, "Brazil"),
    title: getString(item.cardTitle || item.recommendedCategory, "Supernova Dreams"),
    momentumLine: getString(
      item.feedReasonTitle || item.reason,
      "High Momentum + Trending Worldwide"
    ),
    releaseLine: getString(
      item.releaseLabel,
      "iBand Exclusive — New Release"
    ),
    commentsLabel: getString(item.commentsLabel, "322 Comments"),
    likes: getNumber(item.likes, 3100),
    comments: getNumber(item.comments, 322),
    shares: getNumber(item.shares, 322),
    artistImage: getImage(item.artistImage || item.profileImage || item.avatarUrl),
    artwork: getImage(item.artwork || item.coverImage || item.thumbnailUrl),
    poster: getImage(item.videoPoster || item.poster || item.imageUrl || item.image),
    infoMeta: {
      artist: getString(item.recommendedArtist || item.artist, "Demo Artist Nigeria"),
      feed: "Predictive Feed",
      territory: getString(item.country || item.userMode, "Brazil"),
      action: getString(item.predictedNextAction || item.action, "play_now")
    }
  }));
}

function createFallbackFeed() {
  const base = [
    {
      id: "demo-1",
      feedType: "personalised",
      badge: "FOR YOU",
      artist: "Sam Ryder",
      handle: "@samryder",
      country: "United Kingdom",
      title: "Supernova Dreams",
      momentumLine: "High Momentum + Trending Worldwide",
      releaseLine: "iBand Exclusive — New Release",
      commentsLabel: "322 Comments",
      likes: 3100,
      comments: 322,
      shares: 322,
      infoMeta: {
        artist: "Sam Ryder",
        feed: "Personalised Feed",
        territory: "United Kingdom",
        action: "play_now"
      }
    },
    {
      id: "demo-2",
      feedType: "smart",
      badge: "SMART",
      artist: "Demo Artist Nigeria",
      handle: "@demoartistnigeria",
      country: "Nigeria",
      title: "Supernova Dreams",
      momentumLine: "High Momentum + Trending Worldwide",
      releaseLine: "iBand Exclusive — New Release",
      commentsLabel: "322 Comments",
      likes: 3100,
      comments: 322,
      shares: 322,
      infoMeta: {
        artist: "Demo Artist Nigeria",
        feed: "Smart Feed",
        territory: "Nigeria",
        action: "play_now"
      }
    },
    {
      id: "demo-3",
      feedType: "predictive",
      badge: "PREDICTED",
      artist: "Demo Artist Brazil",
      handle: "@demoartistbrazil",
      country: "Brazil",
      title: "Supernova Dreams",
      momentumLine: "High Momentum + Trending Worldwide",
      releaseLine: "iBand Exclusive — New Release",
      commentsLabel: "322 Comments",
      likes: 3100,
      comments: 322,
      shares: 322,
      infoMeta: {
        artist: "Demo Artist Brazil",
        feed: "Predictive Feed",
        territory: "Brazil",
        action: "play_now"
      }
    }
  ];

  return base.map((item, index) => ({
    ...item,
    artistImage: createArtistAvatarDataUri(item.artist, index),
    artwork: createArtworkDataUri(index),
    poster: DEFAULT_POSTER
  }));
}

function buildUnifiedFeed({ smart, personalised, predictive }) {
  const merged = [...personalised, ...smart, ...predictive];

  if (!merged.length) {
    return createFallbackFeed();
  }

  return merged.map((item, index) => ({
    ...item,
    artistImage:
      item.artistImage || createArtistAvatarDataUri(item.artist, index),
    artwork: item.artwork || createArtworkDataUri(index),
    poster: item.poster || DEFAULT_POSTER
  }));
}

function FeedCard({ item, isActive, onOpenInfo }) {
  return (
    <article style={styles.slide}>
      <div
        style={{
          ...styles.poster,
          backgroundImage: `url("${item.poster}")`,
          transform: isActive ? "scale(1.02)" : "scale(1)"
        }}
      />

      <div style={styles.posterOverlay} />
      <div style={styles.bottomFade} />

      <div style={styles.headerBrand}>
        <img
          src={IBAND_LOGO_SRC}
          alt="iBand"
          style={styles.headerLogo}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
        <div style={styles.headerBrandTextWrap}>
          <div style={styles.headerBrandTitle}>iBand</div>
          <div style={styles.headerBrandSubtitle}>Powered By Fans</div>
        </div>
      </div>

      <div style={styles.rightRail}>
        <div style={styles.avatarGroup}>
          <img
            src={item.artistImage}
            alt={item.artist}
            style={styles.avatar}
          />
          <div style={styles.avatarLabel}>Artist</div>
        </div>

        <div style={styles.railActionWrap}>
          <button type="button" style={styles.railButton} aria-label="Like">
            <span style={styles.railEmoji}>❤</span>
          </button>
          <div style={styles.railCount}>{formatCompactCount(item.likes)}</div>
        </div>

        <div style={styles.railActionWrap}>
          <button type="button" style={styles.railButton} aria-label="Comments">
            <span style={styles.railEmoji}>💬</span>
          </button>
          <div style={styles.railCount}>{formatCompactCount(item.comments)}</div>
        </div>

        <div style={styles.railActionWrap}>
          <button
            type="button"
            style={styles.infoButton}
            aria-label="Info"
            onClick={() => onOpenInfo(item)}
          >
            <span style={styles.infoButtonText}>i</span>
          </button>
        </div>

        <div style={styles.railActionWrap}>
          <button type="button" style={styles.moreButton} aria-label="More">
            <span style={styles.moreDots}>•••</span>
          </button>
        </div>

        <div style={styles.railActionWrap}>
          <button type="button" style={styles.artworkButton} aria-label="Sound">
            <img
              src={item.artwork}
              alt={`${item.title} artwork`}
              style={styles.artworkImage}
            />
          </button>
        </div>
      </div>

      <div style={styles.contentArea}>
        <h2 style={styles.titleText}>
          {item.artist} — “{item.title}”
        </h2>

        <p style={styles.momentumText}>{item.momentumLine}</p>

        <p style={styles.releaseText}>🎵 {item.releaseLine}</p>

        <p style={styles.commentsText}>{item.commentsLabel}</p>
      </div>
    </article>
  );
}

function InfoOverlay({ item, onClose }) {
  if (!item) return null;

  const meta = item.infoMeta || {};

  return (
    <div style={styles.overlayBackdrop} onClick={onClose}>
      <div
        style={styles.overlayPanel}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={styles.overlayHeader}>
          <div>
            <div style={styles.overlayEyebrow}>IBAND INFO</div>
            <h3 style={styles.overlayTitle}>{item.artist}</h3>
            <p style={styles.overlaySubTitle}>{item.title}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={styles.overlayClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div style={styles.overlayCard}>
          {[
            ["Artist", meta.artist || item.artist],
            ["Feed", meta.feed || item.feedType],
            ["Territory", meta.territory || item.country],
            ["Action", meta.action || "play_now"]
          ].map(([label, value]) => (
            <div key={label} style={styles.overlayRow}>
              <span style={styles.overlayRowLabel}>{label}</span>
              <span style={styles.overlayRowValue}>{value}</span>
            </div>
          ))}
        </div>

        <div style={styles.overlayGrid}>
          {["Artist bio", "Lyrics", "Concerts", "Merch"].map((label) => (
            <button key={label} type="button" style={styles.overlayGridButton}>
              {label}
            </button>
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

      const [smartResult, personalisedResult, predictiveResult] =
        await Promise.allSettled([
          fetchSmartFeed(),
          fetchPersonalisedFeed(),
          fetchPredictiveFeed()
        ]);

      if (!isMounted) return;

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
    if (!scrollRef.current || !unifiedFeed.length) return undefined;

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
      <div ref={scrollRef} style={styles.scroller}>
        {loading && !unifiedFeed.length ? (
          <div style={styles.loadingWrap}>Loading iBand feed…</div>
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

      <div style={styles.searchDock}>
        <div style={styles.searchBar}>
          <span style={styles.searchIcon}>⌕</span>
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search artists, songs, genres"
            style={styles.searchInput}
          />
        </div>
      </div>

      <nav aria-label="Primary" style={styles.bottomNav}>
        <button type="button" style={styles.navItem}>
          <span style={styles.navIcon}>⌂</span>
          <span style={styles.navLabel}>Home</span>
        </button>

        <button type="button" style={styles.navItem}>
          <span style={styles.navIcon}>⌑</span>
          <span style={styles.navLabel}>Shop</span>
        </button>

        <button type="button" style={styles.createButton} aria-label="Create">
          +
        </button>

        <button type="button" style={styles.navItem}>
          <span style={styles.navIcon}>⌲</span>
          <span style={styles.navLabel}>Inbox</span>
          <span style={styles.navBadge}>2</span>
        </button>

        <button type="button" style={styles.navItem}>
          <span style={styles.navIcon}>◠</span>
          <span style={styles.navLabel}>Profile</span>
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
    background: "#030712",
    color: "#ffffff",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  scroller: {
    position: "relative",
    width: "100%",
    height: "100dvh",
    overflowY: "auto",
    overflowX: "hidden",
    scrollSnapType: "y mandatory",
    WebkitOverflowScrolling: "touch",
    overscrollBehaviorY: "contain"
  },
  loadingWrap: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 700,
    color: "rgba(255,255,255,0.9)"
  },
  slide: {
    position: "relative",
    width: "100%",
    minHeight: "100dvh",
    height: "100dvh",
    overflow: "hidden",
    scrollSnapAlign: "start",
    scrollSnapStop: "always",
    background:
      "linear-gradient(180deg, rgba(7,10,26,1) 0%, rgba(5,9,20,1) 100%)"
  },
  poster: {
    position: "absolute",
    inset: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
    transition: "transform 280ms ease",
    filter: "saturate(1.03) contrast(1.02)"
  },
  posterOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(3,6,18,0.50) 0%, rgba(3,6,18,0.18) 28%, rgba(3,6,18,0.12) 48%, rgba(3,6,18,0.36) 70%, rgba(3,6,18,0.72) 100%)"
  },
  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "34%",
    background:
      "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(2,6,18,0.18) 25%, rgba(2,6,18,0.54) 68%, rgba(2,6,18,0.90) 100%)"
  },
  headerBrand: {
    position: "absolute",
    top: "calc(env(safe-area-inset-top) + 18px)",
    left: 18,
    zIndex: 5,
    display: "flex",
    alignItems: "center",
    gap: 12
  },
  headerLogo: {
    width: 74,
    height: 74,
    borderRadius: "50%",
    objectFit: "cover",
    boxShadow: "0 12px 26px rgba(0,0,0,0.25)"
  },
  headerBrandTextWrap: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },
  headerBrandTitle: {
    fontSize: 30,
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: "-0.02em",
    color: "#ffffff",
    textShadow: "0 4px 18px rgba(0,0,0,0.26)"
  },
  headerBrandSubtitle: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: 500,
    lineHeight: 1.1,
    color: "rgba(255,255,255,0.88)",
    textShadow: "0 4px 18px rgba(0,0,0,0.26)"
  },
  rightRail: {
    position: "absolute",
    right: 18,
    top: "22dvh",
    zIndex: 5,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16
  },
  avatarGroup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid rgba(255,255,255,0.96)",
    boxShadow: "0 12px 26px rgba(0,0,0,0.35)"
  },
  avatarLabel: {
    fontSize: 18,
    fontWeight: 700,
    color: "#ffffff",
    textShadow: "0 3px 10px rgba(0,0,0,0.28)"
  },
  railActionWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6
  },
  railButton: {
    width: 58,
    height: 58,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(13, 19, 37, 0.44)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(12px)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
    cursor: "pointer"
  },
  railEmoji: {
    fontSize: 34,
    lineHeight: 1
  },
  railCount: {
    fontSize: 16,
    fontWeight: 800,
    color: "rgba(255,255,255,0.96)",
    textShadow: "0 2px 6px rgba(0,0,0,0.35)"
  },
  infoButton: {
    width: 58,
    height: 58,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(13, 19, 37, 0.44)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(12px)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
    cursor: "pointer"
  },
  infoButtonText: {
    fontSize: 34,
    fontWeight: 700,
    lineHeight: 1
  },
  moreButton: {
    width: 58,
    height: 38,
    border: "none",
    background: "transparent",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer"
  },
  moreDots: {
    fontSize: 22,
    lineHeight: 1,
    letterSpacing: "0.18em"
  },
  artworkButton: {
    width: 58,
    height: 58,
    borderRadius: "50%",
    padding: 0,
    overflow: "hidden",
    border: "3px solid rgba(255,255,255,0.96)",
    background: "transparent",
    boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
    cursor: "pointer"
  },
  artworkImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  contentArea: {
    position: "absolute",
    left: 18,
    right: 98,
    bottom: "calc(148px + env(safe-area-inset-bottom))",
    zIndex: 5
  },
  titleText: {
    margin: 0,
    fontSize: "clamp(34px, 5vw, 42px)",
    lineHeight: 1.04,
    fontWeight: 900,
    letterSpacing: "-0.02em",
    color: "#ffffff",
    textShadow: "0 4px 18px rgba(0,0,0,0.38)"
  },
  momentumText: {
    margin: "14px 0 0 0",
    fontSize: "clamp(19px, 3vw, 24px)",
    lineHeight: 1.1,
    fontWeight: 500,
    color: "rgba(255,255,255,0.86)",
    textShadow: "0 3px 10px rgba(0,0,0,0.34)"
  },
  releaseText: {
    margin: "16px 0 0 0",
    fontSize: "clamp(17px, 2.6vw, 21px)",
    lineHeight: 1.15,
    fontWeight: 500,
    color: "rgba(156,223,255,0.96)",
    textShadow: "0 3px 10px rgba(0,0,0,0.30)"
  },
  commentsText: {
    margin: "16px 0 0 0",
    fontSize: "clamp(15px, 2.4vw, 18px)",
    lineHeight: 1.2,
    fontWeight: 500,
    color: "rgba(255,255,255,0.72)"
  },
  searchDock: {
    position: "fixed",
    left: 14,
    right: 14,
    bottom: "calc(92px + env(safe-area-inset-bottom))",
    zIndex: 10
  },
  searchBar: {
    height: 58,
    borderRadius: 30,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(6, 10, 22, 0.44)",
    boxShadow: "0 14px 30px rgba(0,0,0,0.28)",
    backdropFilter: "blur(18px)",
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "0 18px"
  },
  searchIcon: {
    fontSize: 28,
    lineHeight: 1,
    opacity: 0.95
  },
  searchInput: {
    flex: 1,
    height: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#ffffff",
    fontSize: 17,
    fontWeight: 500
  },
  bottomNav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 11,
    height: "calc(84px + env(safe-area-inset-bottom))",
    paddingBottom: "env(safe-area-inset-bottom)",
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(2,6,18,0.92) 18%, rgba(2,6,18,0.98) 100%)",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(18px)",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
    alignItems: "center",
    paddingInline: 10
  },
  navItem: {
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
  },
  navIcon: {
    fontSize: 28,
    lineHeight: 1
  },
  navLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: "rgba(255,255,255,0.92)"
  },
  createButton: {
    justifySelf: "center",
    width: 86,
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
  },
  navBadge: {
    position: "absolute",
    top: 4,
    right: "calc(50% - 28px)",
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    background: "#fb7185",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 900,
    padding: "0 6px",
    boxShadow: "0 8px 18px rgba(0,0,0,0.22)"
  },
  overlayBackdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 30,
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
    color: "#ffffff",
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
  overlaySubTitle: {
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
    color: "#ffffff",
    fontSize: 22,
    lineHeight: 1,
    cursor: "pointer"
  },
  overlayCard: {
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
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 800,
    textAlign: "right"
  },
  overlayGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12
  },
  overlayGridButton: {
    height: 48,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.06)",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer"
  }
};
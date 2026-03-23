import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchSmartFeed,
  fetchPersonalisedFeed,
  fetchPredictiveFeed
} from "./services/api";
import { IBAND_LOGO_SRC } from "./components/ibandRailLogo";

const VIEW_DURATION_MS = 12 * 60 * 60 * 1000;

const IBAND_BRAND_LOCKUP_SRC =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 980 280">
  <defs>
    <linearGradient id="brandBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#8b3dff"/>
      <stop offset="50%" stop-color="#ff6b3d"/>
      <stop offset="100%" stop-color="#5d2a91"/>
    </linearGradient>
    <radialGradient id="brandGlow" cx="50%" cy="42%" r="60%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.16)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
    <linearGradient id="guitarFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fffdf8"/>
      <stop offset="100%" stop-color="#f4e7d4"/>
    </linearGradient>
  </defs>

  <circle cx="140" cy="140" r="118" fill="url(#brandBg)"/>
  <circle cx="140" cy="140" r="118" fill="url(#brandGlow)"/>

  <g opacity="0.12" fill="#6b1d62">
    <path d="M46 178c10-30 24-48 40-58 14-9 29-12 41-10-5-7-8-16-8-25 0-23 18-41 41-41 22 0 40 18 40 41 0 9-3 18-8 25 12-2 27 1 41 10 16 10 30 28 40 58H46z"/>
    <circle cx="78" cy="106" r="18"/>
    <circle cx="144" cy="126" r="16"/>
    <circle cx="212" cy="110" r="19"/>
  </g>

  <g fill="url(#guitarFade)">
    <rect x="133" y="42" width="14" height="116" rx="7"/>
    <path d="M128 32c0-11 9-20 20-20h8c15 0 27 12 27 27 0 13-8 23-19 28l-9 3V32h-27z"/>
    <circle cx="124" cy="54" r="5"/>
    <circle cx="124" cy="74" r="5"/>
    <circle cx="124" cy="94" r="5"/>
  </g>

  <text
    x="286"
    y="154"
    font-family="Arial, Helvetica, sans-serif"
    font-size="116"
    font-weight="700"
    fill="#091426"
    letter-spacing="-3"
  >
    iBand
  </text>

  <text
    x="290"
    y="212"
    font-family="Arial, Helvetica, sans-serif"
    font-size="44"
    font-weight="500"
    fill="#111827"
  >
    Get Signed / Connect
  </text>
</svg>
`);

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

  const [c1, c2] = gradients[index % gradients.length];

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <rect width="200" height="200" rx="100" fill="url(#bg)"/>
    <circle cx="100" cy="72" r="32" fill="rgba(255,255,255,0.24)"/>
    <path d="M40 165c10-30 33-46 60-46s50 16 60 46" fill="rgba(255,255,255,0.24)"/>
    <text x="100" y="118" text-anchor="middle" font-size="42" font-family="Arial, sans-serif" font-weight="700" fill="white">${initials}</text>
  </svg>
  `;

  return svgDataUri(svg);
}

function pickImageUrl(item) {
  return (
    item?.imageUrl ||
    item?.artistImage ||
    item?.avatarUrl ||
    item?.profileImage ||
    item?.coverImage ||
    item?.thumbnailUrl ||
    item?.photoUrl ||
    ""
  );
}

function pickHasNewPost(item, fallback = false) {
  if (typeof item?.hasNewPost === "boolean") return item.hasNewPost;
  if (typeof item?.hasFreshPost === "boolean") return item.hasFreshPost;
  if (typeof item?.isNew === "boolean") return item.isNew;
  if (typeof item?.isFresh === "boolean") return item.isFresh;
  if (typeof item?.unseen === "boolean") return item.unseen;
  if (typeof item?.hasUnseenContent === "boolean") return item.hasUnseenContent;
  if (typeof item?.newUpload === "boolean") return item.newUpload;
  if (typeof item?.freshDrop === "boolean") return item.freshDrop;
  if (typeof item?.justPosted === "boolean") return item.justPosted;
  return fallback;
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
      .replace(/\s+/g, "")}`,
    soundLabel: item.artist || "Original Sound",
    caption:
      item.feedReason ||
      item.message ||
      "Momentum is building. Fans are pushing this higher right now.",
    profileImage: pickImageUrl(item),
    hasNewPost: pickHasNewPost(item, index === 0)
  }));
}

function normalisePersonalisedFeed(data) {
  const profiles = Array.isArray(data?.profiles) ? data.profiles : [];
  const firstProfile = profiles[0];
  const items = Array.isArray(firstProfile?.feed) ? firstProfile.feed : [];

  return items.map((item, index) => ({
    id: item.id || `personalised-${index}`,
    source: "personalised-feed",
    artist: item.artist || "Unknown Artist",
    country: firstProfile?.country || "Personalised",
    title: `${firstProfile?.persona || "Your"} feed pick`,
    subtitle: `Tailored for ${firstProfile?.country || "you"}`,
    reason: item.reason || "Matched to your taste",
    icon: item.icon || "✨",
    priority: firstProfile?.engagementLevel || "medium",
    action: item.action || "discover_artist",
    badge: "FOR YOU",
    profileHandle: `@${String(item.artist || "artist")
      .toLowerCase()
      .replace(/\s+/g, "")}`,
    soundLabel: item.artist || "Personalised Track",
    caption:
      item.reason ||
      "This matches your taste profile and current breakout momentum.",
    profileImage: pickImageUrl(item) || pickImageUrl(firstProfile),
    hasNewPost: pickHasNewPost(item, index === 0)
  }));
}

function normalisePredictiveFeed(data) {
  const items = Array.isArray(data?.predictions) ? data.predictions : [];

  return items.map((item, index) => ({
    id: item.id || `predictive-${index}`,
    source: "predictive-feed",
    artist: item.recommendedArtist || "Unknown Artist",
    country: item.userMode || "Predictive",
    title: "Predicted next best move",
    subtitle: item.recommendedCategory || "Next content decision",
    reason: item.reason || "Predicted by iBand intelligence",
    icon: item.icon || "🔮",
    priority: item.injectionTiming || "soon",
    action: item.predictedNextAction || "show_next",
    badge: "PREDICTED",
    profileHandle: `@${String(item.recommendedArtist || "artist")
      .toLowerCase()
      .replace(/\s+/g, "")}`,
    soundLabel: item.recommendedArtist || "Predicted Sound",
    caption:
      item.reason ||
      "The predictive engine thinks this is your strongest next discovery.",
    profileImage: pickImageUrl(item),
    hasNewPost: pickHasNewPost(item, false)
  }));
}

function priorityScore(priority) {
  const value = String(priority || "").toLowerCase();

  if (value.includes("critical")) return 5;
  if (value.includes("high")) return 4;
  if (value.includes("locked")) return 4;
  if (value.includes("immediate")) return 4;
  if (value.includes("soon")) return 3;
  if (value.includes("medium")) return 2;
  return 1;
}

function formatCompactNumber(value) {
  const n = Number(value || 0);

  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function seededNumber(seed, min, max) {
  let hash = 0;

  for (let i = 0; i < String(seed).length; i += 1) {
    hash = (hash << 5) - hash + String(seed).charCodeAt(i);
    hash |= 0;
  }

  const normalized = Math.abs(hash % 1000) / 1000;
  return Math.floor(min + normalized * (max - min));
}

function getBadgeStyle(badge) {
  if (badge === "SMART") {
    return {
      background: "rgba(168, 85, 247, 0.28)",
      border: "1px solid rgba(168, 85, 247, 0.48)"
    };
  }

  if (badge === "FOR YOU") {
    return {
      background: "rgba(249, 115, 22, 0.26)",
      border: "1px solid rgba(249, 115, 22, 0.48)"
    };
  }

  return {
    background: "rgba(59, 130, 246, 0.24)",
    border: "1px solid rgba(59, 130, 246, 0.45)"
  };
}

function getMockBackground(index) {
  const backgrounds = [
    "linear-gradient(160deg, rgba(168,85,247,0.88) 0%, rgba(249,115,22,0.72) 48%, rgba(15,23,42,0.96) 100%)",
    "linear-gradient(160deg, rgba(236,72,153,0.78) 0%, rgba(59,130,246,0.58) 50%, rgba(2,6,23,0.96) 100%)",
    "linear-gradient(160deg, rgba(34,197,94,0.68) 0%, rgba(234,179,8,0.54) 50%, rgba(17,24,39,0.96) 100%)",
    "linear-gradient(160deg, rgba(239,68,68,0.72) 0%, rgba(168,85,247,0.52) 50%, rgba(15,23,42,0.96) 100%)",
    "linear-gradient(160deg, rgba(14,165,233,0.72) 0%, rgba(99,102,241,0.54) 50%, rgba(2,6,23,0.96) 100%)"
  ];

  return backgrounds[index % backgrounds.length];
}

function getTabItems() {
  return ["LIVE", "Oxfordshire", "Following", "Friends", "For You"];
}

function AvatarRing({ hasNewPost, children }) {
  if (!hasNewPost) {
    return <div style={styles.avatarSeenRing}>{children}</div>;
  }

  return (
    <div style={styles.avatarFreshRingOuter}>
      <div style={styles.avatarFreshRingInner}>{children}</div>
    </div>
  );
}

function FeedSlide({
  item,
  index,
  isReactionMenuOpen,
  closeReactionMenu,
  handleSupportPressStart,
  handleSupportPressEnd,
  handleReactionSelect
}) {
  const [followed, setFollowed] = useState(false);
  const [viewedAt, setViewedAt] = useState(null);

  const slideRef = useRef(null);

  useEffect(() => {
    const node = slideRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
            setViewedAt((current) => current || Date.now());
          }
        });
      },
      {
        threshold: [0.7]
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const profileGlow = followed
    ? "0 0 0 rgba(0,0,0,0)"
    : "0 0 12px rgba(255,255,255,0.12)";

  const hasPhotoAvatar = Boolean(item.profileImage);
  const avatarSrc = hasPhotoAvatar
    ? item.profileImage
    : item.fallbackAvatar || createArtistAvatarDataUri(item.artist, index);

  return (
    <section
      ref={slideRef}
      style={{
        ...styles.feedSlide,
        background: getMockBackground(index)
      }}
      onClick={() => {
        if (isReactionMenuOpen) {
          closeReactionMenu();
        }
      }}
    >
      <div style={styles.backgroundGlow} />
      <div style={styles.topTint} />
      <div style={styles.bottomTint} />

      <div style={styles.rightRail}>
        <div style={styles.profileStackWrap}>
          <button
            type="button"
            style={{
              ...styles.profileStackButton,
              boxShadow: profileGlow
            }}
            aria-label="Open artist profile"
            onClick={(e) => {
              e.stopPropagation();
              setViewedAt(Date.now());
              console.log("iBand avatar tapped:", item.id);
            }}
          >
            <AvatarRing hasNewPost={Boolean(item.hasNewPost)}>
              <div style={styles.profileAvatarCircle}>
                <img
                  src={avatarSrc || IBAND_LOGO_SRC}
                  alt={item.artist}
                  style={hasPhotoAvatar ? styles.profilePhotoImage : styles.profileFallbackImage}
                />
              </div>
            </AvatarRing>
          </button>

          <button
            type="button"
            style={{
              ...styles.profilePlus,
              ...(followed ? styles.profilePlusFollowed : {})
            }}
            aria-label={followed ? "Following artist" : "Follow artist"}
            onClick={(e) => {
              e.stopPropagation();
              setFollowed((prev) => !prev);
            }}
          >
            {followed ? "✓" : "+"}
          </button>
        </div>

        <div style={styles.supportWrap}>
          {isReactionMenuOpen && (
            <div style={styles.reactionMenu}>
              <button
                type="button"
                style={styles.reactionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReactionSelect("fire");
                }}
              >
                🔥
              </button>
              <button
                type="button"
                style={styles.reactionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReactionSelect("bomb");
                }}
              >
                💣
              </button>
              <button
                type="button"
                style={styles.reactionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReactionSelect("boom");
                }}
              >
                💥
              </button>
              <button
                type="button"
                style={styles.reactionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReactionSelect("rocket");
                }}
              >
                🚀
              </button>
            </div>
          )}

          <button
            type="button"
            style={{
              ...styles.railButton,
              ...(isReactionMenuOpen ? styles.railButtonActive : {})
            }}
            aria-label="Support"
            onMouseDown={() => handleSupportPressStart(item.id)}
            onMouseUp={handleSupportPressEnd}
            onMouseLeave={handleSupportPressEnd}
            onTouchStart={() => handleSupportPressStart(item.id)}
            onTouchEnd={handleSupportPressEnd}
            onClick={(e) => {
              e.stopPropagation();
              if (!isReactionMenuOpen) {
                console.log("iBand support tapped for:", item.id);
              }
            }}
          >
            <span style={styles.railIcon}>🎧</span>
            <span style={styles.railCount}>
              {formatCompactNumber(item.supportCount)}
            </span>
          </button>
        </div>

        <button
          type="button"
          style={styles.railButton}
          aria-label="Comments"
        >
          <span style={styles.railIcon}>💬</span>
          <span style={styles.railCount}>
            {formatCompactNumber(item.comments)}
          </span>
        </button>

        <button
          type="button"
          style={styles.railButton}
          aria-label="Save"
        >
          <span style={styles.railIcon}>⭐</span>
          <span style={styles.railCount}>
            {formatCompactNumber(item.saves)}
          </span>
        </button>

        <button
          type="button"
          style={styles.railButton}
          aria-label="Spread"
        >
          <span style={styles.railIcon}>🚀</span>
          <span style={styles.railCount}>
            {formatCompactNumber(item.shares)}
          </span>
        </button>

        <button
          type="button"
          style={styles.soundButton}
          aria-label="Open sound page"
        >
          <div style={styles.soundDiscInner}>🎵</div>
        </button>
      </div>

      <div style={styles.bottomOverlay}>
        <div style={styles.identityRow}>
          <span style={styles.artistName}>{item.artist}</span>
          <span style={styles.verifiedDot}>✓</span>
        </div>

        <div style={styles.handleRow}>
          <span style={styles.handle}>{item.profileHandle}</span>
          <span
            style={{
              ...styles.feedBadge,
              ...getBadgeStyle(item.badge)
            }}
          >
            {item.badge}
          </span>
        </div>

        <div style={styles.captionText}>{item.caption}</div>

        <div style={styles.subtitleText}>{item.subtitle}</div>

        <div style={styles.whyBox}>
          <div style={styles.whyLabel}>Why you are seeing this</div>
          <div style={styles.whyText}>{item.reason}</div>
        </div>

        <div style={styles.metaRow}>
          <span style={styles.metaSource}>{item.source}</span>
          <span style={styles.metaDivider}>•</span>
          <span style={styles.metaCountry}>{item.country}</span>
          <span style={styles.metaDivider}>•</span>
          <span style={styles.metaAction}>{item.action}</span>
        </div>

        <div style={styles.soundRow}>
          <span style={styles.soundNote}>♫</span>
          <span style={styles.soundText}>{item.soundLabel}</span>
        </div>
      </div>

      <div style={styles.orderBadge}>#{item.orderLabel}</div>
    </section>
  );
}

export default function Feed() {
  const [smartFeed, setSmartFeed] = useState([]);
  const [personalisedFeed, setPersonalisedFeed] = useState([]);
  const [predictiveFeed, setPredictiveFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("For You");
  const [reactionMenu, setReactionMenu] = useState({
    open: false,
    itemId: null
  });

  const holdTimerRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function loadFeed() {
      try {
        setLoading(true);
        setError("");

        const [smart, personalised, predictive] = await Promise.all([
          fetchSmartFeed(),
          fetchPersonalisedFeed(),
          fetchPredictiveFeed()
        ]);

        if (!active) return;

        setSmartFeed(normaliseSmartFeed(smart));
        setPersonalisedFeed(normalisePersonalisedFeed(personalised));
        setPredictiveFeed(normalisePredictiveFeed(predictive));
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load iBand feed.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadFeed();

    return () => {
      active = false;
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  const feedItems = useMemo(() => {
    const merged = [...personalisedFeed, ...smartFeed, ...predictiveFeed];

    return merged
      .sort((a, b) => priorityScore(b.priority) - priorityScore(a.priority))
      .map((item, index) => ({
        ...item,
        orderLabel: index + 1,
        supportCount: seededNumber(item.id, 1200, 42000),
        comments: seededNumber(`${item.id}-comments`, 18, 1800),
        saves: seededNumber(`${item.id}-saves`, 12, 3500),
        shares: seededNumber(`${item.id}-shares`, 10, 2400),
        fallbackAvatar: createArtistAvatarDataUri(item.artist, index)
      }));
  }, [personalisedFeed, smartFeed, predictiveFeed]);

  function handleSupportPressStart(itemId) {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }

    holdTimerRef.current = setTimeout(() => {
      setReactionMenu({
        open: true,
        itemId
      });
    }, 400);
  }

  function handleSupportPressEnd() {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
  }

  function handleReactionSelect(reaction) {
    console.log("iBand reaction selected:", reaction, "for item:", reactionMenu.itemId);

    setReactionMenu({
      open: false,
      itemId: null
    });
  }

  function closeReactionMenu() {
    setReactionMenu({
      open: false,
      itemId: null
    });
  }

  return (
    <div style={styles.page}>
      <div style={styles.topTabsBar}>
        <div style={styles.tabsInner}>
          {getTabItems().map((tab) => {
            const activeItem = tab === activeTab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  ...styles.tabButton,
                  ...(activeItem ? styles.tabButtonActive : {})
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <button type="button" style={styles.searchButton} aria-label="Search">
          ⌕
        </button>
      </div>

      <div style={styles.brandOverlay}>
        <img
          src={IBAND_BRAND_LOCKUP_SRC}
          alt="iBand Get Signed Connect"
          style={styles.brandOverlayImage}
        />
      </div>

      {loading ? (
        <div style={styles.centerState}>
          <div style={styles.loaderTitle}>Loading your iBand feed…</div>
          <div style={styles.loaderText}>
            Pulling from Smart Feed, Personalised Feed, and Predictive Feed.
          </div>
        </div>
      ) : error ? (
        <div style={styles.centerState}>
          <div style={styles.errorTitle}>Feed failed to load</div>
          <div style={styles.errorText}>{error}</div>
        </div>
      ) : (
        <div style={styles.snapScroller}>
          {feedItems.map((item, index) => {
            const isReactionMenuOpen =
              reactionMenu.open && reactionMenu.itemId === item.id;

            return (
              <FeedSlide
                key={item.id}
                item={item}
                index={index}
                isReactionMenuOpen={isReactionMenuOpen}
                closeReactionMenu={closeReactionMenu}
                handleSupportPressStart={handleSupportPressStart}
                handleSupportPressEnd={handleSupportPressEnd}
                handleReactionSelect={handleReactionSelect}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    position: "fixed",
    inset: 0,
    width: "100vw",
    height: "100dvh",
    background: "#000000",
    color: "#ffffff",
    overflow: "hidden",
    margin: 0,
    padding: 0,
    boxSizing: "border-box",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  topTabsBar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    width: "100vw",
    zIndex: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 12px 10px",
    boxSizing: "border-box",
    pointerEvents: "none"
  },
  tabsInner: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    overflowX: "auto",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    pointerEvents: "auto"
  },
  tabButton: {
    appearance: "none",
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.68)",
    fontSize: "15px",
    fontWeight: 700,
    padding: 0,
    position: "relative",
    whiteSpace: "nowrap",
    cursor: "pointer"
  },
  tabButtonActive: {
    color: "#ffffff"
  },
  searchButton: {
    appearance: "none",
    background: "transparent",
    border: "none",
    color: "#ffffff",
    fontSize: "28px",
    lineHeight: 1,
    padding: "0 4px",
    pointerEvents: "auto",
    cursor: "pointer"
  },
  brandOverlay: {
    position: "fixed",
    top: "148px",
    right: "10px",
    zIndex: 30,
    background: "rgba(255,255,255,0.94)",
    borderRadius: "12px",
    padding: "6px 8px",
    boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.55)"
  },
  brandOverlayImage: {
    display: "block",
    width: "160px",
    height: "48px",
    objectFit: "contain"
  },
  centerState: {
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    padding: "24px",
    background: "#050816",
    boxSizing: "border-box"
  },
  loaderTitle: {
    fontSize: "22px",
    fontWeight: 800,
    marginBottom: "10px"
  },
  loaderText: {
    fontSize: "14px",
    opacity: 0.78,
    maxWidth: "480px",
    lineHeight: 1.5
  },
  errorTitle: {
    fontSize: "22px",
    fontWeight: 800,
    marginBottom: "10px",
    color: "#fca5a5"
  },
  errorText: {
    fontSize: "14px",
    opacity: 0.88,
    maxWidth: "480px",
    lineHeight: 1.5
  },
  snapScroller: {
    width: "100vw",
    height: "100dvh",
    overflowY: "auto",
    overflowX: "hidden",
    scrollSnapType: "y mandatory",
    WebkitOverflowScrolling: "touch",
    background: "#000000"
  },
  feedSlide: {
    position: "relative",
    width: "100vw",
    minWidth: "100vw",
    height: "100dvh",
    minHeight: "100dvh",
    scrollSnapAlign: "start",
    overflow: "hidden",
    boxSizing: "border-box"
  },
  backgroundGlow: {
    position: "absolute",
    inset: 0,
    zIndex: 1,
    background:
      "radial-gradient(circle at 30% 35%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 22%, rgba(255,255,255,0) 52%)"
  },
  topTint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "28%",
    zIndex: 2,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.04) 55%, rgba(0,0,0,0) 100%)"
  },
  bottomTint: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "42%",
    zIndex: 2,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.44) 100%)"
  },
  rightRail: {
    position: "absolute",
    right: "max(10px, env(safe-area-inset-right))",
    bottom: "118px",
    zIndex: 5,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px"
  },
  profileStackWrap: {
    position: "relative",
    width: "68px",
    height: "68px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  profileStackButton: {
    position: "relative",
    appearance: "none",
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
    transition: "box-shadow 0.25s ease"
  },
  avatarFreshRingOuter: {
    width: "64px",
    height: "64px",
    borderRadius: "999px",
    padding: "3px",
    background: "linear-gradient(135deg, #14b8ff 0%, #2dd4bf 48%, #3b82f6 100%)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarFreshRingInner: {
    width: "100%",
    height: "100%",
    borderRadius: "999px",
    padding: "2px",
    background: "rgba(255,255,255,0.96)",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarSeenRing: {
    width: "64px",
    height: "64px",
    borderRadius: "999px",
    padding: "2px",
    background: "rgba(255,255,255,0.26)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  profileAvatarCircle: {
    width: "100%",
    height: "100%",
    borderRadius: "999px",
    background: "#ffffff",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  profilePhotoImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block"
  },
  profileFallbackImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block"
  },
  profilePlus: {
    position: "absolute",
    right: "-2px",
    bottom: "-2px",
    width: "28px",
    height: "28px",
    borderRadius: "999px",
    background: "#ff2f6f",
    border: "3px solid #ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "18px",
    lineHeight: 1,
    color: "#ffffff",
    cursor: "pointer",
    boxShadow: "0 6px 14px rgba(0,0,0,0.22)",
    zIndex: 2
  },
  profilePlusFollowed: {
    background: "#22c55e"
  },
  supportWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  railButton: {
    appearance: "none",
    background: "transparent",
    border: "none",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "5px",
    padding: 0,
    cursor: "pointer",
    transition: "transform 0.15s ease"
  },
  railButtonActive: {
    transform: "scale(1.15)"
  },
  railIcon: {
    fontSize: "32px",
    lineHeight: 1,
    textShadow: "0 4px 14px rgba(0,0,0,0.35)"
  },
  railCount: {
    fontSize: "13px",
    fontWeight: 700,
    textShadow: "0 4px 12px rgba(0,0,0,0.35)"
  },
  reactionMenu: {
    position: "absolute",
    right: "52px",
    top: "0",
    transform: "translateY(-10%)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    borderRadius: "999px",
    background: "rgba(0,0,0,0.92)",
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "0 14px 34px rgba(0,0,0,0.45)",
    backdropFilter: "blur(12px)",
    zIndex: 10
  },
  reactionButton: {
    appearance: "none",
    background: "transparent",
    border: "none",
    fontSize: "22px",
    lineHeight: 1,
    cursor: "pointer",
    padding: 0
  },
  soundButton: {
    appearance: "none",
    border: "none",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(240,240,240,0.72))",
    width: "48px",
    height: "48px",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(0,0,0,0.30)"
  },
  soundDiscInner: {
    width: "36px",
    height: "36px",
    borderRadius: "999px",
    background: "rgba(0,0,0,0.86)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px"
  },
  bottomOverlay: {
    position: "absolute",
    left: "max(14px, env(safe-area-inset-left))",
    right: "84px",
    bottom: "18px",
    zIndex: 5
  },
  identityRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "6px"
  },
  artistName: {
    fontSize: "18px",
    fontWeight: 800,
    lineHeight: 1.15
  },
  verifiedDot: {
    width: "18px",
    height: "18px",
    borderRadius: "999px",
    background: "rgba(59,130,246,0.95)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 800
  },
  handleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
    flexWrap: "wrap"
  },
  handle: {
    fontSize: "14px",
    opacity: 0.9
  },
  feedBadge: {
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    padding: "6px 9px",
    borderRadius: "999px",
    backdropFilter: "blur(8px)"
  },
  captionText: {
    fontSize: "16px",
    fontWeight: 600,
    lineHeight: 1.35,
    marginBottom: "8px",
    textShadow: "0 4px 12px rgba(0,0,0,0.45)"
  },
  subtitleText: {
    fontSize: "14px",
    opacity: 0.92,
    lineHeight: 1.45,
    marginBottom: "12px",
    textShadow: "0 4px 12px rgba(0,0,0,0.45)"
  },
  whyBox: {
    background: "rgba(0,0,0,0.28)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "14px",
    padding: "10px 12px",
    backdropFilter: "blur(10px)",
    marginBottom: "10px"
  },
  whyLabel: {
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    opacity: 0.76,
    marginBottom: "5px"
  },
  whyText: {
    fontSize: "13px",
    lineHeight: 1.4,
    opacity: 0.97
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "12px",
    opacity: 0.82,
    marginBottom: "8px",
    flexWrap: "wrap"
  },
  metaSource: {
    textTransform: "capitalize"
  },
  metaCountry: {},
  metaAction: {
    whiteSpace: "nowrap"
  },
  metaDivider: {
    opacity: 0.5
  },
  soundRow: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "13px",
    opacity: 0.92
  },
  soundNote: {
    fontSize: "14px"
  },
  soundText: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  orderBadge: {
    position: "absolute",
    top: "74px",
    left: "max(14px, env(safe-area-inset-left))",
    zIndex: 5,
    fontSize: "11px",
    fontWeight: 800,
    padding: "6px 9px",
    borderRadius: "999px",
    background: "rgba(0,0,0,0.26)",
    border: "1px solid rgba(255,255,255,0.14)",
    backdropFilter: "blur(8px)"
  }
};
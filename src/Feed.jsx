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

function pickImageUrl(item) {
  const candidates = [
    item?.imageUrl,
    item?.artistImage,
    item?.avatarUrl,
    item?.profileImage,
    item?.coverImage,
    item?.thumbnailUrl,
    item?.photoUrl,
    item?.image
  ];

  return candidates.find((value) => isUsableImageSrc(value)) || "";
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
      background: "rgba(168, 85, 247, 0.22)",
      border: "1px solid rgba(168, 85, 247, 0.38)"
    };
  }

  if (badge === "FOR YOU") {
    return {
      background: "rgba(249, 115, 22, 0.20)",
      border: "1px solid rgba(249, 115, 22, 0.36)"
    };
  }

  return {
    background: "rgba(59, 130, 246, 0.18)",
    border: "1px solid rgba(59, 130, 246, 0.34)"
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

function getTopTabs() {
  return [
    { key: "live", label: "LIVE" },
    { key: "explore", label: "Explore" },
    { key: "country", label: "Oxfordshire" },
    { key: "following", label: "Following" },
    { key: "fans", label: "Fans" },
    { key: "for-you", label: "For You" }
  ];
}

function IconLive() {
  return (
    <svg viewBox="0 0 24 24" style={styles.topTabIconSvg} aria-hidden="true">
      <rect
        x="3.5"
        y="6"
        width="17"
        height="12"
        rx="2.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7 4.5h10M8.5 19.5h7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <text
        x="12"
        y="14.3"
        textAnchor="middle"
        fontSize="5.3"
        fontWeight="700"
        fill="currentColor"
      >
        LIVE
      </text>
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" style={styles.utilityIconSvg} aria-hidden="true">
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

function IconInfo() {
  return (
    <svg viewBox="0 0 24 24" style={styles.utilityIconSvg} aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="8" r="1.2" fill="currentColor" />
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

function IconHeadphones() {
  return (
    <svg viewBox="0 0 24 24" style={styles.railIconSvg} aria-hidden="true">
      <path
        d="M5 13a7 7 0 0114 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect
        x="4"
        y="12"
        width="4"
        height="7"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="16"
        y="12"
        width="4"
        height="7"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconComment() {
  return (
    <svg viewBox="0 0 24 24" style={styles.railIconSvg} aria-hidden="true">
      <path
        d="M6 6h12a3 3 0 013 3v4a3 3 0 01-3 3h-5l-4.5 3v-3H6a3 3 0 01-3-3V9a3 3 0 013-3z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconStar() {
  return (
    <svg viewBox="0 0 24 24" style={styles.railIconSvg} aria-hidden="true">
      <path
        d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.2-4.1 5.8-.8L12 3.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconRocket() {
  return (
    <svg viewBox="0 0 24 24" style={styles.railIconSvg} aria-hidden="true">
      <path
        d="M14.5 4c2.8.4 4.6 2.2 5 5l-4.4 4.4-5-5L14.5 4zM9 9l6 6-4 1-3-3 1-4z"
        fill="currentColor"
      />
      <path d="M6 18l3-1-2-2-1 3z" fill="currentColor" />
    </svg>
  );
}

function IconMusicDisc() {
  return (
    <svg viewBox="0 0 24 24" style={styles.soundDiscSvg} aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path
        d="M11 7v6.5a1.9 1.9 0 11-1.3-1.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
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

function IconPanelArtist() {
  return (
    <svg viewBox="0 0 24 24" style={styles.infoActionIconSvg} aria-hidden="true">
      <circle
        cx="12"
        cy="8"
        r="3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5.5 19a6.5 6.5 0 0113 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPanelHistory() {
  return (
    <svg viewBox="0 0 24 24" style={styles.infoActionIconSvg} aria-hidden="true">
      <path
        d="M6 4.5h9l3 3V19a1 1 0 01-1 1H6.8A1.8 1.8 0 015 18.2V6.3A1.8 1.8 0 016.8 4.5H6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 10h6M9 14h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPanelTickets() {
  return (
    <svg viewBox="0 0 24 24" style={styles.infoActionIconSvg} aria-hidden="true">
      <path
        d="M4 8.5h16v3a2 2 0 010 4v3H4v-3a2 2 0 010-4v-3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 8.5v10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeDasharray="2 2"
      />
    </svg>
  );
}

function IconPanelMerch() {
  return (
    <svg viewBox="0 0 24 24" style={styles.infoActionIconSvg} aria-hidden="true">
      <path
        d="M8 7l1.2-2h5.6L16 7h2v12H6V7h2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 10a3 3 0 006 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPanelLyrics() {
  return (
    <svg viewBox="0 0 24 24" style={styles.infoActionIconSvg} aria-hidden="true">
      <path
        d="M14 5v9.5a2.3 2.3 0 11-1.5-2.1V7l6-1.5v7a2.3 2.3 0 11-1.5-2.1V4.6L14 5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPanelTranslate() {
  return (
    <svg viewBox="0 0 24 24" style={styles.infoActionIconSvg} aria-hidden="true">
      <path
        d="M4 7h10M9 4v3M7 7c0 4-2 7-4 8M11 15c-2-1-3.5-3-4-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 11h6M17 8v3M15 19l2-5 2 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPanelSubscribe() {
  return (
    <svg viewBox="0 0 24 24" style={styles.infoActionIconSvg} aria-hidden="true">
      <path
        d="M4 8.5A2.5 2.5 0 016.5 6h11A2.5 2.5 0 0120 8.5v7A2.5 2.5 0 0117.5 18h-11A2.5 2.5 0 014 15.5v-7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M10 9.5l5 3-5 3v-6z" fill="currentColor" />
    </svg>
  );
}

function IconPanelBuy() {
  return (
    <svg viewBox="0 0 24 24" style={styles.infoActionIconSvg} aria-hidden="true">
      <path
        d="M7 7V6a5 5 0 0110 0v1h2l-1.1 12H6.1L5 7h2zm2 0h6V6a3 3 0 00-6 0v1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoOverlay({ isOpen, onClose }) {
  if (!isOpen) return null;

  const groups = {
    topLeft: [
      { label: "Artist", Icon: IconPanelArtist },
      { label: "History", Icon: IconPanelHistory }
    ],
    topRight: [
      { label: "Tickets", Icon: IconPanelTickets },
      { label: "Merch", Icon: IconPanelMerch }
    ],
    bottomLeft: [
      { label: "Lyrics", Icon: IconPanelLyrics },
      { label: "Translate", Icon: IconPanelTranslate }
    ],
    bottomRight: [
      { label: "Subscribe", Icon: IconPanelSubscribe },
      { label: "Buy", Icon: IconPanelBuy }
    ]
  };

  const renderGroup = (items) =>
    items.map(({ label, Icon }) => (
      <button key={label} type="button" style={styles.infoActionBox}>
        <Icon />
        <span style={styles.infoActionLabel}>{label}</span>
      </button>
    ));

  return (
    <div style={styles.infoOverlayBackdrop} onClick={onClose}>
      <div style={styles.infoFrameTopLeft} onClick={(e) => e.stopPropagation()}>
        {renderGroup(groups.topLeft)}
      </div>
      <div style={styles.infoFrameTopRight} onClick={(e) => e.stopPropagation()}>
        {renderGroup(groups.topRight)}
      </div>
      <div
        style={styles.infoFrameBottomLeft}
        onClick={(e) => e.stopPropagation()}
      >
        {renderGroup(groups.bottomLeft)}
      </div>
      <div
        style={styles.infoFrameBottomRight}
        onClick={(e) => e.stopPropagation()}
      >
        {renderGroup(groups.bottomRight)}
      </div>
    </div>
  );
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
  const [logoHidden, setLogoHidden] = useState(!isUsableImageSrc(IBAND_LOGO_SRC));
  const [avatarFailed, setAvatarFailed] = useState(false);
  const slideRef = useRef(null);

  useEffect(() => {
    const node = slideRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      () => {},
      { threshold: [0.7] }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const profileGlow =
    followed ? "0 0 0 rgba(0,0,0,0)" : "0 0 14px rgba(255,255,255,0.14)";

  const hasPhotoAvatar = isUsableImageSrc(item.profileImage) && !avatarFailed;
  const avatarSrc = hasPhotoAvatar
    ? item.profileImage
    : item.fallbackAvatar || createArtistAvatarDataUri(item.artist, index);

  const heatActiveCells = (index % 6) + 8;

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

      <div style={styles.orderBadge}>#{item.orderLabel}</div>

      {!logoHidden ? (
        <div style={styles.slideBrandOverlay}>
          <img
            src={IBAND_LOGO_SRC}
            alt="iBand logo"
            style={styles.slideBrandImage}
            onError={() => setLogoHidden(true)}
          />
        </div>
      ) : null}

      <div style={styles.leftHeatRail}>
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            style={{
              ...styles.heatCell,
              opacity: i < heatActiveCells ? 0.95 : 0.24
            }}
          />
        ))}
      </div>

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
              console.log("iBand avatar tapped:", item.id);
            }}
          >
            <AvatarRing hasNewPost={Boolean(item.hasNewPost)}>
              <div style={styles.profileAvatarShell}>
                <div style={styles.profileAvatarCircle}>
                  <img
                    src={avatarSrc}
                    alt={item.artist}
                    style={
                      hasPhotoAvatar
                        ? styles.profilePhotoImage
                        : styles.profileFallbackImage
                    }
                    onError={() => {
                      if (hasPhotoAvatar) {
                        setAvatarFailed(true);
                      }
                    }}
                  />
                </div>
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
            <IconHeadphones />
            <span style={styles.railCount}>
              {formatCompactNumber(item.supportCount)}
            </span>
          </button>
        </div>

        <button type="button" style={styles.railButton} aria-label="Comments">
          <IconComment />
          <span style={styles.railCount}>
            {formatCompactNumber(item.comments)}
          </span>
        </button>

        <button type="button" style={styles.railButton} aria-label="Save">
          <IconStar />
          <span style={styles.railCount}>
            {formatCompactNumber(item.saves)}
          </span>
        </button>

        <button type="button" style={styles.railButton} aria-label="Spread">
          <IconRocket />
          <span style={styles.railCount}>
            {formatCompactNumber(item.shares)}
          </span>
        </button>

        <button
          type="button"
          style={styles.soundButton}
          aria-label="Open sound page"
        >
          <IconMusicDisc />
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
    </section>
  );
}

export default function Feed() {
  const [smartFeed, setSmartFeed] = useState([]);
  const [personalisedFeed, setPersonalisedFeed] = useState([]);
  const [predictiveFeed, setPredictiveFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTopTab, setActiveTopTab] = useState("for-you");
  const [reactionMenu, setReactionMenu] = useState({
    open: false,
    itemId: null
  });
  const [infoOpen, setInfoOpen] = useState(false);
  const holdTimerRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function loadFeed() {
      try {
        setLoading(true);
        setError("");

        const [smartResult, personalisedResult, predictiveResult] =
          await Promise.allSettled([
            fetchSmartFeed(),
            fetchPersonalisedFeed(),
            fetchPredictiveFeed()
          ]);

        if (!active) return;

        const smart =
          smartResult.status === "fulfilled" ? smartResult.value : {};
        const personalised =
          personalisedResult.status === "fulfilled"
            ? personalisedResult.value
            : {};
        const predictive =
          predictiveResult.status === "fulfilled"
            ? predictiveResult.value
            : {};

        setSmartFeed(normaliseSmartFeed(smart));
        setPersonalisedFeed(normalisePersonalisedFeed(personalised));
        setPredictiveFeed(normalisePredictiveFeed(predictive));

        const hasAnyFeed =
          safeArray(normaliseSmartFeed(smart)).length > 0 ||
          safeArray(normalisePersonalisedFeed(personalised)).length > 0 ||
          safeArray(normalisePredictiveFeed(predictive)).length > 0;

        if (!hasAnyFeed) {
          setError("No iBand feed items are available right now.");
        }
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
    console.log(
      "iBand reaction selected:",
      reaction,
      "for item:",
      reactionMenu.itemId
    );
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
        <div style={styles.topTabsScroller}>
          <button
            type="button"
            style={styles.liveTabButton}
            onClick={() => setActiveTopTab("live")}
          >
            <IconLive />
          </button>

          {getTopTabs().slice(1).map((tab) => {
            const isActive = activeTopTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTopTab(tab.key)}
                style={styles.topTabButton}
              >
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

        <div style={styles.topUtilityButtons}>
          <button
            type="button"
            style={styles.utilityButton}
            aria-label="Open info overlay"
            onClick={() => setInfoOpen((prev) => !prev)}
          >
            <IconInfo />
          </button>

          <button
            type="button"
            style={styles.utilityButton}
            aria-label="Search"
          >
            <IconSearch />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={styles.centerState}>
          <div style={styles.loaderTitle}>Loading your iBand feed…</div>
          <div style={styles.loaderText}>
            Pulling from Smart Feed, Personalised Feed, and Predictive Feed.
          </div>
        </div>
      ) : error && feedItems.length === 0 ? (
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

      <InfoOverlay isOpen={infoOpen} onClose={() => setInfoOpen(false)} />

      <div style={styles.searchBarDock}>
        <button type="button" style={styles.searchBarButton}>
          <IconSearch />
          <span style={styles.searchBarText}>
            Search artists, songs, genres
          </span>
        </button>
      </div>

      <div style={styles.bottomNavBar}>
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
      </div>
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
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "16px 10px 10px",
    boxSizing: "border-box",
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.10) 70%, rgba(0,0,0,0) 100%)",
    backdropFilter: "blur(6px)"
  },
  topTabsScroller: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    minWidth: 0,
    overflowX: "auto",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    flex: 1
  },
  liveTabButton: {
    appearance: "none",
    background: "transparent",
    border: "none",
    color: "#ffffff",
    padding: 0,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    flexShrink: 0
  },
  topTabIconSvg: {
    width: "34px",
    height: "34px",
    display: "block",
    color: "#ffffff"
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
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0
  },
  topTabLabel: {
    fontSize: "15px",
    fontWeight: 700,
    color: "rgba(255,255,255,0.70)"
  },
  topTabLabelActive: {
    color: "#ffffff"
  },
  topTabUnderline: {
    marginTop: "6px",
    width: "42px",
    height: "3px",
    borderRadius: "999px",
    background: "#ffffff"
  },
  topUtilityButtons: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    flexShrink: 0
  },
  utilityButton: {
    appearance: "none",
    background: "transparent",
    border: "none",
    color: "#ffffff",
    padding: "4px",
    cursor: "pointer"
  },
  utilityIconSvg: {
    width: "30px",
    height: "30px",
    display: "block",
    color: "#ffffff"
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
    overscrollBehaviorY: "contain",
    background: "#000000"
  },
  feedSlide: {
    position: "relative",
    width: "100vw",
    minWidth: "100vw",
    height: "100dvh",
    minHeight: "100dvh",
    scrollSnapAlign: "start",
    scrollSnapStop: "always",
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
      "linear-gradient(180deg, rgba(0,0,0,0.24) 0%, rgba(0,0,0,0.06) 55%, rgba(0,0,0,0) 100%)"
  },
  bottomTint: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "34%",
    zIndex: 2,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.05) 28%, rgba(0,0,0,0.34) 68%, rgba(0,0,0,0.60) 100%)"
  },
  orderBadge: {
    position: "absolute",
    top: "90px",
    left: "max(14px, env(safe-area-inset-left))",
    zIndex: 6,
    fontSize: "11px",
    fontWeight: 800,
    padding: "6px 9px",
    borderRadius: "999px",
    background: "rgba(0,0,0,0.26)",
    border: "1px solid rgba(255,255,255,0.14)",
    backdropFilter: "blur(8px)"
  },
  slideBrandOverlay: {
    position: "absolute",
    top: "96px",
    right: "84px",
    zIndex: 6,
    pointerEvents: "none"
  },
  slideBrandImage: {
    display: "block",
    width: "136px",
    height: "48px",
    objectFit: "contain",
    borderRadius: "10px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.18)"
  },
  leftHeatRail: {
    position: "absolute",
    left: "10px",
    top: "134px",
    bottom: "160px",
    width: "10px",
    zIndex: 6,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    gap: "4px"
  },
  heatCell: {
    width: "100%",
    height: "10px",
    borderRadius: "3px",
    background:
      "linear-gradient(180deg, #34d399 0%, #22c55e 12%, #eab308 42%, #f97316 70%, #ef4444 100%)",
    boxShadow: "0 0 8px rgba(255,255,255,0.10)"
  },
  rightRail: {
    position: "absolute",
    right: "max(10px, env(safe-area-inset-right))",
    bottom: "170px",
    zIndex: 7,
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
    justifyContent: "center",
    background: "transparent"
  },
  profileStackButton: {
    position: "relative",
    appearance: "none",
    WebkitAppearance: "none",
    WebkitTapHighlightColor: "transparent",
    outline: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "64px",
    height: "64px",
    background: "transparent",
    border: "none",
    borderRadius: "999px",
    padding: 0,
    margin: 0,
    cursor: "pointer",
    transition: "box-shadow 0.25s ease"
  },
  avatarFreshRingOuter: {
    width: "64px",
    height: "64px",
    borderRadius: "999px",
    padding: "3px",
    background:
      "linear-gradient(135deg, #14b8ff 0%, #2dd4bf 48%, #3b82f6 100%)",
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
  profileAvatarShell: {
    width: "58px",
    height: "58px",
    borderRadius: "999px",
    background: "transparent",
    boxShadow: "none",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  profileAvatarCircle: {
    width: "54px",
    height: "54px",
    borderRadius: "999px",
    background: "transparent",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  profilePhotoImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    background: "transparent",
    borderRadius: "999px"
  },
  profileFallbackImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    background: "transparent",
    borderRadius: "999px"
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
  railIconSvg: {
    width: "30px",
    height: "30px",
    display: "block",
    color: "#ffffff",
    filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.35))"
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
    boxShadow: "0 10px 24px rgba(0,0,0,0.30)",
    color: "#111111"
  },
  soundDiscSvg: {
    width: "28px",
    height: "28px",
    display: "block",
    color: "#111111"
  },
  bottomOverlay: {
    position: "absolute",
    left: "max(18px, calc(env(safe-area-inset-left) + 8px))",
    right: "88px",
    bottom: "92px",
    zIndex: 5,
    maxWidth: "min(62vw, 420px)"
  },
  identityRow: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    marginBottom: "4px"
  },
  artistName: {
    fontSize: "16px",
    fontWeight: 800,
    lineHeight: 1.12,
    textShadow: "0 4px 12px rgba(0,0,0,0.40)"
  },
  verifiedDot: {
    width: "16px",
    height: "16px",
    borderRadius: "999px",
    background: "rgba(59,130,246,0.95)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: 800,
    flexShrink: 0
  },
  handleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
    flexWrap: "wrap"
  },
  handle: {
    fontSize: "12px",
    opacity: 0.84
  },
  feedBadge: {
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    padding: "5px 8px",
    borderRadius: "999px",
    backdropFilter: "blur(8px)"
  },
  captionText: {
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: 1.3,
    marginBottom: "6px",
    textShadow: "0 4px 12px rgba(0,0,0,0.42)"
  },
  subtitleText: {
    fontSize: "12px",
    opacity: 0.84,
    lineHeight: 1.35,
    marginBottom: "8px",
    textShadow: "0 4px 12px rgba(0,0,0,0.42)"
  },
  whyBox: {
    background: "rgba(0,0,0,0.16)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "8px 10px",
    backdropFilter: "blur(8px)",
    marginBottom: "8px"
  },
  whyLabel: {
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    opacity: 0.66,
    marginBottom: "4px"
  },
  whyText: {
    fontSize: "11px",
    lineHeight: 1.35,
    opacity: 0.92
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    opacity: 0.72,
    marginBottom: "6px",
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
    opacity: 0.42
  },
  soundRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    opacity: 0.84
  },
  soundNote: {
    fontSize: "12px"
  },
  soundText: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%"
  },
  infoOverlayBackdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 80,
    background: "rgba(0,0,0,0.10)"
  },
  infoFrameTopLeft: {
    position: "absolute",
    top: "126px",
    left: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  infoFrameTopRight: {
    position: "absolute",
    top: "126px",
    right: "96px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  infoFrameBottomLeft: {
    position: "absolute",
    left: "14px",
    bottom: "220px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  infoFrameBottomRight: {
    position: "absolute",
    right: "96px",
    bottom: "220px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  infoActionBox: {
    appearance: "none",
    border: "1px solid rgba(255,255,255,0.24)",
    background: "rgba(14,14,18,0.42)",
    color: "#ffffff",
    borderRadius: "14px",
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backdropFilter: "blur(14px)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.20)",
    cursor: "pointer"
  },
  infoActionIconSvg: {
    width: "18px",
    height: "18px",
    display: "block",
    color: "#ffffff",
    flexShrink: 0
  },
  infoActionLabel: {
    fontSize: "13px",
    fontWeight: 700
  },
  searchBarDock: {
    position: "fixed",
    left: "14px",
    right: "14px",
    bottom: "calc(68px + env(safe-area-inset-bottom))",
    zIndex: 60,
    pointerEvents: "none"
  },
  searchBarButton: {
    width: "100%",
    appearance: "none",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(20,20,24,0.42)",
    color: "#ffffff",
    borderRadius: "18px",
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backdropFilter: "blur(18px) saturate(140%)",
    WebkitBackdropFilter: "blur(18px) saturate(140%)",
    boxShadow:
      "0 10px 24px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.08)",
    cursor: "pointer",
    pointerEvents: "auto"
  },
  searchBarText: {
    fontSize: "15px",
    fontWeight: 600,
    color: "rgba(255,255,255,0.78)"
  },
  bottomNavBar: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 70,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    padding: "10px 12px calc(10px + env(safe-area-inset-bottom))",
    background: "rgba(0,0,0,0.94)"
  },
  bottomNavItem: {
    appearance: "none",
    background: "transparent",
    border: "none",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    cursor: "pointer",
    minWidth: "52px"
  },
  bottomNavIconSvg: {
    width: "28px",
    height: "28px",
    display: "block",
    color: "#ffffff"
  },
  bottomNavLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "rgba(255,255,255,0.78)"
  },
  bottomNavLabelActive: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#ffffff"
  },
  createButton: {
    appearance: "none",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 0,
    marginTop: "-4px"
  },
  createButtonOuter: {
    width: "58px",
    height: "34px",
    borderRadius: "12px",
    background:
      "linear-gradient(90deg, #60dbf8 0%, #ffffff 50%, #ff4f7f 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  createButtonInner: {
    width: "44px",
    height: "34px",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#111111",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: 500,
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
    minWidth: "18px",
    height: "18px",
    borderRadius: "999px",
    background: "#ff476f",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 5px"
  }
};
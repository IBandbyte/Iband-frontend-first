import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchSmartFeed,
  fetchPersonalisedFeed,
  fetchPredictiveFeed
} from "./services/api";

const DEV_LAYOUT_MODE = true;
const IBAND_LOGO_SRC = "/iband-logo.png";
const FEED_FONT_STACK =
  '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const DEFAULT_LAYOUT = {
  rightRailTop: "48.14%",
  rightRailGap: 2,
  contentOverlayBottom: 86,
  searchDockBottom: 45,
  bottomNavHeight: 42,

  rightRailScale: 1,
  rightRailIconScale: 1.3,
  rightRailAvatarScale: 1,
  rightRailDiscScale: 1,

  contentOverlayScale: 0.95,
  bottomNavScale: 1.05,
  searchDockWidth: 75
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toPxNumber(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace("px", "").trim());
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toPercentNumber(value, fallback = 50) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace("%", "").trim());
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function safeScale(value, fallback = 1) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

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

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="80" fill="url(#g)" />
      <text
        x="50%"
        y="54%"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="52"
        font-weight="700"
        fill="white"
      >
        ${initials || "A"}
      </text>
    </svg>
  `;

  return svgDataUri(svg);
}

function createFallbackArtworkDataUri(title, index) {
  const safeTitle = String(title || "iBand").slice(0, 22);
  const gradients = [
    ["#111827", "#7c3aed"],
    ["#0f172a", "#ea580c"],
    ["#111111", "#ec4899"],
    ["#1f2937", "#2563eb"]
  ];
  const [start, end] = gradients[index % gradients.length];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
        <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,0.12)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0.02)" />
        </linearGradient>
      </defs>
      <rect width="720" height="1280" fill="url(#bg)" />
      <circle cx="590" cy="220" r="170" fill="rgba(255,255,255,0.08)" />
      <circle cx="130" cy="1060" r="220" fill="rgba(255,255,255,0.06)" />
      <rect x="40" y="40" width="640" height="1200" rx="42" fill="url(#shine)" stroke="rgba(255,255,255,0.10)" />
      <text
        x="60"
        y="1080"
        font-family="Arial, Helvetica, sans-serif"
        font-size="48"
        font-weight="700"
        fill="white"
      >
        ${safeTitle}
      </text>
      <text
        x="60"
        y="1140"
        font-family="Arial, Helvetica, sans-serif"
        font-size="28"
        fill="rgba(255,255,255,0.86)"
      >
        iBand Discovery Feed
      </text>
    </svg>
  `;

  return svgDataUri(svg);
}

function normaliseItem(raw, source, index) {
  const artist = raw?.artist || raw?.name || raw?.title || `Demo Artist ${index + 1}`;
  const country = raw?.country || raw?.region || "Global";

  const badgeMap = {
    smart: "SMART",
    personalised: "PERSONALISED",
    predictive: "PREDICTED"
  };

  return {
    id: raw?.id || `${source}-${index}`,
    source,
    badge: badgeMap[source] || "IBAND",
    artist,
    title:
      raw?.cardTitle ||
      raw?.title ||
      raw?.trackTitle ||
      raw?.song ||
      "Momentum Discovery",
    subtitle:
      raw?.cardSubtitle ||
      raw?.subtitle ||
      raw?.genre ||
      "Fan-powered discovery",
    reason:
      raw?.feedReason ||
      raw?.message ||
      raw?.reason ||
      "High Momentum + Trending Worldwide",
    country,
    handle:
      raw?.profileHandle ||
      `@${String(artist).toLowerCase().replace(/[^a-z0-9]+/g, "") || "artist"}`,
    avatar:
      raw?.avatar ||
      raw?.avatarUrl ||
      raw?.profileImage ||
      createArtistAvatarDataUri(artist, index),
    artwork:
      raw?.artwork ||
      raw?.image ||
      raw?.coverArt ||
      raw?.poster ||
      createFallbackArtworkDataUri(raw?.title || artist, index),
    likes: Number(raw?.likes || raw?.hearts || raw?.votes || 1280 + index * 11),
    comments: Number(raw?.comments || raw?.commentCount || 72 + index * 3),
    saves: Number(raw?.saves || raw?.saveCount || 31 + index * 2),
    shares: Number(raw?.shares || raw?.shareCount || 19 + index),
    audioLabel: raw?.audioLabel || raw?.trackTitle || raw?.song || artist,
    action: raw?.action || "play_now"
  };
}

function normaliseSmartFeed(data) {
  const items = Array.isArray(data?.feed)
    ? data.feed
    : Array.isArray(data)
      ? data
      : [];
  return items.map((item, index) => normaliseItem(item, "smart", index));
}

function normalisePersonalisedFeed(data) {
  const items = Array.isArray(data?.feed)
    ? data.feed
    : Array.isArray(data)
      ? data
      : [];
  return items.map((item, index) => normaliseItem(item, "personalised", index));
}

function normalisePredictiveFeed(data) {
  const items = Array.isArray(data?.feed)
    ? data.feed
    : Array.isArray(data?.predictions)
      ? data.predictions
      : Array.isArray(data)
        ? data
        : [];
  return items.map((item, index) => normaliseItem(item, "predictive", index));
}

function createDemoFeed() {
  const demo = [
    {
      artist: "Demo Artist Brazil",
      title: "Neon Hearts",
      subtitle: "Latin Pop • Rising",
      country: "Brazil",
      reason: "High Momentum + Trending Worldwide"
    },
    {
      artist: "Demo Artist Nigeria",
      title: "Skyline Rhythm",
      subtitle: "Afrobeats • Breakout",
      country: "Nigeria",
      reason: "Strong fan signals + Rapid share velocity"
    },
    {
      artist: "Demo Artist UK",
      title: "Midnight Echo",
      subtitle: "Alt Pop • Discovery",
      country: "United Kingdom",
      reason: "Predicted strong response from similar listeners"
    }
  ];

  return demo.map((item, index) => normaliseItem(item, "smart", index));
}

function formatCompactNumber(value) {
  try {
    return new Intl.NumberFormat("en-GB", {
      notation: "compact",
      maximumFractionDigits: 1
    }).format(Number(value || 0));
  } catch {
    return String(value || 0);
  }
}

function IconShell({ children, size = 24 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "grid",
        placeItems: "center",
        color: "#ffffff"
      }}
    >
      {children}
    </div>
  );
}

function HeartIcon({ active = false }) {
  return (
    <IconShell>
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill={active ? "#ff2d55" : "#ffffff"}
        aria-hidden="true"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5A4.5 4.5 0 0 1 6.5 4C8.24 4 9.91 4.81 11 6.08 12.09 4.81 13.76 4 15.5 4A4.5 4.5 0 0 1 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </IconShell>
  );
}

function CommentIcon() {
  return (
    <IconShell>
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15.2a3.8 3.8 0 0 1-3.8 3.8H9.4L4 22V6.8A3.8 3.8 0 0 1 7.8 3h9.4A3.8 3.8 0 0 1 21 6.8v8.4z" />
      </svg>
    </IconShell>
  );
}

function SaveIcon() {
  return (
    <IconShell>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
      </svg>
    </IconShell>
  );
}

function ShareIcon() {
  return (
    <IconShell>
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M22 3L11 14" />
        <path d="M22 3l-7 18-4-8-8-4 19-6z" />
      </svg>
    </IconShell>
  );
}

function NavHomeIcon({ scale = 1 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={22 * scale}
      height={22 * scale}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
    </svg>
  );
}

function NavShopIcon({ scale = 1 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={22 * scale}
      height={22 * scale}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 8h16l-1.3 12H5.3L4 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function NavUploadIcon({ scale = 1 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={22 * scale}
      height={22 * scale}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <path d="M12 16V8" />
      <path d="M8.8 11.2L12 8l3.2 3.2" />
    </svg>
  );
}

function NavInboxIcon({ scale = 1 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={22 * scale}
      height={22 * scale}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 5h16v14H4z" />
      <path d="M4 13h4l2 3h4l2-3h4" />
    </svg>
  );
}

function NavProfileIcon({ scale = 1 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={22 * scale}
      height={22 * scale}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

function MusicDiscIcon({ artwork, scale = 1 }) {
  const size = 38 * scale;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        border: "1.5px solid rgba(255,255,255,0.76)",
        boxShadow: "0 8px 20px rgba(0,0,0,0.28)",
        background: "#111",
        flexShrink: 0,
        position: "relative"
      }}
    >
      <img
        src={artwork}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block"
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "50%",
          transform: "translate(-50%, -50%)",
          width: 8 * scale,
          height: 8 * scale,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.72)",
          border: "1px solid rgba(255,255,255,0.44)"
        }}
      />
    </div>
  );
}

function RightRailAction({
  value,
  label,
  scale = 1,
  onPress,
  children
}) {
  const bubbleSize = 38 * scale;
  const labelSize = 8.2 * Math.min(scale, 1.05);

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      style={{
        appearance: "none",
        border: 0,
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.5,
        width: "auto",
        padding: 0,
        cursor: "pointer"
      }}
    >
      <div
        style={{
          width: bubbleSize,
          height: bubbleSize,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: "transparent"
        }}
      >
        <div style={{ transform: `scale(${scale})` }}>
          {children}
        </div>
      </div>

      <div
        style={{
          fontSize: labelSize * 0.92,
          lineHeight: 1,
          color: "#fff",
          fontWeight: 600,
          textShadow: "0 1px 2px rgba(0,0,0,0.5)"
        }}
      >
        {formatCompactNumber(value)}
      </div>
    </button>
  );
}

function Stepper({ label, valueText, onMinus, onPlus }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto auto auto",
        alignItems: "center",
        gap: 6
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          lineHeight: 1.15,
          color: "rgba(255,255,255,0.76)",
          fontWeight: 600
        }}
      >
        {label}
      </div>

      <div
        style={{
          minWidth: 48,
          textAlign: "right",
          fontSize: 10.8,
          lineHeight: 1,
          color: "#ffffff",
          fontWeight: 800
        }}
      >
        {valueText}
      </div>

      <button type="button" onClick={onMinus} style={stepperButtonStyle}>
        −
      </button>

      <button type="button" onClick={onPlus} style={stepperButtonStyle}>
        +
      </button>
    </div>
  );
}

const stepperButtonStyle = {
  appearance: "none",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#ffffff",
  borderRadius: 999,
  width: 24,
  height: 24,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  lineHeight: 1,
  fontWeight: 800,
  cursor: "pointer",
  padding: 0
};

export default function Feed() {
  const feedRef = useRef(null);

  const [items, setItems] = useState(createDemoFeed());
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showDevCode, setShowDevCode] = useState(true);

  const [layoutValues, setLayoutValues] = useState(DEFAULT_LAYOUT);
  const [dragState, setDragState] = useState({
    active: false,
    target: null
  });

  const [likedMap, setLikedMap] = useState({});

  const activeItem = items[activeIndex] || items[0] || createDemoFeed()[0];
  const isActiveLiked = Boolean(likedMap[activeItem?.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadFeed() {
      setIsLoading(true);

      try {
        const results = await Promise.allSettled([
          fetchSmartFeed(),
          fetchPersonalisedFeed(),
          fetchPredictiveFeed()
        ]);

        const smartData =
          results[0]?.status === "fulfilled"
            ? normaliseSmartFeed(results[0].value)
            : [];
        const personalisedData =
          results[1]?.status === "fulfilled"
            ? normalisePersonalisedFeed(results[1].value)
            : [];
        const predictiveData =
          results[2]?.status === "fulfilled"
            ? normalisePredictiveFeed(results[2].value)
            : [];

        const merged = [
          ...smartData,
          ...personalisedData,
          ...predictiveData
        ].filter(Boolean);

        if (!cancelled) {
          setItems(merged.length ? merged : createDemoFeed());
        }
      } catch {
        if (!cancelled) {
          setItems(createDemoFeed());
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadFeed();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleScroll = useCallback(() => {
    const container = feedRef.current;
    if (!container) return;

    const height = container.clientHeight || window.innerHeight || 1;
    const nextIndex = clamp(
      Math.round(container.scrollTop / height),
      0,
      Math.max(items.length - 1, 0)
    );

    if (nextIndex !== activeIndex) {
      setActiveIndex(nextIndex);
    }
  }, [activeIndex, items.length]);

  const beginDrag = useCallback((target, event) => {
    if (!DEV_LAYOUT_MODE) return;

    event.preventDefault();

    const touch = event.touches?.[0];
    const clientY = touch?.clientY ?? event.clientY ?? 0;

    setDragState({
      active: true,
      target,
      startY: clientY,
      startRightRailTop: toPercentNumber(layoutValues.rightRailTop, 44),
      startContentOverlayBottom: toPxNumber(layoutValues.contentOverlayBottom, 142),
      startSearchDockBottom: toPxNumber(layoutValues.searchDockBottom, 64),
      startBottomNavHeight: toPxNumber(layoutValues.bottomNavHeight, 50)
    });
  }, [layoutValues]);

  const updateDrag = useCallback((event) => {
    if (!DEV_LAYOUT_MODE) return;
    if (!dragState.active || !dragState.target) return;

    const touch = event.touches?.[0];
    const clientY = touch?.clientY ?? event.clientY ?? 0;
    const deltaY = clientY - (dragState.startY || 0);
    const viewportHeight = window.innerHeight || 844;

    if (dragState.target === "rightRail") {
      const deltaPercent = (deltaY / viewportHeight) * 100;
      const nextPercent = clamp(
        (dragState.startRightRailTop || 44) + deltaPercent,
        16,
        82
      );

      setLayoutValues((prev) => ({
        ...prev,
        rightRailTop: `${nextPercent.toFixed(2)}%`
      }));
    }

    if (dragState.target === "contentOverlay") {
      const nextBottom = clamp(
        (dragState.startContentOverlayBottom || 142) - deltaY,
        86,
        320
      );

      setLayoutValues((prev) => ({
        ...prev,
        contentOverlayBottom: Math.round(nextBottom)
      }));
    }

    if (dragState.target === "searchDock") {
      const nextBottom = clamp(
        (dragState.startSearchDockBottom || 64) - deltaY,
        8,
        220
      );

      setLayoutValues((prev) => ({
        ...prev,
        searchDockBottom: Math.round(nextBottom)
      }));
    }

    if (dragState.target === "bottomNav") {
      const nextHeight = clamp(
        (dragState.startBottomNavHeight || 50) - deltaY,
        42,
        88
      );

      setLayoutValues((prev) => ({
        ...prev,
        bottomNavHeight: Math.round(nextHeight)
      }));
    }
  }, [dragState]);

  const endDrag = useCallback(() => {
    if (!DEV_LAYOUT_MODE) return;

    setDragState({
      active: false,
      target: null
    });
  }, []);

  useEffect(() => {
    if (!DEV_LAYOUT_MODE) return undefined;

    const onTouchMove = (event) => {
      updateDrag(event);
    };
    const onMouseMove = (event) => {
      updateDrag(event);
    };
    const onTouchEnd = () => {
      endDrag();
    };
    const onMouseUp = () => {
      endDrag();
    };

    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchcancel", onTouchEnd);

    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [endDrag, updateDrag]);

  const adjustScale = useCallback((key, delta, min, max) => {
    setLayoutValues((prev) => ({
      ...prev,
      [key]: Number(clamp(safeScale(prev[key], 1) + delta, min, max).toFixed(2))
    }));
  }, []);

  const adjustNumber = useCallback((key, delta, min, max) => {
    setLayoutValues((prev) => ({
      ...prev,
      [key]: Math.round(clamp(toPxNumber(prev[key], 0) + delta, min, max))
    }));
  }, []);

  const adjustPercentNumber = useCallback((key, delta, min, max) => {
    setLayoutValues((prev) => ({
      ...prev,
      [key]: Math.round(clamp(Number(prev[key]) + delta, min, max))
    }));
  }, []);

  const toggleLike = useCallback((itemId) => {
    setLikedMap((prev) => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  }, []);

  const displayLikes = useMemo(() => {
    return activeItem ? activeItem.likes + (isActiveLiked ? 1 : 0) : 0;
  }, [activeItem, isActiveLiked]);

  const uiCodeBlock = useMemo(() => {
  return [
    "const layoutTweaks = {",
    `  rightRailTop: "${layoutValues.rightRailTop}",`,
    `  rightRailGap: ${layoutValues.rightRailGap},`,
    `  contentOverlayBottom: ${layoutValues.contentOverlayBottom},`,
    `  searchDockBottom: ${layoutValues.searchDockBottom},`,
    `  bottomNavHeight: ${layoutValues.bottomNavHeight},`,
    `  rightRailScale: ${layoutValues.rightRailScale},`,
    `  contentOverlayScale: ${layoutValues.contentOverlayScale},`,
    `  bottomNavScale: ${layoutValues.bottomNavScale},`,
    `  searchDockWidth: ${layoutValues.searchDockWidth}`,
    "};"
  ].join("\n");
}, [layoutValues]);

  const shellStyles = useMemo(() => ({
    position: "relative",
    width: "100%",
    height: "100dvh",
    overflow: "hidden",
    background: "#000000",
    color: "#ffffff",
    fontFamily: FEED_FONT_STACK
  }), []);

  const topBarStyles = useMemo(() => ({
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    padding: "12px 14px 8px",
    pointerEvents: "none",
    background:
      "linear-gradient(to bottom, rgba(0,0,0,0.40), rgba(0,0,0,0.08), rgba(0,0,0,0))"
  }), []);

  const feedScrollStyles = useMemo(() => ({
    position: "relative",
    height: "100dvh",
    overflowY: "auto",
    scrollSnapType: "y mandatory",
    scrollSnapStop: "always",
    overscrollBehaviorY: "contain",
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "none",
    msOverflowStyle: "none"
  }), []);

  const contentOverlayStyles = useMemo(() => ({
  position: "fixed",
  left: 12,
  right: 92,
  bottom: layoutValues.contentOverlayBottom,
  zIndex: 35,
  pointerEvents: DEV_LAYOUT_MODE ? "auto" : "none",
  transform: `scale(${layoutValues.contentOverlayScale})`,
  transformOrigin: "bottom left"
}), [layoutValues.contentOverlayBottom, layoutValues.contentOverlayScale]);

  const searchDockStyles = useMemo(() => ({
    position: "fixed",
    left: 12,
    width: `calc((100vw - 24px) * ${layoutValues.searchDockWidth / 100})`,
    maxWidth: "calc(100vw - 24px)",
    bottom: layoutValues.searchDockBottom,
    zIndex: 36,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "11px 14px",
    borderRadius: 18,
    background: "rgba(13,13,16,0.66)",
    border: "1px solid rgba(255,255,255,0.10)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
    pointerEvents: DEV_LAYOUT_MODE ? "auto" : "none",
    cursor: DEV_LAYOUT_MODE ? "grab" : "default"
  }), [layoutValues.searchDockBottom, layoutValues.searchDockWidth]);

  const rightRailStyles = useMemo(() => ({
    position: "fixed",
    right: 8,
    top: layoutValues.rightRailTop,
    transform: "translateY(-50%)",
    transformOrigin: "top right",
    zIndex: 37,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: layoutValues.rightRailGap
  }), [layoutValues.rightRailGap, layoutValues.rightRailScale, layoutValues.rightRailTop]);

  const bottomNavStyles = useMemo(() => ({
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 38,
    height: layoutValues.bottomNavHeight,
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    alignItems: "center",
    padding: "0 12px env(safe-area-inset-right) env(safe-area-inset-bottom)",
    background: "rgba(7,7,9,0.92)",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    transform: `scale(${layoutValues.bottomNavScale})`,
    transformOrigin: "bottom center"
  }), [layoutValues.bottomNavHeight, layoutValues.bottomNavScale]);

  const bottomNavLabelSize = 10 * layoutValues.bottomNavScale;

  return (
    <div style={shellStyles}>
      <div style={topBarStyles}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start"
          }}
        >
          <img
            src={IBAND_LOGO_SRC}
            alt="iBand"
            style={{
              width: 38,
              height: 38,
              objectFit: "contain",
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.45))"
            }}
          />
        </div>
      </div>

      <div ref={feedRef} onScroll={handleScroll} style={feedScrollStyles}>
        {items.map((item, index) => {
          const isActive = index === activeIndex;

          return (
            <section
              key={item.id}
              style={{
                position: "relative",
                height: "100dvh",
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
                overflow: "hidden",
                background: "#000"
              }}
            >
              <img
                src={item.artwork}
                alt={item.title}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  transform: isActive ? "scale(1.02)" : "scale(1)",
                  transition: "transform 280ms ease"
                }}
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.66) 0%, rgba(0,0,0,0.22) 30%, rgba(0,0,0,0.10) 55%, rgba(0,0,0,0.32) 100%)"
                }}
              />
            </section>
          );
        })}
      </div>

     <div
  style={contentOverlayStyles}
  onTouchStart={(event) => beginDrag("contentOverlay", event)}
  onMouseDown={(event) => beginDrag("contentOverlay", event)}
>
        <div
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    padding: "5px 9px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.32)",
    border: "1px solid rgba(255,255,255,0.12)",
    pointerEvents: "auto",
    cursor: DEV_LAYOUT_MODE ? "grab" : "default"
  }}
>
  <span
    style={{
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: "0.08em",
      color: "#ffffff"
    }}
  >
    {activeItem.badge}
  </span>
  {DEV_LAYOUT_MODE && (
    <span
      style={{
        fontSize: 10,
        color: "#fbbf24",
        fontWeight: 700
      }}
    >
      DRAG OVERLAY
    </span>
  )}
</div>

        <div
          style={{
            maxWidth: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 6
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10
            }}
          >
            <img
              src={activeItem.avatar}
              alt={activeItem.artist}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                objectFit: "cover",
                border: "1.5px solid rgba(255,255,255,0.78)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.24)"
              }}
            />

            <div
              style={{
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: 2
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  color: "#ffffff",
                  textShadow: "0 2px 10px rgba(0,0,0,0.38)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {activeItem.artist}
              </div>

              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.90)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {activeItem.handle}
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.15,
              color: "#ffffff",
              textShadow: "0 2px 10px rgba(0,0,0,0.36)"
            }}
          >
            {activeItem.title}
          </div>

          <div
            style={{
              fontSize: 12,
              lineHeight: 1.25,
              color: "rgba(255,255,255,0.90)"
            }}
          >
            {activeItem.subtitle}
          </div>

          <div
  style={{
    display: "inline-flex",
    alignItems: "center",
    maxWidth: "100%",
    width: "fit-content",
    padding: "6px 10px",
    borderRadius: 12,
    background: "rgba(0,0,0,0.30)",
    border: "1px solid rgba(255,255,255,0.10)"
  }}
>
  <div
    style={{
      fontSize: 10.5,
      lineHeight: 1.22,
      color: "#ffffff",
      whiteSpace: "normal",
      wordBreak: "break-word",
      maxWidth: 320
    }}
  >
    <span style={{ fontWeight: 800 }}>WHY YOU ARE SEEING THIS</span>
    <span style={{ opacity: 0.88 }}> · </span>
    <span style={{ fontWeight: 600 }}>{activeItem.reason}</span>
  </div>
</div>
        </div>
      </div>

      <div
        style={searchDockStyles}
        aria-label="Search artists songs genres"
        onTouchStart={(event) => beginDrag("searchDock", event)}
        onMouseDown={(event) => beginDrag("searchDock", event)}
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="rgba(255,255,255,0.82)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>

        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "rgba(255,255,255,0.84)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flex: 1
          }}
        >
          Search artists, songs, genres
        </div>

        {DEV_LAYOUT_MODE && (
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "#fbbf24",
              letterSpacing: "0.05em",
              flexShrink: 0
            }}
          >
            DRAG
          </div>
        )}
      </div>

      <div
        style={rightRailStyles}
        onTouchStart={(event) => beginDrag("rightRail", event)}
        onMouseDown={(event) => beginDrag("rightRail", event)}
      >
        {DEV_LAYOUT_MODE && (
          <div
            style={{
              padding: "5px 8px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.38)",
              border: "1px solid rgba(255,255,255,0.12)",
              fontSize: 10,
              fontWeight: 800,
              color: "#fbbf24",
              letterSpacing: "0.06em",
              cursor: "grab"
            }}
          >
            DRAG RAIL
          </div>
        )}

        <div
          style={{
            width: 46 * layoutValues.rightRailAvatarScale,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6
          }}
        >
          <div
  style={{
    position: "relative",
    width: 38 * layoutValues.rightRailAvatarScale,
height: 38 * layoutValues.rightRailAvatarScale
  }}
>
            <img
              src={activeItem.avatar}
              alt={activeItem.artist}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
                border: "1.5px solid rgba(255,255,255,0.82)",
                boxShadow: "0 10px 24px rgba(0,0,0,0.28)"
              }}
            />
            <div
  style={{
    position: "absolute",
    left: "50%",
    bottom: -2.5 * layoutValues.rightRailAvatarScale,
transform: "translateX(-50%)",
width: 14 * layoutValues.rightRailAvatarScale,
height: 14 * layoutValues.rightRailAvatarScale,
    borderRadius: "50%",
    background: "#ff2d55",
    border: "1.25px solid #000",
    display: "grid",
    placeItems: "center",
    fontSize: 8.5 * Math.min(layoutValues.rightRailAvatarScale, 1.05),
    fontWeight: 800,
    lineHeight: 1,
    color: "#fff",
    boxShadow: "0 2px 6px rgba(0,0,0,0.22)"
  }}
>
  +
</div>
          </div>
        </div>

        <RightRailAction
          value={displayLikes}
          label="Like"
          scale={layoutValues.rightRailIconScale}
          onPress={() => toggleLike(activeItem.id)}
        >
          <HeartIcon active={isActiveLiked} />
        </RightRailAction>

        <RightRailAction
          value={activeItem.comments}
          label="Comment"
          scale={layoutValues.rightRailIconScale}
          onPress={() => {}}
        >
          <CommentIcon />
        </RightRailAction>

        <RightRailAction
          value={activeItem.saves}
          label="Save"
          scale={layoutValues.rightRailIconScale}
          onPress={() => {}}
        >
          <SaveIcon />
        </RightRailAction>

        <RightRailAction
          value={activeItem.shares}
          label="Share"
          scale={layoutValues.rightRailIconScale}
          onPress={() => {}}
        >
          <ShareIcon />
        </RightRailAction>

        <MusicDiscIcon
  artwork={activeItem.artwork}
  scale={layoutValues.rightRailDiscScale}
/>
      </div>

      <div
        style={bottomNavStyles}
        onTouchStart={(event) => beginDrag("bottomNav", event)}
        onMouseDown={(event) => beginDrag("bottomNav", event)}
      >
        {[
          {
            label: "Home",
            active: true,
            badge: null,
            icon: <NavHomeIcon scale={layoutValues.bottomNavScale} />
          },
          {
            label: "Shop",
            active: false,
            badge: null,
            icon: <NavShopIcon scale={layoutValues.bottomNavScale} />
          },
          {
            label: "Upload",
            active: false,
            badge: null,
            icon: <NavUploadIcon scale={layoutValues.bottomNavScale} />
          },
          {
            label: "Inbox",
            active: false,
            badge: 2,
            icon: <NavInboxIcon scale={layoutValues.bottomNavScale} />
          },
          {
            label: "Profile",
            active: false,
            badge: null,
            icon: <NavProfileIcon scale={layoutValues.bottomNavScale} />
          }
        ].map((item) => (
          <div
            key={item.label}
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              color: item.active ? "#ffffff" : "rgba(255,255,255,0.74)"
            }}
          >
            <div
              style={{
                position: "relative",
                width: 24 * layoutValues.bottomNavScale,
                height: 24 * layoutValues.bottomNavScale,
                display: "grid",
                placeItems: "center"
              }}
            >
              {item.icon}

              {typeof item.badge === "number" && (
                <div
                  style={{
                    position: "absolute",
                    top: -7 * layoutValues.bottomNavScale,
                    right: -10 * layoutValues.bottomNavScale,
                    minWidth: 14 * layoutValues.bottomNavScale,
                    height: 14 * layoutValues.bottomNavScale,
                    padding: `0 ${4 * layoutValues.bottomNavScale}px`,
                    borderRadius: 999,
                    background: "#ff2d55",
                    color: "#ffffff",
                    fontSize: 8.5 * Math.min(layoutValues.bottomNavScale, 1.3),
                    fontWeight: 800,
                    lineHeight: `${14 * layoutValues.bottomNavScale}px`,
                    textAlign: "center",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.32)"
                  }}
                >
                  {item.badge}
                </div>
              )}
            </div>

            <div
              style={{
                fontSize: bottomNavLabelSize,
                lineHeight: 1,
                fontWeight: item.active ? 700 : 500
              }}
            >
              {item.label}
            </div>
          </div>
        ))}

        {DEV_LAYOUT_MODE && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: -30,
              transform: "translateX(-50%)",
              padding: "5px 9px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.78)",
              border: "1px solid rgba(255,255,255,0.14)",
              color: "#fbbf24",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.06em",
              cursor: "grab",
              pointerEvents: "auto"
            }}
          >
            DRAG NAV
          </div>
        )}
      </div>

      {DEV_LAYOUT_MODE && (
        <>
          <div
            style={{
              position: "fixed",
              left: 10,
              top: 58,
              zIndex: 60,
              width: 208,
              padding: "10px 11px",
              borderRadius: 14,
              background: "rgba(9,9,12,0.76)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 14px 28px rgba(0,0,0,0.28)"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                marginBottom: 8
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#fbbf24",
                  letterSpacing: "0.08em"
                }}
              >
                LAYOUT CONTROL
              </div>

              <button
                type="button"
                onClick={() => setShowDevCode((prev) => !prev)}
                style={{
                  appearance: "none",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#ffffff",
                  borderRadius: 999,
                  height: 24,
                  padding: "0 10px",
                  fontSize: 9.6,
                  lineHeight: 1,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  cursor: "pointer"
                }}
              >
                {showDevCode ? "HIDE CODE" : "SHOW CODE"}
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: 12,
                color: "#ffffff",
                marginBottom: 10
              }}
            >
              <div>
                <span style={{ opacity: 0.72 }}>rightRailTop</span>
                <br />
                <span style={{ fontWeight: 700 }}>{layoutValues.rightRailTop}</span>
              </div>

              <div>
                <span style={{ opacity: 0.72 }}>rightRailGap</span>
                <br />
                <span style={{ fontWeight: 700 }}>{layoutValues.rightRailGap}px</span>
              </div>

              <div>
                <span style={{ opacity: 0.72 }}>contentOverlayBottom</span>
                <br />
                <span style={{ fontWeight: 700 }}>
                  {layoutValues.contentOverlayBottom}px
                </span>
              </div>

              <div>
                <span style={{ opacity: 0.72 }}>searchDockBottom</span>
                <br />
                <span style={{ fontWeight: 700 }}>
                  {layoutValues.searchDockBottom}px
                </span>
              </div>

              <div>
                <span style={{ opacity: 0.72 }}>bottomNavHeight</span>
                <br />
                <span style={{ fontWeight: 700 }}>
                  {layoutValues.bottomNavHeight}px
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
             <Stepper
  label="Icon size"
  valueText={`${layoutValues.rightRailIconScale.toFixed(2)}x`}
  onMinus={() => adjustScale("rightRailIconScale", -0.05, 0.8, 1.6)}
  onPlus={() => adjustScale("rightRailIconScale", 0.05, 0.8, 1.6)}
/>

<Stepper
  label="Avatar size"
  valueText={`${layoutValues.rightRailAvatarScale.toFixed(2)}x`}
  onMinus={() => adjustScale("rightRailAvatarScale", -0.05, 0.7, 1.3)}
  onPlus={() => adjustScale("rightRailAvatarScale", 0.05, 0.7, 1.3)}
/>

<Stepper
  label="Disc size"
  valueText={`${layoutValues.rightRailDiscScale.toFixed(2)}x`}
  onMinus={() => adjustScale("rightRailDiscScale", -0.05, 0.7, 1.3)}
  onPlus={() => adjustScale("rightRailDiscScale", 0.05, 0.7, 1.3)}
/>

              <Stepper
                label="Right rail gap"
                valueText={`${layoutValues.rightRailGap}px`}
                onMinus={() => adjustNumber("rightRailGap", -1, 2, 34)}
onPlus={() => adjustNumber("rightRailGap", 1, 2, 34)}
              />

              <Stepper
                label="Overlay size"
                valueText={`${layoutValues.contentOverlayScale.toFixed(2)}x`}
                onMinus={() => adjustScale("contentOverlayScale", -0.05, 0.7, 1.4)}
                onPlus={() => adjustScale("contentOverlayScale", 0.05, 0.7, 1.4)}
              />

              <Stepper
                label="Search width"
                valueText={`${layoutValues.searchDockWidth}%`}
                onMinus={() => adjustPercentNumber("searchDockWidth", -5, 60, 100)}
                onPlus={() => adjustPercentNumber("searchDockWidth", 5, 60, 100)}
              />

              <Stepper
                label="Nav size"
                valueText={`${layoutValues.bottomNavScale.toFixed(2)}x`}
                onMinus={() => adjustScale("bottomNavScale", -0.05, 0.8, 1.4)}
                onPlus={() => adjustScale("bottomNavScale", 0.05, 0.8, 1.4)}
              />
            </div>
          </div>

          {showDevCode && (
            <div
              style={{
                position: "fixed",
                left: 10,
                right: 10,
                top: 382,
                zIndex: 60,
                padding: "10px 11px",
                borderRadius: 14,
                background: "rgba(9,9,12,0.76)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                boxShadow: "0 14px 28px rgba(0,0,0,0.28)",
                maxHeight: "28vh",
                overflow: "auto"
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#fbbf24",
                  letterSpacing: "0.08em",
                  marginBottom: 8
                }}
              >
                READY-TO-PASTE VALUES
              </div>

              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: 12,
                  lineHeight: 1.45,
                  color: "#ffffff",
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                }}
              >
                {uiCodeBlock}
              </pre>
            </div>
          )}
        </>
      )}

      {isLoading && (
        <div
          style={{
            position: "fixed",
            right: 12,
            top: 14,
            zIndex: 50,
            padding: "6px 10px",
            borderRadius: 999,
            background: "rgba(0,0,0,0.34)",
            border: "1px solid rgba(255,255,255,0.12)",
            fontSize: 11,
            fontWeight: 700,
            color: "#ffffff"
          }}
        >
          Loading feed...
        </div>
      )}

      <style>{`
        * {
          box-sizing: border-box;
        }

        html, body, #root {
          margin: 0;
          width: 100%;
          height: 100%;
          background: #000;
        }

        body {
          overflow: hidden;
        }

        div::-webkit-scrollbar {
          display: none;
        }

        button {
          font: inherit;
        }
      `}</style>
    </div>
  );
}
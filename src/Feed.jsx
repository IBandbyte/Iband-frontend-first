import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchSmartFeed,
  fetchPersonalisedFeed,
  fetchPredictiveFeed
} from "./services/api";

const IBAND_LOGO_SRC = "/iband-logo.png";

const FEED_MODES = [
  {
    key: "smart",
    label: "Smart",
    description: "Discovery picks powered by iBand signals."
  },
  {
    key: "personalised",
    label: "Personalised",
    description: "Recommendations tuned to the listener."
  },
  {
    key: "predictive",
    label: "Predictive",
    description: "Early movers with breakout potential."
  }
];

function safeString(value, fallback = "") {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getInitials(name) {
  return safeString(name, "Artist")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "IB";
}

function createArtistAvatarDataUri(name, index = 0) {
  const initials = getInitials(name);

  const gradients = [
    ["#7c3aed", "#ea580c"],
    ["#ec4899", "#2563eb"],
    ["#059669", "#eab308"],
    ["#dc2626", "#7c3aed"],
    ["#0ea5e9", "#4f46e5"],
    ["#f97316", "#9333ea"]
  ];

  const [start, end] = gradients[index % gradients.length];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="240" height="240" rx="48" fill="url(#grad)" />
      <circle cx="120" cy="88" r="38" fill="rgba(255,255,255,0.16)" />
      <rect x="56" y="136" width="128" height="38" rx="19" fill="rgba(255,255,255,0.16)" />
      <text
        x="50%"
        y="56%"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="54"
        font-weight="700"
        fill="#ffffff"
      >
        ${initials}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildProfileHandle(artistName, fallbackId) {
  const value = safeString(artistName, fallbackId || "artist")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20);

  return `@${value || "artist"}`;
}

function extractFeedItems(raw) {
  if (Array.isArray(raw)) {
    return raw;
  }

  if (Array.isArray(raw?.feed)) {
    return raw.feed;
  }

  if (Array.isArray(raw?.items)) {
    return raw.items;
  }

  if (Array.isArray(raw?.data?.feed)) {
    return raw.data.feed;
  }

  if (Array.isArray(raw?.data?.items)) {
    return raw.data.items;
  }

  return [];
}

function normaliseFeedItem(item, index, mode) {
  const id =
    safeString(item?.id) ||
    safeString(item?._id) ||
    safeString(item?.artistId) ||
    `${mode}-${index + 1}`;

  const artist =
    safeString(item?.artist) ||
    safeString(item?.artistName) ||
    safeString(item?.name) ||
    "Unknown Artist";

  const title =
    safeString(item?.title) ||
    safeString(item?.trackTitle) ||
    safeString(item?.songTitle) ||
    safeString(item?.cardTitle) ||
    `${artist} Spotlight`;

  const subtitle =
    safeString(item?.subtitle) ||
    safeString(item?.cardSubtitle) ||
    safeString(item?.genre) ||
    safeString(item?.category) ||
    "Music discovery";

  const reason =
    safeString(item?.reason) ||
    safeString(item?.feedReason) ||
    safeString(item?.message) ||
    "Recommended by iBand.";

  const country =
    safeString(item?.country) ||
    safeString(item?.location) ||
    safeString(item?.region) ||
    "Unknown";

  const priority =
    safeString(item?.priority) ||
    safeString(item?.rankPriority) ||
    "medium";

  const badge =
    safeString(item?.badge) ||
    (mode === "smart"
      ? "SMART"
      : mode === "personalised"
        ? "PERSONALISED"
        : "PREDICTIVE");

  const icon =
    safeString(item?.icon) ||
    (mode === "smart" ? "🎵" : mode === "personalised" ? "✨" : "🚀");

  const votes = safeNumber(item?.votes, safeNumber(item?.voteCount, 0));
  const momentum = safeNumber(
    item?.momentum,
    safeNumber(item?.momentumScore, 0)
  );
  const plays = safeNumber(item?.plays, safeNumber(item?.streamCount, 0));
  const comments = safeNumber(
    item?.comments,
    safeNumber(item?.commentCount, 0)
  );

  const profileHandle =
    safeString(item?.profileHandle) || buildProfileHandle(artist, id);

  const imageUrl =
    safeString(item?.imageUrl) ||
    safeString(item?.avatarUrl) ||
    safeString(item?.coverImage) ||
    safeString(item?.artworkUrl) ||
    safeString(item?.image) ||
    createArtistAvatarDataUri(artist, index);

  return {
    id,
    source: mode,
    artist,
    title,
    subtitle,
    reason,
    country,
    priority,
    badge,
    icon,
    votes,
    momentum,
    plays,
    comments,
    profileHandle,
    imageUrl
  };
}

function normaliseFeedResponse(raw, mode) {
  return extractFeedItems(raw).map((item, index) =>
    normaliseFeedItem(item, index, mode)
  );
}

function formatMetric(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0";
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }

  return String(Math.round(value));
}

function getPriorityWeight(priority) {
  if (priority === "high") {
    return 3;
  }

  if (priority === "medium") {
    return 2;
  }

  if (priority === "low") {
    return 1;
  }

  return 0;
}

function FeedCard({ item, featured = false }) {
  return (
    <article className={`feed-card${featured ? " is-featured" : ""}`}>
      <div className="feed-card__media">
        <img
          src={item.imageUrl}
          alt={`${item.artist} artwork`}
          className="feed-card__image"
          loading="lazy"
        />
        <div className="feed-card__badge">{item.badge}</div>
      </div>

      <div className="feed-card__body">
        <div className="feed-card__topline">
          <span className="feed-card__icon" aria-hidden="true">
            {item.icon}
          </span>
          <span className="feed-card__handle">{item.profileHandle}</span>
          <span className="feed-card__country">{item.country}</span>
        </div>

        <h3 className="feed-card__title">{item.title}</h3>
        <p className="feed-card__artist">{item.artist}</p>
        <p className="feed-card__subtitle">{item.subtitle}</p>
        <p className="feed-card__reason">{item.reason}</p>

        <div className="feed-card__stats">
          <span>Votes {formatMetric(item.votes)}</span>
          <span>Momentum {formatMetric(item.momentum)}</span>
          <span>Plays {formatMetric(item.plays)}</span>
          <span>Comments {formatMetric(item.comments)}</span>
        </div>
      </div>
    </article>
  );
}

export default function Feed() {
  const [activeMode, setActiveMode] = useState("smart");
  const [smartFeed, setSmartFeed] = useState([]);
  const [personalisedFeed, setPersonalisedFeed] = useState([]);
  const [predictiveFeed, setPredictiveFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const mountedRef = useRef(true);

  const loadFeeds = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrorMessage("");

    try {
      const [smartResponse, personalisedResponse, predictiveResponse] =
        await Promise.all([
          fetchSmartFeed().catch(() => []),
          fetchPersonalisedFeed().catch(() => []),
          fetchPredictiveFeed().catch(() => [])
        ]);

      if (!mountedRef.current) {
        return;
      }

      setSmartFeed(normaliseFeedResponse(smartResponse, "smart"));
      setPersonalisedFeed(
        normaliseFeedResponse(personalisedResponse, "personalised")
      );
      setPredictiveFeed(normaliseFeedResponse(predictiveResponse, "predictive"));
    } catch (error) {
      console.error("Failed to load feed:", error);

      if (!mountedRef.current) {
        return;
      }

      setErrorMessage(
        "We could not load the feed right now. Please try again."
      );
      setSmartFeed([]);
      setPersonalisedFeed([]);
      setPredictiveFeed([]);
    } finally {
      if (!mountedRef.current) {
        return;
      }

      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadFeeds();

    return () => {
      mountedRef.current = false;
    };
  }, [loadFeeds]);

  const activeMeta = useMemo(() => {
    return FEED_MODES.find((mode) => mode.key === activeMode) || FEED_MODES[0];
  }, [activeMode]);

  const activeItems = useMemo(() => {
    const sourceItems =
      activeMode === "personalised"
        ? personalisedFeed
        : activeMode === "predictive"
          ? predictiveFeed
          : smartFeed;

    return [...sourceItems].sort((a, b) => {
      const priorityDiff =
        getPriorityWeight(b.priority) - getPriorityWeight(a.priority);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      const momentumDiff = b.momentum - a.momentum;
      if (momentumDiff !== 0) {
        return momentumDiff;
      }

      const voteDiff = b.votes - a.votes;
      if (voteDiff !== 0) {
        return voteDiff;
      }

      return a.artist.localeCompare(b.artist);
    });
  }, [activeMode, personalisedFeed, predictiveFeed, smartFeed]);

  const totalItems = useMemo(() => {
    return (
      safeArray(smartFeed).length +
      safeArray(personalisedFeed).length +
      safeArray(predictiveFeed).length
    );
  }, [smartFeed, personalisedFeed, predictiveFeed]);

  return (
    <div className="feed-page">
      <style>{`
        .feed-page {
          min-height: 100vh;
          box-sizing: border-box;
          padding: 24px 16px 56px;
          color: #ffffff;
          background:
            radial-gradient(circle at top left, rgba(124, 58, 237, 0.22), transparent 30%),
            radial-gradient(circle at top right, rgba(249, 115, 22, 0.18), transparent 28%),
            linear-gradient(180deg, #09090f 0%, #11111a 45%, #171723 100%);
        }

        .feed-shell {
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
        }

        .feed-hero {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
          padding: 20px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(14px);
        }

        .feed-hero__left {
          flex: 1 1 520px;
          min-width: 280px;
        }

        .feed-hero__brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .feed-hero__logo {
          width: 56px;
          height: 56px;
          object-fit: contain;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.08);
          padding: 8px;
          box-sizing: border-box;
          flex-shrink: 0;
        }

        .feed-hero__eyebrow {
          margin: 0 0 4px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.72);
        }

        .feed-hero__title {
          margin: 0;
          font-size: clamp(28px, 4vw, 42px);
          line-height: 1.05;
        }

        .feed-hero__subtitle {
          margin: 10px 0 0;
          max-width: 720px;
          line-height: 1.55;
          color: rgba(255, 255, 255, 0.78);
        }

        .feed-hero__actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .feed-button {
          border: 0;
          cursor: pointer;
          border-radius: 999px;
          padding: 12px 18px;
          font-size: 14px;
          font-weight: 700;
          transition: transform 0.18s ease, opacity 0.18s ease;
        }

        .feed-button:hover {
          transform: translateY(-1px);
        }

        .feed-button:disabled {
          opacity: 0.7;
          cursor: default;
          transform: none;
        }

        .feed-button--primary {
          color: #ffffff;
          background: linear-gradient(135deg, #7c3aed 0%, #f97316 100%);
        }

        .feed-button--ghost {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }

        .feed-tabs {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .feed-tab {
          text-align: left;
          border-radius: 18px;
          padding: 16px;
          cursor: pointer;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        }

        .feed-tab:hover {
          transform: translateY(-1px);
        }

        .feed-tab.is-active {
          border-color: rgba(249, 115, 22, 0.6);
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.22), rgba(249, 115, 22, 0.18));
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);
        }

        .feed-tab__label {
          display: block;
          margin: 0 0 6px;
          font-size: 16px;
          font-weight: 800;
        }

        .feed-tab__description {
          margin: 0;
          font-size: 13px;
          line-height: 1.45;
          color: rgba(255, 255, 255, 0.74);
        }

        .feed-status {
          margin-bottom: 18px;
          padding: 14px 16px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.45;
        }

        .feed-status--error {
          color: #fecaca;
          background: rgba(239, 68, 68, 0.14);
          border: 1px solid rgba(239, 68, 68, 0.32);
        }

        .feed-status--muted {
          color: rgba(255, 255, 255, 0.76);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .feed-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }

        .feed-card {
          overflow: hidden;
          border-radius: 22px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22);
        }

        .feed-card.is-featured {
          border-color: rgba(124, 58, 237, 0.45);
        }

        .feed-card__media {
          position: relative;
          aspect-ratio: 1 / 1;
          background: rgba(255, 255, 255, 0.06);
        }

        .feed-card__image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .feed-card__badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 8px 10px;
          border-radius: 999px;
          background: rgba(9, 9, 15, 0.72);
          backdrop-filter: blur(10px);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .feed-card__body {
          padding: 16px;
        }

        .feed-card__topline {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.72);
        }

        .feed-card__title {
          margin: 0 0 6px;
          font-size: 20px;
          line-height: 1.2;
        }

        .feed-card__artist {
          margin: 0 0 6px;
          font-size: 15px;
          font-weight: 700;
          color: #f8fafc;
        }

        .feed-card__subtitle,
        .feed-card__reason {
          margin: 0 0 10px;
          font-size: 14px;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.76);
        }

        .feed-card__stats {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.72);
        }

        @media (max-width: 720px) {
          .feed-page {
            padding: 18px 12px 44px;
          }

          .feed-tabs {
            grid-template-columns: 1fr;
          }

          .feed-hero {
            padding: 18px;
          }

          .feed-card__title {
            font-size: 18px;
          }
        }
      `}</style>

      <div className="feed-shell">
        <section className="feed-hero">
          <div className="feed-hero__left">
            <div className="feed-hero__brand">
              <img
                src={IBAND_LOGO_SRC}
                alt="iBand logo"
                className="feed-hero__logo"
              />

              <div>
                <p className="feed-hero__eyebrow">iBand Discovery Feed</p>
                <h1 className="feed-hero__title">Discover what is moving now</h1>
              </div>
            </div>

            <p className="feed-hero__subtitle">
              A stable multi-feed experience for smart picks, personalised
              recommendations, and predictive breakout discovery.
            </p>
          </div>

          <div className="feed-hero__actions">
            <button
              type="button"
              className="feed-button feed-button--primary"
              onClick={() => loadFeeds({ silent: true })}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh Feed"}
            </button>

            <button
              type="button"
              className="feed-button feed-button--ghost"
            >
              Total Cards {totalItems}
            </button>
          </div>
        </section>

        <section className="feed-tabs" aria-label="Feed modes">
          {FEED_MODES.map((mode) => (
            <button
              key={mode.key}
              type="button"
              className={`feed-tab${activeMode === mode.key ? " is-active" : ""}`}
              onClick={() => setActiveMode(mode.key)}
            >
              <span className="feed-tab__label">{mode.label}</span>
              <p className="feed-tab__description">{mode.description}</p>
            </button>
          ))}
        </section>

        {errorMessage ? (
          <div className="feed-status feed-status--error">{errorMessage}</div>
        ) : null}

        {loading ? (
          <div className="feed-status feed-status--muted">
            Loading {activeMeta.label} feed...
          </div>
        ) : activeItems.length === 0 ? (
          <div className="feed-status feed-status--muted">
            No items available in the {activeMeta.label.toLowerCase()} feed yet.
          </div>
        ) : (
          <section
            className="feed-grid"
            aria-label={`${activeMeta.label} feed items`}
          >
            {activeItems.map((item, index) => (
              <FeedCard
                key={item.id}
                item={item}
                featured={index === 0}
              />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
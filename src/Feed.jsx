import { useEffect, useMemo, useState } from "react";
import {
  fetchSmartFeed,
  fetchPersonalisedFeed,
  fetchPredictiveFeed
} from "./services/api";

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
    badge: "SMART"
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
    badge: "FOR YOU"
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
    badge: "PREDICTED"
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

function getBadgeStyle(badge) {
  if (badge === "SMART") {
    return {
      background: "rgba(168, 85, 247, 0.22)",
      border: "1px solid rgba(168, 85, 247, 0.45)"
    };
  }

  if (badge === "FOR YOU") {
    return {
      background: "rgba(249, 115, 22, 0.22)",
      border: "1px solid rgba(249, 115, 22, 0.45)"
    };
  }

  return {
    background: "rgba(59, 130, 246, 0.22)",
    border: "1px solid rgba(59, 130, 246, 0.45)"
  };
}

export default function Feed() {
  const [smartFeed, setSmartFeed] = useState([]);
  const [personalisedFeed, setPersonalisedFeed] = useState([]);
  const [predictiveFeed, setPredictiveFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    };
  }, []);

  const feedItems = useMemo(() => {
    const merged = [...personalisedFeed, ...smartFeed, ...predictiveFeed];

    return merged
      .sort((a, b) => priorityScore(b.priority) - priorityScore(a.priority))
      .map((item, index) => ({
        ...item,
        orderLabel: index + 1
      }));
  }, [personalisedFeed, smartFeed, predictiveFeed]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.brand}>iBandbyte</div>
          <div style={styles.subBrand}>Powered by Fans • Feed MVP</div>
        </div>
        <div style={styles.headerPill}>LIVE</div>
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
        <div style={styles.feedWrapper}>
          {feedItems.map((item) => (
            <section key={item.id} style={styles.card}>
              <div style={styles.cardTopRow}>
                <div style={styles.iconWrap}>{item.icon}</div>

                <div style={styles.cardMeta}>
                  <div style={styles.artist}>{item.artist}</div>
                  <div style={styles.country}>{item.country}</div>
                </div>

                <div style={{ ...styles.badge, ...getBadgeStyle(item.badge) }}>
                  {item.badge}
                </div>
              </div>

              <div style={styles.contentArea}>
                <div style={styles.videoMock}>
                  <div style={styles.videoOverlayTop}>
                    <span style={styles.videoOverlayOrder}>
                      #{item.orderLabel}
                    </span>
                  </div>

                  <div style={styles.videoOverlayBottom}>
                    <div style={styles.videoTitle}>{item.title}</div>
                    <div style={styles.videoSubtitle}>{item.subtitle}</div>
                  </div>
                </div>

                <div style={styles.sideActions}>
                  <button type="button" style={styles.actionButton}>
                    ❤️
                  </button>
                  <button type="button" style={styles.actionButton}>
                    🔥
                  </button>
                  <button type="button" style={styles.actionButton}>
                    ↗️
                  </button>
                </div>
              </div>

              <div style={styles.reasonBlock}>
                <div style={styles.reasonLabel}>Why you are seeing this</div>
                <div style={styles.reasonText}>{item.reason}</div>
              </div>

              <div style={styles.footerRow}>
                <span style={styles.footerSource}>{item.source}</span>
                <span style={styles.footerAction}>{item.action}</span>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #0b0b12 0%, #111827 45%, #0f172a 100%)",
    color: "#ffffff",
    padding: "16px",
    boxSizing: "border-box",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  brand: {
    fontSize: "24px",
    fontWeight: 800,
    letterSpacing: "-0.02em"
  },
  subBrand: {
    fontSize: "12px",
    opacity: 0.7,
    marginTop: "4px"
  },
  headerPill: {
    fontSize: "12px",
    fontWeight: 700,
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(249, 115, 22, 0.15)",
    border: "1px solid rgba(249, 115, 22, 0.4)"
  },
  centerState: {
    minHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    padding: "24px"
  },
  loaderTitle: {
    fontSize: "22px",
    fontWeight: 700,
    marginBottom: "10px"
  },
  loaderText: {
    fontSize: "14px",
    opacity: 0.75,
    maxWidth: "480px",
    lineHeight: 1.5
  },
  errorTitle: {
    fontSize: "22px",
    fontWeight: 700,
    marginBottom: "10px",
    color: "#fca5a5"
  },
  errorText: {
    fontSize: "14px",
    opacity: 0.85,
    maxWidth: "480px",
    lineHeight: 1.5
  },
  feedWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    paddingBottom: "36px"
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "14px",
    backdropFilter: "blur(12px)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.28)"
  },
  cardTopRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "14px"
  },
  iconWrap: {
    width: "44px",
    height: "44px",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    background: "rgba(255,255,255,0.08)"
  },
  cardMeta: {
    flex: 1,
    minWidth: 0
  },
  artist: {
    fontSize: "16px",
    fontWeight: 700,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  country: {
    fontSize: "12px",
    opacity: 0.7,
    marginTop: "2px"
  },
  badge: {
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.06em",
    padding: "8px 10px",
    borderRadius: "999px",
    whiteSpace: "nowrap"
  },
  contentArea: {
    display: "flex",
    gap: "12px",
    alignItems: "stretch"
  },
  videoMock: {
    position: "relative",
    flex: 1,
    minHeight: "420px",
    borderRadius: "22px",
    overflow: "hidden",
    background:
      "linear-gradient(160deg, rgba(168,85,247,0.50) 0%, rgba(249,115,22,0.42) 48%, rgba(15,23,42,1) 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },
  videoOverlayTop: {
    display: "flex",
    justifyContent: "flex-start",
    padding: "14px"
  },
  videoOverlayOrder: {
    fontSize: "12px",
    fontWeight: 800,
    padding: "8px 10px",
    borderRadius: "999px",
    background: "rgba(0,0,0,0.28)",
    border: "1px solid rgba(255,255,255,0.12)"
  },
  videoOverlayBottom: {
    padding: "16px"
  },
  videoTitle: {
    fontSize: "24px",
    fontWeight: 800,
    lineHeight: 1.1,
    marginBottom: "8px"
  },
  videoSubtitle: {
    fontSize: "14px",
    opacity: 0.88,
    lineHeight: 1.4
  },
  sideActions: {
    width: "56px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    justifyContent: "flex-end"
  },
  actionButton: {
    width: "56px",
    height: "56px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: "22px",
    cursor: "pointer"
  },
  reasonBlock: {
    marginTop: "14px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "16px",
    padding: "12px"
  },
  reasonLabel: {
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    opacity: 0.7,
    marginBottom: "6px",
    textTransform: "uppercase"
  },
  reasonText: {
    fontSize: "14px",
    lineHeight: 1.45,
    opacity: 0.92
  },
  footerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginTop: "12px",
    fontSize: "12px",
    opacity: 0.72
  },
  footerSource: {
    textTransform: "capitalize"
  },
  footerAction: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  }
};
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

function getMockBackground(index) {
  const backgrounds = [
    "linear-gradient(160deg, rgba(168,85,247,0.68) 0%, rgba(249,115,22,0.48) 52%, rgba(15,23,42,1) 100%)",
    "linear-gradient(160deg, rgba(236,72,153,0.55) 0%, rgba(59,130,246,0.40) 52%, rgba(2,6,23,1) 100%)",
    "linear-gradient(160deg, rgba(34,197,94,0.42) 0%, rgba(234,179,8,0.36) 52%, rgba(17,24,39,1) 100%)",
    "linear-gradient(160deg, rgba(239,68,68,0.48) 0%, rgba(168,85,247,0.35) 52%, rgba(15,23,42,1) 100%)"
  ];

  return backgrounds[index % backgrounds.length];
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
          {feedItems.map((item, index) => (
            <section key={item.id} style={styles.card}>
              <div
                style={{
                  ...styles.videoMock,
                  background: getMockBackground(index)
                }}
              >
                <div style={styles.videoOverlayTop}>
                  <span style={styles.videoOverlayOrder}>#{item.orderLabel}</span>
                  <div style={{ ...styles.badge, ...getBadgeStyle(item.badge) }}>
                    {item.badge}
                  </div>
                </div>

                <div style={styles.floatingActions}>
                  <button type="button" style={styles.actionButton} aria-label="Like">
                    ❤️
                  </button>
                  <button type="button" style={styles.actionButton} aria-label="Boost">
                    🔥
                  </button>
                  <button type="button" style={styles.actionButton} aria-label="Share">
                    ↗️
                  </button>
                </div>

                <div style={styles.videoBottomFade} />

                <div style={styles.videoOverlayBottom}>
                  <div style={styles.topMetaRow}>
                    <div style={styles.iconWrap}>{item.icon}</div>

                    <div style={styles.cardMeta}>
                      <div style={styles.artist}>{item.artist}</div>
                      <div style={styles.country}>{item.country}</div>
                    </div>
                  </div>

                  <div style={styles.videoTitle}>{item.title}</div>
                  <div style={styles.videoSubtitle}>{item.subtitle}</div>

                  <div style={styles.reasonBlock}>
                    <div style={styles.reasonLabel}>Why you are seeing this</div>
                    <div style={styles.reasonText}>{item.reason}</div>
                  </div>

                  <div style={styles.footerRow}>
                    <span style={styles.footerSource}>{item.source}</span>
                    <span style={styles.footerAction}>{item.action}</span>
                  </div>
                </div>
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
    padding: "8px 8px 24px",
    boxSizing: "border-box",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    padding: "8px 8px 0"
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
    gap: "14px",
    paddingBottom: "30px"
  },
  card: {
    width: "100%"
  },
  videoMock: {
    position: "relative",
    width: "100%",
    minHeight: "76vh",
    borderRadius: "26px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.35)"
  },
  videoOverlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
  badge: {
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.06em",
    padding: "8px 10px",
    borderRadius: "999px",
    whiteSpace: "nowrap",
    backdropFilter: "blur(10px)"
  },
  floatingActions: {
    position: "absolute",
    right: "12px",
    bottom: "150px",
    zIndex: 4,
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  actionButton: {
    width: "56px",
    height: "56px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.22)",
    backdropFilter: "blur(10px)",
    color: "#fff",
    fontSize: "22px",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(0,0,0,0.18)"
  },
  videoBottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "45%",
    background:
      "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.24) 35%, rgba(0,0,0,0.78) 100%)",
    zIndex: 1
  },
  videoOverlayBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
    padding: "16px 82px 18px 16px"
  },
  topMetaRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px"
  },
  iconWrap: {
    width: "44px",
    height: "44px",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.10)"
  },
  cardMeta: {
    flex: 1,
    minWidth: 0
  },
  artist: {
    fontSize: "18px",
    fontWeight: 800,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  country: {
    fontSize: "12px",
    opacity: 0.78,
    marginTop: "2px"
  },
  videoTitle: {
    fontSize: "28px",
    fontWeight: 800,
    lineHeight: 1.05,
    marginBottom: "8px",
    maxWidth: "92%"
  },
  videoSubtitle: {
    fontSize: "14px",
    opacity: 0.9,
    lineHeight: 1.45,
    maxWidth: "92%",
    marginBottom: "12px"
  },
  reasonBlock: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "12px",
    backdropFilter: "blur(8px)",
    marginBottom: "12px"
  },
  reasonLabel: {
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    opacity: 0.72,
    marginBottom: "6px",
    textTransform: "uppercase"
  },
  reasonText: {
    fontSize: "14px",
    lineHeight: 1.45,
    opacity: 0.95
  },
  footerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    fontSize: "12px",
    opacity: 0.78
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
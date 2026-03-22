// FULL FILE REPLACEMENT — Feed.jsx (Press & Hold Reactions Added)

import { useEffect, useMemo, useState } from "react";
import {
  fetchSmartFeed,
  fetchPersonalisedFeed,
  fetchPredictiveFeed
} from "./services/api";

// ---------------- NORMALISERS (UNCHANGED) ----------------
function normaliseSmartFeed(data) {
  const items = Array.isArray(data?.feed) ? data.feed : [];
  return items.map((item, index) => ({
    id: item.id || `smart-${index}`,
    artist: item.artist || "Unknown Artist",
    caption: item.feedReason || "Momentum building",
    badge: "SMART",
    profileHandle: `@${String(item.artist || "artist").toLowerCase().replace(/\s+/g, "")}`,
    soundLabel: item.artist || "Original Sound"
  }));
}

function normalisePersonalisedFeed(data) {
  const profiles = Array.isArray(data?.profiles) ? data.profiles : [];
  const firstProfile = profiles[0];
  const items = Array.isArray(firstProfile?.feed) ? firstProfile.feed : [];

  return items.map((item, index) => ({
    id: item.id || `personalised-${index}`,
    artist: item.artist || "Unknown Artist",
    caption: item.reason || "Matches your taste",
    badge: "FOR YOU",
    profileHandle: `@${String(item.artist || "artist").toLowerCase().replace(/\s+/g, "")}`,
    soundLabel: item.artist || "Personalised Track"
  }));
}

function normalisePredictiveFeed(data) {
  const items = Array.isArray(data?.predictions) ? data.predictions : [];

  return items.map((item, index) => ({
    id: item.id || `predictive-${index}`,
    artist: item.recommendedArtist || "Unknown Artist",
    caption: item.reason || "Predicted discovery",
    badge: "PREDICTED",
    profileHandle: `@${String(item.recommendedArtist || "artist").toLowerCase().replace(/\s+/g, "")}`,
    soundLabel: item.recommendedArtist || "Predicted Sound"
  }));
}

// ---------------- MAIN COMPONENT ----------------
export default function Feed() {
  const [feed, setFeed] = useState([]);
  const [reactionMenu, setReactionMenu] = useState(null);

  useEffect(() => {
    async function load() {
      const [smart, personalised, predictive] = await Promise.all([
        fetchSmartFeed(),
        fetchPersonalisedFeed(),
        fetchPredictiveFeed()
      ]);

      const merged = [
        ...normalisePersonalisedFeed(personalised),
        ...normaliseSmartFeed(smart),
        ...normalisePredictiveFeed(predictive)
      ];

      setFeed(merged);
    }

    load();
  }, []);

  // ---------------- PRESS & HOLD LOGIC ----------------
  let pressTimer;

  const handlePressStart = (id) => {
    pressTimer = setTimeout(() => {
      setReactionMenu(id);
    }, 400); // hold time
  };

  const handlePressEnd = () => {
    clearTimeout(pressTimer);
  };

  const handleReactionSelect = () => {
    setReactionMenu(null);
  };

  // ---------------- UI ----------------
  return (
    <div style={styles.page}>
      <div style={styles.snapScroller}>
        {feed.map((item, index) => (
          <section key={item.id} style={styles.feedSlide}>
            
            {/* RIGHT RAIL */}
            <div style={styles.rightRail}>

              {/* FOLLOW */}
              <button style={styles.profileStackButton}>
                <div style={styles.profileAvatarCircle}>🎸</div>
                <div style={styles.profilePlus}>+</div>
              </button>

              {/* SUPPORT (PRESS & HOLD) */}
              <div style={{ position: "relative" }}>
                <button
                  style={styles.railButton}
                  onMouseDown={() => handlePressStart(item.id)}
                  onMouseUp={handlePressEnd}
                  onTouchStart={() => handlePressStart(item.id)}
                  onTouchEnd={handlePressEnd}
                >
                  <span style={styles.railIcon}>🎧</span>
                  <span style={styles.railCount}>17K</span>
                </button>

                {reactionMenu === item.id && (
                  <div style={styles.reactionMenu}>
                    {["🔥", "💣", "💥", "🚀"].map((emoji) => (
                      <button
                        key={emoji}
                        style={styles.reactionButton}
                        onClick={handleReactionSelect}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* COMMENTS */}
              <button style={styles.railButton}>
                <span style={styles.railIcon}>💬</span>
                <span style={styles.railCount}>249</span>
              </button>

              {/* SAVE */}
              <button style={styles.railButton}>
                <span style={styles.railIcon}>⭐</span>
                <span style={styles.railCount}>1.2K</span>
              </button>

              {/* SHARE */}
              <button style={styles.railButton}>
                <span style={styles.railIcon}>🚀</span>
                <span style={styles.railCount}>2.3K</span>
              </button>

              {/* SOUND */}
              <button style={styles.soundButton}>
                <div style={styles.soundDiscInner}>🎵</div>
              </button>
            </div>

            {/* TEXT */}
            <div style={styles.bottomOverlay}>
              <div style={styles.artistName}>{item.artist}</div>
              <div style={styles.captionText}>{item.caption}</div>
            </div>

          </section>
        ))}
      </div>
    </div>
  );
}

// ---------------- STYLES ----------------
const styles = {
  page: {
    height: "100vh",
    background: "#000",
    color: "#fff"
  },
  snapScroller: {
    height: "100vh",
    overflowY: "scroll",
    scrollSnapType: "y mandatory"
  },
  feedSlide: {
    height: "100vh",
    scrollSnapAlign: "start",
    position: "relative"
  },
  rightRail: {
    position: "absolute",
    right: 10,
    bottom: 120,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    alignItems: "center"
  },
  railButton: {
    background: "transparent",
    border: "none",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer"
  },
  railIcon: { fontSize: 28 },
  railCount: { fontSize: 12 },
  profileStackButton: {
    background: "transparent",
    border: "none"
  },
  profileAvatarCircle: {
    width: 46,
    height: 46,
    borderRadius: "50%",
    background: "#333",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  profilePlus: {
    position: "absolute",
    bottom: -6,
    background: "#ff2f6f",
    borderRadius: "50%",
    padding: 4
  },
  soundButton: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "#fff"
  },
  soundDiscInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 20,
    left: 10
  },
  artistName: { fontWeight: "bold" },
  captionText: { fontSize: 14 },

  // 🔥 NEW
  reactionMenu: {
    position: "absolute",
    bottom: "60px",
    display: "flex",
    gap: "8px",
    background: "rgba(0,0,0,0.6)",
    padding: "6px 10px",
    borderRadius: "20px"
  },
  reactionButton: {
    fontSize: "18px",
    background: "transparent",
    border: "none",
    cursor: "pointer"
  }
};
import React from "react";

const IBAND_LOGO_SRC = "/iband-logo.png";

function svgDataUri(svg) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createBackdrop() {
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1600" viewBox="0 0 900 1600">
      <defs>
        <linearGradient id="bg" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stop-color="#0a1024"/>
          <stop offset="45%" stop-color="#151a31"/>
          <stop offset="100%" stop-color="#05070f"/>
        </linearGradient>
        <radialGradient id="mist" cx="50%" cy="25%" r="60%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
        </radialGradient>
      </defs>
      <rect width="900" height="1600" fill="url(#bg)"/>
      <circle cx="450" cy="300" r="420" fill="url(#mist)"/>
      <g opacity="0.22">
        <circle cx="120" cy="200" r="2" fill="white"/>
        <circle cx="220" cy="260" r="2" fill="white"/>
        <circle cx="320" cy="190" r="2" fill="white"/>
        <circle cx="420" cy="240" r="2" fill="white"/>
        <circle cx="520" cy="180" r="2" fill="white"/>
        <circle cx="620" cy="250" r="2" fill="white"/>
        <circle cx="720" cy="210" r="2" fill="white"/>
        <circle cx="780" cy="330" r="2" fill="white"/>
        <circle cx="660" cy="380" r="2" fill="white"/>
        <circle cx="540" cy="420" r="2" fill="white"/>
        <circle cx="380" cy="390" r="2" fill="white"/>
        <circle cx="280" cy="470" r="2" fill="white"/>
        <circle cx="170" cy="410" r="2" fill="white"/>
      </g>
      <g opacity="0.8">
        <path d="M85 255 C250 165, 620 145, 820 170" stroke="rgba(110,235,255,0.72)" stroke-width="7" fill="none"/>
        <path d="M115 195 C290 120, 640 105, 830 135" stroke="rgba(180,255,255,0.30)" stroke-width="3" fill="none"/>
      </g>
      <g opacity="0.38">
        <ellipse cx="455" cy="605" rx="280" ry="165" fill="rgba(255,255,255,0.14)"/>
        <ellipse cx="470" cy="665" rx="340" ry="225" fill="rgba(255,255,255,0.06)"/>
      </g>
      <g opacity="0.18">
        <rect x="70" y="1040" width="760" height="300" rx="28" fill="rgba(0,0,0,0.18)"/>
      </g>
    </svg>
  `);

}

function createAvatar() {
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#dfe8ef"/>
          <stop offset="100%" stop-color="#ffffff"/>
        </linearGradient>
      </defs>
      <circle cx="90" cy="90" r="88" fill="url(#g)"/>
      <circle cx="90" cy="88" r="74" fill="#d7dce2"/>
      <circle cx="90" cy="70" r="28" fill="#f0c7b1"/>
      <path d="M48 130c12-22 30-34 42-34s30 12 42 34" fill="#2b2f39"/>
      <path d="M58 62c8-22 22-34 42-34 20 0 35 14 40 32-9-6-19-8-29-8-20 0-37 6-53 10z" fill="#8b6d57"/>
    </svg>
  `);
}

function createDisc() {
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
      <defs>
        <radialGradient id="g" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stop-color="#fff6d8"/>
          <stop offset="0.18" stop-color="#ffb55d"/>
          <stop offset="0.40" stop-color="#ff784a"/>
          <stop offset="0.62" stop-color="#6748ff"/>
          <stop offset="0.82" stop-color="#1b2448"/>
          <stop offset="1" stop-color="#0a0f20"/>
        </radialGradient>
      </defs>
      <circle cx="90" cy="90" r="86" fill="url(#g)"/>
      <circle cx="90" cy="90" r="15" fill="#0b1020"/>
    </svg>
  `);
}

export default function Feed() {
  const backdrop = createBackdrop();
  const avatar = createAvatar();
  const disc = createDisc();

  return (
    <>
      <style>{`
        html, body, #root {
          margin: 0;
          height: 100%;
          background: #020308;
        }
        * { box-sizing: border-box; }
        @keyframes iband-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <main
        style={{
          minHeight: "100vh",
          width: "100%",
          background: "#020308",
          color: "#fff",
          fontFamily: "Arial, sans-serif",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("${backdrop}")`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.02) 32%, rgba(0,0,0,0.26) 70%, rgba(0,0,0,0.72) 100%)"
          }}
        />

        {/* Top-left branding */}
        <div
          style={{
            position: "absolute",
            top: 18,
            left: 18,
            zIndex: 20,
            display: "flex",
            alignItems: "flex-start",
            gap: 12
          }}
        >
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              overflow: "hidden",
              boxShadow: "0 10px 24px rgba(0,0,0,0.30)"
            }}
          >
            <img
              src={IBAND_LOGO_SRC}
              alt="iBand"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          <div style={{ paddingTop: 2 }}>
            <div
              style={{
                fontSize: 32,
                fontWeight: 500,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                textShadow: "0 4px 18px rgba(0,0,0,0.30)"
              }}
            >
              iBand
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 16,
                fontWeight: 400,
                lineHeight: 1.1,
                color: "rgba(255,255,255,0.94)",
                textShadow: "0 4px 16px rgba(0,0,0,0.28)"
              }}
            >
              Powered By Fans
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div
          style={{
            position: "absolute",
            right: 18,
            top: "52%",
            transform: "translateY(-36%)",
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            width: 78
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <img
              src={avatar}
              alt="Artist"
              style={{
                width: 82,
                height: 82,
                borderRadius: "50%",
                border: "3px solid rgba(255,255,255,0.94)",
                boxShadow: "0 12px 28px rgba(0,0,0,0.34)"
              }}
            />
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                lineHeight: 1,
                textShadow: "0 4px 18px rgba(0,0,0,0.40)"
              }}
            >
              Artist
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 52, lineHeight: 1 }}>♡</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>3.1K</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, lineHeight: 1 }}>💬</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>322</div>
          </div>

          <button
            type="button"
            aria-label="Info"
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.22)",
              background: "rgba(160,190,220,0.18)",
              color: "#ffffff",
              fontSize: 44,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 12px 28px rgba(0,0,0,0.34)"
            }}
          >
            i
          </button>

          <div
            style={{
              fontSize: 34,
              fontWeight: 700,
              lineHeight: 0.8,
              letterSpacing: "0.04em"
            }}
          >
            ...
          </div>

          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              padding: 4,
              background: "rgba(255,255,255,0.16)",
              boxShadow: "0 12px 28px rgba(0,0,0,0.34)"
            }}
          >
            <img
              src={disc}
              alt="Disc"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                border: "3px solid rgba(255,255,255,0.92)",
                animation: "iband-spin 8s linear infinite"
              }}
            />
          </div>
        </div>

        {/* Bottom-left info */}
        <div
          style={{
            position: "absolute",
            left: 22,
            right: 110,
            bottom: 176,
            zIndex: 18
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              lineHeight: 1.14,
              letterSpacing: "-0.02em",
              textShadow: "0 6px 24px rgba(0,0,0,0.42)"
            }}
          >
            Sam Ryder — <span style={{ fontWeight: 400 }}>“Supernova Dreams”</span>
          </div>

          <div
            style={{
              marginTop: 14,
              fontSize: 18,
              color: "rgba(255,255,255,0.94)",
              lineHeight: 1.25
            }}
          >
            High Momentum + Trending Worldwide
          </div>

          <div
            style={{
              marginTop: 18,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 17,
              color: "rgba(255,255,255,0.92)"
            }}
          >
            <span style={{ color: "#36a8ff", fontSize: 24 }}>♫</span>
            <span>iBand Exclusive — New Release</span>
          </div>

          <div
            style={{
              marginTop: 16,
              fontSize: 17,
              color: "rgba(255,255,255,0.82)"
            }}
          >
            322 Comments
          </div>
        </div>

        {/* Search dock */}
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 88,
            zIndex: 18
          }}
        >
          <div
            style={{
              minHeight: 62,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(18,24,38,0.42)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              boxShadow: "0 14px 30px rgba(0,0,0,0.28)",
              display: "flex",
              alignItems: "center",
              gap: 16,
              paddingLeft: 22,
              paddingRight: 22,
              color: "rgba(255,255,255,0.92)"
            }}
          >
            <span style={{ fontSize: 28, lineHeight: 1 }}>⌕</span>
            <span style={{ fontSize: 18, fontWeight: 400 }}>
              Search artists, songs, genres
            </span>
          </div>
        </div>

        {/* Bottom nav */}
        <div
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            bottom: 0,
            zIndex: 18,
            paddingBottom: 10
          }}
        >
          <div
            style={{
              borderTopLeftRadius: 26,
              borderTopRightRadius: 26,
              background: "rgba(6,8,14,0.82)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 -10px 30px rgba(0,0,0,0.26)",
              paddingTop: 14,
              paddingBottom: 10,
              paddingLeft: 14,
              paddingRight: 14
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                alignItems: "end",
                gap: 8,
                color: "#fff"
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 38, lineHeight: 1 }}>⌂</div>
                <div style={{ fontSize: 16 }}>Home</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 34, lineHeight: 1 }}>👜</div>
                <div style={{ fontSize: 16 }}>Shop</div>
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div
                  style={{
                    width: 84,
                    height: 54,
                    borderRadius: 18,
                    background:
                      "linear-gradient(90deg, #79d8ff 0 18%, #ffffff 18% 82%, #ff8daf 82% 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#000",
                    fontSize: 34,
                    fontWeight: 700
                  }}
                >
                  +
                </div>
              </div>
              <div style={{ textAlign: "center", position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    top: -6,
                    right: 18,
                    minWidth: 30,
                    height: 28,
                    paddingLeft: 8,
                    paddingRight: 8,
                    borderRadius: 999,
                    background: "#f55373",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: 700
                  }}
                >
                  2
                </div>
                <div style={{ fontSize: 34, lineHeight: 1 }}>💬</div>
                <div style={{ fontSize: 16 }}>Inbox</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 34, lineHeight: 1 }}>◡</div>
                <div style={{ fontSize: 16 }}>Profile</div>
              </div>
            </div>

            <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  width: 142,
                  height: 7,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.92)"
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

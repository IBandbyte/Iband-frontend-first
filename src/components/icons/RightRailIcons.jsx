import React from "react";

/*
Captain’s Protocol — iBand Right Rail Icon System (V2 Neon Foundation)

- Neon gradient stroke system
- Subtle glow
- Clean SVGs only
- Ready for future pulse + momentum colours
*/

const neonGlow = {
  filter:
    "drop-shadow(0 0 3px rgba(236,72,153,0.72)) drop-shadow(0 0 5px rgba(249,115,22,0.34))",
  overflow: "visible"
};

function IconWrapper({ children, size = 28, gradientId }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      style={neonGlow}
    >
      <defs>
        <linearGradient id={gradientId} x1="6" y1="6" x2="42" y2="42">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="45%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      {children}
    </svg>
  );
}

function neonStroke(gradientId, width = 3) {
  return {
    stroke: `url(#${gradientId})`,
    strokeWidth: width,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke"
  };
}

/* =========================
   LIKE — Guitar Heart Bubble
========================= */
export function LikeIcon({ size = 28 }) {
  const gradientId = "iband-like-gradient";

  return (
    <IconWrapper size={size} gradientId={gradientId}>
      <path
        {...neonStroke(gradientId, 3.2)}
        d="M24 39.5s-14.5-8.8-14.5-20.2c0-4.9 3.6-8.8 8.4-8.8 2.7 0 4.9 1.2 6.1 3.2 1.2-2 3.4-3.2 6.1-3.2 4.8 0 8.4 3.9 8.4 8.8C38.5 30.7 24 39.5 24 39.5z"
      />
      <path
        {...neonStroke(gradientId, 2.5)}
        d="M28.5 16.5c2.4 3.8 1.5 7.7-2.7 11.7"
      />
      <circle
        cx="28.7"
        cy="16.2"
        r="1.7"
        fill={`url(#${gradientId})`}
      />
    </IconWrapper>
  );
}

/* =========================
   COMMENT — Bubble + Lines + Music Note
========================= */
export function CommentIcon({ size = 28 }) {
  const gradientId = "iband-comment-gradient";

  return (
    <IconWrapper size={size} gradientId={gradientId}>
      <path
        {...neonStroke(gradientId, 3)}
        d="M9 11h30c1.7 0 3 1.3 3 3v17c0 1.7-1.3 3-3 3H20l-7 6v-6H9c-1.7 0-3-1.3-3-3V14c0-1.7 1.3-3 3-3z"
      />
      <path {...neonStroke(gradientId, 2.4)} d="M14 18h14" />
      <path {...neonStroke(gradientId, 2.4)} d="M14 24h11" />
      <path {...neonStroke(gradientId, 2.4)} d="M32 18v8.5" />
      <circle
        cx="29.8"
        cy="27.8"
        r="2.2"
        fill={`url(#${gradientId})`}
      />
    </IconWrapper>
  );
}

/* =========================
   SAVE — Bookmark Bubble
========================= */
export function SaveIcon({ size = 28 }) {
  const gradientId = "iband-save-gradient";

  return (
    <IconWrapper size={size} gradientId={gradientId}>
      <path
        {...neonStroke(gradientId, 3)}
        d="M12 8h24c1.2 0 2 0.8 2 2v29L24 31l-14 8V10c0-1.2 0.8-2 2-2z"
      />
      <path
        {...neonStroke(gradientId, 2.4)}
        d="M17 15h14"
      />
    </IconWrapper>
  );
}

/* =========================
   SHARE — Flow Arrow Bubble
========================= */
export function ShareIcon({ size = 28 }) {
  const gradientId = "iband-share-gradient";

  return (
    <IconWrapper size={size} gradientId={gradientId}>
      <path
        {...neonStroke(gradientId, 3)}
        d="M15 31c8.5-1.2 14.7-6 18.5-14"
      />
      <path
        {...neonStroke(gradientId, 3)}
        d="M28 14h8v8"
      />
      <path
        {...neonStroke(gradientId, 2.2)}
        d="M35 12l3-3"
      />
      <path
        {...neonStroke(gradientId, 2.2)}
        d="M39 16h4"
      />
    </IconWrapper>
  );
}

/* =========================
   BOOST — Headphones + Battery Core
========================= */
export function BoostIcon({ size = 28 }) {
  const gradientId = "iband-boost-gradient";

  return (
    <IconWrapper size={size} gradientId={gradientId}>
      <path
        {...neonStroke(gradientId, 3)}
        d="M12 26v-5.5C12 13.6 17.4 8 24 8s12 5.6 12 12.5V26"
      />
      <rect
        x="8.5"
        y="24"
        width="7"
        height="11"
        rx="2.5"
        {...neonStroke(gradientId, 2.7)}
      />
      <rect
        x="32.5"
        y="24"
        width="7"
        height="11"
        rx="2.5"
        {...neonStroke(gradientId, 2.7)}
      />
      <rect
        x="18"
        y="22.5"
        width="12"
        height="7"
        rx="2"
        {...neonStroke(gradientId, 2.5)}
      />
      <path {...neonStroke(gradientId, 2.2)} d="M21 25.8v1.6" />
      <path {...neonStroke(gradientId, 2.2)} d="M24 25.2v2.2" />
      <path {...neonStroke(gradientId, 2.2)} d="M27 24.7v2.7" />
    </IconWrapper>
  );
}

export const RightRailIcons = {
  Like: LikeIcon,
  Comment: CommentIcon,
  Save: SaveIcon,
  Share: ShareIcon,
  Boost: BoostIcon
};
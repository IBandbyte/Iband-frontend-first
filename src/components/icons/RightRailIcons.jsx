import React from "react";

/*
====================================
 iBand Neon Icon System — FINAL V1
====================================
- Clean SVG
- Crisp neon (not blurry)
- Mobile-first clarity
- Future-ready (pulse + momentum)
====================================
*/

const neonGlow = {
  filter: `
    drop-shadow(0 0 0.5px #ffffff)
    drop-shadow(0 0 2px rgba(236,72,153,0.9))
    drop-shadow(0 0 3px rgba(249,115,22,0.7))
  `,
  overflow: "visible"
};

function IconWrapper({ size = 28, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={neonGlow}
    >
      <defs>
        <linearGradient id="iband-gradient" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#ff2dfc" />
          <stop offset="100%" stopColor="#ff7a18" />
        </linearGradient>
      </defs>

      {children}
    </svg>
  );
}

function neonStroke(width = 2.3) {
  return {
    stroke: "url(#iband-gradient)",
    strokeWidth: width,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke"
  };
}

/*
====================================
 LIKE — Guitar Heart Energy
====================================
*/
export function LikeIcon({ size = 28 }) {
  return (
    <IconWrapper size={size}>
      <path
        {...neonStroke(2.4)}
        d="M24 39s-13-8-13-18c0-4 3-7 7-7 3 0 5 2 6 4 1-2 3-4 6-4 4 0 7 3 7 7 0 10-13 18-13 18z"
      />
    </IconWrapper>
  );
}

/*
====================================
 COMMENT — Bubble + Music Energy
====================================
*/
export function CommentIcon({ size = 28 }) {
  return (
    <IconWrapper size={size}>
      <path
        {...neonStroke(2.3)}
        d="M6 8h36a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H18l-8 6v-6H6a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z"
      />
      <path {...neonStroke(2.1)} d="M14 16h18" />
      <path {...neonStroke(2.1)} d="M14 22h14" />
    </IconWrapper>
  );
}

/*
====================================
 SAVE — Memory / Bookmark
====================================
*/
export function SaveIcon({ size = 28 }) {
  return (
    <IconWrapper size={size}>
      <path
        {...neonStroke(2.3)}
        d="M12 6h24a3 3 0 0 1 3 3v30l-15-8-15 8V9a3 3 0 0 1 3-3z"
      />
    </IconWrapper>
  );
}

/*
====================================
 SHARE — Energy Flow Arrow
====================================
*/
export function ShareIcon({ size = 28 }) {
  return (
    <IconWrapper size={size}>
      <path
        {...neonStroke(2.3)}
        d="M10 26l28-16-8 28-6-9-14-3z"
      />
    </IconWrapper>
  );
}

/*
====================================
 BOOST — Headphones + Power Core
====================================
*/
export function BoostIcon({ size = 28 }) {
  return (
    <IconWrapper size={size}>
      {/* Headphones */}
      <path
        {...neonStroke(2.3)}
        d="M10 26v6a4 4 0 0 0 4 4h4v-10h-8zM38 26v6a4 4 0 0 1-4 4h-4v-10h8z"
      />
      <path
        {...neonStroke(2.3)}
        d="M10 26a14 14 0 0 1 28 0"
      />

      {/* Power Core */}
      <rect
        x="18"
        y="20"
        width="12"
        height="6"
        rx="1.5"
        fill="url(#iband-gradient)"
      />
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
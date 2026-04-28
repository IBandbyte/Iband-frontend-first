import React from "react";

/*
====================================
 ICON WRAPPER
====================================
*/

function IconWrapper({ size = 28, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
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

/*
====================================
 NEON STROKE (FIXED)
====================================
*/

function neonStroke(width = 2.4) {
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
 LIKE ICON
====================================
*/

export function LikeIcon({ size = 28 }) {
  return (
    <IconWrapper size={size}>
      {/* Bubble */}
      <path
        {...neonStroke(2.4)}
        d="M6 6h36a6 6 0 0 1 6 6v16a6 6 0 0 1-6 6H18l-8 6v-6H6a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6z"
      />

      {/* Heart */}
      <path
        {...neonStroke(2.2)}
        d="M24 30s-6-4.35-9-7.5A5.5 5.5 0 0 1 24 16a5.5 5.5 0 0 1 9 6.5c-3 3.15-9 7.5-9 7.5z"
      />
    </IconWrapper>
  );
}

/*
====================================
 COMMENT ICON
====================================
*/

export function CommentIcon({ size = 28 }) {
  return (
    <IconWrapper size={size}>
      <path
        {...neonStroke(2.4)}
        d="M6 6h36a6 6 0 0 1 6 6v16a6 6 0 0 1-6 6H18l-8 6v-6H6a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6z"
      />

      <line {...neonStroke(2.2)} x1="14" y1="16" x2="34" y2="16" />
      <line {...neonStroke(2.2)} x1="14" y1="22" x2="30" y2="22" />
      <line {...neonStroke(2.2)} x1="14" y1="28" x2="26" y2="28" />
    </IconWrapper>
  );
}

/*
====================================
 SAVE ICON
====================================
*/

export function SaveIcon({ size = 28 }) {
  return (
    <IconWrapper size={size}>
      <path
        {...neonStroke(2.4)}
        d="M10 6h28a4 4 0 0 1 4 4v32l-18-10L6 42V10a4 4 0 0 1 4-4z"
      />
    </IconWrapper>
  );
}

/*
====================================
 SHARE ICON
====================================
*/

export function ShareIcon({ size = 28 }) {
  return (
    <IconWrapper size={size}>
      <path
        {...neonStroke(2.4)}
        d="M8 26l32-18-10 32-6-10-10-4z"
      />
    </IconWrapper>
  );
}

/*
====================================
 BOOST ICON
====================================
*/

export function BoostIcon({ size = 28 }) {
  return (
    <IconWrapper size={size}>
      {/* Headphones */}
      <path
        {...neonStroke(2.4)}
        d="M10 26v6a4 4 0 0 0 4 4h4v-10h-8zM38 26v6a4 4 0 0 1-4 4h-4v-10h8z"
      />

      <path
        {...neonStroke(2.4)}
        d="M10 26a14 14 0 0 1 28 0"
      />

      {/* Battery core */}
      <rect
        x="18"
        y="20"
        width="12"
        height="6"
        fill="url(#iband-gradient)"
        rx="1.5"
      />
    </IconWrapper>
  );
}
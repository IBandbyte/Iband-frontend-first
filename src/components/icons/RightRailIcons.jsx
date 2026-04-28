import React, { useId } from "react";

/*
====================================
 iBand Right Rail Icons
 Replica Pass 2 — Maximum Realism
====================================
Goal:
- Thin neon tube style
- White hot core
- Pink / violet / orange glow
- More intimate icon detail
- Includes InfoIcon
====================================
*/

function safeId(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "");
}

function IconWrapper({ size = 28, label = "iband-icon", children }) {
  const rawId = useId();
  const baseId = safeId(`${label}-${rawId}`);
  const gradientId = `${baseId}-gradient`;
  const glowId = `${baseId}-glow`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{
        overflow: "visible",
        display: "block"
      }}
    >
      <defs>
        <linearGradient id={gradientId} x1="5" y1="5" x2="43" y2="43">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="18%" stopColor="#ffffff" />
          <stop offset="42%" stopColor="#ff4df8" />
          <stop offset="70%" stopColor="#ff4aa2" />
          <stop offset="100%" stopColor="#ff9a1f" />
        </linearGradient>

        <filter
          id={glowId}
          x="-80%"
          y="-80%"
          width="260%"
          height="260%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="1.1" result="softGlow" />
          <feGaussianBlur stdDeviation="2.2" result="wideGlow" />
          <feMerge>
            <feMergeNode in="wideGlow" />
            <feMergeNode in="softGlow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter={`url(#${glowId})`}>
        {children({ gradientId })}
      </g>
    </svg>
  );
}

function outerStroke(gradientId, width = 1.8) {
  return {
    stroke: `url(#${gradientId})`,
    strokeWidth: width,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke"
  };
}

function coreStroke(width = 0.65) {
  return {
    stroke: "rgba(255,255,255,0.92)",
    strokeWidth: width,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke",
    opacity: 0.82
  };
}

function NeonLine({ gradientId, d, width = 1.8, core = true, opacity = 1 }) {
  return (
    <>
      <path {...outerStroke(gradientId, width)} d={d} opacity={opacity} />
      {core && <path {...coreStroke(0.55)} d={d} />}
    </>
  );
}

function NeonCircle({ gradientId, cx, cy, r, width = 1.8, core = true }) {
  return (
    <>
      <circle {...outerStroke(gradientId, width)} cx={cx} cy={cy} r={r} />
      {core && <circle {...coreStroke(0.55)} cx={cx} cy={cy} r={r} />}
    </>
  );
}

/*
====================================
 LIKE — Guitar Heart Bubble
====================================
*/
export function LikeIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-like">
      {({ gradientId }) => (
        <>
          <NeonLine
            gradientId={gradientId}
            width={1.75}
            d="M10.4 11.7h27.2c2.4 0 4.4 2 4.4 4.4v13.8c0 2.4-2 4.4-4.4 4.4H26.1l-8.8 6.2v-6.2h-6.9C8 34.3 6 32.3 6 29.9V16.1c0-2.4 2-4.4 4.4-4.4z"
          />

          <NeonLine
            gradientId={gradientId}
            width={1.85}
            d="M23.9 30.5s-7.2-4.8-9.5-8.7c-2.1-3.7 2-7.6 5.6-5.1 1.7 1.2 2.8 2.8 3.9 4.6 1.1-1.8 2.2-3.4 3.9-4.6 3.6-2.5 7.7 1.4 5.6 5.1-2.3 3.9-9.5 8.7-9.5 8.7z"
          />

          <NeonLine
            gradientId={gradientId}
            width={1.55}
            d="M27.4 18.1l7.2-6.1"
          />
          <NeonLine
            gradientId={gradientId}
            width={1.45}
            d="M31.1 15.1l5.5 14.2"
          />
          <NeonLine
            gradientId={gradientId}
            width={1.25}
            d="M35.1 12.2h3.7"
          />

          <circle cx="34.8" cy="9.8" r="0.95" fill={`url(#${gradientId})`} />
          <circle cx="37.7" cy="9.1" r="0.95" fill={`url(#${gradientId})`} />
          <circle cx="40.3" cy="10.4" r="0.95" fill={`url(#${gradientId})`} />
        </>
      )}
    </IconWrapper>
  );
}

/*
====================================
 COMMENT — Music Note Chat Bubble
====================================
*/
export function CommentIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-comment">
      {({ gradientId }) => (
        <>
          <NeonLine
            gradientId={gradientId}
            width={1.7}
            d="M8.8 10.2h30.4c2 0 3.6 1.6 3.6 3.6v15.8c0 2-1.6 3.6-3.6 3.6H19.7l-8.1 5.8v-5.8H8.8c-2 0-3.6-1.6-3.6-3.6V13.8c0-2 1.6-3.6 3.6-3.6z"
          />

          <NeonLine gradientId={gradientId} width={1.35} d="M13.9 17.4h14.6" />
          <NeonLine gradientId={gradientId} width={1.35} d="M13.9 22.8h11.3" />
          <NeonLine gradientId={gradientId} width={1.35} d="M13.9 28.1h8" />

          <NeonLine gradientId={gradientId} width={1.45} d="M32.3 16.8v10.4" />
          <NeonLine gradientId={gradientId} width={1.35} d="M32.3 16.8l5.2 1.9v3.2" />

          <circle cx="29.8" cy="28.1" r="1.95" fill={`url(#${gradientId})`} />
          <circle cx="35.1" cy="25.1" r="1.95" fill={`url(#${gradientId})`} />
        </>
      )}
    </IconWrapper>
  );
}

/*
====================================
 SAVE — Bookmark Bubble
====================================
*/
export function SaveIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-save">
      {({ gradientId }) => (
        <>
          <NeonLine
            gradientId={gradientId}
            width={1.7}
            d="M9.2 10.1h29.6c2 0 3.6 1.6 3.6 3.6v15.9c0 2-1.6 3.6-3.6 3.6H19.4l-8 5.7v-5.7H9.2c-2 0-3.6-1.6-3.6-3.6V13.7c0-2 1.6-3.6 3.6-3.6z"
          />

          <NeonLine
            gradientId={gradientId}
            width={1.75}
            d="M18.3 15.9h12.8c1 0 1.8.8 1.8 1.8v14.5l-8.3-4.7-8.1 4.7V17.7c0-1 .8-1.8 1.8-1.8z"
          />

          <NeonLine
            gradientId={gradientId}
            width={1.1}
            d="M20.7 18.9h9.7"
            opacity={0.72}
          />
        </>
      )}
    </IconWrapper>
  );
}

/*
====================================
 SHARE — Flow Arrow Bubble + Guitar Accent
====================================
*/
export function ShareIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-share">
      {({ gradientId }) => (
        <>
          <NeonLine
            gradientId={gradientId}
            width={1.7}
            d="M8.8 10.2h30.4c2 0 3.6 1.6 3.6 3.6v15.8c0 2-1.6 3.6-3.6 3.6H19.7l-8.1 5.8v-5.8H8.8c-2 0-3.6-1.6-3.6-3.6V13.8c0-2 1.6-3.6 3.6-3.6z"
          />

          <NeonLine
            gradientId={gradientId}
            width={1.85}
            d="M13.7 29.5c6.8-8.7 14-11.7 22.6-12.5"
          />
          <NeonLine
            gradientId={gradientId}
            width={1.85}
            d="M30.7 11.5l6.7 5.6-5.6 6.6"
          />

          <NeonLine gradientId={gradientId} width={1.15} d="M37.7 12.2h2.9" />
          <NeonLine gradientId={gradientId} width={1.15} d="M39.5 14.9h3.5" />
          <NeonLine gradientId={gradientId} width={1.15} d="M37.7 18.2l2.6 2.5" />

          <NeonLine
            gradientId={gradientId}
            width={1.15}
            d="M31.4 25.2l3.2 6.2"
            opacity={0.72}
          />
        </>
      )}
    </IconWrapper>
  );
}

/*
====================================
 BOOST — Headphones + Battery Core
====================================
*/
export function BoostIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-boost">
      {({ gradientId }) => (
        <>
          <NeonLine
            gradientId={gradientId}
            width={1.8}
            d="M12.2 27.4v-5.1C12.2 15.2 17.4 9 24 9s11.8 6.2 11.8 13.3v5.1"
          />

          <NeonLine
            gradientId={gradientId}
            width={1.75}
            d="M8.7 25.8c0-1.3 1-2.3 2.3-2.3h3.2c1.3 0 2.3 1 2.3 2.3v8c0 1.3-1 2.3-2.3 2.3H11c-1.3 0-2.3-1-2.3-2.3v-8z"
          />

          <NeonLine
            gradientId={gradientId}
            width={1.75}
            d="M31.5 25.8c0-1.3 1-2.3 2.3-2.3H37c1.3 0 2.3 1 2.3 2.3v8c0 1.3-1 2.3-2.3 2.3h-3.2c-1.3 0-2.3-1-2.3-2.3v-8z"
          />

          <rect
            x="18.1"
            y="23.2"
            width="11.8"
            height="7.2"
            rx="1.7"
            {...outerStroke(gradientId, 1.45)}
          />
          <path {...outerStroke(gradientId, 1.05)} d="M21.1 25.7v2.3" />
          <path {...outerStroke(gradientId, 1.05)} d="M23.9 25.3v2.7" />
          <path {...outerStroke(gradientId, 1.05)} d="M26.7 25.1v2.9" />
        </>
      )}
    </IconWrapper>
  );
}

/*
====================================
 INFO — Insight Icon
====================================
*/
export function InfoIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-info">
      {({ gradientId }) => (
        <>
          <NeonCircle gradientId={gradientId} cx="24" cy="24" r="16.6" width={1.75} />
          <NeonLine gradientId={gradientId} width={1.9} d="M24 22.3v9.5" />
          <circle cx="24" cy="16.7" r="1.65" fill={`url(#${gradientId})`} />
        </>
      )}
    </IconWrapper>
  );
}

export const RightRailIcons = {
  Like: LikeIcon,
  Comment: CommentIcon,
  Save: SaveIcon,
  Share: ShareIcon,
  Boost: BoostIcon,
  Info: InfoIcon
};
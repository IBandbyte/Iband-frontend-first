import React, { useId } from "react";

/*
====================================
 iBand Right Rail Icons
 LikeIcon Replica Integration Pass
====================================
- LikeIcon now uses the larger 512-style replica geometry
- Kept exports stable for Feed.jsx
- Other icons remain stable until their own precision passes
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
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ overflow: "visible", display: "block" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="40" y1="40" x2="470" y2="470">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="35%" stopColor="#ff2dfc" />
          <stop offset="65%" stopColor="#ff3b7a" />
          <stop offset="100%" stopColor="#ff9f1c" />
        </linearGradient>

        <filter
          id={glowId}
          x="-45%"
          y="-45%"
          width="190%"
          height="190%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="4.2" result="softGlow" />
          <feGaussianBlur stdDeviation="8.2" result="wideGlow" />
          <feMerge>
            <feMergeNode in="wideGlow" />
            <feMergeNode in="softGlow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter={`url(#${glowId})`}>{children({ gradientId })}</g>
    </svg>
  );
}

function neonStroke(gradientId, width = 14, opacity = 1) {
  return {
    stroke: `url(#${gradientId})`,
    strokeWidth: width,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke",
    opacity
  };
}

function coreStroke(width = 3.2, opacity = 0.74) {
  return {
    stroke: "rgba(255,255,255,0.84)",
    strokeWidth: width,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke",
    opacity
  };
}

function NeonPath({ gradientId, d, width = 14, opacity = 1, core = true }) {
  return (
    <>
      <path {...neonStroke(gradientId, width, opacity)} d={d} />
      {core && <path {...coreStroke()} d={d} />}
    </>
  );
}

function NeonCircle({ gradientId, cx, cy, r, width = 13, core = true }) {
  return (
    <>
      <circle {...neonStroke(gradientId, width)} cx={cx} cy={cy} r={r} />
      {core && <circle {...coreStroke()} cx={cx} cy={cy} r={r} />}
    </>
  );
}

/*
====================================
 LIKE — Replica Geometry Pass
====================================
*/
export function LikeIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-like">
      {({ gradientId }) => (
        <>
          <NeonPath
            gradientId={gradientId}
            width={13.5}
            d="M400 58H190C95 58 43 117 43 205v113c0 44 27 76 64 87l-8 82 98-72h178c69 0 106-41 106-104V145c0-52-29-87-81-87z"
          />

          <NeonPath
            gradientId={gradientId}
            width={13.5}
            d="M147 271C91 167 191 107 252 191C310 107 413 166 356 271C330 318 289 355 252 386C215 355 173 318 147 271z"
          />

          <NeonPath
            gradientId={gradientId}
            width={9.5}
            opacity={0.82}
            d="M166 183C181 154 210 144 237 158"
          />

          <NeonPath
            gradientId={gradientId}
            width={12.5}
            d="M291 259L406 82"
          />

          <NeonPath
            gradientId={gradientId}
            width={11.2}
            d="M390 86C410 61 449 76 441 105C434 130 409 132 395 118"
          />

          <NeonPath
            gradientId={gradientId}
            width={9.5}
            opacity={0.92}
            d="M348 164C358 196 360 236 346 273"
          />

          <NeonPath
            gradientId={gradientId}
            width={9.5}
            opacity={0.92}
            d="M270 273C291 254 302 239 304 215"
          />

          <NeonCircle gradientId={gradientId} cx="390" cy="54" r="6" width={5.5} />
          <NeonCircle gradientId={gradientId} cx="413" cy="43" r="6" width={5.5} />
          <NeonCircle gradientId={gradientId} cx="438" cy="44" r="6" width={5.5} />
        </>
      )}
    </IconWrapper>
  );
}

/*
====================================
 COMMENT — stable until next pass
====================================
*/
export function CommentIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-comment">
      {({ gradientId }) => (
        <>
          <NeonPath
            gradientId={gradientId}
            width={13}
            d="M95 105h322c22 0 40 18 40 40v168c0 22-18 40-40 40H210l-86 62v-62H95c-22 0-40-18-40-40V145c0-22 18-40 40-40z"
          />
          <NeonPath gradientId={gradientId} width={10} d="M150 178h155" />
          <NeonPath gradientId={gradientId} width={10} d="M150 236h120" />
          <NeonPath gradientId={gradientId} width={10} d="M150 292h85" />
          <NeonPath gradientId={gradientId} width={10} d="M342 172v110" />
          <NeonPath gradientId={gradientId} width={10} d="M342 172l55 20v34" />
          <circle cx="315" cy="292" r="18" fill={`url(#${gradientId})`} />
          <circle cx="372" cy="260" r="18" fill={`url(#${gradientId})`} />
        </>
      )}
    </IconWrapper>
  );
}

/*
====================================
 SAVE — stable until next pass
====================================
*/
export function SaveIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-save">
      {({ gradientId }) => (
        <>
          <NeonPath
            gradientId={gradientId}
            width={13}
            d="M98 105h316c22 0 40 18 40 40v170c0 22-18 40-40 40H207l-85 61v-61H98c-22 0-40-18-40-40V145c0-22 18-40 40-40z"
          />
          <NeonPath
            gradientId={gradientId}
            width={13}
            d="M195 167h136c11 0 20 9 20 20v154l-88-50-86 50V187c0-11 9-20 20-20z"
          />
        </>
      )}
    </IconWrapper>
  );
}

/*
====================================
 SHARE — stable until next pass
====================================
*/
export function ShareIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-share">
      {({ gradientId }) => (
        <>
          <NeonPath
            gradientId={gradientId}
            width={13}
            d="M95 105h322c22 0 40 18 40 40v168c0 22-18 40-40 40H210l-86 62v-62H95c-22 0-40-18-40-40V145c0-22 18-40 40-40z"
          />
          <NeonPath
            gradientId={gradientId}
            width={14}
            d="M145 314c72-92 148-124 240-133"
          />
          <NeonPath
            gradientId={gradientId}
            width={14}
            d="M326 122l72 60-60 70"
          />
          <NeonPath gradientId={gradientId} width={8} d="M402 130h31" />
          <NeonPath gradientId={gradientId} width={8} d="M421 159h37" />
        </>
      )}
    </IconWrapper>
  );
}

/*
====================================
 BOOST — stable until next pass
====================================
*/
export function BoostIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-boost">
      {({ gradientId }) => (
        <>
          <NeonPath
            gradientId={gradientId}
            width={13}
            d="M130 292v-54C130 162 185 96 256 96s126 66 126 142v54"
          />
          <NeonPath
            gradientId={gradientId}
            width={13}
            d="M92 275c0-14 11-25 25-25h34c14 0 25 11 25 25v85c0 14-11 25-25 25h-34c-14 0-25-11-25-25v-85z"
          />
          <NeonPath
            gradientId={gradientId}
            width={13}
            d="M336 275c0-14 11-25 25-25h34c14 0 25 11 25 25v85c0 14-11 25-25 25h-34c-14 0-25-11-25-25v-85z"
          />
          <rect x="193" y="247" width="126" height="77" rx="18" {...neonStroke(gradientId, 11)} />
          <path {...neonStroke(gradientId, 8)} d="M224 274v25" />
          <path {...neonStroke(gradientId, 8)} d="M254 270v29" />
          <path {...neonStroke(gradientId, 8)} d="M284 268v31" />
        </>
      )}
    </IconWrapper>
  );
}

/*
====================================
 INFO — stable
====================================
*/
export function InfoIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-info">
      {({ gradientId }) => (
        <>
          <NeonCircle gradientId={gradientId} cx="256" cy="256" r="176" width={13} />
          <NeonPath gradientId={gradientId} width={15} d="M256 238v102" />
          <circle cx="256" cy="178" r="18" fill={`url(#${gradientId})`} />
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
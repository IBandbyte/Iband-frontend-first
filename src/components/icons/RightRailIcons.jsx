import React, { useId } from "react";

/*
====================================
 iBand Right Rail Icons
 One-by-One Reverse Engineering Pass

Current pass:
- LikeIcon = guitar-heart bubble detail pass
- Other icons remain stable until individually refined
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
      style={{ overflow: "visible", display: "block" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="4" y1="5" x2="44" y2="43">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="30%" stopColor="#ff38d6" />
          <stop offset="68%" stopColor="#ff3f7f" />
          <stop offset="100%" stopColor="#ff8a18" />
        </linearGradient>

        <filter
          id={glowId}
          x="-70%"
          y="-70%"
          width="240%"
          height="240%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="0.9" result="softGlow" />
          <feGaussianBlur stdDeviation="1.7" result="wideGlow" />
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

function neonStroke(gradientId, width = 1.8, opacity = 1) {
  return {
    stroke: `url(#${gradientId})`,
    strokeWidth: width,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke",
    opacity
  };
}

function coreStroke(width = 0.45, opacity = 0.78) {
  return {
    stroke: "rgba(255,255,255,0.88)",
    strokeWidth: width,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke",
    opacity
  };
}

function NeonPath({ gradientId, d, width = 1.8, opacity = 1, core = true }) {
  return (
    <>
      <path {...neonStroke(gradientId, width, opacity)} d={d} />
      {core && <path {...coreStroke()} d={d} />}
    </>
  );
}

function NeonCircle({ gradientId, cx, cy, r, width = 1.7, core = true }) {
  return (
    <>
      <circle {...neonStroke(gradientId, width)} cx={cx} cy={cy} r={r} />
      {core && <circle {...coreStroke()} cx={cx} cy={cy} r={r} />}
    </>
  );
}

/*
====================================
 LIKE — Guitar Heart Bubble Detail Pass
====================================
*/
export function LikeIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-like">
      {({ gradientId }) => (
        <>
          {/* Rounded speech bubble outer shell */}
          <NeonPath
            gradientId={gradientId}
            width={1.7}
            d="M10.6 11.8h24.7c2.7 0 4.7 2.1 4.7 4.7v12.2c0 2.6-2 4.7-4.7 4.7h-9.1l-8.8 6.5v-6.5h-6.8c-2.6 0-4.7-2.1-4.7-4.7V16.5c0-2.6 2.1-4.7 4.7-4.7z"
          />

          {/* Heart body */}
          <NeonPath
            gradientId={gradientId}
            width={1.75}
            d="M23.2 30.5s-7.1-4.6-9.3-8.4c-2.1-3.6 1.9-7.4 5.4-5.1 1.7 1.1 2.7 2.8 3.9 4.5 1.2-1.7 2.3-3.4 4-4.5 3.5-2.3 7.5 1.5 5.4 5.1-2.2 3.8-9.4 8.4-9.4 8.4z"
          />

          {/* Guitar neck crossing heart */}
          <NeonPath
            gradientId={gradientId}
            width={1.55}
            d="M27.4 18.1l8.1-7.5"
          />

          {/* Guitar body/inner curve */}
          <NeonPath
            gradientId={gradientId}
            width={1.35}
            d="M27.9 18.3c2.2 4.3 1 8.4-3.5 12.1"
            opacity={0.95}
          />

          {/* Long guitar line through right heart edge */}
          <NeonPath
            gradientId={gradientId}
            width={1.35}
            d="M31.5 14.6l5.2 14"
            opacity={0.95}
          />

          {/* Guitar headstock */}
          <NeonPath
            gradientId={gradientId}
            width={1.25}
            d="M35 10.8h3.4c1.3 0 2.2 1 2.2 2.1 0 1.2-.9 2.2-2.2 2.2h-2.1"
          />

          {/* Tuning dots */}
          <circle cx="33.5" cy="9.8" r="0.85" fill={`url(#${gradientId})`} />
          <circle cx="36.2" cy="8.9" r="0.85" fill={`url(#${gradientId})`} />
          <circle cx="38.8" cy="9.6" r="0.85" fill={`url(#${gradientId})`} />
          <circle cx="41" cy="11.2" r="0.85" fill={`url(#${gradientId})`} />

          {/* Heart highlight */}
          <NeonPath
            gradientId={gradientId}
            width={1.15}
            d="M16.3 18.8c1.7-1.4 3.7-1.3 5.2.3"
            opacity={0.8}
            core={false}
          />
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
            width={1.7}
            d="M8.8 10.2h30.4c2 0 3.6 1.6 3.6 3.6v15.8c0 2-1.6 3.6-3.6 3.6H19.7l-8.1 5.8v-5.8H8.8c-2 0-3.6-1.6-3.6-3.6V13.8c0-2 1.6-3.6 3.6-3.6z"
          />
          <NeonPath gradientId={gradientId} width={1.35} d="M13.9 17.4h14.6" />
          <NeonPath gradientId={gradientId} width={1.35} d="M13.9 22.8h11.3" />
          <NeonPath gradientId={gradientId} width={1.35} d="M13.9 28.1h8" />
          <NeonPath gradientId={gradientId} width={1.45} d="M32.3 16.8v10.4" />
          <NeonPath gradientId={gradientId} width={1.35} d="M32.3 16.8l5.2 1.9v3.2" />
          <circle cx="29.8" cy="28.1" r="1.95" fill={`url(#${gradientId})`} />
          <circle cx="35.1" cy="25.1" r="1.95" fill={`url(#${gradientId})`} />
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
            width={1.7}
            d="M9.2 10.1h29.6c2 0 3.6 1.6 3.6 3.6v15.9c0 2-1.6 3.6-3.6 3.6H19.4l-8 5.7v-5.7H9.2c-2 0-3.6-1.6-3.6-3.6V13.7c0-2 1.6-3.6 3.6-3.6z"
          />
          <NeonPath
            gradientId={gradientId}
            width={1.75}
            d="M18.3 15.9h12.8c1 0 1.8.8 1.8 1.8v14.5l-8.3-4.7-8.1 4.7V17.7c0-1 .8-1.8 1.8-1.8z"
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
            width={1.7}
            d="M8.8 10.2h30.4c2 0 3.6 1.6 3.6 3.6v15.8c0 2-1.6 3.6-3.6 3.6H19.7l-8.1 5.8v-5.8H8.8c-2 0-3.6-1.6-3.6-3.6V13.8c0-2 1.6-3.6 3.6-3.6z"
          />
          <NeonPath
            gradientId={gradientId}
            width={1.85}
            d="M13.7 29.5c6.8-8.7 14-11.7 22.6-12.5"
          />
          <NeonPath
            gradientId={gradientId}
            width={1.85}
            d="M30.7 11.5l6.7 5.6-5.6 6.6"
          />
          <NeonPath gradientId={gradientId} width={1.15} d="M37.7 12.2h2.9" />
          <NeonPath gradientId={gradientId} width={1.15} d="M39.5 14.9h3.5" />
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
            width={1.8}
            d="M12.2 27.4v-5.1C12.2 15.2 17.4 9 24 9s11.8 6.2 11.8 13.3v5.1"
          />
          <NeonPath
            gradientId={gradientId}
            width={1.75}
            d="M8.7 25.8c0-1.3 1-2.3 2.3-2.3h3.2c1.3 0 2.3 1 2.3 2.3v8c0 1.3-1 2.3-2.3 2.3H11c-1.3 0-2.3-1-2.3-2.3v-8z"
          />
          <NeonPath
            gradientId={gradientId}
            width={1.75}
            d="M31.5 25.8c0-1.3 1-2.3 2.3-2.3H37c1.3 0 2.3 1 2.3 2.3v8c0 1.3-1 2.3-2.3 2.3h-3.2c-1.3 0-2.3-1-2.3-2.3v-8z"
          />
          <rect x="18.1" y="23.2" width="11.8" height="7.2" rx="1.7" {...neonStroke(gradientId, 1.45)} />
          <path {...neonStroke(gradientId, 1.05)} d="M21.1 25.7v2.3" />
          <path {...neonStroke(gradientId, 1.05)} d="M23.9 25.3v2.7" />
          <path {...neonStroke(gradientId, 1.05)} d="M26.7 25.1v2.9" />
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
          <NeonCircle gradientId={gradientId} cx="24" cy="24" r="16.6" width={1.75} />
          <NeonPath gradientId={gradientId} width={1.9} d="M24 22.3v9.5" />
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
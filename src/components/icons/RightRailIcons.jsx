import React, { useId } from "react";

/*
====================================
 iBand Right Rail Icons
 LikeIcon Final Neon Pass
====================================
- Final LikeIcon direction based on locked neon reference
- Crisp gradient neon tubing
- White inner core
- Controlled glow
- No unwanted extra guitar body line
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
        <linearGradient id={gradientId} x1="3" y1="4" x2="45" y2="44">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="34%" stopColor="#ff2dfc" />
          <stop offset="67%" stopColor="#ff3f72" />
          <stop offset="100%" stopColor="#ff9f1c" />
        </linearGradient>

        <filter
          id={glowId}
          x="-85%"
          y="-85%"
          width="270%"
          height="270%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="0.75" result="softGlow" />
          <feGaussianBlur stdDeviation="1.55" result="wideGlow" />
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

function neonStroke(gradientId, width = 1.75, opacity = 1) {
  return {
    stroke: `url(#${gradientId})`,
    strokeWidth: width,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke",
    opacity
  };
}

function coreStroke(width = 0.34, opacity = 0.82) {
  return {
    stroke: "rgba(255,255,255,0.86)",
    strokeWidth: width,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke",
    opacity
  };
}

function NeonPath({ gradientId, d, width = 1.75, opacity = 1, core = true }) {
  return (
    <>
      <path {...neonStroke(gradientId, width, opacity)} d={d} fill="none" />
      {core && <path {...coreStroke()} d={d} fill="none" />}
    </>
  );
}

function NeonCircle({ gradientId, cx, cy, r, width = 1.6, core = true }) {
  return (
    <>
      <circle {...neonStroke(gradientId, width)} cx={cx} cy={cy} r={r} fill="none" />
      {core && <circle {...coreStroke()} cx={cx} cy={cy} r={r} fill="none" />}
    </>
  );
}

/*
====================================
 LIKE — Final Neon Guitar Heart Bubble
====================================
*/
export function LikeIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-like-final">
      {({ gradientId }) => (
        <>
          <NeonPath
            gradientId={gradientId}
            width={1.72}
            d="M38.9 6.4c4.1.2 6.4 2.8 6.4 6.6v15.4c0 6.4-4.1 9.7-10.8 9.7H18.8l-8.8 6 1.35-7.75C7.25 35.2 4.2 31.95 4.2 27.25V17.55C4.2 10.25 9.25 6.4 16.9 6.4h22"
          />

          <NeonPath
            gradientId={gradientId}
            width={1.72}
            d="M14.3 26.5c-5.4-10.55 4.3-16.25 10.35-8.5 6.05-7.75 15.95-2.05 10.3 8.5-3.05 5.2-6.85 9-10.3 11.85-3.45-2.85-7.25-6.65-10.35-11.85z"
          />

          <NeonPath
            gradientId={gradientId}
            width={1.04}
            opacity={0.72}
            core={false}
            d="M15.45 18.15c1.7-3.55 5.35-4.95 8.1-3.05"
          />

          <NeonPath
            gradientId={gradientId}
            width={1.48}
            d="M27.9 24.9 39.7 7.45"
          />

          <NeonPath
            gradientId={gradientId}
            width={1.24}
            d="M38.1 8.2c1.55-2.55 5.8-1.7 5.9 1.25.08 2.25-2.65 2.55-4.05 1.25-.5 1.05-1.4 1.95-2.8 1.95"
          />

          <NeonPath
            gradientId={gradientId}
            width={1.12}
            opacity={0.92}
            d="M27.85 24.75c1.45 4.15-.8 7.05-4.55 9.25"
          />

          <circle cx="37.25" cy="6.6" r="0.74" fill={`url(#${gradientId})`} />
          <circle cx="39.2" cy="5.45" r="0.74" fill={`url(#${gradientId})`} />
          <circle cx="41.25" cy="5.4" r="0.74" fill={`url(#${gradientId})`} />
          <circle cx="43.05" cy="6.45" r="0.74" fill={`url(#${gradientId})`} />
        </>
      )}
    </IconWrapper>
  );
}

/*
====================================
 COMMENT
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
 SAVE
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
 SHARE
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
 BOOST
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
 INFO
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
import React, { useId } from "react";

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
          <stop offset="32%" stopColor="#ff2dfc" />
          <stop offset="64%" stopColor="#ff3f72" />
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
          <feGaussianBlur stdDeviation="0.72" result="softGlow" />
          <feGaussianBlur stdDeviation="1.45" result="wideGlow" />
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

export function LikeIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-like-final-micro">
      {({ gradientId }) => (
        <>
          <NeonPath
            gradientId={gradientId}
            width={1.72}
            d="M39.2 6.25c4.25.18 6.35 2.75 6.35 6.55v15.45c0 6.55-4.25 9.9-11.05 9.9H18.65l-8.95 6.15 1.38-7.95C7.1 35.18 4.05 31.9 4.05 27.15V17.55C4.05 10.15 9.15 6.25 16.85 6.25h22.35"
          />

          <NeonPath
            gradientId={gradientId}
            width={1.82}
            d="M12.9 27.2c-5.8-11.35 4.65-17.35 11.7-8.75 6.8-8.6 17.25-2.45 11.2 8.75-3.25 5.65-7.35 9.65-11.2 12.75-3.8-3.1-8.15-7.1-11.7-12.75z"
          />

          <NeonPath
            gradientId={gradientId}
            width={1.02}
            opacity={0.72}
            core={false}
            d="M15.1 18.15c1.72-3.55 5.45-4.95 8.25-3.08"
          />

          <NeonPath
            gradientId={gradientId}
            width={1.46}
            d="M27.6 25.2Q31 20 34 15T40.2 7.6"
          />

          <NeonPath
            gradientId={gradientId}
            width={1.18}
            d="M38.9 8.2c1.1-2.4 5.2-1.4 5.1 1.1-.1 1.9-2.3 2.6-3.6 1.6-.6 1-1.4 1.7-2.8 1.9"
          />

          <circle cx="37.9" cy="6.28" r="0.7" fill={`url(#${gradientId})`} />
          <circle cx="39.88" cy="5.08" r="0.7" fill={`url(#${gradientId})`} />
          <circle cx="41.92" cy="5.05" r="0.7" fill={`url(#${gradientId})`} />
          <circle cx="43.72" cy="6.12" r="0.7" fill={`url(#${gradientId})`} />
        </>
      )}
    </IconWrapper>
  );
}

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
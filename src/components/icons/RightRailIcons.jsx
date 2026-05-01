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
        <linearGradient id={gradientId} x1="3" y1="5" x2="45" y2="43">
          <stop offset="0%" stopColor="#bf5cff" />
          <stop offset="32%" stopColor="#ff23e6" />
          <stop offset="62%" stopColor="#ff386f" />
          <stop offset="100%" stopColor="#ff9b18" />
        </linearGradient>

        <filter id={glowId} x="-120%" y="-120%" width="340%" height="340%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="0.45" result="tightGlow" />
          <feGaussianBlur stdDeviation="1.05" result="softGlow" />
          <feGaussianBlur stdDeviation="1.85" result="wideGlow" />
          <feMerge>
            <feMergeNode in="wideGlow" />
            <feMergeNode in="softGlow" />
            <feMergeNode in="tightGlow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter={`url(#${glowId})`}>{children({ gradientId })}</g>
    </svg>
  );
}

function neonStroke(gradientId, width = 2.25, opacity = 1) {
  return {
    stroke: `url(#${gradientId})`,
    strokeWidth: width,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke",
    opacity
  };
}

function coreStroke(width = 0.55, opacity = 0.92) {
  return {
    stroke: "#ffffff",
    strokeWidth: width,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke",
    opacity
  };
}

function NeonPath({ gradientId, d, width = 2.25, opacity = 1, core = true }) {
  return (
    <>
      <path {...neonStroke(gradientId, width, opacity)} d={d} fill="none" />
      {core && <path {...coreStroke()} d={d} fill="none" />}
    </>
  );
}

function NeonCircle({ gradientId, cx, cy, r, width = 2.1, core = true }) {
  return (
    <>
      <circle {...neonStroke(gradientId, width)} cx={cx} cy={cy} r={r} fill="none" />
      {core && <circle {...coreStroke()} cx={cx} cy={cy} r={r} fill="none" />}
    </>
  );
}

function Bubble({ gradientId }) {
  return (
    <NeonPath
      gradientId={gradientId}
      width={2.15}
      d="M9.6 9.7h28.8c2.9 0 5.2 2.3 5.2 5.2v14.7c0 2.9-2.3 5.2-5.2 5.2H19.6l-8.7 6.2 1.15-6.2H9.6c-2.9 0-5.2-2.3-5.2-5.2V14.9c0-2.9 2.3-5.2 5.2-5.2z"
    />
  );
}

export function LikeIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-like-v2">
      {({ gradientId }) => (
        <>
          <Bubble gradientId={gradientId} />
          <NeonPath
            gradientId={gradientId}
            width={2.15}
            d="M13.7 26.4c-5.3-10.7 4.6-16.4 10.6-8.2 6.2-8.2 16-2.5 10.6 8.2-3 5.45-6.8 9.1-10.6 12.2-3.75-3.1-7.55-6.75-10.6-12.2z"
          />
          <NeonPath
            gradientId={gradientId}
            width={1.25}
            opacity={0.78}
            core={false}
            d="M15.9 18.1c1.6-2.9 4.75-4.15 7.15-2.75"
          />
          <NeonPath
            gradientId={gradientId}
            width={1.8}
            d="M28.05 25.05Q32.2 18.6 35.1 14.1T40.3 6.9"
          />
          <NeonPath
            gradientId={gradientId}
            width={1.45}
            d="M38.55 8.1c1.45-2.4 5.35-1.7 5.45 1.05.1 2.1-2.35 2.55-3.85 1.45-.55 1.05-1.45 1.85-2.95 1.95"
          />
          <circle cx="37.3" cy="6.5" r="0.72" fill={`url(#${gradientId})`} />
          <circle cx="39.3" cy="5.25" r="0.72" fill={`url(#${gradientId})`} />
          <circle cx="41.35" cy="5.25" r="0.72" fill={`url(#${gradientId})`} />
          <circle cx="43.15" cy="6.35" r="0.72" fill={`url(#${gradientId})`} />
        </>
      )}
    </IconWrapper>
  );
}

export function CommentIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-comment-v2">
      {({ gradientId }) => (
        <>
          <Bubble gradientId={gradientId} />
          <NeonPath gradientId={gradientId} width={1.55} d="M12.8 17.6h13.6" />
          <NeonPath gradientId={gradientId} width={1.55} d="M12.8 23h10.4" />
          <NeonPath gradientId={gradientId} width={1.55} d="M12.8 28.2h7.4" />
          <NeonPath gradientId={gradientId} width={1.8} d="M31.8 16.2v11.4" />
          <NeonPath gradientId={gradientId} width={1.65} d="M31.8 16.2l6.1 2.2v4.1" />
          <NeonCircle gradientId={gradientId} cx="29.1" cy="28.3" r="2.05" width={1.45} core={false} />
          <NeonCircle gradientId={gradientId} cx="35.1" cy="25.3" r="2.05" width={1.45} core={false} />
        </>
      )}
    </IconWrapper>
  );
}

export function SaveIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-save-v2">
      {({ gradientId }) => (
        <>
          <Bubble gradientId={gradientId} />
          <NeonPath
            gradientId={gradientId}
            width={2.05}
            d="M17.6 15.5h13.8c1 0 1.8.8 1.8 1.8v15.1l-8.7-5.05-8.7 5.05V17.3c0-1 .8-1.8 1.8-1.8z"
          />
        </>
      )}
    </IconWrapper>
  );
}

export function ShareIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-share-v2">
      {({ gradientId }) => (
        <>
          <Bubble gradientId={gradientId} />
          <NeonPath
            gradientId={gradientId}
            width={2.25}
            d="M13.4 29.9C18.8 21.4 26.7 17 36.7 16.2"
          />
          <NeonPath
            gradientId={gradientId}
            width={2.25}
            d="M31.2 10.9l7.25 5.45-5.55 7.25"
          />
          <NeonPath gradientId={gradientId} width={1.35} d="M37.9 10.6l2.5-1.9" />
          <NeonPath gradientId={gradientId} width={1.35} d="M40.4 13.6h3.2" />
          <NeonPath gradientId={gradientId} width={1.35} d="M39.2 16.7l3.1 1.5" />
        </>
      )}
    </IconWrapper>
  );
}

export function BoostIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-boost-v2">
      {({ gradientId }) => (
        <>
          <NeonPath
            gradientId={gradientId}
            width={2.05}
            d="M11.8 27.5v-4.4C11.8 15.4 17.1 9.1 24 9.1s12.2 6.3 12.2 14v4.4"
          />
          <NeonPath
            gradientId={gradientId}
            width={2}
            d="M8.5 25.3c0-1.35 1.05-2.4 2.4-2.4h3.6c1.35 0 2.4 1.05 2.4 2.4v8.9c0 1.35-1.05 2.4-2.4 2.4h-3.6c-1.35 0-2.4-1.05-2.4-2.4v-8.9z"
          />
          <NeonPath
            gradientId={gradientId}
            width={2}
            d="M31.1 25.3c0-1.35 1.05-2.4 2.4-2.4h3.6c1.35 0 2.4 1.05 2.4 2.4v8.9c0 1.35-1.05 2.4-2.4 2.4h-3.6c-1.35 0-2.4-1.05-2.4-2.4v-8.9z"
          />
          <rect x="18.2" y="23.4" width="11.6" height="7.2" rx="1.8" {...neonStroke(gradientId, 1.65)} />
          <path {...neonStroke(gradientId, 1.05)} d="M21.1 25.7v2.6" />
          <path {...neonStroke(gradientId, 1.05)} d="M23.9 25.4v2.9" />
          <path {...neonStroke(gradientId, 1.05)} d="M26.7 25.2v3.1" />
        </>
      )}
    </IconWrapper>
  );
}

export function InfoIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-info-v2">
      {({ gradientId }) => (
        <>
          <NeonCircle gradientId={gradientId} cx="24" cy="24" r="16.8" width={2.05} />
          <NeonPath gradientId={gradientId} width={2.15} d="M24 22.1v10" />
          <circle cx="24" cy="16.4" r="1.75" fill={`url(#${gradientId})`} />
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
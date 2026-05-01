import React, { useId } from "react";

function safeId(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "");
}

function IconWrapper({ size = 28, label = "iband-icon", children }) {
  const rawId = useId();
  const baseId = safeId(`${label}-${rawId}`);
  const gradientId = `${baseId}-gradient`;

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
        display: "block",
        filter:
          "drop-shadow(0 0 1px rgba(255,255,255,0.9)) drop-shadow(0 0 3px #ff31df) drop-shadow(0 0 7px #ff2f6f) drop-shadow(0 0 12px rgba(255,138,24,0.8))"
      }}
    >
      <defs>
        <linearGradient id={gradientId} x1="3" y1="5" x2="45" y2="43">
          <stop offset="0%" stopColor="#c45cff" />
          <stop offset="28%" stopColor="#ff2dfc" />
          <stop offset="62%" stopColor="#ff3470" />
          <stop offset="100%" stopColor="#ff9f1c" />
        </linearGradient>
      </defs>

      {children({ gradientId })}
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

function coreStroke(width = 0.52, opacity = 0.9) {
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

function Bubble({ gradientId }) {
  return (
    <NeonPath
      gradientId={gradientId}
      width={2.15}
      d="M9.4 9.35h29.2c3.05 0 5.45 2.4 5.45 5.45v14.75c0 3.05-2.4 5.45-5.45 5.45H19.55l-8.95 6.35 1.2-6.35H9.4c-3.05 0-5.45-2.4-5.45-5.45V14.8c0-3.05 2.4-5.45 5.45-5.45z"
    />
  );
}

export function LikeIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-like-premium">
      {({ gradientId }) => (
        <>
          <Bubble gradientId={gradientId} />
          <NeonPath
            gradientId={gradientId}
            width={2.15}
            d="M13.65 26.3c-5.35-10.65 4.65-16.45 10.75-8.15 6.25-8.3 16.15-2.5 10.75 8.15-3.05 5.35-6.9 9.1-10.75 12.25-3.8-3.15-7.7-6.9-10.75-12.25z"
          />
          <NeonPath
            gradientId={gradientId}
            width={1.25}
            opacity={0.75}
            core={false}
            d="M15.9 18.25c1.65-3.05 4.9-4.3 7.3-2.85"
          />
          <NeonPath
            gradientId={gradientId}
            width={1.75}
            d="M28.05 25.05Q32.25 18.7 35.1 14.1T40.35 6.75"
          />
          <NeonPath
            gradientId={gradientId}
            width={1.42}
            d="M38.55 8.05c1.45-2.35 5.35-1.65 5.45 1.08.08 2.08-2.35 2.55-3.85 1.45-.55 1.05-1.45 1.85-2.95 1.95"
          />
          <circle cx="37.3" cy="6.45" r="0.74" fill={`url(#${gradientId})`} />
          <circle cx="39.35" cy="5.2" r="0.74" fill={`url(#${gradientId})`} />
          <circle cx="41.4" cy="5.22" r="0.74" fill={`url(#${gradientId})`} />
          <circle cx="43.2" cy="6.35" r="0.74" fill={`url(#${gradientId})`} />
        </>
      )}
    </IconWrapper>
  );
}

export function CommentIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-comment-premium">
      {({ gradientId }) => (
        <>
          <Bubble gradientId={gradientId} />
          <NeonPath gradientId={gradientId} width={1.6} d="M12.5 17.4h14.2" />
          <NeonPath gradientId={gradientId} width={1.6} d="M12.5 22.8h10.8" />
          <NeonPath gradientId={gradientId} width={1.6} d="M12.5 28.1h7.8" />
          <NeonPath gradientId={gradientId} width={1.85} d="M31.8 16.1v11.5" />
          <NeonPath gradientId={gradientId} width={1.7} d="M31.8 16.1l6.2 2.2v4.15" />
          <circle cx="29.1" cy="28.3" r="2.15" fill={`url(#${gradientId})`} />
          <circle cx="35.2" cy="25.25" r="2.15" fill={`url(#${gradientId})`} />
        </>
      )}
    </IconWrapper>
  );
}

export function SaveIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-save-premium">
      {({ gradientId }) => (
        <>
          <Bubble gradientId={gradientId} />
          <NeonPath
            gradientId={gradientId}
            width={2.1}
            d="M17.6 15.5h13.8c1 0 1.8.8 1.8 1.8v15.2l-8.7-5.05-8.7 5.05V17.3c0-1 .8-1.8 1.8-1.8z"
          />
        </>
      )}
    </IconWrapper>
  );
}

export function ShareIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-share-premium">
      {({ gradientId }) => (
        <>
          <Bubble gradientId={gradientId} />
          <NeonPath
            gradientId={gradientId}
            width={2.35}
            d="M12.8 30.2C18.7 21.2 26.9 16.9 37.1 16.2"
          />
          <NeonPath
            gradientId={gradientId}
            width={2.35}
            d="M31.3 10.65l7.45 5.55-5.75 7.45"
          />
          <NeonPath gradientId={gradientId} width={1.45} d="M38 10.1l2.6-2" />
          <NeonPath gradientId={gradientId} width={1.45} d="M40.45 13.3h3.35" />
          <NeonPath gradientId={gradientId} width={1.45} d="M39.1 16.5l3.3 1.6" />
        </>
      )}
    </IconWrapper>
  );
}

export function BoostIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-boost-premium">
      {({ gradientId }) => (
        <>
          <NeonPath
            gradientId={gradientId}
            width={2.2}
            d="M11.8 27.5v-4.4C11.8 15.4 17.1 9.1 24 9.1s12.2 6.3 12.2 14v4.4"
          />
          <NeonPath
            gradientId={gradientId}
            width={2.05}
            d="M8.5 25.3c0-1.35 1.05-2.4 2.4-2.4h3.6c1.35 0 2.4 1.05 2.4 2.4v8.9c0 1.35-1.05 2.4-2.4 2.4h-3.6c-1.35 0-2.4-1.05-2.4-2.4v-8.9z"
          />
          <NeonPath
            gradientId={gradientId}
            width={2.05}
            d="M31.1 25.3c0-1.35 1.05-2.4 2.4-2.4h3.6c1.35 0 2.4 1.05 2.4 2.4v8.9c0 1.35-1.05 2.4-2.4 2.4h-3.6c-1.35 0-2.4-1.05-2.4-2.4v-8.9z"
          />
          <rect x="18.2" y="23.4" width="11.6" height="7.2" rx="1.8" {...neonStroke(gradientId, 1.7)} />
          <path {...neonStroke(gradientId, 1.1)} d="M21.1 25.7v2.6" />
          <path {...neonStroke(gradientId, 1.1)} d="M23.9 25.4v2.9" />
          <path {...neonStroke(gradientId, 1.1)} d="M26.7 25.2v3.1" />
        </>
      )}
    </IconWrapper>
  );
}

export function InfoIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-info-premium">
      {({ gradientId }) => (
        <>
          <NeonPath
            gradientId={gradientId}
            width={2.15}
            d="M24 7.4c9.15 0 16.6 7.45 16.6 16.6S33.15 40.6 24 40.6 7.4 33.15 7.4 24 14.85 7.4 24 7.4z"
          />
          <NeonPath gradientId={gradientId} width={2.2} d="M24 22.1v10" />
          <circle cx="24" cy="16.4" r="1.8" fill={`url(#${gradientId})`} />
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
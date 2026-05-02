import React from "react";

const LIKE_ICON_SRC = "/like.png";

function ImageIcon({ size = 28, src, label }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      draggable="false"
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "block",
        userSelect: "none",
        pointerEvents: "none",
        filter:
          "drop-shadow(0 0 1px rgba(255,255,255,0.95)) drop-shadow(0 0 4px rgba(255,45,252,0.9)) drop-shadow(0 0 8px rgba(255,52,112,0.75)) drop-shadow(0 0 12px rgba(255,159,28,0.65))"
      }}
      data-icon-label={label}
    />
  );
}

function SvgIcon({ size = 28, label = "iband-icon", children }) {
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
          "drop-shadow(0 0 1px rgba(255,255,255,0.9)) drop-shadow(0 0 3px rgba(255,45,252,0.85)) drop-shadow(0 0 7px rgba(255,52,112,0.7)) drop-shadow(0 0 11px rgba(255,159,28,0.55))"
      }}
      data-icon-label={label}
    >
      <defs>
        <linearGradient id={`${label}-gradient`} x1="3" y1="5" x2="45" y2="43">
          <stop offset="0%" stopColor="#c45cff" />
          <stop offset="30%" stopColor="#ff2dfc" />
          <stop offset="64%" stopColor="#ff3470" />
          <stop offset="100%" stopColor="#ff9f1c" />
        </linearGradient>
      </defs>

      {children(`${label}-gradient`)}
    </svg>
  );
}

function stroke(gradientId, width = 2.1) {
  return {
    stroke: `url(#${gradientId})`,
    strokeWidth: width,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke",
    fill: "none"
  };
}

function core(width = 0.55) {
  return {
    stroke: "rgba(255,255,255,0.9)",
    strokeWidth: width,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke",
    fill: "none"
  };
}

function NeonPath({ gradientId, d, width = 2.1, showCore = true }) {
  return (
    <>
      <path d={d} {...stroke(gradientId, width)} />
      {showCore && <path d={d} {...core()} />}
    </>
  );
}

function Bubble({ gradientId }) {
  return (
    <NeonPath
      gradientId={gradientId}
      width={2.1}
      d="M9.4 9.35h29.2c3.05 0 5.45 2.4 5.45 5.45v14.75c0 3.05-2.4 5.45-5.45 5.45H19.55l-8.95 6.35 1.2-6.35H9.4c-3.05 0-5.45-2.4-5.45-5.45V14.8c0-3.05 2.4-5.45 5.45-5.45z"
    />
  );
}

export function LikeIcon({ size = 28 }) {
  return <ImageIcon size={size} src={LIKE_ICON_SRC} label="iband-like-image" />;
}

export function CommentIcon({ size = 28 }) {
  return (
    <SvgIcon size={size} label="iband-comment-premium">
      {(gradientId) => (
        <>
          <Bubble gradientId={gradientId} />
          <NeonPath gradientId={gradientId} width={1.55} d="M12.5 17.4h14.2" />
          <NeonPath gradientId={gradientId} width={1.55} d="M12.5 22.8h10.8" />
          <NeonPath gradientId={gradientId} width={1.55} d="M12.5 28.1h7.8" />
          <NeonPath gradientId={gradientId} width={1.75} d="M31.8 16.1v11.5" />
          <NeonPath gradientId={gradientId} width={1.6} d="M31.8 16.1l6.2 2.2v4.15" />
          <circle cx="29.1" cy="28.3" r="2.15" fill={`url(#${gradientId})`} />
          <circle cx="35.2" cy="25.25" r="2.15" fill={`url(#${gradientId})`} />
        </>
      )}
    </SvgIcon>
  );
}

export function SaveIcon({ size = 28 }) {
  return (
    <SvgIcon size={size} label="iband-save-premium">
      {(gradientId) => (
        <>
          <Bubble gradientId={gradientId} />
          <NeonPath
            gradientId={gradientId}
            width={2}
            d="M17.6 15.5h13.8c1 0 1.8.8 1.8 1.8v15.2l-8.7-5.05-8.7 5.05V17.3c0-1 .8-1.8 1.8-1.8z"
          />
        </>
      )}
    </SvgIcon>
  );
}

export function ShareIcon({ size = 28 }) {
  return (
    <SvgIcon size={size} label="iband-share-premium">
      {(gradientId) => (
        <>
          <Bubble gradientId={gradientId} />
          <NeonPath
            gradientId={gradientId}
            width={2.2}
            d="M12.8 30.2C18.7 21.2 26.9 16.9 37.1 16.2"
          />
          <NeonPath
            gradientId={gradientId}
            width={2.2}
            d="M31.3 10.65l7.45 5.55-5.75 7.45"
          />
          <NeonPath gradientId={gradientId} width={1.35} d="M38 10.1l2.6-2" />
          <NeonPath gradientId={gradientId} width={1.35} d="M40.45 13.3h3.35" />
          <NeonPath gradientId={gradientId} width={1.35} d="M39.1 16.5l3.3 1.6" />
        </>
      )}
    </SvgIcon>
  );
}

export function BoostIcon({ size = 28 }) {
  return (
    <SvgIcon size={size} label="iband-boost-premium">
      {(gradientId) => (
        <>
          <NeonPath
            gradientId={gradientId}
            width={2}
            d="M11.8 27.5v-4.4C11.8 15.4 17.1 9.1 24 9.1s12.2 6.3 12.2 14v4.4"
          />
          <NeonPath
            gradientId={gradientId}
            width={1.9}
            d="M8.5 25.3c0-1.35 1.05-2.4 2.4-2.4h3.6c1.35 0 2.4 1.05 2.4 2.4v8.9c0 1.35-1.05 2.4-2.4 2.4h-3.6c-1.35 0-2.4-1.05-2.4-2.4v-8.9z"
          />
          <NeonPath
            gradientId={gradientId}
            width={1.9}
            d="M31.1 25.3c0-1.35 1.05-2.4 2.4-2.4h3.6c1.35 0 2.4 1.05 2.4 2.4v8.9c0 1.35-1.05 2.4-2.4 2.4h-3.6c-1.35 0-2.4-1.05-2.4-2.4v-8.9z"
          />
          <rect x="18.2" y="23.4" width="11.6" height="7.2" rx="1.8" {...stroke(gradientId, 1.55)} />
          <path {...stroke(gradientId, 1.05)} d="M21.1 25.7v2.6" />
          <path {...stroke(gradientId, 1.05)} d="M23.9 25.4v2.9" />
          <path {...stroke(gradientId, 1.05)} d="M26.7 25.2v3.1" />
        </>
      )}
    </SvgIcon>
  );
}

export function InfoIcon({ size = 28 }) {
  return (
    <SvgIcon size={size} label="iband-info-premium">
      {(gradientId) => (
        <>
          <NeonPath
            gradientId={gradientId}
            width={2.05}
            d="M24 7.4c9.15 0 16.6 7.45 16.6 16.6S33.15 40.6 24 40.6 7.4 33.15 7.4 24 14.85 7.4 24 7.4z"
          />
          <NeonPath gradientId={gradientId} width={2.1} d="M24 22.1v10" />
          <circle cx="24" cy="16.4" r="1.8" fill={`url(#${gradientId})`} />
        </>
      )}
    </SvgIcon>
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
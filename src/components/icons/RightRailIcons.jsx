import React, { useId } from "react";

/*
====================================
 iBand Right Rail Icons
 LikeIcon Shape Rebuild Pass
====================================
Current focus:
- Rebuild LikeIcon from scratch
- Target: large guitar-heart first, bubble second
- Other icons remain stable until their own pass
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
        <linearGradient id={gradientId} x1="5" y1="6" x2="43" y2="42">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="38%" stopColor="#ff2dfc" />
          <stop offset="68%" stopColor="#ff477e" />
          <stop offset="100%" stopColor="#ff8a18" />
        </linearGradient>

        <filter
          id={glowId}
          x="-65%"
          y="-65%"
          width="230%"
          height="230%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="0.7" result="softGlow" />
          <feGaussianBlur stdDeviation="1.35" result="wideGlow" />
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

function coreStroke(width = 0.42, opacity = 0.72) {
  return {
    stroke: "rgba(255,255,255,0.82)",
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
 LIKE — Shape Rebuild
Big guitar-heart first, bubble second
====================================
*/
export function LikeIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-like">
      {({ gradientId }) => (
        <>
          {/* Soft speech bubble wrap — secondary */}
          <NeonPath
            gradientId={gradientId}
            width={1.45}
            opacity={0.92}
            d="M11.2 12.1h23.4c2.8 0 5.1 2.2 5.1 5v11.1c0 2.8-2.3 5-5.1 5h-7.2l-9.6 6.9v-6.9h-6.6c-2.8 0-5.1-2.2-5.1-5V17.1c0-2.8 2.3-5 5.1-5z"
          />

          {/* Large heart — primary silhouette */}
          <NeonPath
            gradientId={gradientId}
            width={1.95}
            d="M23.7 32.8s-8.9-5.4-11.5-10.1c-2.5-4.5 2.4-8.8 6.5-5.9 2 1.4 3.2 3.3 5 5.7 1.8-2.4 3-4.3 5-5.7 4.1-2.9 9 1.4 6.5 5.9-2.6 4.7-11.5 10.1-11.5 10.1z"
          />

          {/* Guitar neck — long readable diagonal */}
          <NeonPath
            gradientId={gradientId}
            width={1.75}
            d="M27.1 21.4L38.8 9.9"
          />

          {/* Guitar body curve inside heart */}
          <NeonPath
            gradientId={gradientId}
            width={1.35}
            opacity={0.95}
            d="M27.1 21.4c1.8 4.8 0 8-4.8 10.4"
          />

          {/* Guitar lower string / body line */}
          <NeonPath
            gradientId={gradientId}
            width={1.25}
            opacity={0.9}
            d="M31.1 17.4c1.8 4.7 3.2 8.4 4.8 12.4"
          />

          {/* Headstock shape */}
          <NeonPath
            gradientId={gradientId}
            width={1.4}
            d="M36.5 10.1h3.1c1.2 0 2.2 1 2.2 2.1 0 1.2-1 2.2-2.2 2.2h-2.2"
          />

          {/* Tuning dots */}
          <circle cx="34.2" cy="9.9" r="0.9" fill={`url(#${gradientId})`} />
          <circle cx="36.7" cy="8.6" r="0.9" fill={`url(#${gradientId})`} />
          <circle cx="39.3" cy="8.8" r="0.9" fill={`url(#${gradientId})`} />
          <circle cx="41.4" cy="10.4" r="0.9" fill={`url(#${gradientId})`} />

          {/* Heart shine highlight */}
          <NeonPath
            gradientId={gradientId}
            width={1.05}
            opacity={0.78}
            core={false}
            d="M16.4 19.1c1.5-1.3 3.3-1.2 4.7.2"
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
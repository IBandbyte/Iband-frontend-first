import React, { useId } from "react";

/*
====================================
 iBand Right Rail Icons — Target Replica Pass
====================================

Locked target:
- Thin neon tube
- Crisp bright core
- Controlled glow
- iBand-specific identity
- Mobile-first readability

Icons:
- Like = guitar-heart bubble
- Comment = music-note chat bubble
- Save = bookmark bubble
- Share = flow arrow bubble
- Boost = headphones + battery core
- Info = circular insight icon
*/

const neonGlow = {
  filter: `
    drop-shadow(0 0 0.55px rgba(255,255,255,0.95))
    drop-shadow(0 0 1.8px rgba(236,72,153,0.82))
    drop-shadow(0 0 3px rgba(249,115,22,0.52))
  `,
  overflow: "visible"
};

function cleanId(rawId) {
  return String(rawId).replace(/:/g, "");
}

function IconWrapper({ size = 28, children, label = "iband-icon" }) {
  const rawId = useId();
  const id = cleanId(`${label}-${rawId}`);
  const gradientId = `${id}-gradient`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={neonGlow}
    >
      <defs>
        <linearGradient id={gradientId} x1="4" y1="4" x2="44" y2="44">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="15%" stopColor="#a78bfa" />
          <stop offset="48%" stopColor="#ff2dfc" />
          <stop offset="100%" stopColor="#ff7a18" />
        </linearGradient>
      </defs>

      {children(gradientId)}
    </svg>
  );
}

function neonStroke(gradientId, width = 2.05) {
  return {
    stroke: `url(#${gradientId})`,
    strokeWidth: width,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke"
  };
}

/*
====================================
 LIKE — Guitar Heart Bubble
====================================
*/
export function LikeIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-like">
      {(gradientId) => (
        <>
          <path
            {...neonStroke(gradientId, 2.15)}
            d="M10.5 11.5h27c2.6 0 4.7 2.1 4.7 4.7v14.4c0 2.6-2.1 4.7-4.7 4.7H25.7l-8.7 6.3v-6.3h-6.5c-2.6 0-4.7-2.1-4.7-4.7V16.2c0-2.6 2.1-4.7 4.7-4.7z"
          />

          <path
            {...neonStroke(gradientId, 2.05)}
            d="M23.7 30.5s-7.6-5-9.9-9.1c-2.2-4 2.2-8.2 6-5.5 1.7 1.2 2.7 2.8 3.9 4.7 1.2-1.9 2.2-3.5 3.9-4.7 3.8-2.7 8.2 1.5 6 5.5-2.3 4.1-9.9 9.1-9.9 9.1z"
          />

          <path
            {...neonStroke(gradientId, 1.75)}
            d="M27.6 17.2l6.8-5.3"
          />

          <path
            {...neonStroke(gradientId, 1.75)}
            d="M30.8 14.8l5.7 14.4"
          />

          <path
            {...neonStroke(gradientId, 1.45)}
            d="M34.8 12.2h4.2"
          />

          <circle cx="34.6" cy="9.7" r="1.05" fill={`url(#${gradientId})`} />
          <circle cx="37.8" cy="9.2" r="1.05" fill={`url(#${gradientId})`} />
          <circle cx="40.4" cy="10.5" r="1.05" fill={`url(#${gradientId})`} />
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
      {(gradientId) => (
        <>
          <path
            {...neonStroke(gradientId, 2.1)}
            d="M8.7 10h30.6c2 0 3.7 1.7 3.7 3.7v16.2c0 2-1.7 3.7-3.7 3.7H19.7l-8.2 5.8v-5.8H8.7C6.7 33.6 5 31.9 5 29.9V13.7C5 11.7 6.7 10 8.7 10z"
          />

          <path {...neonStroke(gradientId, 1.75)} d="M13.8 17.4h14.6" />
          <path {...neonStroke(gradientId, 1.75)} d="M13.8 22.8h11.4" />
          <path {...neonStroke(gradientId, 1.75)} d="M13.8 28.2h8.2" />

          <path {...neonStroke(gradientId, 1.8)} d="M32 17.1v10.2" />
          <path {...neonStroke(gradientId, 1.8)} d="M32 17.1l5.3 1.8v3.4" />
          <circle cx="29.6" cy="28.2" r="2.1" fill={`url(#${gradientId})`} />
          <circle cx="35.1" cy="25" r="2.1" fill={`url(#${gradientId})`} />
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
      {(gradientId) => (
        <>
          <path
            {...neonStroke(gradientId, 2.1)}
            d="M9.2 10h29.6c2 0 3.7 1.7 3.7 3.7v16.4c0 2-1.7 3.7-3.7 3.7H19.4l-8 5.7v-5.7H9.2c-2 0-3.7-1.7-3.7-3.7V13.7c0-2 1.7-3.7 3.7-3.7z"
          />

          <path
            {...neonStroke(gradientId, 2)}
            d="M18.2 15.8h12.9c1 0 1.8.8 1.8 1.8v14.7l-8.3-4.7-8.2 4.7V17.6c0-1 .8-1.8 1.8-1.8z"
          />

          <path
            {...neonStroke(gradientId, 1.45)}
            d="M20.3 18.9h10.4"
            opacity="0.72"
          />
        </>
      )}
    </IconWrapper>
  );
}

/*
====================================
 SHARE — Dynamic Flow Arrow Bubble
====================================
*/
export function ShareIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-share">
      {(gradientId) => (
        <>
          <path
            {...neonStroke(gradientId, 2.1)}
            d="M8.8 10.2h30.4c2 0 3.7 1.7 3.7 3.7v16.2c0 2-1.7 3.7-3.7 3.7H19.6l-8.2 5.8v-5.8H8.8c-2 0-3.7-1.7-3.7-3.7V13.9c0-2 1.7-3.7 3.7-3.7z"
          />

          <path
            {...neonStroke(gradientId, 2.15)}
            d="M14 29.7c6.9-8.9 14.1-11.8 22.7-12.6"
          />

          <path
            {...neonStroke(gradientId, 2.15)}
            d="M30.9 11.5l6.5 5.6-5.6 6.5"
          />

          <path
            {...neonStroke(gradientId, 1.45)}
            d="M38.7 10.5l2.7-2.7"
          />
          <path
            {...neonStroke(gradientId, 1.45)}
            d="M41.1 15.1h3.6"
          />
          <path
            {...neonStroke(gradientId, 1.45)}
            d="M38.5 19.4l2.5 2.5"
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
      {(gradientId) => (
        <>
          <path
            {...neonStroke(gradientId, 2.1)}
            d="M12.2 27.5v-5.1C12.2 15.2 17.5 9 24 9s11.8 6.2 11.8 13.4v5.1"
          />

          <path
            {...neonStroke(gradientId, 2.05)}
            d="M8.5 25.8c0-1.3 1-2.3 2.3-2.3h3.4c1.3 0 2.3 1 2.3 2.3v8.1c0 1.3-1 2.3-2.3 2.3h-3.4c-1.3 0-2.3-1-2.3-2.3v-8.1z"
          />

          <path
            {...neonStroke(gradientId, 2.05)}
            d="M31.5 25.8c0-1.3 1-2.3 2.3-2.3h3.4c1.3 0 2.3 1 2.3 2.3v8.1c0 1.3-1 2.3-2.3 2.3h-3.4c-1.3 0-2.3-1-2.3-2.3v-8.1z"
          />

          <rect
            x="18.3"
            y="23.3"
            width="11.4"
            height="7.1"
            rx="1.7"
            {...neonStroke(gradientId, 1.85)}
          />

          <path {...neonStroke(gradientId, 1.35)} d="M21.2 25.6v2.5" />
          <path {...neonStroke(gradientId, 1.35)} d="M24 25.3v2.8" />
          <path {...neonStroke(gradientId, 1.35)} d="M26.8 25.1v3" />
        </>
      )}
    </IconWrapper>
  );
}

/*
====================================
 INFO — Insight / Explanation Icon
====================================
*/
export function InfoIcon({ size = 28 }) {
  return (
    <IconWrapper size={size} label="iband-info">
      {(gradientId) => (
        <>
          <circle
            cx="24"
            cy="24"
            r="17"
            {...neonStroke(gradientId, 2.1)}
          />
          <path
            {...neonStroke(gradientId, 2.25)}
            d="M24 22.2v9.8"
          />
          <circle cx="24" cy="16.5" r="1.75" fill={`url(#${gradientId})`} />
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
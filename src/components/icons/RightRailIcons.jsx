import React from "react";

/*
Captain’s Protocol — Right Rail Icon System (V1)

✔ Clean stroke version (no neon yet)
✔ Designed for upgrade → neon / pulse / momentum
✔ All icons consistent stroke + sizing
✔ TikTok-style vertical rail ready

Icons included:
- Like
- Comment
- Save
- Share
- Boost
*/

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};

const IconWrapper = ({ children, size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    {children}
  </svg>
);

/* =========================
   LIKE (Heart + Guitar Flow)
========================= */
export const LikeIcon = ({ size }) => (
  <IconWrapper size={size}>
    <path
      {...strokeProps}
      d="M24 40s-14-8.5-14-20a8 8 0 0 1 14-5 8 8 0 0 1 14 5c0 11.5-14 20-14 20z"
    />
    <path
      {...strokeProps}
      d="M28 16c3 4 2 8-2 12"
    />
  </IconWrapper>
);

/* =========================
   COMMENT (Music Chat)
========================= */
export const CommentIcon = ({ size }) => (
  <IconWrapper size={size}>
    <path
      {...strokeProps}
      d="M8 10h32v20H20l-6 6v-6H8z"
    />
    <line {...strokeProps} x1="14" y1="16" x2="30" y2="16" />
    <line {...strokeProps} x1="14" y1="22" x2="26" y2="22" />
    <circle {...strokeProps} cx="32" cy="22" r="2" />
  </IconWrapper>
);

/* =========================
   SAVE (Bookmark Bubble)
========================= */
export const SaveIcon = ({ size }) => (
  <IconWrapper size={size}>
    <path
      {...strokeProps}
      d="M10 8h28v30l-14-8-14 8z"
    />
  </IconWrapper>
);

/* =========================
   SHARE (Arrow Flow)
========================= */
export const ShareIcon = ({ size }) => (
  <IconWrapper size={size}>
    <path
      {...strokeProps}
      d="M18 30c10-2 14-10 14-10"
    />
    <path
      {...strokeProps}
      d="M28 14h10v10"
    />
  </IconWrapper>
);

/* =========================
   BOOST (Headphones + Energy Core)
========================= */
export const BoostIcon = ({ size }) => (
  <IconWrapper size={size}>
    <path
      {...strokeProps}
      d="M12 26v-6a12 12 0 0 1 24 0v6"
    />
    <rect
      {...strokeProps}
      x="10"
      y="24"
      width="6"
      height="10"
      rx="2"
    />
    <rect
      {...strokeProps}
      x="32"
      y="24"
      width="6"
      height="10"
      rx="2"
    />
    <rect
      {...strokeProps}
      x="18"
      y="24"
      width="12"
      height="6"
      rx="2"
    />
  </IconWrapper>
);

/* =========================
   EXPORT MAP (future control)
========================= */
export const RightRailIcons = {
  Like: LikeIcon,
  Comment: CommentIcon,
  Save: SaveIcon,
  Share: ShareIcon,
  Boost: BoostIcon
};
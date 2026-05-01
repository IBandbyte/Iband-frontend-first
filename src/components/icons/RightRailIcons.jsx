import React from "react";

const baseStyle = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  display: "block",
  filter: "drop-shadow(0 0 6px rgba(255, 50, 200, 0.6))"
};

function Icon({ src, size = 28 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <img src={src} style={baseStyle} />
    </div>
  );
}

export function LikeIcon(props) {
  return <Icon src="/icons/right-rail/like.png" {...props} />;
}

export function CommentIcon(props) {
  return <Icon src="/icons/right-rail/comment.png" {...props} />;
}

export function SaveIcon(props) {
  return <Icon src="/icons/right-rail/save.png" {...props} />;
}

export function ShareIcon(props) {
  return <Icon src="/icons/right-rail/share.png" {...props} />;
}

export function BoostIcon(props) {
  return <Icon src="/icons/right-rail/boost.png" {...props} />;
}

export function InfoIcon(props) {
  return <Icon src="/icons/right-rail/like.png" {...props} />;
}

export const RightRailIcons = {
  Like: LikeIcon,
  Comment: CommentIcon,
  Save: SaveIcon,
  Share: ShareIcon,
  Boost: BoostIcon,
  Info: InfoIcon
};
export default function IbandGuitarLogo({ size = 72 }) {
  const shadowLeft = "rgba(73, 24, 85, 0.28)";
  const shadowRight = "rgba(96, 41, 74, 0.22)";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="iBand guitar logo"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <defs>
        <radialGradient id="iband-bg" cx="50%" cy="48%" r="58%">
          <stop offset="0%" stopColor="#ff8a45" />
          <stop offset="42%" stopColor="#e85a63" />
          <stop offset="72%" stopColor="#a1378a" />
          <stop offset="100%" stopColor="#5b217c" />
        </radialGradient>

        <linearGradient id="iband-guitar" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fffaf5" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>

        <radialGradient id="iband-glow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="rgba(255,190,110,0.26)" />
          <stop offset="100%" stopColor="rgba(255,190,110,0)" />
        </radialGradient>

        <clipPath id="iband-circle">
          <circle cx="60" cy="60" r="56" />
        </clipPath>
      </defs>

      <circle cx="60" cy="60" r="56" fill="url(#iband-bg)" />
      <circle cx="60" cy="60" r="56" fill="url(#iband-glow)" />

      <g clipPath="url(#iband-circle)">
        <ellipse cx="60" cy="72" rx="36" ry="22" fill="rgba(255,160,90,0.18)" />

        <path
          d="M11 94 C14 78, 24 63, 39 59 C36 67, 36 77, 40 90 C33 94, 23 96, 11 94 Z"
          fill={shadowLeft}
        />
        <circle cx="26" cy="53" r="8.5" fill={shadowLeft} />
        <rect x="24" y="61" width="6" height="18" rx="3" fill={shadowLeft} />
        <rect
          x="29"
          y="67"
          width="13"
          height="3.5"
          rx="1.75"
          transform="rotate(-18 29 67)"
          fill={shadowLeft}
        />

        <path
          d="M80 94 C82 79, 89 66, 102 60 C103 71, 100 83, 95 92 C90 94, 86 95, 80 94 Z"
          fill={shadowRight}
        />
        <circle cx="96" cy="53" r="8.5" fill={shadowRight} />
        <rect x="93" y="61" width="6" height="18" rx="3" fill={shadowRight} />
        <rect
          x="82"
          y="67"
          width="14"
          height="3.5"
          rx="1.75"
          transform="rotate(18 82 67)"
          fill={shadowRight}
        />

        <g fill="url(#iband-guitar)">
          <rect x="55.8" y="16" width="8.4" height="47" rx="4.2" />
          <path d="M58.5 13 C58.5 8, 61 6, 65 6 C68 6, 70 8, 70 11 C70 14, 68.5 16, 66.4 18 L64.2 20 L58.5 20 Z" />
          <path d="M58.4 58 L66 58 L66 77 C66 80.5, 63.8 84, 60.2 87 C58.1 84.2, 57 80.8, 57 77 Z" />
        </g>

        <g fill="#fffaf5">
          <circle cx="51" cy="23.5" r="2.1" />
          <circle cx="51" cy="30.5" r="2.1" />
          <circle cx="51" cy="37.5" r="2.1" />
        </g>
      </g>
    </svg>
  );
}
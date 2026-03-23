export const IBAND_LOGO_SRC =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="ibandBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#a855f7"/>
        <stop offset="52%" stop-color="#f97316"/>
        <stop offset="100%" stop-color="#5b1675"/>
      </linearGradient>
      <filter id="ibandShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="rgba(0,0,0,0.35)"/>
      </filter>
    </defs>

    <circle cx="100" cy="100" r="96" fill="url(#ibandBg)"/>

    <g opacity="0.16" fill="#14081f">
      <circle cx="44" cy="78" r="20"/>
      <circle cx="72" cy="116" r="16"/>
      <circle cx="128" cy="96" r="14"/>
      <circle cx="156" cy="124" r="18"/>
    </g>

    <g filter="url(#ibandShadow)" fill="#fffaf5">
      <rect x="94" y="30" width="14" height="98" rx="7"/>
      <path d="M89 18c0-8 7-14 15-14h8c11 0 20 9 20 20 0 10-6 17-14 21l-10 4V18H89z"/>
      <circle cx="87" cy="30" r="4.5"/>
      <circle cx="87" cy="48" r="4.5"/>
      <circle cx="87" cy="66" r="4.5"/>
    </g>
  </svg>
`);
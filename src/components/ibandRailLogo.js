export const IBAND_LOGO_SRC =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <defs>
    <linearGradient id="ibandBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#a855f7"/>
      <stop offset="52%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#6d28d9"/>
    </linearGradient>

    <radialGradient id="ibandGlow" cx="50%" cy="42%" r="62%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.20)"/>
      <stop offset="70%" stop-color="rgba(255,255,255,0.04)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>

    <linearGradient id="ibandTextFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fffaf2"/>
      <stop offset="100%" stop-color="#f4eadf"/>
    </linearGradient>

    <filter id="ibandShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="7" stdDeviation="7" flood-color="rgba(0,0,0,0.28)"/>
    </filter>
  </defs>

  <circle cx="150" cy="150" r="142" fill="url(#ibandBg)"/>
  <circle cx="150" cy="150" r="142" fill="url(#ibandGlow)"/>

  <g opacity="0.14" fill="#2f103d">
    <path d="M48 194c4-38 18-61 34-72 11-8 23-12 33-13-3-6-4-12-4-18 0-25 20-45 45-45 24 0 44 20 44 45 0 6-1 12-4 18 10 1 22 5 33 13 16 11 30 34 34 72H48z"/>
    <circle cx="90" cy="112" r="20"/>
    <circle cx="150" cy="132" r="18"/>
    <circle cx="225" cy="116" r="22"/>
  </g>

  <g filter="url(#ibandShadow)">
    <rect x="145" y="34" width="15" height="144" rx="7.5" fill="#fffaf2"/>
    <path
      d="M139 24c0-9 8-17 17-17h9c13 0 24 11 24 24 0 12-8 22-19 27l-10 4V24h-21z"
      fill="#fffaf2"
    />
    <circle cx="134" cy="44" r="5.5" fill="#fffaf2"/>
    <circle cx="134" cy="64" r="5.5" fill="#fffaf2"/>
    <circle cx="134" cy="84" r="5.5" fill="#fffaf2"/>
  </g>

  <text
    x="150"
    y="244"
    text-anchor="middle"
    font-size="78"
    font-family="Arial, Helvetica, sans-serif"
    font-weight="700"
    fill="url(#ibandTextFade)"
    letter-spacing="-2"
  >
    iBand
  </text>
</svg>
`);
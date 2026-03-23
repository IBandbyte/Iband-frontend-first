export const IBAND_LOGO_SRC =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="ibandRailBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#b26cff"/>
      <stop offset="48%" stop-color="#ff8a2b"/>
      <stop offset="100%" stop-color="#7a2ed6"/>
    </linearGradient>

    <radialGradient id="ibandRailShine" cx="35%" cy="24%" r="70%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.22)"/>
      <stop offset="45%" stop-color="rgba(255,255,255,0.08)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>

    <filter id="ibandRailShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="rgba(0,0,0,0.26)"/>
    </filter>

    <filter id="ibandRailGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="rgba(255,255,255,0.85)"/>
    </filter>
  </defs>

  <circle cx="200" cy="200" r="190" fill="url(#ibandRailBg)"/>
  <circle cx="200" cy="200" r="190" fill="url(#ibandRailShine)"/>

  <g opacity="0.12" fill="#4d1a52">
    <circle cx="118" cy="154" r="26"/>
    <circle cx="176" cy="212" r="22"/>
    <circle cx="260" cy="172" r="20"/>
    <circle cx="302" cy="232" r="28"/>
  </g>

  <g filter="url(#ibandRailShadow)">
    <rect x="192" y="66" width="20" height="186" rx="10" fill="#fffaf2"/>
    <path
      d="M182 46
         c0-15 12-27 27-27
         h14
         c21 0 38 17 38 38
         c0 18-11 32-28 39
         l-14 5
         V46
         h-37z"
      fill="#fffaf2"
    />
    <circle cx="178" cy="86" r="7" fill="#fffaf2"/>
    <circle cx="178" cy="114" r="7" fill="#fffaf2"/>
    <circle cx="178" cy="142" r="7" fill="#fffaf2"/>
  </g>

  <g filter="url(#ibandRailGlow)" opacity="0.95">
    <rect x="192" y="66" width="20" height="186" rx="10" fill="none" stroke="#ffffff" stroke-width="2"/>
    <path
      d="M182 46
         c0-15 12-27 27-27
         h14
         c21 0 38 17 38 38
         c0 18-11 32-28 39
         l-14 5
         V46
         h-37z"
      fill="none"
      stroke="#ffffff"
      stroke-width="2"
      stroke-linejoin="round"
    />
  </g>
</svg>
`);
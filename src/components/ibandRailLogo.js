export const IBAND_LOGO_SRC =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">

  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#a855f7"/>
      <stop offset="50%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#7c3aed"/>
    </linearGradient>

    <radialGradient id="glow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.25)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>

    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="rgba(0,0,0,0.4)"/>
    </filter>

  </defs>

  <!-- MAIN CIRCLE -->
  <circle cx="150" cy="150" r="140" fill="url(#bg)"/>

  <!-- SOFT GLOW -->
  <circle cx="150" cy="150" r="140" fill="url(#glow)"/>

  <!-- BACKGROUND SILHOUETTES -->
  <g opacity="0.15" fill="#000">
    <circle cx="80" cy="130" r="35"/>
    <circle cx="120" cy="180" r="25"/>
    <circle cx="200" cy="150" r="30"/>
    <circle cx="240" cy="200" r="35"/>
  </g>

  <!-- GUITAR -->
  <g filter="url(#shadow)" fill="#fff6ef">
    <!-- neck -->
    <rect x="145" y="60" width="14" height="140" rx="7"/>

    <!-- head -->
    <path d="M138 40
             c0-10 8-18 18-18
             h10
             c12 0 22 10 22 22
             c0 12-8 20-18 24
             l-10 4
             v-32
             z"/>

    <!-- tuning pegs -->
    <circle cx="135" cy="60" r="5"/>
    <circle cx="135" cy="80" r="5"/>
    <circle cx="135" cy="100" r="5"/>
  </g>

  <!-- IBAND TEXT (SUBTLE, LOWER PART) -->
  <text x="150" y="235"
        text-anchor="middle"
        font-size="48"
        font-family="Arial, sans-serif"
        font-weight="700"
        fill="rgba(255,255,255,0.9)">
    iBand
  </text>

</svg>
`);
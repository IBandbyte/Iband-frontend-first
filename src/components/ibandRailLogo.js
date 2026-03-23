export const IBAND_LOGO_SRC =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="rgba(0,0,0,0.16)"/>
    </filter>
  </defs>

  <circle cx="200" cy="200" r="188" fill="#ffffff"/>

  <g filter="url(#softShadow)" fill="#111111">
    <rect x="193" y="78" width="18" height="184" rx="9"/>
    <path
      d="M182 58
         c0-14 11-25 25-25
         h18
         c22 0 39 17 39 39
         c0 17-10 31-26 39
         l-18 6
         V58
         h-38z"
    />
    <circle cx="176" cy="92" r="7"/>
    <circle cx="176" cy="122" r="7"/>
    <circle cx="176" cy="152" r="7"/>
  </g>

  <circle cx="200" cy="200" r="188" fill="none" stroke="#e7e7e7" stroke-width="6"/>
</svg>
`);
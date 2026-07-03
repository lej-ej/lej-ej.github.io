// Painterly, abstract-expressionist, angular, nature-focused decor.
//
//   1. Full-viewport canvas background: layered oil-pigment washes
//      (ochre / moss / slate / earth) on a deep-pine base, then a
//      fine turbulence noise for canvas grain.
//   2. Hero landscape art: layered angular polygon "mountains" with
//      hand-painted edges (feDisplacementMap on feTurbulence).
//   3. Painterly angular section rules: irregular jagged strokes
//      between sections.

(function () {
  // ── Deterministic helper for painterly filter seeds ───────
  let seedCounter = 3;
  function seed() { return seedCounter++; }

  // ── 1. Canvas background ─────────────────────────────────
  function buildCanvasBg() {
    return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <defs>
        <filter id="canvas-noise" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4"/>
          <feColorMatrix values="0 0 0 0 0.92
                                 0 0 0 0 0.86
                                 0 0 0 0 0.72
                                 0 0 0 0.07 0"/>
        </filter>
        <filter id="wash" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2"/>
        </filter>
      </defs>
      <rect width="100" height="100" fill="#1a1f19"/>
      <!-- broad painterly washes, tilted and overlapping -->
      <ellipse cx="20" cy="18" rx="55" ry="12" fill="#3d5266" opacity="0.28" transform="rotate(-14 20 18)" filter="url(#wash)"/>
      <ellipse cx="78" cy="30" rx="60" ry="14" fill="#4a6b3e" opacity="0.22" transform="rotate(11 78 30)"  filter="url(#wash)"/>
      <ellipse cx="30" cy="52" rx="55" ry="11" fill="#c8843a" opacity="0.15" transform="rotate(-6 30 52)"  filter="url(#wash)"/>
      <ellipse cx="82" cy="70" rx="60" ry="13" fill="#8a3a24" opacity="0.16" transform="rotate(19 82 70)"  filter="url(#wash)"/>
      <ellipse cx="20" cy="88" rx="55" ry="10" fill="#3d5266" opacity="0.24" transform="rotate(-4 20 88)"  filter="url(#wash)"/>
      <!-- fine canvas grain -->
      <rect width="100" height="100" filter="url(#canvas-noise)"/>
    </svg>`;
  }

  // ── 2. Hero landscape (angular painterly mountains) ─────
  function buildHeroArt() {
    const s1 = seed();
    const s2 = seed();
    const s3 = seed();
    return `<svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMax slice">
      <defs>
        <filter id="paint-rough-a" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="2" seed="${s1}"/>
          <feDisplacementMap in="SourceGraphic" scale="8"/>
        </filter>
        <filter id="paint-rough-b" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="${s2}"/>
          <feDisplacementMap in="SourceGraphic" scale="10"/>
        </filter>
        <filter id="paint-rough-c" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="${s3}"/>
          <feDisplacementMap in="SourceGraphic" scale="6"/>
        </filter>
      </defs>
      <!-- painterly sun/moon offset right -->
      <circle cx="920" cy="220" r="130" fill="#d4a02c" opacity="0.55" filter="url(#paint-rough-a)"/>
      <circle cx="920" cy="220" r="90" fill="#d78535" opacity="0.35" filter="url(#paint-rough-a)"/>

      <!-- back mountain range: slate blue -->
      <polygon
        points="0,700 0,520 120,380 260,470 400,340 540,430 680,300 820,410 960,320 1100,400 1200,340 1200,700"
        fill="#3d5266" opacity="0.7"
        filter="url(#paint-rough-b)"/>

      <!-- mid mountain range: moss green -->
      <polygon
        points="0,700 0,570 100,450 240,540 380,420 520,510 660,400 800,490 940,410 1080,500 1200,430 1200,700"
        fill="#4a6b3e" opacity="0.78"
        filter="url(#paint-rough-b)"/>

      <!-- front mountain range: ochre / earth -->
      <polygon
        points="0,700 0,620 130,530 280,590 420,510 560,580 700,500 840,570 980,510 1120,580 1200,540 1200,700"
        fill="#8a3a24" opacity="0.82"
        filter="url(#paint-rough-c)"/>

      <!-- closest silhouette: near-black pine -->
      <polygon
        points="0,700 0,660 160,610 320,660 470,600 620,640 770,590 920,650 1080,620 1200,670 1200,700"
        fill="#1a1f19" opacity="0.9"
        filter="url(#paint-rough-c)"/>

      <!-- angular gestural brushstrokes -->
      <path d="M 80 130 L 260 90 L 300 170 L 100 200 Z" fill="#c8843a" opacity="0.35" filter="url(#paint-rough-a)"/>
      <path d="M 780 90 L 890 130 L 830 180 L 720 150 Z" fill="#4a6b3e" opacity="0.28" filter="url(#paint-rough-a)"/>
      <path d="M 380 70 L 500 100 L 460 160 L 340 130 Z" fill="#eadcb8" opacity="0.14" filter="url(#paint-rough-a)"/>
    </svg>`;
  }

  // ── 3. Painterly angular rule between sections ──────────
  function buildPainterlyRule(colorKey) {
    const colors = {
      ochre: '#c8843a',
      moss:  '#4a6b3e',
      slate: '#3d5266',
      earth: '#8a3a24',
      bone:  '#eadcb8',
    };
    const c = colors[colorKey] || '#c8843a';
    const s = seed();
    // Angular jagged line as a polyline, painterly filter for rough edges.
    return `<svg viewBox="0 0 1000 60" preserveAspectRatio="none">
      <defs>
        <filter id="rule-brush-${s}" x="-5%" y="-30%" width="110%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="${s}"/>
          <feDisplacementMap in="SourceGraphic" scale="6"/>
        </filter>
      </defs>
      <g filter="url(#rule-brush-${s})">
        <polyline
          points="0,30 80,15 180,40 300,20 420,45 540,15 660,40 800,20 900,42 1000,25"
          fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>
        <polyline
          points="30,42 140,32 260,50 380,30 500,52 620,28 740,50 880,32 970,48"
          fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
      </g>
    </svg>`;
  }

  // ── Inject into DOM ─────────────────────────────────────
  const bg = document.querySelector('.canvas-bg');
  if (bg) bg.innerHTML = buildCanvasBg();

  const heroArt = document.querySelector('.hero-art');
  if (heroArt) heroArt.innerHTML = buildHeroArt();

  // Sprinkle painterly rules — rotate palette
  const paletteCycle = ['ochre', 'moss', 'slate', 'earth', 'bone'];
  document.querySelectorAll('.painterly-rule').forEach((el, i) => {
    el.innerHTML = buildPainterlyRule(paletteCycle[i % paletteCycle.length]);
  });
})();

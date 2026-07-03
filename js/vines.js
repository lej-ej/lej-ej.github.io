// Painterly dark-blue background + gold brushstroke spiral.
//
// - Background: fixed SVG with soft blue brushstroke shapes + noise
//   turbulence for a hand-painted feel.
// - Spiral: fixed SVG on the left with a helix path drawn in gold.
//   The path is rendered as three layered strokes (soft underlay,
//   main gradient, bright highlight) and distorted by an SVG
//   turbulence filter for a brushstroke edge. Draws itself via
//   stroke-dashoffset as the user scrolls.

(function () {
  // ────────────────────────────────────────────────────────
  // Background painterly layer
  // ────────────────────────────────────────────────────────
  function buildBackground() {
    return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <defs>
        <filter id="bg-noise" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/>
          <feColorMatrix values="0 0 0 0 0.95
                                 0 0 0 0 0.85
                                 0 0 0 0 0.55
                                 0 0 0 0.06 0"/>
        </filter>
        <filter id="brush-soft" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.2"/>
        </filter>
      </defs>
      <rect width="100" height="100" fill="#0a1626"/>
      <ellipse cx="18" cy="22" rx="42" ry="9"  fill="#152645" opacity="0.55" transform="rotate(-14 18 22)" filter="url(#brush-soft)"/>
      <ellipse cx="72" cy="38" rx="45" ry="10" fill="#0e1c33" opacity="0.55" transform="rotate(18 72 38)"  filter="url(#brush-soft)"/>
      <ellipse cx="25" cy="58" rx="40" ry="8"  fill="#1a2b4a" opacity="0.45" transform="rotate(-8 25 58)"  filter="url(#brush-soft)"/>
      <ellipse cx="80" cy="72" rx="42" ry="9"  fill="#111f38" opacity="0.55" transform="rotate(22 80 72)"  filter="url(#brush-soft)"/>
      <ellipse cx="40" cy="88" rx="45" ry="9"  fill="#162743" opacity="0.5"  transform="rotate(-4 40 88)"  filter="url(#brush-soft)"/>
      <ellipse cx="88" cy="8"  rx="30" ry="6"  fill="#1a2c4c" opacity="0.4"  transform="rotate(10 88 8)"   filter="url(#brush-soft)"/>
      <rect width="100" height="100" filter="url(#bg-noise)"/>
    </svg>`;
  }

  const bg = document.querySelector('.bg-texture');
  if (bg) bg.innerHTML = buildBackground();

  // ────────────────────────────────────────────────────────
  // Gold brushstroke spiral
  // ────────────────────────────────────────────────────────
  // Generate a corkscrew helix path descending down the SVG.
  function spiralPath() {
    const cx = 115;         // horizontal center (viewBox units)
    const startY = 60;
    const rx = 60;          // horizontal amplitude
    const ry = 45;          // vertical amplitude (squished for descent)
    const turns = 7;        // full loops
    const descentPerRad = 22; // vertical descent per radian
    const totalRad = turns * 2 * Math.PI;
    const steps = turns * 60; // resolution per turn

    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * totalRad;
      const x = cx + Math.cos(theta) * rx;
      const y = startY + Math.sin(theta) * ry + descentPerRad * theta;
      pts.push([x.toFixed(2), y.toFixed(2)]);
    }

    // Smooth path via successive line segments — dense enough to look curved.
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i][0]} ${pts[i][1]}`;
    }
    return d;
  }

  function buildSpiral() {
    const d = spiralPath();
    return `<svg viewBox="0 0 230 1400" preserveAspectRatio="xMidYMin meet">
      <defs>
        <linearGradient id="gold-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#f4d689"/>
          <stop offset="45%"  stop-color="#e5c76a"/>
          <stop offset="100%" stop-color="#a88540"/>
        </linearGradient>
        <filter id="brush" x="-8%" y="-2%" width="116%" height="104%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="9"/>
          <feDisplacementMap in="SourceGraphic" scale="5.5"/>
        </filter>
      </defs>
      <g filter="url(#brush)">
        <path class="spiral-under"     d="${d}"/>
        <path class="spiral-main"      d="${d}"/>
        <path class="spiral-highlight" d="${d}"/>
      </g>
    </svg>`;
  }

  const spiralEl = document.querySelector('.spiral');
  if (spiralEl) {
    spiralEl.innerHTML = buildSpiral();

    // Measure path lengths and set up dashoffsets.
    const layers = spiralEl.querySelectorAll('.spiral-under, .spiral-main, .spiral-highlight');
    layers.forEach((p) => {
      const len = p.getTotalLength();
      p.dataset.length = String(len);
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = String(len);
    });

    function scrollProgress() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return 1;
      return Math.max(0, Math.min(1, window.scrollY / max));
    }

    function update() {
      const p = scrollProgress();
      layers.forEach((path) => {
        const len = parseFloat(path.dataset.length);
        path.style.strokeDashoffset = String(len * (1 - p));
      });
    }

    let ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => { update(); ticking = false; });
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('load', update);
    update();
  }
})();

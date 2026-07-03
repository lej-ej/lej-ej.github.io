// Scroll-driven ornamental vines: main stem + tendrils + leaves +
// six-petal flowers + golden pollen. Fantasy / illuminated-manuscript
// feel, not botanical realism.
//
// Everything is inline SVG. The main stem draws itself over the full
// scroll. Tendrils, leaves, flowers, and pollen appear one-by-one at
// scroll thresholds. Pollen drifts continuously once revealed.

(function () {
  // ── Vine content ──────────────────────────────────────────
  // viewBox 300 × 1200. Stretched to fit the fixed .vine box.

  const MAIN_PATH = `
    M 150 0
    C 100 60 220 130 145 220
    S 70 400 145 500
    S 220 620 130 720
    S 60 850 155 950
    S 240 1080 140 1150
    S 100 1180 150 1200
  `.trim().replace(/\s+/g, ' ');

  const TENDRILS = [
    { t: 0.05, d: 'M 145 110 c 30 -12 55 15 25 30 c -20 10 -5 30 15 25 c 15 -4 20 -25 5 -30' },
    { t: 0.12, d: 'M 175 220 c 35 10 50 -20 25 -40 c -25 -18 -55 5 -50 30 c 5 25 40 35 55 15 c 12 -16 -5 -30 -20 -25' },
    { t: 0.20, d: 'M 115 340 c -30 -5 -55 20 -30 40 c 25 20 55 5 50 -20 c -3 -18 -30 -25 -40 -10 c -6 8 5 20 15 15' },
    { t: 0.28, d: 'M 195 460 c 30 15 50 -20 25 -40 c -25 -18 -55 -5 -55 25 c 0 25 30 40 55 20 c 15 -12 -3 -25 -20 -18' },
    { t: 0.36, d: 'M 110 580 c -35 5 -55 30 -25 45 c 25 12 50 -10 40 -30 c -8 -15 -30 -10 -30 5' },
    { t: 0.44, d: 'M 200 700 c 25 -18 55 5 45 30 c -10 25 -50 25 -55 -5 c -3 -20 25 -30 40 -20 c 12 8 5 18 -8 15' },
    { t: 0.52, d: 'M 125 820 c -40 15 -55 -10 -30 -35 c 25 -22 55 -12 60 15 c 3 25 -30 40 -50 30' },
    { t: 0.60, d: 'M 190 930 c 40 20 55 -15 30 -35 c -25 -18 -55 -8 -55 20 c 0 22 25 35 45 25' },
    { t: 0.68, d: 'M 105 1030 c -30 5 -45 30 -20 45 c 25 15 50 -10 45 -30 c -5 -15 -30 -12 -30 5' },
    { t: 0.76, d: 'M 200 1110 c 30 -10 55 15 30 40 c -22 22 -55 5 -55 -20' },
    { t: 0.82, d: 'M 130 1160 c -25 15 -45 -15 -20 -30 c 25 -12 50 5 50 25' },
    { t: 0.88, d: 'M 205 1180 c 25 5 40 -25 20 -35 c -20 -8 -35 15 -20 25' },
  ];

  const LEAVES = [
    { t: 0.03, cx: 170, cy:  55, rx:  8, ry: 14, rot: -15 },
    { t: 0.10, cx: 115, cy: 180, rx:  5, ry:  9, rot:  25 },
    { t: 0.16, cx: 200, cy: 275, rx: 11, ry: 18, rot: -25 },
    { t: 0.24, cx: 100, cy: 400, rx:  6, ry: 11, rot:  30 },
    { t: 0.32, cx: 215, cy: 510, rx: 12, ry: 20, rot: -15 },
    { t: 0.40, cx: 100, cy: 625, rx:  8, ry: 14, rot:  25 },
    { t: 0.48, cx: 205, cy: 755, rx: 11, ry: 18, rot: -20 },
    { t: 0.56, cx: 115, cy: 875, rx:  7, ry: 12, rot:  30 },
    { t: 0.64, cx: 195, cy: 975, rx: 10, ry: 17, rot: -15 },
    { t: 0.72, cx: 115, cy: 1085, rx: 8, ry: 13, rot:  25 },
    { t: 0.80, cx: 195, cy: 1145, rx: 9, ry: 15, rot: -30 },
    { t: 0.86, cx: 130, cy: 1180, rx: 6, ry: 10, rot:  20 },
  ];

  const FLOWERS = [
    { t: 0.15, x: 225, y:  345, r: 6 },
    { t: 0.30, x:  95, y:  485, r: 7 },
    { t: 0.48, x: 225, y:  700, r: 5.5 },
    { t: 0.65, x:  90, y:  905, r: 7.5 },
    { t: 0.82, x: 205, y: 1080, r: 6.5 },
  ];

  const POLLEN = [
    { t: 0.08, cx:  60, cy: 180, r: 2 },
    { t: 0.14, cx: 245, cy: 290, r: 1.5 },
    { t: 0.20, cx:  85, cy: 425, r: 2.5 },
    { t: 0.28, cx: 230, cy: 555, r: 1.5 },
    { t: 0.36, cx:  70, cy: 665, r: 2 },
    { t: 0.42, cx: 220, cy: 790, r: 2.5 },
    { t: 0.50, cx:  65, cy: 890, r: 1.5 },
    { t: 0.58, cx: 235, cy: 980, r: 2 },
    { t: 0.65, cx:  80, cy: 1080, r: 2.5 },
    { t: 0.72, cx: 240, cy: 1150, r: 1.5 },
    { t: 0.05, cx:  55, cy:  90, r: 1.5 },
    { t: 0.55, cx: 155, cy: 850, r: 2 },
  ];

  // ── SVG builder ───────────────────────────────────────────
  function buildSvg() {
    const flower = (f) => `
      <g class="flower" data-threshold="${f.t}" transform="translate(${f.x} ${f.y})">
        <circle cx="0"   cy="-${(f.r + 3)}" r="${f.r}"/>
        <circle cx="${(f.r + 2)}"  cy="-${(f.r * 0.4).toFixed(1)}"  r="${f.r}"/>
        <circle cx="${(f.r + 2)}"  cy="${(f.r * 0.6).toFixed(1)}"   r="${f.r}"/>
        <circle cx="0"   cy="${(f.r + 4)}"  r="${f.r}"/>
        <circle cx="-${(f.r + 2)}" cy="${(f.r * 0.6).toFixed(1)}"   r="${f.r}"/>
        <circle cx="-${(f.r + 2)}" cy="-${(f.r * 0.4).toFixed(1)}"  r="${f.r}"/>
        <circle class="flower-center" cx="0" cy="0" r="${(f.r * 0.55).toFixed(1)}"/>
      </g>`;

    return `<svg viewBox="0 0 300 1200" preserveAspectRatio="none">
      <path class="main-vine" d="${MAIN_PATH}"/>
      ${TENDRILS.map(t => `<path class="tendril" data-threshold="${t.t}" d="${t.d}"/>`).join('')}
      ${LEAVES.map(l => `<ellipse class="leaf" data-threshold="${l.t}" cx="${l.cx}" cy="${l.cy}" rx="${l.rx}" ry="${l.ry}" transform="rotate(${l.rot} ${l.cx} ${l.cy})"/>`).join('')}
      ${FLOWERS.map(flower).join('')}
      ${POLLEN.map(p => `<circle class="pollen" data-threshold="${p.t}" cx="${p.cx}" cy="${p.cy}" r="${p.r}"/>`).join('')}
    </svg>`;
  }

  // ── Inject SVG into both vine containers ──────────────────
  const containers = document.querySelectorAll('.vine');
  if (!containers.length) return;
  containers.forEach((el) => { el.innerHTML = buildSvg(); });

  // ── Cache draw-paths and measure lengths ──────────────────
  const drawPaths = document.querySelectorAll('.main-vine, .tendril');
  drawPaths.forEach((p) => {
    const len = p.getTotalLength();
    p.dataset.length = String(len);
    p.style.strokeDasharray = String(len);
    p.style.strokeDashoffset = String(len);
  });

  const mainPaths  = document.querySelectorAll('.main-vine');
  const tendrils   = document.querySelectorAll('.tendril');
  const leafEls    = document.querySelectorAll('.leaf');
  const flowerEls  = document.querySelectorAll('.flower');
  const pollenEls  = document.querySelectorAll('.pollen');

  // ── Scroll-driven update ──────────────────────────────────
  const TENDRIL_DUR = 0.14;
  const LEAF_DUR    = 0.09;
  const FLOWER_DUR  = 0.10;

  function scrollProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return 1;
    return Math.max(0, Math.min(1, window.scrollY / max));
  }

  function update() {
    const p = scrollProgress();

    // Main stem — draws smoothly over full scroll
    mainPaths.forEach((path) => {
      const len = parseFloat(path.dataset.length);
      path.style.strokeDashoffset = String(len * (1 - p));
    });

    // Tendrils — draw locally once threshold crossed
    tendrils.forEach((path) => {
      const t = parseFloat(path.dataset.threshold || '0');
      const local = Math.max(0, Math.min(1, (p - t) / TENDRIL_DUR));
      const len = parseFloat(path.dataset.length);
      path.style.strokeDashoffset = String(len * (1 - local));
    });

    // Leaves — fade + scale + rotate
    leafEls.forEach((el) => {
      const t = parseFloat(el.dataset.threshold || '0');
      const k = Math.max(0, Math.min(1, (p - t) / LEAF_DUR));
      el.style.opacity = String(k);
      el.style.scale = String(0.3 + 0.7 * k);
      el.style.rotate = `${-25 + 50 * k}deg`;
    });

    // Flowers — bloom (opacity + scale + slight rotate)
    flowerEls.forEach((el) => {
      const t = parseFloat(el.dataset.threshold || '0');
      const k = Math.max(0, Math.min(1, (p - t) / FLOWER_DUR));
      el.style.opacity = String(k);
      el.style.scale = String(0.15 + 0.85 * k);
      el.style.rotate = `${-20 + 40 * k}deg`;
    });

    // Pollen — reveal on threshold, then CSS handles drift
    pollenEls.forEach((el) => {
      const t = parseFloat(el.dataset.threshold || '0');
      el.classList.toggle('revealed', p >= t);
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
})();

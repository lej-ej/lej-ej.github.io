// Scroll-driven vine animation.
//
// On load/resize:
//  - Measure actual document height in pixels.
//  - Size each vine SVG to that height (no clipping).
//  - Generate a wavy main stem that fills the height.
//  - Generate ~1 branch per 170px of document, with pseudo-random
//    variation in position, length, angle, curl, and leaf count.
//
// On scroll:
//  - Main stem draws from top down using stroke-dashoffset.
//  - Branches pop-and-draw when scroll progress crosses their y-threshold.

(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const WAVE_PERIOD = 380;         // px — wavelength of the main stem
  const AMPLITUDE = 22;            // horizontal wave amplitude in viewBox units
  const CENTER_X = 55;             // horizontal center of the vine
  const VIEWBOX_W = 110;           // viewBox width — a bit wider than element width

  // Deterministic pseudo-random from a seed integer, in [0, 1).
  function rand(seed) {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  // Estimate stem x-coordinate at a given y for a given side.
  function stemXAt(y, side) {
    const phase = (y / (WAVE_PERIOD * 2)) * 2 * Math.PI;
    const sign = side === 'left' ? -1 : 1;
    return CENTER_X + sign * Math.sin(phase) * AMPLITUDE;
  }

  function specForBranch(i, side, docHeight) {
    // Base y-position, evenly spaced with jitter for irregularity.
    const per = Math.max(140, docHeight / 20);
    const yBase = 60 + i * per;
    const yJitter = (rand(i * 3 + 1) - 0.5) * (per * 0.6);
    const y = Math.max(30, Math.min(docHeight - 30, yBase + yJitter));

    const stemX = stemXAt(y, side);

    // Direction: extend outward from the wave (branches leave the stem
    // in the direction it's already leaning).
    const outward = stemX < CENTER_X ? -1 : 1;
    // Occasionally reverse for variety.
    const dir = rand(i * 5 + 2) < 0.15 ? -outward : outward;

    // Length varies from short tendril to long branch.
    const lenR = rand(i * 7 + 3);
    const length = 18 + lenR * 70;

    // Tip position.
    const angleJit = (rand(i * 11 + 4) - 0.5) * 55;
    const tx = stemX + dir * length;
    const ty = y + angleJit;

    // Control point defines the curve shape.
    const cxJit = (rand(i * 13 + 5) - 0.5) * 25;
    const cx = stemX + dir * length * 0.35 + cxJit;
    const cy = y + (rand(i * 17 + 6) - 0.5) * 35;

    // Leaf orientation.
    const rot = dir * (25 + rand(i * 19 + 7) * 65);

    // Sometimes clusters (extra leaf), sometimes curls at the tip.
    const cluster = rand(i * 23 + 8) > 0.5;
    const curl = rand(i * 29 + 9) > 0.65;
    const size = 0.75 + rand(i * 31 + 10) * 0.55; // leaf scale

    return { ox: stemX, oy: y, tx, ty, cx, cy, rot, dir, cluster, curl, size };
  }

  function makeBranch(spec) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'branch');

    // --- branch path (with optional curl at the tip) ---
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('class', 'branch-path');
    let d = `M ${spec.ox.toFixed(2)} ${spec.oy.toFixed(2)} `
          + `Q ${spec.cx.toFixed(2)} ${spec.cy.toFixed(2)} `
          + `${spec.tx.toFixed(2)} ${spec.ty.toFixed(2)}`;
    if (spec.curl) {
      const d1 = spec.dir;
      // Small hook/curl at the tip
      d += ` q ${(-d1 * 4).toFixed(2)} ${(-6).toFixed(2)} `
        + `${(-d1 * 8).toFixed(2)} ${(-2).toFixed(2)} `
        + `q ${(-d1 * 4).toFixed(2)} ${(4).toFixed(2)} `
        + `${(-d1 * 2).toFixed(2)} ${(8).toFixed(2)}`;
    }
    path.setAttribute('d', d);
    g.appendChild(path);

    // --- main leaf ---
    const s = spec.size;
    const d1 = spec.dir;
    const leaf1 = document.createElementNS(SVG_NS, 'path');
    leaf1.setAttribute('class', 'branch-leaf');
    leaf1.setAttribute(
      'transform',
      `translate(${spec.tx.toFixed(2)} ${spec.ty.toFixed(2)}) rotate(${spec.rot.toFixed(1)}) scale(${s.toFixed(2)})`
    );
    leaf1.setAttribute(
      'd',
      `M 0 0 Q ${d1 * 12} -3 ${d1 * 15} -15 Q ${d1 * 4} -19 0 0 Z`
    );
    g.appendChild(leaf1);

    // --- clustered second leaf (smaller, opposite tilt) ---
    if (spec.cluster) {
      const leaf2 = document.createElementNS(SVG_NS, 'path');
      leaf2.setAttribute('class', 'branch-leaf');
      leaf2.setAttribute(
        'transform',
        `translate(${(spec.tx + d1 * -3).toFixed(2)} ${(spec.ty + 3).toFixed(2)}) rotate(${(-spec.rot * 0.55).toFixed(1)}) scale(${(s * 0.75).toFixed(2)})`
      );
      leaf2.setAttribute(
        'd',
        `M 0 0 Q ${d1 * 9} -2 ${d1 * 11} -11 Q ${d1 * 3} -14 0 0 Z`
      );
      g.appendChild(leaf2);
    }

    return { group: g, path };
  }

  function setupVine(svg, docHeight) {
    const side = svg.classList.contains('vine-left') ? 'left' : 'right';

    svg.setAttribute('viewBox', `0 0 ${VIEWBOX_W} ${docHeight}`);
    svg.style.height = docHeight + 'px';

    // --- main stem: wavy path spanning docHeight ---
    const numWaves = Math.max(4, Math.round(docHeight / WAVE_PERIOD));
    const period = docHeight / numWaves;
    const halfPeriodOffset = side === 'left' ? -AMPLITUDE : AMPLITUDE;
    let stemD = `M ${CENTER_X} 0 Q ${CENTER_X + halfPeriodOffset} ${(period / 2).toFixed(2)} ${CENTER_X} ${period.toFixed(2)}`;
    for (let i = 1; i < numWaves; i++) {
      stemD += ` T ${CENTER_X} ${((i + 1) * period).toFixed(2)}`;
    }
    const stemPath = svg.querySelector('.vine-main');
    stemPath.setAttribute('d', stemD);

    // --- branches ---
    const bg = svg.querySelector('.branches');
    bg.innerHTML = '';
    const numBranches = Math.max(8, Math.floor(docHeight / 170));
    // Small side-specific salt so left and right vines aren't identical
    const salt = side === 'left' ? 0 : 1000;
    const branches = [];
    for (let i = 0; i < numBranches; i++) {
      const spec = specForBranch(i + salt, side, docHeight);
      const { group, path } = makeBranch(spec);
      bg.appendChild(group);
      const len = path.getTotalLength();
      path.style.setProperty('--length', String(len));
      path.style.strokeDasharray = String(len);
      const threshold = Math.max(0, spec.oy / docHeight - 0.03);
      group.dataset.threshold = String(threshold);
      branches.push(group);
    }

    return { branches, stemPath };
  }

  let state = null;

  function setupAll() {
    const docHeight = document.documentElement.scrollHeight;
    const container = document.querySelector('.vines');
    if (container) container.style.height = docHeight + 'px';

    const branches = [];
    const mainPaths = [];
    document.querySelectorAll('.vine').forEach((v) => {
      const r = setupVine(v, docHeight);
      branches.push(...r.branches);
      if (r.stemPath) mainPaths.push(r.stemPath);
    });

    const mainLengths = new WeakMap();
    mainPaths.forEach((p) => {
      const len = p.getTotalLength();
      mainLengths.set(p, len);
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });

    state = { branches, mainPaths, mainLengths, docHeight };
    update();
  }

  function scrollProgress() {
    const scrollable =
      document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return 1;
    return Math.max(0, Math.min(1, window.scrollY / scrollable));
  }

  function update() {
    if (!state) return;
    const p = scrollProgress();
    state.mainPaths.forEach((path) => {
      const len = state.mainLengths.get(path);
      path.style.strokeDashoffset = len * (1 - p);
    });
    state.branches.forEach((b) => {
      const t = parseFloat(b.dataset.threshold || '0');
      b.classList.toggle('visible', p >= t);
    });
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
      ticking = true;
    }
  }

  let resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setupAll, 150);
  }

  setupAll();
  // Re-run after fonts/images load to catch any final layout changes.
  window.addEventListener('load', setupAll);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
})();

// Scroll-driven vine animation.
// Main stem draws smoothly with scroll progress.
// Branches (with leaves) pop in one-by-one as scroll passes each threshold.

(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // 12 branches per vine, evenly spaced from y=200 to y=4600.
  // Left vine: origin points alternate x=40 (extending left/out) and x=80 (extending right/in).
  // Right vine: mirror — origin points x=80 extend right/out and x=40 extend left/in.
  const YS = [200, 600, 1000, 1400, 1800, 2200, 2600, 3000, 3400, 3800, 4200, 4600];

  function specsFor(vineSide, maxY) {
    // vineSide: 'left' or 'right' (which vine we're on)
    // Left vine main stem oscillates: y=200→x=40, y=600→x=80, y=1000→x=40, ...
    // Right vine main stem oscillates opposite: y=200→x=80, y=600→x=40, ...
    return YS.filter((y) => y <= maxY).map((y, i) => {
      const evenIdx = i % 2 === 0;
      // Determine origin x on main stem at this y
      const ox = vineSide === 'left'
        ? (evenIdx ? 40 : 80)
        : (evenIdx ? 80 : 40);
      // Extend outward: from x=40 → left (tx=8); from x=80 → right (tx=112)
      const goesLeft = ox === 40;
      const tx = goesLeft ? 8 : 112;
      const ty = y + (i % 3 === 0 ? -18 : (i % 3 === 1 ? 20 : 0));
      // Control point curves the branch
      const cx = (ox + tx) / 2;
      const cy = y + (goesLeft ? -6 : 6);
      return { ox, oy: y, tx, ty, cx, cy, goesLeft };
    });
  }

  function makeBranch(spec) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'branch');
    // Threshold slightly before the branch's y so it appears as user scrolls past.
    const threshold = Math.max(0, spec.oy / 5000 - 0.02);
    g.setAttribute('data-threshold', String(threshold));

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('class', 'branch-path');
    path.setAttribute(
      'd',
      `M ${spec.ox} ${spec.oy} Q ${spec.cx} ${spec.cy} ${spec.tx} ${spec.ty}`
    );
    g.appendChild(path);

    // Leaf at branch tip
    const leaf = document.createElementNS(SVG_NS, 'path');
    leaf.setAttribute('class', 'branch-leaf');
    const dir = spec.goesLeft ? -1 : 1;
    const rot = spec.goesLeft ? -55 : 55;
    leaf.setAttribute(
      'transform',
      `translate(${spec.tx} ${spec.ty}) rotate(${rot})`
    );
    leaf.setAttribute(
      'd',
      `M 0 0 Q ${dir * 12} -3 ${dir * 14} -14 Q ${dir * 4} -18 0 0 Z`
    );
    g.appendChild(leaf);

    return { group: g, path };
  }

  function setupVine(svg) {
    if (!svg) return [];
    const bg = svg.querySelector('.branches');
    if (!bg) return [];
    const side = svg.classList.contains('vine-left') ? 'left' : 'right';
    const viewBox = svg.getAttribute('viewBox').split(/\s+/).map(Number);
    const maxY = viewBox[3];
    const specs = specsFor(side, maxY);
    const created = [];
    specs.forEach((spec) => {
      const { group, path } = makeBranch(spec);
      bg.appendChild(group);
      // Now the path is in the DOM — measure its length.
      const len = path.getTotalLength();
      path.style.setProperty('--length', String(len));
      path.style.strokeDasharray = String(len);
      created.push(group);
    });
    return created;
  }

  const vines = document.querySelectorAll('.vine');
  const branches = [];
  vines.forEach((v) => branches.push(...setupVine(v)));

  const mainPaths = document.querySelectorAll('.vine-main');
  const mainLengths = new WeakMap();
  mainPaths.forEach((p) => {
    const len = p.getTotalLength();
    mainLengths.set(p, len);
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });

  function scrollProgress() {
    const scrollable =
      document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return 1;
    return Math.max(0, Math.min(1, window.scrollY / scrollable));
  }

  function update() {
    const p = scrollProgress();
    mainPaths.forEach((path) => {
      const len = mainLengths.get(path);
      path.style.strokeDashoffset = len * (1 - p);
    });
    branches.forEach((b) => {
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

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

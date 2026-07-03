// Scroll-driven vine animation.
// Vines "draw" themselves as the user scrolls, and leaves fade in
// when scroll progress passes their threshold.

(function () {
  const vinePaths = document.querySelectorAll('.vine-path');
  const leaves = document.querySelectorAll('.leaf');
  if (!vinePaths.length) return;

  const lengths = new WeakMap();
  vinePaths.forEach((p) => {
    const len = p.getTotalLength();
    lengths.set(p, len);
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });

  function scrollProgress() {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return 1;
    return Math.max(0, Math.min(1, window.scrollY / scrollable));
  }

  function update() {
    const progress = scrollProgress();
    vinePaths.forEach((p) => {
      const len = lengths.get(p);
      p.style.strokeDashoffset = len * (1 - progress);
    });
    leaves.forEach((l) => {
      const threshold = parseFloat(l.dataset.threshold || '0');
      if (progress >= threshold) {
        l.classList.add('visible');
      } else {
        l.classList.remove('visible');
      }
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

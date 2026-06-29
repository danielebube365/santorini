(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- sticky nav state ---------- */
  const nav = $('#nav');
  const onScroll = () => {
    if (window.scrollY > 32) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  const toggle = $('#navToggle');
  const mobile = $('#navMobile');
  if (toggle && mobile) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      if (open) {
        mobile.hidden = false;
        document.body.style.overflow = 'hidden';
      } else {
        mobile.hidden = true;
        document.body.style.overflow = '';
      }
    };
    toggle.addEventListener('click', () =>
      setOpen(toggle.getAttribute('aria-expanded') !== 'true')
    );
    $$('a', mobile).forEach((a) => a.addEventListener('click', () => setOpen(false)));
  }

  /* ---------- year ---------- */
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- video autoplay (Chrome policy needs explicit kick) ---------- */
  const reducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('video[autoplay]').forEach((v) => {
    if (reducedMotion) {
      v.autoplay = false;
      v.pause();
      v.removeAttribute('autoplay');
      return;
    }
    // Ensure muted before play (browsers block unmuted autoplay)
    v.muted = true;
    v.setAttribute('muted', '');
    const tryPlay = () => v.play().catch(() => {});
    if (v.readyState >= 2) tryPlay();
    else v.addEventListener('loadeddata', tryPlay, { once: true });
    // Re-kick on visibility return
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && v.paused) tryPlay();
    });
  });

  /* ---------- scroll-reveal ---------- */
  const reveals = new Set($$('.reveal'));
  const reveal = (el) => {
    if (el.classList.contains('is-visible')) return;
    const delay = parseInt(el.dataset.revDelay || '0', 10);
    setTimeout(() => el.classList.add('is-visible'), delay);
    reveals.delete(el);
  };
  const checkReveals = () => {
    const vh = window.innerHeight;
    reveals.forEach((el) => {
      const r = el.getBoundingClientRect();
      // reveal if any part of the element is within the lower 92% of the viewport
      if (r.top < vh * 0.92 && r.bottom > 0) reveal(el);
    });
  };

  // run on next frame, on scroll, on resize, and via IO as a sanity belt
  requestAnimationFrame(checkReveals);
  document.addEventListener('scroll', checkReveals, { passive: true });
  window.addEventListener('resize', checkReveals);

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && reveal(e.target)),
      { threshold: 0.05 }
    );
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- animated stat counters ---------- */
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const isFloat = !Number.isInteger(target);
    const dur = 1600;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const v = target * easeOut(t);
      el.textContent = (isFloat ? v.toFixed(1) : Math.round(v)) + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = (isFloat ? target.toFixed(1) : target) + suffix;
    };
    requestAnimationFrame(tick);
  };
  const statsIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        statsIo.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );
  $$('.stat__num').forEach((el) => statsIo.observe(el));
})();

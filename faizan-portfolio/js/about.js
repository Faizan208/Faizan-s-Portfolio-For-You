/* Lightweight page entrance animation; content remains visible without JS. */
(() => {
  'use strict';
  const items = document.querySelectorAll('.about-reveal');
  if (!items.length || !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('about-can-reveal');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px 65px 0px' });
  items.forEach(item => observer.observe(item));
})();

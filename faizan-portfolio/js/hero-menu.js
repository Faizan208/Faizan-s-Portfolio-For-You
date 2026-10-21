/* Small accessible menu visible only while the homepage hero is in view. */
(() => {
  'use strict';
  const root = document.getElementById('heroPageMenu');
  const toggle = document.getElementById('heroMenuToggle');
  const panel = document.getElementById('heroMenuPanel');
  const work = document.getElementById('featured-work');
  if (!root || !toggle || !panel || !work) return;

  // Keep the original blue-letter cursor spotlight off interactive controls.
  root.addEventListener('pointerenter', () => {
    document.getElementById('hero')?.dispatchEvent(new Event('pointerleave'));
  });
  root.addEventListener('pointermove', event => event.stopPropagation());

  const close = (restoreFocus = false) => {
    if (panel.hidden) return;
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open page menu');
    if (restoreFocus) toggle.focus();
  };

  toggle.addEventListener('click', () => {
    const shouldOpen = panel.hidden;
    panel.hidden = !shouldOpen;
    toggle.setAttribute('aria-expanded', String(shouldOpen));
    toggle.setAttribute('aria-label', shouldOpen ? 'Close page menu' : 'Open page menu');
    if (shouldOpen) panel.querySelector('a')?.focus();
  });
  document.addEventListener('pointerdown', event => {
    if (!root.contains(event.target)) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) close(true);
  });
  panel.addEventListener('click', event => {
    if (event.target.closest('a')) close();
  });

  // Work is visually moved by the existing hero transition. Once it fills
  // the top of the viewport, remove the hero-only menu (and its focus targets).
  let ticking = false;
  const updateVisibility = () => {
    ticking = false;
    const gone = work.getBoundingClientRect().top <= Math.max(8, innerHeight * 0.04);
    root.classList.toggle('is-past-hero', gone);
    if (gone) close();
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateVisibility);
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  updateVisibility();
})();

/* FAIZAN — fixed hero + scroll reveal of the next section.
   Plain JavaScript only. No portrait/title/background parallax. */
(() => {
  'use strict';

  const scene = document.getElementById('heroScrollScene');
  const hero = document.getElementById('hero');
  const stage = document.getElementById('heroStage');
  const projects = document.getElementById('featured-work');
  const ring = document.getElementById('cursorRing');
  if (!scene || !hero || !stage || !projects || !ring) return;

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileQuery = window.matchMedia('(max-width: 700px)');
  const ART_WIDTH = 1672;
  const clamp = (v, low = 0, high = 1) => Math.min(high, Math.max(low, v));
  const smoothstep = v => { const p = clamp(v); return p * p * (3 - 2 * p); };
  const range = (p, from, to) => smoothstep((p - from) / (to - from));

  document.documentElement.classList.add('has-scroll');
  let scrollFrame = 0;
  let cursorFrame = 0;
  let sceneTravel = 1;
  let viewportHeight = window.innerHeight;
  let bounds = stage.getBoundingClientRect();
  let baseRadius = 220;
  let active = false;
  let hasPosition = false;
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;

  function refreshGeometry() {
    viewportHeight = window.innerHeight;
    sceneTravel = Math.max(1, scene.offsetHeight - viewportHeight);
    bounds = stage.getBoundingClientRect();
    baseRadius = Math.max(118, Math.min(230, 220 * bounds.width / ART_WIDTH));
  }

  // The ring follows the pointer ANYWHERE in the visible hero, not
  // merely inside the large FAIZAN lettering. The transparent blue PNG
  // continues to restrict the actual color reveal to the letter pixels.
  function withinHero(x, y) {
    const area = hero.getBoundingClientRect();
    return x >= area.left && x <= area.right &&
           y >= area.top && y <= area.bottom;
  }

  function drawRing(x, y) {
    // Prevent the complete cursor ring from being clipped by the viewport.
    const radius = Math.max(18, Math.min(
      baseRadius, x - 6, window.innerWidth - x - 6,
      y - 6, window.innerHeight - y - 6
    ));
    stage.style.setProperty('--reveal-radius', `${radius}px`);
    stage.style.setProperty('--reveal-feather', `${radius * 0.28}px`);
    stage.style.setProperty('--reveal-x', `${x - bounds.left}px`);
    stage.style.setProperty('--reveal-y', `${y - bounds.top}px`);
    ring.style.setProperty('--ring-diameter', `${radius * 2}px`);
    ring.style.transform = `translate3d(${x - radius}px, ${y - radius}px, 0)`;
  }

  function animateCursor() {
    cursorFrame = 0;
    if (!active) return;
    const easing = reducedMotion.matches ? 1 : 0.48;
    currentX += (targetX - currentX) * easing;
    currentY += (targetY - currentY) * easing;
    if (Math.abs(currentX - targetX) < 0.15) currentX = targetX;
    if (Math.abs(currentY - targetY) < 0.15) currentY = targetY;
    drawRing(currentX, currentY);
    if (currentX !== targetX || currentY !== targetY) {
      cursorFrame = requestAnimationFrame(animateCursor);
    }
  }

  function deactivate() {
    active = false;
    hasPosition = false;
    hero.classList.remove('is-active');
    if (cursorFrame) cancelAnimationFrame(cursorFrame);
    cursorFrame = 0;
  }

  function onPointer(event) {
    if (!finePointer.matches || event.pointerType === 'touch') return deactivate();
    if (!withinHero(event.clientX, event.clientY)) return deactivate();
    targetX = event.clientX;
    targetY = event.clientY;
    if (!hasPosition) {
      currentX = targetX;
      currentY = targetY;
      hasPosition = true;
      drawRing(currentX, currentY);
    }
    if (!active) { active = true; hero.classList.add('is-active'); }
    if (!cursorFrame) cursorFrame = requestAnimationFrame(animateCursor);
  }

  function applyScroll() {
    scrollFrame = 0;
    const p = clamp(-scene.getBoundingClientRect().top / sceneTravel);
    const reduced = reducedMotion.matches;
    const nextP = range(p, 0.45, 1.00);
    const cutP = reduced ? range(p, 0.50, 1.00) : range(p, 0.46, 1.00);
    const nextOffset = reduced ? 0 : viewportHeight * (mobileQuery.matches ? 0.06 : 0.12) * (1 - nextP);

    // ONLY animate the section handoff: hero artwork stays at precisely
    // its original coordinates (no portrait / lettering / details transforms).
    hero.style.setProperty('--hero-cut', `${(100 * cutP).toFixed(3)}%`);
    projects.style.setProperty('--projects-y', `${nextOffset.toFixed(2)}px`);

    if (active) {
      bounds = stage.getBoundingClientRect();
      if (!withinHero(targetX, targetY) || p >= 0.95) deactivate();
      else drawRing(currentX, currentY);
    }
  }

  function queueScroll() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(applyScroll);
  }

  function onResize() { refreshGeometry(); queueScroll(); }

  refreshGeometry();
  applyScroll();
  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize, { passive: true });
  hero.addEventListener('pointermove', onPointer, { passive: true });
  hero.addEventListener('pointerleave', deactivate);
  window.addEventListener('blur', deactivate);
  reducedMotion.addEventListener('change', queueScroll);
  finePointer.addEventListener('change', () => { deactivate(); queueScroll(); });
})();

/* Work index — scroll entry and honest project-detail actions.
   No external dependencies. Text is read from editable project HTML. */
(() => {
  'use strict';
  const dialog = document.getElementById('projectDialog');
  const title = document.getElementById('dialogTitle');
  const category = document.getElementById('dialogCategory');
  const description = document.getElementById('dialogDescription');
  const tags = document.getElementById('dialogTags');
  const closeButton = document.getElementById('dialogClose');
  if (!dialog || !title || !category || !description || !tags || !closeButton) return;

  let previouslyFocused = null;
  function openDetails(id) {
    const card = document.getElementById(id);
    if (!card) return;
    title.textContent = card.querySelector('.project-name')?.textContent?.trim() || 'Project';
    category.textContent = card.querySelector('.project-category')?.textContent?.trim() || '';
    description.textContent = card.querySelector('.project-description')?.textContent?.trim() || '';
    tags.replaceChildren();
    card.querySelectorAll('.tech-list span').forEach(item => {
      const tag = document.createElement('span');
      tag.textContent = item.textContent;
      tags.appendChild(tag);
    });
    previouslyFocused = document.activeElement;
    dialog.showModal();
  }

  document.querySelectorAll('[data-open-project]').forEach(button => {
    button.addEventListener('click', () => openDetails(button.dataset.openProject));
  });
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => previouslyFocused?.focus?.());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });

  const revealElements = [...document.querySelectorAll('.reveal-on-scroll')];
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealElements.forEach(element => element.classList.add('in-view'));
    return;
  }
  document.documentElement.classList.add('has-project-motion');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold:0.12, rootMargin:'0px 0px -35px 0px' });
  revealElements.forEach(element => observer.observe(element));
})();


/* Build With Me — one-time entrance and restrained magnetic CTA.
   No frameworks, no changes to existing hero/project interactions. */
(() => {
  'use strict';
  const section = document.getElementById('build-with-me');
  const cta = document.getElementById('collabCta');
  const plus = document.getElementById('collabPlus');
  const photo = document.getElementById('collabPhotoDepth');
  const ghost = document.getElementById('collabGhost');
  if (!section || !cta || !plus || !photo || !ghost) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const nodes = [...section.querySelectorAll('.collab-enter')];

  function revealAll() { nodes.forEach(el => el.classList.add('collab-visible')); }
  if (!reduced.matches && 'IntersectionObserver' in window) {
    const enterObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        revealAll();
        enterObserver.disconnect();
      }
    }, { threshold:0.12, rootMargin:'0px 0px -45px 0px' });
    enterObserver.observe(section);
    document.documentElement.classList.add('collab-motion-ready');
  } else { revealAll(); }

  function resetMagnet() {
    plus.style.setProperty('--magnet-x', '0px');
    plus.style.setProperty('--magnet-y', '0px');
  }
  cta.addEventListener('pointermove', (event) => {
    if (reduced.matches || !fine.matches) return;
    const rect = plus.getBoundingClientRect();
    // Use visual button center; clamp movement to 9px on each axis.
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const maxDistance = 165;
    const distance = Math.hypot(dx,dy);
    if (distance > maxDistance) { resetMagnet(); return; }
    const strength = (1 - distance / maxDistance) * 0.14;
    const x = Math.max(-9,Math.min(9,dx * strength));
    const y = Math.max(-9,Math.min(9,dy * strength));
    plus.style.setProperty('--magnet-x', x.toFixed(2) + 'px');
    plus.style.setProperty('--magnet-y', y.toFixed(2) + 'px');
  }, { passive:true });
  cta.addEventListener('pointerleave',resetMagnet);
  cta.addEventListener('blur',resetMagnet);
  reduced.addEventListener('change', () => { if(reduced.matches) resetMagnet(); });

  const archivePlayer = section.querySelector('.creator-native-video-player');
  if (archivePlayer) {

    if (archivePlayer.readyState >= 2) archivePlayer.closest('.creator-native-video-shell')?.classList.add('has-media');
  }

  let scrollRaf = 0;
  function updateDepth() {
    scrollRaf = 0;
    if (reduced.matches) {
      photo.style.setProperty('--collab-photo-y','0px');
      ghost.style.setProperty('--collab-ghost-y','0px');
      return;
    }
    const rect = section.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    const normalized = Math.min(1,Math.max(0,(window.innerHeight - rect.top)/(window.innerHeight + rect.height)));
    const offset = normalized * 2 - 1;
    photo.style.setProperty('--collab-photo-y',(offset * 9).toFixed(2)+'px');
    ghost.style.setProperty('--collab-ghost-y',(offset * -14).toFixed(2)+'px');
  }
  function queueDepth() {
    if (!scrollRaf) scrollRaf=requestAnimationFrame(updateDepth);
  }
  window.addEventListener('scroll',queueDepth,{passive:true});
  window.addEventListener('resize',queueDepth,{passive:true});
  reduced.addEventListener('change',queueDepth);
  queueDepth();
})();

/* 09 / Content Creator — unobtrusive scroll reveals and video interaction.
   Existing hero, projects, collaboration and inquiry handlers are untouched. */
(() => {
  'use strict';
  const section = document.getElementById('content-creator');
  if (!section) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const enters = [...section.querySelectorAll('.creator-enter')];
  if (!reduced.matches && 'IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('creator-visible');
        reveal.unobserve(entry.target);
      }
    }, { threshold:0.08, rootMargin:'0px 0px -12px 0px' });
    enters.forEach(node => reveal.observe(node));
    document.documentElement.classList.add('creator-motion-ready');
  } else {
    enters.forEach(node => node.classList.add('creator-visible'));
  }

  const frame = document.getElementById('youtube-video');
  const artwork = document.getElementById('creatorArtwork');
  const play = document.getElementById('creatorPlay');
  const notice = document.getElementById('creatorVideoNotice');
  if (!frame || !artwork || !play || !notice) return;

  // The video is not supplied yet. A future video URL can be inserted into
  // data-youtube-url on #youtube-video; the actual iframe loads ONLY on click.
  function youtubeVideoId(raw) {
    if (!raw) return null;
    try {
      const url = new URL(raw);
      const host = url.hostname.toLowerCase();
      let id = null;
      if (host === 'youtu.be' || host === 'www.youtu.be') {
        id = url.pathname.split('/').filter(Boolean)[0];
      } else if (['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com','youtube-nocookie.com'].includes(host)) {
        if (url.pathname === '/watch') id = url.searchParams.get('v');
        else if (/^\/(shorts|live|embed)\//.test(url.pathname)) id = url.pathname.split('/')[2];
      }
      return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? id : null;
    } catch { return null; }
  }

  function activateFeature(event) {
    event.preventDefault();
    const id = youtubeVideoId(frame.dataset.youtubeUrl || '');
    if (!id) {
      notice.hidden = false;
      notice.querySelector('a')?.focus({ preventScroll:true });
      return;
    }
    notice.hidden = true;
    const iframe = document.createElement('iframe');
    iframe.className = 'creator-iframe';
    iframe.title = 'ExplainWeeb featured YouTube video';
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}`;
    iframe.allow = 'accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.loading = 'eager';
    frame.appendChild(iframe);
    frame.classList.add('is-loaded');
    play.setAttribute('aria-hidden','true');
    play.tabIndex = -1;
  }
  play.addEventListener('click',activateFeature);

  let pointerRaf = 0;
  let px = 0, py = 0;
  function movePointer(event) {
    if (!finePointer.matches || reduced.matches || frame.classList.contains('is-loaded')) return;
    const rect = frame.getBoundingClientRect();
    px = Math.max(-1,Math.min(1,(event.clientX - rect.left - rect.width/2)/(rect.width/2)));
    py = Math.max(-1,Math.min(1,(event.clientY - rect.top - rect.height/2)/(rect.height/2)));
    if (pointerRaf) return;
    pointerRaf = requestAnimationFrame(() => {
      pointerRaf = 0;
      artwork.style.setProperty('--creator-pointer-x',`${(px*4).toFixed(1)}px`);
      artwork.style.setProperty('--creator-pointer-y',`${(py*4).toFixed(1)}px`);
      play.style.setProperty('--creator-play-x',`${(px*6).toFixed(1)}px`);
      play.style.setProperty('--creator-play-y',`${(py*6).toFixed(1)}px`);
    });
  }
  function resetPointer() {
    cancelAnimationFrame(pointerRaf);pointerRaf=0;
    ['--creator-pointer-x','--creator-pointer-y'].forEach(key => artwork.style.removeProperty(key));
    ['--creator-play-x','--creator-play-y'].forEach(key => play.style.removeProperty(key));
  }
  frame.addEventListener('pointermove',movePointer,{passive:true});
  frame.addEventListener('pointerleave',resetPointer);
  reduced.addEventListener('change',resetPointer);

  const archivePlayer = section.querySelector('.creator-native-video-player');
  if (archivePlayer) {
    archivePlayer.addEventListener('loadeddata', () => archivePlayer.closest('.creator-native-video-shell')?.classList.add('has-media'));
    if (archivePlayer.readyState >= 2) archivePlayer.closest('.creator-native-video-shell')?.classList.add('has-media');
  }

  let scrollRaf = 0;
  function updateDepth() {
    scrollRaf = 0;
    if (reduced.matches) { frame.style.setProperty('--creator-depth','0px');return; }
    const rect = section.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const progress = Math.max(0,Math.min(1,(innerHeight - rect.top)/(innerHeight + rect.height)));
    frame.style.setProperty('--creator-depth',`${((progress - .5)*22).toFixed(2)}px`);
  }
  function scheduleDepth() { if (!scrollRaf) scrollRaf=requestAnimationFrame(updateDepth); }
  addEventListener('scroll',scheduleDepth,{passive:true});
  addEventListener('resize',scheduleDepth,{passive:true});
  reduced.addEventListener('change',scheduleDepth);
  scheduleDepth();
})();

/* FINAL FOOTER — reveal once as it comes into view.
   No changes to earlier section scroll or hover animations. */
(() => {
  'use strict';
  const footer = document.getElementById('site-footer');
  if (!footer) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const items = [...footer.querySelectorAll('.footer-enter')];
  if (reduce.matches || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('footer-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -25px 0px' });
  footer.classList.add('footer-animate');
  items.forEach(item => observer.observe(item));
})();

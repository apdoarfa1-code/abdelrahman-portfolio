/* =========================================================
   Portfolio · script.js
   - theme toggle (light/dark)
   - loader + intro overlay (once ever, fast)
   - unified rAF loop: cursor + ambient blobs (idle-aware)
   - notch scroll + scroll progress
   - reveal on scroll (viewport-safe for tall sections)
   - skill bars animate
   - project carousel (dots, thumbs, video slides, offscreen pause)
   - expandable project cards
   - mobile menu · live clock · light tilt (fine pointers only)
   ========================================================= */
(() => {
  const $  = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const clamp = (n, a, b) => Math.max(a, min(b, n));
  function min(a, b) { return a < b ? a : b; }
  const lerp  = (a, b, n) => a + (b - a) * n;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer   = matchMedia('(pointer: fine)').matches;
  const effectsOn     = !reducedMotion && finePointer;   // heavy eye-candy gate

  /* ------------------- Theme Toggle ------------------- */
  const root = document.documentElement;
  const themeBtn = $('#themeToggle');
  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem('portfolio-theme') || 'dark'; } catch (e) {}
  root.setAttribute('data-theme', savedTheme);
  themeBtn?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('portfolio-theme', next); } catch (e) {}
  });

  /* ------------------- Intro overlay — once ever, fast ------------------- */
  const intro = $('#intro');
  const INTRO_KEY = 'portfolio-intro-seen';
  let introSeen = false;
  try { introSeen = !!localStorage.getItem(INTRO_KEY); } catch (e) {}
  const dismissIntro = () => {
    if (!intro || intro.classList.contains('hide')) return;
    intro.classList.add('hide');
    document.body.style.overflow = '';
    try { localStorage.setItem(INTRO_KEY, '1'); } catch (e) {}
  };
  if (intro) {
    if (introSeen || reducedMotion) {
      intro.classList.add('hide');            // skip entirely — content first
    } else {
      document.body.style.overflow = 'hidden';
      const introTimer = setTimeout(dismissIntro, 2200);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === 'Escape') { clearTimeout(introTimer); dismissIntro(); }
      });
      document.addEventListener('click', () => { clearTimeout(introTimer); dismissIntro(); }, { once: true });
      $('#introEnter')?.addEventListener('click', (e) => { e.stopPropagation(); clearTimeout(introTimer); dismissIntro(); });
    }
  }

  /* ------------------- Loader (quick, honest) ------------------- */
  const loader = $('#loader');
  const num    = $('#loadNum');
  if (loader) {
    let p = 0;
    const loadTick = setInterval(() => {
      p = clamp(p + Math.random() * 26, 0, 100);
      if (num) num.textContent = Math.round(p);
      root.style.setProperty('--p', p + '%');
      if (p >= 100) {
        clearInterval(loadTick);
        setTimeout(() => loader.classList.add('hide'), 150);
      }
    }, 55);
  }

  /* ------------------- Unified rAF: cursor + blobs (runs only while needed) ------------------- */
  const dot      = $('#cursor');
  const ring     = $('#cursorRing');
  const trail    = $('#trail');
  const trailBig = $('#trailBig');
  const blob1 = $('#ambientBlob');
  const blob2 = $('#ambientBlob2');

  if (effectsOn) {
    let mx = innerWidth / 2, my = innerHeight / 2;
    let moved = false;                        // skip frames while the pointer is idle
    let b1x = 0, b1y = 0, b2x = 0, b2y = 0;
    let dx = mx, dy = my, rx = mx, ry = my, tx = mx, ty = my, bx = mx, by = my;

    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY; moved = true;
      const cx = (mx / innerWidth  - 0.5);
      const cy = (my / innerHeight - 0.5);
      b1x = cx * 60;  b1y = cy * 40;          // softened blob travel
      b2x = cx * -80; b2y = cy * -55;
    }, { passive: true });

    function frame() {
      if (moved && !document.hidden) {
        dx = lerp(dx, mx, 0.5);  dy = lerp(dy, my, 0.5);
        rx = lerp(rx, mx, 0.2);  ry = lerp(ry, my, 0.2);
        tx = lerp(tx, mx, 0.1);  ty = lerp(ty, my, 0.1);
        bx = lerp(bx, mx, 0.07); by = lerp(by, my, 0.07);
        if (dot)      dot.style.transform      = `translate(${dx}px, ${dy}px) translate(-50%,-50%)`;
        if (ring)     ring.style.transform     = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
        if (trail)    trail.style.transform    = `translate(${tx}px, ${ty}px) translate(-50%,-50%)`;
        if (trailBig) trailBig.style.transform = `translate(${bx}px, ${by}px) translate(-50%,-50%)`;
        if (blob1) blob1.style.translate = `${b1x}px ${b1y}px`;
        if (blob2) blob2.style.translate = `${b2x}px ${b2y}px`;
        moved = false;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    /* cursor ripple on click */
    window.addEventListener('click', (e) => {
      const rip = document.createElement('div');
      rip.style.cssText = `
        position:fixed;left:${e.clientX}px;top:${e.clientY}px;
        width:0;height:0;border-radius:50%;
        border:2px solid var(--lime);pointer-events:none;z-index:9998;
        transform:translate(-50%,-50%);transition:all .5s ease-out;`;
      document.body.appendChild(rip);
      requestAnimationFrame(() => { rip.style.width='120px'; rip.style.height='120px'; rip.style.opacity='0'; });
      setTimeout(() => rip.remove(), 500);
    });
  } else if (blob1 && blob2) {
    blob1.style.display = 'none';
    blob2.style.display = 'none';
  }

  const hoverables = 'a,button,.project,.service,.t-card,.skill,.gallery-img,.main-portrait,.proj-toggle,.social-circle,.proj-thumb,.wa-cta';
  document.addEventListener('mouseover', (e) => {
    if (!effectsOn || !e.target.closest?.(hoverables)) return;
    dot?.classList.add('hover'); ring?.classList.add('hover'); trailBig?.classList.add('hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (!effectsOn || !e.target.closest?.(hoverables)) return;
    dot?.classList.remove('hover'); ring?.classList.remove('hover'); trailBig?.classList.remove('hover');
  });

  /* ------------------- Smart floating arrow ------------------- */
  const floatArrow = $('.float-arrow');
  floatArrow?.addEventListener('mouseover', () => floatArrow.classList.remove('pulse'));

  /* ------------------- Scroll progress + Notch (rAF-throttled) ------------------- */
  const notch = $('#notch');
  const bar   = $('#scrollProgress');
  let scrollQueued = false;
  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      const sy = window.scrollY;
      const h  = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.width = (clamp(sy / h, 0, 1) * 100) + '%';
      if (notch) {
        notch.style.top = sy > 50 ? '10px' : '20px';
        notch.style.transform = `translateX(-50%) scale(${sy > 100 ? 0.95 : 1})`;
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ------------------- Reveal on scroll (viewport-safe) ------------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
    });
  }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });
  $$('.section, .footer, .teaser-card, .project-expand, .service').forEach(s => {
    s.classList.add('reveal'); io.observe(s);
  });
  // anything already on screen shows immediately — no waiting for a scroll
  requestAnimationFrame(() => {
    $$('.reveal').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) { el.classList.add('visible'); io.unobserve(el); }
    });
  });

  /* ------------------- Skill bars ------------------- */
  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        $$('.skill-bar i', en.target).forEach(b => b.style.width = b.dataset.w + '%');
        skillObserver.unobserve(en.target);
      }
    });
  }, { threshold: 0.3 });
  const about = $('#about'); if (about) skillObserver.observe(about);

  /* ------------------- Mobile menu ------------------- */
  const menuBtn = $('#menuBtn');
  const mobile  = $('#mobileMenu');
  menuBtn?.addEventListener('click', () => {
    menuBtn.classList.toggle('active');
    mobile?.classList.toggle('open');
  });
  $$('a', mobile).forEach(a => a.addEventListener('click', () => {
    menuBtn?.classList.remove('active');
    mobile?.classList.remove('open');
  }));

  /* ------------------- Live clock (Cairo) — every 30s is enough ------------------- */
  const clock = $('#liveTime');
  function tick() {
    if (!clock) return;
    clock.textContent = new Date().toLocaleTimeString('en-US', {
      hour:'2-digit', minute:'2-digit', timeZone:'Africa/Cairo'
    });
  }
  tick(); setInterval(tick, 30000);

  /* ------------------- Tilt (light, fine pointers only) ------------------- */
  if (effectsOn) {
    let tiltEl = null, tiltRaf = 0, tiltX = 0, tiltY = 0;
    $$('.service, .t-card, .photo-frame').forEach(el => {
      el.addEventListener('pointermove', (e) => {
        tiltEl = el;
        const r = el.getBoundingClientRect();
        tiltX = (e.clientX - r.left) / r.width  - 0.5;
        tiltY = (e.clientY - r.top)  / r.height - 0.5;
        if (!tiltRaf) tiltRaf = requestAnimationFrame(() => {
          tiltRaf = 0;
          if (tiltEl) tiltEl.style.transform =
            `translateY(-6px) perspective(900px) rotateY(${tiltX*4}deg) rotateX(${-tiltY*4}deg)`;
        });
      }, { passive: true });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ------------------- Project expand toggle ------------------- */
  $$('.proj-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.closest('.project-expand').classList.toggle('expanded');
    });
  });

  /* ------------------- Project carousel (dots + thumbs + video slides) ------------------- */
  const carousels = [];
  $$('.project-expand').forEach(card => {
    const track  = $('.proj-track', card);
    const slides = $$('.proj-slide', card);
    const dots   = $$('.proj-dots b', card);
    const thumbs = $$('.proj-thumb', card);
    const videos = $$('video', card);
    if (!track) return;
    let curr = 0;

    function go(i) {
      curr = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${curr * 100}%)`;
      track.setAttribute('data-curr', curr);
      dots.forEach((d, k) => d.classList.toggle('active', k === curr));
      thumbs.forEach((t, k) => t.classList.toggle('active', k === curr));
      videos.forEach((v, k) => {
        if (k === curr && cardVisible) v.play().catch(() => {});
        else { v.pause(); }
      });
    }

    dots.forEach((d, i)   => d.addEventListener('click', (e) => { e.stopPropagation(); go(i); }));
    thumbs.forEach((t, i) => t.addEventListener('click', (e) => { e.stopPropagation(); go(i); }));

    // rotate slower on cards that contain video so clips get a chance to play
    const period = videos.length ? 8000 : 3500;
    let timer = 0;
    const start = () => { if (!timer && !reducedMotion) timer = setInterval(() => go(curr + 1), period); };
    const stop  = () => { clearInterval(timer); timer = 0; };
    card.addEventListener('mouseenter', () => { stop(); start(); });
    card.addEventListener('mouseleave', () => { stop(); start(); });
    start();

    // pause videos & rotation while the card is offscreen
    let cardVisible = true;
    new IntersectionObserver((entries) => {
      cardVisible = entries[0].isIntersecting && !document.hidden;
      if (cardVisible) { start(); videos[curr]?.play().catch(() => {}); }
      else { stop(); videos.forEach(v => v.pause()); }
    }, { threshold: 0.15 }).observe(card);

    carousels.push({ go, videos });
    go(0);
  });

  document.addEventListener('visibilitychange', () => {
    carousels.forEach(c => c.videos.forEach(v => { if (document.hidden) v.pause(); }));
  });

  /* ------------------- Anchor smooth scroll (same-page only) ------------------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length <= 1) return;
      const t = $(id);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

})();

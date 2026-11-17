/* Teresa Alaniz — portfolio interactions */

/* ---- Text scramble: letters settle in slowly through a calm glyph shuffle.
   Slow eased reveal + throttled flicker for an elegant, unhurried feel. ---- */
function scramble(el, finalText, opts) {
  opts = opts || {};
  var chars = 'abcdefghijklmnopqrstuvwxyz';
  var duration = opts.duration || 1800;
  var delay = opts.delay || 0;
  var flickerEvery = opts.flicker || 70; // ms between glyph changes (calmer than per-frame)
  var len = finalText.length;
  var startTs = null;
  var lastFlick = -1e9;
  var cache = new Array(len);

  function ease(x) { // easeInOutCubic — gentle at both ends
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  function frame(ts) {
    if (startTs === null) startTs = ts;
    var t = ts - startTs - delay;
    if (t < 0) { requestAnimationFrame(frame); return; }
    var p = Math.min(t / duration, 1);
    var revealed = Math.floor(ease(p) * len);
    var flick = (ts - lastFlick) >= flickerEvery;
    if (flick) lastFlick = ts;
    var out = '';
    for (var i = 0; i < len; i++) {
      var c = finalText.charAt(i);
      if (c === ' ') { out += ' '; continue; }
      if (i < revealed) { out += c; }
      else {
        if (flick || !cache[i]) cache[i] = chars.charAt(Math.floor(Math.random() * chars.length));
        out += cache[i];
      }
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(frame);
    else el.textContent = finalText;
  }
  requestAnimationFrame(frame);
}

/* ---- Home hero entrance (name scrambles in, text underneath rises in) ---- */
var heroStarted = false;
function startHero(animate) {
  if (heroStarted) return;
  heroStarted = true;

  var wordmark = document.querySelector('.wordmark');
  if (!wordmark) return; // not the home page

  var block = document.querySelector('.home__block');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lines = wordmark.querySelectorAll('.wm-line');

  wordmark.style.visibility = 'visible';

  // Reduced motion: reveal everything instantly, no animation.
  if (reduce) {
    if (block) block.classList.add('hero-in', 'hero-static');
    lines.forEach(function (l) { l.textContent = l.getAttribute('data-text'); });
    return;
  }

  // Return visits (already navigating this session): a gentle fade + rise
  // entrance, like the book page — no name scramble, no intro screen.
  if (!animate) {
    lines.forEach(function (l) { l.textContent = l.getAttribute('data-text'); });
    if (block) block.classList.add('hero-return');
    return;
  }

  // First visit of the session: the full name-scramble entrance.
  if (block) block.classList.add('hero-in');
  lines.forEach(function (l, i) {
    scramble(l, l.getAttribute('data-text'), { duration: 1900, delay: i * 300 });
  });
}

/* ---- Intro: black screen for 1000ms, then fade to home (once per session).
   The hero entrance is triggered at the reveal moment so it stays in sync. ---- */
(function intro() {
  var el = document.getElementById('intro');
  if (!el) { startHero(false); return; }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var played = sessionStorage.getItem('introPlayed');

  // Already seen this session (or reduced motion) — no intro, no animation.
  if (played || reduce) {
    el.parentNode && el.parentNode.removeChild(el);
    startHero(false);
    return;
  }

  // First visit of the session — play the full intro + hero entrance.
  setTimeout(function () {
    el.classList.add('is-hidden');
    sessionStorage.setItem('introPlayed', '1');
    startHero(true);
    setTimeout(function () { el.parentNode && el.parentNode.removeChild(el); }, 650);
  }, 1000);
})();

/* ---- Project switcher: numbered sticky rail + "Next project" ---- */
(function projects() {
  var items = [].slice.call(document.querySelectorAll('.proj-item'));
  if (!items.length) return;
  var panels = [].slice.call(document.querySelectorAll('.panel'));
  var order = items.map(function (it) { return it.getAttribute('data-tab'); });
  var layout = document.querySelector('.proj-layout');

  function activate(id, scroll) {
    var i = order.indexOf(id);
    if (i === -1) { i = 0; id = order[0]; }
    items.forEach(function (it, k) {
      it.classList.toggle('is-on', k === i);
      it.setAttribute('aria-current', k === i ? 'true' : 'false');
    });
    panels.forEach(function (p) { p.classList.toggle('is-active', p.id === 'panel-' + id); });
    if (history.replaceState) history.replaceState(null, '', '#' + id);
    if (scroll && layout) {
      var top = layout.getBoundingClientRect().top + window.pageYOffset - 24;
      window.scrollTo({ top: top < 0 ? 0 : top, behavior: 'smooth' });
    }
  }

  // Switching from the rail happens in place (like the Awa phase nav).
  items.forEach(function (it) {
    it.addEventListener('click', function () { activate(it.getAttribute('data-tab'), false); });
  });

  // Activate the project from the URL hash, or default to the first so the page
  // is never blank when opened without a hash. No scroll on first load.
  function fromHash() {
    var hash = (location.hash || '').replace('#', '');
    activate(order.indexOf(hash) !== -1 ? hash : order[0], false);
  }
  fromHash();
  window.addEventListener('hashchange', fromHash);
})();

/* ---- Image galleries (initializes every .gallery on the page) ---- */
(function galleries() {
  document.querySelectorAll('.gallery').forEach(function (root) {
    var slides = root.querySelectorAll('.gallery__slide');
    if (!slides.length) return;

    // Preload every slide image up front so changing slides never blinks on the
    // first pass (lazy images would otherwise only load when first shown).
    slides.forEach(function (s) {
      var im = s.querySelector('img');
      if (!im) return;
      im.loading = 'eager';
      if (!im.complete) { var pre = new Image(); pre.src = im.currentSrc || im.src; }
    });

    var prev = root.querySelector('.gallery__nav--prev');
    var next = root.querySelector('.gallery__nav--next');
    var counter = root.querySelector('.gallery__counter');
    var dotsWrap = root.querySelector('.gallery__dots');

    // Impact galleries keep their arrows in the footer (beside the dots) so they
    // never shift vertically between slides of different heights.
    if (root.classList.contains('gallery--topnav')) {
      var footer = root.querySelector('.gallery__footer');
      if (footer && prev && next) {
        footer.insertBefore(prev, footer.firstChild);
        footer.appendChild(next);
      }
    }

    var total = slides.length;
    var idx = 0;
    var dots = [];

    if (dotsWrap) {
      for (var i = 0; i < total; i++) {
        var d = document.createElement('button');
        d.type = 'button';
        d.className = 'gallery__dot' + (i === 0 ? ' is-active' : '');
        d.setAttribute('aria-label', 'Go to image ' + (i + 1) + ' of ' + total);
        (function (n) { d.addEventListener('click', function () { go(n); }); })(i);
        dotsWrap.appendChild(d);
        dots.push(d);
      }
    }

    function go(n) {
      idx = (n + total) % total;
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); });
      dots.forEach(function (dt, i) { dt.classList.toggle('is-active', i === idx); });
      if (counter) counter.textContent = (idx + 1) + ' / ' + total;
    }

    if (prev) prev.addEventListener('click', function () { go(idx - 1); });
    if (next) next.addEventListener('click', function () { go(idx + 1); });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') go(idx - 1);
      else if (e.key === 'ArrowRight') go(idx + 1);
    });
  });
})();

/* ---- Self-shopping (Datalogic) Impact: three code-built, interactive slides.
   Each slide has a sensible default so it reads before anyone interacts, and
   interacting inside a slide never changes the carousel slide. ---- */
(function selfShoppingImpact() {
  var root = document.getElementById('shopImpactGallery');
  if (!root) return;

  // Slide 1 — two inputs feed one output; the output lights up once both are on.
  var map = root.querySelector('.ssi-map');
  if (map) {
    var ios = map.querySelectorAll('.ssi-io');
    var syncMap = function () {
      var all = true;
      ios.forEach(function (b) { if (!b.classList.contains('is-on')) all = false; });
      map.classList.toggle('is-complete', all);
    };
    ios.forEach(function (b) {
      b.addEventListener('click', function () {
        var on = !b.classList.contains('is-on');
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        syncMap();
      });
    });
  }

  // Slide 2 — selecting a step fills the track up to it and shows its line.
  var track = root.querySelector('.ssi-track');
  if (track) {
    var steps = track.querySelectorAll('.ssi-step');
    var fill = track.querySelector('.ssi-track__fill');
    var lineEl = track.querySelector('.ssi-track__line');
    steps.forEach(function (b, i) {
      b.addEventListener('click', function () {
        steps.forEach(function (s, k) {
          s.setAttribute('aria-pressed', k === i ? 'true' : 'false');
          s.classList.toggle('is-done', k <= i);
        });
        if (fill) fill.style.width = ((i + 1) / steps.length * 100) + '%';
        if (lineEl) lineEl.textContent = b.getAttribute('data-line');
      });
    });
  }

  // Slide 3 — selecting a stop updates what the phone frame shows.
  var trip = root.querySelector('.ssi-trip');
  if (trip) {
    var stops = trip.querySelectorAll('.ssi-stop');
    var pt = trip.querySelector('.ssi-phone__t');
    var pd = trip.querySelector('.ssi-phone__d');
    stops.forEach(function (b) {
      b.addEventListener('click', function () {
        stops.forEach(function (s) { s.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        if (pt) pt.textContent = b.getAttribute('data-title');
        if (pd) pd.textContent = b.getAttribute('data-line');
      });
    });
  }
})();

/* ---- Design System Impact: four code-built, interactive slides. Same rules —
   sensible defaults, interacting inside a slide never changes the carousel. ---- */
(function designSystemImpact() {
  var root = document.getElementById('dsImpactGallery');
  if (!root) return;

  // Before -> after switches (slides 1, 2): update that slide's readout.
  root.querySelectorAll('.dsi-switch').forEach(function (group) {
    var read = group.parentNode.querySelector('.dsi-read__t');
    var btns = group.querySelectorAll('.dsi-switch__btn');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        if (read) read.textContent = b.getAttribute('data-val');
      });
    });
  });

  // Adoption stat tiles (slide 3): single-select emphasis.
  var tiles = root.querySelectorAll('.dsi-tile');
  tiles.forEach(function (b) {
    b.addEventListener('click', function () {
      tiles.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
    });
  });

  // Scalability platforms (slide 4): update the role line.
  var plats = root.querySelectorAll('.dsi-plat');
  var roleEl = root.querySelector('.dsi-scale__role');
  plats.forEach(function (b) {
    b.addEventListener('click', function () {
      plats.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      if (roleEl) roleEl.textContent = b.getAttribute('data-role');
    });
  });
})();

/* ---- Tabbed fixed-height Impact panels: tabs, dots and caption switch which
   slide shows. Shared by every project (.dsi-impact). Interacting inside a
   slide (switches, steps, etc.) is wired separately and never changes tabs. ---- */
(function tabbedImpacts() {
  document.querySelectorAll('.dsi-impact').forEach(function (root) {
    var tabs = [].slice.call(root.querySelectorAll('.dsi-tab'));
    var slides = [].slice.call(root.querySelectorAll('.dsi-slide'));
    var dots = [].slice.call(root.querySelectorAll('.dsi-dot'));
    var cap = root.querySelector('.dsi-foot__cap');
    if (!tabs.length || !slides.length) return;
    var show = function (i) {
      tabs.forEach(function (t, k) { t.classList.toggle('is-on', k === i); t.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      dots.forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
      if (cap) cap.textContent = slides[i].getAttribute('data-cap') || '';
    };
    tabs.forEach(function (t, i) { t.addEventListener('click', function () { show(i); }); });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { show(i); }); });
  });
})();

/* ---- Design Ops Impact: four code-built, interactive slides. ---- */
(function designOpsImpact() {
  var root = document.getElementById('opsGallery');
  if (!root) return;

  // Before/after switch (slide 1 — funnel).
  root.querySelectorAll('.dsi-switch').forEach(function (group) {
    var ops = group.closest('.ops');
    var read = ops.querySelector('.ops-note');
    var btns = group.querySelectorAll('.dsi-switch__btn');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        if (read) read.textContent = b.getAttribute('data-text');
      });
    });
  });

  // Team selector (slide 4): whoever is working, the core line stays constant.
  var teamsels = root.querySelectorAll('.ops-teamsel');
  var teamRead = root.querySelector('.ops-hub__readt');
  teamsels.forEach(function (b) {
    b.addEventListener('click', function () {
      teamsels.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      if (teamRead) teamRead.textContent = b.getAttribute('data-line');
    });
  });

  // Contribution cycle steps (slide 2).
  var steps = root.querySelectorAll('.ops-step');
  var cdetail = root.querySelector('.ops-cycle__detail');
  steps.forEach(function (b) {
    b.addEventListener('click', function () {
      steps.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      if (cdetail) cdetail.innerHTML = b.getAttribute('data-detail');
    });
  });

  // Reuse donut legend (slide 3).
  var legs = root.querySelectorAll('.ops-leg');
  var sdetail = root.querySelector('.ops-sprawl__detail');
  legs.forEach(function (b) {
    b.addEventListener('click', function () {
      legs.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      if (sdetail) sdetail.innerHTML = b.getAttribute('data-detail');
    });
  });
})();

/* ---- Red Dot / UX (IMS) Impact: before/outcome switches on each slide. ---- */
(function imsImpact() {
  var root = document.getElementById('imsImpactGallery');
  if (!root) return;
  root.querySelectorAll('.dsi-switch').forEach(function (group) {
    var read = group.closest('.ims').querySelector('.ims-read');
    var btns = group.querySelectorAll('.dsi-switch__btn');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        if (read) read.textContent = b.getAttribute('data-text');
      });
    });
  });
})();

/* ---- Image viewer: thumbnail rail swaps the large framed image. ---- */
(function imgViewers() {
  document.querySelectorAll('.imgviewer').forEach(function (root) {
    var thumbs = [].slice.call(root.querySelectorAll('.imgviewer__thumb'));
    var main = root.querySelector('.imgviewer__main img');
    var cap = root.querySelector('.imgviewer__cap');
    var count = root.querySelector('.imgviewer__count');
    if (!thumbs.length || !main) return;
    var total = thumbs.length;
    var pad2 = function (n) { return ('0' + n).slice(-2); };
    function show(i) {
      var t = thumbs[i];
      thumbs.forEach(function (x, k) {
        x.classList.toggle('is-on', k === i);
        x.setAttribute('aria-selected', k === i ? 'true' : 'false');
      });
      main.src = t.getAttribute('data-src');
      main.alt = t.getAttribute('data-cap') || '';
      if (cap) cap.textContent = t.getAttribute('data-cap') || '';
      if (count) count.textContent = pad2(i + 1) + ' / ' + pad2(total);
    }
    thumbs.forEach(function (t, i) { t.addEventListener('click', function () { show(i); }); });
    root.addEventListener('keydown', function (e) {
      var cur = thumbs.findIndex(function (x) { return x.classList.contains('is-on'); });
      if (e.key === 'ArrowRight') { show((cur + 1) % total); }
      else if (e.key === 'ArrowLeft') { show((cur - 1 + total) % total); }
    });
  });
})();

/* ---- Footer: live local time in Amsterdam. ---- */
(function footerClock() {
  var el = document.getElementById('footerClock');
  if (!el) return;
  function tick() {
    try {
      el.textContent = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Europe/Amsterdam'
      }).format(new Date());
    } catch (e) { el.textContent = ''; }
  }
  tick();
  setInterval(tick, 15000);
})();

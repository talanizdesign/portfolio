/* Awa page — intro bloom + phase submenu + progressive-disclosure reveal */

// When the first-visit intro runs it gates the page reveal and hands it over
// in stages; otherwise the normal scroll-reveal runs immediately.
var AWA_REVEAL_READY = true;

/* ---- Intro: emotions start messy, float into a 3D dandelion, then drift to
   the "awa" word and fade — handing over to the word, menu, then the copy. ---- */
(function intro() {
  var overlay = document.getElementById('awaIntro');
  if (!overlay) return;
  var canvas = document.getElementById('awaIntroCanvas');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var played = false;
  try { played = sessionStorage.getItem('awaIntroPlayed') === '1'; } catch (e) {}

  // already seen this session, reduced motion, or no canvas → skip straight in
  if (reduce || played || !canvas || !canvas.getContext) {
    overlay.classList.add('is-hidden', 'is-removed');
    return;
  }
  try { sessionStorage.setItem('awaIntroPlayed', '1'); } catch (e) {}

  // take over the reveal: hold the word, menu and copy hidden until handover
  AWA_REVEAL_READY = false;
  document.body.classList.add('awa-intro-on');

  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = window.innerWidth, h = window.innerHeight, cx = w / 2, cy = h / 2;
  canvas.width = w * dpr; canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Each dot (an "emotion") has: a messy start, a dandelion target (arranged
  // along radial spokes so the structure reads clearly), and a left target
  // (where it drifts to as the menu appears).
  var maxR = Math.min(w, h) * 0.42;
  var N = 150;
  // Awa palette — the dots are emotions, so they carry Awa's three hues
  // (blue · coral · green) plus warm neutrals for grounding.
  var PAL = [
    [101, 160, 254], [101, 160, 254],  // blue   #65A0FE (signature)
    [64, 115, 204],                     // blue   #4073CC
    [178, 212, 255],                    // blue   #B2D4FF
    [255, 158, 125], [255, 158, 125],   // coral  #FF9E7D (signature)
    [229, 126, 115],                    // coral  #E57E73
    [180, 83, 74],                      // coral  #B4534A
    [114, 177, 114], [114, 177, 114],   // green  #72B172 (signature)
    [97, 133, 102],                     // green  #618566
    [97, 89, 82],                       // neutral #615952 (depth)
    [33, 31, 28]                        // neutral #211F1C (depth)
  ];
  var dots = [];
  for (var i = 0; i < N; i++) {
    // random direction on a sphere → a true 3D burst from the centre
    var uu = Math.random() * 2 - 1;              // cos(polar)
    var az = Math.random() * Math.PI * 2;        // azimuth
    var ss = Math.sqrt(1 - uu * uu);
    var dirx = ss * Math.cos(az), diry = ss * Math.sin(az), dirz = uu;
    var rad = (0.16 + Math.pow(Math.random(), 0.5) * 0.84) * maxR;
    var Z = dirz * rad;
    var persp = 1 + (Z / maxR) * 0.5;            // nearer points pushed out = depth
    var depth = (dirz + 1) / 2;                  // 0 = far, 1 = near the viewer
    var big = Math.random() < 0.1;               // a few larger accents, any depth
    dots.push({
      sx: Math.random() * w, sy: Math.random() * h,
      dx: cx + dirx * rad * persp, dy: cy + diry * rad * persp,
      lx: 30 + Math.random() * 180, ly: 95 + Math.random() * 130,  // toward the "awa" word (top-left)
      r: (1.1 + depth * 4.3) * (big ? 1.7 : 1),  // near = bigger
      a: 0.3 + depth * 0.68,                      // near = darker, far = fainter
      col: PAL[Math.floor(Math.random() * PAL.length)],  // its Awa hue
      delay: Math.random() * 450
    });
  }

  function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

  var done = false, staged1 = false, staged2 = false;

  // stage 1 — the "awa" word + eyebrow fade in; the menu fades in (via CSS)
  function stage1() {
    if (staged1) return; staged1 = true;
    document.body.classList.add('awa-stage-1');
    var hero = document.querySelector('.awa-hero');
    if (hero) hero.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }
  // stage 2 — the copy appears left → right, then normal reveal resumes
  function stage2() {
    if (staged2) return; staged2 = true;
    AWA_REVEAL_READY = true;
    document.body.classList.add('awa-stage-2');
    var panel = document.querySelector('.awa-panel.is-active');
    if (!panel) return;
    panel.querySelectorAll('.awa-blocks .awa-block').forEach(function (el, i) {
      el.style.transitionDelay = (i * 190) + 'ms';
      el.classList.add('is-in');
    });
    panel.querySelectorAll('.reveal:not(.is-in)').forEach(function (el) { el.classList.add('is-in'); });
  }
  function finish() {
    if (!done) { done = true; overlay.classList.add('is-removed'); }
    stage1(); stage2();
  }

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  // Sample the glyph pixels of the real "awa" wordmark and hand each dot a
  // target point on the letterforms, so the dandelion can re-form into the word.
  var wordOk = false;
  function computeWord() {
    if (wordOk) return;
    var el = document.querySelector('.awa-hero__title');
    if (!el) return;
    var text = (el.textContent || '').trim();
    if (!text) return;
    // measure the title at its FINAL position — the .reveal class shifts it down
    // with translateY, which getBoundingClientRect would otherwise include.
    var prevT = el.style.transform;
    el.style.transform = 'none';
    var r = el.getBoundingClientRect();
    el.style.transform = prevT;
    var cs = getComputedStyle(el);
    var fs = parseFloat(cs.fontSize);
    if (!fs || !r.width) return;
    var font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
    var oc = document.createElement('canvas');
    var octx = oc.getContext('2d');
    octx.font = font;
    var m = octx.measureText(text);
    var asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
    if (!asc) return;                               // font not ready yet → retry later
    var tw = Math.ceil(m.width) + 2;
    var gh = Math.ceil(asc + desc) + 2;
    oc.width = tw; oc.height = gh;
    octx.font = font;
    octx.textBaseline = 'alphabetic';
    octx.fillStyle = '#000';
    octx.fillText(text, 1, asc + 1);                 // text origin at (1, asc+1)
    var data;
    try { data = octx.getImageData(0, 0, tw, gh).data; } catch (e) { return; }
    var pts = [], step = fs > 110 ? 3 : 2;
    for (var yy = 0; yy < gh; yy += step) {
      for (var xx = 0; xx < tw; xx += step) {
        if (data[(yy * tw + xx) * 4 + 3] > 130) pts.push([xx, yy]);
      }
    }
    if (pts.length < N) return;
    // map glyph pixels onto where the real wordmark sits: left edge at r.left,
    // baseline from the font's em box so the dots land exactly on the letters
    var emAsc = m.fontBoundingBoxAscent || asc, emDesc = m.fontBoundingBoxDescent || desc;
    var baseFromTop = (r.height - (emAsc + emDesc)) / 2 + emAsc;
    for (var k = pts.length - 1; k > 0; k--) {       // shuffle for even coverage
      var j = Math.floor(Math.random() * (k + 1)), tmp = pts[k]; pts[k] = pts[j]; pts[j] = tmp;
    }
    for (var di = 0; di < N; di++) {
      var p = pts[di % pts.length];
      dots[di].wx = r.left + (p[0] - 1);
      dots[di].wy = r.top + baseFromTop + (p[1] - (asc + 1));
    }
    wordOk = true;
  }
  computeWord();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(computeWord);

  var start = null;
  var APPEAR = 350, FORM_START = 350, FORM_DUR = 1700;
  var MORPH_START = 2450, MORPH_DUR = 1250;
  var INK_START = 3800, INK_DUR = 750;        // the coloured dots settle to the ink of the word
  var REVEAL_START = 4150;                      // the real wordmark fades in beneath the dark dots
  var FADE_START = 4650, FADE_DUR = 950, END = 5650;  // then the dark dots melt away over it
  var opened = false;

  function frame(ts) {
    if (start === null) start = ts;
    var t = ts - start;
    ctx.clearRect(0, 0, w, h);

    var appear = Math.min(t / APPEAR, 1);
    if (!wordOk && t >= MORPH_START - 350 && t < MORPH_START + 120) computeWord();
    var fade = ease(clamp((t - FADE_START) / FADE_DUR));
    // reveal the real word + menu beneath the (now ink-coloured) dots, then let them melt away
    if (!opened && t >= REVEAL_START) { opened = true; overlay.classList.add('is-opening'); stage1(); }

    ctx.lineWidth = 0.6;
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      var fp = ease(clamp((t - FORM_START - d.delay) / FORM_DUR));         // messy → dandelion
      var mp = ease(clamp((t - MORPH_START - d.delay * 0.35) / MORPH_DUR)); // dandelion → word
      // dandelion (formed) position — the stalk always points here
      var dax = d.sx + (d.dx - d.sx) * fp;
      var day = d.sy + (d.dy - d.sy) * fp;
      // morph target: the letterforms, or the old left-drift as a fallback
      var tx = wordOk ? d.wx : d.lx, ty = wordOk ? d.wy : d.ly;
      var x = dax, y = day;
      if (mp > 0) { x = dax + (tx - dax) * mp; y = day + (ty - day) * mp; }
      // faint radiating stalk: fades in as it forms, out as the dot leaves
      var stalkA = d.a * 0.14 * appear * fp * (1 - mp);
      if (stalkA > 0.012) {
        ctx.strokeStyle = 'rgba(10,10,10,' + stalkA + ')';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(dax, day);
        ctx.stroke();
      }
      var alpha = d.a * appear * (1 - fade);
      if (alpha <= 0.01) continue;
      // deep blue (#1F4080) when messy → blooms to its Awa hue → settles to the
      // word's ink, so by the time it fades it matches the wordmark exactly
      var sp = ease(clamp((t - INK_START - d.delay * 0.3) / INK_DUR));
      var baseR = 31 + (d.col[0] - 31) * fp;
      var baseG = 64 + (d.col[1] - 64) * fp;
      var baseB = 128 + (d.col[2] - 128) * fp;
      var cr = Math.round(baseR + (11 - baseR) * sp);
      var cg = Math.round(baseG + (11 - baseG) * sp);
      var cb = Math.round(baseB + (12 - baseB) * sp);
      // shrink as they lock into the letterforms, so the word reads as fine points
      var rr = d.r * (1 - 0.5 * mp);
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + alpha + ')';
      ctx.fill();
    }

    if (t < END && !done) requestAnimationFrame(frame);
    else finish();
  }
  requestAnimationFrame(frame);
  // Failsafe: if rAF stalls (background tab, throttling, slow first load), never
  // leave the overlay covering the page and blocking scroll — force the handover.
  setTimeout(finish, END + 1200);
  overlay.addEventListener('click', function () { overlay.classList.add('is-opening', 'is-removed'); finish(); });
})();

/* ---- Phase submenu: show one phase panel at a time ---- */
(function phases() {
  var btns = document.querySelectorAll('.awa-phase-btn');
  if (!btns.length) return;

  function activate(id) {
    btns.forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.phase === id);
    });
    document.querySelectorAll('.awa-panel').forEach(function (p) {
      p.classList.toggle('is-active', p.id === 'phase-' + id);
    });
    if (history.replaceState) history.replaceState(null, '', '#' + id);
    // re-run reveals for the newly shown panel
    revealIn(document.getElementById('phase-' + id));
  }

  btns.forEach(function (b) {
    if (b.disabled) return;
    b.addEventListener('click', function () { activate(b.dataset.phase); });
  });

  // Activate from hash, else the first enabled phase.
  var hash = (location.hash || '').replace('#', '');
  var valid = [];
  btns.forEach(function (b) { if (!b.disabled) valid.push(b.dataset.phase); });
  activate(valid.indexOf(hash) !== -1 ? hash : valid[0]);
})();

/* ---- Progressive disclosure: reveal .reveal elements as they enter ---- */
var io = null;
if ('IntersectionObserver' in window) {
  io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
}

function revealIn(scope) {
  if (!scope || !AWA_REVEAL_READY) return; // the intro orchestrates reveal on first visit
  var items = scope.querySelectorAll('.reveal:not(.is-in)');
  items.forEach(function (el, i) {
    // stagger the reveal for a fluid, one-after-another feel
    el.style.transitionDelay = Math.min(i * 90, 450) + 'ms';
    if (io) io.observe(el);
    else el.classList.add('is-in');
  });
}

// Initial pass over whatever is already visible
revealIn(document);

/* ---- Tech stack: category tabs switch the tool list ---- */
(function cats() {
  var tabs = document.querySelectorAll('.awa-cat');
  if (!tabs.length) return;
  function activate(id) {
    tabs.forEach(function (t) {
      var on = t.dataset.cat === id;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('.awa-cat-panel').forEach(function (p) {
      p.classList.toggle('is-active', p.id === 'cat-' + id);
    });
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () { activate(t.dataset.cat); });
  });
  activate(tabs[0].dataset.cat);
})();

/* ---- Design Concept: a curved line draws itself through the steps on scroll ---- */
(function flow() {
  var flow = document.querySelector('.awa-flow');
  if (!flow) return;
  var path = flow.querySelector('.awa-flow__path');
  var nums = flow.querySelectorAll('.awa-step__num');
  var len = 0;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function build() {
    if (!flow.offsetHeight || nums.length < 2) return; // not visible yet
    var fr = flow.getBoundingClientRect();
    var pts = [];
    nums.forEach(function (n) {
      var r = n.getBoundingClientRect();
      pts.push({ x: r.left - fr.left + r.width / 2, y: r.top - fr.top + r.height / 2 });
    });
    var d = 'M ' + pts[0].x + ' ' + pts[0].y;
    for (var i = 1; i < pts.length; i++) {
      var p0 = pts[i - 1], p1 = pts[i], midY = (p0.y + p1.y) / 2;
      var bulge = (i % 2 ? 1 : -1) * 30; // alternate side → a gentle S-curve
      d += ' C ' + (p0.x + bulge) + ' ' + midY + ' ' + (p1.x + bulge) + ' ' + midY + ' ' + p1.x + ' ' + p1.y;
    }
    path.setAttribute('d', d);
    len = path.getTotalLength();
    path.style.strokeDasharray = len;
    if (reduce) path.style.strokeDashoffset = 0;
    else draw();
  }

  function draw() {
    if (!len || reduce) return;
    var fr = flow.getBoundingClientRect();
    var vh = window.innerHeight;
    var denom = Math.max(fr.height - vh * 0.35, 1);
    var prog = (vh * 0.8 - fr.top) / denom;
    prog = Math.max(0, Math.min(1, prog));
    path.style.strokeDashoffset = len * (1 - prog);
  }

  if ('ResizeObserver' in window) new ResizeObserver(build).observe(flow);
  window.addEventListener('scroll', draw, { passive: true });
  window.addEventListener('resize', build);
  build();
  setTimeout(build, 300);
})();

/* ---- The app: the build loop — connectors flow continuously between tools ---- */
(function loop() {
  var wrap = document.getElementById('awaLoop');
  if (!wrap) return;
  var svg = wrap.querySelector('.awa-loop__svg');
  var NS = 'http://www.w3.org/2000/svg';

  // from-node, from-side → to-node, to-side, kind ('v' vertical S · 'h' sideways · 'loop' back to hub)
  var conns = [
    ['figma', 'bottom', 'claude', 'top', 'v'],
    ['sheet', 'bottom', 'claude', 'top', 'v'],
    ['claude', 'bottom', 'expo', 'top', 'v'],
    ['expo', 'bottom', 'expogo', 'top', 'v'],
    ['expogo', 'right', 'phone', 'left', 'h'],   // deploy: runs on the iPhone
    ['phone', 'top', 'claude', 'right', 'loop']  // navigating the app feeds the next loop
  ];

  function anchor(id, side, cr) {
    var el = wrap.querySelector('[data-node="' + id + '"]');
    var r = el.getBoundingClientRect();
    var x, y;
    if (side === 'top') { x = r.left + r.width / 2; y = r.top; }
    else if (side === 'bottom') { x = r.left + r.width / 2; y = r.bottom; }
    else if (side === 'left') { x = r.left; y = r.top + r.height / 2; }
    else { x = r.right; y = r.top + r.height / 2; }
    return { x: x - cr.left, y: y - cr.top };
  }

  function build() {
    if (!wrap.offsetHeight) return; // not visible yet
    var cr = wrap.getBoundingClientRect();
    svg.innerHTML =
      '<defs><marker id="awaArrow" viewBox="0 0 8 8" refX="5.5" refY="4" ' +
      'markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
      '<path d="M1 1 L6 4 L1 7" fill="none" stroke-width="1.3" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></marker></defs>';

    conns.forEach(function (c) {
      var a = anchor(c[0], c[1], cr), b = anchor(c[2], c[3], cr);
      var kind = c[4], d;
      if (kind === 'loop') {                         // phone top → up, then left into the hub
        var k = 64;
        d = 'M ' + a.x + ' ' + a.y +
            ' C ' + a.x + ' ' + (a.y - k) + ' ' + (b.x + k) + ' ' + b.y + ' ' + b.x + ' ' + b.y;
      } else if (kind === 'h') {                      // stack → phone: out sideways, ease up
        var dx = Math.max((b.x - a.x) * 0.5, 36);
        d = 'M ' + a.x + ' ' + a.y +
            ' C ' + (a.x + dx) + ' ' + a.y + ' ' + (b.x - dx) + ' ' + b.y + ' ' + b.x + ' ' + b.y;
      } else {                                        // vertical S-curve
        var my = (a.y + b.y) / 2;
        d = 'M ' + a.x + ' ' + a.y +
            ' C ' + a.x + ' ' + my + ' ' + b.x + ' ' + my + ' ' + b.x + ' ' + b.y;
      }
      var base = document.createElementNS(NS, 'path');
      base.setAttribute('d', d);
      base.setAttribute('class', 'awa-loop__base');
      base.setAttribute('marker-end', 'url(#awaArrow)');
      svg.appendChild(base);

      var dash = document.createElementNS(NS, 'path');
      dash.setAttribute('d', d);
      dash.setAttribute('class', 'awa-loop__dash');
      svg.appendChild(dash);
    });
  }

  if ('ResizeObserver' in window) new ResizeObserver(build).observe(wrap);
  window.addEventListener('resize', build);
  build();
  setTimeout(build, 300);
})();

/* ---- Design Concept: each pillar carries a small cluster of drifting Awa dots ---- */
(function particles() {
  var hosts = document.querySelectorAll('.awa-intent__dots');
  if (!hosts.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var AWA = ['101,160,254', '64,115,204', '178,212,255', '255,158,125', '229,126,115', '114,177,114', '97,133,102'];
  var clusters = [], running = false;

  function hexRgb(h) {
    h = (h || '#65A0FE').replace('#', '');
    return parseInt(h.substr(0, 2), 16) + ',' + parseInt(h.substr(2, 2), 16) + ',' + parseInt(h.substr(4, 2), 16);
  }
  function palette(hue) {                       // mostly the pillar's hue, a couple of accents
    var base = hexRgb(hue);
    return [base, base, base, AWA[(Math.random() * AWA.length) | 0], AWA[(Math.random() * AWA.length) | 0]];
  }

  function initHost(host) {
    if (host.__init) return;
    var w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;                        // not visible yet (hidden phase)
    host.__init = true;
    var cv = document.createElement('canvas');
    cv.width = w * dpr; cv.height = h * dpr;
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    host.appendChild(cv);
    var pal = palette(host.getAttribute('data-hue'));
    var dots = [];
    for (var i = 0; i < 9; i++) {
      dots.push({
        bx: 5 + Math.random() * (w - 10), by: 5 + Math.random() * (h - 10),
        r: 1.5 + Math.random() * 2.1,
        col: pal[i % pal.length],
        ax: 1.5 + Math.random() * 3, ay: 1.5 + Math.random() * 3,
        px: Math.random() * 6.28, py: Math.random() * 6.28,
        sx: 0.25 + Math.random() * 0.45, sy: 0.25 + Math.random() * 0.45,
        a: 0.5 + Math.random() * 0.45
      });
    }
    var c = { ctx: ctx, w: w, h: h, dots: dots };
    clusters.push(c);
    if (reduce) {                                // static scatter, no motion
      dots.forEach(function (d) { ctx.beginPath(); ctx.arc(d.bx, d.by, d.r, 0, 6.2832); ctx.fillStyle = 'rgba(' + d.col + ',' + d.a + ')'; ctx.fill(); });
    } else if (!running) { running = true; requestAnimationFrame(frame); }
  }

  var t0 = null;
  function frame(ts) {
    if (t0 === null) t0 = ts;
    var t = (ts - t0) / 1000;
    for (var k = 0; k < clusters.length; k++) {
      var c = clusters[k];
      c.ctx.clearRect(0, 0, c.w, c.h);
      for (var i = 0; i < c.dots.length; i++) {
        var d = c.dots[i];
        var x = d.bx + Math.sin(t * d.sx + d.px) * d.ax;
        var y = d.by + Math.cos(t * d.sy + d.py) * d.ay;
        c.ctx.beginPath();
        c.ctx.arc(x, y, d.r, 0, 6.2832);
        c.ctx.fillStyle = 'rgba(' + d.col + ',' + d.a + ')';
        c.ctx.fill();
      }
    }
    requestAnimationFrame(frame);
  }

  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function (ents) { ents.forEach(function (e) { initHost(e.target); }); });
    hosts.forEach(function (h) { ro.observe(h); });
  }
  hosts.forEach(initHost);                        // try immediately (active phase)
})();

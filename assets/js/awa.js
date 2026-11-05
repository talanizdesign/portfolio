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

  // reduced motion or no canvas → skip straight in; otherwise play on every visit
  if (reduce || !canvas || !canvas.getContext) {
    overlay.classList.add('is-hidden', 'is-removed');
    return;
  }

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
    panel.querySelectorAll('.awa-blocks .awa-block, .awa-idea > .reveal').forEach(function (el, i) {
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
    document.body.setAttribute('data-phase', id);   // lets the dot field recede on dense phases
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

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PAL = ['#65A0FE', '#4073CC', '#FF9E7D', '#E57E73', '#72B172', '#B2D4FF'];

  function build() {
    if (!wrap.offsetHeight) return; // not visible yet
    var cr = wrap.getBoundingClientRect();
    // when motion is reduced, keep an arrowhead on the line to show direction
    svg.innerHTML = reduce
      ? '<defs><marker id="awaArrow" viewBox="0 0 8 8" refX="5.5" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1 L6 4 L1 7" fill="none" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>'
      : '';

    conns.forEach(function (c, idx) {
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

      var pid = 'awaFlow' + idx;
      var base = document.createElementNS(NS, 'path');
      base.setAttribute('d', d);
      base.setAttribute('id', pid);
      base.setAttribute('class', 'awa-loop__base');
      if (reduce) base.setAttribute('marker-end', 'url(#awaArrow)');
      svg.appendChild(base);

      if (reduce) return;
      // small coloured dots travelling along the line, in the flow direction
      var len = base.getTotalLength();
      var dur = Math.max(2.6, len / 45);             // constant visual speed per line (calm)
      var cols = [PAL[idx % PAL.length], PAL[(idx + 3) % PAL.length]];
      for (var di = 0; di < cols.length; di++) {
        var dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('r', '3');
        dot.setAttribute('fill', cols[di]);
        var am = document.createElementNS(NS, 'animateMotion');
        am.setAttribute('dur', dur + 's');
        am.setAttribute('repeatCount', 'indefinite');
        am.setAttribute('calcMode', 'linear');
        am.setAttribute('begin', (-di * dur / 2) + 's');  // stagger the two dots
        var mp = document.createElementNS(NS, 'mpath');
        mp.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + pid);
        mp.setAttribute('href', '#' + pid);
        am.appendChild(mp);
        dot.appendChild(am);
        svg.appendChild(dot);
      }
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

/* ---- The idea: a faint field of Awa-coloured emotion dots drifting behind the copy ---- */
(function pageField() {
  var host = document.querySelector('.awa-page-dots');
  if (!host || !host.getContext) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  // Awa palette — emotions as dots. Blues carry the field; coral + green are
  // the positive / negative accents (kept sparse).
  var PAL = [
    [101, 160, 254], [101, 160, 254], [64, 115, 204], [178, 212, 255], [178, 212, 255],
    [255, 158, 125], [229, 126, 115],
    [114, 177, 114], [97, 133, 102]
  ];
  // Pre-rendered soft sprites: a crisp-cored one for seeds, a fully-soft one
  // for the out-of-focus bokeh. drawImage is far cheaper than a gradient/frame.
  function sprite(c, coreStop) {
    var s = 64, cv = document.createElement('canvas'); cv.width = cv.height = s;
    var g = cv.getContext('2d');
    var rg = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    var rgb = c[0] + ',' + c[1] + ',' + c[2];
    rg.addColorStop(0, 'rgba(' + rgb + ',1)');
    if (coreStop > 0) rg.addColorStop(coreStop, 'rgba(' + rgb + ',1)');
    rg.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = rg; g.fillRect(0, 0, s, s);
    return cv;
  }
  var coreSprites = PAL.map(function (c) { return sprite(c, 0.5); });
  var softSprites = PAL.map(function (c) { return sprite(c, 0); });
  var BOKEH_IDX = [0, 3, 4];                        // light blues only

  var ctx, dots = [], W = 0, H = 0, running = false, dmv = 0;
  // The reading column + side nav are ALWAYS clear. On the reference-dense
  // phases (stack / system) the whole content column clears too, so the dots
  // move out to the margins around it — same identity, never behind the text.
  var txtC = 0, txtH = 1, navL = -1, navR = -1, contL = 0, contR = 0;

  function alwaysClear(x) {
    return Math.abs(x - txtC) < txtH || (x > navL && x < navR);
  }
  function targetDense() {
    var ph = document.body.getAttribute('data-phase');
    // idea, stack and system keep the content column clear — dots stay in the margins
    return (ph === 'idea' || ph === 'stack' || ph === 'system') ? 1 : 0;
  }
  function mk(x, y, r, a, idx, soft) {
    return {
      bx: x, by: y, r: r, a: a, idx: idx, soft: soft,
      ax: 9 + Math.random() * 16, ay: 9 + Math.random() * 16,     // a touch more travel
      px: Math.random() * 6.28, py: Math.random() * 6.28,
      sx: 0.12 + Math.random() * 0.20, sy: 0.12 + Math.random() * 0.20  // and a touch quicker
    };
  }

  function zones() {
    var content = document.querySelector('.awa-content');
    var nav = document.querySelector('.awa-phases');
    if (content) {
      var cr = content.getBoundingClientRect();
      txtC = cr.left + cr.width / 2;
      txtH = Math.min(cr.width * 0.30, 300) + 10;
      contL = cr.left - 6; contR = cr.right + 6;
    } else { txtC = W / 2; txtH = W * 0.28; contL = W * 0.12; contR = W * 0.88; }
    if (nav) {
      var nr = nav.getBoundingClientRect();
      if (nr.width < W * 0.5) { navL = nr.left - 10; navR = nr.right + 10; } // side column only
      else { navL = navR = -1; }                     // stacked / horizontal nav → no band
    } else { navL = navR = -1; }
  }

  function build() {
    var w = Math.round(window.innerWidth), h = Math.round(window.innerHeight);
    if (w < 10 || h < 10) return;
    W = w; H = h;
    host.width = w * dpr; host.height = h * dpr;
    ctx = host.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    zones();

    dots = [];
    var nSmall = Math.round(Math.min(220, Math.max(60, (w * h) / 6400)));
    var nBokeh = Math.max(5, Math.min(14, Math.round((w * h) / 110000)));
    for (var b = 0; b < nBokeh; b++) {             // deep bokeh
      var bx = Math.random() * w, by = Math.random() * h;
      if (alwaysClear(bx)) { b--; continue; }
      dots.push(mk(bx, by, 24 + Math.random() * 26, 0.12 + Math.random() * 0.06,
                   BOKEH_IDX[(Math.random() * 3) | 0], true));
    }
    for (var i = 0; i < nSmall; i++) {             // seeds: far + near
      var x = Math.random() * w, y = Math.random() * h;
      if (alwaysClear(x)) continue;
      var near = Math.random() < 0.5;
      var r = near ? (3 + Math.random() * 4) : (2 + Math.random() * 3.5);
      var a = near ? (0.42 + Math.random() * 0.28) : (0.10 + Math.random() * 0.12);
      dots.push(mk(x, y, r, a, (Math.random() * PAL.length) | 0, false));
    }

    dmv = targetDense();
    if (reduce) render(0);
    else if (!running) { running = true; requestAnimationFrame(frame); }
  }

  function render(t) {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      // fade out dots over the content column as the dense phases engage
      var m = (d.bx > contL - 26 && d.bx < contR + 26) ? (1 - dmv) : 1;  // +drift so edge dots can't bleed in
      if (m <= 0.015) continue;
      var x = d.bx + Math.sin(t * d.sx + d.px) * d.ax;
      var y = d.by + Math.cos(t * d.sy + d.py) * d.ay;
      ctx.globalAlpha = d.a * m;
      ctx.drawImage(d.soft ? softSprites[d.idx] : coreSprites[d.idx], x - d.r, y - d.r, d.r * 2, d.r * 2);
    }
    ctx.globalAlpha = 1;
  }

  var t0 = null;
  function frame(ts) {
    if (t0 === null) t0 = ts;
    dmv += (targetDense() - dmv) * 0.05;          // ease toward the active phase
    if (W && H) render((ts - t0) / 1000);
    requestAnimationFrame(frame);
  }

  var rT;
  function schedule() { clearTimeout(rT); rT = setTimeout(build, 150); }
  window.addEventListener('resize', schedule);
  build();
  setTimeout(build, 400);       // recompute once fonts / layout settle
})();

/* ---- Design Concept: interactive brand map — click a pillar to reveal it ---- */
(function brandMap() {
  var wrap = document.getElementById('awaBrandmap');
  if (!wrap) return;
  var cv = wrap.querySelector('.awa-brandmap__canvas');
  if (!cv || !cv.getContext) return;
  var detail = document.getElementById('awaDetail');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var FONT = 'Inter, system-ui, -apple-system, sans-serif';
  var defs = [
    ['Mission', 'Mission', '#65A0FE', '101,160,254', -90, 't'],
    ['Audience', 'Target audience', '#FF9E7D', '255,158,125', -18, 'r'],
    ['Values', 'Core values', '#72B172', '114,177,114', 54, 'r'],
    ['Tone', 'Tone of voice', '#E57E73', '229,126,115', 126, 'l'],
    ['Vibe', 'The vibe', '#4073CC', '64,115,204', 198, 'l']
  ];
  var CORECOL = ['101,160,254', '255,158,125', '114,177,114', '64,115,204', '229,126,115'];
  var pillars = defs.map(function (d) { return { a: d[4] * Math.PI / 180, rgb: d[3] }; });
  var core = [];
  for (var i = 0; i < 18; i++) {
    core.push({ a: Math.random() * 6.28, r: 16 + Math.random() * 26, rr: 1 + Math.random() * 1.8, col: CORECOL[(Math.random() * CORECOL.length) | 0], ph: Math.random() * 6.28 });
  }
  var selected = 0, btns = [], nodePos = [], ctx, W = 0, H = 0, running = false;

  defs.forEach(function (d, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'awa-brandmap__node awa-brandmap__node--' + d[5] + (i === 0 ? ' is-active' : '');
    b.style.setProperty('--hue', d[2]);
    b.setAttribute('aria-label', d[1]);
    b.textContent = d[0];
    b.addEventListener('click', function () { select(i); });
    wrap.appendChild(b);
    btns.push(b);
  });

  function select(i) {
    selected = i;
    btns.forEach(function (b, j) { b.classList.toggle('is-active', j === i); });
    detail.querySelectorAll('.awa-pd').forEach(function (p) {
      p.classList.toggle('is-active', +p.getAttribute('data-pillar') === i);
    });
  }

  function geom() { return { cx: W / 2, cy: H / 2, rx: Math.min(W * 0.30, 200), ry: Math.min(H * 0.40, 190) }; }
  function position() {
    var g = geom();
    for (var i = 0; i < pillars.length; i++) {
      var n = { x: g.cx + Math.cos(pillars[i].a) * g.rx, y: g.cy + Math.sin(pillars[i].a) * g.ry };
      nodePos[i] = n;
      btns[i].style.left = n.x + 'px';
      btns[i].style.top = n.y + 'px';
    }
  }

  function build() {
    var w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    if (w !== W || h !== H) {
      W = w; H = h;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    position();
    if (reduce) draw(0);
    else if (!running) { running = true; requestAnimationFrame(frame); }
  }

  function draw(t) {
    var g = geom(), cx = g.cx, cy = g.cy;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < pillars.length; i++) {
      var n = nodePos[i], p = pillars[i], sel = i === selected;
      ctx.strokeStyle = 'rgba(' + p.rgb + ',' + (sel ? 0.5 : 0.18) + ')';
      ctx.lineWidth = sel ? 1.4 : 1;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(n.x, n.y); ctx.stroke();
      var f = (t * (sel ? 0.33 : 0.16) + i * 0.21) % 1;
      ctx.beginPath(); ctx.arc(cx + (n.x - cx) * f, cy + (n.y - cy) * f, sel ? 2.6 : 1.8, 0, 6.2832);
      ctx.fillStyle = 'rgba(' + p.rgb + ',' + (sel ? 0.75 : 0.5) + ')'; ctx.fill();
    }
    for (var k = 0; k < core.length; k++) {
      var d = core[k];
      var br = 1 + Math.sin(t * 0.7 + d.ph) * 0.09;
      var ex = cx + Math.cos(d.a) * d.r * br, ey = cy + Math.sin(d.a) * d.r * br;
      ctx.strokeStyle = 'rgba(20,20,22,0.05)'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.beginPath(); ctx.arc(ex, ey, d.rr, 0, 6.2832);
      ctx.fillStyle = 'rgba(' + d.col + ',0.85)'; ctx.fill();
    }
    ctx.font = '600 14px ' + FONT; ctx.fillStyle = 'rgba(20,20,22,0.9)';
    ctx.textAlign = 'center'; ctx.fillText('awa', cx, cy + 5);
  }

  var t0 = null;
  function frame(ts) { if (t0 === null) t0 = ts; draw((ts - t0) / 1000); requestAnimationFrame(frame); }

  if ('ResizeObserver' in window) new ResizeObserver(build).observe(wrap);
  window.addEventListener('resize', build);
  select(0);
  build();
  setTimeout(build, 400);
})();

/* ---- Hero: a few Awa-coloured dots drift beside the wordmark ---- */
/* Live app in the iPhone frame: scale the 402 × 874 app to the screen, and load it only when the
   phone comes near the viewport. */
(function () {
  var screen = document.getElementById('awaScreen');
  if (!screen) return;
  var frame = screen.querySelector('.awa-phone__frame');

  function fit() { screen.style.setProperty('--awa-scale', String(screen.clientWidth / 402)); }
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(screen);
  window.addEventListener('resize', fit);
  fit();

  function load() { if (!frame.src) frame.src = frame.getAttribute('data-src'); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { load(); io.disconnect(); }
    }, { rootMargin: '400px' });
    io.observe(screen);
  } else {
    load();
  }
})();

/* ---- Design system: components explorer ----
   Laid out like a Carbon component page: header (name, status, overview), the live demo, then
   tabs (Guidelines, Specs, Code, Accessibility). The demo is the real component from the web build
   (awa-app/?specimen=…); the page talks to it with postMessage:
     out { type: 'awa-specimen', name, state, anatomy, reduceMotion, replay }
     in  awa-specimen-ready / -size (its height) / -state (after a tap inside it).
   The copy (approved by Teresa, drafts/component-explorer-copy-v2.md) lives here. */
(function componentsExplorer() {
  var root = document.getElementById('awaCx');
  if (!root) return;

  var HEX = {
    'Primary/700': '#4073CC', 'Primary/900': '#1F4080',
    'Secondary/100': '#FFF1E8', 'Secondary/300': '#FFE4D6', 'Secondary/500': '#FF9E7D', 'Secondary/700': '#E57E73', 'Secondary/900': '#AD5047',
    'Tertiary/100': '#EDF5ED', 'Tertiary/300': '#C7D9C7', 'Tertiary/500': '#72B172', 'Tertiary/700': '#5B7D60', 'Tertiary/900': '#335438',
    'Neutral/100': '#F2EDE8', 'Neutral/300': '#D6CFC7', 'Neutral/700': '#615952', 'White': '#FFFFFF'
  };

  var C = {
    clock: {
      name: 'Emotion clock',
      intro: 'One emotion over the last 30 days, drawn as a dandelion. Each stem is a day, and the longer it is, the more often the emotion came up.',
      states: [['mixed', 'Mixed'], ['good', 'Good'], ['notsogood', 'Not so good']],
      group: 'Variant',
      use: 'To show how one emotion, or one app, felt across the last month.',
      dont: 'For a shorter period, use the Week meadow. For exact numbers, use the line under the clock, which gives the counts.',
      tables: [
        { title: 'Variants', head: ['Variant', 'Purpose'], rows: [
          ['Mixed', 'An app’s month, with good and not so good feelings together. On an app’s page and in app rows.'],
          ['Good', 'One good emotion’s month, in green. On that emotion’s page.'],
          ['Not so good', 'One not so good emotion’s month, in peach. On that emotion’s page.']
        ] },
        { title: 'Sizes', head: ['Size', 'Use'], rows: [
          ['Large', 'On an app’s page and an emotion’s page. With motion, and seeds you can tap.'],
          ['Small', 'In app rows on Home and in Your apps. Still, and not tappable.']
        ] }
      ],
      anatomy: [
        ['Centre', 'the emotion itself, the point every day grows from.'],
        ['Today', 'the stem at the top. Older days follow clockwise.'],
        ['Stem', 'one day. It gets longer with each time the emotion was logged, up to a limit.'],
        ['Seed', 'good feelings sit closer to the centre, not so good ones further out.'],
        ['Empty day', 'a short grey stem, so a quiet day still has its place.']
      ],
      dos: [
        ['Show all 30 days, including the empty ones.', 'Hide an empty day. It’s information, not a gap.'],
        ['Let a tap on a seed show its day.', 'Add numbers on the drawing itself.']
      ],
      tokens: ['Tertiary/500', 'Tertiary/700', 'Secondary/500', 'Secondary/700', 'Neutral/300', 'Primary/900'],
      code: '<EmotionClock\n  days={clockDays(entries)}\n  size={240}\n  label="Amusement, last month: 12 times"\n  onPressDay={showDay}\n/>',
      props: [
        ['`days`', '30 days, today first, each with its good and not so good count'],
        ['`size`', 'the width; Small is 56'],
        ['`label`', 'the sentence VoiceOver reads'],
        ['`selected`, `onPressDay`', 'ring a day’s seed, and make the clock tappable and adjustable for VoiceOver'],
        ['`describeDay`', 'what VoiceOver says for a day'],
        ['`still`', 'no motion; for Small']
      ],
      a11y: [
        'VoiceOver reads one sentence in place of the drawing, for example “Amusement, last month: 12 times”.',
        'Tap near a stem to see its day. The whole clock is one touch area, and a tap picks the nearest day, so seeds never compete.',
        'With VoiceOver, swipe up or down to move day by day. It reads the date and what was felt, for example “01 Nov: 1 time, Netflix”.',
        'With Reduce motion on, the clock appears finished, with no sweep and no breeze.'
      ],
      where: 'On an emotion’s page. Tap any entry in the journal on Home.'
    },
    meadow: {
      name: 'Week meadow',
      intro: 'The last 7 days on the Home screen, summed up in one emotion. The card takes the colour of that emotion’s family.',
      states: [['good', 'Good week'], ['notsogood', 'Not so good week']],
      group: 'Variant',
      use: 'At the top of Home, to sum up the week at a glance.',
      dont: 'For a whole month, use the Emotion clock. To list what happened, use the Journal entry.',
      tables: [
        { title: 'Variants', head: ['Variant', 'Purpose'], rows: [
          ['Good week', 'The week’s emotion is a good one. Green card.'],
          ['Not so good week', 'The week’s emotion is a not so good one. Peach card.']
        ] }
      ],
      anatomy: [
        ['Label', '“Your week, in one emotion”.'],
        ['Week emotion', 'the emotion that came up most.'],
        ['One-liner', 'what that emotion means, in a few words.'],
        ['Busiest day', 'the tallest stem. Seeds stack down it, good above and not so good below.'],
        ['Today', 'the last stem on the right.']
      ],
      dos: [
        ['Keep 7 stems: oldest on the left, today on the right.', 'Let a busy day grow taller. Pack its seeds closer, so the card keeps its height.'],
        ['Match the card’s tint to the week’s emotion.', 'Mix the green and peach tints on one card.']
      ],
      tokens: ['Tertiary/100', 'Tertiary/900', 'Secondary/100', 'Secondary/900', 'Tertiary/300', 'Secondary/300', 'Display', 'Body Large', 'Overline', 'Radius/24'],
      code: '<WeekCard\n  emotion="Joy"\n  sentiment="positive"\n  oneLiner="You feel a simple, easy happiness"\n  days={lastSevenDays}\n/>',
      props: [
        ['`emotion`, `oneLiner`', 'the week’s emotion and what it means'],
        ['`sentiment`', '`positive` or `negative`; sets the tint'],
        ['`days`', '7 days, oldest first'],
        ['`onPress`', 'optional; makes the card a button']
      ],
      a11y: [
        'Text on both cards passes 4.5:1 (7.7:1 on green, 4.7:1 on peach).',
        'VoiceOver reads the whole card as one sentence: the emotion, the one-liner and the week’s count of good and not so good feelings. The meadow drawing is hidden from it.',
        'With Reduce motion on, the stems are already grown.'
      ],
      where: 'At the top of Home.'
    },
    pill: {
      name: 'Emotion pill',
      intro: 'How you pick what you felt when you log. Twenty emotions, each tinted by its family.',
      states: [['none', 'None picked'], ['one', 'One picked'], ['three', 'Three picked']],
      start: 'three',
      group: 'State',
      use: 'In Log, to pick up to three emotions.',
      dont: 'To show an emotion that’s already logged. The seal in the Journal entry and the seeds in the bouquet do that.',
      tables: [
        { title: 'States', head: ['State', 'What happens'], rows: [
          ['None picked', 'Every pill is available.'],
          ['One picked', 'The picked pill fills with its family’s dark shade.'],
          ['Three picked', 'The limit is reached, so the rest dim until one is unpicked.']
        ] }
      ],
      anatomy: [
        ['Family tint', 'green for good emotions, peach for not so good ones.'],
        ['Glyph', 'the emotion’s icon.'],
        ['Name', 'the emotion, in Caption.'],
        ['Selected', 'filled with the family’s dark shade, text in white.'],
        ['Dimmed', 'once three are picked, the rest fade out.']
      ],
      dos: [
        ['Show the pick with the fill.', 'Change a pill’s family colour to show its state.'],
        ['Use a long press to explain what the emotion means.', 'Open the meaning on a tap. A tap only picks.']
      ],
      tokens: ['Tertiary/100', 'Tertiary/700', 'Tertiary/900', 'Secondary/100', 'Secondary/700', 'Secondary/900', 'White', 'Caption', 'Radius/Pill', 'Spacing/16', 'Spacing/8'],
      code: '<EmotionPill\n  name="Joy"\n  sentiment="positive"\n  selected={picked}\n  dimmed={limitReached}\n  onPress={toggle}\n  onLongPress={explain}\n/>',
      props: [
        ['`name`, `sentiment`', 'the emotion and its family'],
        ['`selected`, `dimmed`', 'the two states, also read by VoiceOver'],
        ['`onPress`, `onLongPress`', 'pick, and explain']
      ],
      a11y: [
        'Each pill is a checkbox for VoiceOver, with its checked and disabled state, and the hint “Long press to see what it means”.',
        'Text passes 4.5:1 in every state (4.6:1 or more when selected).',
        'The touch area is 44pt high.'
      ],
      where: 'In Log, when you pick your emotions.'
    },
    dandelion: {
      name: 'Pick dandelion',
      intro: 'It sits above the pills and fills up as you pick, so you can see how many are left without counting.',
      states: [['0', '0'], ['1', '1'], ['2', '2'], ['3', '3']],
      start: '2',
      group: 'State',
      use: 'Above the emotion pills in Log, to show how many picks are left.',
      dont: 'As a control. It can’t be tapped, and picking happens on the pills.',
      tables: [
        { title: 'States', head: ['State', 'What happens'], rows: [
          ['0', 'Three ghost seeds, tinted by the side shown in the picker (Good or Not so good).'],
          ['1 and 2', 'Each pick grows a seed in its family colour.'],
          ['3', 'Full. The pills dim.']
        ] }
      ],
      anatomy: [
        ['Centre', 'in Primary/900.'],
        ['Stem', 'one for each of the three places.'],
        ['Seed', 'a pick, in the colour of its family.'],
        ['Ghost seed', 'a place still free, as an outline.']
      ],
      dos: [
        ['Keep three places, always.', 'Add a fourth place or a number.'],
        ['Give each seed the family colour of the emotion picked.', 'Colour the seeds in a fixed order.']
      ],
      tokens: ['Primary/900', 'Neutral/300', 'Tertiary/500', 'Tertiary/700', 'Secondary/500', 'Secondary/700', 'Tertiary/300', 'Secondary/300'],
      code: '<PickDandelion picks={pickedSentiments} side="positive" />',
      props: [
        ['`picks`', 'the family of each emotion picked, up to 3'],
        ['`side`', 'the side shown in the picker; tints the ghost seeds'],
        ['`width`, `height`', '160 × 112 by default']
      ],
      a11y: [
        'It’s hidden from VoiceOver, because the pills already say what is picked.',
        'With Reduce motion on, seeds appear without growing out.'
      ],
      where: 'In Log, above the emotion pills.'
    },
    bouquet: {
      name: 'Log bouquet',
      intro: 'The confirmation after you log. What you felt comes back as a small bouquet, one stem for each emotion.',
      states: [['1', '1 emotion'], ['2', '2 emotions'], ['3', '3 emotions']],
      start: '3',
      group: 'State',
      use: 'Once, on the screen after a log is saved.',
      dont: 'To show history. The Journal entry does that.',
      tables: [
        { title: 'States', head: ['State', 'What happens'], rows: [
          ['1, 2 or 3 emotions', 'One stem and seed for each emotion in the log.']
        ] }
      ],
      anatomy: [
        ['Centre', 'where the stems start.'],
        ['Stem', 'one for each emotion logged.'],
        ['Seed and glyph', 'the emotion, the same size as the picker’s seals.'],
        ['Faint dots', 'small background seeds in the family colours, decorative only.']
      ],
      dos: [
        ['Give every emotion in the log its own stem.', 'Count or label the faint dots. They never carry meaning.'],
        ['Let it move once, then settle into a slow breeze.', 'Loop a celebration.']
      ],
      tokens: ['Tertiary/500', 'Tertiary/700', 'Secondary/500', 'Secondary/700', 'White', 'Primary/900', 'Neutral/300'],
      code: '<LogBouquet emotions={[\'Joy\', \'Anxiety\', \'Relief\']} width={300} height={280} />',
      props: [
        ['`emotions`', 'the names in the log, 1 to 3'],
        ['`width`, `height`', 'the space it fits into'],
        ['`still`', 'no motion']
      ],
      a11y: [
        'VoiceOver reads the bouquet as one image: “Your bouquet: Joy, good; Anxiety, not so good”.',
        'With Reduce motion on, it appears complete and still.'
      ],
      where: 'In Log, after you save.'
    },
    journal: {
      name: 'Journal entry',
      intro: 'Your history on Home, week by week. The same timeline shows on each app’s page, where the second line explains the emotion.',
      states: [['week', 'A week of entries']],
      group: 'Variant',
      use: 'To list logs over time: on Home, in History, and on an app’s page.',
      dont: 'To sum up a period. The Week meadow and the Emotion clock do that.',
      tables: [
        { title: 'Variants', head: ['Variant', 'Purpose'], rows: [
          ['Home and History', 'The second line is the app. Rows rise in.'],
          ['App page', 'The second line is the emotion’s meaning. Rows don’t move, because the list is filtered by Good and Not so good.']
        ] }
      ],
      anatomy: [
        ['Week', 'seven days counted back from today.'],
        ['Date', 'day and month.'],
        ['Seal', 'the emotion’s icon on its family colour.'],
        ['Emotion', 'its name, in Body Bold.'],
        ['Second line', 'the app on Home, the emotion’s meaning on an app’s page.'],
        ['Thread', 'the line that links the entries in a week.']
      ],
      dos: [
        ['Put the newest at the top, in weeks counted back from today.', 'Group by calendar week.'],
        ['Change only the second line between screens.', 'Replay the entrance when the list is filtered.']
      ],
      tokens: ['Primary/900', 'Primary/700', 'Neutral/700', 'Neutral/100', 'Heading 3', 'Body Bold', 'Caption Bold', 'Caption', 'Small'],
      code: '<JournalWeeks\n  entries={history}\n  subtitle={(e) => e.appName}\n  onPressEntry={openEmotion}\n/>',
      props: [
        ['`entries`', 'the logs, newest first'],
        ['`subtitle`', 'what the second line says'],
        ['`onPressEntry`', 'opens the emotion’s page'],
        ['`animate`', '`false` on an app’s page']
      ],
      a11y: [
        'Each entry is one button for VoiceOver, for example “Joy, Spotify, 03 Nov”.',
        'All text passes 4.5:1 (Neutral/700 at 6.9:1, Primary/700 at 4.6:1).',
        'With Reduce motion on, rows don’t rise in.'
      ],
      where: 'On Home, below Your week.'
    }
  };

  var $ = function (sel) { return root.querySelector(sel); };
  var tabs = Array.prototype.slice.call(root.querySelectorAll('.awa-cx__thumb'));
  var docTabs = Array.prototype.slice.call(root.querySelectorAll('.awa-cx__tab'));
  var panel = $('.awa-cx');
  var tp = $('.awa-cx__tp');
  var frame = $('.awa-cx__iframe');
  var statesEl = $('.awa-cx__states');
  var anat = $('.awa-cx__anat');
  var rm = $('.awa-cx__rm');

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  rm.checked = !!reduced;
  var cur = 'clock';
  var state = C.clock.states[0][0];
  var doc = 'guide';
  var ready = false;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  // Text with `code` spans, built as nodes (no innerHTML).
  function rich(tag, cls, text) {
    var e = el(tag, cls);
    String(text).split('`').forEach(function (part, i) {
      if (!part) return;
      e.appendChild(i % 2 ? el('code', null, part) : document.createTextNode(part));
    });
    return e;
  }
  function h(text) { return el('h5', 'awa-cx__h', text); }
  function send(extra) {
    if (!ready || !frame.contentWindow) return;
    var m = { type: 'awa-specimen', name: cur, state: state, anatomy: anat.checked, reduceMotion: rm.checked };
    for (var k in extra) m[k] = extra[k];
    frame.contentWindow.postMessage(m, '*');
  }

  /* ---------- live demo: variant / state buttons ---------- */
  function renderStates() {
    var d = C[cur];
    statesEl.innerHTML = '';
    statesEl.hidden = d.states.length < 2;
    statesEl.setAttribute('aria-label', d.group);
    d.states.forEach(function (s) {
      var b = el('button', 'awa-cx__state', s[1]);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(s[0] === state));
      b.addEventListener('click', function () { setState(s[0]); send(); });
      statesEl.appendChild(b);
    });
  }
  function setState(s) {
    state = s;
    Array.prototype.forEach.call(statesEl.children, function (b, i) {
      b.setAttribute('aria-pressed', String(C[cur].states[i][0] === s));
    });
  }

  /* ---------- documentation tabs ---------- */
  function table(t) {
    var wrap = el('div', 'awa-cx__sec');
    wrap.appendChild(h(t.title));
    var tb = el('table', 'awa-cx__table');
    var thead = el('thead'), tr = el('tr');
    t.head.forEach(function (c) { var th = el('th', null, c); th.scope = 'col'; tr.appendChild(th); });
    thead.appendChild(tr);
    tb.appendChild(thead);
    var tbody = el('tbody');
    t.rows.forEach(function (r) {
      var row = el('tr');
      var th = el('th', null, r[0]);
      th.scope = 'row';
      row.appendChild(th);
      row.appendChild(el('td', null, r[1]));
      tbody.appendChild(row);
    });
    tb.appendChild(tbody);
    wrap.appendChild(tb);
    return wrap;
  }
  function guide(d) {
    var f = document.createDocumentFragment();
    var use = el('div', 'awa-cx__use');
    [['When to use', d.use], ['When not to use', d.dont]].forEach(function (u) {
      var c = el('div', 'awa-cx__use-col');
      c.appendChild(h(u[0]));
      c.appendChild(el('p', null, u[1]));
      use.appendChild(c);
    });
    f.appendChild(use);
    d.tables.forEach(function (t) { f.appendChild(table(t)); });

    var an = el('div', 'awa-cx__sec');
    an.appendChild(h('Anatomy'));
    var ol = el('ol', 'awa-cx__anatomy');
    d.anatomy.forEach(function (a, i) {
      var li = el('li');
      li.appendChild(el('span', 'awa-cx__n', String(i + 1)));
      var t = el('span');
      t.appendChild(el('strong', null, a[0]));
      t.appendChild(document.createTextNode(': ' + a[1]));
      li.appendChild(t);
      ol.appendChild(li);
    });
    an.appendChild(ol);
    f.appendChild(an);

    var dd = el('div', 'awa-cx__sec');
    dd.appendChild(h('Do and don’t'));
    d.dos.forEach(function (pair) {
      var row = el('div', 'awa-cx__dd');
      [['do', 'Do', pair[0]], ['dont', 'Don’t', pair[1]]].forEach(function (x) {
        var c = el('p', 'awa-cx__dd-' + x[0]);
        c.appendChild(el('span', 'awa-cx__dd-k', x[1]));
        c.appendChild(document.createTextNode(x[2]));
        row.appendChild(c);
      });
      dd.appendChild(row);
    });
    f.appendChild(dd);
    return f;
  }
  function specs(d) {
    var f = el('div', 'awa-cx__sec');
    f.appendChild(h('Tokens'));
    var ul = el('ul', 'awa-cx__tokens');
    d.tokens.forEach(function (t) {
      var li = el('li', 'awa-cx__token');
      if (HEX[t]) {
        var sw = el('span', 'awa-cx__sw');
        sw.style.background = HEX[t];
        sw.setAttribute('aria-hidden', 'true');
        li.appendChild(sw);
      }
      li.appendChild(document.createTextNode(t));
      ul.appendChild(li);
    });
    f.appendChild(ul);
    return f;
  }
  function code(d) {
    var f = document.createDocumentFragment();
    var s1 = el('div', 'awa-cx__sec');
    s1.appendChild(h('Usage'));
    var pre = el('pre', 'awa-cx__code');
    pre.appendChild(el('code', null, d.code));
    s1.appendChild(pre);
    f.appendChild(s1);
    var s2 = el('div', 'awa-cx__sec');
    s2.appendChild(h('Props'));
    var dl = el('dl', 'awa-cx__props');
    d.props.forEach(function (p) {
      dl.appendChild(rich('dt', null, p[0]));
      dl.appendChild(rich('dd', null, p[1]));
    });
    s2.appendChild(dl);
    f.appendChild(s2);
    return f;
  }
  // The same icons as "Accessible by default" further down the page, plus one for contrast.
  var A11Y_ICONS = {
    touch: '<rect x="3.5" y="3.5" width="17" height="17" rx="4" stroke-dasharray="3 3"/><circle cx="12" cy="12" r="3"/>',
    voiceover: '<path d="M3 10v4"/><path d="M7 6v12"/><path d="M11 3v18"/><path d="M15 8v8"/><path d="M19 5v14"/>',
    motion: '<circle cx="12" cy="12" r="8.5"/><path d="M10 9v6"/><path d="M14 9v6"/>',
    contrast: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none"/>'
  };
  var A11Y_NAMES = { touch: 'Touch', voiceover: 'VoiceOver', motion: 'Reduce motion', contrast: 'Contrast' };
  function a11yKind(text) {
    if (/Reduce motion/.test(text)) return 'motion';
    if (/VoiceOver/.test(text)) return 'voiceover';
    if (/:1|contrast/i.test(text)) return 'contrast';
    return 'touch';
  }
  function a11y(d) {
    var f = el('div', 'awa-cx__sec');
    f.appendChild(h('Accessibility'));
    var ul = el('ul', 'awa-cx__a11y');
    d.a11y.forEach(function (r) {
      var kind = a11yKind(r);
      var li = el('li');
      var ic = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      ic.setAttribute('viewBox', '0 0 24 24');
      ic.setAttribute('aria-hidden', 'true');
      ic.innerHTML = A11Y_ICONS[kind];      // fixed markup from above, never page data
      li.appendChild(ic);
      var t = el('span');
      t.appendChild(el('strong', 'awa-cx__a11y-k', A11Y_NAMES[kind]));
      t.appendChild(document.createTextNode(r));
      li.appendChild(t);
      ul.appendChild(li);
    });
    f.appendChild(ul);
    return f;
  }
  var RENDER = { guide: guide, specs: specs, code: code, a11y: a11y };

  function renderDoc() {
    var d = C[cur];
    tp.innerHTML = '';
    tp.appendChild(RENDER[doc](d));
    tp.setAttribute('aria-labelledby', 'awaCxDoc-' + doc);
    docTabs.forEach(function (t) {
      var on = t.dataset.t === doc;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
  }
  function renderHead() {
    var d = C[cur];
    $('.awa-cx__name').textContent = d.name;
    $('.awa-cx__intro').textContent = d.intro;
    $('.awa-cx__where-t').textContent = d.where;
    frame.title = d.name + ', the live component';
  }

  function select(name, focus) {
    if (!C[name]) return;
    cur = name;
    state = C[name].start || C[name].states[0][0];
    tabs.forEach(function (t) {
      var on = t.dataset.c === name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on) {
        panel.setAttribute('aria-labelledby', t.id);
        if (focus) t.focus();
      }
    });
    renderHead();
    renderStates();
    renderDoc();
    send();
  }

  // Arrow keys move between tabs in a tablist (WAI-ARIA tabs pattern).
  function arrows(list, go) {
    list.forEach(function (t, i) {
      t.addEventListener('keydown', function (e) {
        var j = null;
        if (e.key === 'ArrowRight') j = (i + 1) % list.length;
        else if (e.key === 'ArrowLeft') j = (i - 1 + list.length) % list.length;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = list.length - 1;
        if (j === null) return;
        e.preventDefault();
        go(list[j]);
        list[j].focus();
      });
    });
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { select(t.dataset.c); }); });
  arrows(tabs, function (t) { select(t.dataset.c); });
  docTabs.forEach(function (t) { t.addEventListener('click', function () { doc = t.dataset.t; renderDoc(); }); });
  arrows(docTabs, function (t) { doc = t.dataset.t; renderDoc(); });

  anat.addEventListener('change', function () { send(); });
  rm.addEventListener('change', function () { send(); });
  $('.awa-cx__replay').addEventListener('click', function () { send({ replay: true }); });

  window.addEventListener('message', function (e) {
    if (e.source !== frame.contentWindow || !e.data || typeof e.data.type !== 'string') return;
    var m = e.data;
    if (m.type === 'awa-specimen-ready') {
      var first = !ready;
      ready = true;
      if (first) send();     // bring the specimen in line with the page (Reduce motion, a tab picked early)
    }
    if (m.height && (m.type === 'awa-specimen-ready' || m.type === 'awa-specimen-size') && m.name === cur) {
      frame.style.height = Math.ceil(m.height) + 'px';
    }
    if (m.type === 'awa-specimen-state' && m.name === cur && typeof m.state === 'string') setState(m.state);
  });

  // "See it in the app": open phase 04 and bring the phone into view.
  $('.awa-cx__app').addEventListener('click', function (e) {
    var btn = document.querySelector('.awa-phase-btn[data-phase="app"]');
    if (!btn) return;
    e.preventDefault();
    btn.click();
    var phone = document.getElementById('awaScreen');
    if (phone) setTimeout(function () { phone.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); }, 60);
  });

  // Load the specimen only when the explorer comes near the viewport (its panel may start hidden).
  function load() {
    if (frame.src) return;
    var src = frame.getAttribute('data-src');
    if (rm.checked) src += '&rm=1';
    frame.src = src;
  }
  if ('IntersectionObserver' in window) {
    var lio = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { load(); lio.disconnect(); }
    }, { rootMargin: '600px' });
    lio.observe(frame);
  } else {
    load();
  }

  renderHead();
  renderStates();
  renderDoc();
})();

/* ---- Design system: Foundations tabs, and the section sub-navigation ----
   Foundations groups colour, type, spacing and radius as tabs (WAI-ARIA tabs pattern).
   The sub-navigation lists the five parts of 03: under "03 Design system" in the side menu on
   desktop, as a sticky chip row on mobile. The part you're reading is marked as you scroll, and a
   click scrolls to it without changing the #system address. */
(function designSystemNav() {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.awa-ftabs [role="tab"]'));
  function show(t, focus) {
    tabs.forEach(function (x) {
      var on = x === t;
      x.setAttribute('aria-selected', String(on));
      x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) t.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(t); });
    t.addEventListener('keydown', function (e) {
      var j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = tabs.length - 1;
      if (j === null) return;
      e.preventDefault();
      show(tabs[j], true);
    });
  });

  var links = Array.prototype.slice.call(document.querySelectorAll('.awa-subnav a'));
  if (!links.length) return;
  var ids = [];
  links.forEach(function (a) { if (ids.indexOf(a.dataset.sys) === -1) ids.push(a.dataset.sys); });
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mark(id) {
    links.forEach(function (a) {
      if (a.dataset.sys === id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    // keep the active chip in view in the mobile row
    var chip = document.querySelector('.awa-subnav--chips a[data-sys="' + id + '"]');
    if (chip && chip.parentElement.scrollWidth > chip.parentElement.clientWidth) {
      var row = chip.parentElement;
      row.scrollTo({ left: chip.offsetLeft - 16, behavior: reduced ? 'auto' : 'smooth' });
    }
  }

  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.getElementById(a.dataset.sys);
      if (!target) return;
      e.preventDefault();
      var sys = document.querySelector('.awa-phase-btn[data-phase="system"]');
      if (sys && !sys.classList.contains('is-active')) sys.click();
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      mark(a.dataset.sys);
    });
  });

  // The part whose top has passed a line a third of the way down the screen is the one being read.
  function spy() {
    if (document.body.getAttribute('data-phase') !== 'system') return;
    var line = window.innerHeight * 0.33, cur = ids[0];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= line) cur = id;
    });
    mark(cur);
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; spy(); });
  }, { passive: true });
  window.addEventListener('resize', spy);
  document.querySelectorAll('.awa-phase-btn').forEach(function (b) { b.addEventListener('click', function () { setTimeout(spy, 50); }); });
  spy();
})();

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
function startHero() {
  if (heroStarted) return;
  heroStarted = true;

  var wordmark = document.querySelector('.wordmark');
  if (!wordmark) return; // not the home page

  var block = document.querySelector('.home__block');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lines = wordmark.querySelectorAll('.wm-line');

  wordmark.style.visibility = 'visible';
  if (block) block.classList.add('hero-in');

  if (reduce) {
    lines.forEach(function (l) { l.textContent = l.getAttribute('data-text'); });
    return;
  }
  lines.forEach(function (l, i) {
    scramble(l, l.getAttribute('data-text'), { duration: 1900, delay: i * 300 });
  });
}

/* ---- Intro: black screen for 1000ms, then fade to home (once per session).
   The hero entrance is triggered at the reveal moment so it stays in sync. ---- */
(function intro() {
  var el = document.getElementById('intro');
  if (!el) { startHero(); return; }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var played = sessionStorage.getItem('introPlayed');

  if (played || reduce) {
    el.parentNode && el.parentNode.removeChild(el);
    startHero();
    return;
  }

  setTimeout(function () {
    el.classList.add('is-hidden');
    sessionStorage.setItem('introPlayed', '1');
    startHero();
    setTimeout(function () { el.parentNode && el.parentNode.removeChild(el); }, 650);
  }, 1000);
})();

/* ---- Project tabs ---- */
(function tabs() {
  var tabEls = document.querySelectorAll('.tab');
  if (!tabEls.length) return;

  function activate(id) {
    tabEls.forEach(function (t) {
      t.classList.toggle('is-active', t.dataset.tab === id);
    });
    document.querySelectorAll('.panel').forEach(function (p) {
      p.classList.toggle('is-active', p.id === 'panel-' + id);
    });
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  }

  tabEls.forEach(function (t) {
    t.addEventListener('click', function () { activate(t.dataset.tab); });
  });

  // No project selected on load — only activate if the URL carries a valid hash.
  var hash = (location.hash || '').replace('#', '');
  var valid = ['ds', 'ux', 'ops', 'awa'];
  if (valid.indexOf(hash) !== -1) activate(hash);
})();

/* ---- Design System gallery ---- */
(function gallery() {
  var root = document.getElementById('dsGallery');
  if (!root) return;

  var slides = root.querySelectorAll('.gallery__slide');
  var prev = root.querySelector('.gallery__nav--prev');
  var next = root.querySelector('.gallery__nav--next');
  var counter = document.getElementById('dsCounter');
  var dotsWrap = document.getElementById('dsDots');
  if (!slides.length) return;

  var total = slides.length;
  var idx = 0;
  var dots = [];

  for (var i = 0; i < total; i++) {
    var d = document.createElement('button');
    d.type = 'button';
    d.className = 'gallery__dot' + (i === 0 ? ' is-active' : '');
    d.setAttribute('aria-label', 'Go to image ' + (i + 1) + ' of ' + total);
    (function (n) { d.addEventListener('click', function () { go(n); }); })(i);
    dotsWrap.appendChild(d);
    dots.push(d);
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
})();

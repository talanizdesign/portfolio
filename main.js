// Mobile nav toggle
(function () {
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', function () {
    var isOpen = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  menu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

// Scroll-linked gradient drift.
// Sets --sy on <html> (0 at top, grows with scroll, capped) which the blob
// pseudo-elements read to translate/scale via CSS transforms.
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !document.querySelector('.blob-field')) return;

  var ticking = false;
  function update() {
    var vh = window.innerHeight || 800;
    var ratio = Math.min((window.pageYOffset || 0) / vh, 2);
    root.style.setProperty('--sy', ratio.toFixed(4));
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
})();

// Projects list — click-to-expand progressive disclosure
(function () {
  var heads = document.querySelectorAll('.project-item__head');
  if (!heads.length) return;

  heads.forEach(function (head) {
    head.addEventListener('click', function () {
      var item = head.closest('.project-item');
      var isOpen = item.classList.toggle('is-open');
      head.setAttribute('aria-expanded', String(isOpen));
    });
  });
})();

// Scroll reveal
(function () {
  var items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach(function (el) { observer.observe(el); });
})();

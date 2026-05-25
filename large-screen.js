/* large-screen.js — companion to large-screen.css
   Locks .slide-deck to a 1600×1000 design canvas and scales it to
   fill the available viewport on screens 1600px+ wide. Below that
   threshold the script no-ops.

   Sets size + transform as inline styles so it wins specificity
   over per-deck inline <style> blocks (e.g. sf-composer.html).
*/
(function() {
  var CANVAS_W = 1600;
  var CANVAS_H = 1000;
  var MIN_VIEWPORT = 1600;
  var PAD = 0.95; // ~5% breathing room

  var deck = document.querySelector('.slide-deck');
  if (!deck) return;

  var slides = deck.querySelectorAll('.slide');

  // Find descendants of slides whose declared min-height is 100vh.
  // Those would otherwise resolve against the actual viewport (e.g.
  // 2160px on a 4K screen) and force scrolling inside the locked
  // 1000px canvas. We clamp them to canvas height when scaling is on.
  var clampTargets = [];
  slides.forEach(function(slide) {
    slide.querySelectorAll('*').forEach(function(el) {
      var ih = el.getAttribute('style') || '';
      // Inline style match (cheapest signal)
      if (/min-height\s*:\s*100vh/i.test(ih) || /height\s*:\s*100vh/i.test(ih)) {
        clampTargets.push(el);
      }
    });
  });

  function lockCanvas() {
    deck.style.width  = CANVAS_W + 'px';
    deck.style.height = CANVAS_H + 'px';
    deck.style.position = 'relative';
    deck.style.transformOrigin = 'center center';
    deck.style.flex = '0 0 auto';
    slides.forEach(function(s) {
      s.style.width  = CANVAS_W + 'px';
      s.style.height = CANVAS_H + 'px';
    });
    clampTargets.forEach(function(el) {
      el.dataset.lscaledOrigMinH = el.style.minHeight || '';
      el.dataset.lscaledOrigH    = el.style.height    || '';
      el.style.minHeight = CANVAS_H + 'px';
      // If element used height: 100vh, clamp that too.
      if (/height\s*:\s*100vh/i.test(el.getAttribute('style') || '')) {
        el.style.height = CANVAS_H + 'px';
      }
    });
  }

  function unlockCanvas() {
    ['width','height','position','transformOrigin','flex','transform'].forEach(function(p) {
      deck.style[p] = '';
    });
    slides.forEach(function(s) {
      s.style.width = '';
      s.style.height = '';
    });
    clampTargets.forEach(function(el) {
      el.style.minHeight = el.dataset.lscaledOrigMinH || '';
      el.style.height    = el.dataset.lscaledOrigH    || '';
      delete el.dataset.lscaledOrigMinH;
      delete el.dataset.lscaledOrigH;
    });
    deck.classList.remove('lscaled');
  }

  function applyScale() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;

    if (vw < MIN_VIEWPORT) {
      unlockCanvas();
      return;
    }

    lockCanvas();

    var scale = Math.min(
      (vw * PAD) / CANVAS_W,
      (vh * PAD) / CANVAS_H
    );
    if (scale < 1) scale = 1;

    deck.style.transform = 'scale(' + scale.toFixed(4) + ')';
    deck.classList.add('lscaled');
  }

  applyScale();
  window.addEventListener('resize', applyScale);
  window.addEventListener('orientationchange', applyScale);
})();

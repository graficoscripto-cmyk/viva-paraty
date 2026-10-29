/* Viva Paraty! — motion e interação (vanilla, sem dependências, zero contadores genéricos) */
(function () {
  'use strict';
  var d = document, de = d.documentElement;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };

  /* ---------- cortina entre páginas ---------- */
  var cur = $('.curtain');
  function openCurtain() {
    if (!cur) return;
    cur.style.transition = ''; cur.style.transform = 'translateY(-100%)';
  }
  if (cur) { requestAnimationFrame(function () { setTimeout(openCurtain, reduce ? 0 : 350); }); }
  addEventListener('pageshow', function (e) { if (e.persisted) openCurtain(); });
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || !cur || reduce || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    var u = new URL(a.href, location.href);
    if (u.origin !== location.origin || (u.pathname === location.pathname && u.hash)) return;
    e.preventDefault();
    cur.style.transition = 'none'; cur.style.transform = 'translateY(100%)';
    void cur.offsetHeight;
    cur.style.transition = ''; cur.style.transform = 'translateY(0)';
    setTimeout(function () { location.href = a.href; }, 720);
  });

  /* ---------- header + menu ---------- */
  var hdr = $('.hdr'), lastY = scrollY;
  var burger = $('.burger');
  if (burger) burger.addEventListener('click', function () {
    var o = de.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', o);
  });
  $$('.menu a').forEach(function (a) { a.addEventListener('click', function () { de.classList.remove('menu-open'); }); });

  /* ---------- títulos palavra por palavra ---------- */
  $$('[data-split]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(function (w, i) {
      return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + w + '</span></span>';
    }).join(' ');
  });

  /* ---------- reveals ---------- */
  var rv = $$('[data-r],[data-split]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });
  setTimeout(function () { rv.forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); }); }, 900);

  /* ---------- Motion Graphic da Logo Viva Paraty (.viva-scene) ---------- */
  var vivaScene = $('.viva-scene'), pillars = $$('.viva-pillar');
  function setPillar(name) {
    if (!vivaScene) return;
    vivaScene.setAttribute('data-focus', name);
    pillars.forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.pillar === name);
    });
  }
  pillars.forEach(function (btn) {
    btn.addEventListener('click', function () { setPillar(btn.dataset.pillar); });
    btn.addEventListener('mouseenter', function () { setPillar(btn.dataset.pillar); });
  });
  if (vivaScene) setPillar('igreja');

  /* ---------- carrossel horizontal que prende na rolagem ---------- */
  var hs = $('.hs'), hsTrack = hs && $('.hs-track', hs);
  function hsOn() { return innerWidth >= 900 && innerHeight >= 560 && !reduce; }
  function hsSize() {
    if (!hs) return;
    if (hsOn()) {
      hs.classList.add('on');
      hs.style.height = (hsTrack.scrollWidth - innerWidth + innerHeight + 60) + 'px';
    } else { hs.classList.remove('on'); hs.style.height = ''; hsTrack.style.transform = ''; }
  }

  /* ---------- loop de rolagem ---------- */
  var par = $$('[data-par]'), route = $('.route'), op = $('.op'), heroM = $('.hero-media'), hero = $('.hero');
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = innerHeight, y = scrollY;
    if (hdr) {
      hdr.classList.toggle('solid', y > 60);
      hdr.classList.toggle('hide', y > lastY && y > 240 && !de.classList.contains('menu-open'));
      lastY = y;
    }
    if (!reduce) {
      if (heroM && hero) { var hp = clamp(y / hero.offsetHeight, 0, 1); heroM.style.transform = 'translate3d(0,' + (hp * 14) + '%,0)'; }
      par.forEach(function (el) {
        var r = (el.closest('figure,.img-par') || el.parentElement).getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var sp = parseFloat(el.dataset.par), c = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.transform = 'translate3d(0,' + (c * sp * -1).toFixed(1) + 'px,0)';
      });
    }
    if (vivaScene) {
      var vr = vivaScene.getBoundingClientRect();
      var vp = clamp((vh - vr.top) / (vh + vr.height), 0, 1);
      vivaScene.style.setProperty('--logo-p', vp.toFixed(3));
    }
    if (hs && hs.classList.contains('on')) {
      var r = hs.getBoundingClientRect(), tot = hs.offsetHeight - innerHeight;
      var p = clamp(-r.top / tot, 0, 1);
      hsTrack.style.transform = 'translate3d(' + (-(hsTrack.scrollWidth - innerWidth) * p) + 'px,0,0)';
    }
    if (route) {
      var rr = route.getBoundingClientRect();
      var pr = clamp((vh * 0.62 - rr.top) / rr.height, 0, 1);
      $('.rfill', route).style.transform = 'scaleY(' + pr + ')';
      $('.boat', route).style.top = (pr * 100) + '%';
    }
    if (op) {
      var or = op.getBoundingClientRect(), po = clamp(-or.top / (op.offsetHeight - vh), 0, 1);
      var e = ease(clamp(po / 0.58, 0, 1));
      var ay = (1 - e) * 12, ax = (1 - e) * 7;
      $('.op-img', op).style.clipPath = 'inset(' + ay + '% ' + ax + '% ' + ay + '% ' + ax + '% round ' + (ay * 2.2) + 'px)';
      var t = $('.op-t', op);
      var tp = clamp((po - 0.18) / 0.42, 0.15, 1);
      t.style.opacity = tp;
      t.style.transform = 'translateY(' + (1 - tp) * 24 + 'px)';
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', function () { hsSize(); req(); });
  addEventListener('load', function () { hsSize(); req(); });
  hsSize(); frame();

  /* ---------- botões magnéticos ---------- */
  if (!reduce && matchMedia('(hover:hover)').matches) {
    $$('.btn').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.22) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.35) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- mapa da baía ---------- */
  var pins = $$('.map-pin-group'), stops = $$('.mstop'), coord = $('#mapCoord');
  function setStop(i) {
    pins.forEach(function (p) { p.classList.toggle('active', +p.dataset.pin === i); });
    stops.forEach(function (s) { s.classList.toggle('active', +s.dataset.stop === i); });
    if (coord && stops[i]) coord.textContent = stops[i].dataset.coord;
  }
  pins.forEach(function (p) { p.addEventListener('click', function () { setStop(+p.dataset.pin); }); });
  stops.forEach(function (s) { s.addEventListener('click', function () { setStop(+s.dataset.stop); }); });
  if (pins.length) setStop(0);

  /* ---------- planner (monte seu roteiro) ---------- */
  var tiles = $$('.tile');
  if (tiles.length) {
    var bubble = $('#bubble'), send = $('#send'), fmt = $('#fmt'), ppl = $('#ppl'), when = $('#when');
    var q = new URLSearchParams(location.search).get('t');
    var any = false;
    tiles.forEach(function (t) { if (q && t.dataset.slug === q) { t.classList.add('sel'); any = true; } });
    if (!any) tiles[0].classList.add('sel');
    var build = function () {
      var sel = tiles.filter(function (t) { return t.classList.contains('sel'); }).map(function (t) { return t.dataset.name; });
      var msg = 'Olá, Viva Paraty! Quero montar meu roteiro:\n• Passeios: ' + (sel.join(', ') || 'ainda não escolhi') +
        '\n• Formato: ' + fmt.value + '\n• Grupo: ' + ppl.value + '\n• Quando: ' + (when.value || 'a combinar');
      bubble.textContent = msg;
      send.href = 'https://wa.me/5524999633930?text=' + encodeURIComponent(msg);
      bubble.classList.add('pop'); setTimeout(function () { bubble.classList.remove('pop'); }, 160);
    };
    tiles.forEach(function (t) {
      t.setAttribute('aria-pressed', t.classList.contains('sel'));
      t.addEventListener('click', function () { t.classList.toggle('sel'); t.setAttribute('aria-pressed', t.classList.contains('sel')); build(); });
    });
    [fmt, ppl, when].forEach(function (el) { el.addEventListener('input', build); });
    build();
  }
})();

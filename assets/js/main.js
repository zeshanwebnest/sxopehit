/* =========================================================
   SxopeHit — Home page interactions
   1. Loader            6. Reveal on scroll
   2. Scroll progress   7. Counters
   3. Sticky header     8. FAQ accordion
   4. Mobile nav        9. Testimonial slider
   5. Hero slider      10. Forms / back to top
   ========================================================= */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. LOADER ---------- */
  var loader = $('#loader');
  var hideLoader = function () {
    if (loader) { loader.classList.add('done'); }
    document.body.classList.add('loaded');
  };
  window.addEventListener('load', function () { setTimeout(hideLoader, 450); });
  setTimeout(hideLoader, 4000); // safety net if an asset hangs

  /* ---------- 2. SCROLL PROGRESS + 3. STICKY HEADER + back-to-top ---------- */
  var bar     = $('#scrollProgress');
  var header  = $('#header');
  var toTop   = $('#toTop');
  var toRing  = $('#toTopRing');
  var RING    = 126;
  var ticking = false;

  function onScroll() {
    var y   = window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var pct = max > 0 ? y / max : 0;

    if (bar) { bar.style.width = (pct * 100) + '%'; }
    if (header) {
      /* separate on/off points so the class cannot flutter at the boundary */
      if (!header.classList.contains('stuck') && y > 80) { header.classList.add('stuck'); }
      else if (header.classList.contains('stuck') && y < 30) { header.classList.remove('stuck'); }
    }
    if (toTop) {
      toTop.classList.toggle('on', y > 500);
      if (toRing) { toRing.style.strokeDashoffset = RING - RING * pct; }
    }
    spy(y);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });

  /* scrollspy for the primary nav */
  var navLinks = $$('.nav__list > li > a[href^="#"]');
  var sections = navLinks
    .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);

  function spy(y) {
    if (!sections.length) { return; }
    var offset = y + (header ? header.offsetHeight : 0) + 120;
    var active = sections[0];
    sections.forEach(function (sec) { if (sec.offsetTop <= offset) { active = sec; } });
    navLinks.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + active.id);
    });
  }

  /* ---------- 4. MOBILE NAV ---------- */
  var nav      = $('#nav');
  var burger   = $('#burger');
  var navClose = $('#navClose');
  var overlay  = $('#navOverlay');

  function openNav() {
    nav.classList.add('on');
    overlay.classList.add('on');
    burger.classList.add('on');
    burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-locked');
  }
  function closeNav() {
    nav.classList.remove('on');
    overlay.classList.remove('on');
    burger.classList.remove('on');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
  }
  if (burger)   { burger.addEventListener('click', function () {
    nav.classList.contains('on') ? closeNav() : openNav();
  }); }
  if (navClose) { navClose.addEventListener('click', closeNav); }
  if (overlay)  { overlay.addEventListener('click', closeNav); }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('on')) { closeNav(); }
  });

  /* dropdowns become accordions below 992px */
  $$('.has-drop > a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (window.innerWidth > 991) { return; }
      e.preventDefault();
      var li = a.parentElement;
      $$('.has-drop').forEach(function (o) { if (o !== li) { o.classList.remove('open'); } });
      li.classList.toggle('open');
    });
  });

  /* close the drawer after tapping any in-page link */
  $$('.nav a[href^="#"], .nav__foot a').forEach(function (a) {
    a.addEventListener('click', function () {
      if (a.parentElement.classList.contains('has-drop') && window.innerWidth <= 991) { return; }
      if (window.innerWidth <= 991) { closeNav(); }
    });
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 991 && nav.classList.contains('on')) { closeNav(); }
  });

  /* ---------- 5. HERO SLIDER ---------- */
  (function heroSlider() {
    var slides = $$('.hero__slide');
    if (!slides.length || slides.length < 2) { return; }

    var dots    = $$('#heroDots button');
    var current = $('#heroCurrent');
    var hero    = $('.hero');
    var DELAY   = 6000;
    var index   = 0;
    var timer   = null;

    function paint(next) {
      slides[index].classList.remove('is-active');
      dots[index].classList.remove('is-active');
      dots[index].querySelector('i').style.transition = 'none';
      dots[index].querySelector('i').style.width = '0';

      index = (next + slides.length) % slides.length;

      slides[index].classList.add('is-active');
      var fill = dots[index].querySelector('i');
      void fill.offsetWidth;                       // force reflow so the bar restarts
      fill.style.transition = '';
      dots[index].classList.add('is-active');
      if (current) { current.textContent = ('0' + (index + 1)).slice(-2); }
    }
    function go(n)  { paint(n); restart(); }
    function next() { go(index + 1); }
    function prev() { go(index - 1); }

    function restart() {
      clearInterval(timer);
      if (!reduced) { timer = setInterval(function () { paint(index + 1); }, DELAY); }
    }

    $('#heroNext').addEventListener('click', next);
    $('#heroPrev').addEventListener('click', prev);
    dots.forEach(function (d) {
      d.addEventListener('click', function () { go(parseInt(d.dataset.go, 10)); });
    });

    /* pause while hovered, and while the tab is hidden */
    hero.addEventListener('mouseenter', function () { clearInterval(timer); });
    hero.addEventListener('mouseleave', restart);
    document.addEventListener('visibilitychange', function () {
      document.hidden ? clearInterval(timer) : restart();
    });

    /* arrow keys + touch swipe */
    document.addEventListener('keydown', function (e) {
      if (nav.classList.contains('on')) { return; }
      if (e.key === 'ArrowRight') { next(); }
      if (e.key === 'ArrowLeft')  { prev(); }
    });
    swipe(hero, next, prev);

    paint(0);
    restart();
  }());

  /* generic horizontal swipe helper */
  function swipe(el, onLeft, onRight) {
    var x0 = null, y0 = null;
    el.addEventListener('touchstart', function (e) {
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (x0 === null) { return; }
      var dx = e.changedTouches[0].clientX - x0;
      var dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? onLeft() : onRight(); }
      x0 = y0 = null;
    }, { passive: true });
  }

  /* ---------- 6. REVEAL ON SCROLL ---------- */
  var revealables = $$('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        var d = parseInt(entry.target.dataset.d || 0, 10);
        entry.target.style.transitionDelay = (d * 110) + 'ms';
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 7. COUNTERS ---------- */
  var counters = $$('.counter');
  function runCounter(el) {
    var target = parseFloat(el.dataset.target) || 0;
    var dur    = 1800;
    var start  = null;

    function step(ts) {
      if (!start) { start = ts; }
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);           // easeOutCubic
      el.textContent = Math.round(target * eased).toLocaleString('en-US');
      if (p < 1) { window.requestAnimationFrame(step); }
    }
    window.requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && !reduced) {
    var cio = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        runCounter(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(function (el) {
      el.textContent = (parseFloat(el.dataset.target) || 0).toLocaleString('en-US');
    });
  }

  /* ---------- 8. FAQ ACCORDION ---------- */
  /* each .acc group opens and closes independently, so a page can carry
     several FAQ groups without one closing another */
  $$('.acc').forEach(function (group) {
    var items = $$('.acc__item', group);
    items.forEach(function (item) {
      var head = $('.acc__head', item);
      if (!head) { return; }
      head.addEventListener('click', function () {
        var open = item.classList.contains('is-open');
        items.forEach(function (o) {
          o.classList.remove('is-open');
          $('.acc__head', o).setAttribute('aria-expanded', 'false');
        });
        if (!open) {
          item.classList.add('is-open');
          head.setAttribute('aria-expanded', 'true');
        }
      });
    });
  });

  /* ---------- 9. TESTIMONIAL SLIDER ---------- */
  (function testimonials() {
    var track = $('#tstTrack');
    if (!track) { return; }

    var cards = $$('.tst__card', track);
    var dots  = $('#tstDots');
    var index = 0;
    var timer = null;

    function perView() {
      if (window.innerWidth <= 860)  { return 1; }
      if (window.innerWidth <= 1200) { return 2; }
      return 3;
    }
    function maxIndex() { return Math.max(0, cards.length - perView()); }

    function buildDots() {
      dots.innerHTML = '';
      for (var i = 0; i <= maxIndex(); i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
        b.dataset.go = i;
        b.addEventListener('click', function (e) {
          go(parseInt(e.currentTarget.dataset.go, 10));
        });
        dots.appendChild(b);
      }
    }
    function paint() {
      index = Math.min(index, maxIndex());
      var style = getComputedStyle(track);
      var gap   = parseFloat(style.columnGap || style.gap) || 0;
      var step  = cards[0].getBoundingClientRect().width + gap;
      track.style.transform = 'translateX(' + (-step * index) + 'px)';
      $$('button', dots).forEach(function (d, i) {
        d.classList.toggle('is-active', i === index);
      });
    }
    function go(n) {
      var m = maxIndex();
      index = n > m ? 0 : (n < 0 ? m : n);
      paint();
      restart();
    }
    function restart() {
      clearInterval(timer);
      if (!reduced && maxIndex() > 0) {
        timer = setInterval(function () { go(index + 1); }, 6500);
      }
    }

    $('#tstNext').addEventListener('click', function () { go(index + 1); });
    $('#tstPrev').addEventListener('click', function () { go(index - 1); });
    swipe(track, function () { go(index + 1); }, function () { go(index - 1); });
    track.addEventListener('mouseenter', function () { clearInterval(timer); });
    track.addEventListener('mouseleave', restart);

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { buildDots(); paint(); }, 180);
    });

    buildDots();
    paint();
    restart();
  }());

  /* ---------- 10. FORMS ---------- */
  var apForm = $('#appointmentForm');
  if (apForm) {
    var dateInput = $('#f-date');
    if (dateInput) { dateInput.min = new Date().toISOString().split('T')[0]; }

    apForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var note   = $('#formNote');
      var fields = $$('input, select', apForm);
      var bad    = false;

      fields.forEach(function (f) {
        var empty   = !f.value.trim();
        var badMail = f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value.trim());
        var invalid = empty || badMail;
        f.classList.toggle('err', invalid);
        if (invalid && !bad) { bad = true; f.focus(); }
      });

      if (bad) {
        note.textContent = 'Please complete every field with valid details.';
        note.classList.add('bad');
        return;
      }
      note.classList.remove('bad');
      note.textContent = 'Thank you! Your appointment request has been received — we will confirm by email shortly.';
      apForm.reset();
      if (dateInput) { dateInput.min = new Date().toISOString().split('T')[0]; }
    });

    $$('input, select', apForm).forEach(function (f) {
      f.addEventListener('input', function () { f.classList.remove('err'); });
    });
  }

  var contactForm = $('#contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var note   = $('#contactNote');
      var fields = $('input, textarea', contactForm);
      var bad    = false;

      fields.forEach(function (f) {
        var empty   = !f.value.trim();
        var badMail = f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value.trim());
        var invalid = empty || badMail;
        f.classList.toggle('err', invalid);
        if (invalid && !bad) { bad = true; f.focus(); }
      });

      if (bad) {
        note.textContent = 'Please complete every field with valid details.';
        note.classList.add('bad');
        return;
      }
      note.classList.remove('bad');
      note.textContent = 'Thank you! Your message has been received — we will reply shortly.';
      contactForm.reset();
    });

    $('input, textarea', contactForm).forEach(function (f) {
      f.addEventListener('input', function () { f.classList.remove('err'); });
    });
  }

  var newsForm = $('#newsForm');
  if (newsForm) {
    newsForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('#newsEmail');
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      input.classList.toggle('err', !ok);
      if (!ok) { input.focus(); return; }
      input.value = '';
      input.placeholder = 'Subscribed — thank you!';
      setTimeout(function () { input.placeholder = 'Enter your email address'; }, 4000);
    });
  }

  /* ---------- 11. BLOG: LOAD MORE ---------- */
  (function loadMore() {
    var btn = $('#loadMore');
    if (!btn) { return; }

    var count = $('#loadCount');
    var STEP  = 3;

    btn.addEventListener('click', function () {
      var hidden = $$('.post--more[hidden]');
      if (!hidden.length) { return; }

      hidden.slice(0, STEP).forEach(function (el, i) {
        el.hidden = false;
        el.style.transitionDelay = (i * 110) + 'ms';
        /* next frame, so the browser paints the hidden state first */
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () { el.classList.add('in'); });
        });
      });

      var shown = $$('.post').length - $$('.post--more[hidden]').length;
      var total = $$('.post').length;
      if (count) { count.textContent = 'Showing ' + shown + ' of ' + total + ' articles'; }

      if (!$$('.post--more[hidden]').length) {
        btn.disabled = true;
        btn.textContent = 'All articles loaded';
        btn.classList.add('is-done');
      }
    });
  }());

  /* blog sidebar search is a front-end filter placeholder until there is a backend */
  var blogSearch = $('#blogSearch');
  if (blogSearch) {
    blogSearch.addEventListener('submit', function (e) { e.preventDefault(); });
  }

  /* ---------- 12. GALLERY LIGHTBOX ---------- */
  (function lightbox() {
    var box = $('#lbox');
    if (!box) { return; }

    var tiles = $$('.gal__item');
    var img   = $('#lboxImg');
    var count = $('#lboxCount');
    var srcs  = [];
    var at    = 0;

    /* one entry per photo — duplicated marquee tiles share an index */
    tiles.forEach(function (t) {
      var i = parseInt(t.dataset.i, 10);
      var s = t.querySelector('img').getAttribute('src');
      if (!srcs[i]) { srcs[i] = s; }
    });

    function show(n) {
      at = (n + srcs.length) % srcs.length;
      img.src = srcs[at];
      img.alt = 'Gallery photo ' + (at + 1) + ' of ' + srcs.length;
      if (count) { count.textContent = (at + 1) + ' / ' + srcs.length; }
    }
    function open(n) {
      show(n);
      box.hidden = false;
      document.body.classList.add('is-locked');
    }
    function close() {
      box.hidden = true;
      document.body.classList.remove('is-locked');
    }

    tiles.forEach(function (t) {
      t.addEventListener('click', function () { open(parseInt(t.dataset.i, 10)); });
    });
    $('#lboxClose').addEventListener('click', close);
    $('#lboxPrev').addEventListener('click', function () { show(at - 1); });
    $('#lboxNext').addEventListener('click', function () { show(at + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) { close(); } });

    document.addEventListener('keydown', function (e) {
      if (box.hidden) { return; }
      if (e.key === 'Escape')     { close(); }
      if (e.key === 'ArrowLeft')  { show(at - 1); }
      if (e.key === 'ArrowRight') { show(at + 1); }
    });

    swipe(box, function () { show(at + 1); }, function () { show(at - 1); });
  }());

  /* ---------- smooth anchor offset for the sticky header ---------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id === '#' || id.length < 2) { return; }
      /* on mobile a "Pages"/"Services" tap toggles its submenu instead of scrolling */
      if (a.parentElement.classList.contains('has-drop') && window.innerWidth <= 991) { return; }
      var target = document.querySelector(id);
      if (!target) { return; }
      e.preventDefault();
      var head = header ? header.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.pageYOffset - (head - 1);
      if (top < head) { top = 0; }   /* first section: go right to the top */
      window.scrollTo({ top: Math.max(0, top), behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  onScroll();
}());

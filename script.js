/* ==========================================================
   Skyline Technologies — interactions
   ========================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- header: shrink / background on scroll ---------- */
  var header = document.getElementById('header');
  var totop = document.getElementById('totop');

  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-stuck', y > 40);
    totop.classList.toggle('is-visible', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  totop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');

  function closeMenu() {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'メニューを開く');
  }

  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  });

  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      closeMenu();
      burger.focus();
    }
  });

  /* ---------- news bar: auto rotation ---------- */
  var news = document.getElementById('news');
  var newsItems = news ? news.querySelectorAll('.news__item') : [];

  if (news && newsItems.length > 1) {
    var newsToggle = document.getElementById('news-toggle');
    var newsIndex = document.getElementById('news-index');
    var newsTotal = document.getElementById('news-total');
    var INTERVAL = 5500;
    var current = 0;
    var timer = null;
    var hovered = false;
    // モーション低減設定では自動切り替えを止めた状態で開始する
    var userPaused = reduceMotion;

    newsTotal.textContent = newsItems.length;

    function showNews(i) {
      current = (i + newsItems.length) % newsItems.length;
      newsItems.forEach(function (el, n) {
        el.classList.toggle('is-active', n === current);
      });
      newsIndex.textContent = current + 1;
    }

    function startNews() {
      if (timer || userPaused || hovered) return;
      timer = setInterval(function () { showNews(current + 1); }, INTERVAL);
    }

    function stopNews() {
      clearInterval(timer);
      timer = null;
    }

    function syncToggle() {
      newsToggle.setAttribute('aria-pressed', String(userPaused));
      newsToggle.setAttribute(
        'aria-label',
        userPaused ? 'お知らせの自動切り替えを再開する' : 'お知らせの自動切り替えを一時停止する'
      );
    }

    newsToggle.addEventListener('click', function () {
      userPaused = !userPaused;
      syncToggle();
      if (userPaused) stopNews();
      else startNews();
    });

    // 読んでいる最中に切り替わらないよう、ホバー・フォーカス中は停止
    news.addEventListener('mouseenter', function () { hovered = true; stopNews(); });
    news.addEventListener('mouseleave', function () { hovered = false; startNews(); });
    news.addEventListener('focusin', function () { hovered = true; stopNews(); });
    news.addEventListener('focusout', function () { hovered = false; startNews(); });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopNews();
      else startNews();
    });

    syncToggle();
    showNews(0);
    startNews();
  }

  /* ---------- scroll reveal ---------- */
  var targets = document.querySelectorAll('[data-reveal]');

  if (!('IntersectionObserver' in window) || reduceMotion) {
    targets.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        // stagger siblings slightly for a cascading effect
        var delay = Math.min(i * 90, 360);
        setTimeout(function () { el.classList.add('is-in'); }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- animated counters in hero ---------- */
  var counters = document.querySelectorAll('[data-count]');

  function runCounter(el) {
    var goal = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || '';
    if (reduceMotion) {
      el.textContent = goal + suffix;
      return;
    }
    var duration = 1400;
    var start = performance.now();

    function step(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(goal * eased) + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        co.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- contact form validation (demo only) ---------- */
  var form = document.getElementById('contact-form');
  var done = document.getElementById('form-done');

  var messages = {
    name: 'お名前をご入力ください。',
    email: 'メールアドレスをご入力ください。',
    message: 'ご相談内容をご入力ください。',
    agree: '個人情報の取り扱いにご同意ください。'
  };

  function setError(input, text) {
    var box = form.querySelector('[data-error-for="' + input.id + '"]');
    if (box) box.textContent = text;
    var field = input.closest('.field');
    if (field) field.classList.toggle('is-invalid', Boolean(text));
    if (text) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  function validate(input) {
    var value = input.type === 'checkbox' ? input.checked : input.value.trim();

    if (!value) {
      setError(input, messages[input.id] || '入力してください。');
      return false;
    }
    if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setError(input, 'メールアドレスの形式をご確認ください。');
      return false;
    }
    setError(input, '');
    return true;
  }

  var required = Array.prototype.slice.call(form.querySelectorAll('[required]'));

  required.forEach(function (input) {
    input.addEventListener('blur', function () { validate(input); });
    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid')) validate(input);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    done.hidden = true;

    var firstInvalid = null;
    required.forEach(function (input) {
      if (!validate(input) && !firstInvalid) firstInvalid = input;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    // Demo site: nothing is actually transmitted.
    form.reset();
    required.forEach(function (input) { setError(input, ''); });
    done.hidden = false;
    done.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  });
})();

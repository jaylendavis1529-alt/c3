/* ============================================================
   StudyWise Point — script.js
   Header, mobile nav, reveals, counters, tilt, focus timer,
   flip cards, cookie consent (Consent Mode v2), form UX
   ============================================================ */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sticky header ---------- */
  var header = document.querySelector(".site-header");
  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Focus timer widget ---------- */
  var timerCard = document.querySelector(".timer-card");
  if (timerCard) {
    var MODES = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
    var mode = "focus";
    var remaining = MODES[mode];
    var total = MODES[mode];
    var running = false;
    var intervalId = null;

    var timeEl = timerCard.querySelector(".timer-time");
    var fillEl = timerCard.querySelector(".ring-fill");
    var startBtn = timerCard.querySelector("[data-timer='start']");
    var resetBtn = timerCard.querySelector("[data-timer='reset']");
    var modeBtns = timerCard.querySelectorAll(".timer-mode");

    var R = 104;
    var CIRC = 2 * Math.PI * R;
    if (fillEl) {
      fillEl.setAttribute("stroke-dasharray", CIRC.toFixed(1));
    }

    function render() {
      var m = Math.floor(remaining / 60);
      var s = remaining % 60;
      var text = (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
      if (timeEl) timeEl.textContent = text;
      if (fillEl) {
        var frac = total > 0 ? remaining / total : 0;
        fillEl.setAttribute("stroke-dashoffset", (CIRC * (1 - frac)).toFixed(1));
      }
      if (startBtn) startBtn.textContent = running ? "Pause" : (remaining < total ? "Resume" : "Start");
      timerCard.classList.toggle("running", running);
    }

    function stopTick() {
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
    }

    function tick() {
      if (remaining > 0) {
        remaining--;
        render();
      }
      if (remaining <= 0) {
        running = false;
        stopTick();
        render();
        if (timeEl) timeEl.textContent = "Done!";
        if (typeof gtag === "function") {
          gtag("event", "timer_complete", { timer_mode: mode });
        }
      }
    }

    if (startBtn) startBtn.addEventListener("click", function () {
      running = !running;
      stopTick();
      if (running) intervalId = setInterval(tick, 1000);
      render();
    });

    if (resetBtn) resetBtn.addEventListener("click", function () {
      running = false;
      stopTick();
      remaining = total = MODES[mode];
      render();
    });

    modeBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        modeBtns.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        mode = btn.getAttribute("data-mode") || "focus";
        running = false;
        stopTick();
        remaining = total = MODES[mode];
        render();
      });
    });

    render();
  }

  /* ---------- Flip cards ---------- */
  document.querySelectorAll(".flip-card").forEach(function (card) {
    function flip() {
      var flipped = card.classList.toggle("flipped");
      card.setAttribute("aria-pressed", flipped ? "true" : "false");
    }
    card.addEventListener("click", flip);
    if (window.matchMedia("(pointer: fine)").matches && !prefersReduced) {
      card.addEventListener("mouseenter", function () {
        card.classList.add("flipped");
        card.setAttribute("aria-pressed", "true");
      });
      card.addEventListener("mouseleave", function () {
        card.classList.remove("flipped");
        card.setAttribute("aria-pressed", "false");
      });
    }
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !prefersReduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.13, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Counters ---------- */
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute("data-count") || "0");
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1700;
    var start = null;
    function tickC(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = (target % 1 === 0 ? Math.round(val) : val.toFixed(1)) + suffix;
      if (p < 1) requestAnimationFrame(tickC);
    }
    if (prefersReduced) {
      el.textContent = target + suffix;
    } else {
      requestAnimationFrame(tickC);
    }
  }
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          animateCounter(e.target);
          cio.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- Card tilt ---------- */
  if (!prefersReduced && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      card.addEventListener("mousemove", function (ev) {
        var r = card.getBoundingClientRect();
        var x = (ev.clientX - r.left) / r.width - 0.5;
        var y = (ev.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          "translateY(-8px) rotateX(" + (-y * 4.5) + "deg) rotateY(" + (x * 4.5) + "deg)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ---------- Contact form (validate on blur) ---------- */
  var form = document.getElementById("contact-form");
  if (form) {
    function validateField(field) {
      var input = field.querySelector("input, textarea, select");
      if (!input) return true;
      var ok = input.checkValidity();
      field.classList.toggle("invalid", !ok);
      return ok;
    }
    form.querySelectorAll(".field").forEach(function (field) {
      var input = field.querySelector("input, textarea, select");
      if (input) {
        input.addEventListener("blur", function () { validateField(field); });
        input.addEventListener("input", function () {
          if (field.classList.contains("invalid")) validateField(field);
        });
      }
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var allOk = true;
      form.querySelectorAll(".field").forEach(function (field) {
        if (!validateField(field)) allOk = false;
      });
      if (!allOk) return;
      var success = form.querySelector(".form-success");
      if (success) success.style.display = "block";
      form.querySelectorAll("input, textarea, select, button").forEach(function (el) {
        el.disabled = true;
      });
      if (typeof gtag === "function") {
        gtag("event", "generate_lead", { form_id: "contact-form" });
      }
    });
  }

  /* ---------- Back to top ---------- */
  var toTop = document.querySelector(".to-top");
  if (toTop) {
    window.addEventListener("scroll", function () {
      toTop.classList.toggle("show", window.scrollY > 600);
    }, { passive: true });
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
    });
  }

  /* ---------- Cookie consent (Google Consent Mode v2) ---------- */
  var CONSENT_KEY = "swp_cookie_consent";
  var banner = document.querySelector(".cookie-banner");

  function applyConsent(granted) {
    if (typeof gtag === "function") {
      gtag("consent", "update", {
        analytics_storage: granted ? "granted" : "denied",
        ad_storage: granted ? "granted" : "denied",
        ad_user_data: granted ? "granted" : "denied",
        ad_personalization: granted ? "granted" : "denied"
      });
    }
  }

  var stored = null;
  try { stored = localStorage.getItem(CONSENT_KEY); } catch (e) {}

  if (stored === "all") {
    applyConsent(true);
  } else if (stored === "necessary") {
    applyConsent(false);
  } else if (banner) {
    setTimeout(function () { banner.classList.add("show"); }, 1200);
  }

  if (banner) {
    var acceptBtn = banner.querySelector("[data-consent='all']");
    var necessaryBtn = banner.querySelector("[data-consent='necessary']");
    function choose(value) {
      try { localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
      applyConsent(value === "all");
      banner.classList.remove("show");
    }
    if (acceptBtn) acceptBtn.addEventListener("click", function () { choose("all"); });
    if (necessaryBtn) necessaryBtn.addEventListener("click", function () { choose("necessary"); });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

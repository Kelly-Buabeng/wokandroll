/**
 * Header navigation: mobile hamburger menu + active-section highlighting.
 */
window.WR = window.WR || {};

WR.initNav = function () {
  var header = document.querySelector(".site-header");
  var toggle = header.querySelector(".nav-toggle");
  var nav = header.querySelector(".site-nav");

  // --- Mobile menu -------------------------------------------------------
  function setOpen(open) {
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  toggle.addEventListener("click", function () {
    setOpen(!header.classList.contains("is-open"));
  });

  // Close after picking a link, on Escape, or on a click outside the header.
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && header.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener("click", function (e) {
    if (!header.contains(e.target)) setOpen(false);
  });
  // Reset when growing past the mobile breakpoint.
  window.matchMedia("(min-width: 721px)").addEventListener("change", function (mq) {
    if (mq.matches) setOpen(false);
  });

  // --- Active section highlighting -------------------------------------
  var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]:not(.nav-cta)'));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if (!("IntersectionObserver" in window) || !sections.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      links.forEach(function (a) {
        var active = a.getAttribute("href") === "#" + entry.target.id;
        a.classList.toggle("is-active", active);
        if (active) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-45% 0px -50% 0px" }); // a thin band across the middle of the viewport

  sections.forEach(function (s) { observer.observe(s); });
};

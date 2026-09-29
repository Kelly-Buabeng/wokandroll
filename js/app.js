/**
 * App entry point — wires the data, store and components together.
 */
window.WR = window.WR || {};

/** Screen-reader announcement through a shared polite live region. */
WR.announce = function (message) {
  var region = document.getElementById("sr-announcer");
  if (!region) return;
  region.textContent = "";
  // Re-set on the next frame so repeated identical messages are still read.
  requestAnimationFrame(function () { region.textContent = message; });
};

/** Copy buttons: <button data-copy="text">. Shows "Copied" briefly. */
WR.initCopyButtons = function () {
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-copy]");
    if (!btn || !navigator.clipboard) return;
    navigator.clipboard.writeText(btn.dataset.copy).then(function () {
      btn.textContent = "Copied";
      btn.classList.add("is-copied");
      WR.announce("Number copied");
      setTimeout(function () {
        btn.textContent = "Copy";
        btn.classList.remove("is-copied");
      }, 2000);
    }).catch(function () { /* number stays visible to type manually */ });
  });
};

document.addEventListener("DOMContentLoaded", function () {
  var cart = WR.createCartStore(WR.data.menu, "wokandroll:cart");

  WR.initNav();
  WR.initOpenStatus();
  WR.initMenu(cart);
  WR.initOrder(cart);
  WR.initCopyButtons();
});

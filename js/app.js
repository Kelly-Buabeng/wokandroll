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

document.addEventListener("DOMContentLoaded", function () {
  var cart = WR.createCartStore(WR.data.menu, "wokandroll:cart");

  WR.initNav();
  WR.initOpenStatus();
  WR.initMenu(cart);
  WR.initOrder(cart);
});

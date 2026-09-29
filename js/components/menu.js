/**
 * Menu: category tabs + data-driven item list with add-to-order buttons.
 * Renders from WR.data.menu and stays in sync with the cart store.
 */
window.WR = window.WR || {};

WR.initMenu = function (cart) {
  var menu = WR.data.menu;
  var tablist = document.querySelector("[data-menu-tabs]");
  var grid = document.querySelector("[data-menu-grid]");
  if (!tablist || !grid) return;

  var tabs = [{ id: "all", name: "All" }].concat(menu);
  var activeId = "all";

  // --- Tabs --------------------------------------------------------------
  tablist.innerHTML = tabs.map(function (t) {
    return '<button type="button" role="tab" class="menu-tab" id="tab-' + t.id + '"' +
      ' data-tab="' + t.id + '" aria-controls="menu-panel">' + t.name + "</button>";
  }).join("");
  var tabEls = Array.prototype.slice.call(tablist.querySelectorAll("[role=tab]"));

  function selectTab(id, focus) {
    activeId = id;
    tabEls.forEach(function (el) {
      var on = el.dataset.tab === id;
      el.setAttribute("aria-selected", String(on));
      el.tabIndex = on ? 0 : -1; // roving tabindex
      if (on && focus) el.focus();
    });
    grid.setAttribute("aria-labelledby", "tab-" + id);
    grid.querySelectorAll(".menu-cat").forEach(function (catEl) {
      catEl.hidden = id !== "all" && catEl.dataset.cat !== id;
    });
    grid.classList.toggle("is-filtered", id !== "all");
  }

  tablist.addEventListener("click", function (e) {
    var tab = e.target.closest("[role=tab]");
    if (tab) selectTab(tab.dataset.tab);
  });

  // Arrow / Home / End keys move between tabs (WAI-ARIA tabs pattern).
  tablist.addEventListener("keydown", function (e) {
    var i = tabEls.findIndex(function (el) { return el.dataset.tab === activeId; });
    var next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabEls.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    next = (next + tabEls.length) % tabEls.length;
    selectTab(tabEls[next].dataset.tab, true);
  });

  // --- Items -------------------------------------------------------------
  grid.innerHTML = menu.map(function (cat) {
    return (
      '<div class="menu-cat" data-cat="' + cat.id + '">' +
        '<h3><span class="num">' + cat.num + '</span><span class="cat-name">' + cat.name + "</span></h3>" +
        "<ul>" + cat.items.map(renderItem).join("") + "</ul>" +
      "</div>"
    );
  }).join("");

  function renderItem(item) {
    return (
      '<li class="menu-item">' +
        '<span class="name">' + item.name + "</span>" +
        '<span class="leader" aria-hidden="true"></span>' +
        '<span class="price">' + WR.formatPrice(item.price) + "</span>" +
        '<button type="button" class="add-btn" data-add="' + item.id + '" data-name="' + item.name + '"></button>' +
      "</li>"
    );
  }

  grid.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-add]");
    if (!btn) return;
    cart.add(btn.dataset.add);
    WR.announce(btn.dataset.name + " added. " + cart.count() + " in your order.");
  });

  // Add buttons show "+" or the quantity already in the order.
  function syncButtons() {
    grid.querySelectorAll("[data-add]").forEach(function (btn) {
      var qty = cart.qty(btn.dataset.add);
      btn.textContent = qty ? String(qty) : "+";
      btn.classList.toggle("in-cart", qty > 0);
      btn.setAttribute("aria-label", qty
        ? "Add another " + btn.dataset.name + " (" + qty + " in order)"
        : "Add " + btn.dataset.name + " to order");
    });
  }

  cart.subscribe(syncButtons);
  syncButtons();
  selectTab("all");
};

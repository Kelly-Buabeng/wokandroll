/**
 * Cart store — holds { itemId: quantity }, persists to localStorage and
 * notifies subscribers on every change. UI components never mutate the cart
 * directly; they call the store and re-render from `subscribe`.
 */
window.WR = window.WR || {};

WR.createCartStore = function (menu, storageKey) {
  // Flatten the menu into an id → item lookup.
  var itemsById = {};
  menu.forEach(function (cat) {
    cat.items.forEach(function (item) { itemsById[item.id] = item; });
  });

  var quantities = load();
  var listeners = [];

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      // Drop anything that is no longer on the menu.
      return Object.keys(saved).reduce(function (acc, id) {
        var qty = parseInt(saved[id], 10);
        if (itemsById[id] && qty > 0) acc[id] = Math.min(qty, 99);
        return acc;
      }, {});
    } catch (e) {
      return {};
    }
  }

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(quantities)); } catch (e) { /* storage unavailable */ }
  }

  function emit() {
    save();
    listeners.forEach(function (fn) { fn(api); });
  }

  var api = {
    qty: function (id) { return quantities[id] || 0; },

    add: function (id) { api.setQty(id, api.qty(id) + 1); },

    setQty: function (id, qty) {
      if (!itemsById[id]) return;
      qty = Math.max(0, Math.min(99, qty));
      if (qty === 0) delete quantities[id];
      else quantities[id] = qty;
      emit();
    },

    clear: function () { quantities = {}; emit(); },

    /** Cart lines in menu order: [{ item, qty, lineTotal }] */
    lines: function () {
      var out = [];
      menu.forEach(function (cat) {
        cat.items.forEach(function (item) {
          var qty = quantities[item.id];
          if (qty) out.push({ item: item, qty: qty, lineTotal: qty * item.price });
        });
      });
      return out;
    },

    count: function () {
      return Object.keys(quantities).reduce(function (n, id) { return n + quantities[id]; }, 0);
    },

    total: function () {
      return api.lines().reduce(function (sum, line) { return sum + line.lineTotal; }, 0);
    },

    subscribe: function (fn) {
      listeners.push(fn);
      return function () { listeners = listeners.filter(function (l) { return l !== fn; }); };
    },
  };

  return api;
};

/**
 * Ordering: floating cart bar, order drawer (native <dialog>), cart line
 * editing, checkout form with validation, and the sent/hand-off state.
 */
window.WR = window.WR || {};

WR.initOrder = function (cart) {
  var drawer = document.getElementById("order-drawer");
  var cartBar = document.querySelector("[data-cart-bar]");
  if (!drawer || !cartBar) return;

  var q = function (sel) { return drawer.querySelector(sel); };
  var linesEl = q("[data-cart-lines]");
  var emptyEl = q("[data-cart-empty]");
  var summaryEl = q("[data-cart-summary]");
  var closedNotice = q("[data-closed-notice]");
  var form = q("[data-checkout-form]");
  var checkoutView = q("[data-view=checkout]");
  var sentView = q("[data-view=sent]");

  // --- Opening & closing -----------------------------------------------
  function open(method) {
    if (method) setMethod(method);
    showView("checkout");
    closedNotice.hidden = WR.isOpenNow();
    if (typeof drawer.showModal === "function") drawer.showModal();
    else drawer.setAttribute("open", "");
    document.documentElement.classList.add("drawer-open");
    syncCartBar();
  }

  function close() {
    if (typeof drawer.close === "function") drawer.close();
    else drawer.removeAttribute("open");
  }

  drawer.addEventListener("close", function () {
    document.documentElement.classList.remove("drawer-open");
    syncCartBar();
  });

  // Click on the backdrop (the dialog element itself, outside the panel) closes.
  drawer.addEventListener("click", function (e) {
    if (e.target === drawer) close();
  });

  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-open-order]");
    if (opener) {
      e.preventDefault();
      open(opener.dataset.openOrder || null);
      return;
    }
    if (e.target.closest("[data-close-drawer]")) close();
  });

  // "Browse the menu" from the empty state: close, then scroll.
  drawer.addEventListener("click", function (e) {
    if (e.target.closest("[data-browse-menu]")) close();
  });

  // --- Cart bar ----------------------------------------------------------
  function syncCartBar() {
    var count = cart.count();
    var drawerOpen = drawer.hasAttribute("open");
    cartBar.hidden = count === 0 || drawerOpen;
    // Reserve room at the page bottom so the floating bar never covers the footer.
    document.documentElement.classList.toggle("has-cart", count > 0);
    cartBar.querySelector("[data-cart-count]").textContent = count + (count === 1 ? " item" : " items");
    cartBar.querySelector("[data-cart-total]").textContent = WR.formatPrice(cart.total());
  }

  // --- Cart lines --------------------------------------------------------
  function renderLines() {
    var lines = cart.lines();
    emptyEl.hidden = lines.length > 0;
    summaryEl.hidden = lines.length === 0;
    form.hidden = lines.length === 0;

    // Every data value is escaped: item names may come from an API later.
    var esc = WR.escapeHTML;
    linesEl.innerHTML = lines.map(function (l) {
      var name = esc(l.item.name);
      var id = esc(l.item.id);
      return (
        '<li class="cart-line">' +
          '<div class="cart-line-info">' +
            '<span class="cart-line-name">' + name + "</span>" +
            '<span class="cart-line-price">' + esc(WR.formatPrice(l.item.price)) + " each</span>" +
          "</div>" +
          '<div class="stepper" role="group" aria-label="Quantity of ' + name + '">' +
            '<button type="button" data-step="-1" data-id="' + id + '" aria-label="Remove one ' + name + '">−</button>' +
            '<span aria-live="polite">' + esc(l.qty) + "</span>" +
            '<button type="button" data-step="1" data-id="' + id + '" aria-label="Add one ' + name + '">+</button>' +
          "</div>" +
          '<span class="cart-line-total">' + esc(WR.formatPrice(l.lineTotal)) + "</span>" +
        "</li>"
      );
    }).join("");

    var total = WR.formatPrice(cart.total());
    q("[data-subtotal]").textContent = total;
    q("[data-submit-total]").textContent = total;
  }

  linesEl.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-step]");
    if (!btn) return;
    var id = btn.dataset.id;
    cart.setQty(id, cart.qty(id) + parseInt(btn.dataset.step, 10));
    // Keep focus inside the drawer if the line disappeared.
    if (!linesEl.contains(document.activeElement)) {
      (linesEl.querySelector("[data-step]") || q("[data-close-drawer]")).focus();
    }
  });

  // --- Checkout form -----------------------------------------------------
  var fields = {
    name: form.elements.name,
    phone: form.elements.phone,
    area: form.elements.area,
    address: form.elements.address,
    gps: form.elements.gps,
    notes: form.elements.notes,
  };
  var deliveryFields = ["area", "address", "gps"];
  var addressField = q("[data-address-field]");

  function getMethod() {
    return form.querySelector("input[name=method]:checked").value;
  }

  function setMethod(method) {
    var input = form.querySelector('input[name=method][value="' + method + '"]');
    if (input) input.checked = true;
    syncMethod();
  }

  function syncMethod() {
    var delivery = getMethod() === "delivery";
    addressField.hidden = !delivery;
    fields.area.required = delivery;
    fields.address.required = delivery;
    if (!delivery) {
      deliveryFields.forEach(function (name) { setError(fields[name], ""); });
    }
    q("[data-pay-reminder]").hidden = !delivery; // delivery is paid upfront; pickup pays on collection
    q("[data-fee-note]").textContent = delivery
      ? "We'll confirm your total, including the delivery fee, when we reply."
      : "Pay when you pick up at Residence J Hotel, North Legon.";
  }

  form.addEventListener("change", function (e) {
    if (e.target.name === "method") syncMethod();
  });

  // Validation rules return an error message, or "" when valid.
  var rules = {
    name: function (v) {
      return v.trim().length >= 2 ? "" : "Please tell us your name.";
    },
    phone: function (v) {
      // Ghana numbers: 0XXXXXXXXX or +233XXXXXXXXX (spaces/dashes allowed).
      var digits = v.replace(/[\s-]/g, "");
      return /^(\+233|0)\d{9}$/.test(digits) ? "" : "Enter a Ghana number, e.g. 024 123 4567.";
    },
    area: function (v) {
      if (getMethod() !== "delivery") return "";
      return v.trim().length >= 2 ? "" : "Which area should we deliver to?";
    },
    address: function (v) {
      if (getMethod() !== "delivery") return "";
      return v.trim().length >= 5 ? "" : "Add your house, street or a nearby landmark so the rider can find you.";
    },
    gps: function (v) {
      // Optional. GhanaPost GPS digital address, e.g. GA-183-8164 or GA1838164.
      if (getMethod() !== "delivery" || !v.trim()) return "";
      return /^[A-Z]{2}-?\d{3,4}-?\d{3,4}$/i.test(v.trim()) ? "" : "Use the GhanaPost GPS format, e.g. GA-183-8164.";
    },
  };

  function setError(input, message) {
    var errorEl = document.getElementById(input.id + "-error");
    input.setAttribute("aria-invalid", message ? "true" : "false");
    input.closest(".field").classList.toggle("has-error", !!message);
    if (errorEl) errorEl.textContent = message;
  }

  function validate(name) {
    var msg = rules[name](fields[name].value);
    setError(fields[name], msg);
    return !msg;
  }

  // Validate on blur; once a field has shown an error, re-check as they type.
  Object.keys(rules).forEach(function (name) {
    var input = fields[name];
    input.addEventListener("blur", function () {
      if (input.value) validate(name);
    });
    input.addEventListener("input", function () {
      if (input.getAttribute("aria-invalid") === "true") validate(name);
    });
  });

  // --- Share current location (delivery only) ---------------------------
  var locateBtn = q("[data-locate]");
  var locateLabel = q("[data-locate-label]");
  var locateStatus = q("[data-locate-status]");
  var pin = null; // { lat, lng, accuracy } once shared

  function setPin(next) {
    pin = next;
    locateBtn.classList.toggle("is-pinned", !!pin);
    locateLabel.textContent = pin ? "Update my location" : "Share my current location";
    locateStatus.replaceChildren();
    if (!pin) return;
    // Built with DOM APIs rather than markup: coordinates come from the device.
    locateStatus.append("Location pinned (within about " + Math.round(pin.accuracy) + " m). ");
    var view = document.createElement("a");
    view.href = WR.orderService.mapLink(pin);
    view.target = "_blank";
    view.rel = "noopener noreferrer";
    view.textContent = "Check on map";
    var remove = document.createElement("button");
    remove.type = "button";
    remove.className = "link-btn";
    remove.textContent = "Remove";
    remove.addEventListener("click", function () {
      setPin(null);
      locateStatus.textContent = "Location removed.";
      locateBtn.focus();
    });
    locateStatus.append(view, " · ", remove);
  }

  if (!("geolocation" in navigator)) {
    locateBtn.hidden = true;
  }

  locateBtn.addEventListener("click", function () {
    locateBtn.disabled = true;
    locateStatus.textContent = "Finding your location…";
    navigator.geolocation.getCurrentPosition(function (pos) {
      locateBtn.disabled = false;
      setPin({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
    }, function (err) {
      locateBtn.disabled = false;
      locateStatus.textContent = err.code === err.PERMISSION_DENIED
        ? "Location access was blocked. Type your area and landmark above instead."
        : "Couldn't get your location. Type your area and landmark above instead.";
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  });

  var lastHandoffUrl = "";

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var invalid = Object.keys(rules).filter(function (name) { return !validate(name); });
    if (invalid.length) {
      fields[invalid[0]].focus();
      return;
    }

    var order = {
      lines: cart.lines(),
      total: cart.total(),
      method: getMethod(),
      name: fields.name.value.trim(),
      phone: fields.phone.value.trim(),
      area: fields.area.value.trim(),
      address: fields.address.value.trim(),
      gps: fields.gps.value.trim().toUpperCase(),
      pin: pin,
      notes: fields.notes.value.trim(),
    };

    var result = WR.orderService.submitOrder(order);
    if (result.type === "handoff") {
      lastHandoffUrl = result.url;
      window.open(result.url, "_blank", "noopener,noreferrer");
    }
    showSent(order, result);
  });

  // --- Sent view ---------------------------------------------------------
  function showView(name) {
    checkoutView.hidden = name !== "checkout";
    sentView.hidden = name !== "sent";
  }

  function showSent(order, result) {
    var count = order.lines.reduce(function (n, l) { return n + l.qty; }, 0);
    q("[data-sent-summary]").textContent =
      count + (count === 1 ? " item · " : " items · ") +
      WR.formatPrice(order.total) + " · " + (order.method === "delivery" ? "Delivery" : "Pickup");
    q("[data-sent-next]").textContent = order.method === "delivery"
      ? "we'll confirm your total and delivery fee. Pay by MoMo to " + WR.data.business.momo.display +
        " — your meal goes on the stove as soon as payment is received."
      : "we'll confirm and start cooking. Pay when you pick up at Residence J Hotel.";
    q("[data-handoff-link]").href = lastHandoffUrl;
    q("[data-handoff-block]").hidden = result.type !== "handoff";
    showView("sent");
    q("[data-sent-title]").focus();
  }

  q("[data-edit-order]").addEventListener("click", function () {
    showView("checkout");
    fields.name.focus();
  });

  q("[data-finish-order]").addEventListener("click", function () {
    cart.clear();
    form.reset();
    setPin(null);
    syncMethod();
    close();
  });

  // --- Wire up -----------------------------------------------------------
  cart.subscribe(function () {
    renderLines();
    syncCartBar();
  });
  syncMethod();
  renderLines();
  syncCartBar();
};

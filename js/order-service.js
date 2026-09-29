/**
 * Order service — the one place an order leaves the site.
 *
 * Today there is no backend, so an order is handed off to WhatsApp as a
 * pre-filled message the customer sends themselves. To take orders on a
 * server instead, replace `submitOrder` with a POST (see README) and return
 * `{ type: "sent", reference }` — the checkout UI handles both result types.
 */
window.WR = window.WR || {};

WR.orderService = {
  /** Builds the plain-text order message shared by every hand-off channel. */
  formatMessage: function (order) {
    var lines = ["Hi Wok & Roll! I'd like to order:", ""];
    order.lines.forEach(function (l) {
      lines.push(l.qty + " × " + l.item.name + " — " + WR.formatPrice(l.lineTotal));
    });
    lines.push("", "Subtotal: " + WR.formatPrice(order.total));
    if (order.method === "delivery") {
      lines.push("Delivery to: " + order.area + " — " + order.address);
      if (order.gps) lines.push("GhanaPost GPS: " + order.gps);
      if (order.pin) lines.push("Map pin: " + this.mapLink(order.pin));
      lines.push("Payment: MoMo to " + WR.data.business.momo.display + " to confirm");
    } else {
      lines.push("Pickup at Residence J Hotel, North Legon (pay on pickup)");
    }
    lines.push("Name: " + order.name, "Phone: " + order.phone);
    if (order.notes) lines.push("Notes: " + order.notes);
    return lines.join("\n");
  },

  /** Google Maps link for a shared location pin. */
  mapLink: function (pin) {
    return "https://www.google.com/maps?q=" + pin.lat.toFixed(6) + "," + pin.lng.toFixed(6);
  },

  /**
   * @param {{lines, total, method, name, phone, area, address, gps, pin, notes}} order
   * @returns {{ type: "handoff", url: string }}
   */
  submitOrder: function (order) {
    var number = WR.data.business.phone.whatsapp;
    return {
      type: "handoff",
      url: "https://wa.me/" + number + "?text=" + encodeURIComponent(this.formatMessage(order)),
    };
  },
};

/**
 * Live open/closed badge, computed on Accra time so it is correct for
 * visitors in any time zone.
 */
window.WR = window.WR || {};

/** Current hour + minute fraction in the shop's time zone, e.g. 21.5 for 9:30PM. */
WR.shopHourNow = function () {
  var parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: WR.data.business.timeZone,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  var get = function (type) {
    return parseInt(parts.find(function (p) { return p.type === type; }).value, 10);
  };
  return get("hour") + get("minute") / 60;
};

WR.isOpenNow = function () {
  var h = WR.shopHourNow();
  var hours = WR.data.business.hours;
  return h >= hours.open && h < hours.close;
};

WR.initOpenStatus = function () {
  var badges = document.querySelectorAll("[data-open-status]");
  if (!badges.length) return;

  var hours = WR.data.business.hours;

  // 22 → "10PM"
  function clock(h) {
    return (h % 12 || 12) + (h < 12 ? "AM" : "PM");
  }

  function render() {
    var open = WR.isOpenNow();
    badges.forEach(function (el) {
      el.classList.toggle("is-open", open);
      el.classList.toggle("is-closed", !open);
      el.querySelector("[data-open-label]").textContent = open
        ? "Open now · till " + clock(hours.close)
        : "Closed · opens " + clock(hours.open);
    });
  }

  render();
  setInterval(render, 60 * 1000);
};

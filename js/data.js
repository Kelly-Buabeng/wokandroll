/**
 * Wok & Roll — site data.
 *
 * Single source of truth for business details and the menu. Every component
 * reads from `WR.data`, so moving to a backend means replacing this object
 * with the response of an API call (see README → "Connecting a backend").
 */
window.WR = window.WR || {};

WR.data = {
  business: {
    name: "Wok & Roll",
    location: "North Legon, Accra, Ghana",
    phone: {
      display: "025 644 9338",
      tel: "+233256449338",
      // Used for the WhatsApp order hand-off. Assumes the shop phone is on WhatsApp.
      whatsapp: "233256449338",
    },
    timeZone: "Africa/Accra",
    hours: { open: 9, close: 22 }, // 24h clock, daily
    currency: "GHS",
  },

  menu: [
    {
      id: "rice",
      num: "01",
      name: "Rice",
      items: [
        { id: "egg-rice", name: "Egg Rice", price: 35 },
        { id: "special-rice-no-meat", name: "Special Rice (without meat)", price: 35 },
        { id: "special-rice", name: "Special Rice", price: 45 },
        { id: "beef-rice", name: "Beef Rice", price: 50 },
        { id: "chicken-rice", name: "Chicken Rice", price: 50 },
        { id: "assorted-rice", name: "Assorted Rice", price: 70 },
      ],
    },
    {
      id: "noodles",
      num: "02",
      name: "Noodles",
      items: [
        { id: "egg-noodles", name: "Egg Noodles", price: 35 },
        { id: "beef-noodles", name: "Beef Noodles", price: 50 },
        { id: "chicken-noodles", name: "Chicken Noodles", price: 60 },
        { id: "assorted-noodles", name: "Assorted Noodles", price: 70 },
        { id: "special-noodles", name: "Special Noodles", price: 80 },
      ],
    },
    {
      id: "sauces",
      num: "03",
      name: "Sauces",
      items: [
        { id: "gizzard-chilli", name: "Gizzard in Chilli", price: 45 },
        { id: "chicken-oyster", name: "Chicken in Oyster Sauce", price: 50 },
        { id: "beef-oyster", name: "Beef in Oyster Sauce", price: 50 },
        { id: "beef-chilli", name: "Beef in Chilli", price: 55 },
        { id: "chicken-chilli", name: "Chicken in Chilli", price: 55 },
        { id: "special-sauce", name: "Special Sauce", price: 80 },
      ],
    },
  ],
};

/** Formats a number as a price label, e.g. 35 → "GHS 35". */
WR.formatPrice = function (amount) {
  return WR.data.business.currency + " " + amount.toLocaleString("en-GH");
};

// obsidian cs2 - checkout
//
// The worker opens the order on SellAuth and hands back a link, so the payment page is
// the shop's own. We only ever send a plan name: the price, the product and the time all
// come from the server, and the payment is credited to the signed-in account by the
// shop's webhook. Nothing here has to be confirmed by hand.

(() => {
  const cfg = window.OBSIDIAN || {};
  const api = (cfg.api || "").replace(/\/+$/, "");
  const $ = (id) => document.getElementById(id);
  const TOKEN_KEY = "obsidian-token";

  const plan = new URLSearchParams(location.search).get("plan") || "month";
  const token = () => localStorage.getItem(TOKEN_KEY) || "";

  function show(which) {
    ["pay", "signin", "dead"].forEach((id) => ($(id).hidden = id !== which));
  }

  function fail(message) {
    if (!message) return;
    $("error").textContent = message;
    $("error").style.color = "#ff8a9b";
  }

  function dead(title, note) {
    $("title").textContent = "checkout is unavailable.";
    $("lede").textContent = "Nothing has been charged. Try again in a moment.";
    $("dead-title").textContent = title;
    $("dead-note").textContent = note || "";
    show("dead");
  }

  async function open() {
    $("status").textContent = "opening the payment page…";
    show("pay");

    let data;
    try {
      const response = await fetch(`${api}/v1/checkout`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token() ? { authorization: "Bearer " + token() } : {}),
        },
        body: JSON.stringify({ plan }),
      });
      data = await response.json();
    } catch {
      return dead("could not reach the store", "The connection to our api failed. Try again.");
    }

    if (!data || !data.ok || !data.url) {
      return dead(data?.error || "that plan is not on sale right now", "Try again, or open a ticket.");
    }

    // the button stays as a fallback for a blocked redirect
    $("go").href = data.url;
    $("go").textContent = "open payment page";

    if (data.method === "link") {
      // the shop's own plan here has no checkout api, so the sale happens on its product
      // page and the shop hands the buyer a key right there
      $("head").textContent = "shop checkout";
      $("title").textContent = "finish on the shop.";
      $("lede").textContent =
        "You pay on the shop's own page and it shows your key the moment the payment clears. " +
        "Paste that key into the dashboard and the days land on your account.";
      $("status").textContent = "taking you to the shop…";
      $("go").textContent = "open the shop";
      show("pay");
      setTimeout(() => { location.href = data.url; }, 1400);
      return;
    }

    if (!data.signed_in) {
      // bought from a link: the shop will hand over a key the buyer redeems
      $("status").textContent = "you are not signed in — the shop will give you a key to redeem.";
      sessionStorage.setItem("obsidian-guest-checkout", data.url);
      return show("signin");
    }

    // the dashboard settles this when the buyer gets back, so a purchase never depends
    // on the shop's webhook arriving first
    if (data.invoice_id) {
      try {
        localStorage.setItem("obsidian-pending-invoice", JSON.stringify({
          id: String(data.invoice_id), plan, at: Date.now(),
        }));
      } catch {}
    }

    $("status").textContent = "taking you to the payment page…";
    location.href = data.url;
  }

  const guest = $("guest");
  if (guest) {
    guest.addEventListener("click", () => {
      const url = sessionStorage.getItem("obsidian-guest-checkout");
      if (url) location.href = url;
      else open();
    });
  }

  // signed in -> straight through. not signed in -> the api still opens a checkout, and
  // it tells us so we can offer to sign in first instead of handing out a key.
  open();
})();

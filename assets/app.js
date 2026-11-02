// obsidian cs2 - storefront logic
// Plans come from the api so prices live in one place (the worker), not here.

(() => {
  const cfg = window.OBSIDIAN || {};
  const api = (cfg.api || "").replace(/\/+$/, "");
  const grid = document.getElementById("plan-grid");
  const status = document.getElementById("plan-status");
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const money = (cents, currency) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "usd").toUpperCase(),
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);

  const perDay = (plan) => {
    const days = Math.max(1, plan.days);
    const each = plan.amount / 100 / days;
    return each < 0.1 ? `${(each * 100).toFixed(1)}¢ a day` : `${each.toFixed(2)} a day`;
  };

  const featureList = (plan) => [
    `${plan.days} days`,
    `${plan.devices} ${plan.devices === 1 ? "pc" : "pcs"}`,
    "every feature unlocked",
    "automatic updates",
    "hwid reset on request",
  ];

  function render(plans) {
    if (!grid) return;
    grid.innerHTML = "";

    const best = plans.reduce((a, b) => (b.days / Math.max(1, b.amount) > a.days / Math.max(1, a.amount) ? b : a), plans[0]);

    plans.forEach((plan) => {
      const card = document.createElement("article");
      card.className = "card plan" + (plan.id === best.id ? " featured" : "");
      card.innerHTML = `
        ${plan.id === best.id ? '<span class="flag">best value</span>' : ""}
        <h3>${plan.label}</h3>
        <div class="amount">${money(plan.amount, plan.currency)}<small> / ${plan.days}d</small></div>
        <p class="blurb">${plan.blurb || ""} · ${perDay(plan)}</p>
        <ul>${featureList(plan).map((f) => `<li>${f}</li>`).join("")}</ul>
        <button class="btn ${plan.id === best.id ? "btn-primary" : "btn-ghost"}" data-plan="${plan.id}">buy ${plan.label}</button>
      `;
      grid.appendChild(card);
    });

    grid.addEventListener("click", onBuy);
  }

  async function onBuy(event) {
    const button = event.target.closest("[data-plan]");
    if (!button) return;

    const planId = button.dataset.plan;
    const original = button.textContent;

    document.querySelectorAll("[data-plan]").forEach((b) => (b.disabled = true));
    button.textContent = "opening checkout...";
    if (status) status.textContent = "";

    try {
      // the invoice is created on the checkout page itself, so the plan is all that
      // travels in the url - the price still comes from the api, never from here
      window.location.href = `buy.html?plan=${encodeURIComponent(planId)}`;
    } catch (error) {
      if (status) {
        status.textContent = `could not start checkout: ${error.message}`;
        status.style.color = "#ff8a9b";
      }
      button.textContent = original;
      document.querySelectorAll("[data-plan]").forEach((b) => (b.disabled = false));
    }
  }

  async function loadPlans() {
    const local = cfg.fallbackPlans || [];
    try {
      const response = await fetch(`${api}/v1/plans`);
      const data = await response.json();
      if (!data.ok || !Array.isArray(data.plans) || !data.plans.length) throw new Error("empty");
      render(data.plans);
    } catch {
      if (local.length) {
        render(local);
      } else if (status) {
        status.textContent = "pricing is unavailable right now.";
      }
    }
  }

  if (grid) loadPlans();
})();

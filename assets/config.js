// Where the license api lives. Change this one line when you move to a domain.
// The site is static, so every purchase and key claim is a call to that api.
window.OBSIDIAN = {
  api: "https://site-da5150d332e0477bb3b337fbab893e17.freebuff.page",

  // Where customers download the loader. It is served by the api worker, not by this
  // static site, so hosting the pages on vercel/github pages needs no exe in the repo.
  loaderUrl: "https://site-da5150d332e0477bb3b337fbab893e17.freebuff.page/loader.exe",

  // only used until /v1/plans answers. the worker's catalogue is the real one, so
  // nobody can edit a price in devtools and pay it.
  // The shop itself, for anyone buying outside the dashboard checkout.
  shopUrl: "https://snowsshop.mysellauth.com/products",

  fallbackPlans: [
    { id: "month", label: "monthly", days: 30, devices: 1, amount: 999, currency: "usd", blurb: "everything, one pc" },
    { id: "quarter", label: "3 months", days: 90, devices: 1, amount: 2499, currency: "usd", blurb: "save 17%" },
    { id: "year", label: "yearly", days: 365, devices: 2, amount: 7499, currency: "usd", blurb: "save 37%, two pcs" }
  ]
};

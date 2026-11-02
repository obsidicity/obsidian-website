# obsidian — storefront

Static site. No build step, no framework, no server of its own: it calls the license
worker for pricing, checkout and the key claim.

```
index.html      hero, features, pricing, faq
success.html    post-stripe page that reveals the key
terms.html      terms of sale
assets/config.js   the api url (edit this when you get a domain)
assets/style.css
assets/app.js
```

## wiring it up

1. open `assets/config.js` and set `api` to the deployed worker url.
2. on the worker, set `SITE_URL` to wherever this site is served, and `SITE_ORIGINS` to the
   same origin(s) so `/v1/checkout` and `/v1/claim` accept browser calls.
3. in stripe, add the webhook endpoint `https://<worker>/v1/stripe/webhook` for the
   `checkout.session.completed` event, then put its signing secret in `STRIPE_WEBHOOK_SECRET`.
4. prices live in the worker's `PLAN_CATALOG`. Change them there, not here.

## deploying

It is plain files — any static host works (Sites, Pages, Netlify, S3). Upload the folder as-is.
`success.html` must be reachable at `/success.html` because that is the `success_url` the worker
builds for stripe.

## local look

Just open `index.html`. Pricing falls back to the copy in `config.js` when the api is not up.

## accounts

`success.html` asks the buyer for a username and password right after checkout
(`/v1/claim/account`), then drops them into `dashboard.html`. That account is what the
loader logs in with too, so there is no key to copy anywhere.

`dashboard.html` shows the plan, days left, bound pcs and recent orders, and has the
self-serve hwid reset. It stores its token in `localStorage` under `obsidian-token`; web
tokens last an hour and can never download the module.

`loader.exe` in the download button must sit next to these pages (it is the file
`publish.bat` stages into `/public`).

## redeem, not keys-as-logins

`success.html` shows the key that was just paid for, with two ways forward:

- **first time** → create username + password; that call (`/v1/claim/account`) redeems the key
  for you and drops you into the dashboard.
- **already have an account** → the key is carried in `sessionStorage` to `dashboard.html`,
  which pre-fills the redeem box. One click and the days stack onto the existing subscription.

So a renewal never creates a second account, and no one has to keep a key in a notes app.

# AGENTS.md

Instructions for anyone (human or AI) working on this project.

## The project

Affordable Gold Enterprise - an online shop selling honey and other food items.
It started as the HNG 15 Stage 2 task and the current base is Keffi, Lafia and Abuja,
with nationwide delivery.

Four things must always work: browse the shop, check out, save everything to the
database, and email a confirmation. Sign-in is Google, through Supabase.

## Stack

| Part           | Tool                              |
| -------------- | --------------------------------- |
| Shop front-end | React 18 + Vite (`client/`)       |
| Back-end API   | Node + Express, ESM (`server/`)   |
| Database       | Supabase (Postgres)               |
| Sign-in        | Google OAuth, handled by Supabase |
| Payments       | Paystack (test mode for now)      |
| Emails         | Mailgun                           |
| Hosting        | Vercel (client), Render (server)  |

## Layout

```
client/                 shop front-end
  src/App.jsx           start screen, checks the API is alive
  src/index.css         all styling, CSS variables live here
  .env                  VITE_ settings only, safe to expose
server/                 back office
  src/index.js          Express entry point
  .env                  all secrets, never exposed
docs/
  SETUP.md              account setup steps for Supabase, Google, Mailgun, Paystack
  supabase-schema.sql   the whole database, safe to re-run
```

## Commands

```
cd server && npm install && npm run dev     # API on http://localhost:5000
cd client && npm install && npm run dev     # shop on http://localhost:5173
cd client && npm run build                  # production build check
```

`GET /api/health` returns which settings are still blank. Use it as the first
check when something looks broken.

## This machine (Windows)

- `npm` is blocked by the execution policy. Use `npm.cmd`.
- PowerShell 5.1 corrupts text containing a quote character when it is passed as an
  argument to a native `.exe`. The `apply_patch` helper is affected by this, so
  patches containing `"` fail. Write files directly instead:

  ```powershell
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  $c = @'
  ...file content...
  '@
  [System.IO.File]::WriteAllText((Join-Path $PWD 'path\to\file'), $c + "`n", $utf8)
  ```

- Vite and esbuild need to read folders above the project. Sandboxed builds fail with
  `Cannot read directory`. Run builds with escalated permissions.
- Never delete or move files recursively without checking the resolved path is inside
  this repo first. Use `-LiteralPath`.

## Secrets

- `server/.env` and `client/.env` hold real values and are git-ignored. Keep
  `.env.example` in sync with the same key names and no values.
- `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY` and `MAILGUN_API_KEY` are
  server-only. They must never appear in `client/` and never as a `VITE_` variable.
- Never print a key value in chat, logs or a commit. Check by name, not by value.

## Database rules

- Every schema change goes into `docs/supabase-schema.sql` and must stay safe to run
  twice: `create table if not exists`, `drop policy if exists`, `on conflict do nothing`.
- Row level security stays on for every table. Visitors read only active products and
  delivery zones. A customer reads only their own orders and profile.
- Orders and order items are written by the server using the service-role key, never
  from the browser. Recalculate every total on the server. Never trust a price, a fee
  or a total sent by the client.
- Money is `numeric(12, 2)` in Naira. Never floats.
- Order items copy the product name, unit and price at the time of the order, so
  history does not change when a product is edited later.
- Delivery fees are data in `delivery_zones`, not values in code.

## Business rules

- Browsing is open to everyone. Sign-in is required only at checkout.
- Fulfilment is either delivery or pickup. Pickup is free.
- Payment methods: card (Paystack), bank transfer, pay on delivery.
  Card marks the order paid automatically. The other two stay pending until an admin
  confirms the money arrived.
- A zone that is not in the list, or is flagged `needs_quote`, tells the customer
  "we will call you to confirm the delivery fee". The order saves as pending and the
  admin fills in the fee later.
- Every order sends two emails: a confirmation to the customer and an alert to
  `ORDER_ALERT_EMAIL`.
- Admin is decided by `profiles.role = 'admin'` in the database. Never hardcode an
  admin email in runtime code.

## Code style

- ES modules everywhere. No CommonJS, no `require`.
- Two-space indent, single quotes, no semicolons, no trailing commas in function calls.
- `const` and `let`, arrow functions. Named exports for helpers, default export for
  screens and components.
- React: function components and hooks. Use `.jsx` for files that return markup.
- No commented-out code. Comments only where the reason is not obvious from the code.
- CSS lives in `client/src/index.css` using the existing variables. Kebab-case class
  names. No CSS frameworks unless asked.
- Prices show as `₦8,000` - Naira symbol, thousands separator, no decimals unless the
  amount really has kobo.

## Look and feel

- Mobile first. Most customers are on a phone with slow data.
- Palette: gold `#c89b3c`, ink `#1c1a17`, paper `#fffdf8`, line `#e8e0d0`.
- Warm, clean and local. Avoid the default bootstrap-looking shop.
- Keep images small and lazy-load product photos.

## Working agreements

- Do not commit, branch or push unless asked.
- Do not add a new library without asking first.
- Ask before changing the database schema if the user may already have real data.
- Fix root causes, not symptoms. Do not fix unrelated bugs while working on a task.
- If a step has to happen in a dashboard you cannot reach (Supabase, Google Cloud,
  Mailgun, Paystack), give numbered plain-English steps and say exactly where the
  copied value goes.

## Talking to the user

- Plain, non-technical language. Short sentences, straight answers.
- Use a small scenario to explain a flow when it helps.
- Flag problems early instead of building around them quietly.
- Never make changes without approval. Explain first, then wait.

## Roadmap

- [x] Project skeleton, front-end and back-end connected
- [x] Database design in `docs/supabase-schema.sql`
- [ ] Product catalogue and product detail page
- [ ] Cart and checkout page
- [ ] Google sign-in
- [ ] Paystack payments
- [ ] Mailgun confirmation emails
- [ ] Admin area: orders, products, delivery fees, photos

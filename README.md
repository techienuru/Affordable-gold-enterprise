# Affordable Gold Enterprise

An online shop for Affordable Gold Enterprise - pure honey and other food items,
delivered around Keffi, Lafia, Abuja and the rest of Nigeria.

This started as the HNG 15 Stage 2 task:
build a shop, add a checkout page, save everything in a database, send confirmation
emails, and let people sign in with Google.

## What it is built with

| Part            | Tool                            |
| --------------- | ------------------------------- |
| Shop front-end  | React + Vite                    |
| Back-end API    | Node + Express                  |
| Database        | Supabase (Postgres)             |
| Sign-in         | Google, handled by Supabase     |
| Payments        | Paystack                        |
| Emails          | Mailgun                         |
| Hosting         | Vercel (front-end), Render (API)|

## Folder layout

```
client/                 the shop people see and click
  src/App.jsx           first screen, checks the setup
  .env                  front-end settings (safe to show)
server/                 the back office
  src/index.js          API entry point
  .env                  secret keys - never shared, never committed
docs/
  SETUP.md              how to create the Supabase, Google, Mailgun and Paystack accounts
  supabase-schema.sql   paste this into the Supabase SQL Editor to create the tables
```

## Running it locally

Open two terminals.

```
cd server
npm install
npm run dev
```

```
cd client
npm install
npm run dev
```

Then open `http://localhost:5173`.

## First-time setup

Follow `docs/SETUP.md`, then paste `docs/supabase-schema.sql` into Supabase.
After that, fill in `server/.env` and `client/.env`.

## Current status

- [x] Project skeleton, front-end and back-end talking to each other
- [x] Database design ready to paste into Supabase
- [x] Product catalogue and product detail page
- [x] Shopping cart
- [x] Checkout page
- [x] Google sign-in
- [x] Secure order saving
- [ ] Paystack payments
- [x] Mailgun confirmation emails
- [ ] Admin page for orders, products and delivery fees

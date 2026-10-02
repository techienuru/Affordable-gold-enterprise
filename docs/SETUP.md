# Setup guide

Do these in order. Each one is about 5 minutes.

---

## 1. Supabase (the database)

1. Go to `supabase.com` and sign in with GitHub or Google.
2. Click **New project**.
3. Name it `affordable-gold`, set a database password, and **save that password somewhere safe**.
4. Region: pick the closest one to Nigeria (Cape Town or Johannesburg if it is listed, otherwise Frankfurt or Ireland).
5. Click **Create new project** and wait about 2 minutes.
6. Left menu -> **Project Settings** -> **API**. Copy these three into `server/.env`:
   - `Project URL` -> `SUPABASE_URL`
   - `anon public` -> `SUPABASE_ANON_KEY`
   - `service_role` -> `SUPABASE_SERVICE_ROLE_KEY`
7. Copy the first two again into `client/.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - The `service_role` key is a master key. It goes in `server/.env` only. Never in `client`.
8. Left menu -> **SQL Editor** -> **New query**. Open `docs/supabase-schema.sql`, copy the whole file, paste it in, and press **Run**.
   - You can safely run the whole file again after an update. Existing products and orders are kept.
9. Left menu -> **Authentication** -> **Providers** -> **Google**. Enable it. You will need the Client ID and Secret from step 2 below, so come back to this.

---

## 2. Google sign-in (Google Cloud Console)

1. Go to `console.cloud.google.com` and sign in.
2. Top bar -> project dropdown -> **New project**. Name it `Affordable Gold`. Create it, then make sure it is selected.
3. Left menu -> **APIs & Services** -> **OAuth consent screen**.
   - User type: **External**. Click Create.
   - App name: `Affordable Gold Enterprise`
   - User support email: your Gmail
   - Developer contact email: your Gmail
   - Save and continue through the rest. You can leave the app in **Testing** mode.
4. Left menu -> **APIs & Services** -> **Credentials** -> **Create credentials** -> **OAuth client ID**.
5. Application type: **Web application**. Name it `Affordable Gold Web`.
6. **Authorized JavaScript origins** - click Add URI and add each of these:
   - `http://localhost:5173`
   - your live front-end link once you have it (for example `https://affordable-gold.vercel.app`)
7. **Authorized redirect URIs** - click Add URI and add your Supabase callback.
   You will find the exact link in Supabase under **Authentication** -> **Providers** -> **Google** -> it is shown as the callback URL, and it looks like:
   `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
8. Click Create. Copy the **Client ID** and **Client secret**.
9. Go back to Supabase -> **Authentication** -> **Providers** -> **Google**. Paste both in and click Save.
10. In Supabase, open **Authentication** -> **URL Configuration**.
    - Set **Site URL** to `http://localhost:5173` while testing locally.
    - Add `http://localhost:5173/**` under **Redirect URLs**.
    - After deployment, change **Site URL** to your Vercel address and add the exact live checkout URL, for example `https://affordable-gold.vercel.app/checkout`.

---

## 3. Mailgun (the emails)

1. Sign in at `mailgun.com`.
2. Add and verify the domain `affordablegold.mooo.com`.
3. Mailgun will show you a list of DNS records (TXT and CNAME). Add them wherever you control `mooo.com`.
4. Once the domain shows as **Verified**, open **Sending** -> **Domains** -> your domain -> **API keys**.
5. Copy the key into `server/.env` as `MAILGUN_API_KEY`, and check that `MAILGUN_DOMAIN` and `MAILGUN_FROM_EMAIL` are right.

Note: nothing can be sent until the domain is verified. Until then, use the Mailgun **sandbox** domain and add a few recipient addresses by hand.

---

## 4. Paystack (the payments)

1. Sign in at `paystack.com`.
2. Go to **Settings** -> **API Keys & Webhooks**.
3. Make sure you are on **Test mode**.
4. Copy the **Test Secret Key** into `server/.env` as `PAYSTACK_SECRET_KEY`.
5. Copy the **Test Public Key** into both `server/.env` and `client/.env` as `PAYSTACK_PUBLIC_KEY` / `VITE_PAYSTACK_PUBLIC_KEY`.

---

## 5. Run it on your computer

Open two terminals.

Terminal 1 (the back-end):

```
cd server
npm install
npm run dev
```

Terminal 2 (the shop):

```
cd client
npm install
npm run dev
```

Then open `http://localhost:5173`.

The start screen shows green ticks for whatever is working, and tells you which settings are still blank.

---

## 6. Going live later

- Front-end: connect this repo to **Vercel**, set the root folder to `client`, and add the `VITE_` settings as environment variables.
- Back-end: connect the repo to **Render**, set the root folder to `server`, add all the settings as environment variables, and use `npm start` as the start command.
- Remember to add the live front-end link to both the Google origins list and `CLIENT_URL`.
- Render free instances fall asleep. The first visit after a quiet spell can take up to a minute.

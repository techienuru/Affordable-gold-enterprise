# Next steps

Follow these sections in order. Each task is marked with who should do it:

- **You:** requires your account, dashboard access or business decision.
- **Agent:** can be implemented or checked in the repository after you approve it.
- **You + Agent:** you provide access or test results; the agent handles the code or diagnosis.

Live services:

- Shop: `https://affordable-gold-enterprise-shop.vercel.app`
- API: `https://affordable-gold-enterprise.vercel.app/api`

Never paste a secret key into chat or put it in `client/`. Secret keys belong only in the back-end Vercel environment variables and `server/.env`.

---

## 1. Test Google sign-in on the live shop

**Owner: You**

1. Open `https://affordable-gold-enterprise-shop.vercel.app/checkout` in a private or incognito browser window.
2. Click **Sign in with Google**.
3. Choose your Google account.
4. Confirm that Google returns you to the live checkout page.
5. Refresh the page and confirm that you remain signed in.
6. Open the account menu and sign out.
7. Confirm that the shop still works while signed out.

If Google shows a redirect or permission error, copy only the error message for the agent. Do not share the Google Client Secret.

**Agent follow-up:** Inspect the authentication return path and Supabase settings described in `docs/SETUP.md`. Fix code only after approval.

---

## 2. Give your account admin access

**Owner: You**

1. Sign in to the live shop once with Google. This creates your profile.
2. Open your Supabase project.
3. Go to **Table Editor** -> **profiles**.
4. Find the row containing your email address.
5. Change `role` from `customer` to `admin`.
6. Save the row.
7. Sign out of the shop and sign in again.
8. Open `https://affordable-gold-enterprise-shop.vercel.app/admin`.

Only trusted accounts should have the `admin` role.

**Agent follow-up:** Confirm that non-admin users receive `403` and unsigned users receive `401`. Never hardcode an admin email in the application.

---

## 3. Test the live admin area

**Owner: You + Agent**

### You

1. Open the live `/admin` page.
2. Open **Orders** and confirm that your two test orders appear.
3. Change one test order's status and click **Save changes**.
4. Refresh the page and confirm that the new status remains.
5. Open **Products**.
6. Edit one placeholder product's price or stock and save it.
7. Refresh the shop and confirm that the change appears.
8. Upload a JPG, PNG, WebP or AVIF product photo smaller than 2 MB.
9. Confirm that the photo appears in the shop.
10. Open **Delivery** and confirm that Keffi, Abuja, Lafia and Other states appear.
11. Avoid changing real delivery fees until you have decided the final amounts.

### Agent

1. Diagnose any failed save without exposing keys or customer details.
2. Confirm that prices and delivery fees remain stored as Naira values.
3. Confirm that hidden products disappear from the shop but remain in the admin area.
4. Confirm that only active delivery areas appear at checkout.

---

## 4. Fix and test Mailgun emails

The earlier order test saved successfully, but the confirmation email failed. A complete health response only means the settings are present; it does not prove Mailgun accepted the email.

### Dashboard work

**Owner: You**

1. Sign in to Mailgun.
2. Open **Sending** -> **Domains**.
3. If using a sandbox domain, add and verify both recipient addresses:
   - the customer test email;
   - the address used for `ORDER_ALERT_EMAIL`.
4. If using your own sending domain, confirm that Mailgun shows it as **Verified**.
5. Open the back-end project in Vercel.
6. Confirm these environment variable names exist:
   - `MAILGUN_API_KEY`
   - `MAILGUN_DOMAIN`
   - `MAILGUN_FROM_EMAIL`
   - `ORDER_ALERT_EMAIL`
7. Confirm that `MAILGUN_FROM_EMAIL` uses the same verified Mailgun domain.
8. Do not send the values to the agent.
9. Redeploy the back end after changing any value.

### Diagnosis and code work

**Owner: Agent, after your approval**

1. Review the Vercel function logs for the failed Mailgun request.
2. Identify whether the failure is a sandbox-recipient, domain, sender or API problem.
3. Correct the email code only if the dashboard settings are already correct.
4. Place a test order.
5. Confirm that the customer receives a confirmation email.
6. Confirm that `ORDER_ALERT_EMAIL` receives the admin alert.
7. Confirm that an email failure never removes an order that was already saved.

---

## 5. Add Paystack card payments

### Get the test key

**Owner: You**

1. Sign in to Paystack.
2. Switch to **Test mode**.
3. Open **Settings** -> **API Keys & Webhooks**.
4. Copy the Test Secret Key into the back-end Vercel project as `PAYSTACK_SECRET_KEY`.
5. Copy the Test Public Key into the front-end Vercel project as `VITE_PAYSTACK_PUBLIC_KEY`.
6. Never put the secret key in the front-end project or in chat.
7. Redeploy both projects after saving the settings.
8. Tell the agent only that the variables have been added.

### Implement payments

**Owner: Agent, after your approval and after the test key is available**

1. Inspect the existing order and payment fields.
2. Ask before making any database change because the project now contains real orders.
3. Add a protected back-end route that starts a Paystack transaction.
4. Recalculate the order total on the server. Never accept a total supplied by the browser.
5. Send the customer to Paystack's secure payment page.
6. Add a back-end verification route for the returned Paystack reference.
7. Add Paystack webhook verification using the secret key.
8. Make repeated callbacks safe so an order cannot be paid twice.
9. Mark the order as paid only after Paystack confirms the payment.
10. Keep bank transfer and pay-on-delivery orders pending until an admin confirms payment.
11. Test successful, cancelled and failed payments using Paystack test mode.

---

## 6. Run one complete live order test

**Owner: You + Agent**

### You

1. Open the live shop in a private browser window.
2. Browse the catalogue and open a product page.
3. Add products to the cart.
4. Change quantities and confirm the displayed subtotal.
5. Continue to checkout and sign in with Google.
6. Choose delivery or pickup.
7. Place an order using each available test payment method.
8. Confirm that the success page shows an order number.
9. Open `/orders` and confirm that the order appears.
10. Confirm that both emails arrive.
11. Open `/admin` and confirm that the order appears there.

### Agent

1. Watch the browser and Vercel logs without printing secrets.
2. Verify that the server calculated product prices, delivery fees and totals.
3. Verify that the order and its items were saved correctly.
4. Fix only problems that you approve.

---

## 7. Check phones, tablets and slow connections

**Owner: Agent, after your approval**

1. Test the shop at widths of 375px, 768px, 1024px and 1440px.
2. Check the catalogue, product page, cart, checkout, order history and admin area.
3. Confirm that there is no sideways page scrolling.
4. Confirm that buttons and form controls are easy to tap.
5. Test keyboard navigation and visible focus indicators.
6. Test reduced-motion mode and larger browser text.
7. Confirm that missing and slow product photos do not break the layout.
8. Run a production build after any approved fixes.

---

## 8. Replace placeholder shop content

**Owner: You**

1. Prepare the final name, category, description, price, unit and stock for every product.
2. Prepare compressed product photos, preferably WebP or AVIF and smaller than 2 MB each.
3. Use the live admin area to add the real products.
4. Hide placeholder products instead of deleting them until you are sure they are no longer needed.
5. Confirm the final delivery areas, fees and customer messages.

**Agent follow-up:** Help clean, resize or rewrite content only after you supply and approve it.

---

## 9. Add legal and customer-help pages

**Owner: You + Agent**

### You

Provide or approve the business rules for:

- privacy;
- returns and refunds;
- delivery timing;
- cancellations;
- customer contact details;
- terms of sale.

### Agent

1. Create the approved pages.
2. Link them from the footer and checkout where appropriate.
3. Keep the wording readable on phones.
4. Do not invent legal promises or business policies.

---

## 10. Connect a custom domain

This is optional. The Vercel addresses can be used until you buy a domain.

**Owner: You**

1. Buy or choose the domain.
2. Add it to the front-end project in **Vercel** -> **Settings** -> **Domains**.
3. Add the DNS records shown by Vercel at your domain provider.
4. Wait until Vercel marks the domain as valid.
5. Tell the agent the final address.

**Agent follow-up:** Update the back-end `CLIENT_URL`, Supabase Site URL and redirect URLs, and the Google authorized origin after you approve those dashboard changes.

---

## 11. Move Paystack to live mode

Do this only after all test payments work and Paystack has approved the business account.

**Owner: You**

1. Complete Paystack's business verification.
2. Switch the Paystack dashboard to **Live mode**.
3. Replace the test keys in Vercel with the live keys.
4. Never place the live secret key in the client or chat.
5. Redeploy both projects.
6. Make one small real payment and confirm it in Paystack and the admin area.

**Agent follow-up:** Verify the live callback and webhook behavior without displaying any key value.

---

## 12. Add monitoring and analytics

This is optional but recommended after the buying flow works.

**Owner: You**

1. Decide whether you want visitor analytics, error monitoring or both.
2. Approve the service before any new library or account is added.
3. Create the required account and keep private credentials out of chat.

**Owner: Agent, after approval**

1. Add the smallest suitable integration.
2. Avoid collecting unnecessary customer information.
3. Verify that monitoring does not slow down checkout or expose secrets.

---

## Launch-ready checklist

- [ ] Live Google sign-in works.
- [ ] Your admin account works.
- [ ] Order, product, photo and delivery management work.
- [ ] Customer confirmation emails arrive.
- [ ] Admin order-alert emails arrive.
- [ ] Paystack test payments succeed and failures are handled safely.
- [ ] A full live order test passes.
- [ ] Phone and accessibility checks pass.
- [ ] Real products, photos, prices and delivery fees are published.
- [ ] Customer policies and contact information are available.




 You need to do three things

  - Paste the Gmail app password into SMTP_PASS in server/.env, and add
    the same SMTP settings to your back-end host's environment
  - In Paystack: Settings → API Keys & Webhooks → Webhook URL =
    https://<your-api-domain>/api/payments/paystack/webhook.

  - Redeploy the API and the shop.
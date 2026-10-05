# Affordable Gold mobile app

The Android and iPhone app for Affordable Gold Enterprise. It uses the same Supabase project and Express API as the website.

## Included

- Product catalogue and product details
- Persistent shopping cart
- Google sign-in through Supabase
- Delivery or pickup checkout
- Paystack card-payment handoff
- Bank transfer and pay-on-delivery orders
- Customer order history and pending card payments
- Admin order, product, photo and delivery management

## Set up the environment

1. Copy `.env.example` to `.env`.
2. Copy the public Supabase URL and anon key from `client/.env` into the matching `EXPO_PUBLIC_` values.
3. Keep the live API URL already shown in `.env.example`, or replace it with a local API address when testing locally.
4. Never put the Supabase service-role key, Paystack secret or Mailgun key in this folder.

## Allow the mobile sign-in return

In Supabase, open **Authentication** -> **URL Configuration** and add:

```text
affordablegold://auth/callback
```

A development build uses that stable address. Expo Go may show an `exp://` return address on the Account screen; add that exact address temporarily if you want to test Google sign-in in Expo Go.

The Google Cloud redirect remains the existing Supabase callback. Do not replace it with the mobile address.

## Start with Expo Go

```text
cd mobile
npm.cmd start
```

Install Expo Go on the phone and scan the QR code. Catalogue, cart and other Expo Go-compatible features can be tested immediately.

## Install on Android through USB

1. Install Android Studio and its Android SDK tools.
2. Enable Developer Options and USB debugging on the phone.
3. Connect the phone and approve its debugging prompt.
4. Run:

```text
cd mobile
npx.cmd expo run:android --device
```

This generates the native Android project locally, installs the development app and starts it on the phone. Generated `android/` and `ios/` folders should not be edited by hand.

## Build an Android APK in the cloud

1. Create or sign in to an Expo account.
2. Run:

```text
cd mobile
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest build --platform android --profile preview
```

3. Download the APK from the link Expo gives you.
4. Send it to an Android phone and allow installation from that source.

## Build for iPhone

Use Expo's cloud build from Windows:

```text
npx.cmd eas-cli@latest build --platform ios --profile preview
```

Apple signing is required. Direct iPhone cable builds require a Mac with Xcode.

## Checks

```text
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run doctor
```

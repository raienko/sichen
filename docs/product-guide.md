[Docs](index.md) › Product guide

# From boilerplate to product

> Everything a team needs to turn this repository into its own app on the App Store, Google Play and the web: the decisions to make first, the accounts, hardware and credentials to get, and the steps in order. Keep it current — see [Keeping this guide up to date](#keeping-this-guide-up-to-date).

<sub>Last reviewed: 2026-10-19 · Prices and store rules change; check the linked source before paying or submitting.</sub>

## The short version

1. Decide the [product identity](#1-decide-the-identity-first) — some of it can never change after the first release.
2. Get the [accounts](#2-accounts) (Apple takes the longest — start it on day one) and the [hardware](#3-hardware).
3. Follow the [steps](#4-step-by-step) in order: brand → project setup → backend → domain and links → iOS → Android → web → security and privacy → CI and release → store listings → operations.
4. Keep every credential where the [credentials table](#credentials-and-where-they-live) says, with an owner and a renewal date.

---

## 1. Decide the identity first

| Decision                                        | Where it goes                       | Can it change later?                                                                        |
| ----------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------- |
| **Bundle / package id** (`com.company.product`) | `EXPO_PUBLIC_APP_BUNDLE_ID`         | **No** — after the first store upload it identifies the app forever. A new id is a new app. |
| App name (store and home screen)                | `EXPO_PUBLIC_APP_NAME`              | Yes, with a store review                                                                    |
| Slug (Expo project, user agent)                 | `EXPO_PUBLIC_APP_SLUG`              | Painful — it names the EAS project                                                          |
| URL scheme (`product://`)                       | `EXPO_PUBLIC_APP_SCHEME`            | Breaks existing links                                                                       |
| Publisher: **individual or organization**       | Apple / Google accounts             | Hard — transferring an app to another account is a support process                          |
| Domain (`product.com`)                          | DNS, `EXPO_PUBLIC_APP_LINK_DOMAINS` | Yes, but links and the web app move with it                                                 |
| Platforms at launch (iOS, Android, web)         | —                                   | Yes                                                                                         |

Publish as an **organization** for a commercial product: the store shows the company as seller, several people can hold roles, and the account survives staff changes. It needs a legal entity and (for Apple) a D-U-N-S number.

## 2. Accounts

Create these with a **shared company identity** (a group mailbox such as `apps@company.com`, not someone's personal address), with two-factor authentication on and at least two admins.

| Account                                                          | Cost (at time of writing)                    | Needed for                                                          | Notes                                                                                                                                                              |
| ---------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Apple Developer Program](https://developer.apple.com/programs/) | 99 USD / year                                | TestFlight, App Store, push notifications, universal links, signing | Organizations need a **D-U-N-S number** (free from Dun & Bradstreet, can take days–weeks). Enrollment review takes days. Renew yearly or the app leaves the store. |
| [App Store Connect](https://appstoreconnect.apple.com)           | included                                     | The app record, TestFlight, store listing, privacy labels           | Same Apple account; add team members with roles.                                                                                                                   |
| [Google Play Console](https://play.google.com/console)           | 25 USD one-time                              | Internal / closed / production tracks, store listing                | Identity verification for organizations. **New personal accounts** must run a closed test (currently 12+ testers for 14 days) before production access.            |
| [Google Cloud / Firebase](https://console.firebase.google.com)   | free tier                                    | Android push (FCM), Play service account for automated submit       | One project per environment is cleanest.                                                                                                                           |
| [Expo (EAS)](https://expo.dev)                                   | free tier; paid plans for more/faster builds | Cloud builds, store submission, updates, web hosting (EAS Hosting)  | Create an **organization** and add the team.                                                                                                                       |
| [GitHub](https://github.com) organization                        | free / Team plan                             | Code, CI (Actions), security features                               | Branch protection and private vulnerability reporting — see the [security plan](security/plan.md) SEC-16.                                                          |
| Domain registrar + DNS                                           | ~10–50 USD / year                            | Website, universal / app links, email                               | Lock the domain and turn on auto-renew.                                                                                                                            |
| Email for the domain                                             | varies                                       | Support address, store contact, Apple/Google account owner          | Stores show the support email publicly.                                                                                                                            |
| Map tiles provider (optional)                                    | free tier                                    | Only if you replace the default OpenFreeMap tiles                   | Restrict the key to the bundle id and web domain.                                                                                                                  |
| Backend / API hosting                                            | varies                                       | `EXPO_PUBLIC_API_URL`                                               | Outside this repository.                                                                                                                                           |

## 3. Hardware

| Item                             | Why                                                                                                  | Minimum                                                                                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **A Mac** with current Xcode     | Running and debugging on the iOS simulator, local iOS builds, local Maestro runs on iOS              | Apple silicon, 16 GB RAM, ~100 GB free. EAS Build can produce iOS binaries in the cloud without a Mac, but day-to-day iOS work needs one. |
| A physical **iPhone**            | Signed builds, push, biometrics, camera, real performance — none of which the simulator covers fully | One recent model + one older supported model if you can                                                                                   |
| A physical **Android phone**     | The same, plus OEM differences                                                                       | One Pixel-class device + one mid-range device                                                                                             |
| Android emulator / iOS simulator | Daily development and E2E                                                                            | Comes with Android Studio / Xcode                                                                                                         |

Windows or Linux machines work for Android and web; iOS needs the Mac or EAS cloud builds.

---

## 4. Step by step

Each step says what to do, where in the repo, and what you end up with. Steps 5 (iOS) and 6 (Android) can run in parallel once step 2 is done.

### Step 1 · Fork and brand

1. Fork or copy the repository into the company GitHub organization; protect `main` straight away.
2. Set the identity — `EXPO_PUBLIC_APP_NAME`, `_SLUG`, `_SCHEME`, `_BUNDLE_ID` — per environment on EAS, or in `.env` until there is an EAS project (see [App builds](development-builds.md)).
3. Edit `assets/brand/brand.json` — `colors`, `palette`, `maps` — and replace `assets/brand/logo.svg`. See the [brand guide](../assets/brand/README.md). Run `yarn brand` (also runs on every `yarn install`): it writes every icon and splash, the palette and the web manifest.
4. Remove or hide the showcase from production startup when the first real screens arrive (roadmap step 14). **Don't run `yarn reset-project`** — it's Expo's template script and moves `src/` away.

Result: the app builds and runs under the new name, colours and icons.

### Step 2 · Expo project and build profiles

1. `npx eas login`, then `npx eas init` in the repo: it creates the EAS project. Put its id in `.env` › `EXPO_PUBLIC_EAS_PROJECT_ID`.
2. Give each EAS environment — `development`, `preview`, `production` — its identity and backend; the committed `eas.json` has one build and submit profile per environment, named after it, and no values of its own. See [App builds](development-builds.md).
3. Set the version policy: `version` in `app.config.ts` for what users see, and let EAS manage build numbers (`appVersionSource: "remote"`, `autoIncrement` on production).

Result: `yarn eas build --profile development --platform all --auto-submit` puts the DEV app in TestFlight and Play internal testing.

### Step 3 · Backend and configuration

1. `EXPO_PUBLIC_API_URL`, per EAS environment: https only — the app refuses plain http except to a local dev server.
2. Map tiles (optional): `maps.tilesUrl` / `maps.glyphsUrl` in `assets/brand/brand.json` — see the brand guide.
3. Remember: **every `EXPO_PUBLIC_*` value ships inside the app and is public.** Server secrets live on the server or in EAS / GitHub secrets, never in `.env` values the app reads.
4. Per environment, use different values in each EAS profile (preview vs production API, keys).

Result: the app talks to your backend in each environment.

### Step 4 · Domain, deep links and email

1. Register the domain; set up DNS and the support mailbox.
2. Add the domain to `EXPO_PUBLIC_APP_LINK_DOMAINS` (comma-separated); `app.config.ts` turns it into iOS associated domains and Android intent filters.
3. Publish, on `https://<domain>/.well-known/`:
   - `apple-app-site-association` — your **Team ID** + bundle id (from Apple, step 5), served as JSON with no redirect.
   - `assetlinks.json` — the package name + the **SHA-256 fingerprint of the app signing key** (from Play Console › App signing, step 6; add the upload key's too for internal builds).
4. Test with a link on a signed device build (not the simulator) — roadmap 09/19.

Result: `https://<domain>/…` links open the app; others stay in the browser (the deep-link pipeline checks the domain list).

### Step 5 · iOS: account, app record, signing, push

1. Finish the Apple Developer enrollment (organization: D-U-N-S first).
2. In App Store Connect, create the app with the **bundle id from step 1**, primary language, SKU.
3. Signing: let EAS manage it — the first `eas build -p ios` creates the **distribution certificate** and **provisioning profile** in your Apple account (you sign in once). Register internal-test iPhones with `eas device:create` for ad-hoc builds; TestFlight needs no device list.
4. Push notifications: create an **APNs auth key** (`.p8`) in the Apple developer portal (Keys) and give it to EAS (`eas credentials`). One key covers all your apps; it doesn't expire, but keep it secret.
5. Automated submit: create an **App Store Connect API key** (Users and Access › Integrations) with the App Manager role and add it to EAS for `eas submit`.
6. Fill in, in App Store Connect: privacy policy URL, App Privacy labels (from the data inventory, security SEC-10/17), age rating, export compliance (the app uses only standard HTTPS — declare it, or set `ITSAppUsesNonExemptEncryption` in `app.config.ts`).

Result: `yarn eas build -p ios --profile production --auto-submit` lands a build in TestFlight.

### Step 6 · Android: account, signing, push

1. Finish Play Console registration and identity verification; create the app with the **package name = bundle id**.
2. Signing: the first `eas build -p android` creates an **upload keystore** (EAS stores it). Enroll in **Play App Signing** (default for new apps): Google holds the app signing key, you hold the upload key. **Download a backup of the upload keystore** (`eas credentials`) into the company password manager — if it's lost, Google can reset it, but only through support.
3. Upload the **first AAB manually** in Play Console (internal testing track) — the API can't create the first release.
4. Automated submit: a **Google Cloud service account** with Play Console access (Users and permissions), its JSON key added to EAS for `eas submit`.
5. Push: a Firebase project with the Android app → `google-services.json` (path set in `app.config.ts` › `android.googleServicesFile`) and an **FCM V1 service account key** uploaded to EAS for push delivery.
6. Fill in: Data safety form, content rating questionnaire, target audience, ads declaration, privacy policy URL. New personal accounts: run the closed test before production.
7. Copy the app signing key's SHA-256 (Play Console › App signing) into `assetlinks.json` (step 4).

Result: `yarn eas build -p android --profile production --auto-submit` lands a build in the internal track.

### Step 7 · Web

1. The web build has server output (API routes): deploy with **EAS Hosting** (`yarn web:build`, then `eas deploy`), or another host with an Expo server adapter — see [Web app](../src/features/web-app/index.md).
2. Point the domain (or a subdomain) at it; HTTPS is required for the installable web app.
3. Add the security headers (security SEC-05).
4. For a native release build to reach the app's own `/api/*` routes, set the `expo-router` plugin `origin` to the deployed URL.

Result: the installable web app at your domain, with its API routes.

### Step 8 · Security and privacy

1. Do **Phase 1** of the [security plan](security/plan.md#work-plan) before the first public build; Phase 2 before real accounts.
2. Write and host: **privacy policy**, **terms of service**, and a support page — both stores require the privacy policy URL.
3. If users can create accounts, **in-app account deletion** is required by Apple and expected by Google (with a web deletion page for Play).
4. Fill in the data inventory and threat model (SEC-17) — the store privacy answers come from it.

### Step 9 · CI and release

1. GitHub: add `EXPO_TOKEN` (an Expo **robot** token, not a personal one) as a secret in a protected `production` environment; preview gets its own environment and token.
2. Turn on the workflow triggers when ready (each workflow's header says how) and make `Code quality / *` required on `main`.
3. Release flow: the **Release** workflow (`.github/workflows/release.yml`, [how it works](getting-started.md#releasing)) already has the form, checks and jobs — a placeholder until its steps call EAS. Wire them up with `eas.json` profiles named `<environment>-<distribution>` (e.g. `production-store`), then: internal builds for the team → testing (TestFlight and Play internal) → store, with a phased rollout.
4. Over-the-air JS updates (EAS Update) only with a runtime-version policy, so an update never reaches a binary that can't run it.

### Step 10 · Store listings

|              | App Store                                               | Google Play                         |
| ------------ | ------------------------------------------------------- | ----------------------------------- |
| Screenshots  | iPhone 6.9" (and iPad if supported)                     | Phone (+ tablet if supported)       |
| Text         | Name, subtitle, description, keywords, promotional text | Title, short + full description     |
| Graphics     | App icon (from `yarn brand`)                            | Icon 512², feature graphic 1024×500 |
| URLs         | Support, marketing, privacy policy                      | Privacy policy, website, email      |
| Review notes | A demo account if the app needs sign-in                 | The same, under App access          |

Run the E2E flows (`yarn e2e:*`) and the signed-device checklist (roadmap 19) on the release candidate before submitting.

### Step 11 · Operate

- **Monitoring**: crash and error reporting (`expo-observe` is installed) with personal data scrubbed (SEC-10).
- **Support**: the support mailbox, a response target, and how support escalates to engineering.
- **Incidents**: the runbook (SEC-18) — who's on call, how to pause a rollout, how to rotate each credential below.
- **Renewals** (calendar them): Apple program yearly, domain yearly, Apple distribution certificate and provisioning profiles yearly (EAS renews on the next build), store policy deadlines (the yearly minimum Xcode / target-SDK requirements).

---

## Credentials and where they live

The single list of secrets the product depends on. Nothing here goes in the repository or in an `EXPO_PUBLIC_*` variable. How to create the store ones, step by step: [Store credentials](store-credentials.md).

| Credential                                             | Created in                       | Stored in                                                                                | Used by                   | Expires / rotate                           | Owner |
| ------------------------------------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------ | ----- |
| Apple Developer account (2 admins)                     | Apple                            | Password manager + 2FA                                                                   | Everything iOS            | Program renews yearly                      |       |
| Apple distribution certificate + provisioning profiles | EAS (in your Apple account)      | EAS credentials                                                                          | iOS builds                | 1 year; EAS regenerates                    |       |
| APNs auth key (`.p8`)                                  | Apple developer portal › Keys    | EAS credentials + password manager                                                       | iOS push                  | No expiry; rotate if leaked (max 2 keys)   |       |
| App Store Connect API key                              | App Store Connect › Integrations | EAS credentials                                                                          | `eas submit` (iOS)        | Until revoked; rotate yearly               |       |
| Android upload keystore                                | EAS                              | EAS credentials + **backup** in password manager                                         | Android builds            | Long-lived; reset via Play support if lost |       |
| App signing key                                        | Google (Play App Signing)        | Google                                                                                   | Store distribution        | Managed by Google                          |       |
| Play service account JSON                              | Google Cloud › IAM               | EAS credentials                                                                          | `eas submit` (Android)    | Rotate yearly                              |       |
| FCM V1 service account key + `google-services.json`    | Firebase                         | EAS credentials; `google-services.json` in the repo is not secret but is per-environment | Android push              | Rotate the key yearly                      |       |
| `EXPO_TOKEN` (robot)                                   | expo.dev › Access tokens         | GitHub environment secret                                                                | CI builds, submit, deploy | Rotate yearly / on staff change            |       |
| Domain registrar + DNS                                 | Registrar                        | Password manager + 2FA                                                                   | Website, links, email     | Renew yearly (auto-renew on)               |       |
| Map tiles key (optional)                               | Provider                         | `.env` (public by design; restrict on the provider)                                      | Maps                      | Rotate if abused                           |       |
| Backend secrets                                        | Backend                          | Backend's secret store                                                                   | API                       | Backend policy                             |       |

## Keeping this guide up to date

- **Any change that adds an account, a credential, a paid service or a store requirement updates this page in the same pull request** — usually a row in [Accounts](#2-accounts) or [Credentials](#credentials-and-where-they-live) and a line in the step that uses it.
- Review the whole guide before each store release and at least quarterly (roadmap 20.3): prices, store rules, renewals, owners. Update the "Last reviewed" date at the top.
- Fill the **Owner** column with a role or person; an empty owner is an open action.

[← Documentation](index.md)

# Store credentials

Where to get every credential, certificate and service account the store apps
need, step by step. The examples assume one store app per EAS environment:

| Store app        | EAS environment | Build profile |
| ---------------- | --------------- | ------------- |
| `<App Name> DEV` | `development`   | `development` |
| `<App Name> STG` | `preview`       | `preview`     |
| `<App Name>`     | `production`    | `production`  |

Each app's name and bundle id come from that environment's
`EXPO_PUBLIC_APP_NAME` and `EXPO_PUBLIC_APP_BUNDLE_ID` (see
[App environments and builds](development-builds.md)). Steps marked
**per app** are repeated for each store app; the rest are done once.

In every `yarn eas credentials` menu, pick the app's profile (`development`, `preview` or `production`) and
check that the bundle id it shows is that app's before confirming.

## 1. Apple: App Store Connect API key (once)

Lets EAS create certificates and profiles, and `eas submit` upload to TestFlight.
One team key covers every app.

1. [App Store Connect](https://appstoreconnect.apple.com) › **Users and Access** ›
   **Integrations** › **App Store Connect API** › **Team Keys**.
2. **+**, name it (for example "EAS"), role **App Manager**, **Generate**.
3. Download the `AuthKey_<KEY_ID>.p8`. Apple allows one download only: put it in
   the password manager.
4. Note the **Key ID** (on the key's row) and the **Issuer ID** (above the table).
5. Run `yarn eas credentials -p ios` › the app's profile ›
   **App Store Connect: Manage your API Key** › **Set up your project to use an
   API Key for EAS Submit** › **Add a new ASC API Key**, with the `.p8` path, Key
   ID and Issuer ID. For the other apps, pick their profiles and choose the
   existing key.

Alternatively, let EAS generate the key from the same menu after signing in with
an Apple ID.

## 2. Apple: app records (per app)

1. [Apple Developer](https://developer.apple.com/account) › **Certificates,
   Identifiers & Profiles** › **Identifiers**: the app's bundle id. EAS registers
   it on the first build if it's missing.
2. App Store Connect › **Apps** › **+** › **New App** with that bundle id. Open it ›
   **App Information** and copy the **Apple ID** (a number): the app's `ascAppId`
   for submissions.

## 3. Apple: distribution certificate and provisioning profile (per app, by EAS)

Nothing to do in the Apple portal. Run the app's first iOS build in a terminal:

```sh
yarn eas build --profile <env> --platform ios
```

Sign in with an Apple ID when asked (or use the key from step 1) and answer
**Yes** to generating a distribution certificate and an App Store provisioning
profile. The team shares one distribution certificate; each app gets its own
profile. Review them with `yarn eas credentials -p ios` or on
[expo.dev](https://expo.dev) › project › **Credentials**.

## 4. Android: upload keystore (per app, by EAS)

Run the app's first Android build:

```sh
yarn eas build --profile <env> --platform android
```

Answer **Yes** to "Generate a new Android Keystore?". EAS stores it under the
app's package name. With Play App Signing (the default for new apps) it is the
upload key, and Google holds the app signing key. Download a backup with
`yarn eas credentials -p android` into the password manager.

## 5. Google: Play service account (once, plus access per app)

Lets `eas submit` upload to the internal track. One service account can serve
every app.

1. [Google Cloud Console](https://console.cloud.google.com): pick or create a
   project › **APIs & Services** › **Library** › enable **Google Play Android
   Developer API**.
2. **IAM & Admin** › **Service Accounts** › **Create service account** (for example
   "eas-submit"). It needs no Cloud roles.
3. The service account › **Keys** › **Add key** › **Create new key** › **JSON**.
   Keep the file in the password manager; never commit it.
4. [Play Console](https://play.google.com/console) › **Users and permissions** ›
   **Invite new users** with the service account's email. Under **App
   permissions**, add every app and grant at least releasing to testing tracks
   and managing testing tracks. Send the invite.
5. **Per app:** `yarn eas credentials -p android` › the app's profile ›
   **Google Service Account** › **Manage your Google Service Account Key for Play
   Store Submissions** › upload the JSON the first time, then select the
   existing key for the other apps.

## 6. Google: first upload (per app, by hand once)

Google's API can't create an app's first release, so `eas submit` fails until one
build has been uploaded by hand.

1. Download the AAB from step 4 on [expo.dev](https://expo.dev) › project ›
   **Builds**.
2. Play Console › the app › **Test and release** › **Testing** › **Internal
   testing** › **Create new release** › upload the AAB › save and roll out.
3. Add testers under **Internal testing** › **Testers**.

From then on `--auto-submit-with-profile` or `yarn eas submit` works for the app.

## 7. TestFlight testers (per app)

App Store Connect › the app › **TestFlight** › **Internal Testing**: create a
group and add team members. Internal testers get each processed build.

## Later: push notifications

Needed only once the app requests push tokens.

- **APNs key (once per team):** `yarn eas credentials -p ios` › **Push
  Notifications: Manage your Apple Push Notifications Key** › let EAS create it.
  Or create it in Apple Developer › **Keys** › **+** › **Apple Push Notifications
  service (APNs)** and upload the `.p8`.
- **FCM V1 (per app):** in the [Firebase console](https://console.firebase.google.com),
  add each Android app to a Firebase project and download its
  `google-services.json` (set through `android.googleServicesFile` in
  `app.config.ts`). Then **Project settings** › **Service accounts** › **Generate
  new private key**, and upload it with `yarn eas credentials -p android` ›
  **Google Service Account** › **Manage your FCM V1 service account key**.

Where each credential is kept and when it expires:
[credentials table](product-guide.md#credentials-and-where-they-live).

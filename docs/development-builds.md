# App environments and builds

App identity and native settings are resolved by `app.config.ts` from environment
variables: it reads `.env.local` and `.env` itself, under whatever the shell, CI or
EAS Build sets, so `expo export`, EAS CLI and the dev server all see the same
config. `eas.json` only says which build types exist and which EAS environment
each one uses. Expo requires that file for EAS Build and Submit (`app.config.ts`
can't hold build profiles, and `eas build` has no `--environment` flag), so it is
committed and static: no app values in it, nothing generated.

## Environment configuration

Copy generic `.env.example` to ignored `.env` and fill in the target app's values.
Keep actual names, account IDs, bundle IDs and project IDs in local configuration
and hosted environment variables, rather than committed workflows or templates.
`yarn brand` updates visual assets and initializes a missing `.env` from the
generic example, leaving existing configuration unchanged. `assets/brand/brand.json`
holds only how the app looks — colours, palette, map provider; nothing in it
identifies the app.

Manage app settings in the selected **Expo project environment** using Sensitive
or Plain text visibility. Secret visibility cannot be pulled to CI or local tools:

| Expo variable                  | Purpose                                                                |
| ------------------------------ | ---------------------------------------------------------------------- |
| `EXPO_PUBLIC_APP_NAME`         | Installed app display name                                             |
| `EXPO_PUBLIC_APP_SLUG`         | Existing Expo project slug                                             |
| `EXPO_PUBLIC_APP_SCHEME`       | App-specific URL scheme                                                |
| `EXPO_PUBLIC_APP_BUNDLE_ID`    | iOS bundle identifier and Android package                              |
| `EXPO_PUBLIC_API_URL`          | Optional environment-specific backend                                  |
| `EXPO_PUBLIC_APP_LINK_DOMAINS` | Optional comma-separated app-link domains                              |
| `APP_STORE_CONNECT_ID`         | Optional numeric App Store Connect app ID; required for iOS submission |

Create a **GitHub Environment** when each app environment is ready. It needs only:

| GitHub setting               | Type   | Purpose                                               |
| ---------------------------- | ------ | ----------------------------------------------------- |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | Secret | Existing Expo project UUID                            |
| `EXPO_TOKEN`                 | Secret | Expo access token with access to the selected project |

App settings do not need to be duplicated in GitHub. The workflow first looks up
the linked project's metadata using its ID, then runs `eas env:pull` in a temporary
static project. This avoids needing the app's identity before it can be pulled.
It validates the selected project/slug, resolves the owning account automatically,
and imports only the app and submission settings above. Pulled values cannot replace GitHub credentials or bootstrap project IDs.
The temporary project is removed after use. The resolved owner is written as
`EXPO_OWNER` in `.env.local` and passed to CI steps/builds automatically; do not
configure it in GitHub, Expo environment variables or local `.env`.

The result is written to ignored `.env.local` and exported to later CI steps,
with non-empty values masked in workflow logs; the web manifest is regenerated
with the pulled name. The workflow pulls before quality checks and builds. `.env`
keeps local project bootstrap settings.

Locally, configure `EXPO_PUBLIC_EAS_PROJECT_ID` in `.env`, provide `EXPO_TOKEN`
in the shell, then run `yarn env:pull --environment development`. This replaces
`.env.local` with the selected Expo app/submission settings. `app.config.ts` reads `.env.local` over
`.env`, so the pulled values win. Pull again when changing projects or environments.
`APP_STORE_CONNECT_ID` is pulled from Expo using Sensitive or Plain text visibility
and is the iOS submission destination. eas-cli reads `ascAppId` only from the
eas.json submit profile, so the workflow writes it into the selected
environment's profile just before building; the committed eas.json has none.
Locally, `--auto-submit` asks for the app interactively, or add
`"ios": { "ascAppId": "<Apple ID>" }` to the profile without committing it. It does not use an `EXPO_PUBLIC_`
prefix and is not forwarded into native app configuration. The workflow validates
its presence only when submitting an iOS build.

Name GitHub Environments `development`, `preview` or `production` to match EAS's
variable sets. Each has one build profile and one submit profile of the same
name; the workflow builds and submits `$TARGET_ENVIRONMENT`. No
environment-selector variable is stored.

Native colors and map provider settings belong to `assets/brand/brand.json`.
Public app settings and brand/provider URLs ship in the application. Use distinct
native identities and store records for apps that must coexist. Only configure
additional hosted environments when those apps are ready.

## Build profiles

One profile per store app, each a store build submitted to internal testing:

| Profile       | EAS environment | Store app        | Submits to                         |
| ------------- | --------------- | ---------------- | ---------------------------------- |
| `development` | `development`   | `<App Name> DEV` | TestFlight / Play internal (draft) |
| `preview`     | `preview`       | `<App Name> STG` | TestFlight / Play internal (draft) |
| `production`  | `production`    | `<App Name>`     | TestFlight / Play internal (draft) |

EAS Build injects that environment's variables on
the build worker, and its `EAS_BUILD_PROJECT_ID` links the config to the project there.
For EAS Observe in those builds, also add `EXPO_PUBLIC_EAS_PROJECT_ID` (Plain text) to
each EAS environment: the app reads it through `@/constants/env`, and only
`EXPO_PUBLIC_` values reach the bundle.
Build and submit locally with
`yarn eas build --profile development --platform all --auto-submit` (`yarn eas`
is the pinned EAS CLI; `--auto-submit` uses the submit profile of the same name).
Dev clients and simulator builds don't need EAS: `yarn ios` / `yarn android`.
`yarn eas credentials` manages signing credentials for the project in `.env`.
Remote build numbers increment for release builds.

The manual **App build** workflow runs **Verify** (lint, types and tests, each
its own step) and then one **Build iOS** / **Build Android** job per platform,
side by side, so each has its own log and re-run and one failing doesn't stop
the other. Each build job starts the EAS build for the selected environment and
links it in its job summary.
By default it doesn't wait: builds are queued with `--no-wait`, so the job ends
in minutes however long the EAS queue is (free tier). Tick **Wait for the EAS
builds** to keep the job running until they finish and fail it if one does.
**Submit** (on by default) passes `--auto-submit`: EAS submits each build with
the submit profile of the same name once the build succeeds, so it works
without waiting; the submission's status is on the build page. Builds do not
run automatically on pushes. Store promotion and OTA publishing are not
configured.

## Signing and store setup

Run an initial interactive build for each platform and distribution type you
will use to configure remote signing credentials. Configure submission credentials
in EAS: an App Store Connect API key and a Google service account with access
to the selected store app. Never commit private keys. Step by step, for every app:
[Store credentials](store-credentials.md).

Every profile is a store build, so testers install through TestFlight and Play
internal testing; no device registration is needed.

Google requires the first Android upload to be performed manually in Play Console
before API submissions. Finish required store and tester setup. Submissions use
the internal track with draft release status; review and roll out in Play Console.
Apple/Google processing and tester setup can still be required after submission.

References: [SDK 57 app configuration](https://docs.expo.dev/versions/v57.0.0/config/app/),
[EAS Build configuration](https://docs.expo.dev/build/eas-json/),
[EAS profile reference](https://docs.expo.dev/eas/json/),
[EAS environment pull](https://docs.expo.dev/eas/cli/#eas-envpull-environment).

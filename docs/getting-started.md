[Docs](index.md)

# Getting started

> Install, configure the environment, run the app, and the everyday scripts, Storybook and git hooks.

**On this page**

- [Get started](#get-started)
- [Scripts](#scripts)
- [Storybook](#storybook)
- [Git hooks](#git-hooks)

---

## Get started

1. Install dependencies

   ```bash
   yarn install
   ```

2. Environment variables and brand

   `yarn install` already created `.env` from `.env.example` (placeholders that run as-is) and applied the brand in `assets/brand` (its postinstall runs `yarn brand`). Pull an EAS environment's identity and backend into `.env.local` as described in [App builds](development-builds.md). After changing anything in `assets/brand`, run the brand again:

   ```bash
   yarn brand
   ```

   See [Brand](../assets/brand/README.md) for colours, palette and maps. The env files — the shell or CI over `.env.local` over `.env` — are read by `app.config.ts` itself (name, slug, scheme, bundle id, link domains, `EXPO_PUBLIC_EAS_PROJECT_ID`, `EXPO_OWNER`) and by the app through [`src/constants/env`](../src/constants/env/index.js). Only `EXPO_PUBLIC_*`-prefixed vars are available at runtime — Metro inlines them into the bundle at build time, so they must be referenced as a static `process.env.EXPO_PUBLIC_X`, never a dynamic key. See the comment in `src/constants/env/index.js` before adding new ones.

   `.env` is yours and never rewritten; `.env.local` is replaced on every `yarn env:pull`. Quote any value with a `#`: an unquoted `#` starts a comment in a `.env` file.

3. Start the app

   ```bash
   yarn web       # browser
   yarn ios       # iOS simulator, real dev client (see caveat below)
   yarn android   # Android emulator, real dev client
   ```

   `yarn start` also works and lets you choose a platform from the Metro CLI (`w`/`i`/`a`), but note it opens **Expo Go** by default, which cannot load native modules like `react-native-mmkv` — use `yarn ios`/`yarn android` (or `expo run:ios`/`expo run:android`) for a real dev-client build instead when you need native storage to work.

   > **iOS build caveat:** building the native dev client currently requires **Xcode 26.4+**. Expo SDK 57's `expo-modules-jsi` fails to compile on Xcode 26.0–26.3 due to a Swift 6.2 C++ interop strictness change ([expo/expo#46242](https://github.com/expo/expo/issues/46242)). Web and Android are unaffected.

---

## Scripts

| Script                            | What it does                                                               |
| --------------------------------- | -------------------------------------------------------------------------- |
| `yarn start`                      | Metro, choose platform interactively (opens Expo Go)                       |
| `yarn web` / `ios` / `android`    | Run on a given platform (ios/android build a real dev client)              |
| `yarn e2e:ios` / `e2e:android`    | Build and install a Release app for end-to-end tests (`EXPO_PUBLIC_E2E=1`) |
| `yarn e2e:test` / `e2e:test:web`  | Run the Maestro flows against the installed app / the web build            |
| `yarn e2e:start` / `e2e:web`      | Dev server with `EXPO_PUBLIC_E2E=1`, to look at what a test run sees       |
| `yarn web:build`                  | Export the web app and API routes into `dist/` (server output)             |
| `yarn native:bundle`              | Build the iOS and Android JS bundles — catches Metro errors on native      |
| `yarn doctor`                     | Expo Doctor: SDK versions, peer dependencies, project setup                |
| `yarn lint`                       | ESLint (`expo lint`)                                                       |
| `yarn typecheck`                  | `tsc --noEmit`                                                             |
| `yarn test`                       | Jest                                                                       |
| `yarn test:coverage`              | Jest with a coverage summary (`coverage/`)                                 |
| `yarn format` / `format:check`    | Prettier write / check                                                     |
| `yarn secrets:check`              | Scan the repo for committed secrets                                        |
| `yarn verify`                     | The fast gates in one go: format, lint, types, secrets, tests              |
| `yarn storybook:native`           | On-device Storybook (Metro, opens on whatever device/emulator you pick)    |
| `yarn storybook:ios` / `:android` | On-device Storybook, direct to one platform                                |
| `yarn storybook:web`              | Web Storybook (Vite) at `localhost:6006`                                   |
| `yarn storybook:web:build`        | Build the web Storybook for static hosting                                 |

---

## Storybook

Two separate setups, both driven by the same `*.stories.tsx` files under `src/`:

- **On-device** (`.rnstorybook/`): `yarn storybook:native` / `:ios` / `:android` sets `STORYBOOK_ENABLED=true`, which makes `metro.config.js` swap the app's entry point for the Storybook UI — the regular `yarn ios`/`yarn android`/`yarn web` builds are unaffected when the flag isn't set.
- **Web** (`.storybook/`): a separate Vite-based build (`@storybook/react-native-web-vite`), since MMKV doesn't exist on web. `.env` is loaded manually here (Vite doesn't do Expo's env inlining) — see the `viteFinal` hook in `.storybook/main.ts`.

---

## Git hooks

Set up via [husky](https://typicode.github.io/husky) + [lint-staged](https://github.com/lint-staged/lint-staged), with the hooks in `.husky/` (installed by the `prepare` script).

- **pre-commit**: formats and lints staged files, and scans staged files for secrets ([secretlint](https://github.com/secretlint/secretlint)).
- **pre-push**: `yarn verify` — format, lint, types, secret scan and tests.

---

## End-to-end tests

[Maestro](https://docs.maestro.dev) flows, run against an app built with `EXPO_PUBLIC_E2E=1`. That build holds the app still: English whatever the device language, no Carousel autoplay, no dev menu or LogBox — see `isE2E` in [Utilities](../src/utils/index.md).

**One flow per journey, for every platform.** `.maestro/flows/` holds the flows; `.maestro/subflows/` holds steps they share through `runFlow`. The same file runs on iOS, Android and web:

- **Selectors are unified.** Select by `id:` — a component's `testID` — and by English text for what the user reads. Every component has a **default id** (`screen`, `carousel`, `toast`, …) and builds its parts from it with `testId()` from `@/utils` (`screen.header`, `carousel.dot.2`, `toasts.<id>.close`); passing `testID` only renames the prefix, so it's never required. Two un-named instances of a component share their default id — give one a `testID` when a flow needs to tell them apart. Lint keeps it that way: a string or template literal in a component's `testID` is an error.
- **Web is made to behave like the phones.** An E2E web build (`src/root/e2e-page`) copies each `data-testid` into the element's `id` — Maestro's web driver reads `id`, then `aria-label`, and `data-testid` last — and lets the page itself scroll, since Maestro scrolls the browser window rather than the app's ScrollView.
- **Prefer actions every platform has.** Maestro can't drive a pan gesture in the browser, so a flow moves a Carousel with its dots, which are the buttons a keyboard or screen-reader user has too. A step that only makes sense on touch (a swipe) goes in a subflow called under `when: platform: iOS` / `Android`.
- **One header, swapped for web.** Flows start with `appId: ${APP_ID}`; Maestro only drives a browser for `url:`, so `yarn e2e:test:web` writes a copy of each flow with that one line swapped into the gitignored `.maestro/.web/`.

```bash
# iOS / Android: build + install a Release E2E app on the running simulator/emulator, then run
yarn e2e:ios          # or: yarn e2e:android
yarn e2e:test         # extra args go to Maestro, e.g. --include-tags smoke

# Web: E2E dev server, then the same flows in headless Chromium
yarn e2e:web
yarn e2e:test:web     # WEB_URL=… to point it elsewhere (CI uses the production export)
```

- **Release on mobile, rebuilt only when native code changes.** `yarn e2e:ios` / `yarn e2e:android` build the `e2e` profile through [scripts/native](../scripts/native/README.md): a binary is cached per native fingerprint, and while the fingerprint is unchanged the current JS is repacked into it (about 40s) instead of building. `--rebuild` forces a full build; `--device <name>` picks the simulator / emulator when several are running. There's no dev-client launcher to get past and nothing reloads mid-run.
- **`yarn e2e:test` picks the device** when exactly one is running (one booted simulator, no Android device); otherwise pass `--device <id>`.
- **CI:** the **Regression** workflow (manual for now) runs the flows on iOS, Android and web, one job each. Each job restores its binary through the `native-app` action (`.github/actions/native-app`), so most runs repack instead of building; a full iOS build (about 55 minutes cold) gets ccache and CocoaPods caches, a full Android build Gradle's. When a flow fails, the job uploads `e2e-output/`: a screenshot of each step up to the failure, the view hierarchy, Maestro's log and a junit report — the same folder every local run writes.

---

## CI

GitHub Actions, in `.github/`. **Every workflow is manual for now** (Actions tab → Run workflow); each file's header says which trigger to add to make it automatic.

| Workflow              | File                              | Jobs                                                                                                                                                                                                                                                                        |
| --------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Code quality**      | `workflows/code-quality.yml`      | Formatting · Lint · Types · Unit tests (coverage in the job summary) · Secret scan · Expo Doctor · Web build · Native bundles · Storybook build · Dependency review · CodeQL (JavaScript/TypeScript, workflows)                                                             |
| **Regression**        | `workflows/regression.yml`        | iOS · Android · Web — the user flows in `.maestro/flows`, end to end on Release builds; screenshots, logs and report uploaded on failure. Pick the platform (`all`, `native` = iOS + Android, or one of `ios` / `android` / `web`), and which flows by tag, when you run it |
| **Component library** | `workflows/component-library.yml` | Code quality → Build → Publish the web Storybook to GitHub Pages                                                                                                                                                                                                            |
| **App build**         | `workflows/release.yml`           | Verify → Build iOS · Build Android, each build job starting its EAS build (and auto-submit) and linking it in the summary. See [App builds](development-builds.md)                                                                                                          |
| **Pull request**      | `workflows/pull-request.yml`      | Title format — `type: 'Message'`, the house commit style, since a squash merge makes the title the commit                                                                                                                                                                   |
| Dependabot            | `dependabot.yml`                  | Weekly grouped updates for actions and npm, Expo SDK packages excluded. Paused (`open-pull-requests-limit: 0`)                                                                                                                                                              |

- **Checks run as separate jobs** so a pull request lists each by name ("Code quality / Lint", "Regression / iOS") and branch protection can require the ones that matter.
- **CodeQL runs inside Code quality**, so security findings come with the rest. GitHub's CodeQL _default setup_ has to be off (Settings → Code security → CodeQL analysis) — it refuses results from both; findings show in the Security tab.
- **The same commands run locally.** Every job is one `yarn` script from the table above, set up by `.github/actions/setup` (Node from `.nvmrc`, frozen-lockfile install).
- **One summary shape.** Jobs write their run-page summary through `.github/actions/summary` (title, status, a table of fields, notes); scripts in `scripts/ci` only compute the values, so test coverage, the App build plan and each build link read the same.
- **Hardened by default.** Read-only token unless a job needs more, a timeout on every job, superseded runs cancelled, and third-party actions pinned to commit SHAs (the version in a comment beside each).
- **Dependency review** needs the repository's dependency graph turned on (Settings → Code security).

### Releasing

**Release** (Actions → Release → Run workflow) is one form for every way the app ships, from a QA build to a store submission:

| Field              | Options (default **bold**)                                       | Meaning                                                                                                                                                                                                                        |
| ------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Release type       | **Build** · Update                                               | **Build** produces a new app binary — required whenever native code, config or permissions change. **Update** ships JavaScript and assets over the air to builds already installed: minutes, no store review, same native code |
| Platform           | **All platforms** · Native (iOS + Android) · iOS · Android · Web | Updates skip web — a web release is always a build                                                                                                                                                                             |
| Environment        | development · **staging** · production                           | Backend, config and secrets. Each job runs in the GitHub Environment of that name                                                                                                                                              |
| Distribution       | **Internal** · Testing · Store                                   | Internal = install link for the team / web preview · Testing = TestFlight, Google Play internal testing · Store = App Store and Google Play review / live website. Builds only                                                 |
| Version            | empty = the current app version                                  | Semantic version, e.g. `1.4.0` or `1.4.0-rc.1`. Builds only                                                                                                                                                                    |
| Release notes      |                                                                  | Shown to testers and in the run summary                                                                                                                                                                                        |
| Run quality checks | **on**                                                           | Code quality first                                                                                                                                                                                                             |

GitHub shows only the input id under a field, so each option carries its own explanation ("Build — new app binary, required for native changes"); the Plan job reads the first word.

- **Plan fails fast** on a combination that can't ship — a store release from anything but production, an update to web, testing on web, a version that isn't semver — before anything builds. Its summary says what will go where.
- **The run's name is the release**: "Release 1.4.0 · production · store", "Update · staging", so the Actions list reads as a release history.
- **One release per environment at a time**, never cancelled halfway.
- **Production approvals**: give the `production` environment required reviewers (Settings → Environments) and every production job waits for a click. `EXPO_TOKEN` and store keys go in each environment's secrets, not the repository's.
- **Still a placeholder**: Build, Distribute and Publish update print the `eas build` / `eas submit` / `eas update` / `eas deploy` command they will run. Making them real needs the EAS project, the `eas.json` profiles (one per environment) and the credentials in the [product guide](product-guide.md#step-9--ci-and-release).

---

[Docs index](index.md) · [Architecture](architecture.md) →

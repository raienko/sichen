[Docs](../../docs/index.md) › Native builds

# Native builds: fingerprint, cache, repack

> Produces the iOS / Android app for a **build profile**, rebuilding native code only when it changed. Otherwise the current JavaScript is repacked into the cached binary — about 40 seconds instead of minutes locally or ~55 minutes on CI. Used by the E2E runs today; built to be used by anything that needs an app binary.

```bash
node scripts/native/build.mjs ios --profile e2e --install       # = yarn e2e:ios
node scripts/native/build.mjs android --profile e2e --install   # = yarn e2e:android
node scripts/native/build.mjs ios --profile e2e --output build/e2e.app
node scripts/native/build.mjs android --profile e2e --print-fingerprint
```

| Option                | Does                                                                |
| --------------------- | ------------------------------------------------------------------- |
| `--profile <name>`    | Which [profile](profiles.mjs) to build. Required.                   |
| `--install`           | Install on the running simulator / emulator                         |
| `--device <name\|id>` | Pick the simulator / emulator when several are running              |
| `--output <path>`     | Also copy the resulting `.app` / `.apk` there                       |
| `--rebuild`           | Ignore the cache and build in full                                  |
| `--print-fingerprint` | Print the native fingerprint and exit — what CI caches are keyed on |
| anything else         | Passed to `expo run:<platform>` on a full build                     |

## How it works

1. **Fingerprint.** `@expo/fingerprint` hashes everything that reaches the native binary for the platform — native packages and versions, app config, config plugins, patches — with the profile's env applied. [`fingerprint.config.js`](../../fingerprint.config.js) says what doesn't count (the generated `ios/` / `android/`, build output inside `node_modules`, package scripts).
2. **Cache.** `.native-cache/<platform>/<profile>/` (gitignored) keeps the last two binaries: `<hash>/<Name>.app` on iOS, `<hash>-<abi>.apk` on Android.
3. **Hit → repack.** [`@expo/repack-app`](https://www.npmjs.com/package/@expo/repack-app) bundles this checkout's JS and assets (Hermes bytecode, the profile's `EXPO_PUBLIC_*` values inlined) and swaps them into the cached binary. Android APKs are re-signed with a local test key (`.native-cache/repack.keystore`), so an existing install is replaced.
4. **Miss → full build.** `expo run:<platform>` with the profile's configuration; Android compiles only the target device's CPU architecture; iOS compiles through ccache when it's installed. The result is cached for next time.

The building blocks are exported from [`index.mjs`](index.mjs) — `nativeFingerprint`, `cachedBinary` / `storeBinary`, `repackIos` / `repackAndroid`, `buildIos` / `buildAndroid`, `iosSimulator` / `androidDevice` / `installIos` / `installAndroid` — for a script that needs a different flow.

## Adding a profile

Add an entry to [`profiles.mjs`](profiles.mjs):

```js
preview: {
  description: "Release build for testers, pointed at the staging API",
  env: { EXPO_PUBLIC_API_URL: "https://staging.api.example.com" },
  ios: { configuration: "Release" },
  android: { variant: "release" },
},
```

Every command above then works with `--profile preview`, with its own cache. Repacking needs the JS embedded in the binary, so profiles build Release / release.

## In CI

The [`native-app`](../../.github/actions/native-app/action.yml) composite action is the CI half: it fingerprints, restores `.native-cache/<platform>/<profile>` for that hash, and on a miss restores what speeds up a full build (ccache + CocoaPods on iOS, Gradle on Android). A new workflow needs two steps:

```yaml
- uses: ./.github/actions/native-app
  with:
    platform: ios
    profile: preview
- run: node scripts/native/build.mjs ios --profile preview --output dist/preview.app
```

The binary is saved to the cache when the job ends, so the next run with the same native code repacks. The Regression workflow (`.github/workflows/regression.yml`) is the working example.

## Limits

- **Simulator / emulator builds only, for now.** Device and store builds need signing (Apple certificates, the Android upload key — see the [product guide](../../docs/product-guide.md#credentials-and-where-they-live)) and come from EAS Build. `repackAndroid` accepts real signing options for when that's wired up; iOS device repacking would need `@expo/repack-app`'s signing options too.
- **Native changes always rebuild.** That's the point of the fingerprint: a new native package, a config plugin change or an SDK upgrade can't be repacked.

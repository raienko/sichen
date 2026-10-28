/**
 * Named ways to build the native app. A profile says what the build looks
 * like; scripts/native does the rest — fingerprint, cache, repack, install —
 * the same way for every profile.
 *
 * - `env`: set for the build and the repack, and while fingerprinting, so a
 *   profile that changes app config (another bundle id, say) gets its own
 *   fingerprint. `EXPO_PUBLIC_*` values only reach the JS bundle.
 * - `ios.configuration` / `android.variant`: what `expo run:<platform>`
 *   builds. Repacking needs a build with the JS embedded (Release / release).
 *
 * Add a profile here (a `preview` build for testers, a `screenshots` build
 * for the store) and every command in scripts/native/README.md works with it.
 */
export const PROFILES = {
  e2e: {
    description:
      "Release build for end-to-end tests (EXPO_PUBLIC_E2E=1: English, no autoplay, no dev tooling)",
    env: { EXPO_PUBLIC_E2E: "1" },
    ios: { configuration: "Release" },
    android: { variant: "release" },
  },
};

export function profile(name) {
  const found = PROFILES[name];
  if (!found) {
    throw new Error(
      `Unknown build profile "${name}". Known: ${Object.keys(PROFILES).join(", ")} (scripts/native/profiles.mjs).`,
    );
  }
  return { name, ...found };
}

/**
 * Produces the native app for a build profile — rebuilding only when native
 * code changed, repacking the current JS into the cached binary otherwise.
 *
 *   node scripts/native/build.mjs <ios|android> --profile <name> [options]
 *
 *   --profile <name>      A profile from profiles.mjs (e.g. e2e). Required.
 *   --install             Put it on the running simulator / emulator.
 *   --device <name|id>    Which one, when several are running.
 *   --output <path>       Also copy the resulting .app / .apk here.
 *   --rebuild             Ignore the cache and build in full.
 *   --print-fingerprint   Print the native fingerprint and exit (CI cache keys).
 *
 * Any other argument goes to `expo run:<platform>` on a full build. See
 * README.md next to this for how the pieces fit and how to reuse them.
 */
import { cpSync, rmSync } from "node:fs";
import { resolve } from "node:path";

import {
  androidAbi,
  androidDevice,
  buildAndroid,
  buildIos,
  cachedBinary,
  installAndroid,
  installIos,
  iosSimulator,
  log,
  nativeFingerprint,
  repackAndroid,
  repackIos,
  storeBinary,
} from "./index.mjs";
import { profile as loadProfile } from "./profiles.mjs";

const [platform, ...rest] = process.argv.slice(2);
const flags = new Set(["--install", "--rebuild", "--print-fingerprint"]);
const valued = new Set(["--profile", "--device", "-d", "--output"]);

const options = {};
const runArgs = [];
for (let i = 0; i < rest.length; i += 1) {
  const arg = rest[i];
  if (flags.has(arg)) options[arg.slice(2)] = true;
  else if (valued.has(arg)) {
    options[arg === "-d" ? "device" : arg.slice(2)] = rest[i + 1];
    // expo run:<platform> takes --device too, for a full build.
    if (arg === "--device" || arg === "-d") runArgs.push(arg, rest[i + 1]);
    i += 1;
  } else runArgs.push(arg);
}

if ((platform !== "ios" && platform !== "android") || !options.profile) {
  console.error(
    "Usage: node scripts/native/build.mjs <ios|android> --profile <name> [--install] [--device <name>] [--output <path>] [--rebuild] [--print-fingerprint]",
  );
  process.exit(1);
}

let profile;
try {
  profile = loadProfile(options.profile);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
const hash = await nativeFingerprint(platform, profile);
if (options["print-fingerprint"]) {
  console.log(hash);
  process.exit(0);
}
const short = hash.slice(0, 10);

let binary;
if (platform === "ios") {
  const simulator = iosSimulator(options.device);
  if (options.install && !simulator) {
    console.error("Boot one simulator, or pass --device <name> to pick one.");
    process.exit(1);
  }
  const cached = !options.rebuild && cachedBinary("ios", profile, hash);
  if (cached) {
    log(
      `[${profile.name}] native code unchanged (${short}) — repacking the cached app with this checkout's JS`,
    );
    binary = await repackIos(profile, cached);
    if (options.install) installIos(simulator, binary);
  } else {
    log(
      `[${profile.name}] ${options.rebuild ? "full build (--rebuild)" : `no cached app for ${short} — full build`}`,
    );
    binary = storeBinary(
      "ios",
      profile,
      hash,
      undefined,
      buildIos(profile, runArgs),
    );
    log(`Cached for ${short}`);
  }
} else {
  const serial = androidDevice(options.device);
  if (options.install && !serial) {
    console.error("Start one emulator, or pass --device <name> to pick one.");
    process.exit(1);
  }
  // One CPU architecture when a device says which; every one otherwise.
  const abi = androidAbi(serial);
  const variant = abi || "all";
  const cached =
    !options.rebuild && cachedBinary("android", profile, hash, variant);
  if (cached) {
    log(
      `[${profile.name}] native code unchanged (${short}) — repacking the cached APK with this checkout's JS`,
    );
    binary = await repackAndroid(profile, cached);
    if (options.install) installAndroid(serial, binary);
  } else {
    log(
      `[${profile.name}] ${options.rebuild ? "full build (--rebuild)" : `no cached APK for ${short} — full build`}` +
        (abi ? ` for ${abi} only` : " for every architecture"),
    );
    binary = storeBinary(
      "android",
      profile,
      hash,
      variant,
      buildAndroid(profile, abi, runArgs),
    );
    log(`Cached for ${short} (${variant})`);
  }
}

if (options.output) {
  const target = resolve(options.output);
  rmSync(target, { recursive: true, force: true });
  cpSync(binary, target, { recursive: true });
  log(`Copied to ${options.output}`);
}

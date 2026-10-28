/**
 * Building, caching and repacking the native app — the pieces behind
 * `node scripts/native/build.mjs`, importable on their own by any other
 * script (an E2E run, a preview build, store screenshots).
 *
 * The idea: a native build is slow and its inputs rarely change, the JS
 * changes all the time. So a binary is kept per native fingerprint, and
 * when the fingerprint is unchanged the current JS is repacked into it with
 * @expo/repack-app instead of building again. See README.md next to this.
 */
import { execFileSync, spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

import { createFingerprintAsync } from "@expo/fingerprint";
import { repackAppAndroidAsync, repackAppIosAsync } from "@expo/repack-app";

export const ROOT = process.cwd();
/** Binaries by platform, profile and fingerprint (gitignored). */
export const CACHE = join(ROOT, ".native-cache");
/** Binaries kept per platform and profile — one per recent fingerprint. */
const KEEP = 2;

// ─── helpers ────────────────────────────────────────────────────────────

export function output(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
}

export function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { stdio: "inherit", env });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} exited with ${result.status}`,
    );
  }
}

export function log(message) {
  console.log(`\n› ${message}`);
}

/** process.env with the profile's variables on top. */
export function profileEnv(profile, extra = {}) {
  return { ...process.env, ...profile.env, ...extra };
}

// ─── fingerprint ────────────────────────────────────────────────────────

/**
 * The hash of everything that ends up in the native binary, for one
 * platform and profile (fingerprint.config.js says what counts). Equal
 * hash, interchangeable binary — only the JS can differ.
 */
export async function nativeFingerprint(platform, profile) {
  const saved = { ...process.env };
  Object.assign(process.env, profile.env);
  try {
    const { hash } = await createFingerprintAsync(ROOT, {
      platforms: [platform],
    });
    return hash;
  } finally {
    for (const key of Object.keys(profile.env)) {
      if (key in saved) process.env[key] = saved[key];
      else delete process.env[key];
    }
  }
}

// ─── cache ──────────────────────────────────────────────────────────────

function cacheDir(platform, profile) {
  return join(CACHE, platform, profile.name);
}

/**
 * The cached binary for this fingerprint, if there is one: an `.app` on
 * iOS (kept as <key>/<Name>.app, so the bundle keeps its own name), an
 * `.apk` on Android. `variant` separates builds of one fingerprint that
 * differ otherwise — the Android CPU architecture.
 */
export function cachedBinary(platform, profile, hash, variant) {
  const key = variant ? `${hash}-${variant}` : hash;
  const dir = cacheDir(platform, profile);
  if (platform === "android") {
    const apk = join(dir, `${key}.apk`);
    return existsSync(apk) ? apk : undefined;
  }
  const entry = join(dir, key);
  if (!existsSync(entry)) return undefined;
  const app = readdirSync(entry).find((name) => name.endsWith(".app"));
  return app ? join(entry, app) : undefined;
}

/** Keeps `binary` as the cached build for this fingerprint; returns its new path. */
export function storeBinary(platform, profile, hash, variant, binary) {
  const key = variant ? `${hash}-${variant}` : hash;
  const dir = cacheDir(platform, profile);
  mkdirSync(dir, { recursive: true });
  let stored;
  if (platform === "android") {
    stored = join(dir, `${key}.apk`);
    cpSync(binary, stored);
  } else {
    const entry = join(dir, key);
    rmSync(entry, { recursive: true, force: true });
    mkdirSync(entry, { recursive: true });
    stored = join(entry, basename(binary));
    cpSync(binary, stored, { recursive: true });
  }
  const entries = readdirSync(dir)
    .map((name) => ({
      path: join(dir, name),
      time: statSync(join(dir, name)).mtimeMs,
    }))
    .sort((a, b) => b.time - a.time);
  for (const old of entries.slice(KEEP))
    rmSync(old.path, { recursive: true, force: true });
  return stored;
}

// ─── devices ────────────────────────────────────────────────────────────

/** A booted iOS simulator: the one named / identified, or the only one. */
export function iosSimulator(name) {
  const devices = Object.values(
    JSON.parse(
      output("xcrun", ["simctl", "list", "devices", "booted", "-j"]) || "{}",
    ).devices ?? {},
  ).flat();
  if (name) return devices.find((d) => d.udid === name || d.name === name);
  return devices.length === 1 ? devices[0] : undefined;
}

const adb = (args) => output("adb", args);

/** An Android device's serial: the one named (AVD name or serial), or the only one. */
export function androidDevice(name) {
  const serials = adb(["devices"])
    .split("\n")
    .slice(1)
    .filter((line) => /\tdevice$/.test(line))
    .map((line) => line.split("\t")[0]);
  if (name) {
    return serials.find(
      (serial) =>
        serial === name ||
        adb(["-s", serial, "emu", "avd", "name"]).split("\n")[0]?.trim() ===
          name,
    );
  }
  return serials.length === 1 ? serials[0] : undefined;
}

/** The device's CPU architecture (`arm64-v8a`, `x86_64`), for single-ABI builds. */
export function androidAbi(serial) {
  return serial
    ? adb(["-s", serial, "shell", "getprop", "ro.product.cpu.abi"])
    : "";
}

export function installIos(simulator, app) {
  log(`Installing on ${simulator.name}`);
  run("xcrun", ["simctl", "install", simulator.udid, app]);
}

export function installAndroid(serial, apk) {
  log(`Installing on ${serial}`);
  // A repacked APK is signed with a different key than a full build: an
  // existing install with another signature has to go first.
  const { bundleId } = JSON.parse(
    readFileSync(join(ROOT, "assets/brand/brand.json"), "utf8"),
  );
  adb(["-s", serial, "uninstall", bundleId]);
  run("adb", ["-s", serial, "install", "-r", apk]);
}

// ─── full builds ────────────────────────────────────────────────────────

/** Where `expo run:ios` left the simulator app for this configuration. */
function builtIosApp(configuration) {
  const workspace = readdirSync("ios").find((name) =>
    name.endsWith(".xcworkspace"),
  );
  const settings = output("xcodebuild", [
    "-workspace",
    join("ios", workspace),
    "-scheme",
    workspace.replace(/\.xcworkspace$/, ""),
    "-configuration",
    configuration,
    "-sdk",
    "iphonesimulator",
    "-showBuildSettings",
  ]);
  const value = (key) =>
    new RegExp(`^\\s*${key} = (.+)$`, "m").exec(settings)?.[1];
  return join(value("BUILT_PRODUCTS_DIR"), value("FULL_PRODUCT_NAME"));
}

/**
 * A full simulator build with `expo run:ios` (which also installs it on the
 * booted simulator). Compiles through ccache when it's installed.
 */
export function buildIos(profile, runArgs = []) {
  const configuration = profile.ios.configuration;
  const ccache = Boolean(output("sh", ["-c", "command -v ccache"]));
  run(
    "npx",
    [
      "expo",
      "run:ios",
      "--configuration",
      configuration,
      "--no-bundler",
      ...runArgs,
    ],
    profileEnv(profile, ccache ? { USE_CCACHE: "1" } : {}),
  );
  return builtIosApp(configuration);
}

/**
 * A full build with `expo run:android` (which also installs it), for one
 * CPU architecture when given — the bulk of an Android build otherwise.
 */
export function buildAndroid(profile, abi, runArgs = []) {
  const variant = profile.android.variant;
  run(
    "npx",
    ["expo", "run:android", "--variant", variant, "--no-bundler", ...runArgs],
    profileEnv(profile, {
      // Gradle reads ORG_GRADLE_PROJECT_<name> as the project property
      // <name>, which React Native's build uses to pick architectures.
      ...(abi ? { ORG_GRADLE_PROJECT_reactNativeArchitectures: abi } : {}),
    }),
  );
  return resolve(`android/app/build/outputs/apk/${variant}/app-${variant}.apk`);
}

// ─── repack ─────────────────────────────────────────────────────────────

/** The cached app with this checkout's JS and assets in it; returns the new `.app`. */
export async function repackIos(profile, app) {
  // repack-app takes and returns an .ipa: Payload/<Name>.app, zipped.
  const work = mkdtempSync(join(tmpdir(), "repack-ios-"));
  mkdirSync(join(work, "Payload"));
  cpSync(app, join(work, "Payload", basename(app)), { recursive: true });
  execFileSync("zip", ["-qry", "source.ipa", "Payload"], { cwd: work });
  rmSync(join(work, "Payload"), { recursive: true, force: true });

  await repackAppIosAsync({
    platform: "ios",
    projectRoot: ROOT,
    sourceAppPath: join(work, "source.ipa"),
    outputPath: join(work, "repacked.ipa"),
    workingDirectory: join(work, "repack"),
    env: profileEnv(profile),
  });

  execFileSync("unzip", ["-q", "repacked.ipa", "-d", "out"], { cwd: work });
  const payload = join(work, "out", "Payload");
  return join(
    payload,
    readdirSync(payload).find((name) => name.endsWith(".app")),
  );
}

function buildToolsDir() {
  const sdk =
    process.env.ANDROID_HOME ??
    process.env.ANDROID_SDK_ROOT ??
    join(process.env.HOME, "Library/Android/sdk");
  const dir = join(sdk, "build-tools");
  const versions = readdirSync(dir)
    .filter((name) => /^\d+\.\d+\.\d+$/.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return join(dir, versions[versions.length - 1]);
}

/** A throwaway signing key for repacked test APKs, made once. */
function testKeystore() {
  const path = join(CACHE, "repack.keystore");
  if (!existsSync(path)) {
    mkdirSync(CACHE, { recursive: true });
    run("keytool", [
      "-genkeypair",
      "-keystore",
      path,
      "-storepass",
      "android",
      "-alias",
      "repack",
      "-keypass",
      "android",
      "-keyalg",
      "RSA",
      "-keysize",
      "2048",
      "-validity",
      "10000",
      "-dname",
      "CN=Repack,O=Test,C=US",
    ]);
  }
  return path;
}

/**
 * The cached APK with this checkout's JS and assets in it; returns the new
 * `.apk`. Signed with a local test key unless `signing` (repack-app's
 * androidSigningOptions) says otherwise — a release profile would pass the
 * real upload key here.
 */
export async function repackAndroid(profile, apk, signing) {
  const work = mkdtempSync(join(tmpdir(), "repack-android-"));
  const out = join(work, "repacked.apk");
  await repackAppAndroidAsync({
    platform: "android",
    projectRoot: ROOT,
    sourceAppPath: apk,
    outputPath: out,
    workingDirectory: join(work, "repack"),
    androidBuildToolsDir: buildToolsDir(),
    androidSigningOptions: signing ?? {
      keyStorePath: testKeystore(),
      keyStorePassword: "pass:android",
      keyAlias: "repack",
      keyPassword: "pass:android",
    },
    env: profileEnv(profile),
  });
  return out;
}

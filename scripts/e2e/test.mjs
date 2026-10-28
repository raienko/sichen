/**
 * Runs every Maestro flow in .maestro against the app installed on the
 * booted simulator or emulator — build it first with `yarn e2e:ios` or
 * `yarn e2e:android`. The app id comes from .env (written by `yarn brand`),
 * so the flows work for any brand; extra arguments go straight to Maestro:
 *
 *   yarn e2e:test --include-tags smoke
 *
 * Every run writes e2e-output/ — a junit report, and per flow the
 * screenshots, view hierarchy and log up to where it stopped (what CI
 * uploads when a run fails). It's cleared at the start of each run.
 *
 * `--web` (`yarn e2e:test:web`) runs the same flows in headless Chromium
 * against WEB_URL — the dev server from `yarn e2e:web`
 * (http://localhost:8081) unless set. Maestro only drives a browser for a
 * flow whose header says `url:` rather than `appId:`, so each flow is copied
 * into .maestro/.web with that one line swapped; the steps are written once.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const env = readFileSync(".env", "utf8");
const appId = /^EXPO_PUBLIC_APP_BUNDLE_ID="?([^"\n]+)"?$/m.exec(env)?.[1];
if (!appId) {
  console.error("No EXPO_PUBLIC_APP_BUNDLE_ID in .env — run `yarn brand`.");
  process.exit(1);
}

// Maestro's installer puts it in ~/.maestro/bin and adds that to the shell
// profile — which a fresh terminal, an IDE or CI may not have loaded yet.
const installed = join(homedir(), ".maestro", "bin", "maestro");
const maestro = existsSync(installed) ? installed : "maestro";

/** Output of a command, or "" when it isn't there (no Xcode, no Android SDK). */
function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  return result.status === 0 ? result.stdout : "";
}

/**
 * Left to itself, Maestro can pick a simulator that isn't the booted one
 * (and report the app as not installed). With exactly one device running —
 * one booted iOS simulator and no Android device — that's the one to use.
 * `--device <id>` on the command line always wins.
 */
function onlyRunningDevice() {
  const simulators = Object.values(
    JSON.parse(
      run("xcrun", ["simctl", "list", "devices", "booted", "-j"]) || "{}",
    ).devices ?? {},
  ).flat();
  const androids = run("adb", ["devices"])
    .split("\n")
    .slice(1)
    .filter((line) => /\tdevice$/.test(line));
  return simulators.length === 1 && androids.length === 0
    ? simulators[0].udid
    : undefined;
}

const web = process.argv.includes("--web");
const args = process.argv.slice(2).filter((arg) => arg !== "--web");
const chosen = args.some((arg) => /^--(device|udid)\b/.test(arg));
const device = web || chosen ? undefined : onlyRunningDevice();

/**
 * The flows with `appId: ${APP_ID}` swapped for `url: ${WEB_URL}`, written
 * next to the originals so relative `runFlow` paths still resolve.
 */
function webFlows() {
  const source = join(".maestro", "flows");
  const out = join(".maestro", ".web");
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const file of readdirSync(source).filter((name) =>
    name.endsWith(".yaml"),
  )) {
    const flow = readFileSync(join(source, file), "utf8");
    if (!/^appId: \$\{APP_ID\}$/m.test(flow)) {
      throw new Error(`${file}: expected an "appId: \${APP_ID}" header line.`);
    }
    writeFileSync(
      join(out, file),
      flow.replace(/^appId: \$\{APP_ID\}$/m, "url: ${WEB_URL}"),
    );
  }
  return out;
}

const target = web
  ? [
      "--headless",
      "-e",
      `WEB_URL=${process.env.WEB_URL ?? "http://localhost:8081"}`,
    ]
  : device
    ? ["--device", device]
    : [];

const OUTPUT = "e2e-output";
rmSync(OUTPUT, { recursive: true, force: true });

const result = spawnSync(
  maestro,
  [
    "test",
    ...target,
    "--format",
    "junit",
    "--output",
    join(OUTPUT, "report.xml"),
    "--debug-output",
    OUTPUT,
    // Straight into e2e-output/, not a hidden .maestro/tests/<timestamp>/
    // that artifact uploads skip.
    "--flatten-debug-output",
    "-e",
    `APP_ID=${appId}`,
    ...args,
    web ? webFlows() : ".maestro",
  ],
  { stdio: "inherit" },
);
if (result.error?.code === "ENOENT") {
  console.error(
    "Maestro isn't installed: https://docs.maestro.dev/getting-started/installing-maestro",
  );
  process.exit(1);
}
process.exit(result.status ?? 1);

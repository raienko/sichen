/**
 * The Release workflow's first job: checks the form's combination, resolves
 * the version and which platforms run, and writes "what will happen" to the
 * job summary — so a wrong choice fails in seconds, before anything builds.
 *
 * Reads the inputs from env (TYPE, PLATFORM, ENVIRONMENT, DISTRIBUTION,
 * VERSION, NOTES); writes `key=value` outputs to $GITHUB_OUTPUT and Markdown
 * to $GITHUB_STEP_SUMMARY, or both to stdout locally:
 *
 *   TYPE=build PLATFORM=native ENVIRONMENT=staging DISTRIBUTION=internal \
 *     node scripts/ci/release-plan.mjs
 *
 * The form's options carry their own explanation ("Build — new app
 * binary…"), since GitHub shows nothing but the input id under a field.
 * The first word is the value, so the full label and the bare value
 * ("build") both work; later jobs use the plain values from the outputs.
 */
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

/** "Native — iOS and Android" → "native". */
const choice = (value, fallback) =>
  (value || fallback)
    .trim()
    .split(/[\s—(]/)[0]
    .toLowerCase();

const input = {
  type: choice(process.env.TYPE, "build"),
  platform: choice(process.env.PLATFORM, "all"),
  environment: choice(process.env.ENVIRONMENT, "staging"),
  distribution: choice(process.env.DISTRIBUTION, "internal"),
  version: (process.env.VERSION || "").trim(),
  notes: (process.env.NOTES || "").trim(),
};

const PLATFORMS = {
  all: ["ios", "android", "web"],
  native: ["ios", "android"],
  ios: ["ios"],
  android: ["android"],
  web: ["web"],
};
const NAMES = { ios: "iOS", android: "Android", web: "Web" };
const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

const errors = [];
const warnings = [];

// Web has no over-the-air updates: an update to "all" is iOS + Android.
const platforms = PLATFORMS[input.platform]?.filter(
  (p) => input.type !== "update" || p !== "web",
);
if (!platforms) errors.push(`Unsupported platform "${input.platform}".`);

if (input.type === "update") {
  if (input.platform === "web") {
    errors.push(
      "Over-the-air updates are not available for web. Choose Build to publish a new web release.",
    );
  }
  if (input.distribution !== "internal" || input.version) {
    warnings.push(
      "Updates are delivered to installed builds on their existing version and channel. Distribution and Version apply to builds only and were ignored.",
    );
  }
} else {
  if (input.distribution === "store" && input.environment !== "production") {
    errors.push(
      `Store releases require the production environment. Choose Production, or use Internal or Testing distribution for ${input.environment}.`,
    );
  }
  if (input.distribution === "testing" && input.platform === "web") {
    errors.push(
      "Web has no testing track. Choose Internal for a preview deployment or Store to go live.",
    );
  }
  if (input.version && !SEMVER.test(input.version)) {
    errors.push(
      `Version "${input.version}" is not a valid semantic version. Use the format 1.4.0 or 1.4.0-rc.1.`,
    );
  }
}

for (const message of warnings)
  console.log(`::warning title=Release::${message}`);
for (const message of errors) console.log(`::error title=Release::${message}`);

// The app config's version when none was given — what the binary would
// carry anyway. Updates don't have one of their own.
function appVersion() {
  const config = execFileSync(
    "npx",
    ["expo", "config", "--json", "--type", "public"],
    { encoding: "utf8" },
  );
  return JSON.parse(config).version;
}
const version =
  input.type === "update"
    ? ""
    : input.version || (errors.length ? "" : appVersion());

// Where each platform ends up, in words — the job summary and the
// platform jobs' placeholder notices say the same thing.
const DESTINATION = {
  build: {
    internal: {
      ios: "Internal install link (ad hoc)",
      android: "Internal install link (APK)",
      web: "Preview deployment",
    },
    testing: {
      ios: "TestFlight",
      android: "Google Play internal testing",
    },
    store: {
      ios: "App Store review",
      android: "Google Play review",
      web: "Production website",
    },
  },
  update: {
    internal: {
      ios: `Installed ${input.environment} builds`,
      android: `Installed ${input.environment} builds`,
    },
  },
};
const destinations =
  DESTINATION[input.type]?.[
    input.type === "update" ? "internal" : input.distribution
  ];

const summary = [
  `### ${input.type === "update" ? "Update" : `Release ${version || "—"}`} · ${input.environment}`,
  "",
  "| | |",
  "| --- | --- |",
  `| Type | ${input.type === "update" ? "Over-the-air update" : "New build"} |`,
  `| Environment | ${input.environment} |`,
  ...(input.type === "build"
    ? [
        `| Distribution | ${input.distribution} |`,
        `| Version | ${version || "—"} |`,
      ]
    : []),
  `| Platforms | ${(platforms ?? []).map((p) => `${NAMES[p]} → ${destinations?.[p] ?? "—"}`).join("<br>")} |`,
  `| Release notes | ${input.notes ? input.notes.replace(/\r?\n/g, "<br>") : "—"} |`,
  "",
  ...(errors.length
    ? ["**Release stopped:**", "", ...errors.map((e) => `- ${e}`), ""]
    : []),
  ...(warnings.length ? warnings.map((w) => `> ${w}`) : []),
];

const outputs = {
  type: input.type,
  distribution: input.distribution,
  version,
  ios: String(Boolean(platforms?.includes("ios"))),
  android: String(Boolean(platforms?.includes("android"))),
  web: String(Boolean(platforms?.includes("web"))),
  ...Object.fromEntries(
    Object.entries(destinations ?? {})
      .filter(([p]) => platforms?.includes(p))
      .map(([p, d]) => [`${p}_destination`, d]),
  ),
};
const outputLines = Object.entries(outputs).map(([k, v]) => `${k}=${v}`);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `${outputLines.join("\n")}\n`);
} else {
  console.log(outputLines.join("\n"));
}
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary.join("\n")}\n`);
} else {
  console.log(`\n${summary.join("\n")}`);
}

process.exit(errors.length ? 1 : 0);

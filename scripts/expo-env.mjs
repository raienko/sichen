import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { parseArgs, parseEnv } from "node:util";

export const EXPO_VARIABLES = [
  "EXPO_PUBLIC_APP_NAME",
  "EXPO_PUBLIC_APP_SLUG",
  "EXPO_PUBLIC_APP_SCHEME",
  "EXPO_PUBLIC_APP_BUNDLE_ID",
  "EXPO_PUBLIC_API_URL",
  "EXPO_PUBLIC_APP_LINK_DOMAINS",
  "APP_STORE_CONNECT_ID",
];

export async function pullExpoEnvironment({
  environment,
  root = process.cwd(),
  env = process.env,
  request = fetch,
  run = execFileSync,
}) {
  if (!["development", "preview", "production"].includes(environment)) {
    throw new Error("Choose --environment development, preview or production");
  }
  for (const key of ["EXPO_TOKEN", "EXPO_PUBLIC_EAS_PROJECT_ID"]) {
    if (!env[key]?.trim()) throw new Error(`Missing ${key}`);
  }
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      env.EXPO_PUBLIC_EAS_PROJECT_ID,
    )
  ) {
    throw new Error("EXPO_PUBLIC_EAS_PROJECT_ID must be a UUID");
  }

  // env:pull evaluates app config first. Resolve only project metadata here,
  // then run it in a temporary static project to avoid requiring app variables.
  const response = await request("https://api.expo.dev/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.EXPO_TOKEN}`,
    },
    body: JSON.stringify({
      query:
        "query EnvironmentProject($id: String!) { app { byId(appId: $id) { id slug ownerAccount { name } } } }",
      variables: { id: env.EXPO_PUBLIC_EAS_PROJECT_ID },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok)
    throw new Error(`Expo project lookup failed (${response.status})`);
  const result = await response.json();
  const project = result.data?.app?.byId;
  if (
    result.errors?.length ||
    !project?.slug ||
    project.id !== env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    !project.ownerAccount?.name
  ) {
    throw new Error(
      "Expo project lookup failed or returned incomplete project metadata",
    );
  }

  const temporary = mkdtempSync(join(tmpdir(), "expo-env-"));
  try {
    writeFileSync(
      join(temporary, "package.json"),
      JSON.stringify({ name: "environment-pull", private: true }),
    );
    writeFileSync(
      join(temporary, "app.json"),
      JSON.stringify({
        expo: {
          name: project.slug,
          slug: project.slug,
          owner: project.ownerAccount.name,
          extra: { eas: { projectId: project.id } },
        },
      }),
    );
    const pulledPath = join(temporary, ".env.pulled");
    run(
      "npx",
      [
        "--yes",
        "eas-cli@18.4.0",
        "env:pull",
        "--environment",
        environment,
        "--path",
        pulledPath,
        "--non-interactive",
      ],
      {
        cwd: temporary,
        env: { ...env, EAS_NO_VCS: "1" },
        stdio: "inherit",
      },
    );
    const pulled = parseEnv(readFileSync(pulledPath, "utf8"));
    const values = {
      ...Object.fromEntries(
        EXPO_VARIABLES.map((key) => [key, pulled[key] ?? ""]),
      ),
      // Resolve the owner from authenticated project metadata, not local or
      // hosted variables. This also keeps organization-owned apps explicit.
      EXPO_OWNER: project.ownerAccount.name,
    };
    for (const key of EXPO_VARIABLES.slice(0, 4)) {
      if (!values[key].trim())
        throw new Error(
          `Expo ${environment} is missing readable ${key}; use Sensitive or Plain text visibility`,
        );
    }
    for (const value of Object.values(values)) {
      if (/[\r\n]/.test(value))
        throw new Error("App configuration values must be single-line strings");
    }
    if (values.EXPO_PUBLIC_APP_SLUG !== project.slug) {
      throw new Error(
        "Expo environment slug does not match the selected project",
      );
    }
    if (
      values.APP_STORE_CONNECT_ID &&
      !/^[0-9]+$/.test(values.APP_STORE_CONNECT_ID)
    ) {
      throw new Error(
        "APP_STORE_CONNECT_ID must be the numeric App Store Connect app ID",
      );
    }
    // Copy only app/submission settings. Hosted variables cannot replace
    // bootstrap project IDs or CI credentials.
    writeFileSync(
      join(root, ".env.local"),
      `# Pulled from Expo ${environment}; replaced by yarn env:pull.\n` +
        Object.entries(values)
          .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
          .join("\n") +
        "\n",
      { mode: 0o600 },
    );
    if (env.GITHUB_ENV) {
      for (const [key, value] of Object.entries(values)) {
        if (value)
          process.stdout.write(`::add-mask::${value.replaceAll("%", "%25")}\n`);
        const delimiter = randomUUID();
        appendFileSync(
          env.GITHUB_ENV,
          `${key}<<${delimiter}\n${value}\n${delimiter}\n`,
        );
      }
    }
    return values;
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const shell = { ...process.env };
  if (existsSync(".env")) process.loadEnvFile(".env");
  const { values } = parseArgs({
    options: { environment: { type: "string" } },
  });
  await pullExpoEnvironment({ environment: values.environment });
  // The web manifest carries the app's name, which may just have changed.
  // With the shell's env, not .env's: the brand reads the files in Expo's
  // order itself, and a value from .env would shadow the pulled one.
  execFileSync("node", ["scripts/brand/index.ts"], {
    env: shell,
    stdio: "inherit",
  });
}

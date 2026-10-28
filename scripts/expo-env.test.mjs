import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseEnv } from "node:util";
import test from "node:test";

import { pullExpoEnvironment } from "./expo-env.mjs";

const ID = "00000000-0000-0000-0000-000000000001";
const app = {
  EXPO_PUBLIC_APP_NAME: "Example App",
  EXPO_PUBLIC_APP_SLUG: "example-app",
  EXPO_PUBLIC_APP_SCHEME: "example-app",
  EXPO_PUBLIC_APP_BUNDLE_ID: "com.example.app",
};
const bootstrap = {
  EXPO_PUBLIC_EAS_PROJECT_ID: ID,
  EXPO_TOKEN: "fixture-token",
};
const metadata = {
  id: ID,
  slug: app.EXPO_PUBLIC_APP_SLUG,
  ownerAccount: { name: "example" },
};

function fixture(t, values = app, project = metadata) {
  const root = mkdtempSync(join(tmpdir(), "expo-env-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const calls = [];
  return {
    root,
    calls,
    options: {
      environment: "development",
      root,
      env: bootstrap,
      request: async (_url, options) => {
        assert.equal(
          options.headers.Authorization,
          `Bearer ${bootstrap.EXPO_TOKEN}`,
        );
        assert.equal(JSON.parse(options.body).variables.id, ID);
        return {
          ok: true,
          json: async () => ({ data: { app: { byId: project } } }),
        };
      },
      run: (command, args, options) => {
        calls.push({ command, args, options });
        const config = JSON.parse(
          readFileSync(join(options.cwd, "app.json"), "utf8"),
        );
        assert.equal(config.expo.extra.eas.projectId, ID);
        assert.equal(config.expo.slug, metadata.slug);
        assert.equal(config.expo.owner, project.ownerAccount.name);
        writeFileSync(
          args[args.indexOf("--path") + 1],
          Object.entries(values)
            .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
            .join("\n"),
        );
      },
    },
  };
}

test("pulls identity without app settings in CI and protects bootstrap values", async (t) => {
  const { root, calls, options } = fixture(t, {
    ...app,
    EXPO_TOKEN: "untrusted",
    EXPO_OWNER: "untrusted",
    EXPO_PUBLIC_EAS_PROJECT_ID: "untrusted",
    APP_STORE_CONNECT_ID: "123456",
  });
  await pullExpoEnvironment(options);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].args.includes("env:pull"));
  assert.equal(
    calls[0].args[calls[0].args.indexOf("--environment") + 1],
    "development",
  );
  const pulled = parseEnv(readFileSync(join(root, ".env.local"), "utf8"));
  assert.equal(pulled.EXPO_PUBLIC_APP_NAME, "Example App");
  assert.equal(pulled.EXPO_TOKEN, undefined);
  assert.equal(pulled.EXPO_OWNER, "example");
  assert.equal(pulled.EXPO_PUBLIC_EAS_PROJECT_ID, undefined);
  assert.equal(pulled.APP_STORE_CONNECT_ID, "123456");
  assert.equal(pulled.EXPO_PUBLIC_API_URL, "");
  assert.equal(existsSync(calls[0].options.cwd), false);
});

test("refuses metadata for another project before pulling", async (t) => {
  const { options, calls } = fixture(t, app, {
    ...metadata,
    id: "00000000-0000-0000-0000-000000000002",
  });
  await assert.rejects(pullExpoEnvironment(options), /project lookup failed/);
  assert.equal(calls.length, 0);
});

test("refuses missing or Secret app identity without replacing the local environment", async (t) => {
  const { root, options, calls } = fixture(t, {
    EXPO_PUBLIC_APP_SLUG: metadata.slug,
  });
  writeFileSync(join(root, ".env.local"), "unchanged");
  await assert.rejects(
    pullExpoEnvironment(options),
    /missing readable EXPO_PUBLIC_APP_NAME/,
  );
  assert.equal(readFileSync(join(root, ".env.local"), "utf8"), "unchanged");
  assert.equal(existsSync(calls[0].options.cwd), false);
});

test("refuses identity for another project", async (t) => {
  const { options } = fixture(t, {
    ...app,
    EXPO_PUBLIC_APP_SLUG: "other-project",
  });
  await assert.rejects(pullExpoEnvironment(options), /slug does not match/);
});

test("eas.json has one store build and submit profile per environment, with no app values", () => {
  const config = JSON.parse(readFileSync("eas.json", "utf8"));
  const environments = ["development", "preview", "production"];
  assert.deepEqual(Object.keys(config.build), environments);
  assert.deepEqual(Object.keys(config.submit), environments);
  for (const environment of environments) {
    const profile = config.build[environment];
    assert.equal(profile.environment, environment);
    assert.equal(profile.distribution, "store");
    // Identity comes from the selected EAS environment, never from here.
    assert.equal(profile.env, undefined);
    assert.equal(config.submit[environment].android.track, "internal");
  }
});

test("rejects an invalid App Store Connect destination pulled from Expo", async (t) => {
  const { options } = fixture(t, {
    ...app,
    APP_STORE_CONNECT_ID: "not-numeric",
  });
  await assert.rejects(
    pullExpoEnvironment(options),
    /numeric App Store Connect app ID/,
  );
});

test("allows non-submission builds without an App Store Connect ID", async (t) => {
  const { options } = fixture(t);
  const values = await pullExpoEnvironment(options);
  assert.equal(values.APP_STORE_CONNECT_ID, "");
});

test("requires owner metadata from Expo rather than trusting an owner variable", async (t) => {
  const { options, calls } = fixture(t, app, { ...metadata, ownerAccount: {} });
  options.env = { ...options.env, EXPO_OWNER: "stale-owner" };
  await assert.rejects(
    pullExpoEnvironment(options),
    /incomplete project metadata/,
  );
  assert.equal(calls.length, 0);
});

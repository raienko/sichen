/**
 * The env module reads `process.env` once, at import. So each case sets the
 * variables it wants and re-imports through `jest.isolateModules`, rather
 * than calling a function — which is also exactly how the app loads it, and
 * therefore what is worth testing.
 */
const VALID = {
  EXPO_PUBLIC_APP_NAME: "app",
  EXPO_PUBLIC_APP_SLUG: "app",
  EXPO_PUBLIC_APP_SCHEME: "app",
  EXPO_PUBLIC_APP_BUNDLE_ID: "com.example.app",
};

type Env = typeof import("./index").default;

function load(overrides: Record<string, string | undefined> = {}): Env {
  const previous = { ...process.env };
  Object.assign(process.env, VALID, overrides);
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete process.env[key];
  }

  let env: Env;
  try {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- the module is the thing under test, and it has to be re-required per case
      env = require("./index") as Env;
    });
  } finally {
    process.env = previous;
  }

  return env!;
}

describe("env", () => {
  it("reads the required values", () => {
    const env = load();

    expect(env.appName).toBe("app");
    expect(env.appBundleId).toBe("com.example.app");
  });

  it("splits the link domains, dropping blanks and stray spaces", () => {
    expect(
      load({ EXPO_PUBLIC_APP_LINK_DOMAINS: " a.com , ,b.com " }).appLinkDomains,
    ).toEqual(["a.com", "b.com"]);
  });

  it("throws for a missing required value", () => {
    expect(() => load({ EXPO_PUBLIC_APP_NAME: undefined })).toThrow(
      /EXPO_PUBLIC_APP_NAME/,
    );
  });
});

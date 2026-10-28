/**
 * `isE2E` is settled when the module loads, so each case loads it afresh
 * with the env it wants — the same reason src/utils/index.md gives for
 * mocking platform constants in a file of their own.
 */
function load(e2e: boolean): typeof import("./index") {
  let loaded!: typeof import("./index");
  jest.isolateModules(() => {
    jest.doMock("@/constants/env", () => ({
      __esModule: true,
      default: { ...jest.requireActual("@/constants/env"), e2e },
    }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- re-loaded per case, see above
    loaded = require("./index");
  });
  return loaded;
}

describe("e2e", () => {
  afterEach(() => jest.dontMock("@/constants/env"));

  it("is off in an ordinary build, where debug tooling is on", () => {
    const { isE2E, ifE2E, isDebug } = load(false);
    expect(isE2E).toBe(false);
    expect(ifE2E("test", "real")).toBe("real");
    // Jest runs as a development build.
    expect(isDebug).toBe(true);
  });

  it("is on in a build made for end-to-end tests, with debug tooling off", () => {
    const { isE2E, ifE2E, isDebug } = load(true);
    expect(isE2E).toBe(true);
    expect(ifE2E("test", "real")).toBe("test");
    expect(isDebug).toBe(false);
  });
});

describe("EXPO_PUBLIC_E2E", () => {
  const original = process.env.EXPO_PUBLIC_E2E;
  afterEach(() => {
    process.env.EXPO_PUBLIC_E2E = original;
  });

  function readFlag(value: string | undefined): boolean {
    process.env.EXPO_PUBLIC_E2E = value;
    let e2e = false;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- re-loaded per case, see above
      e2e = require("@/constants/env").e2e;
    });
    return e2e;
  }

  it("is on only for 1 or true", () => {
    expect(readFlag("1")).toBe(true);
    expect(readFlag("TRUE")).toBe(true);
    expect(readFlag(" true ")).toBe(true);
  });

  it("stays off for anything else, so 0 or false can't switch it on", () => {
    expect(readFlag(undefined)).toBe(false);
    expect(readFlag("")).toBe(false);
    expect(readFlag("0")).toBe(false);
    expect(readFlag("false")).toBe(false);
    expect(readFlag("yes")).toBe(false);
  });
});

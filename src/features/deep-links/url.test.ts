import env from "@/constants/env";

import { normalizeUrl } from "./url";

const scheme = env.appScheme;

describe("normalizeUrl", () => {
  it("reads a custom-scheme link, whose first segment parses as a host", () => {
    expect(normalizeUrl(`${scheme}://orders/12`)).toEqual({
      url: `${scheme}://orders/12`,
      path: "/orders/12",
      query: {},
    });
  });

  it("reads the triple-slashed spelling Linking.createURL() produces", () => {
    expect(normalizeUrl(`${scheme}:///orders/12`)?.path).toBe("/orders/12");
  });

  it("reads a bare path, the shape a link inside a payload usually has", () => {
    expect(normalizeUrl("/orders/12")).toEqual({
      url: "/orders/12",
      path: "/orders/12",
      query: {},
    });
  });

  it("parses the query string of a bare path, which is not a valid URL", () => {
    expect(normalizeUrl("/orders/12?ref=email&utm=push")?.query).toEqual({
      ref: "email",
      utm: "push",
    });
  });

  it("parses the query string of a custom-scheme link", () => {
    expect(normalizeUrl(`${scheme}://orders/12?ref=email`)?.query).toEqual({
      ref: "email",
    });
  });

  it("normalizes the scheme's case, which the OS does not guarantee", () => {
    expect(normalizeUrl(`${scheme.toUpperCase()}://orders/12`)?.path).toBe(
      "/orders/12",
    );
  });

  it("collapses empty and trailing segments", () => {
    expect(normalizeUrl(`${scheme}:///orders//12/`)?.path).toBe("/orders/12");
  });

  it("turns a link with no path into the root path", () => {
    expect(normalizeUrl(`${scheme}:///`)?.path).toBe("/");
  });

  it("leaves the path percent-encoded, so an encoded slash stays in its segment", () => {
    expect(normalizeUrl("/orders/ada%2Flovelace")?.path).toBe(
      "/orders/ada%2Flovelace",
    );
  });

  it("takes the app's path from an Expo Go URL, ignoring the packager host", () => {
    expect(normalizeUrl("exp://192.168.1.5:8081/--/orders/12")?.path).toBe(
      "/orders/12",
    );
  });

  it("treats an Expo Go URL with no app path as the root", () => {
    expect(normalizeUrl("exp://192.168.1.5:8081")?.path).toBe("/");
  });

  it("rejects another app's scheme, so it can be handed to the OS", () => {
    expect(normalizeUrl("tel:5555555")).toBeNull();
  });

  it("rejects a website we do not claim", () => {
    expect(normalizeUrl("https://example.com/orders/12")).toBeNull();
  });

  it("accepts the web app's current origin without a native app-link domain", () => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, "location");
    Object.defineProperty(globalThis, "location", {
      configurable: true,
      value: { host: "localhost:19006" },
    });

    try {
      expect(normalizeUrl("http://localhost:19006/orders/12")?.path).toBe(
        "/orders/12",
      );
      expect(normalizeUrl("http://localhost:8081/orders/12")).toBeNull();
    } finally {
      if (previous) {
        Object.defineProperty(globalThis, "location", previous);
      } else {
        Reflect.deleteProperty(globalThis, "location");
      }
    }
  });

  it("rejects an empty or unparseable URL", () => {
    expect(normalizeUrl("")).toBeNull();
    expect(normalizeUrl("   ")).toBeNull();
    expect(normalizeUrl("not a url")).toBeNull();
  });
});

describe("normalizeUrl with EXPO_PUBLIC_APP_LINK_DOMAINS set", () => {
  const domain = "example.com";

  beforeEach(() => {
    jest.resetModules();
    jest.doMock("@/constants/env", () => ({
      __esModule: true,
      default: { ...env, appLinkDomains: [domain] },
    }));
  });

  afterEach(() => {
    jest.dontMock("@/constants/env");
    jest.resetModules();
  });

  /**
   * The domain list is read once, when the module is first evaluated, so
   * these have to re-import it rather than reassign a value.
   */
  function load(): typeof normalizeUrl {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- see above
    return (require("./url") as typeof import("./url")).normalizeUrl;
  }

  it("accepts a universal/app link on a claimed domain", () => {
    const normalize = load();

    expect(normalize(`https://${domain}/orders/12`)?.path).toBe("/orders/12");
  });

  it("matches the domain case-insensitively, as hostnames are", () => {
    const normalize = load();

    expect(normalize(`https://${domain.toUpperCase()}/orders/12`)?.path).toBe(
      "/orders/12",
    );
  });

  it("still rejects an unclaimed domain", () => {
    const normalize = load();

    expect(normalize("https://not-ours.example/orders/12")).toBeNull();
  });
});

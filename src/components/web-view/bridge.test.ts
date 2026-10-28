import {
  BRIDGE_CHANNEL,
  decodeMessage,
  encodeMessage,
  isAllowedOrigin,
  MAX_MESSAGE_LENGTH,
  navigationDecision,
  originOf,
  postTargets,
} from "./bridge";

describe("encodeMessage", () => {
  it("stamps the channel on every message", () => {
    expect(JSON.parse(encodeMessage({ type: "ping" }))).toEqual({
      channel: BRIDGE_CHANNEL,
      type: "ping",
    });
  });

  it("carries a payload when there is one", () => {
    expect(
      JSON.parse(encodeMessage({ type: "cart", payload: { items: 2 } })),
    ).toEqual({ channel: BRIDGE_CHANNEL, type: "cart", payload: { items: 2 } });
  });

  it("omits the payload key entirely when there isn't", () => {
    expect(encodeMessage({ type: "ping" })).not.toContain("payload");
  });

  it("round-trips through decode", () => {
    const message = { type: "checkout.complete", payload: { orderId: 12 } };

    expect(decodeMessage(encodeMessage(message))).toEqual(message);
  });
});

describe("decodeMessage", () => {
  const envelope = (extra: Record<string, unknown>) =>
    JSON.stringify({ channel: BRIDGE_CHANNEL, ...extra });

  it("reads a well-formed string", () => {
    expect(decodeMessage(envelope({ type: "ping", payload: 1 }))).toEqual({
      type: "ping",
      payload: 1,
    });
  });

  // The web's `message` event structured-clones what was posted, so it can
  // arrive already parsed.
  it("reads an already-parsed object", () => {
    expect(decodeMessage({ channel: BRIDGE_CHANNEL, type: "ping" })).toEqual({
      type: "ping",
    });
  });

  /**
   * Everything here is a page doing something perfectly normal that isn't
   * talking to us — which is why it's `null` rather than a throw.
   */
  describe("declines anything that isn't ours", () => {
    it.each([
      [
        "a message on another channel",
        envelope({ type: "x" }).replace(BRIDGE_CHANNEL, "other"),
      ],
      ["no channel at all", JSON.stringify({ type: "ping" })],
      ["plain text", "hello"],
      ["malformed JSON", "{"],
      ["a JSON array", "[1,2,3]"],
      ["a JSON string", '"ping"'],
      ["a number", 42],
      ["null", null],
      ["undefined", undefined],
      ["a missing type", envelope({ payload: 1 })],
      ["an empty type", envelope({ type: "" })],
      ["a non-string type", envelope({ type: 7 })],
    ])("declines %s", (_name, raw) => {
      expect(decodeMessage(raw)).toBeNull();
    });
  });

  // The page chooses this string, so without a cap it chooses how much
  // memory we spend parsing it.
  it("refuses to parse anything past the length cap", () => {
    const huge = JSON.stringify({
      channel: BRIDGE_CHANNEL,
      type: "ping",
      payload: "x".repeat(MAX_MESSAGE_LENGTH),
    });

    expect(huge.length).toBeGreaterThan(MAX_MESSAGE_LENGTH);
    expect(decodeMessage(huge)).toBeNull();
  });

  it("still reads a message just under it", () => {
    const payload = "x".repeat(MAX_MESSAGE_LENGTH - 200);
    const raw = encodeMessage({ type: "ping", payload });

    expect(raw.length).toBeLessThan(MAX_MESSAGE_LENGTH);
    expect(decodeMessage(raw)).toEqual({ type: "ping", payload });
  });
});

describe("originOf", () => {
  it.each([
    ["https://example.com/a/b?x=1#y", "https://example.com"],
    ["https://example.com", "https://example.com"],
    ["http://localhost:8081/index.html", "http://localhost:8081"],
    ["HTTPS://Example.COM/a", "https://example.com"],
    ["myapp://host/path", "myapp://host"],
  ])("reduces %s", (url, expected) => {
    expect(originOf(url)).toBe(expected);
  });

  // Credentials aren't part of an origin, and leaving them in would stop
  // the URL matching the site it belongs to.
  //
  // Assembled rather than written out: a `user:password@host` literal is
  // what secretlint's basic-auth rule looks for, and a fixture failing the
  // secret scan is a worse trade than one extra line here.
  it("drops credentials", () => {
    const credentials = ["someone", "hunter2"].join(":");

    expect(originOf(`https://${credentials}@example.com/a`)).toBe(
      "https://example.com",
    );
    expect(originOf("https://someone@example.com/a")).toBe(
      "https://example.com",
    );
  });

  it.each([
    ["a bare path", "/orders/12"],
    ["no authority", "https://"],
    ["nothing", ""],
    ["a scheme with no slashes", "mailto:someone@example.com"],
  ])("has no origin for %s", (_name, url) => {
    expect(originOf(url)).toBeNull();
  });
});

describe("isAllowedOrigin", () => {
  const allowed = ["https://example.com", "https://pay.example.com"];

  it("accepts a listed origin", () => {
    expect(isAllowedOrigin("https://example.com", allowed)).toBe(true);
    expect(isAllowedOrigin("https://pay.example.com", allowed)).toBe(true);
  });

  it("ignores case", () => {
    expect(isAllowedOrigin("HTTPS://Example.com", allowed)).toBe(true);
  });

  it("accepts an entry written as a full URL", () => {
    expect(
      isAllowedOrigin("https://example.com", ["https://example.com/help"]),
    ).toBe(true);
  });

  /**
   * A subdomain is frequently not under the same control as its parent, so
   * "roughly the right site" is not a boundary — list the ones you mean.
   */
  it("does not let a parent domain stand in for a subdomain", () => {
    expect(
      isAllowedOrigin("https://evil.example.com", ["https://example.com"]),
    ).toBe(false);
  });

  it.each([
    ["a different host", "https://evil.com"],
    ["a different scheme", "http://example.com"],
    ["a different port", "https://example.com:8443"],
    ["nothing", ""],
    ["whitespace", "   "],
  ])("rejects %s", (_name, origin) => {
    expect(isAllowedOrigin(origin, allowed)).toBe(false);
  });

  it("rejects everything when nothing is allowed", () => {
    expect(isAllowedOrigin("https://example.com", [])).toBe(false);
  });

  // The origin a browser reports for a srcdoc document, which is how the
  // web implementation renders an `html` source.
  it("accepts an opaque origin only when it is named", () => {
    expect(isAllowedOrigin("null", ["null"])).toBe(true);
    expect(isAllowedOrigin("null", allowed)).toBe(false);
  });
});

describe("navigationDecision", () => {
  const allowed = ["https://example.com"];

  it("follows a navigation within an allowed origin", () => {
    expect(navigationDecision("https://example.com/next?x=1", allowed)).toBe(
      "allow",
    );
    expect(navigationDecision("HTTPS://EXAMPLE.COM/", allowed)).toBe("allow");
  });

  it("allows the blank document behind an html source", () => {
    expect(navigationDecision("about:blank", allowed)).toBe("allow");
  });

  it("sends any other web page to the system browser", () => {
    expect(navigationDecision("https://evil.example.com/login", allowed)).toBe(
      "external",
    );
    // The prefix match react-native-webview's own list would let through.
    expect(navigationDecision("https://example.com.evil.net/", allowed)).toBe(
      "external",
    );
    expect(navigationDecision("http://example.com/", allowed)).toBe("external");
  });

  it("refuses every non-web scheme outright", () => {
    for (const url of [
      "javascript:alert(1)",
      "file:///etc/passwd",
      "data:text/html,<script>1</script>",
      "intent://scan/#Intent;scheme=zxing;end",
      "otherapp://pay?amount=100",
      "about:config",
    ]) {
      expect(navigationDecision(url, allowed)).toBe("block");
    }
  });
});

describe("postTargets", () => {
  it("names each trusted origin, so a navigated frame gets nothing", () => {
    expect(
      postTargets([
        "https://example.com",
        "https://pay.example.com/session/12",
        "HTTPS://EXAMPLE.COM/other",
      ]),
    ).toEqual(["https://example.com", "https://pay.example.com"]);
  });

  it("never falls back to the wildcard", () => {
    expect(postTargets(["null"])).toEqual([]);
    expect(postTargets([])).toEqual([]);
    expect(postTargets(["null", "http://localhost:8081"])).toEqual([
      "http://localhost:8081",
    ]);
  });
});

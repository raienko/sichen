import logger, { createLogger, redact, redactUrl, type Logger } from "./index";

const METHODS: (keyof Logger)[] = [
  "log",
  "warn",
  "error",
  "success",
  "out",
  "in",
  "failed",
];

describe("logger", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each(METHODS)(
    "styles and forwards %s values through console.log",
    (type) => {
      const consoleLog = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});
      const details = { requestId: "example" };

      logger[type]("message", details);

      expect(consoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/^%c .+ %c$/),
        expect.stringContaining("background:"),
        expect.any(String),
        "message",
        details,
      );
    },
  );

  it("does nothing when debug logging is disabled", () => {
    const consoleLog = jest.spyOn(console, "log").mockImplementation(() => {});
    const disabled = createLogger(false);

    for (const method of METHODS) disabled[method]("hidden");

    expect(consoleLog).not.toHaveBeenCalled();
  });

  /**
   * `%c` only means anything to a browser-style console. In the Metro
   * terminal it prints literally, so the icon is the only thing separating
   * one level from another there.
   */
  it("puts a distinct icon in every badge", () => {
    const consoleLog = jest.spyOn(console, "log").mockImplementation(() => {});

    for (const method of METHODS) logger[method]("message");

    const icons = consoleLog.mock.calls.map(
      ([badge]) => String(badge).replace(/%c/g, "").trim().split(" ")[0],
    );
    expect(new Set(icons).size).toBe(METHODS.length);
    expect(icons.every((icon) => /\p{Extended_Pictographic}/u.test(icon))).toBe(
      true,
    );
  });

  it("names the level in the badge, not in the message", () => {
    const consoleLog = jest.spyOn(console, "log").mockImplementation(() => {});

    logger.success("Profile saved");

    const [badge, , , message] = consoleLog.mock.calls[0];
    expect(badge).toContain("SUCCESS");
    // Left as its own argument so DevTools keeps values expandable rather
    // than flattening them into the format string.
    expect(message).toBe("Profile saved");
  });

  /**
   * Colour is shared on purpose by levels that mean the same thing — log and
   * out are both blue, success and in both green, error and failed both red —
   * so it's the badge text and icon that have to be distinct, not the colour.
   */
  it("gives every method its own badge, and every badge a colour", () => {
    const consoleLog = jest.spyOn(console, "log").mockImplementation(() => {});

    for (const method of METHODS) logger[method]("message");

    const badges = consoleLog.mock.calls.map(([badge]) => badge);
    expect(new Set(badges).size).toBe(METHODS.length);

    const styles = consoleLog.mock.calls.map(([, style]) => String(style));
    expect(
      styles.every((style) => /background: #[0-9a-f]{6}/i.test(style)),
    ).toBe(true);
  });
});

describe("redact", () => {
  const jwt =
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.c2lnbmF0dXJlLXNpZ25hdHVyZQ";

  it("hides sensitive fields at any depth and leaves the rest", () => {
    const body = {
      email: "ada@example.com",
      password: "hunter2",
      profile: { accessToken: "t", refresh_token: "r", name: "Ada" },
      payment: [{ cardNumber: "4242", cvv: "123", amount: 5 }],
      otp: "123456",
    };

    expect(redact(body)).toEqual({
      email: "ada@example.com",
      password: "[redacted]",
      profile: {
        accessToken: "[redacted]",
        refresh_token: "[redacted]",
        name: "Ada",
      },
      payment: [{ cardNumber: "[redacted]", cvv: "[redacted]", amount: 5 }],
      otp: "[redacted]",
    });
    expect(body.password).toBe("hunter2");
  });

  it("masks a JWT wherever it appears in a string", () => {
    expect(redact({ note: `Bearer ${jwt}` })).toEqual({
      note: "Bearer [redacted]",
    });
  });

  it("names non-plain objects instead of printing them", () => {
    class Upload {}
    expect(redact({ file: new Upload(), when: null, count: 1 })).toEqual({
      file: "[Upload]",
      when: null,
      count: 1,
    });
  });

  it("stops at a cycle instead of recursing forever", () => {
    const loop: Record<string, unknown> = { name: "loop" };
    loop.self = loop;
    expect(() => redact(loop)).not.toThrow();
  });

  it("masks sensitive query values in a URL", () => {
    expect(redactUrl("/verify?email=a@b.c&code=9911&next=/home")).toBe(
      "/verify?email=a@b.c&code=[redacted]&next=/home",
    );
    expect(redactUrl(`/links/${jwt}`)).toBe("/links/[redacted]");
  });
});

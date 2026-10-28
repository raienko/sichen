import { errorText, matches, rules, z } from "./index";

/** The first message a schema reports for `value`, or undefined if it passes. */
function issue(schema: z.ZodType, value: unknown): string | undefined {
  const result = schema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe("rules", () => {
  it("required trims, so spaces alone don't count", () => {
    expect(issue(rules.required(), "  ")).toBe("validation.required");
    expect(issue(rules.required(), " x ")).toBeUndefined();
  });

  it("email", () => {
    expect(issue(rules.email(), "")).toBe("validation.required");
    expect(issue(rules.email(), "ada@")).toBe("validation.email");
    expect(issue(rules.email(), "ada example.com")).toBe("validation.email");
    expect(issue(rules.email(), " ada@example.com ")).toBeUndefined();
  });

  it("password: length, a letter and a digit by default", () => {
    expect(issue(rules.password(), "a1")).toBe(
      'validation.passwordMin?{"min":8}',
    );
    expect(issue(rules.password(), "12345678")).toBe(
      "validation.passwordLetter",
    );
    expect(issue(rules.password(), "abcdefgh")).toBe(
      "validation.passwordDigit",
    );
    expect(issue(rules.password(), "abcd1234")).toBeUndefined();
  });

  it("password: a symbol when asked, and letters in any script", () => {
    expect(issue(rules.password({ symbol: true }), "abcd1234")).toBe(
      "validation.passwordSymbol",
    );
    expect(
      issue(rules.password({ symbol: true }), "пароль12!"),
    ).toBeUndefined();
  });

  it("name allows real names in any script, and nothing else", () => {
    for (const name of [
      "Ada Lovelace",
      "Jean-Luc O'Neil",
      "Олександр",
      "李雷",
    ]) {
      expect(issue(rules.name(), name)).toBeUndefined();
    }
    expect(issue(rules.name(), "Ada99")).toBe("validation.name");
    expect(issue(rules.name(), "A")).toBe('validation.tooShort?{"min":2}');
  });

  it("phone checks the number against its country", () => {
    expect(issue(rules.phone(), "+380671234567")).toBeUndefined();
    expect(issue(rules.phone(), "+38067")).toBe("validation.phone");
    expect(issue(rules.phone("UA"), "0671234567")).toBeUndefined();
  });

  it("url wants an http(s) address", () => {
    expect(issue(rules.url(), "example.com")).toBe("validation.url");
    expect(issue(rules.url(), "https://example.com/a")).toBeUndefined();
  });

  it("optional lets an empty field through but checks what's typed", () => {
    const website = rules.optional(rules.url());
    expect(issue(website, "")).toBeUndefined();
    expect(issue(website, undefined)).toBeUndefined();
    expect(issue(website, "nope")).toBe("validation.url");
  });
});

describe("matches", () => {
  const schema = matches(
    z.object({ password: z.string(), confirm: z.string() }),
    "password",
    "confirm",
  );

  it("reports a mismatch on the confirming field", () => {
    const result = schema.safeParse({ password: "a", confirm: "b" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ["confirm"],
      message: "validation.mismatch",
    });
  });

  it("passes when they match", () => {
    expect(schema.safeParse({ password: "a", confirm: "a" }).success).toBe(
      true,
    );
  });
});

describe("errorText", () => {
  const t = (key: string, params?: Record<string, unknown>) =>
    `${key}${params ? JSON.stringify(params) : ""}`;

  it("translates the key and passes its params through", () => {
    expect(errorText('validation.tooShort?{"min":2}', t as never)).toBe(
      'validation.tooShort{"min":2}',
    );
    expect(errorText("validation.email", t as never)).toBe("validation.email");
    expect(errorText(undefined, t as never)).toBeUndefined();
  });
});

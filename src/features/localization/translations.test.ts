import { LOCALES } from "./types";
import { translate } from "./translations";

describe("translate", () => {
  it("returns the string at a dotted key for every locale", () => {
    for (const { code } of LOCALES) {
      expect(typeof translate(code, "common.close")).toBe("string");
      expect(translate(code, "common.close").length).toBeGreaterThan(0);
    }
  });

  it("interpolates {{token}} placeholders", () => {
    expect(
      translate("en", "showcase.summary", {
        name: "Ada",
        age: 30,
        email: "a@b.c",
      }),
    ).toBe("name: Ada / age: 30 / email: a@b.c");
  });

  it("leaves an unmatched placeholder untouched", () => {
    expect(translate("en", "showcase.summary", {})).toBe(
      "name: {{name}} / age: {{age}} / email: {{email}}",
    );
  });

  it("throws for a key missing from a locale", () => {
    // @ts-expect-error -- deliberately not a real TranslationKey
    expect(() => translate("en", "nope.nope")).toThrow(/Missing translation/);
  });
});

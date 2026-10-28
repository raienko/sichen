import { composeTranslations, translate } from "./translations";

describe("locale provider configuration", () => {
  it("deep-merges application strings while preserving core catalog keys", () => {
    const catalog = composeTranslations({
      en: { app: { home: { title: "Configured application" } } },
    });

    expect(translate("en", "app.home.title", undefined, catalog)).toBe(
      "Configured application",
    );
    expect(translate("en", "common.close", undefined, catalog)).toBe("Close");
  });

  it("permits an intentional core override without mutating the base catalog", () => {
    const catalog = composeTranslations({
      en: { common: { close: "Dismiss" } },
    });

    expect(translate("en", "common.close", undefined, catalog)).toBe("Dismiss");
    expect(translate("en", "common.close")).toBe("Close");
  });

  it("keeps unconfigured locales intact and rejects malformed leaves", () => {
    const catalog = composeTranslations({
      uk: { app: { home: { title: "Налаштований застосунок" } } },
    });

    expect(translate("es", "common.close", undefined, catalog)).toBe("Cerrar");
    expect(() => composeTranslations({ en: { app: { home: 1 } } })).toThrow(
      /string leaves/,
    );
  });
});

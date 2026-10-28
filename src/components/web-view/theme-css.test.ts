import { createTypography, createUnits } from "@/features/responsive";
import { colors } from "@/features/theme/colors";

import { buildThemeCss } from "./theme-css";

const typography = createTypography(createUnits(1), 1);
const light = buildThemeCss(colors.light, typography);
const dark = buildThemeCss(colors.dark, typography);

describe("buildThemeCss", () => {
  it("publishes every palette entry as a custom property", () => {
    for (const key of Object.keys(colors.light)) {
      const name = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
      expect(light).toContain(`--app-color-${name}:`);
    }
  });

  it("publishes the type scale as custom properties", () => {
    expect(light).toContain(
      `--app-font-size-body: ${typography.body.fontSize}px;`,
    );
    expect(light).toContain(
      `--app-line-height-body: ${typography.body.lineHeight}px;`,
    );
    expect(light).toContain("--app-font-size-large-title:");
    expect(light).toContain("--app-font-weight-headline:");
  });

  // The same mapping `Text` uses to decide heading semantics, read the
  // other way — so a markdown `#` in a page comes out the size a
  // `<Text type="largeTitle">` would.
  it("sets the headings from the same steps Text uses", () => {
    expect(light).toContain("--app-font-size-large-title)");
    expect(light).toMatch(/h1 \{[^}]*--app-font-size-large-title/);
    expect(light).toMatch(/h2 \{[^}]*--app-font-size-title1/);
    expect(light).toMatch(/h3 \{[^}]*--app-font-size-title2/);
    expect(light).toMatch(/h4 \{[^}]*--app-font-size-title3/);
  });

  it("dresses the body in the app's own typography and palette", () => {
    expect(light).toMatch(/body \{[^}]*font-family: var\(--app-font-family\)/);
    expect(light).toMatch(/body \{[^}]*color: var\(--app-color-text\)/);
    expect(light).toMatch(
      /body \{[^}]*background-color: var\(--app-color-background\)/,
    );
  });

  // Told from the palette rather than a flag passed alongside it, so the
  // two can't disagree.
  it("declares the scheme it is actually in", () => {
    expect(light).toContain("color-scheme: light;");
    expect(dark).toContain("color-scheme: dark;");
  });

  it("carries the two schemes' own values", () => {
    expect(light).toContain(
      `--app-color-background: ${colors.light.background};`,
    );
    expect(dark).toContain(
      `--app-color-background: ${colors.dark.background};`,
    );
  });

  /**
   * A palette is swappable — `palette.json` for a rebrand, `ThemeOverrides`
   * from an app — so a value that closed a declaration would become a rule
   * of its own inside a page we injected it into.
   */
  it("cannot let a palette value escape its declaration", () => {
    const hostile = buildThemeCss(
      { ...colors.light, primary: "red; } body { display: none; } a {" },
      typography,
    );

    // The characters that would end the declaration or the block are the
    // ones removed; what is left is inert nonsense inside one property.
    expect(hostile).toContain(
      "--app-color-primary: red  body  display: none  a ;",
    );
    expect(hostile).not.toContain("display: none;");
    expect(hostile).not.toContain("} body {");
  });

  it("is shallow on purpose, and styles no layout", () => {
    expect(light).not.toContain("display: flex");
    expect(light).not.toContain("padding:");
    expect(light).not.toContain("!important");
  });
});

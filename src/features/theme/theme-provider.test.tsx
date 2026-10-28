import { colors, composePalette } from "./colors";

describe("theme provider configuration", () => {
  it("keeps core palettes unchanged without overrides", () => {
    expect(composePalette()).toEqual(colors);
  });

  it("layers partial overrides over immutable core values in both schemes", () => {
    const palette = composePalette({
      light: { primary: "#123456" },
      dark: { primary: "#abcdef" },
    });

    expect(palette.light.primary).toBe("#123456");
    expect(palette.dark.primary).toBe("#abcdef");
    expect(palette.light.background).toBe(colors.light.background);
    expect(palette.dark.background).toBe(colors.dark.background);
    expect(colors.light.primary).not.toBe("#123456");
    expect(colors.dark.primary).not.toBe("#abcdef");
  });
});

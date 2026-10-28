import { BREAKPOINT_ORDER } from "./breakpoint";
import { resolveResponsive } from "./responsive-value";

describe("BREAKPOINT_ORDER", () => {
  it("runs narrowest to widest, with phone first", () => {
    expect(BREAKPOINT_ORDER).toEqual([
      "phone",
      "foldable",
      "tablet",
      "desktop",
    ]);
  });
});

describe("resolveResponsive", () => {
  it("passes a plain value through at every breakpoint", () => {
    for (const breakpoint of BREAKPOINT_ORDER) {
      expect(resolveResponsive(4, breakpoint, 1)).toBe(4);
    }
  });

  it("uses a breakpoint's own entry when it has one", () => {
    const value = { phone: 1, foldable: 2, tablet: 3, desktop: 4 };

    expect(BREAKPOINT_ORDER.map((b) => resolveResponsive(value, b, 0))).toEqual(
      [1, 2, 3, 4],
    );
  });

  // The mobile-first rule: a map only names the widths where something
  // actually changes, and everything above inherits.
  it("cascades upward from the nearest narrower entry", () => {
    const value = { phone: 12, tablet: 6 };

    expect(BREAKPOINT_ORDER.map((b) => resolveResponsive(value, b, 0))).toEqual(
      [12, 12, 6, 6],
    );
  });

  it("never cascades downward — falls back when nothing is defined below", () => {
    const value = { desktop: 4 };

    expect(resolveResponsive(value, "phone", 99)).toBe(99);
    expect(resolveResponsive(value, "tablet", 99)).toBe(99);
    expect(resolveResponsive(value, "desktop", 99)).toBe(4);
  });

  it("treats an object whose keys aren't breakpoints as the value itself", () => {
    // Otherwise a responsive *style* value would be mistaken for a map.
    const style = { fontSize: 12 };

    expect(resolveResponsive(style, "tablet", { fontSize: 0 })).toBe(style);
  });

  it("handles a value that is legitimately falsy", () => {
    expect(resolveResponsive({ phone: 0 }, "desktop", 9)).toBe(0);
    expect(resolveResponsive(0, "phone", 9)).toBe(0);
  });
});

import { getBreakpoint } from "./breakpoint";

describe("getBreakpoint", () => {
  it("classifies a phone width", () => {
    expect(getBreakpoint(375)).toBe("phone");
  });

  it("classifies an unfolded foldable width", () => {
    expect(getBreakpoint(717)).toBe("foldable");
  });

  it("classifies a tablet width", () => {
    expect(getBreakpoint(1024)).toBe("tablet");
  });

  it("classifies a desktop width", () => {
    expect(getBreakpoint(1440)).toBe("desktop");
  });

  it("treats each threshold boundary as the wider category", () => {
    expect(getBreakpoint(599)).toBe("phone");
    expect(getBreakpoint(600)).toBe("foldable");
    expect(getBreakpoint(767)).toBe("foldable");
    expect(getBreakpoint(768)).toBe("tablet");
    expect(getBreakpoint(1279)).toBe("tablet");
    expect(getBreakpoint(1280)).toBe("desktop");
  });
});

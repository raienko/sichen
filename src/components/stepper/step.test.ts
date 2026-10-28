import { canStep, clamp, nextValue } from "./step";

describe("nextValue", () => {
  it("moves by the step", () => {
    expect(nextValue(2, 1, 0, 10)).toBe(3);
    expect(nextValue(2, -1, 0, 10)).toBe(1);
  });

  it("stops at the bounds", () => {
    expect(nextValue(10, 1, 0, 10)).toBe(10);
    expect(nextValue(0, -1, 0, 10)).toBe(0);
  });

  it("clamps a value that starts outside the range", () => {
    expect(nextValue(50, 1, 0, 10)).toBe(10);
    expect(nextValue(-50, -1, 0, 10)).toBe(0);
  });

  // The whole reason this isn't written inline at the call site.
  it("does not leak floating-point noise", () => {
    expect(nextValue(0.1, 0.2, 0, 1)).toBe(0.3);
    expect(nextValue(0.3, -0.1, 0, 1)).toBe(0.2);
    expect(nextValue(1.005, 0.001, 0, 2)).toBe(1.006);
  });

  it("keeps the precision of a very small step", () => {
    expect(nextValue(0, 1e-7, 0, 1)).toBe(1e-7);
  });

  // A stepper is controlled: an off-grid value is the caller's business,
  // and rewriting it would mean disagreeing with the state we were handed.
  it("moves an off-grid value rather than snapping it", () => {
    expect(nextValue(2.5, 1, 0, 10)).toBe(3.5);
  });

  it("takes a negative range", () => {
    expect(nextValue(-5, -1, -10, 0)).toBe(-6);
    expect(nextValue(-10, -1, -10, 0)).toBe(-10);
  });

  it("respects a min that is finer than the step", () => {
    expect(nextValue(0.5, 1, 0.5, 10)).toBe(1.5);
  });
});

describe("canStep", () => {
  it("is true while there is room to move", () => {
    expect(canStep(2, 1, 0, 10)).toBe(true);
    expect(canStep(2, -1, 0, 10)).toBe(true);
  });

  it("is false at the limit it would cross", () => {
    expect(canStep(10, 1, 0, 10)).toBe(false);
    expect(canStep(0, -1, 0, 10)).toBe(false);
  });

  // Landing exactly on the bound is still a move worth allowing.
  it("is true for a step that lands on the bound", () => {
    expect(canStep(9, 1, 0, 10)).toBe(true);
  });

  // Over-stepping is clamped rather than refused: 9 + 5 in a 0..10 range
  // gets you to 10, which is a change and so worth a press.
  it("is true for a step that would overshoot", () => {
    expect(canStep(9, 5, 0, 10)).toBe(true);
  });

  it("is false for a zero-width range", () => {
    expect(canStep(5, 1, 5, 5)).toBe(false);
    expect(canStep(5, -1, 5, 5)).toBe(false);
  });
});

describe("clamp", () => {
  it("holds a value inside the range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

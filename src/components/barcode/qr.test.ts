import { QR_QUIET_ZONE, encodeQr } from "./qr";

describe("encodeQr", () => {
  it("encodes a value into a square matrix", () => {
    const matrix = encodeQr("https://example.com/order/12")!;

    expect(matrix.size).toBeGreaterThan(0);
    expect(matrix.path.length).toBeGreaterThan(0);
  });

  // A scanner finds the symbol by its blank border, so a code drawn flush
  // to its container frequently will not read at all.
  it("reserves the quiet zone on every side", () => {
    const matrix = encodeQr("hello")!;

    expect(matrix.extent).toBe(matrix.size + QR_QUIET_ZONE * 2);
  });

  it("offsets every module into the quiet zone", () => {
    const matrix = encodeQr("hello")!;
    const coordinates = [...matrix.path.matchAll(/M(\d+) (\d+)/g)].flatMap(
      ([, x, y]) => [Number(x), Number(y)],
    );

    expect(Math.min(...coordinates)).toBeGreaterThanOrEqual(QR_QUIET_ZONE);
    expect(Math.max(...coordinates)).toBeLessThan(
      matrix.extent - QR_QUIET_ZONE,
    );
  });

  // Up to three thousand modules, half of them dark: that many <Rect>
  // nodes is a lot to reconcile, and one <Path> is one node.
  it("draws every module as a subpath of a single path", () => {
    const matrix = encodeQr("hello")!;
    const subpaths = matrix.path.match(/M/g) ?? [];

    expect(subpaths.length).toBeGreaterThan(10);
    expect(matrix.path.startsWith("M")).toBe(true);
  });

  it("is deterministic for the same input", () => {
    expect(encodeQr("hello")).toEqual(encodeQr("hello"));
  });

  it("produces a different symbol for different input", () => {
    expect(encodeQr("hello")!.path).not.toBe(encodeQr("world")!.path);
  });

  // Type 0 asks for the smallest symbol the data fits, so a short URL is
  // not drawn at the density of a long one.
  it("grows the grid with the data", () => {
    const short = encodeQr("hi")!;
    const long = encodeQr("x".repeat(500))!;

    expect(long.size).toBeGreaterThan(short.size);
  });

  // Higher correction spends more modules on redundancy, so the same
  // string needs a denser grid.
  it("grows the grid with the correction level", () => {
    const low = encodeQr("a".repeat(100), "L")!;
    const high = encodeQr("a".repeat(100), "H")!;

    expect(high.size).toBeGreaterThan(low.size);
  });

  /**
   * Nothing drawn beats a code that scans as the wrong thing — the caller
   * renders its fallback instead.
   */
  describe("what it will not encode", () => {
    it("declines an empty string", () => {
      expect(encodeQr("")).toBeNull();
    });

    it("declines data past what the largest symbol holds", () => {
      expect(encodeQr("x".repeat(10000))).toBeNull();
    });
  });
});

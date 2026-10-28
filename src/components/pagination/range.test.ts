import { GAP, clampPage, paginationRange } from "./range";

/** Renders a range as a readable string, so the tests say what they mean. */
function shape(value: number, total: number, siblings?: number): string {
  return paginationRange(value, total, siblings)
    .map((item) => (item === GAP ? "…" : String(item)))
    .join(" ");
}

describe("paginationRange", () => {
  it("shows every page when they all fit", () => {
    expect(shape(1, 5)).toBe("1 2 3 4 5");
    expect(shape(4, 7)).toBe("1 2 3 4 5 6 7");
  });

  it("has nothing to show for no pages", () => {
    expect(paginationRange(1, 0)).toEqual([]);
  });

  it("shows a single page", () => {
    expect(shape(1, 1)).toBe("1");
  });

  describe("once there are more pages than slots", () => {
    it("runs from the start, then one gap and the last page", () => {
      expect(shape(1, 20)).toBe("1 2 3 4 5 … 20");
      expect(shape(3, 20)).toBe("1 2 3 4 5 … 20");
    });

    it("puts the current page between two gaps in the middle", () => {
      expect(shape(10, 20)).toBe("1 … 9 10 11 … 20");
    });

    it("runs to the end, after the first page and one gap", () => {
      expect(shape(20, 20)).toBe("1 … 16 17 18 19 20");
      expect(shape(18, 20)).toBe("1 … 16 17 18 19 20");
    });

    /**
     * A bar that reflows under the cursor moves the button you were about
     * to press — the same class of problem tabular figures solve for
     * `Timer`.
     */
    it("keeps the same number of slots at every position", () => {
      const widths = Array.from(
        { length: 20 },
        (_, index) => paginationRange(index + 1, 20).length,
      );

      expect(new Set(widths).size).toBe(1);
      expect(widths[0]).toBe(7);
    });

    // An ellipsis standing in for a single page takes the same room and
    // tells the reader less.
    it("never draws a gap that hides only one page", () => {
      for (let page = 1; page <= 12; page++) {
        const items = paginationRange(page, 12);
        items.forEach((item, index) => {
          if (item !== GAP) return;
          const before = items[index - 1] as number;
          const after = items[index + 1] as number;
          expect(after - before).toBeGreaterThan(2);
        });
      }
    });

    it("always keeps the first and last page reachable", () => {
      for (let page = 1; page <= 20; page++) {
        const items = paginationRange(page, 20);
        expect(items[0]).toBe(1);
        expect(items[items.length - 1]).toBe(20);
      }
    });

    it("always contains the current page", () => {
      for (let page = 1; page <= 20; page++) {
        expect(paginationRange(page, 20)).toContain(page);
      }
    });
  });

  describe("siblings", () => {
    it("narrows to the current page alone at zero", () => {
      expect(shape(10, 20, 0)).toBe("1 … 10 … 20");
    });

    it("widens the window", () => {
      expect(shape(10, 20, 2)).toBe("1 … 8 9 10 11 12 … 20");
    });

    it("treats a negative window as zero", () => {
      expect(shape(10, 20, -3)).toBe(shape(10, 20, 0));
    });
  });

  describe("input it should survive rather than trust", () => {
    it("clamps a page past the end", () => {
      expect(shape(99, 5)).toBe("1 2 3 4 5");
      expect(paginationRange(99, 20)).toContain(20);
    });

    it("clamps a page before the start", () => {
      expect(paginationRange(0, 20)).toContain(1);
      expect(paginationRange(-4, 20)).toContain(1);
    });

    it("floors a fractional page and count", () => {
      expect(shape(2.7, 5.9)).toBe("1 2 3 4 5");
    });
  });
});

describe("clampPage", () => {
  it("keeps a page inside the range", () => {
    expect(clampPage(0, 10)).toBe(1);
    expect(clampPage(11, 10)).toBe(10);
    expect(clampPage(5, 10)).toBe(5);
  });

  it("treats an empty range as one page", () => {
    expect(clampPage(3, 0)).toBe(1);
  });
});

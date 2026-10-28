import {
  atEdges,
  clampScale,
  clampTranslation,
  fittedSize,
  MAX_SCALE,
  panLimits,
  zoomAbout,
} from "./zoom";

const PAGE = { width: 400, height: 800 };

describe("zoom geometry", () => {
  it("keeps scale between 1 and the maximum", () => {
    expect(clampScale(0.5)).toBe(1);
    expect(clampScale(2)).toBe(2);
    expect(clampScale(10)).toBe(MAX_SCALE);
  });

  it("fits a landscape picture to the page's width", () => {
    expect(fittedSize(PAGE, 2)).toEqual({ width: 400, height: 200 });
  });

  it("fits a tall picture to the page's height", () => {
    expect(fittedSize(PAGE, 0.25)).toEqual({ width: 200, height: 800 });
  });

  it("uses the whole page until the picture's size is known", () => {
    expect(fittedSize(PAGE)).toEqual(PAGE);
  });

  it("allows no movement at scale 1", () => {
    expect(panLimits(PAGE, PAGE, 1)).toEqual({ x: 0, y: 0 });
  });

  it("allows movement only along an axis that has outgrown the page", () => {
    // 400×200 at 2× is 800×400: wider than the page, still shorter than it.
    expect(panLimits(PAGE, { width: 400, height: 200 }, 2)).toEqual({
      x: 200,
      y: 0,
    });
  });

  it("pulls a translation back inside the picture's edges", () => {
    expect(clampTranslation({ x: 900, y: -900 }, PAGE, PAGE, 2)).toEqual({
      x: 200,
      y: -400,
    });
  });

  it("zooms about the focal point, not the centre", () => {
    // Doubling about a point 100 to the right moves the picture 100 left,
    // so the spot under the fingers stays put.
    expect(zoomAbout({ x: 100, y: 0 }, { x: 0, y: 0 }, 1, 2)).toEqual({
      x: -100,
      y: 0,
    });
  });

  it("composes with an existing translation", () => {
    expect(zoomAbout({ x: 0, y: 0 }, { x: 50, y: 20 }, 2, 4)).toEqual({
      x: 100,
      y: 40,
    });
  });

  it("knows when a zoomed picture is against an edge", () => {
    expect(atEdges(200, PAGE, PAGE, 2)).toEqual({ start: true, end: false });
    expect(atEdges(-200, PAGE, PAGE, 2)).toEqual({ start: false, end: true });
    expect(atEdges(0, PAGE, PAGE, 2)).toEqual({ start: false, end: false });
    expect(atEdges(0, PAGE, PAGE, 1)).toEqual({ start: true, end: true });
  });
});

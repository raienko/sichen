import { DEFAULT_ZOOM, resolveView, viewKey } from "./view";

const LISBON = { latitude: 38.7223, longitude: -9.1393 };
const PORTO = { latitude: 41.1579, longitude: -8.6291 };

describe("resolveView", () => {
  it("goes where it's told when given a center", () => {
    expect(resolveView({ center: LISBON, zoom: 10, points: [PORTO] })).toEqual({
      kind: "center",
      center: LISBON,
      zoom: 10,
    });
  });

  it("fits every point otherwise", () => {
    expect(resolveView({ points: [LISBON, PORTO] })).toEqual({
      kind: "bounds",
      bounds: [-9.1393, 38.7223, -8.6291, 41.1579],
    });
  });

  it("centres on a single point instead of fitting zero-size bounds", () => {
    expect(resolveView({ points: [LISBON] })).toEqual({
      kind: "center",
      center: LISBON,
      zoom: DEFAULT_ZOOM,
    });
  });

  it("shows the world when there's nothing to show", () => {
    expect(resolveView({ points: [] })).toEqual({ kind: "world" });
  });

  it("gives equal views equal keys, so the camera only moves on a real change", () => {
    expect(viewKey(resolveView({ points: [LISBON, PORTO] }))).toBe(
      viewKey(resolveView({ points: [LISBON, PORTO] })),
    );
  });
});

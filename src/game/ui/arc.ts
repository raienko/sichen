/** Gap between neighbouring circles in an arc, in points. */
const ARC_GAP = 6;

/**
 * Where `count` small circles sit on one circle around a big one (Ready in
 * battle, the context action in the world). The big circle's centre is the
 * origin and y grows downwards. The first small circle sits at the lower
 * left, its bottom level with the big one's; the rest run up over the top,
 * the last no further round than `endDegrees` (270 is straight up). The
 * circle grows until they fit without touching.
 */
export function arcLayout(
  small: number,
  big: number,
  count = 4,
  endDegrees = 285,
) {
  const end = (endDegrees * Math.PI) / 180;
  const dy = big / 2 - small / 2;
  let radius = Math.hypot(big / 2 + ARC_GAP + small / 2, dy);
  let angles: number[] = [];
  for (let i = 0; i < 200; i++) {
    const first = Math.atan2(dy, -Math.sqrt(radius * radius - dy * dy));
    const step = 2 * Math.asin(Math.min(1, (small + ARC_GAP) / (2 * radius)));
    angles = Array.from({ length: count }, (_, k) => first + k * step);
    if (angles[count - 1]! <= end) break;
    radius += 2;
  }
  const points = angles.map((a) => ({
    x: radius * Math.cos(a),
    y: radius * Math.sin(a),
  }));
  // The box around the big circle and every small one.
  const r = small / 2;
  const left = Math.min(-big / 2, ...points.map((p) => p.x - r));
  const right = Math.max(big / 2, ...points.map((p) => p.x + r));
  const top = Math.min(-big / 2, ...points.map((p) => p.y - r));
  const bottom = big / 2;
  return {
    width: right - left,
    height: bottom - top,
    centre: { x: -left, y: -top },
    points,
  };
}

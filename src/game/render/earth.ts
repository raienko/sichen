import * as THREE from "three";

/**
 * Earth banks (town ramparts, the Golden Gates' ramparts) faceted and
 * coloured like the ground they rise from (see nature.tsx): small facets
 * nudged in and out, each a shade lighter or darker than the zone's ground
 * colour, so a bank reads as the land heaped up rather than a green box.
 */

/** A repeatable 0-1 number, as the ground uses. */
function rand(x: number, z: number, salt: number): number {
  const n = Math.sin(x * 127.1 + z * 311.7 + salt * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

/** About how long a facet's side is, in world units. */
const FACET = 1;
/** How far a facet corner may stand in or out of the bank's face. */
const BUMP = 0.14;

/**
 * A bank `length` long along x, centred, with the given section: points in
 * (z, y), running from one foot over the crest to the other, both feet at
 * y 0. The ends are closed. Corners on the two ends are not nudged, so
 * banks laid end to end meet without a seam; `seed` picks the pattern.
 * Carries a vertex colour per facet: draw it with `vertexColors`.
 */
export function earthBank({
  length,
  section,
  ground,
  seed = 0,
}: {
  length: number;
  section: readonly (readonly [number, number])[];
  ground: number;
  seed?: number;
}): THREE.BufferGeometry {
  const hsl = { h: 0, s: 0, l: 0 };
  new THREE.Color(ground).getHSL(hsl);
  const positions: number[] = [];
  const colors: number[] = [];
  const shade = (r: number) =>
    new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l + (r - 0.5) * 0.07);
  const tri = (
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
    color: THREE.Color,
  ) => {
    for (const p of [a, b, c]) {
      positions.push(p.x, p.y, p.z);
      colors.push(color.r, color.g, color.b);
    }
  };

  const nu = Math.max(1, Math.round(length / FACET));
  // One strip of facets per face of the section.
  for (let f = 0; f + 1 < section.length; f++) {
    const [z0, y0] = section[f]!;
    const [z1, y1] = section[f + 1]!;
    const nv = Math.max(1, Math.round(Math.hypot(z1 - z0, y1 - y0) / FACET));
    // The face's outward normal in (z, y): the section runs over the top.
    const nz = -(y1 - y0);
    const ny = z1 - z0;
    const nl = Math.hypot(nz, ny) || 1;
    const corner = (i: number, j: number) => {
      const t = j / nv;
      const p = new THREE.Vector3(
        -length / 2 + (length * i) / nu,
        y0 + (y1 - y0) * t,
        z0 + (z1 - z0) * t,
      );
      // Inner corners only: the ends, the feet and the face's edges stay
      // put so faces, ends and neighbours still meet.
      if (i > 0 && i < nu && j > 0 && j < nv) {
        const k = (rand(i, j + f * 31, seed) - 0.5) * 2 * BUMP;
        p.z += (nz / nl) * k;
        p.y += (ny / nl) * k;
      }
      return p;
    };
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        const a = corner(i, j);
        const b = corner(i + 1, j);
        const c = corner(i, j + 1);
        const d = corner(i + 1, j + 1);
        const r1 = rand(i, j + f * 31, seed + 7);
        const r2 = rand(i, j + f * 31, seed + 11);
        // Alternate the diagonal, as the ground does.
        if (rand(i, j + f * 31, seed + 3) < 0.5) {
          tri(a, c, b, shade(r1));
          tri(b, c, d, shade(r2));
        } else {
          tri(a, c, d, shade(r1));
          tri(a, d, b, shade(r2));
        }
      }
  }
  // Close both ends with a fan over the section.
  for (const side of [-1, 1]) {
    const x = (side * length) / 2;
    const color = shade(rand(side, 0, seed + 13));
    const pts = section.map(([z, y]) => new THREE.Vector3(x, y, z));
    for (let k = 1; k + 1 < pts.length; k++) {
      if (side > 0) tri(pts[0]!, pts[k]!, pts[k + 1]!, color);
      else tri(pts[0]!, pts[k + 1]!, pts[k]!, color);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * A round of earth, a frustum `bottom` wide at the foot and `top` at the
 * crest, `height` high, standing on y 0: where banks meet at an angle.
 */
export function earthMound({
  top,
  bottom,
  height,
  ground,
  seed = 0,
}: {
  top: number;
  bottom: number;
  height: number;
  ground: number;
  seed?: number;
}): THREE.BufferGeometry {
  const hsl = { h: 0, s: 0, l: 0 };
  new THREE.Color(ground).getHSL(hsl);
  const geometry = new THREE.CylinderGeometry(
    top,
    bottom,
    height,
    8,
    Math.max(1, Math.round(height / FACET)),
  ).toNonIndexed();
  geometry.translate(0, height / 2, 0);
  geometry.deleteAttribute("uv");
  const count = geometry.attributes.position!.count;
  const colors = new Float32Array(count * 3);
  const c = new THREE.Color();
  for (let t = 0; t < count / 3; t++) {
    c.setHSL(hsl.h, hsl.s, hsl.l + (rand(t, 0, seed + 17) - 0.5) * 0.07);
    for (let k = 0; k < 3; k++) c.toArray(colors, (t * 3 + k) * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

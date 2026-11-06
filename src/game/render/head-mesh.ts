import * as THREE from "three";

/**
 * A sculpted low-poly head, made in code: an icosphere pushed into a skull,
 * a heavy brow ridge over deep-set eyes, a strong nose, cheekbones, a square
 * jaw and chin (softer and smaller for her). Drawn flat-shaded, its facets
 * catch the light like a hand-made low-poly model.
 *
 * Built in the head's own frame (see Head in art-kit): the skull's centre is
 * at (0, CY, CZ), the eyes level with it.
 */
export const CY = 1.48;
export const CZ = -0.01;

const gauss = (d: number, w: number) => Math.exp(-(d * d) / (w * w));
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

type Sculpt = {
  brow: number;
  nose: number;
  noseWidth: number;
  chin: number;
  jaw: number;
  jawForward: number;
  /** How wide the chin is, and how much longer the lower face. */
  chinWidth: number;
  lowerFace: number;
  cheek: number;
};

const HIM: Sculpt = {
  brow: 0.016,
  nose: 0.046,
  noseWidth: 0.02,
  chin: 0.042,
  jaw: 0.15,
  jawForward: 0.06,
  chinWidth: 0.065,
  lowerFace: 0.1,
  cheek: 0.012,
};
const HER: Sculpt = {
  brow: 0.006,
  nose: 0.03,
  noseWidth: 0.016,
  chin: 0.016,
  jaw: 0.22,
  jawForward: 0.036,
  chinWidth: 0.045,
  lowerFace: 0.05,
  cheek: 0.012,
};

/** Where a point of the unit sphere goes on the sculpted head. */
function sculpt(d: THREE.Vector3, k: Sculpt): THREE.Vector3 {
  let X = d.x * 0.165;
  let Y = d.y * 0.2;
  let Z = d.z * 0.178;
  const front = smooth(0.15, 0.85, d.z);
  if (Y < 0) {
    // The lower face is longer and narrows to the jaw and chin; the back of
    // the lower head tucks in towards the neck.
    const t = Math.min(1, -Y / 0.2);
    Y *= 1 + k.lowerFace * t;
    X *= 1 - k.jaw * t * t;
    if (Z < 0) Z *= 1 - 0.35 * t;
  }
  // A square chin, wide for him.
  X *= 1 + (k.jaw < 0.18 ? 0.16 : 0.03) * gauss(Y + 0.18, 0.05);
  // Flat temples.
  X *= 1 - 0.05 * gauss(Y - 0.06, 0.05);
  const ax = Math.abs(X);
  // The brow ridge over the eyes, and the sockets under it.
  Z +=
    k.brow *
    front *
    gauss(Y - 0.045, 0.022) *
    (0.6 + 0.4 * gauss(ax - 0.06, 0.05));
  Z -= 0.012 * front * gauss(Y - 0.002, 0.024) * gauss(ax - 0.062, 0.03);
  // The nose: a bridge from between the eyes to a tip over the mouth.
  const bridge =
    Y > 0.025 ? 0 : Y > -0.068 ? (0.025 - Y) / 0.093 : gauss(Y + 0.068, 0.014);
  Z += k.nose * front * gauss(X, k.noseWidth + 0.01 * bridge) * bridge;
  // Cheekbones out and forward, the cheek hollow under them.
  const cheek = gauss(ax - 0.095, 0.035) * gauss(Y + 0.03, 0.03);
  X += Math.sign(X) * k.cheek * cheek;
  Z += 0.01 * front * cheek;
  Z -= 0.01 * front * gauss(ax - 0.085, 0.03) * gauss(Y + 0.1, 0.03);
  // Lips a little forward, and the chin.
  Z += 0.012 * front * gauss(X, 0.04) * gauss(Y + 0.125, 0.025);
  // The lower face comes forward under the mouth to a real chin, seen
  // in profile; its underside is flattened into a jaw line.
  const low = smooth(-0.1, 0.45, d.z);
  Z += k.jawForward * low * smooth(-0.06, -0.16, Y) * gauss(X, 0.075);
  Z += k.chin * low * gauss(X, k.chinWidth) * gauss(Y + 0.19, 0.035);
  const floor = -0.19 - k.lowerFace * 0.1;
  if (Y < floor) Y = floor + (Y - floor) * 0.4;
  return new THREE.Vector3(X, Y + CY, Z + CZ);
}

function build(k: Sculpt): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(1, 3);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const s = sculpt(v, k);
    p.setXYZ(i, s.x, s.y, s.z);
  }
  g.computeVertexNormals();
  return g;
}

/**
 * The faces of a head whose centre passes a test, pushed out from the
 * skull's centre: a crop of hair, the oseledets' tuft.
 */
function shell(
  head: THREE.BufferGeometry,
  keep: (c: THREE.Vector3) => boolean,
  grow: number,
): THREE.BufferGeometry {
  const p = head.attributes.position as THREE.BufferAttribute;
  const out: number[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const centre = new THREE.Vector3(0, CY, CZ);
  const mid = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i);
    b.fromBufferAttribute(p, i + 1);
    c.fromBufferAttribute(p, i + 2);
    mid.copy(a).add(b).add(c).divideScalar(3);
    if (!keep(mid)) continue;
    for (const q of [a, b, c]) {
      q.sub(centre).multiplyScalar(grow).add(centre);
      out.push(q.x, q.y, q.z);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
  g.computeVertexNormals();
  return g;
}

/**
 * How far forward the sculpted face is at a point of it, to set eyes and
 * brows on: the surface over (x, y), found by sampling the front of the
 * sphere finely and taking the nearest sample.
 */
function frontAt(k: Sculpt, x: number, y: number): number {
  const d = new THREE.Vector3();
  let best = Infinity;
  let z = 0;
  for (let i = 0; i <= 120; i++) {
    for (let j = 0; j <= 120; j++) {
      const lon = ((i / 120) * 2 - 1) * 1.2;
      const lat = ((j / 120) * 2 - 1) * 1.3;
      d.set(
        Math.sin(lon) * Math.cos(lat),
        Math.sin(lat),
        Math.cos(lon) * Math.cos(lat),
      );
      const s = sculpt(d, k);
      const e = (s.x - x) ** 2 + (s.y - y) ** 2;
      if (e < best) {
        best = e;
        z = s.z;
      }
    }
  }
  return z;
}

const him = build(HIM);
const her = build(HER);

/** The hair over the top and back of the head, from the brow line up. */
const scalp = (c: THREE.Vector3) =>
  c.y > CY + 0.1 - 0.11 * smooth(0.05, -0.12, c.z - CZ) ||
  (c.z < CZ - 0.04 && c.y > CY - 0.02);

export const HEADS = {
  him,
  her,
  /** The oseledets' root: a small tuft on the crown of the bare head. */
  crest: shell(
    him,
    (c) =>
      Math.abs(c.x) < 0.045 &&
      c.y > CY + 0.15 &&
      c.z > CZ - 0.09 &&
      c.z < CZ + 0.03,
    1.06,
  ),
  /** Short hair over the top and back of the head. */
  crop: shell(him, scalp, 1.05),
};

/** The face's front at a point, his or hers, for setting features on. */
export const FACE = {
  him: (x: number, y: number) => frontAt(HIM, x, y),
  her: (x: number, y: number) => frontAt(HER, x, y),
};

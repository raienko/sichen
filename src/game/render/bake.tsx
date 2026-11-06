import {
  memo,
  useLayoutEffect,
  useRef,
  type ComponentType,
  type ReactNode,
} from "react";
import * as THREE from "three";

/**
 * Batches a code-built model's many small meshes into a few. The art kit
 * builds every figure and building from dozens of primitives, each its own
 * mesh and material: a town square was about a thousand draw calls, which
 * cost more than everything else on screen. After the model mounts, its
 * meshes are merged, per moving part and per kind of material, into one
 * mesh each with the colours baked into the vertices. A hero ends up as
 * about a dozen draw calls instead of a hundred and fifty.
 *
 * Parts that move on their own (limbs, the weapon, a flask that shows and
 * hides) must be marked with `useMarkMoving` so they stay separate: a mesh
 * is merged into its nearest marked ancestor, or the model's root.
 */

/** Marks a group the frame loop moves, turns or hides; see `useMarkMoving`. */
const MOVES = "moves";

/**
 * Marks the groups a model moves on its own every frame (limbs, a held
 * weapon, a flask that shows and hides), so `Baked` keeps their meshes
 * apart from the rest of the model and they still move. Call it in the
 * model with the groups' refs.
 */
export function useMarkMoving(
  ...refs: readonly { readonly current: THREE.Object3D | null }[]
) {
  // A child's layout effects run before its parent's, so the marks are in
  // place by the time the enclosing Baked merges.
  useLayoutEffect(() => {
    for (const ref of refs) if (ref.current) ref.current.userData[MOVES] = true;
  });
}

/** The material settings that must match for two meshes to merge. */
function materialKey(m: THREE.Material): string | null {
  const any = m as THREE.Material & {
    map?: unknown;
    color?: THREE.Color;
    emissive?: THREE.Color;
    emissiveIntensity?: number;
    flatShading?: boolean;
    wireframe?: boolean;
    fog?: boolean;
  };
  // Textures and shader patches would need more than a vertex colour.
  if (any.map || m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile)
    return null;
  return [
    m.type,
    m.side,
    m.transparent,
    m.opacity,
    m.depthWrite,
    m.depthTest,
    m.blending,
    m.alphaTest,
    m.toneMapped,
    m.polygonOffset,
    any.flatShading,
    any.wireframe,
    any.fog,
    any.emissive?.getHex(),
    any.emissiveIntensity,
  ].join("|");
}

type Piece = { mesh: THREE.Mesh; matrix: THREE.Matrix4 };

/**
 * One mesh's triangles, in the anchor's space, as flat position, normal
 * and colour arrays, wound the right way even under a mirroring scale.
 */
function flatten({ mesh, matrix }: Piece) {
  const source = mesh.geometry.index
    ? mesh.geometry.toNonIndexed()
    : mesh.geometry.clone();
  for (const name of Object.keys(source.attributes))
    if (name !== "position" && name !== "normal" && name !== "color")
      source.deleteAttribute(name);
  if (!source.attributes.normal) source.computeVertexNormals();
  source.applyMatrix4(matrix);
  const material = mesh.material as THREE.MeshLambertMaterial;
  const tint = material.color ?? new THREE.Color(1, 1, 1);
  const position = source.attributes.position!;
  const normal = source.attributes.normal!;
  const own = material.vertexColors ? source.attributes.color : undefined;
  const count = position.count;
  const p = new Float32Array(count * 3);
  const n = new Float32Array(count * 3);
  const c = new Float32Array(count * 3);
  // A mirrored part's triangles turn inside out unless rewound.
  const flip =
    matrix.determinant() < 0 && material.side !== THREE.DoubleSide ? 1 : 0;
  for (let i = 0; i < count; i++) {
    // Swap each triangle's second and third corners when flipping.
    const k = i % 3;
    const from = flip && k > 0 ? i + (k === 1 ? 1 : -1) : i;
    p[i * 3] = position.getX(from);
    p[i * 3 + 1] = position.getY(from);
    p[i * 3 + 2] = position.getZ(from);
    n[i * 3] = normal.getX(from);
    n[i * 3 + 1] = normal.getY(from);
    n[i * 3 + 2] = normal.getZ(from);
    c[i * 3] = tint.r * (own ? own.getX(from) : 1);
    c[i * 3 + 1] = tint.g * (own ? own.getY(from) : 1);
    c[i * 3 + 2] = tint.b * (own ? own.getZ(from) : 1);
  }
  source.dispose();
  return { p, n, c };
}

function merge(pieces: Piece[]): THREE.Mesh {
  const parts = pieces.map(flatten);
  const size = parts.reduce((sum, part) => sum + part.p.length, 0);
  const p = new Float32Array(size);
  const n = new Float32Array(size);
  const c = new Float32Array(size);
  let at = 0;
  for (const part of parts) {
    p.set(part.p, at);
    n.set(part.n, at);
    c.set(part.c, at);
    at += part.p.length;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(p, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(n, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(c, 3));
  geometry.computeBoundingSphere();
  const material = (
    pieces[0]!.mesh.material as THREE.MeshLambertMaterial
  ).clone();
  material.vertexColors = true;
  if (material.color) material.color.set(0xffffff);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "baked";
  return mesh;
}

/** The mesh's nearest moving ancestor, or null if a hidden one comes first. */
function anchorOf(mesh: THREE.Mesh, root: THREE.Object3D) {
  for (let o = mesh.parent; o; o = o.parent) {
    if (o === root || o.userData[MOVES]) return o;
    if (!o.visible) return null;
  }
  return null;
}

/** Merges what it can under `root`; returns how to undo it. */
function bake(root: THREE.Object3D): () => void {
  root.updateMatrixWorld(true);
  const groups = new Map<THREE.Object3D, Map<string, Piece[]>>();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (
      !mesh.isMesh ||
      (mesh as THREE.InstancedMesh).isInstancedMesh ||
      (mesh as unknown as THREE.SkinnedMesh).isSkinnedMesh ||
      !mesh.visible ||
      mesh.children.length > 0 ||
      mesh.renderOrder !== 0 ||
      Array.isArray(mesh.material) ||
      mesh.userData[MOVES]
    )
      return;
    const key = materialKey(mesh.material);
    const anchor = key === null ? null : anchorOf(mesh, root);
    if (key === null || !anchor) return;
    const matrix = anchor.matrixWorld
      .clone()
      .invert()
      .multiply(mesh.matrixWorld);
    let byKey = groups.get(anchor);
    if (!byKey) groups.set(anchor, (byKey = new Map()));
    byKey.set(key, [...(byKey.get(key) ?? []), { mesh, matrix }]);
  });
  const removed: [THREE.Mesh, THREE.Object3D][] = [];
  const added: THREE.Mesh[] = [];
  for (const [anchor, byKey] of groups) {
    for (const pieces of byKey.values()) {
      // A lone mesh gains nothing from merging.
      if (pieces.length < 2) continue;
      const merged = merge(pieces);
      anchor.add(merged);
      added.push(merged);
      for (const { mesh } of pieces) {
        removed.push([mesh, mesh.parent!]);
        mesh.removeFromParent();
      }
    }
  }
  return () => {
    for (const mesh of added) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    for (const [mesh, parent] of removed) parent.add(mesh);
  };
}

/**
 * Draws its children batched (see above). The model must be fixed for a
 * given set of props: when they change, give `Baked` a new `key` so it
 * mounts and batches the new model afresh.
 */
export function Baked({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const root = ref.current;
    return root ? bake(root) : undefined;
  }, []);
  return <group ref={ref}>{children}</group>;
}

/** The props that shape a model; functions are read every frame instead. */
function shapeKey(props: object): string {
  return JSON.stringify(props, (_, v) =>
    typeof v === "function" ? undefined : v,
  );
}

/**
 * A model component, batched with `Baked` and rebuilt only when a prop
 * other than a function changes. Function props (`speed`, `action`) are
 * kept from the first render, so they must read refs or other live state
 * rather than close over values that change.
 */
export function baked<P extends object>(
  Model: ComponentType<P>,
): ComponentType<P> {
  const Inner = memo(Model, (a, b) => shapeKey(a) === shapeKey(b));
  function BakedModel(props: P) {
    return (
      <Baked key={shapeKey(props)}>
        <Inner {...props} />
      </Baked>
    );
  }
  BakedModel.displayName = `Baked(${Model.displayName ?? Model.name})`;
  return BakedModel;
}

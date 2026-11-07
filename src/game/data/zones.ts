import { Rng } from "../sim/rng";
import type { ZoneDef } from "../sim/types";

/**
 * Tile legend. Every tile is one square of the world grid; `x` is the
 * column, `z` the row.
 *
 *   .  ground          =  road (walkable)        ,  tall grass (walkable)
 *   #  tree            r  rock                   ~  water
 *   h  house           W  palisade wall          c  church
 *   T  wall tower (a town wall tile crowned by a tower)
 *   t  tent            f  campfire (walkable glow)
 *   g  Golden Gates    b  bell tower             m  market stall
 *   w  monastery wall (whitewashed stone)
 *
 * North is row 0, up the screen: towns follow the real map's layout.
 */
export const BLOCKING = new Set([
  "#",
  "T",
  "r",
  "~",
  "h",
  "W",
  "c",
  "t",
  "g",
  "b",
  "m",
  "w",
]);

/** A small drawing kit so the maps stay readable as code. */
class MapBuilder {
  private rows: string[][];

  constructor(
    readonly width: number,
    readonly height: number,
    fill = ".",
  ) {
    this.rows = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => fill),
    );
  }

  set(x: number, z: number, ch: string): this {
    const row = this.rows[z];
    if (row && x >= 0 && x < this.width) row[x] = ch;
    return this;
  }

  rect(x0: number, z0: number, x1: number, z1: number, ch: string): this {
    for (let z = z0; z <= z1; z++)
      for (let x = x0; x <= x1; x++) this.set(x, z, ch);
    return this;
  }

  border(ch: string, thickness = 1): this {
    for (let t = 0; t < thickness; t++) {
      this.rect(0, t, this.width - 1, t, ch);
      this.rect(
        0,
        this.height - 1 - t,
        this.width - 1,
        this.height - 1 - t,
        ch,
      );
      this.rect(t, 0, t, this.height - 1, ch);
      this.rect(this.width - 1 - t, 0, this.width - 1 - t, this.height - 1, ch);
    }
    return this;
  }

  /** Scatters a tile over ground tiles inside a box, deterministically. */
  scatter(
    ch: string,
    count: number,
    seed: number,
    box = { x0: 0, z0: 0, x1: this.width - 1, z1: this.height - 1 },
  ): this {
    const rng = new Rng(seed);
    for (let i = 0; i < count; i++) {
      const x = rng.int(box.x0, box.x1);
      const z = rng.int(box.z0, box.z1);
      if (this.rows[z]?.[x] === ".") this.set(x, z, ch);
    }
    return this;
  }

  /** Clears a walkable circle, for places packs and NPCs stand. */
  clear(cx: number, cz: number, radius: number, ch = "."): this {
    for (let z = cz - radius; z <= cz + radius; z++)
      for (let x = cx - radius; x <= cx + radius; x++)
        if ((x - cx) ** 2 + (z - cz) ** 2 <= radius * radius)
          this.set(x, z, ch);
    return this;
  }

  get(x: number, z: number): string | undefined {
    return this.rows[z]?.[x];
  }

  /**
   * A line of tiles between two points, straight or at exactly 45°: a
   * diagonal run steps corner to corner, which the town walls draw as one
   * slanting wall.
   */
  line(x0: number, z0: number, x1: number, z1: number, ch: string): this {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(z1 - z0));
    for (let i = 0; i <= n; i++)
      this.set(x0 + Math.sign(x1 - x0) * i, z0 + Math.sign(z1 - z0) * i, ch);
    return this;
  }

  /** A closed outline through the points, each leg straight or at 45°. */
  outline(points: readonly (readonly [number, number])[], ch: string): this {
    points.forEach(([x, z], i) => {
      const [nx, nz] = points[(i + 1) % points.length]!;
      this.line(x, z, nx, nz, ch);
    });
    return this;
  }

  /**
   * The tiles reachable from (x, z) without crossing `walls`, as "x,z"
   * keys: the outside of a closed outline, from a corner.
   */
  reach(x: number, z: number, walls: ReadonlySet<string>): Set<string> {
    const seen = new Set<string>();
    const stack: [number, number][] = [[x, z]];
    while (stack.length > 0) {
      const [cx, cz] = stack.pop()!;
      const key = `${cx},${cz}`;
      const ch = this.get(cx, cz);
      if (ch === undefined || seen.has(key) || walls.has(ch)) continue;
      seen.add(key);
      stack.push([cx + 1, cz], [cx - 1, cz], [cx, cz + 1], [cx, cz - 1]);
    }
    return seen;
  }

  build(): string[] {
    return this.rows.map((row) => row.join(""));
  }
}

/**
 * Kyiv's Upper Town, laid out north to south as on the real map: the road
 * from St. Andrew's hill (north) runs down Volodymyrska past Sophia Square
 * and the St. Sophia monastery, through a quarter of houses and gardens,
 * to the Golden Gates in the south rampart. The town wall is a star fort:
 * straight curtains between pointed bastions, a tower on every point.
 * Outside the gates a moat and a few huts, as in the old engravings; the
 * road out to the wilds leaves from there.
 */
export const KYIV = {
  width: 39,
  height: 60,
  /** The south rampart's row, and the road's column through the gates. */
  wallZ: 49,
  gateX: 14,
} as const;

/** The star fort's outline, clockwise from the north-west bastion. */
const KYIV_WALL: readonly (readonly [number, number])[] = [
  [5, 2],
  [8, 5],
  [16, 5],
  [19, 2],
  [22, 5],
  [30, 5],
  [33, 2],
  [36, 5],
  [33, 8],
  [33, 16],
  [36, 19],
  [33, 22],
  [33, 30],
  [36, 33],
  [33, 36],
  [33, 46],
  [36, 49],
  [33, 52],
  [30, 49],
  [8, 49],
  [5, 52],
  [2, 49],
  [5, 46],
  [5, 36],
  [2, 33],
  [5, 30],
  [5, 22],
  [2, 19],
  [5, 16],
  [5, 8],
  [2, 5],
];

/** The bastions' points, each crowned by a tower. */
const KYIV_TOWERS: readonly (readonly [number, number])[] = [
  [5, 2],
  [2, 5],
  [19, 2],
  [33, 2],
  [36, 5],
  [36, 19],
  [36, 33],
  [36, 49],
  [33, 52],
  [5, 52],
  [2, 49],
  [2, 33],
  [2, 19],
];

function kyivMap(): string[] {
  const { width, height, wallZ, gateX } = KYIV;
  const m = new MapBuilder(width, height);
  m.outline(KYIV_WALL, "W");
  for (const [x, z] of KYIV_TOWERS) m.set(x, z, "T");
  // Outside the walls: a cleared strip under them, then woods.
  const outside = m.reach(0, 0, new Set(["W", "T"]));
  const rng = new Rng(43);
  for (const key of outside) {
    const [x, z] = key.split(",").map(Number) as [number, number];
    let nearWall = false;
    for (let dz = -1; dz <= 1; dz++)
      for (let dx = -1; dx <= 1; dx++) {
        const ch = m.get(x + dx, z + dz);
        if (ch === "W" || ch === "T") nearWall = true;
      }
    m.set(x, z, nearWall || rng.next() < 0.25 ? "." : "#");
  }

  // Outside the gates: a moat between the southern bastions, huts, and
  // the road out through the woods.
  for (let x = 1; x < width - 1; x++)
    for (let z = wallZ + 2; z <= wallZ + 3; z++)
      if (outside.has(`${x},${z}`) && x > 5 && x < 33) m.set(x, z, "~");
  m.rect(gateX - 2, wallZ + 4, gateX + 2, height - 4, ".");
  m.rect(8, wallZ + 5, 10, wallZ + 6, "h").rect(
    19,
    wallZ + 5,
    21,
    wallZ + 6,
    "h",
  );
  m.rect(0, height - 3, width - 1, height - 1, "#");
  m.rect(gateX, wallZ - 1, gateX, height - 1, "=");

  // Streets. Volodymyrska climbs north from the gates, turns east below
  // the monastery and runs north past Sophia Square to the wall under St.
  // Andrew's hill; Velyka Zhytomyrska crosses the north quarter, and a
  // lane crosses the south one.
  m.rect(gateX, 33, gateX, wallZ - 1, "=")
    .rect(gateX, 33, 24, 33, "=")
    .rect(24, 6, 24, 33, "=")
    .rect(6, 10, 32, 10, "=")
    .rect(6, 40, 32, 40, "=");
  // Sophia Square, cobbled, east of the bell tower.
  m.rect(24, 16, 32, 29, "=");

  // Houses: the north quarter, round the square, and the south quarter
  // between the monastery and the gates.
  for (const [x, z] of [
    [9, 7],
    [13, 6],
    [17, 7],
    [27, 7],
    [26, 11],
    [29, 13],
    [7, 34],
    [11, 36],
    [17, 35],
    [21, 36],
    [26, 31],
    [29, 34],
    [26, 37],
    [7, 38],
    [17, 38],
    [8, 42],
    [20, 42],
    [24, 41],
    [28, 42],
    [24, 45],
    [28, 46],
  ] as const)
    m.rect(x, z, x + 2, z + 1, "h");
  m.scatter("#", 12, 12, { x0: 6, z0: 6, x1: 32, z1: 12 });
  m.scatter("#", 34, 13, { x0: 6, z0: 32, x1: 32, z1: wallZ - 2 });

  // The St. Sophia monastery: a whitewashed wall round the cathedral
  // (west) and the bell tower over its east gate, onto the square.
  m.rect(7, 13, 22, 13, "w")
    .rect(7, 31, 22, 31, "w")
    .rect(7, 13, 7, 31, "w")
    .rect(22, 13, 22, 31, "w");
  m.rect(8, 14, 21, 30, ".");
  m.rect(9, 15, 19, 23, "c");
  m.rect(21, 21, 23, 23, "b").rect(20, 22, 24, 22, "=");
  // The south gate in the wall, and paths across the yard.
  m.rect(gateX, 25, gateX, 32, "=").rect(10, 25, 20, 25, "=");
  m.rect(20, 22, 20, 25, "=");
  m.scatter("#", 16, 14, { x0: 8, z0: 26, x1: 21, z1: 30 });
  m.scatter("#", 6, 15, { x0: 8, z0: 14, x1: 21, z1: 14 });
  m.rect(gateX - 1, 27, gateX + 1, 29, ".").rect(gateX, 25, gateX, 32, "=");

  // Market stalls by the merchant on the square.
  m.set(30, 27, "m").set(31, 27, "m");
  // Zolotovoritskyi garden: trees inside the gates, the road kept clear.
  m.scatter("#", 14, 16, { x0: 9, z0: 43, x1: 19, z1: wallZ - 2 });
  m.rect(gateX - 1, 43, gateX + 1, wallZ - 1, ".");
  m.rect(gateX, 33, gateX, wallZ - 1, "=").rect(6, 40, 32, 40, "=");

  // The Golden Gates stand in the south rampart, the road through their
  // arch; the earth banks either side are part of the landmark.
  m.rect(gateX - 5, wallZ - 1, gateX + 5, wallZ + 1, "g");
  m.rect(gateX, wallZ - 1, gateX, wallZ + 3, "=");
  return m.build();
}

function vyshhorodMap(): string[] {
  const m = new MapBuilder(48, 36).border("#", 2);
  // The Dnipro's backwater running north to south, with a ford.
  for (let z = 0; z < 36; z++) {
    const x = 22 + Math.round(Math.sin(z / 4) * 2);
    m.rect(x, z, x + 2, z, "~");
  }
  m.rect(19, 17, 27, 18, "=");
  // A road from the west entry to the ford, then east to the lair.
  m.rect(0, 17, 19, 18, "=").rect(27, 17, 40, 17, "=");
  // The orc camp, north-east.
  m.rect(32, 4, 42, 4, "W").rect(32, 4, 32, 11, "W").rect(42, 4, 42, 11, "W");
  m.rect(32, 11, 35, 11, "W").rect(39, 11, 42, 11, "W");
  for (const [x, z] of [
    [34, 6],
    [39, 6],
    [34, 9],
  ] as const)
    m.set(x, z, "t");
  m.set(37, 8, "f");
  // The marsh, south-east.
  m.rect(30, 26, 38, 30, ",").scatter("~", 14, 5, {
    x0: 30,
    z0: 26,
    x1: 38,
    z1: 30,
  });
  // Likho's hollow, far east: a ring of rocks.
  m.rect(41, 14, 45, 14, "r")
    .rect(41, 21, 45, 21, "r")
    .rect(45, 14, 45, 21, "r");
  // Forest everywhere else, thinner along the road.
  m.scatter("#", 210, 21, { x0: 2, z0: 2, x1: 45, z1: 33 });
  m.scatter("r", 30, 22, { x0: 2, z0: 2, x1: 45, z1: 33 });
  m.scatter(",", 80, 23, { x0: 2, z0: 2, x1: 45, z1: 33 });
  // Clearings: entry, shrine, kurgan, packs, the lair.
  m.rect(0, 16, 6, 19, "=");
  for (const [x, z, r] of [
    [4, 17, 3],
    [8, 7, 3],
    [8, 28, 3],
    [14, 12, 2],
    [15, 24, 2],
    [12, 18, 2],
    [29, 13, 2],
    [29, 23, 2],
    [37, 8, 2],
    [34, 28, 2],
    [36, 20, 2],
    [43, 17, 2],
    [17, 5, 2],
    [18, 30, 2],
    [36, 13, 1],
  ] as const)
    m.clear(x, z, r);
  m.rect(27, 17, 41, 17, "=").rect(19, 17, 27, 18, "=");
  m.rect(35, 11, 38, 11, "."); // camp gate
  // A track north from the shrine-side clearing to the Salt Road.
  m.rect(17, 0, 17, 5, "=");
  return m.build();
}

/**
 * The Salt Road: open steppe on the chumaks' salt route, a red zone. The
 * road runs north from the Vyshhorod track to the salt wagons, crossing a
 * stream; raiders and worse wait close to it.
 */
function saltRoadMap(): string[] {
  const m = new MapBuilder(44, 30).border("#", 2);
  m.scatter("#", 90, 31, { x0: 2, z0: 2, x1: 41, z1: 27 });
  m.scatter("r", 45, 32, { x0: 2, z0: 2, x1: 41, z1: 27 });
  m.scatter(",", 160, 33, { x0: 2, z0: 2, x1: 41, z1: 27 });
  // A stream across the steppe, with a ford where the road crosses.
  for (let x = 2; x < 42; x++) {
    const z = 17 + Math.round(Math.sin(x / 5) * 1.5);
    m.set(x, z, "~");
  }
  m.rect(20, 0, 22, 29, ".");
  m.rect(21, 2, 21, 29, "=");
  for (const [x, z, r] of [
    [21, 5, 3],
    [21, 25, 2],
    [14, 20, 2],
    [27, 15, 2],
    [16, 10, 2],
    [27, 6, 2],
  ] as const)
    m.clear(x, z, r);
  m.rect(21, 2, 21, 29, "=");
  return m.build();
}

export const ZONES: readonly ZoneDef[] = [
  {
    id: "kyiv",
    name: { en: "Kyiv", uk: "Київ" },
    town: true,
    danger: "green",
    map: kyivMap(),
    spawn: { x: 27, z: 24 },
    // Sophia Square, in front of the bell tower.
    npcs: [
      { npcId: "sirko", x: 27, z: 21 },
      { npcId: "olha", x: 25, z: 18 },
      { npcId: "sviatoslav", x: 29, z: 18 },
      { npcId: "karmaliuk", x: 25, z: 27 },
      { npcId: "merchant", x: 30, z: 26 },
      { npcId: "stash", x: 31, z: 23 },
      { npcId: "healer", x: 28, z: 28 },
    ],
    packs: [],
    interactables: [],
    exits: [
      {
        x: KYIV.gateX,
        z: KYIV.height - 3,
        to: "vyshhorod",
        spawn: { x: 3, z: 17 },
      },
    ],
    landmarks: [
      {
        id: "golden_gate",
        name: { en: "The Golden Gates", uk: "Золоті ворота" },
        x: KYIV.gateX,
        z: KYIV.wallZ,
        radius: 13,
        zoom: 2.9,
        top: 23,
        // St. Sophia's domes and bell tower over the gate, up the street.
        vistas: [
          { x: 13.4, z: 19, top: 22.5 },
          { x: 22, z: 22, top: 32 },
        ],
      },
      {
        id: "sophia",
        name: { en: "St. Sophia's Cathedral", uk: "Софійський собор" },
        x: 14,
        z: 19,
        radius: 13,
        zoom: 2.6,
        top: 22.5,
      },
      {
        id: "sophia_bell_tower",
        name: { en: "St. Sophia's bell tower", uk: "Дзвіниця Софії" },
        x: 22,
        z: 22,
        radius: 8,
        zoom: 2.3,
        top: 32,
      },
    ],
    palette: { ground: 0x6a6840, fog: 0x2a2418, sky: 0x2a2218 },
  },
  {
    id: "vyshhorod",
    name: { en: "Vyshhorod outskirts", uk: "Околиці Вишгорода" },
    // The starting wilds: new heroes stay out of PvP here.
    danger: "green",
    map: vyshhorodMap(),
    spawn: { x: 3, z: 17 },
    npcs: [],
    packs: [
      {
        id: "p_grunts_a",
        x: 12,
        z: 18,
        enemies: [{ enemyId: "orc_grunt", level: 1 }],
      },
      {
        id: "p_grunts_b",
        x: 14,
        z: 12,
        enemies: [
          { enemyId: "orc_grunt", level: 2 },
          { enemyId: "orc_grunt", level: 1 },
        ],
      },
      {
        id: "p_upyr_a",
        x: 15,
        z: 24,
        enemies: [{ enemyId: "upyr", level: 2 }],
      },
      {
        id: "p_upyr_b",
        x: 18,
        z: 30,
        enemies: [
          { enemyId: "upyr", level: 3 },
          { enemyId: "upyr", level: 3 },
        ],
      },
      {
        id: "p_mavka",
        x: 17,
        z: 5,
        enemies: [{ enemyId: "mavka", level: 4 }],
      },
      {
        id: "p_wolves",
        rank: "elite",
        x: 29,
        z: 13,
        aggressive: true,
        enemies: [
          { enemyId: "vovkulaka", level: 5 },
          { enemyId: "vovkulaka", level: 4 },
        ],
      },
      {
        id: "p_camp",
        rank: "elite",
        x: 37,
        z: 8,
        enemies: [
          { enemyId: "orc_grunt", level: 6 },
          { enemyId: "orc_brute", level: 6 },
          { enemyId: "orc_shaman", level: 5 },
        ],
      },
      {
        id: "p_camp_gate",
        x: 36,
        z: 13,
        enemies: [
          { enemyId: "orc_grunt", level: 5 },
          { enemyId: "orc_shaman", level: 4 },
        ],
      },
      {
        id: "p_marsh",
        x: 34,
        z: 28,
        enemies: [
          { enemyId: "potopelnyk", level: 6 },
          { enemyId: "potopelnyk", level: 5 },
        ],
      },
      {
        id: "p_chort",
        rank: "elite",
        x: 29,
        z: 23,
        aggressive: true,
        enemies: [
          { enemyId: "chort", level: 7 },
          { enemyId: "upyr", level: 6 },
        ],
      },
      {
        id: "p_brutes",
        rank: "elite",
        x: 36,
        z: 20,
        aggressive: true,
        enemies: [
          { enemyId: "orc_brute", level: 8 },
          { enemyId: "orc_shaman", level: 7 },
          { enemyId: "orc_grunt", level: 8 },
        ],
      },
      {
        id: "p_likho",
        x: 43,
        z: 17,
        enemies: [{ enemyId: "likho", level: 10 }],
      },
      {
        id: "p_kurgan_mavka",
        x: 8,
        z: 26,
        quest: "q_mavka",
        enemies: [
          { enemyId: "mavka", level: 5 },
          { enemyId: "mavka", level: 4 },
        ],
      },
    ],
    interactables: [
      {
        id: "shrine",
        kind: "shrine",
        x: 8,
        z: 7,
        name: { en: "Silent shrine", uk: "Мовчазна каплиця" },
      },
      {
        id: "kurgan",
        kind: "kurgan",
        x: 8,
        z: 29,
        name: { en: "Kurgan stone", uk: "Курганний камінь" },
      },
    ],
    exits: [
      { x: 0, z: 17, to: "kyiv", spawn: { x: KYIV.gateX, z: KYIV.height - 5 } },
      { x: 17, z: 0, to: "salt_road", spawn: { x: 21, z: 26 } },
    ],
    palette: { ground: 0x6c7a3c, fog: 0x24301e, sky: 0x1f2a1a },
  },
  {
    id: "salt_road",
    name: { en: "The Salt Road", uk: "Чумацький шлях" },
    // Lawless steppe: the gold is here, and so is everyone after it.
    danger: "red",
    map: saltRoadMap(),
    spawn: { x: 21, z: 26 },
    npcs: [],
    packs: [
      {
        id: "p_steppe_wolves",
        x: 14,
        z: 20,
        aggressive: true,
        enemies: [
          { enemyId: "vovkulaka", level: 9 },
          { enemyId: "vovkulaka", level: 9 },
        ],
      },
      {
        id: "p_road_raiders",
        x: 27,
        z: 15,
        aggressive: true,
        rank: "elite",
        enemies: [
          { enemyId: "orc_brute", level: 10 },
          { enemyId: "orc_grunt", level: 10 },
          { enemyId: "orc_shaman", level: 9 },
        ],
      },
      {
        id: "p_road_chort",
        x: 16,
        z: 10,
        aggressive: true,
        enemies: [{ enemyId: "chort", level: 11 }],
      },
      {
        id: "p_salt_guard",
        x: 27,
        z: 6,
        aggressive: true,
        rank: "elite",
        enemies: [
          { enemyId: "orc_brute", level: 12 },
          { enemyId: "orc_brute", level: 11 },
        ],
      },
    ],
    interactables: [
      {
        id: "salt_wagons",
        kind: "salt_cart",
        x: 21,
        z: 5,
        name: { en: "Chumak salt wagons", uk: "Чумацькі вози з сіллю" },
      },
    ],
    exits: [{ x: 21, z: 29, to: "vyshhorod", spawn: { x: 17, z: 2 } }],
    palette: { ground: 0x8a8a48, fog: 0x3a3020, sky: 0x2a2418 },
  },
];

import { Rng } from "../sim/rng";
import type { ZoneDef } from "../sim/types";

/**
 * Tile legend. Every tile is one square of the world grid; `x` is the
 * column, `z` the row.
 *
 *   .  ground          =  road (walkable)        ,  tall grass (walkable)
 *   #  tree            r  rock                   ~  water
 *   h  house           W  palisade wall          c  church
 *   t  tent            f  campfire (walkable glow)
 */
export const BLOCKING = new Set(["#", "r", "~", "h", "W", "c", "t"]);

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

  build(): string[] {
    return this.rows.map((row) => row.join(""));
  }
}

function kyivMap(): string[] {
  const m = new MapBuilder(30, 22).border("W");
  // Main roads: a square in the middle and the road to the east gate.
  m.rect(4, 11, 25, 11, "=").rect(14, 4, 14, 18, "=").rect(25, 11, 29, 11, "=");
  m.rect(11, 8, 17, 14, "=");
  // St. Sophia's, north of the square.
  m.rect(12, 2, 16, 5, "c");
  // Houses.
  for (const [x, z] of [
    [3, 3],
    [7, 3],
    [20, 3],
    [24, 3],
    [3, 15],
    [7, 16],
    [20, 15],
    [24, 16],
    [3, 8],
    [24, 7],
  ] as const)
    m.rect(x, z, x + 2, z + 1, "h");
  m.scatter("#", 18, 11, { x0: 1, z0: 1, x1: 28, z1: 20 });
  m.clear(14, 11, 2, "=");
  for (const [x, z] of [
    [10, 9],
    [18, 9],
    [10, 13],
    [18, 13],
    [21, 11],
    [8, 11],
  ] as const)
    m.clear(x, z, 1);
  m.rect(26, 10, 29, 12, "=").set(29, 10, "W").set(29, 12, "W");
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
  return m.build();
}

export const ZONES: readonly ZoneDef[] = [
  {
    id: "kyiv",
    name: { en: "Kyiv", uk: "Київ" },
    town: true,
    map: kyivMap(),
    spawn: { x: 14, z: 12 },
    npcs: [
      { npcId: "sirko", x: 14, z: 10 },
      { npcId: "olha", x: 10, z: 9 },
      { npcId: "sviatoslav", x: 18, z: 9 },
      { npcId: "karmaliuk", x: 10, z: 13 },
      { npcId: "merchant", x: 18, z: 13 },
      { npcId: "stash", x: 21, z: 11 },
      { npcId: "healer", x: 8, z: 11 },
    ],
    packs: [],
    interactables: [],
    exits: [{ x: 29, z: 11, to: "vyshhorod", spawn: { x: 3, z: 17 } }],
    palette: { ground: 0x6a6840, fog: 0x2a2418, sky: 0x2a2218 },
  },
  {
    id: "vyshhorod",
    name: { en: "Vyshhorod outskirts", uk: "Околиці Вишгорода" },
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
    exits: [{ x: 0, z: 17, to: "kyiv", spawn: { x: 26, z: 11 } }],
    palette: { ground: 0x6c7a3c, fog: 0x24301e, sky: 0x1f2a1a },
  },
];

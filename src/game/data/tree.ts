import type { Attribute, Localized, StatMods, TreeNode } from "../sim/types";

/**
 * The shared passive tree. Three arms (strength, dexterity, intellect) meet
 * in a hub; each class starts at the outer end of its arm, and ring paths
 * between arms make hybrids possible. Laid out in code so it stays
 * consistent; hand-placed nodes can be appended to the same lists.
 */
type Arm = {
  attr: Attribute;
  angle: number;
  start: string;
  minor: readonly StatMods[];
  notables: readonly [Localized, StatMods, Localized, StatMods];
};

const ARMS: readonly Arm[] = [
  {
    attr: "str",
    angle: 210,
    start: "lytsar",
    minor: [{ maxHp: 12 }, { resPhysical: 4 }, { maxStamina: 6 }],
    notables: [
      { en: "Bulwark", uk: "Твердиня" },
      { maxHp: 30, resPhysical: 8 },
      { en: "Berserker", uk: "Шаленець" },
      { incPhysical: 20, critMulti: 20 },
    ],
  },
  {
    attr: "dex",
    angle: 330,
    start: "plastun",
    minor: [{ evasion: 6 }, { accuracy: 6 }, { critChance: 2 }],
    notables: [
      { en: "Sharpshooter", uk: "Влучний стрілець" },
      { accuracy: 15, critChance: 5 },
      { en: "Ghost step", uk: "Примарний крок" },
      { evasion: 18, speed: 2 },
    ],
  },
  {
    attr: "int",
    angle: 90,
    start: "kharakternyk",
    minor: [{ maxMana: 10 }, { incMagical: 8 }, { manaRegen: 1 }],
    notables: [
      { en: "Fire-born", uk: "Народжений у вогні" },
      { incMagical: 25, resMagical: 10 },
      { en: "Kharakter's will", uk: "Воля характерника" },
      { maxMana: 30, manaRegen: 3 },
    ],
  },
];

function polar(r: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return {
    x: Math.round(r * Math.cos(rad) * 100) / 100,
    y: Math.round(-r * Math.sin(rad) * 100) / 100,
  };
}

function build(): { nodes: TreeNode[]; edges: [string, string][] } {
  const nodes: TreeNode[] = [
    {
      id: "hub",
      ...polar(0, 0),
      mods: { resPhysical: 5, resMagical: 5, resChaos: 5 },
      notable: { en: "Heart of the Steppe", uk: "Серце степу" },
    },
  ];
  const edges: [string, string][] = [];
  for (const arm of ARMS) {
    const { attr, angle } = arm;
    // The main line, from the class start inward to the hub.
    for (let i = 0; i <= 5; i++) {
      const minor = arm.minor[i % arm.minor.length] ?? {};
      nodes.push({
        id: `${attr}_${i}`,
        ...polar(6 - i, angle),
        mods: i === 0 ? { [attr]: 4 } : i % 2 === 1 ? { [attr]: 6 } : minor,
        ...(i === 0 ? { start: arm.start } : {}),
      });
      if (i > 0) edges.push([`${attr}_${i - 1}`, `${attr}_${i}`]);
    }
    edges.push([`${attr}_5`, "hub"]);
    // Two branches, each ending in a notable.
    const branches = [
      { from: 1, side: -1, notable: 0 },
      { from: 3, side: 1, notable: 2 },
    ] as const;
    branches.forEach(({ from, side, notable }, b) => {
      const r = 6 - from;
      const ids = [`${attr}_b${b}_0`, `${attr}_b${b}_1`, `${attr}_b${b}_n`];
      nodes.push(
        {
          id: ids[0]!,
          ...polar(r + 0.2, angle + side * 12),
          mods: arm.minor[(b + 1) % 3] ?? {},
        },
        {
          id: ids[1]!,
          ...polar(r + 0.5, angle + side * 22),
          mods: { [attr]: 5 },
        },
        {
          id: ids[2]!,
          ...polar(r + 0.9, angle + side * 32),
          mods: arm.notables[notable + 1] as StatMods,
          notable: arm.notables[notable] as Localized,
        },
      );
      edges.push(
        [`${attr}_${from}`, ids[0]!],
        [ids[0]!, ids[1]!],
        [ids[1]!, ids[2]!],
      );
    });
  }
  // Ring paths between neighbouring arms, through their third node.
  ARMS.forEach((arm, i) => {
    const next = ARMS[(i + 1) % ARMS.length]!;
    let to = next.angle;
    if (to < arm.angle) to += 360;
    const a = `ring_${arm.attr}_${next.attr}_0`;
    const b = `ring_${arm.attr}_${next.attr}_1`;
    nodes.push(
      {
        id: a,
        ...polar(3, arm.angle + (to - arm.angle) / 3),
        mods: { [arm.attr]: 3, [next.attr]: 3 },
      },
      {
        id: b,
        ...polar(3, arm.angle + ((to - arm.angle) * 2) / 3),
        mods: { [arm.attr]: 3, [next.attr]: 3 },
      },
    );
    edges.push([`${arm.attr}_3`, a], [a, b], [b, `${next.attr}_3`]);
  });
  return { nodes, edges };
}

export const TREE = build();

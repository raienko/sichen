import { z } from "zod";

import { CLASSES } from "./classes";
import { ENEMIES } from "./enemies";
import { AFFIXES, ITEM_BASES, SETS, UNIQUES } from "./items";
import { SKILLS } from "./skills";
import { TREE } from "./tree";
import { NPCS, QUESTS } from "./world";
import { BLOCKING, ZONES } from "./zones";

/**
 * Shape checks (zod) plus the cross-references types can't express: every
 * id a piece of content names must exist, and every map position must be
 * walkable. Run by the content test and, in development, on load.
 */
const localized = z.object({ en: z.string(), uk: z.string() });
const statMods = z.record(z.string(), z.number());

const effect = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("damage"),
    delivery: z.enum(["melee", "ranged", "mental"]),
    damageType: z.enum(["physical", "magical", "chaos"]),
    base: z.tuple([z.number().min(0), z.number().min(0)]),
    weapon: z.number().min(0),
    hits: z.number().int().min(1).optional(),
  }),
  z.object({
    type: z.literal("status"),
    status: z.enum(["burn", "freeze", "stun"]),
    chance: z.number().min(0).max(100),
    turns: z.number().int().min(1),
  }),
  z.object({
    type: z.literal("heal"),
    amount: z.number(),
    percent: z.number().optional(),
  }),
  z.object({
    type: z.literal("buff"),
    mods: statMods,
    turns: z.number().int(),
  }),
  z.object({
    type: z.literal("summon"),
    enemyId: z.string(),
    count: z.number().int().min(1),
  }),
]);

const skill = z.object({
  id: z.string(),
  name: localized,
  icon: z.string(),
  ap: z.number().int().min(1).max(5),
  cost: z.record(z.string(), z.number().min(0)),
  target: z.enum(["enemy", "enemyRow", "allEnemies", "self", "ally"]),
  effects: z.array(effect),
  flee: z.boolean().optional(),
});

const zone = z.object({
  id: z.string(),
  name: localized,
  map: z.array(z.string()).min(1),
  spawn: z.object({ x: z.number(), z: z.number() }),
});

export function validateContent(): string[] {
  const errors: string[] = [];
  const check = (ok: boolean, message: string) => {
    if (!ok) errors.push(message);
  };
  const parse = (schema: z.ZodType, value: unknown, label: string) => {
    const result = schema.safeParse(value);
    if (!result.success) errors.push(`${label}: ${result.error.message}`);
  };

  const skillIds = new Set(SKILLS.map((s) => s.id));
  const enemyIds = new Set(ENEMIES.map((e) => e.id));
  const baseIds = new Set(ITEM_BASES.map((b) => b.id));
  const nodeIds = new Set(TREE.nodes.map((n) => n.id));
  const npcIds = new Set(NPCS.map((n) => n.id));
  const questIds = new Set(QUESTS.map((q) => q.id));
  const zoneIds = new Set(ZONES.map((zn) => zn.id));

  for (const s of SKILLS) {
    parse(skill, s, `skill ${s.id}`);
    for (const e of s.effects)
      if (e.type === "summon")
        check(enemyIds.has(e.enemyId), `skill ${s.id}: enemy ${e.enemyId}`);
    if (s.learn?.hiddenBy)
      check(questIds.has(s.learn.hiddenBy), `skill ${s.id}: quest`);
  }
  for (const c of CLASSES) {
    for (const id of c.skills) check(skillIds.has(id), `class ${c.id}: ${id}`);
    check(nodeIds.has(c.treeStart), `class ${c.id}: tree start`);
    check(npcIds.has(c.masterNpc), `class ${c.id}: master`);
    check(baseIds.has(c.startWeapon), `class ${c.id}: weapon`);
    check(
      c.skills.filter((id) => SKILLS.find((s) => s.id === id)?.learn?.hiddenBy)
        .length === 2,
      `class ${c.id}: needs 2 hidden skills`,
    );
  }
  for (const e of ENEMIES) {
    for (const id of e.skills) check(skillIds.has(id), `enemy ${e.id}: ${id}`);
    for (const p of e.phases ?? []) {
      for (const id of p.skills ?? [])
        check(skillIds.has(id), `enemy ${e.id} phase: ${id}`);
      if (p.summon)
        check(enemyIds.has(p.summon.enemyId), `enemy ${e.id}: summon`);
    }
  }
  for (const a of AFFIXES)
    check(
      a.tiers.every(([, min, max]) => min <= max),
      `affix ${a.id}: tier range`,
    );
  for (const s of SETS)
    for (const p of s.pieces)
      check(baseIds.has(p.baseId), `set ${s.id}: ${p.baseId}`);
  for (const u of UNIQUES) check(baseIds.has(u.baseId), `unique ${u.id}`);
  for (const [a, b] of TREE.edges)
    check(nodeIds.has(a) && nodeIds.has(b), `tree edge ${a}-${b}`);
  for (const q of QUESTS) {
    check(npcIds.has(q.giver), `quest ${q.id}: giver`);
    if (q.requires) check(questIds.has(q.requires), `quest ${q.id}: requires`);
  }

  for (const zn of ZONES) {
    parse(zone, zn, `zone ${zn.id}`);
    const width = zn.map[0]?.length ?? 0;
    check(
      zn.map.every((row) => row.length === width),
      `zone ${zn.id}: ragged rows`,
    );
    const walkable = (x: number, z: number) => {
      const ch = zn.map[z]?.[x];
      return ch !== undefined && !BLOCKING.has(ch);
    };
    check(walkable(zn.spawn.x, zn.spawn.z), `zone ${zn.id}: spawn`);
    for (const n of zn.npcs) {
      check(npcIds.has(n.npcId), `zone ${zn.id}: npc ${n.npcId}`);
      check(
        walkable(n.x, n.z),
        `zone ${zn.id}: npc ${n.npcId} placed on a wall`,
      );
    }
    for (const p of zn.packs) {
      check(walkable(p.x, p.z), `zone ${zn.id}: pack ${p.id} placed on a wall`);
      for (const e of p.enemies)
        check(enemyIds.has(e.enemyId), `pack ${p.id}: ${e.enemyId}`);
    }
    for (const i of zn.interactables)
      check(walkable(i.x, i.z), `zone ${zn.id}: ${i.id} placed on a wall`);
    for (const x of zn.exits) {
      check(zoneIds.has(x.to), `zone ${zn.id}: exit to ${x.to}`);
      check(walkable(x.x, x.z), `zone ${zn.id}: exit tile`);
    }
  }
  return errors;
}

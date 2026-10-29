/**
 * The game's model: content shapes (what src/game/data declares) and the
 * runtime state the sim works on. Plain data only, so every piece can be
 * saved, sent over a network, or validated.
 */

/** Text in every language the game ships its own copy in. */
export type Localized = { en: string; uk: string };

export type Attribute = "str" | "dex" | "int";
/** What a defence pool blocks. */
export type Delivery = "melee" | "ranged" | "mental";
/** What a resistance reduces. */
export type DamageType = "physical" | "magical" | "chaos";
export type StatusKind = "burn" | "freeze" | "stun";
export type Resource = "hp" | "mana" | "stamina";

export const DELIVERIES: readonly Delivery[] = ["melee", "ranged", "mental"];
export const DAMAGE_TYPES: readonly DamageType[] = [
  "physical",
  "magical",
  "chaos",
];

/** Every number a combatant's power is made of. Percentages are whole numbers. */
export type StatKey =
  | Attribute
  | "maxHp"
  | "maxMana"
  | "maxStamina"
  | "hpRegen"
  | "manaRegen"
  | "staminaRegen"
  | "weaponMin"
  | "weaponMax"
  | "addedPhysical"
  | "accuracy"
  | "evasion"
  | "speed"
  | "resPhysical"
  | "resMagical"
  | "resChaos"
  | "incPhysical"
  | "incMagical"
  | "incChaos"
  | "incMaxHp"
  | "critChance"
  | "critMulti";

export type Stats = Record<StatKey, number>;
export type StatMods = Partial<Stats>;

/** A named icon from the UI's icon font; data stays art-agnostic. */
export type IconName = string;

// ---------------------------------------------------------------- skills

export type SkillTarget = "enemy" | "enemyRow" | "allEnemies" | "self" | "ally";

export type SkillEffect =
  | {
      type: "damage";
      delivery: Delivery;
      damageType: DamageType;
      /** Flat roll, before scaling. */
      base: readonly [number, number];
      /** Multiplier on the weapon's roll (0 for spells). */
      weapon: number;
      hits?: number;
    }
  | { type: "status"; status: StatusKind; chance: number; turns: number }
  | { type: "heal"; amount: number; percent?: number }
  | { type: "buff"; mods: StatMods; turns: number }
  | { type: "summon"; enemyId: string; count: number };

export type SkillCost = Partial<Record<Resource, number>>;

export type Skill = {
  id: string;
  name: Localized;
  icon: IconName;
  /** Undefined for actions anyone has (strike, potions, enemy skills). */
  classId?: string;
  ap: number;
  cost: SkillCost;
  target: SkillTarget;
  effects: readonly SkillEffect[];
  /** Extra power per skill level, in percent. */
  perLevel?: number;
  /** Consumes a potion of this kind instead of a resource. */
  potion?: "hp" | "mana";
  /** How a hero gets it: from the grand master at a level, or hidden. */
  learn?: { level: number; gold: number; hiddenBy?: string };
};

// ---------------------------------------------------------------- classes

export type ClassDef = {
  id: string;
  name: Localized;
  role: Localized;
  icon: IconName;
  primary: Attribute;
  base: StatMods;
  perLevel: StatMods;
  treeStart: string;
  masterNpc: string;
  skills: readonly string[];
  startWeapon: string;
};

// ---------------------------------------------------------------- items

export type Rarity = "normal" | "magic" | "rare" | "unique" | "set";
export const RARITIES: readonly Rarity[] = [
  "normal",
  "magic",
  "rare",
  "set",
  "unique",
];

export type ItemSlot =
  | "weapon"
  | "offhand"
  | "helmet"
  | "chest"
  | "gloves"
  | "boots"
  | "belt"
  | "amulet"
  | "ring";

export type EquipSlot = Exclude<ItemSlot, "ring"> | "ring1" | "ring2";
export const EQUIP_SLOTS: readonly EquipSlot[] = [
  "weapon",
  "offhand",
  "helmet",
  "chest",
  "gloves",
  "boots",
  "belt",
  "amulet",
  "ring1",
  "ring2",
];

export type Requirement = { level: number } & Partial<
  Record<Attribute, number>
>;

export type ItemBase = {
  id: string;
  slot: ItemSlot;
  /** Weapon family or armour look, for the art kit. */
  kind: string;
  name: Localized;
  icon: IconName;
  /** The first item level it drops at. */
  level: number;
  implicit: StatMods;
  req: Requirement;
  twoHanded?: boolean;
};

export type AffixDef = {
  id: string;
  kind: "prefix" | "suffix";
  stat: StatKey;
  slots: readonly ItemSlot[];
  /** [item level from, min, max] per tier, lowest tier first. */
  tiers: readonly (readonly [number, number, number])[];
  name: Localized;
};

export type RolledAffix = { id: string; tier: number; value: number };

export type Item = {
  uid: string;
  baseId: string;
  rarity: Rarity;
  ilvl: number;
  affixes: RolledAffix[];
  uniqueId?: string;
  setId?: string;
  /** Rune sockets: data is in place, nothing fills them yet. */
  sockets: (string | null)[];
};

export type SetDef = {
  id: string;
  name: Localized;
  pieces: readonly { baseId: string; name: Localized; mods: StatMods }[];
  /** Bonus by number of pieces worn. */
  bonuses: readonly { pieces: number; mods: StatMods }[];
};

export type UniqueDef = {
  id: string;
  baseId: string;
  name: Localized;
  lore: Localized;
  mods: StatMods;
  /** Only from this source (a boss, a quest), not random drops. */
  source?: "boss" | "quest";
};

export type Relic = "change" | "ascent" | "addition" | "purge";
export const RELICS: readonly Relic[] = [
  "change",
  "ascent",
  "addition",
  "purge",
];

// ---------------------------------------------------------------- enemies

export type EnemyPhase = {
  /** Enters this phase when HP falls to this percent or below. */
  atHpPercent: number;
  skills?: readonly string[];
  summon?: { enemyId: string; count: number };
  mods?: StatMods;
  name: Localized;
};

export type EnemyDef = {
  id: string;
  name: Localized;
  /** Art kit key. */
  kind: string;
  icon: IconName;
  tags: readonly string[];
  base: StatMods;
  perLevel: StatMods;
  skills: readonly string[];
  xp: number;
  /** Prefers the back row. */
  backRow?: boolean;
  boss?: boolean;
  phases?: readonly EnemyPhase[];
};

// ---------------------------------------------------------------- tree

export type TreeNode = {
  id: string;
  x: number;
  y: number;
  mods: StatMods;
  notable?: Localized;
  /** A class starts here, allocated for free. */
  start?: string;
};

// ---------------------------------------------------------------- world

export type NpcRole = "quest" | "master" | "merchant" | "stash" | "healer";

export type NpcDef = {
  id: string;
  name: Localized;
  title: Localized;
  roles: readonly NpcRole[];
  kind: string;
  bark: Localized;
};

export type PackDef = {
  id: string;
  x: number;
  z: number;
  enemies: readonly { enemyId: string; level: number }[];
  aggressive?: boolean;
  /** Present only while this quest is active or until it is done. */
  quest?: string;
};

export type InteractableDef = {
  id: string;
  kind: string;
  x: number;
  z: number;
  name: Localized;
};

export type ZoneDef = {
  id: string;
  name: Localized;
  town?: boolean;
  /** Rows of tile codes; see data/zones.ts for the legend. */
  map: readonly string[];
  spawn: { x: number; z: number };
  npcs: readonly { npcId: string; x: number; z: number }[];
  packs: readonly PackDef[];
  interactables: readonly InteractableDef[];
  exits: readonly {
    x: number;
    z: number;
    to: string;
    spawn: { x: number; z: number };
  }[];
  palette: { ground: number; fog: number; sky: number };
};

// ---------------------------------------------------------------- quests

export type QuestObjective =
  | { type: "kill"; tag: string; count: number }
  | { type: "explore"; interactableId: string }
  | { type: "defeat"; packId: string }
  | { type: "choice"; interactableId: string; options: readonly QuestChoice[] };

export type QuestChoice = {
  id: string;
  label: Localized;
  icon: IconName;
  /** Starts a battle with this pack first; the choice counts once it is won. */
  battlePackId?: string;
  reward: QuestReward;
};

export type QuestReward = {
  xp: number;
  gold: number;
  uniqueId?: string;
  relics?: Partial<Record<Relic, number>>;
};

export type QuestDef = {
  id: string;
  kind: "main" | "side";
  giver: string;
  name: Localized;
  goal: Localized;
  icon: IconName;
  requires?: string;
  objective: QuestObjective;
  reward: QuestReward;
};

// ---------------------------------------------------------------- hero

export type Look = {
  body: "kozak" | "kozachka";
  face: number;
  hair: number;
  hairColor: number;
  mustache: boolean;
};

export type Hero = {
  name: string;
  look: Look;
  classId: string;
  level: number;
  /** XP into the current level. */
  xp: number;
  learned: string[];
  /** Six skill slots on the battle bar. */
  bar: (string | null)[];
  tree: string[];
  equipment: Partial<Record<EquipSlot, Item>>;
  hp: number;
  mana: number;
  stamina: number;
  potions: { hp: number; mana: number };
};

export type QuestState = {
  /** "ready" means the objective is met and the giver can pay out. */
  status: "active" | "ready" | "done";
  progress: number;
  choice?: string;
};

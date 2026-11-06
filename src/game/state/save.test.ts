import { createHero } from "../sim/hero";
import { Rng } from "../sim/rng";
import type { Look } from "../sim/types";

import * as actions from "./actions";
import { slotStorage } from "./platform";
import { deserialize, SAVE_VERSION, serialize, type SaveData } from "./save";
import { store } from "./store";

const LOOK: Look = {
  body: "kozak",
  face: 0,
  hair: 0,
  hairColor: 0,
  mustache: true,
};

afterEach(() => {
  slotStorage.remove(0);
  slotStorage.remove(1);
});

describe("save slots across launches", () => {
  it("loads a new hero back on the next launch", () => {
    actions.createGame(0, "Ostap", LOOK, "lytsar");
    const created = store.get().save!;
    expect(created.version).toBe(SAVE_VERSION);

    // The next launch: the title screen reads the slots from storage.
    actions.goToTitle();
    expect(store.get().slots[0]).toEqual(created);
  });

  it("repairs a save the old createGame wrote as version 1", () => {
    // Before the fix new heroes were saved with `version: 1` but the
    // current shape, so the respawn migration met `cleared` as an object.
    const hero = createHero(new Rng(1), "Ostap", LOOK, "lytsar");
    const mislabelled: SaveData = {
      version: 1,
      id: "a",
      createdAt: 0,
      updatedAt: 0,
      hero,
      gold: 5,
      relics: { change: 0, ascent: 0, addition: 0, purge: 0 },
      inventory: [],
      stash: [],
      quests: {},
      world: { zoneId: "kyiv", x: 1, z: 1, cleared: { p_wolves: 123 } },
      settings: {
        lootFilter: "normal",
        autoBattle: true,
        tactic: 2,
        tutorial: true,
        hints: ["walk"],
      },
      tactics: [null, null, null],
      seed: 1,
      stats: { kills: 0, deaths: 0, battles: 0 },
    };
    expect(deserialize(serialize(mislabelled))).toEqual({
      ...mislabelled,
      version: SAVE_VERSION,
    });
  });

  it("shows a slot that can't be read as empty instead of crashing", () => {
    const hero = createHero(new Rng(1), "Ostap", LOOK, "lytsar");
    // A save whose shape no migration expects.
    slotStorage.write(
      1,
      serialize({ version: 2, hero, world: null } as unknown as SaveData),
    );
    expect(() => actions.refreshSlots()).not.toThrow();
    expect(store.get().slots[1]).toBeNull();
  });
});

# Risk zones, PvP and the gold economy

30 October 2026. The owner's direction for the game after the vertical slice. Status of each part is marked: **built** (in this repository), **prepared** (rules and data exist, unused until the server), or **planned**.

## The idea

Gold is scarce and valuable. Item drops and gold drops are lower; prices are higher. The way to real gold is quests in dangerous areas: higher-level aggressive monsters and other players who may attack. **Want gold, take the risk.**

## Zone danger levels — built (data and HUD)

| Zone   | Who may attack whom                                   | Typical content                                 |
| ------ | ----------------------------------------------------- | ----------------------------------------------- |
| Green  | No fights between players                             | Towns, starting wilds, ordinary quests          |
| Yellow | Only players with a **high PvP rank** can be attacked | Middle ground; aggressors become prey           |
| Red    | Anyone can attack anyone                              | Best-paying quests, high-level aggressive packs |

Every zone has `danger` (`ZoneDef`, `data/zones.ts`). The world HUD colours the minimap frame and marks the zone name (a shield in green, a skull in yellow/red), and the zone label's accessible name explains the rule. Kyiv and Vyshhorod's outskirts are green: the starting band stays out of PvP.

## Red-zone quests — first one built

Gold mostly comes from quests whose objective sits in a red zone.

- **Bring salt** (`q_salt`, built). Merchant Hordii in Kyiv offers it once "Smoke over Vyshhorod" is done; he now talks first when he has quest business, with a Trade button for the shop. Load salt at the chumak wagons at the north end of **the Salt Road** (`salt_road`, a red zone reached by the track north of Vyshhorod), then carry it back. Pays 450 gold and 320 XP. The salt is cargo: a `deliver` objective is "ready" while it is carried, and **dying loses it** (`dropCargo`), so the quest goes back to the pickup.
- **Secure the caravan** (escort, planned): keep a slow cart alive to its destination; the natural first co-op activity.

The Salt Road is open steppe with a stream and a ford across the road, and four aggressive packs close to the route: vovkulaky (9), a horde war band (10, 10, 9), a chort (11) and the wagons' horde guard (12, 11). The game's current content tops out at level 10, so this is a deliberately hard detour. Cargo does not slow the hero yet.

## PvP rank — planned

Attacking a player outside red zones, or attacking much weaker players, raises PvP rank; it decays over time. In yellow zones, only players with a high rank may be attacked. Rank is shown on the player.

## Joining fights — prepared

- **Monsters never join a fight.** A fight with a pack stays with that pack (and its own summons).
- **Players can join** a fight in progress on either side: a player's fight with monsters (to help), or a fight between players. They enter from the next round, in a free position (six a side).

`joinBattle(state, hero, side)` in `sim/battle.ts` adds a player hero to a side, refuses monsters and full sides, and applies the protector rule. Joiners carry `joined: true`; player heroes carry `player: true`.

## The protector (griefing protection) — prepared

When the **sum of the attacking side's player levels is above twice the sum of the defending side's** (`RULES.protector.ratio`), a **protector** joins the defending side. Two level-2 heroes (sum 4) can be attacked by a level-8 hero or two level-4 heroes; a level-9 hero, or levels 4 + 5, bring the protector. A lone level-2 hero can be attacked up to level 4. Players joining either side change the sums, so a joiner can bring the protector mid-fight. The protector is **Oberih the Warden** (`oberih` in `data/enemies.ts`). It is deliberately out of balance: capped resistances, huge health and regeneration, near-certain hits and chaos strikes that one-shot or almost one-shot even high-level heroes. Attacking the weak never pays.

- It applies whenever players stand on both sides: when a fight between players starts, and whenever someone joins (including a high-level player joining a fight against a weak player). A side gets at most one.
- It never appears in fights against monsters.
- It gives no experience and drops nothing.

`guardSides(state)` applies the rule; tests in `sim/sim.test.ts` check that monsters can't join, the threshold (2+2 vs 8 and 9, 2 vs 4 and 5, 2+2 vs 4+4 and 4+5), and that a level-2 hero attacked by a level-10 hero wins within three rounds with the protector.

The battle screen plays a `join` event with a banner ("A warden stands with the weak") and the protector's own figure (a tall robed warden with a golden halo and staff). Until the server exists, `__game.actions.devJoinPlayer(level, side)` in a development build simulates another player joining the current fight.

## Losing in PvP — decided

The loser drops any quest cargo (already true for every death) and part of the gold being carried, never equipment or levels (the game's rule: no de-levelling, no gold debt). Gold is safe once stored in a green town. The gold part needs the server and town banking.

## Economy — first pass built

All in `RULES` (`data/index.ts`), easy to retune:

|                              | Before           | Now                                                                              |
| ---------------------------- | ---------------- | -------------------------------------------------------------------------------- |
| Monster gold                 | 2-5 × level each | 1-3 × level each (`economy.goldPerLevel`)                                        |
| Items from an ordinary fight | 1-3              | 0-2, none 35% of the time (`economy.maxItems`, `noItemChance`); bosses unchanged |
| Vendor pays                  | full item value  | 60% (`economy.sellShare`)                                                        |
| Potion                       | 15               | 20                                                                               |
| Passive tree respec          | 20               | 60                                                                               |
| Bring salt                   | —                | 450 gold                                                                         |

Still planned: more gold sinks (repairs, travel, fees) and checking that a green-zone player can afford the basics.

## Server requirements — planned

Real PvP and joining need the multiplayer backend (Supabase, as planned): shared positions per zone, the authoritative turn server running the same deterministic `sim/battle.ts`, and gold, items and cargo held on the server. Local saves can be edited, so a scarce-gold economy must not trust them.

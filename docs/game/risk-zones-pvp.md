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

## Red-zone quests — planned

Gold mostly comes from quests whose objective sits in a red zone, for example:

- **Bring salt** (cargo): pick up a load and carry it to a town. The cargo is an item that can be lost, so other players have a reason to attack, not only to kill.
- **Secure the caravan** (escort): keep a slow cart alive to its destination; the natural first co-op activity.

These zones hold higher-level aggressive packs as well as the danger from players.

## PvP rank — planned

Attacking a player outside red zones, or attacking much weaker players, raises PvP rank; it decays over time. In yellow zones, only players with a high rank may be attacked. Rank is shown on the player.

## Joining fights — prepared

- **Monsters never join a fight.** A fight with a pack stays with that pack (and its own summons).
- **Players can join** a fight in progress on either side: a player's fight with monsters (to help), or a fight between players. They enter from the next round, in a free position (six a side).

`joinBattle(state, hero, side)` in `sim/battle.ts` adds a player hero to a side, refuses monsters and full sides, and applies the protector rule. Joiners carry `joined: true`; player heroes carry `player: true`.

## The protector (griefing protection) — prepared

When one side's strongest player hero is **8 or more levels** above the other side's (`RULES.protector.levelGap`), a **protector** joins the weaker side: **Oberih the Warden** (`oberih` in `data/enemies.ts`). It is deliberately out of balance: capped resistances, huge health and regeneration, near-certain hits and chaos strikes that one-shot or almost one-shot even high-level heroes. Attacking the weak never pays.

- It applies whenever players stand on both sides: when a fight between players starts, and whenever someone joins (including a high-level player joining a fight against a weak player). A side gets at most one.
- It never appears in fights against monsters.
- It gives no experience and drops nothing.

`guardSides(state)` applies the rule; tests in `sim/sim.test.ts` check that monsters can't join, that close levels bring no protector, and that a level-2 hero attacked by a level-10 hero wins within three rounds with the protector.

The battle screen plays a `join` event with a banner ("A warden stands with the weak") and the protector's own figure (a tall robed warden with a golden halo and staff). Until the server exists, `__game.actions.devJoinPlayer(level, side)` in a development build simulates another player joining the current fight.

## Losing in PvP — to decide

Recommended: the loser drops quest cargo and part of the gold being carried, never equipment or levels (the game's existing rule: no de-levelling, no gold debt). Gold is safe once stored in a green town.

## Economy — planned

Lower item and gold drop rates; higher prices; more gold sinks (repairs, travel, respecs, fees). A player who stays in green zones must still afford the basics. Red-zone quests pay most of the gold.

## Server requirements — planned

Real PvP and joining need the multiplayer backend (Supabase, as planned): shared positions per zone, the authoritative turn server running the same deterministic `sim/battle.ts`, and gold, items and cargo held on the server. Local saves can be edited, so a scarce-gold economy must not trust them.

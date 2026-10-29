[Docs](../index.md) › Game › Vertical slice

# Vertical slice: design and technical plan

> The first playable build, due 2026-11-04. Kyiv hub, one zone, the level 5-10 boss, all three classes to level 10, the full battle loop, loot, gear sets and saves, deployed to GitHub Pages. Everything else in the interview answers grows on the same engine and data.

## What a player does

1. **Title → slot → create a hero.** Name (random cossack name button), kozak/kozachka, face, hair, hair colour, moustache, class.
2. **Kyiv hub.** Ivan Sirko gives the main quest. Grand masters teach class skills: Olha (Kharakternyk, fire), Sviatoslav (Lytsar), Ustym Karmaliuk (Plastun). A merchant buys loot and sells potions; a chest is the stash. The gate leads to the zone.
3. **Vyshhorod outskirts (levels 1-10).** Free movement with a fixed ~50° camera. Packs of upyrs, vovkulaky, mavky, chorty, potopelnyky and the orc horde. Tap a mob for Attack / View; aggressive mobs (or ones far above your level) charge on sight. Beaten packs respawn: common ones after 2 minutes, elite ones after 6, Likho after 20 (and all of them when you ride out from Kyiv). A ruined shrine and a kurgan stone are quest objects.
4. **Battle** in a separate side-view scene, Taern style. Loot, XP and gold on a win; the death god's cards on a loss.
5. **Boss: Likho One-Eye** at the zone's end, two phases, summons up to four upyrs. Beating it ends the slice's main quest.

## Battle rules (as implemented)

- Two rows × three slots per side. Solo hero for now; the engine takes any number of actors per side.
- **Planning, then resolution.** Each round has a 15 s timer. A player spends **5 AP** across up to **5 attack slots** (each action costs 1-3 AP) and **3 defence toggles** (melee / ranged / mental: each is on or off, 1 AP when on, so at most 3 AP on defence). Pressing **Ready** early adds initiative. When everyone is ready or the timer ends, the round resolves into a list of events, and the UI plays them.
- **Plans carry over.** The next round's slots start as the last round's plan, fitted to the AP, resources and foes left (`fitPlan` in `sim/battle.ts`; an attack whose target died moves to the weakest foe it can reach).
- **Tactics.** Three saved plans (attacks + defence, no targets) on the planner: tap 1-3 to switch, long-press or the save button to store the current plan. The selected tactic also fills a new battle's first round.
- **Order:** slot 1 of every actor by initiative (speed + early-ready bonus + small roll), then slot 2, and so on, so the round feels simultaneous.
- **Hit chance** is deliberately swingy: base 70% + accuracy vs evasion; −25% if the target defends that action's delivery this round (for every attack of that delivery, not just the first), +15% if it doesn't. Clamped to 5-95%. A miss that the defence caused shows as a block.
- **Two separate tags per action:** _delivery_ (melee / ranged / mental), which defence pools block, and _damage type_ (physical / magical / chaos), which resistances reduce. Taern does the same, and it keeps defence planning readable.
- **Resources:** HP, mana, stamina. An action can cost any mix. Mana and stamina regenerate each round from stats and gear.
- **Bar:** Strike, Throw stone, Retreat (+evasion vs melee this round), **Flee**, six skill slots, HP and mana potions. Flee is an action like the others (1 AP, one slot) showing its escape chance (speed vs the foes', worse against bosses, 10-75%); queue several tries in one round, and the first that succeeds ends the battle.
- **Status effects:** burn (damage each round), freeze (−2 AP next round), stun (loses next round).
- **Auto-battle** toggle (above Ready) plans the hero's rounds with the same AI the enemies use; it never flees. No speed controls.
- **Bosses:** a phase list (HP threshold → new skills, summons). Up to 4 summons.

## Progression and loot

- Classes: Plastun (Dex), Lytsar (Str), Kharakternyk (Int). A class is pure data: base stats, start node on the tree, its grand master and its 8 skills (6 taught, 2 hidden behind a quest or condition).
- Skills level with the character for now; a `skillLevel()` hook is where gems or other sources plug in later.
- Shared passive tree: one point per level, classes start in different corners, cheap respec in town.
- Items: 10 slots, Normal / Magic / Rare / Unique / Set, prefix/suffix affixes tiered by item level, attribute and level requirements. **Sets** are not class-bound: whoever meets the requirements can wear them, and the bonus grows with pieces worn. The slice ships 3 sets and 6 lore uniques. Items carry empty `sockets` for runes later.
- Four crafting relics: reroll, upgrade rarity, add affix, remove affix.
- 40-slot inventory, 40-slot stash, a simple loot filter (hide below a rarity), designed as a rule list so richer filters slot in.
- **Death:** pick one of five face-down cards: no penalty, lose part of the current level's XP progress, or lose part of your gold. Never a level down, never a gold debt.

## Architecture

```text
src/game/
  data/      Content as typed data, validated with zod at load: classes, skills,
             enemies, items, affixes, sets, uniques, tree, zones, NPCs, quests
  sim/       Pure TypeScript, no React or platform code: seeded RNG, stats,
             battle engine and AI, loot, crafting, progression, quests, death cards
  state/     The game store (one immutable state object + actions), saves
             (versioned, migrated, encrypted) and the auth wrapper
  i18n/      Game strings, en + uk, falling back to en for other locales
  render/    The 3D world (react-three-fiber + three.js) and the art kit
  ui/        Game HUD and widgets, virtual joystick, input (keyboard, gamepad)
  screens/   Title, creation, world, battle, character, inventory, tree, …
```

- **The sim is the source of truth** and never touches rendering. A battle is `createBattle(seed, sides) → submitPlans → resolveRound → events`, deterministic for the same seed and plans. That is what a future authoritative turn server (Supabase) runs, and what coop and PvP reuse.
- **Rendering is swappable.** The world asks an _art kit_ for an actor, a prop or a tile by kind. The slice's kit builds low-poly primitives in code (no downloads, tiny bundle); a kit made from glTF models or 2D sprites replaces it without touching game logic. The battle scene is plain React Native views animated with Reanimated, so it already works the same on every platform.
- **One 3D stack everywhere:** `@react-three/fiber` on three.js. On web it draws into a WebGL canvas; on iOS and Android it resolves to its native entry on `expo-gl`. A WebGPU renderer (react-native-wgpu) can replace the GL context later without touching scenes.
- **Input** is one intent (a move vector + actions) fed by WASD/arrow keys, a gamepad (browser Gamepad API) and an on-screen joystick.
- **Saves:** three slots. A save is JSON with a version number, run through migrations on load, then encrypted (a keyed XOR stream with a checksum: tamper-evident, not secure, which is the "simple encryption" asked for) and stored through the app's `LocalValue` (MMKV on native, `localStorage` on web). Autosave after every battle and zone change.
- **Auth:** an `AuthProvider` interface with an anonymous provider (a random device id). Google and Apple sign-in add providers; the save is keyed by the local slot, so linking an account keeps it.
- **Naming:** the game's name comes from `EXPO_PUBLIC_APP_NAME`; nothing in code says "sichen".

## Deployment

`.github/workflows/pages.yml` exports the web build with `EXPO_BASE_URL=/<repo name>` and publishes it to GitHub Pages on every push to `main`. The manifest, service worker and page links are relative to that base, so the PWA installs and works offline from the sub-path. One-time setup: **Settings → Pages → Source: GitHub Actions**.

## Out of the slice (engine ready for them)

Other zones and bosses, levels 11-20, ascendancies, support runes and sockets in use, crafting bench, coop and PvP, cloud saves, Google/Apple sign-in, music, other languages' game text, export/import of saves.

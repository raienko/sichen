# Handoff: Sichen vertical slice

> Everything a fresh session needs to continue the game with no other context. Read this, then [docs/game/vertical-slice.md](game/vertical-slice.md) (design + architecture), then the code under `src/game/`.

## Current design and later features

The [game documentation](game/README.md) indexes the current design references. Battle and character/inventory now use the wilderness-style low-poly art. The [Salt Road chase quest](game/post-mvp/salt-road/README.md), with its two illustrations, is planned for after MVP; it does not expand the slice or imply implemented racing/PvP.

## The goal and the deadline

A casual dark-fantasy RPG on Ukrainian/Slavic folklore, cossacks as heroes: free 3D exploration with a fixed PoE2-like camera, Taern-style turn-based battles in a separate side-view scene, a simplified PoE2 passive tree and loot, Taern-style gear sets. Expo / React Native for iOS, Android and web; **the deployed target is web on GitHub Pages**.

**Hard deadline: 2026-11-04** (cloud credits end). The agreed target for that date is a **vertical slice**: Kyiv hub + one zone + the level 5-10 boss, all three classes to level 10, full battle loop, loot, sets, saves, deployed to GitHub Pages. Cut scope before slipping the date.

## State on 2026-10-29 (end of the second session)

`main` (PR #2 merged, Pages run #2 green, `https://raienko.github.io/sichen/`) has the slice plus:

- **Portrait and landscape**, a **floating joystick** (appears under the finger anywhere on the world that isn't an NPC/foe/quest object; a quick tap walks there), the battle's one **Ready button** carrying round + countdown, Auto above it.
- **Battle rework**: on/off defence per delivery (max 3 AP, −25% to be hit all round); plans carry over (`fitPlan`); **3 tactics**; **Flee** as a bar action with its %. Saves are version 2.
- **Balance**: Likho at level 9 is 25-42% on auto for every class.
- **Polish**: zone-tinted battle backdrop, one mesh per building, a skippable tutorial in Sirko's voice, a turning hero preview on creation.
- **Native works on iOS and Android** (owner-verified): one three.js in the bundle (`metro.config.js`), `paceFrames` + `GLFrame` (`render/native-gl.tsx`) so the simulator's software GL doesn't queue stale frames, and patches so a build without an EAS project ID doesn't crash on Android (`patches/expo-observe+…`, `patches/expo-image+…`, `expo.autolinking.android.buildFromSource` in package.json).

Branch `claude/sichen-followups` (from `main`, not merged yet) adds:

- Battle unit names wrap to two lines in a fixed-height box; units are 80 pt wide on narrow screens so four columns fit.
- **Level badges** on battle portraits and in the pack inspect panel, coloured by danger vs the hero: grey ≤−5, green −4…−2, amber −1…+1, orange +2, red +3…+4 (packs charge on sight from +3), purple ≥+5; gold for the hero. `levelTone()` in `ui/palette.ts`, `LevelBadge` in `ui/level-badge.tsx`.
- Inventory on phones: under 760 pt the selected item's card and buttons dock in a `Sheet` footer instead of sitting below 40-80 slots. The merchant's sheet carries the merchant's name. Item tiles have accessibility labels.
- A tenth tutorial hint on the death screen; the landscape world menu on one row.
- The native GL debug logging is removed.
- `scripts/e2e/items.mjs`: vendor, stash and relic flows through the UI (passes at 1280×800 and 390×844).
- **Mob respawn**: cleared packs come back after `RULES.respawn` seconds by rank (common 120, elite 360, boss 1200), held back while the hero is within 8 tiles of their home. Saves are version 3 (`world.cleared` is pack id → time cleared).

## What next, in priority order

1. **Merge `claude/sichen-followups`** (PR) and check the Pages run.
2. **Play-test with people** on real phones (the simulator speed-ups are off on devices; the full-resolution MSAA path is only owner-checked). Tune from what they say: the boss numbers are for auto-battle; watch the Plastun (weakest on auto) and how often players flee.
3. **Content to fill the slice's band**: the slice has one zone for levels 1-10. If testers run out of fights before level 9, add packs to Vyshhorod (data only, `data/zones.ts`) before anything else.
4. After the slice: zones/bosses for levels 0-5, 10-15, 15-20, ascendancies, sockets/runes, crafting bench, coop/PvP on a Supabase authoritative turn server, Google/Apple sign-in, music, more languages.

## Decisions already made with the owner (do not re-ask)

Answers to a 146-question interview (IDs V/E/C/S/L/W/U/T/A/M):

- **Scope (V)**: 5-15 min sessions, 16+. Three bosses after an intro band: one per level band 5-10, 10-15, 15-20 (the slice ships only the 5-10 one, Likho). Landscape on phones but **not hardcoded** (orientation is "default"). Ukrainian + English at launch, **RTL-ready** (use `start`/`end` styles), more languages later (Polish, German, Spanish, Chinese, Japanese, Slovenian…). **Never hardcode "sichen"**: the game name comes from `EXPO_PUBLIC_APP_NAME` / brand config.
- **Death (V10)**: Taern style; pick one of face-down cards, penalties from none to losing level progress or gold. **Never de-level, never gold debt.** Implemented in `sim/death.ts`.
- **Exploration (E)**: fixed ~50° camera, hub + instanced handcrafted zones, minimap, static lighting. Tapping a mob opens an interaction menu (attack / view). **Aggressive mobs** charge on sight, and so do packs 3+ levels above the hero. Packs reset when you ride out from town, and **respawn on a timer** (owner request, 2026-10-29): common 2 min, elite 6 min (`rank: "elite"` on the pack), a boss 20 min, never on top of the hero, never quest packs (`sim/respawn.ts`, `RULES.respawn`). Quest interactables exist.
- **Combat (C)**: solo now, party up to 5 later; 2 rows × 3 slots per side, side view. Each round a **15 s** planning timer; all plans combine into one resolved scenario that is then animated. Initiative = speed + bonus for pressing **Ready** early. **5 AP**, **5 attack slots**, **3 defence pools (melee / ranged / mental)**. Resources **HP, mana, stamina**, one action can cost several; resources regen each round. Bar: strike, throw stone, retreat + 6 skill slots + HP and mana potions. Damage types physical / magical / chaos. Statuses freeze / stun / burn. **High Taern-like randomness**; accuracy from stats/gear, and a target with 0 defence vs that delivery is easier to hit. Auto-battle toggle, **no speed controls**. Flee allowed. Bosses: up to 2 phases, up to 4 summons. PvP later with the same flow.
- **Skills (S)**: classes Plastun (rogue, Dex), Lytsar (knight, Str), Kharakternyk (mage, Int); new classes must be pure data. **Grand master NPCs** teach class skills (Olha fire/mage, Sviatoslav knight, Ustym Karmaliuk rogue); 6 skills + **2 hidden** per class (unlocked by quests). Shared passive tree, 1 point/level, respec in town. Skills level with the character for now; keep room for skill gems (`skillLevel()` in `sim/hero.ts`). PoE2-like ascendancies later.
- **Loot (L)**: Normal/Magic/Rare/Unique/Set, prefix/suffix tiers by item level, 10 slots, weapons sabre / bulava / spear / bow / staff / flintlock. Gold + 4 relics (reroll, upgrade rarity, add, remove). 1-3 drops per battle, 40-slot inventory + stash, requirements, vendor. Simple loot filter now, richer later. **Sets are not class-bound**: meet the stat requirements to wear; bonus by pieces worn. No set binding when trading (later). Sockets/runes/crafting later (`Item.sockets` exists).
- **World (W)**: alt 16th-17th c. Sich era, dark folk tale with dry humour; hub Kyiv; zones Vyshhorod, Pereiaslav, Chernihiv borderlands. Act antagonist **Koshchei the Deathless, a necromancer**. **No real country names** (store-review risk); factions are fantasy allusions (the northern orc horde, half-orcs, a sultanate). Real historical figures are fine, respectfully (Ivan Sirko, Olha, Sviatoslav…). Quest types kill / explore / defeat; **branching choice supported, used in 1-2 quests** (the kurgan quest is the proof).
- **UI (U)**: icons and numbers, minimal text; dark parchment + vyshyvanka motifs. Customization: name (3-16, Latin + Cyrillic) with a **random cossack name button**, kozak/kozachka, 3 faces, 3 hairstyles, 4 hair colours, moustache. HUD: HP/mana/stamina, minimap, quest tracker, menu. Haptics + a **white blink on damage**. Virtual joystick and physical gamepad both wanted.
- **Tech (T)**: unify libraries across platforms (owner named three.js, react-native-webgpu, Reanimated, Skia, Lottie); deterministic TS sim separate from rendering; content as zod-validated data; saves encrypted with **simple** encryption, versioned with migrations; auth = interface + anonymous mock, Google/Apple later; backend later = **Supabase**. Jest for sim + one e2e smoke.
- **Art (A)**: stylized low-poly, **art style must be swappable**, 2.5D/2D fine if faster, free/CC0 assets.
- **Business (M)**: no monetization in the slice.

## Architecture in one screen

```text
src/app/index.tsx        → src/game (the game is the home route; /showcase keeps the boilerplate's demo)
src/game/index.tsx       scene switch: title | create | world | battle | death
src/game/data/           content + RULES (level cap 10, AP 5, 15 s rounds, …) + validateContent()
src/game/sim/            pure engine; battle.ts is the heart: createBattle → resolveRound(state, plans) → {state, events}
src/game/state/          store.ts (one immutable state, useGame), actions.ts (every mutation), save.ts/codec.ts, platform.ts (storage + auth), runtime.ts (per-frame world data, not in the store)
src/game/render/         world-scene.tsx (R3F loop: movement, camera, mobs, exits, regen), art-kit.tsx (swappable look), movement.ts
src/game/ui/, screens/   RN UI; battle.tsx plays events back with Reanimated
src/game/i18n/           game strings en + uk (other locales fall back to en)
```

Rules of thumb: the sim never imports React; UI never mutates state except through `actions.ts`; content changes go in `data/` and must pass `validateContent()`; selectors passed to `useGame` must return stored references (not new objects) or React loops.

## Running it

- Node **24.6** (`.nvmrc`; `package.json` engines refuse other versions, and the git hooks run yarn, so commits fail on the wrong Node). Yarn 1.
- `yarn install`, `cp .env.example .env`, set `EXPO_PUBLIC_APP_NAME="Sichen"` in `.env`.
- Dev: `yarn web` (do not set `CI=1`: it turns off Metro's file watching). In dev the browser console has `__game.{store, actions, runtime}`, e.g. `__game.actions.enterZone("vyshhorod", {x: 3, z: 17})`, `__game.actions.startBattle("p_likho")`.
- Checks: `npx tsc --noEmit`, `npx jest src/game`, `npx eslint src/game src/app`. Pre-commit runs prettier + eslint + secretlint.
- Production build like Pages: `EXPO_BASE_URL=/sichen npx expo export -p web --output-dir dist`, then serve `dist` under `/sichen/` (copy into `site/sichen/` and `python3 -m http.server` in `site/`).
- Headless browser testing: Playwright's Chromium with `--use-gl=swiftshader --enable-unsafe-swiftshader` renders the WebGL scene; drive the UI with `getByText` / `getByLabel` (buttons carry accessibility labels).
- Vendor/stash/relic check: `NODE_PATH=<a global playwright install> node scripts/e2e/items.mjs http://localhost:8081/ 390 844`.
- Full playthrough: with `yarn web` running, `NODE_PATH=<a global playwright install> node scripts/e2e/playthrough.mjs http://localhost:8081/ <classId> <spare|slay>` (Playwright is not a project dependency). It writes screenshots to `$SHOTS`.

## Gotchas found so far

- React Native 0.86 has no `StyleSheet.absoluteFillObject`; spread `StyleSheet.absoluteFill`.
- The React Compiler's lint rules are on: no refs read during render, no `Date.now()` in render, no setState directly in an effect body, don't mutate one shared value from two effects.
- FontAwesome6 is used in its **solid** set; the content test checks every icon name. There is no free sword glyph (the `khanda` glyph is a Sikh religious symbol, so don't use it); sabres use `slash`.
- Metro can run out of memory after a long dev session; start it with `NODE_OPTIONS=--max-old-space-size=6144`.
- lint-staged formats only `js/jsx/ts/tsx/json/md`, but the pre-push `yarn verify` runs `prettier --check .`, so run prettier on `.mjs` scripts yourself.
- A save-shape change needs a `SAVE_VERSION` bump and a migration in `state/save.ts` (v1→v2 is the example).
- Don't edit `src/` while a Playwright run is going against `yarn web`: Metro hot-reloads a half-written file and the run fails on the page error.
- expo-gl doesn't support every `gl.getParameter` (e.g. `FRAMEBUFFER_BINDING` throws), and three 0.184 defines `render` on the renderer instance, not the prototype.
- `docs.expo.dev` was blocked from the cloud container; AGENTS.md asks to read the v57 docs before writing code, so use them when the network allows.

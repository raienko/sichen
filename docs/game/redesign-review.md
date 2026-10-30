# Sichen: implementation review

Reviewed 30 October 2026. Scope: current working checkout, game source, running web app, and the five supplied art references. The references were treated as visual inspiration, not as instructions or a request to change the game's rules. This is a design review; the gameplay implementation has not been changed.

**Current direction:** the user retained seven fully 3D folk-world and management references. Follow [design-guidelines.md](design-guidelines.md). Earlier direction illustrations have been removed; the implementation findings below are preserved.

## What is implemented

The root route runs `src/game`, rather than the general component showcase described in the root README. The showcase remains available separately.

| Area          | Current implementation                                                                                                                                                                          | Redesign implication                                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Exploration   | A perspective 3D camera follows the hero; tile-map collision, tapping the ground, floating joystick, keyboard movement, browser gamepad movement, NPCs, enemy packs, aggro, zone exits, minimap | Keep the spatial maps and interactions. Denser decorative art must preserve paths, selection and hero visibility.                     |
| Combat        | Separate 2.5D encounter scene; two rows of three positions per side; solo player hero; seed-based resolution and event playback                                                                 | Change actor presentation, camera framing and HUD. A party shown in reference 3 would require additional product work.                |
| Planning      | 5 AP shared by actions and defence; up to 5 action slots; 3 defence toggles costing 1 AP each; 15-second round; Ready initiative bonus                                                          | Make this unusual shared budget explicit. Five slots do not mean five freely available attacks.                                       |
| Convenience   | Plans fit into the next round, retarget when necessary; 3 saved tactics; Auto; attack/skill/item/other picker                                                                                   | Show the queue order, target, costs and preset names clearly. These can remain the same systems beneath different layouts.            |
| Progression   | Lytsar, Plastun, Kharakternyk; skill learning and loadout; passive tree; level cap 10 for this slice                                                                                            | Character identity, class silhouettes and progression screens deserve as much attention as the battle backdrop.                       |
| Equipment     | 10 equipment positions, 40 inventory slots, stash, affixes, rarities, sets, uniques, four relic operations, loot filter                                                                         | Build a coherent item illustration family and make selected-item comparison easy to scan.                                             |
| World content | Kyiv and Vyshhorod outskirts; quests and NPC services; folklore enemies; Likho phases and summons; pack respawns                                                                                | Each zone needs landmarks and a distinct atmosphere. The supplied dragon is a scale/composition reference, not existing game content. |
| Persistence   | 3 local save slots, versioned migrations, autosaving and anonymous identity                                                                                                                     | Present saves and settings consistently. Cloud saves, account providers, co-op and PvP are future work.                               |

The implementation uses Expo 57, React Native, React Three Fiber/Three.js, an Expo GL path for native, React Native overlays, and Reanimated for UI motion. The exact [Expo 57 documentation](https://docs.expo.dev/versions/v57.0.0/) was read before authoring this review's supporting artifacts.

The useful boundary is `sim` → state/actions → renderer and screens. Battle events already express actions, hits, blocks, status changes, summons and death, so presentation can become richer without altering the rules. The terrain uses instanced geometry, which is a useful foundation for a larger environment kit.

The art kit is **not yet a formal renderer plug-in interface**. `world-scene.tsx`, `battle-scene.tsx` and `hero-preview.tsx` import concrete exports from `art-kit.tsx`. Replacing their internals with textured meshes or billboard sprites is feasible, but asset loading, animation clips, facing, selection bounds, head/feet projection, occlusion and disposal need deliberate implementation. A completely painted world also needs depth masks and matching collision geometry. Swapping a file alone does not solve those problems.

## Current design assessment

The brown/gold/red palette, Cossack names, three classes, folklore enemies and shared-budget planner already point toward a specific game. The UI keeps most controls at the edges and includes useful tutorial hints. The current art is procedural and lightweight, which makes it a good playable foundation.

The visible result still reads as a prototype. The title has a generic `app` name in the current environment, a horse icon and save-slot boxes. The creator is primarily a form with a small primitive preview. Kyiv's central square has large flat regions, and its NPCs read as small colored figures. The battle scene has a large quiet sky band and two small combatants surrounded by much stronger interface marks. The inventory uses the same general-purpose glyphs as the rest of the game.

These are observations from the running web build, not assumptions from the design plan. The plan also contains an outdated sentence describing battle actors as React Native views; the current `BattleStage` renders 3D figures.

### Priorities shared by every direction

1. **Make the round understandable.** Use numbered queue positions, visible action names, a shared AP budget, selected target and explicit defence labels. Explain delivery versus damage type in action details. The current picker shows names and resource costs, but little tactical explanation; defence type and several picker tabs are icon-only visually.
2. **Improve touch and keyboard access.** `ui/kit.tsx` gives normal buttons a 40-point minimum and compact buttons 30 points. The picker close control is 30 × 30; tactic tools are 42 × 42. Several planner `Pressable`s have labels but no button role, and they appear as containers in the browser accessibility tree. Use at least 44-point effective targets, button semantics, visible focus, keyboard activation, and selected/disabled state. A paint change alone does not fix these.
3. **Spend more screen area on the encounter.** Frame actors closer in solo fights; expand framing as the roster grows. Keep head/feet projections and target hit areas aligned. Preserve enough room for six positions on either side and up to four boss summons. Do not bake actors into background paintings.
4. **Add world orientation.** Give Sirko, class trainers, merchant, stash and exit unmistakable silhouettes, labels or nearby interaction prompts. Build the central shrine/church, gate and river into recognizable navigation landmarks. The existing minimap helps, but it cannot carry all wayfinding.
5. **Give the whole journey the same identity.** Title → hero creation → world → combat → loot → inventory → death should share materials, portraits, ornaments and type. Use a display face with Ukrainian glyph coverage for names and headings; retain a readable functional face for costs and descriptions.
6. **Preserve readability as art detail grows.** Reserve low-detail ground behind actors, use contact shadows and target rings, soften occluding foregrounds, and maintain readable HP/mana/stamina and status labels. Test 390-point portrait, short landscape and large text early.

### Implementation concerns to resolve alongside art

- Ground tapping steers toward a destination with collision sliding; it does not search for a route around obstacles. Richer forests and architecture would expose that limitation more often. Either add pathfinding or constrain the initial decorated routes and make unreachable destinations explicit.
- The source has simulator-specific GL scaling and frame pacing. More geometry, textures and effects must be measured on physical mobile devices; passing a web preview is not evidence of native performance.
- The root README describes the boilerplate, and the vertical-slice document mixes a plan with implementation claims. Update these when a production direction is selected so later work follows the actual renderer and game surface.
- The initial game-test command picked up a nested `.claude/worktrees` checkout and emitted duplicate package/mock warnings. The isolated current-checkout test passes. This is a test-discovery configuration issue, not a game-simulation failure.

## Verification

The inspected checkout passed type checking and 27 isolated simulation tests. The initial test run also found a nested worktree and duplicated tests; the isolated run is the relevant count. No gameplay implementation changes were made for the concepts.

See [approved references](redesign-concepts/README.md), [the battle specification](combined-design.md) and [the management specification](other-scenes-design.md).

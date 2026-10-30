# Wilderness exploration: practical 3D crawler direction

Current authority: [approved design guidelines](design-guidelines.md). This detailed specification supports the retained concepts.

30 October 2026. This is the **out-of-town** exploration design for finding enemy packs, quest landmarks and bosses. The earlier Kyiv image is a hub reference, not the wilderness proposal. All images are design references; application code has not changed.

## Recommended implementation scope

Borrow the **top-down, modular presentation of a 3D crawler**, while keeping the existing RPG's movement, progression and separate tactical battles. For the first slice, polish the current tile-map world with a small set of hand-authored clearings and paths. This is the lowest engineering change because free movement, collision, packs, aggro, exits and encounter transitions already exist.

The more cinematic woodland concept demands a larger coherent asset set, more detailed composition and more foreground/occlusion work. A high camera and modular clearings reduce that burden. This is an estimate of relative implementation scope from the current code, not a measured performance or schedule claim.

[Recommended modular crawler concept](redesign-concepts/wilderness-crawler.png)

| Approach                                                                  | Work relative to the current project                                                     | Fit                                                          |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Current movement with high-camera modular clearings on authored tile maps | Lowest engine change; replace/enhance art and HUD                                        | Recommended first step                                       |
| Explicit room-by-room travel with authored room layouts                   | Additional transition, camera and encounter-placement work                               | A sensible next scope if distinct room boundaries are wanted |
| Procedural room layout with the existing tactical battles                 | Generation, connectivity, valid spawns, quest placement, deterministic saves and testing | Add after the authored presentation works                    |
| Full action roguelike / run-based progression                             | New combat/input/progression/death decisions as well as generation                       | A broader game redesign                                      |

The simpler **visual structure** is the immediate advantage. Procedural generation and permadeath are separate choices; the appearance does not require either. Preserve persistent heroes, inventory, quests, current death consequences and the existing combat planner unless the user explicitly changes the game design.

## World construction

- Keep the current 3D renderer and tile/collision model. Start with the existing high follow camera made steeper and more restrained. A near-orthographic appearance is an art target; changing projection is optional, not a prerequisite.
- Build a small reusable kit: ground, path, a few rocks, a few tree clusters, shallow water/ford, a shrine, a camp and a distinctive boss marker/arena. Concentrate folk identity in the Cossack silhouette, carved shrine, cloth, enemy shapes and palette.
- Compose hand-authored clearings connected by short readable paths within the existing zone. No new room-generation framework is needed just to make the map look like a crawler.
- Keep main routes and enemy figures visible. Low borders and deliberately placed trees are easier to read than dense realistic undergrowth and large foreground trunks.
- Use the existing instanced terrain as a starting point. A smaller mesh/material family can help control rendering work, but actual native performance still needs measurement.
- The concept's room arrangement is illustrative. The existing Vyshhorod quest/pack coordinates remain authoritative until an explicit map redesign is implemented and checked.

## Existing wilderness content to preserve

Vyshhorod is already a 48 × 36 tile zone with paths, a river/ford, wooded clearings, an enemy camp, shrine, kurgan, packs and a boss hollow. The game's enemies include horde fighters, upyrs, mavka, vovkulaky, drowned creatures and chorty.

The selected encounter example uses the real aggressive elite Vovkulaka pack at levels **5 and 4**, with a sample level-5 hero. Likho's existing boss pack is **level 10**. Use these actual content definitions rather than inventing a boss level, adding a raid party or assuming enemies fight directly in the exploration renderer.

Quest progress such as `3/6` refers to its actual quest objective. In particular, the main horde-raider kill objective does not advance just because a wolf is selected or defeated.

## Exploration HUD

- **Upper left:** small hero portrait and level, thin HP/mana/stamina bars. Keep this informational and unframed.
- **Upper right:** compact minimap showing terrain, player heading, existing enemy-pack marks, quest landmarks and distinct boss mark. A short zone label and one tracked-quest glyph/count are enough. The current minimap already uses zone data and live mob positions; the proposed roomlike appearance must continue to reflect actual terrain rather than a decorative node-travel diagram.
- **Lower left:** the current floating movement stick; ground tapping and keyboard/gamepad input remain available.
- **Lower right:** a context action with an Inspect eye when a mob pack is focused, or an interaction glyph near a quest object. A compact arc provides personal inventory, character, skills and journal/menu access. Use short focus text such as the enemy name and levels, not a large monster card.
- **Center:** the playable 3D world and passive cues. Keep fixed HUD buttons away from the central region and foldable hinge.

The five battle action slots, AP, Auto, tactics, defence and Ready belong to the **battle** scene. Do not copy them into wilderness as a real-time skill hotbar.

## Encounter readability

Nearby meaningful objects get restrained interaction cues; the focused pack has a clearer silhouette outline and ground ring. Shrine/quest-object cues use the neutral/gold interaction language. Enemy level and an aggression mark communicate danger. Do not outline every tree, rock or distant decoration, and do not make all hostile packs look like friendly golden services.

Voluntary interaction preserves Inspect → explicit Attack → movement/contact → separate tactical battle. **Aggressive packs can still chase and start battle on contact**, as the engine currently does; an Inspect affordance does not make the player immune or force every encounter through a confirmation.

The boss should be discoverable through an identifiable hollow/arena and map cue. A full boss HP bar or battle action planner does not need to remain on screen while travelling through the forest.

Battle results already deliver loot into the current reward/inventory flow. Do not add ground-loot piles, harvesting nodes, food, chests or gathering currencies merely to make the crawler image feel busy.

## Reach, input and camera

Keep frequent controls near lower outer edges with effective targets of at least 44 logical points. On landscape, split movement and context/menu controls between the left and right thumbs. On foldables, keep controls and their expansions outside a center exclusion region, including transparent hit padding.

A high camera helps expose nearby packs and junctions before contact. It also makes small figures less expressive, so invest in strong silhouettes and concise level/selection marks rather than detailed face animation for every wilderness model. Closer merchant, character and battle views can retain richer presentation within their bounded scenes.

The current ground-tap movement steers directly with collision sliding; it is not pathfinding. Clear authored routes reduce frustration, but any design that expects the hero to navigate around complex room walls needs either routing work or a more limited tap-move contract. Do not assume a roguelike camera creates pathfinding automatically.

## First practical slice

Use one authored wilderness stretch with a junction, one quest object, one ordinary pack, the existing aggressive two-wolf pack and a recognizable route toward the boss. Reuse the current battle transition and test returning to the same world position. Validate target hit areas, aggro, collision, quest progress and respawn behavior after any map/layout changes.

Only after this looks and plays well should procedural layouts, room locks, run resets or permadeath be considered. They are not required for this presentation and are not part of this design pass.

[Merchant concept](merchant-design.md) · [Shared design](combined-design.md)

# Combined direction: Sichen — Living Folk World

Current authority: [approved design guidelines](design-guidelines.md). This detailed specification supports the retained concepts.

30 October 2026. This specification records the retained fully 3D folk-world direction. The [implementation review](redesign-review.md) records the inspected engine capabilities. Gameplay code has not been changed.

The user accepted the battle scene and continued to [exploration, inventory, character and skills](other-scenes-design.md). Those scenes carry the same visual language and reach rules forward.

Later refinements cover the [physical merchant-shop interface](merchant-design.md) and [out-of-town wilderness / modular crawler approach](wilderness-design.md).

## Design decision

Keep the **fully 3D game**, the current movement and tactical engine, and the elevated camera. Combine autumn environment atmosphere, Cossack silhouettes and Ukrainian folk motifs. Express the folk treatment through costume, architecture, texture, sound and small interface marks. Use the updated wilderness-style low-poly kit: broad faceted geometry, flat matte surfaces, muted woodland colors and soft lighting, assembled from free models, procedural additions and generated texture motifs.

[Open the updated low-poly portrait, landscape and foldable concept](redesign-concepts/living-folk-world-arc.png)

The world fills the entire screen. The HUD floats over it as small, separate symbols and thin resource marks. There are no permanent header/footer sections, command desks, card frames or rectangular actor panels. A subtle edge vignette supplies contrast. Decoration never competes with targets, resource levels or touch affordances.

## Visual language

- **Environment:** weathered stone paths, timber fences, a recognizable Ukrainian chapel silhouette, Dnipro mist, reeds, amber trees, burial stones and embroidered cloth tied to branches. Compose navigable clearings rather than covering every tile in props.
- **Characters:** readable 3D silhouettes; white linen, oxblood sash and trousers, oseledets haircut, saber and boots. Classes differ through silhouette and equipment: Lytsar's stance and saber, Plastun's light kit, Kharakternyk's staff and restrained supernatural effects.
- **Creatures:** each folklore enemy has an immediately recognizable shape. Likho reads as a large one-eyed figure; its eye and posture communicate focus and phase change. Use the existing events and statuses, without inventing extra mechanics.
- **Color:** moss and slate for the environment, warm daylight/torchlight, quiet linen/bronze HUD marks, oxblood for folk accents and danger. Keep red HP, blue mana and ochre stamina visually consistent.
- **Folk detail:** small red embroidery stitches at selected edges; incised geometric motifs on shields and relics; carved wood and woven cloth in the world. Avoid decorative frames around every control.
- **Motion:** existing walk, lunge, hit and fall behavior grows into a small animation set. Leaf movement, fire flicker and fog add atmosphere economically. Honor reduced motion; effects should reinforce existing state changes.

## Informative with little text

Permanent information is mostly pictorial. Keep numerals where they prevent ambiguity.

| Meaning          | Visible treatment                                                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero resources   | Small portrait or class silhouette plus three thin HP/mana/stamina bars                                                                                   |
| Selected foe     | Ground ring and compact target silhouette/health mark                                                                                                     |
| Action order     | Exactly five circular queue slots, always visible in one horizontal row, with tiny 1–5 indices; action glyph inside; AP cost ticks                        |
| Remaining AP     | Five pips, with **filled = remaining**, plus a small `1/5` count                                                                                          |
| Defence          | Circular sword, bow/arrow and eye controls curving around Ready; selected defence has a stronger amber outline/fill, with no separate checkmark           |
| Round/time/Ready | Small round numeral, draining timer arc and `12s`; a distinct large confirmation check                                                                    |
| Status           | Flame, frost or stun glyph with remaining turns                                                                                                           |
| Tactics          | Three directly visible preset buttons (1–3), Save and Erase/Clear, directly above the five-slot row                                                       |
| Auto             | One automation toggle replacing the target circle, action-slot-sized and bottom-aligned with the action row, at the lower-left end of Ready's control arc |
| Target selection | Existing foe selection in the 3D scene; the separate target/crosshair HUD button is removed                                                               |
| Quest direction  | At most one tracked objective glyph/direction cue; open the journal for the actual text                                                                   |

Short action names and explanations appear in an anchored action picker or deliberate detail view. Costs, current target and selected states must be apparent before confirmation. Icons should come from a single visual family and be taught through the existing tutorial. All controls retain full accessible names and state; minimum text does not mean removing explanations from assistive technology.

### Fixed action-group contract

The user's latest correction takes precedence over the concept board's earlier two-row action arrangement. **Exactly five action slots stay in one horizontal row on every layout**, including empty `+` placeholders and states with insufficient AP. Do not wrap them, hide unused positions, turn them into a carousel or reduce their count.

Keep **AP counter and the complete tactics controls above the action row**. The latest correction moves Auto to the former target-button position at the lower right. All three tactic presets, Save and Erase/Clear remain directly accessible, preserving the current game's behavior. They are not hidden behind a single strategy icon. Tap preset 1–3 to switch, use Save (or the existing long-press) to store the current plan in the selected preset, and use Erase to clear the current plan. Erase does not silently delete a saved preset.

On narrow layouts, use three shallow rows: **AP**, then **tactics 1 / 2 / 3 + Save + Erase**, then **actions 1 / 2 / 3 / 4 / 5**. The five tactics tools and the five action slots can each fit a 236-point row before outer padding with 44-point targets and four 4-point gaps. Wider layouts may put AP and the tactics tools in one utility row if the full hit areas still fit outside the center exclusion region. Keep the utility rows attached to the action group; never move them below it.

### Ready and the curved right-hand controls

Keep Ready at its existing anchor and size. Replace the former target/crosshair circle with **Auto**, enlarge Auto to the same diameter as an action slot, and align its bottom edge with the action-slot row. Remove the old Auto from above the actions so there is exactly one Auto control.

Arrange Auto and the three defence controls as four separated circular controls on a smooth partial circle around Ready. Auto sits at the lower-left end; melee is above it toward Ready's left, ranged farther upward and inward, and mental near the top of Ready. Follow the user's round-button reference using minimal sword, bow/arrow and eye glyphs. The arc must be visible; the defence buttons must not form a straight row. Keep Ready fixed and adjust the arc's radius/spacing to fit safe areas, effective touch targets and hinge clearance.

Remove the separate checkmark below the active defence. Its selected appearance uses a warm outline/glow, stronger stroke/fill and selected state exposed to assistive technology. Use plain circular button outlines without dangling ticks or ornaments. Preserve the confirmation checkmark inside Ready. All five action slots, three tactic presets, Save and Erase remain unchanged.

Use 44-point minimum effective targets and restrained gaps. Five 44-point targets plus four 4-point gaps require 236 points before outer padding; reserve that width when placing the group. Keep its full hit rectangles outside a fold/hinge exclusion area. Never solve a layout conflict by silently wrapping the slots into three plus two.

## Reach and fold rules

The rendered image is a composition study. The layout rules below are the implementation specification; positions in a generated image are not touch-target measurements.

### Portrait: one-finger operation

- Keep frequent controls within the lower third, with the most frequent ones closest to the lower corners. Place action queue, AP and tactics as a compact outer-edge group; Auto and the three defences curve around Ready in the other small group. Keep the upper resource marks informational.
- Offer a mirrored dominant-hand layout. Keep the five-slot row intact, with AP/Tactics immediately above it and Auto in Ready's arc. Where reach testing shows a control is too far away, move its expansion to the dominant-hand corner rather than asking for a second hand.
- A slot tap opens an **edge-anchored fan or short tray** close to that slot and the active thumb, over the world. It must stay within the display and the reach region. Use a short scrollable icon strip for larger action libraries; do not force all skills into one tiny radial menu.
- Retain foe selection in the scene. The separate target/crosshair button is removed by the latest user correction; do not reintroduce it in the right-hand arc.
- Preserve the existing ability to move with one floating joystick or ground taps in exploration. Movement and interaction are sequential; avoid requiring a held joystick plus a distant interaction button.
- Visual glyphs may be small, but effective targets are at least 44 × 44 logical points, with separation to prevent overlap. Use a larger distinct Ready target. Respect safe-area and gesture insets.

### Landscape: two outer-edge thumb groups

- **Lower left:** one horizontal row of five action slots, with AP and Tactics directly above it.
- **Lower right:** Ready/time at its existing anchor, with Auto and three defences curving around it. Auto's bottom edge aligns with the action row.
- Anchor to safe-area edges, not to a centered fixed-width HUD container.
- Leave the middle for the 3D encounter. Avoid a continuous bottom toolbar: it encourages both clutter and accidental central targets.
- In exploration, use the left floating stick and a right interaction/menu group. Nearby interaction prompts appear at the same right-edge location, not as a mandatory distant world tap.

### Foldables: no mandatory center interaction

- Treat the hinge/fold region as an exclusion rectangle for **all HUD hit areas**, including transparent padding, picker expansions, tooltips with actions and modal close buttons.
- Keep queue/picker fully in the left outer reach region and the Ready/Auto/defence arc in the right, or mirror them. Broad portrait foldables can use this split layout too; orientation alone is insufficient.
- Center space may display the world and passive effects. No action slot, confirmation, inventory button or mandatory target selector belongs there.
- If reliable hinge bounds are available, expand those bounds by a comfort margin. Otherwise use a conservative center exclusion band for the split mode and a user-selectable split layout. A 96-point band is a starting design parameter, not a universal hardware measurement.
- Frame important actors outside the hinge where possible. Recompute camera framing, projected labels and target hit areas when the window changes. An artwork with a clear hinge does not prove runtime posture handling.
- Use layout and touch tests at a narrow phone size, a short landscape size and representative unfolded widths. Check reachable picker states, full rosters/summons, system text scaling and actual devices before calling the interaction validated.

## Free and generated asset route

These official sources were checked for this proposal. The fit to this art direction is a design judgment; the license and formats below come from their published pages.

| Source                                                                                                 | Verified offering                                    | Proposed use                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Kenney Fantasy Town Kit](https://kenney.nl/assets/fantasy-town-kit)                                   | 3D assets, CC0                                       | Start with modular buildings, fences and settlement props; alter roofs, proportions, palette and cloth details to establish Ukrainian identity                       |
| [Quaternius Ultimate Animated Character Pack](https://quaternius.com/packs/ultimatedanimatedcharacter) | Animated characters, CC0; FBX, OBJ and Blend formats | Evaluate a base rig/animation set, adapt clothing and accessories, export to a suitable glTF/GLB pipeline; do not assume the existing models are ready-made Cossacks |
| [Poly Haven](https://polyhaven.com/license)                                                            | Models, textures and HDRIs under CC0                 | Selectively use stone/wood/ground materials or reference lighting; reduce texture resolution and match the stylized kit                                              |
| Existing procedural art kit                                                                            | Project-owned primitive actors, terrain and props    | Keep working movement, collisions, fallback figures, instancing and simple custom geometry; add hairstyle, sash, saber, shrine and folklore silhouettes              |
| Generated assets                                                                                       | Original 2D artwork created for the direction        | Generate texture motifs, cloth patterns, portrait references and material studies; build or adapt actual 3D geometry separately                                      |

Generated images are **not automatically usable animated 3D models**. An economical pipeline is free base meshes/rigs → a small set of custom/procedural Cossack and folklore additions → consistent materials → shared export settings. Keep the national identity in a few well-chosen bespoke silhouettes and motifs rather than relying on stock medieval assets unchanged.

No assets have been downloaded, installed or integrated as part of this proposal. Actual pack contents, formats, animation compatibility and device budgets must be checked during implementation. The design does not require a paid asset pack or a different game engine.

## Mapping to the current code

1. **Preserve simulation, progression and saves.** No combat-rule or save-schema change is required for this direction.
2. **Keep the current world structure.** `world-scene.tsx` already fills the world view. Replace/enhance the shared art kit, add models/materials, and improve environment composition.
3. **Make battle genuinely full-screen 3D.** The current `battle.tsx` reserves a middle band for the 3D stage and uses the SVG backdrop behind it. Extend `BattleStage` across the full display, give it 3D terrain/props/sky/fog, and place the new HUD absolutely over it. Do not flatten the concept painting into a fake 3D background.
4. **Reframe rather than cover.** Update the battle camera rig to consider outer control regions, actor rosters and a hinge exclusion area. Keep projected head/feet labels and target areas in the same coordinate system as the full-screen canvas.
5. **Rebuild the game HUD primitives.** Use unframed resource marks, icon buttons, AP pips, a distinct Ready/timer control and compact anchored pickers. Remove the permanent actor-panel rectangles. Set actual button roles and effective target sizes.
6. **Preserve scene selection and improve interactions.** Keep the existing foe-selection state and projected scene hit areas consistent with camera framing. The dedicated target/crosshair control has been replaced by Auto. Reuse NPC/pack/panel actions for nearby world interactions. This changes input presentation, not the battle engine.
7. **Give utility screens the same restraint.** Inventory remains a clear equipment grid over a subdued world; class and quest information use an edge-attached overlay with readable text when needed. Avoid nesting each item or stat inside its own decorated card.
8. **Introduce asset and layout contracts.** Model bounds, scale, animations, selection anchors and material conventions should be explicit. Measure physical-device performance as the real assets replace primitives.

## First build target

One 3D hero, Sirko, one ordinary enemy, Likho, a small shrine/settlement kit, and the overlay battle planner. Verify portrait with one-finger interaction, short landscape with two thumb groups, and split/fold mode including its open action picker. Then carry the same icons, materials and reach rules into world interactions, inventory and creation.

The three-layout generated board is a visual proposal, not an implemented feature or a claim that foldable handling has been tested. The seven screen references are retained separately from the planned [post-MVP Salt Road chase](post-mvp/salt-road/README.md).

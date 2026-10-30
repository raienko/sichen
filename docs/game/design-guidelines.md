# Sichen: approved visual direction

30 October 2026. These guidelines consolidate the user's selected concepts. They guide future implementation; the illustrations are concept art and the game has not yet been rebuilt to match them. Explicit user decisions take precedence over incidental details in an image.

## Approved references

Keep seven canonical screen references in `redesign-concepts/`. The battle board and character/inventory illustration now use the wilderness reference's faceted low-poly style. Their approved HUD/composition rules are preserved. Town, merchant, active skills and passive-tree illustrations remain unchanged.

| Scene                 | Reference                                                                             | What it establishes                                                                     |
| --------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Battle                | [Portrait, landscape and foldable board](redesign-concepts/living-folk-world-arc.png) | Low-poly 3D encounter, five-action planner, curved Ready controls and outer-edge groups |
| Wilderness            | [Modular crawler](redesign-concepts/wilderness-crawler.png)                           | Low-poly terrain, elevated camera, readable clearings and thumb controls                |
| Merchant              | [Hordii's shop](redesign-concepts/merchant-shop.png)                                  | Counter-facing NPC, physical category displays and interaction contours                 |
| Town                  | [Kyiv exploration](redesign-concepts/exploration.png)                                 | Settlement composition, Ukrainian architecture/clothing and contextual HUD              |
| Passive tree          | [Shared three-arm graph](redesign-concepts/passive-tree.png)                          | Folk ritual surface, progression graph and reachable allocation details                 |
| Character / inventory | [Preview-overlay composition](redesign-concepts/character-inventory.png)              | Low-poly hero/items, ten worn positions, bag filters and detail overlay                 |
| Active skills         | [Library and horizontal loadout](redesign-concepts/active-skills.png)                 | Top information, scrollable library and six drag/tap assignment slots below             |

Battle, wilderness and character/inventory establish the current economical rendering target: broad faceted geometry, flat matte materials, muted moss/olive/slate colors, soft lighting and restrained ochre/torch accents. The more detailed town/shop/skills/tree paintings remain composition and atmosphere references; they do not require photoreal geometry or a separate rendering pipeline. Preserve their approved layouts when applying a coherent asset kit.

The separate [Salt Road chase quest and two illustrations](post-mvp/salt-road/README.md) are retained under [post-MVP features](post-mvp/README.md), outside these seven screen references and the current playable slice.

## World and art

Keep the current 3D engine, movement and tactical systems. The world fills the viewport behind the HUD. Characters, props, ground and camera remain real scene elements; a generated screen painting does not replace a navigable 3D scene.

Build the Ukrainian folk identity through embroidered linen, oxblood cloth, woven rushnyky, carved timber, sabres, regional architecture and recognizable character silhouettes. Put most ornament on clothing and world objects, with small motifs used sparingly in the interface. This remains a fantasy setting informed by historical references.

Use matte low-poly timber/stone, muted moss/olive/slate shadows, soft daylight and sparse ochre leaves or warm torch accents. Build major forms from simple geometry rather than detailed painted surface textures. Give mobs readable silhouettes against low-detail ground. Soften occluding foregrounds around the hero. Fire, fog and leaves must leave movement, target rings and status information clear.

An economical route combines free meshes, the existing procedural kit, generated portraits/textures and a few custom accessories. Candidate sources are the [Kenney Fantasy Town Kit](https://kenney.nl/assets/fantasy-town-kit), [Quaternius animated characters](https://quaternius.com/packs/ultimatedanimatedcharacter) and [Poly Haven materials](https://polyhaven.com/license); see the [asset plan](combined-design.md#free-and-generated-asset-route). Adapt stock silhouettes and materials to the setting. Generated raster images supply references, icons and textures; animated 3D geometry still needs modelling/rigging and device testing. This direction does not require paid assets.

## Overlay language

Use thin ivory/bronze circles, restrained amber focus, compact numerals and one coherent icon family. Keep the world visible between controls. A local shadow, gradient or vignette supplies contrast without permanent header/footer panels. Functional inventory cells are appropriate; avoid separate decorated cards for every item, stat and explanation.

Keep red HP, blue mana and ochre stamina consistent. Reuse each resource, equipment, skill and status glyph across screens. Distinguish selected, allocated, available and disabled through stroke, fill, shape and accessible state as well as color. Reserve strong glow for meaningful interactables or current focus; use separate small rarity marks.

Permanent text stays short: counts, levels, current values and necessary names. Deliberate details may show readable explanations, requirements and comparisons. Do not hide meaningful stats behind unexplained symbols. Provide accessible names, button roles, keyboard focus and selected/disabled state. Use fonts with Ukrainian glyph coverage; respect text scaling and reduced motion.

## Reach and responsive layout

Portrait supports sequential one-finger use. Keep frequent actions, Back, confirmation and menu controls near the lower outer reach area. Upper portraits, bars and maps are primarily informational. A high world object or equipment indicator needs an equivalent reachable selection method, such as a context action or lower picker.

Landscape supports two outer-edge thumb groups: movement/selection left and context/confirmation right. Anchor to safe areas and avoid a continuous toolbar across the scene.

On foldables, exclude the center hinge/fold band from **all fixed HUD hit rectangles**, including transparent padding, expanded pickers, close buttons and confirmations. The world, preview and pannable tree may occupy the middle. Provide edge controls to inspect/select anything otherwise requiring a central tap. Use hinge bounds where available and a selectable split layout as fallback. The concept board does not validate posture detection.

Use at least 44 logical points for effective targets with separation. For dense trees, zoom/recenter before selection rather than overlapping invisible targets. Support a mirrored hand preference. Check narrow portrait, short landscape, fold mode, text scaling and every expanded picker. Resolve collisions through spacing, utility arrangement and camera framing while preserving required slot counts and hinge clearance.

## Battle contract

The [battle specification](combined-design.md) provides full detail. Preserve these explicit decisions:

- Always show **exactly five action slots in one horizontal row**, including empty slots. Do not wrap, collapse or scroll them.
- Put the **AP counter and tactics above actions**. Keep presets 1–3, Save and Erase/Clear. Switching and saving stay available. Clearing the current plan must not silently erase a saved preset.
- Show **one Auto**, replacing the previous Target button. Its diameter matches an action slot and its bottom aligns with the action row. Remove the earlier utility-row Auto.
- Keep Ready at its anchor. Curve Auto and the three defence circles around it. Active defence uses amber selection without a dangling checkmark. Keep the large Ready confirmation check.
- Preserve scene-based foe selection, timer feedback, AP costs and status marks.

The game still has five shared AP, one AP per selected defence type and a 15-second round. Five queue positions do not grant five free attacks. The redesign does not alter combat resolution or saved tactics.

## Town exploration

Use Kyiv's landmarks, NPC silhouettes and readable paths for orientation. Keep a compact resource portrait upper left and minimap/objective information upper right. The hero stays visible in the lower/middle world.

Place the movement stick lower left and contextual interaction lower right. A nearby NPC's identity/action replaces a permanent text panel. Inventory/character, skills and journal open from a small reachable arc. World markers supplement the context control; no distant NPC tap is required. Keep expanded menus outside the fold band.

## Wilderness exploration

Use the approved high-camera modular clearing approach. Assemble authored paths and landmarks from reusable ground, rocks, trees, fences, stream crossings, gates and shrines. This fits the existing grid, collision and pack system and is the first implementation scope.

It may have roguelike atmosphere and encounter choices, but procedural runs, permadeath and new real-time combat are separate features. Preserve current movement and the transition into tactical encounters. Ground-tap movement currently slides against obstacles without route search; compose initial paths accordingly or add pathfinding explicitly.

Show pack levels, danger and selection rings. Voluntary inspection can expose a reachable Attack action. Aggressive packs still chase and start battle on contact; inspection is not a universal safety confirmation. Preserve Vovkulaka, Likho and existing quest landmarks. Fog-of-war is additional work if introduced. Decorative props do not imply harvesting, food, crafting or ground-loot systems. See [wilderness scope](wilderness-design.md).

## Merchant: the world is the category menu

Use Hordii's selected identity: dark beard, cloth cap, white embroidered shirt and brown vest. Default to a counter-facing camera without the player's full model. An optional close shoulder may add presence without covering stock.

The wall shield opens shields, weapon rack weapons, armour display armour, bottles potions and jewellery stand accessories. Group hit areas by meaningful category; most clutter remains decoration. A soft gold silhouette marks interactables, selected groups glow brighter, and Hordii has a separate talk prompt. Highlights work without hover.

Tap Hordii or use lower dialogue for conversation and quests he actually owns. Keep Back and bag/trade actions reachable. Category browsing and item comparison use a restrained overlay over the same shop. A lower category chooser provides one-finger and foldable access to high/central displays while preserving their visual navigation role.

Current merchant support is selling owned loot and buying HP/mana potions. Equipment purchases need stock data, prices, availability and transactions. The vendor currently returns before normal NPC dialogue, so combining trade and quests requires composing that interface. The reference establishes a desired experience; it does not mean those additions exist. See [merchant specification](merchant-design.md).

## Character, skills and passives

The management workspace uses three lower navigation symbols:

| Symbol    | Screen                | Existing system to retain                                                        |
| --------- | --------------------- | -------------------------------------------------------------------------------- |
| Bag/hero  | Character + inventory | 3D preview, ten worn positions, 40 bag slots, derived attributes and comparisons |
| Open book | Active skills         | Learned skills, exactly six availability/loadout slots and class-master training |
| Branch    | Passives              | One shared tree, three class starts, connected allocation and town respec        |

The **six active-skill loadout slots** are distinct from the **five battle action queue slots**. Attributes derive from class, level, equipment and passives; do not add manual attribute spending. Render the passive graph from `src/game/data/tree.ts`, not by tracing generated art.

The [management specification](other-scenes-design.md) records the retained passive-tree, character/inventory and active-skills directions. Character composition follows the supplied hero/equipment-over-bag reference, with a vertical category rail. Selected-item details fade over a locally dimmed/blurred character preview, freeing the lower area for the bag; Equip/Drop and dismissal stay at lower outer edges. The bag and equipment remain usable while details are shown. Active skills keep selected information at the top, a scrollable skill library in the middle, and six loadout slots in a horizontal row below it. Support drag-and-drop from the library into slots plus equivalent tap-to-select/tap-to-place. Keep confirmations and removal reachable at lower outer edges. Support gems, upgrade ranks, premium currencies and DPS from the references are not added mechanics. The passive-tree image remains unchanged.

## Implementation and validation

Preserve simulation, content and saves while changing assets, scene composition and HUD. Keep projected labels, target hit areas and camera framing in the same coordinate space. The art kit currently uses concrete component imports; model loading, animation clips, disposal and selection bounds still need integration.

Build shared overlay primitives, then one representative scene slice. Validate reach, contrast, accessible states, localization, native performance and fold layouts on devices. Generated numbers and control positions are illustrative rather than balancing data or measured responsive layouts.

See [approved file hashes](redesign-concepts/README.md) and the [implementation review](redesign-review.md).

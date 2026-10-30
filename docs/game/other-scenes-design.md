# Character, inventory and progression: current concepts

30 October 2026. The passive tree and latest character/inventory and active-skills illustrations are retained references, accepted for now and preserved unchanged. Their layouts incorporate the user-supplied references and subsequent overlay/slot revisions. Character/inventory now uses the wilderness-style low-poly hero, item icons and forest-edge courtyard; the skills and passive-tree illustrations are unchanged. See [design-guidelines.md](design-guidelines.md) for the full approved direction. The supplied screenshots guide composition only; their text and mechanics are not product requirements.

## Shared workspace

Use consistent lower navigation: bag/hero for character and inventory, book for active skills, branch for the passive tree. Keep Back reachable and separate from Equip, assignment and Allocate. The world stays visible behind the overlay, with restrained dimming for legibility.

The concepts use a modular forest-edge courtyard, training area and shrine scenery to communicate atmosphere. The revised skills view subdues scenery so the list and details dominate. Production can reuse the current hero preview and quieter environment props. Opening a menu does not teleport the hero; three bespoke animated backgrounds are not a requirement.

## Character and inventory together

[Open retained concept](redesign-concepts/character-inventory.png).

Follow the supplied character reference: compact identity and derived stats at the top, centered low-poly 3D hero with five worn positions down each side, then a filtered bag below. Keep the costume and equipment silhouette readable while leaving room to browse items. Rotation may supplement selection; precise dragging must not be the only way to inspect gear.

Show weapon, offhand, helm, chest, gloves, boots, belt, amulet and two rings. A reachable equipment chooser provides the same slot/category selection as the high silhouettes. A worn slot filters compatible bag items; selecting an item shows its actual compatible slot.

The bag retains 40 positions. A five-column, four-visible-row viewport is the revised portrait example, with scrolling, empty cells and an occupied/total count. Adapt column count to device width and font scale without changing capacity. Use plain grid lines and small rarity marks, with a stronger selected edge. Add a slim vertical icon rail to the left of the bag for All, weapons, shields/armour, jewellery and consumables. The rail filters existing inventory rather than adding item categories or merchant stock. Keep its controls reachable through scrolling or a lower category chooser. Do not copy the reference's gem currency, enhancement levels, combat-power score, capacity 80 or remote bulk selling.

On item selection, fade the name, illustration, actual effects, requirements, compatible slot and equipped comparison into the character preview between the worn-slot columns. Locally dim and blur the hero/world behind the information with feathered edges; keep the head, worn slots, bag and filters clear. Remove the dedicated detail strip below the bag. This reuses the preview area and leaves room for four bag rows rather than three, without changing capacity.

The overlay is read-only and does not block browsing. Selecting another item replaces its contents; a reachable lower hide-details control restores the unobscured hero without a required middle-screen tap. Details remain visible until changed or dismissed, with no reading timeout. As a proposed motion target, use a brief approximately 150–200 ms fade, or an immediate change with reduced motion. Keep text sharp and maintain readable contrast; dimming can supply the same layout when blur is unavailable.

Equip/Unequip and Drop stay in a compact lower-edge action dock, outside the hero overlay and hinge band. The detail text does not require a central touch. In landscape/fold layouts, place readable information within one safe display region rather than across a hinge; the read-only overlay can shift within the preview while its actions remain at the outer edge. Keep Equip reachable. A bag item can be equipped or dropped; worn equipment can be unequipped. The revised bag selection exposes Equip and Drop; a worn-item selection exposes Unequip instead. Keep these contextual actions accurately labelled. Dropping follows the existing rule/confirmation behavior; the concept does not introduce a new destruction shortcut. Do not offer remote Sell outside the merchant.

Show STR/DEX/INT compactly; they derive from class, level, gear and passives. Full derived stats, resistances, sets and affixes open deliberately from the stat glyph. Preserve potions, relic operations, stash access and loot-filter controls in their appropriate contexts. Do not introduce manual attribute allocation, food stacks, crafting materials or extra currencies through decorative art.

The illustrative level-8 Lytsar, Karabela, attributes, XP, rarity, bag contents and comparison are composition examples, not a validated save. Production reads real items, requirements and derived stats.

## Active skills

[Open retained concept](redesign-concepts/active-skills.png).

Keep selected-skill information at the top, directly below the compact identity/header. Fade the background behind that information for contrast; text and glyphs remain sharp. The information is read-only, so it does not create a required central touch target. Do not reserve another detail section below the library.

Use the middle area for a scrollable class-skill library, not numbered loadout rows. Each entry has a skill icon, short name, actual costs and a drag affordance when learned. Locked entries show requirements and cannot be assigned. Selecting a skill updates the top detail while leaving the library and lower slots available.

Put exactly **six active-skill loadout slots in a horizontal row below the library** in the portrait concept. Keep small indices 1–6 and empty plus placeholders. The six positions are availability slots, distinct from the battle's five queued actions. Keep a separate reachable Remove control outside the row so it does not resemble a seventh slot. Basic actions and potions remain separate.

Support dragging a learned skill from the list onto a loadout slot. Show a lifted icon and highlight valid destinations; releasing onto a valid slot commits using the existing assignment rules. Cancelling or dropping elsewhere leaves the loadout unchanged. The gesture does not consume/delete a library skill. Preserve existing duplicate/replacement semantics rather than inventing a new rule.

Also support tap skill, then tap destination slot, with the same result. This keeps assignment usable without a long drag and supports keyboard/assistive access. Selecting an occupied slot can expose its detail and reachable Remove action. Do not require dragging across a hinge. List scrolling and dragging need distinct gesture intent; a small grip can initiate the drag without making normal list scrolling unreliable.

The previous six-row loadout list and separate Library button are superseded: the library is now directly visible and loadout is a separate horizontal strip below it. Do not copy support gems, linked sockets, gem capacity, ranks, DPS or real-time attack speed from the composition reference.

The library preserves the eight current Lytsar entries: five potentially learned at level 8, Blessed blade gated at level 10, and two quest-hidden entries. Reflect the actual learned list and training/quest conditions; level alone does not grant a skill. Keep undiscovered names hidden. The existing panel is learned-only; locked-library presentation is a deliberate interface extension.

Selection reveals name, AP, mana/stamina costs, delivery/damage type and effects in the top information region. Descriptions remain available for targeting, duration and conditions. Show all actual costs, including Battle cry's five mana, with distinct resource glyphs.

Shield bash currently costs 2 AP and 8 stamina, and has a 35% chance to stun for one turn alongside physical melee damage. Show its actual damage calculation in details. Learning remains a class-master service; show requirements or a teacher shortcut rather than silently enabling remote training. Do not invent ranks, cooldowns or upgrade currencies.

The six loadout choices define combat availability; the battle planner retains its separate five queue positions and tactics. Ready, Auto and enemy portraits do not belong on this screen.

## Passive tree

[Open approved concept](redesign-concepts/passive-tree.png). The user approved this illustration; preserve it unchanged. The graph semantics below remain the implementation contract.

Use a large pannable graph over a subdued 3D stone/wood surface. Folk carving supplies atmosphere, without looking like more graph edges. Provide zoom, fit/recenter and a reachable nearby-node chooser. Small nodes must become large enough to select rather than gain overlapping invisible hit areas.

Preserve the actual graph: **43 nodes and 45 edges**, three class starts, three arms meeting at Heart of the Steppe, two notable branches per arm and cross-arm ring routes for hybrid builds. Render coordinates and edges from `src/game/data/tree.ts`. Class starts use larger rings, minor nodes circles and notables diamonds. Do not copy the painting's approximate topology or diamond-shaped starts.

| Arm                | Position    | Notables                    |
| ------------------ | ----------- | --------------------------- |
| STR / Lytsar       | Lower left  | Bulwark, Berserker          |
| DEX / Plastun      | Lower right | Sharpshooter, Ghost step    |
| INT / Kharakternyk | Top         | Fire-born, Kharakter's will |

Amber filled nodes and edges mark allocation. Reachable unallocated nodes have a clear outline; distant nodes stay quiet. Selection is a separate halo. Regional class colors must not make all colored nodes appear purchased. The generated draft's saturated arms and glowing hub are an art study; semantic states take precedence.

Tap selects/previews. A separate lower Allocate button spends one point only when real rules permit. The class start is free, with one point per level after level 1. New nodes must connect to allocated nodes. Show remaining points and exact effects before confirmation. Respec remains a town service, without a remote erase shortcut.

The illustrative selection is Bulwark (+30 maximum HP, +8 physical resistance). A valid level-8 example with two points left has six allocated nodes including the start: `str_0`, `str_1`, `str_2`, `str_3`, `str_b0_0`, `str_b0_1`. Bulwark is then reachable but unallocated. Use this real state in a prototype rather than treating the painting as a save.

## Reach, landscape and folds

In portrait, supply lower equipment selection, a scrollable skill library and nearby-tree selection so high positions are not the sole way to use the screen. Keep targets at least 44 logical points and adapt to font scaling.

Landscape can place preview/equipment toward one side and bag/library toward the other. Keep selected-skill information at the top and assignment slots below the library, with actions at outer lower edges. Split navigation across outer groups or open it from an edge chooser; no required tab belongs in the center hinge band.

The tree may pan behind a hinge while details, points, navigation and Allocate stay outside it. Recenter selected nodes into a safe visible region. No mandatory central tap, fixed button, transparent hit padding or picker close control belongs on the hinge.

These retained portrait compositions have not validated one-finger or foldable reach. In landscape, keep library selection and loadout assignment within outer reach regions. On foldables, place the complete loadout strip in a sufficiently wide safe pane; when that cannot fit full touch targets, use two short horizontal rows within the outer safe region, retaining all six positions and keeping them below the library. Tap assignment is available without dragging across the hinge. Test actual touch geometry and all expanded states during implementation.

## Work needed

Reuse the existing inventory/equip actions, hero preview, derived stats, skill/loadout actions and passive allocation rules. New work includes unified navigation, overlay primitives, selected-item comparison layout, top skill details, a scrollable skill library and horizontal six-slot drag/tap assignment, locked-library picker, tree pan/zoom, reachable selection alternatives and responsive/foldable layouts. No gameplay source has been changed for these concepts.

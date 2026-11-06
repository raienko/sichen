# UI component direction studies

The current direction began with the [interactive HTML illustration](minimal-kit.html). Its Components, Creation, and Inventory tabs use the current `GButton`, `Bar`, `ItemTile`, `Sheet`, and glyph vocabulary as the implementation baseline. The app now uses the same two button ornament presets through `src/game/ui/ornaments.tsx`: a small geometric stitch at the edge and a faint woven fill. Zakon Regular from the supplied font folder is used throughout the game for this interim pass. The HTML remains a direction study; the running app is the current implementation.

The boards below are earlier explorations.

The latest [Embroidered Thread variations](embroidered-variations.png) have an [editable vector source](embroidered-variations.svg). They hold the same layout and controls while increasing ornament density:

| Variation          | Ornament use                                                            | Rough effort for kit + one representative screen |
| ------------------ | ----------------------------------------------------------------------- | ------------------------------------------------ |
| A Quiet Stitch     | One stepped mark on selection; name and action stay open.               | About 1 working day.                             |
| B Woven Ribbon     | A narrow repeated diamond ribbon joins resources, actions, and choices. | About 1–2 working days.                          |
| C Ceremonial Weave | Fuller cloth inlays and carved end pieces on deliberate menu controls.  | About 2–3 working days.                          |

The more detailed C treatment is intended for paused creation and inventory screens. The exploration footer can retain the quieter approved glyphs. These are concept estimates, not a schedule for every game screen.

The earlier [four-option comparison](four-options.png) has an [editable vector source](four-options.svg). Each option uses existing UI primitives and changes the treatment of the same status, name, action, and choice controls.

| Option                | Treatment                                                              | Smallest implementation path                                                | Rough effort for kit + one representative screen |
| --------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| 01 Soot & Ivory       | Floating ivory strokes, thin resource lines, one amber selection mark. | Restyle `GButton`, `Bar`, and the current glyphs.                           | About 1 working day.                             |
| 02 Embroidered Thread | Narrow stitched band and stepped selection marks.                      | Add a small SVG motif strip and reuse the 01 styles and layout.             | About 1–2 working days.                          |
| 03 Oak Totem          | A single vertical carved rail plus tactile name and primary controls.  | Style `GButton` and `TextInput`; compose a rail from existing icon buttons. | About 2–3 working days.                          |
| 04 Cold Omen          | Near-black controls with pale blue focus glow for magical states.      | Palette and selected-state styling on the same components.                  | About 1–2 working days.                          |

These estimates cover a reusable component prototype and one screen, not a full game rollout. They assume the existing Expo/React Native dependencies and icon infrastructure. The amount of later screen-by-screen adoption depends on how many current panels receive the treatment.

The earlier [motif application sheet](motif-application.png) has an [editable vector source](motif-application.svg). It translates the supplied references into five original marks and shows them on a name field, action relic, status group, idol minimap, inventory layout, and narrow action rail. The geometric embroidery references inform selection and connection marks; the vertical strips inform the action rail; the inventory examples inform the central hero and surrounding equipment positions.

The current sparse study is [Woven Glyph / Carved Relic](refined-directions.png), with [editable vector source](refined-directions.svg). It removes the surrounding card frames and adds small Hutsul-inspired stepped diamonds and embroidery stitches at selection, connection, and touch points.

The earlier [three-direction comparison](direction-comparison.png) remains for reference, with [editable vector source](direction-comparison.svg).

These are approximate visual studies, not approved production assets or app changes. The current study shows the same status group, name input, primary action, class choices, and footer actions in two treatments: thread-like floating glyphs and small carved relics. The earlier comparison explored three surface treatments:

1. **Carved Oak:** warm wood, grain, and thin bronze edges. Closest to the selected character creation name field.
2. **Night Rune:** near-black or transparent surfaces, floating ivory linework, and a single amber selection mark. Closest to the selected exploration footer.
3. **Woven Ember:** dark cloth or soot wood with narrow red stitched accents and bone knots. Uses ornament only at edges.

The current `GButton`, `RoundButton`, `Bar`, `ItemTile`, `Sheet`, `Label`, `Row`, and `Glyph` in `src/game/ui/` can supply these controls. Most work is color, border, shape, and glyph styling; the name field can be a small composition of the existing `TextInput` and `GButton`. Keep each visual control's effective touch target at least 44 points and retain accessible names for icon-only actions. No new dependencies are required by any of the three directions.

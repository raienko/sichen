# Merchant: the shop is the interface

Current authority: [approved design guidelines](design-guidelines.md). This detailed specification supports the retained concepts.

30 October 2026. A continuation of the approved 3D folk-world direction, incorporating the user's merchant references. The supplied images guide composition, atmosphere and physical category selection; they are not instructions to add their species, spells or items to the game.

## Core interaction

The player faces **Merchant Hordii across his counter**. His room, stall or travelling display is the navigation:

- Tap Hordii to talk, hear his existing bark, choose trade, and see quest options when he actually has quests.
- Tap the hanging shield to browse shields.
- Tap the weapon rack to browse weapons.
- Tap the coat/boots display to browse armour.
- Tap the potion bottles to browse potions.
- Tap the jewellery stand to browse accessories.

These are selectable 3D objects with a shared category-selection behavior. Do not add a traditional category tab bar over the scene and merely decorate it with a shop picture. Every meaningful interactive group has a visible soft gold silhouette contour before tapping; the selected/focused category has a brighter amber contour. Most background clutter remains decoration and has no outline.

[Shop entry concept](redesign-concepts/merchant-shop.png)

## Camera and presence

Default to a conversation-height, counter-facing camera with no player model visible. Hordii's face, hands, merchandise and shop are the focus. Tilt slightly downward to make the near counter legible. This is a dedicated shop presentation of the existing NPC interaction, not the normal distant exploration camera.

An optional over-the-shoulder version may show a cropped, out-of-focus linen shoulder or sleeve at the extreme lower corner. It must not cover the merchant, stock or touch targets. Do not show the full hero in the middle or allocate half the screen to an equipment mannequin as in the general inventory concept.

Retain the existing 3D art language: timber/stone, warm lamps, restrained autumn light, woven red/linen cloth, a recognizably Ukrainian human trader, and modest carved details. The frog and dwarf references inform warmth and character, not a new NPC species requirement.

**Merchant identity:** use the dark-bearded man behind the upper-right stall in the user's supplied inventory reference: brown cloth cap, full dark beard/hair, embroidered white linen sleeves and shirt, and brown leather vest. The foreground Cossack in that reference is the player, not the merchant. Do not replace the merchant with the earlier grey-bearded, blue-coated illustration. The illustration may keep his relaxed crossed-arm stance or a natural counter-facing variation.

## Discoverability and highlight states

- Give the shield, weapon rack, armour display, potion pair and jewellery stand a consistent thin ivory-gold contour following their **actual 3D silhouettes**. Treat each display group as one meaningful category target, rather than outlining every scrap and bottle independently.
- Give Hordii a subtler rim plus the speech glyph to communicate dialogue. Keep this a character-interaction cue, not a combat target ring.
- The active category uses a stronger amber contour and slightly stronger stroke/glow. It must remain distinguishable from the other available targets. Selected item details and the selected physical stock object reinforce the state.
- Highlights are visible on touch devices without hover. Use a quiet stable glow; do not require continuous flickering, large pulsation or extra text labels to discover controls.
- Keep highlights distinct from rarity colors. Ordinary scenery, cloth decorations and noninteractive clutter receive no interaction border.
- Use object outlines, not rectangular cards or category-icon buttons floating over the scene. Preserve the physical-props-as-filter behavior.
- For implementation, start with a lightweight outline/selection proxy suited to the existing 3D renderer and profile its cost on native devices. This proposal does not assume a full-screen outline post-processing pipeline is already present.

## Prop-to-filter mapping

| Physical object             | Filter/result               | Data boundary                                                                     |
| --------------------------- | --------------------------- | --------------------------------------------------------------------------------- |
| Hanging round shield        | Shields                     | Match item base `kind === "shield"`, not every offhand item                       |
| Sabre/pike/bow rack         | Weapons                     | Equipment slot `weapon`; optional subcategories may follow the actual base kinds  |
| Coat, hat and boots display | Armour                      | Helmet, chest, gloves, boots and belt positions as appropriate                    |
| Red/blue potion bottles     | HP/mana potions             | Existing potion types, prices and caps                                            |
| Amulet/ring stand           | Accessories                 | Amulet and ring positions; other offhands need their own clearly defined grouping |
| Hordii himself              | Dialogue and services       | His bark, trade entry, and available assigned quests                              |
| Player bag/sell access      | The player's sale inventory | Existing owned-item selection and sale behavior                                   |

There is only one source of category state. A prop and any optional reach shortcut select the same typed filter. Do not let the displayed shield accidentally include powder flasks or bone talismans merely because those are also offhand items.

Decorative books, maps, jars or scraps do not automatically become buyable items or new categories. Use only content the game actually supports or that is explicitly added with the merchant-stock feature.

## Browsing and buying

1. The entry view presents Hordii and a few distinct category props, with a mostly clear counter.
2. Tapping the wall shield highlights it and selects the Shields category. The camera may make a small focus adjustment, keeping the same shop identity and merchant visible.
3. A few relevant shields appear on small physical stands on the near counter, or in a compact unframed stock row integrated with it. This is a filtered merchant assortment, not the player's 40-slot bag.
4. Tap one shield to select it. Show its name, price, requirements and a few icon-led stats near the counter edge. Additional details can expand without hiding the selected object.
5. Buy is an explicit lower-edge action. Selecting a prop or browsing stock does not purchase anything. Disable buying when funds, inventory capacity or item availability prevent it, with a concise reason.
6. Back closes selected-item details, then returns to the shop overview, then leaves the merchant. A reachable exit remains available without finding a tiny scene door or top-corner X.

The selected shield example uses the existing **Round shield** base: +6 physical resistance and +8 max HP, requiring level 1 and Strength 12. Any displayed merchant price and rolled stock variants in the concept are proposed display examples, not implemented balance or availability.

Keep the room visible. Avoid a full-screen shop grid or a stack of item cards over Hordii. A compact selected-item line and one clear Buy action are sufficient until more detail is requested. Gold is a small passive counter; health bars, minimap, battle actions, Ready and Auto do not belong in this shop view.

## Hordii and dialogue

Hordii is an NPC, not an unmoving backdrop behind a catalogue. Tapping him opens a small lower-edge dialogue choice area while his 3D face and posture remain visible. Dialogue can include a trade entry and his existing line, “Coin first, questions never.”

A quest option appears only when quest data actually names him as giver and eligibility allows it. Quest acceptance, turn-in and rewards reuse the current quest systems. Do not show a permanent exclamation mark or fabricate a merchant quest simply because the new presentation supports one.

The near-counter speech shortcut invokes the same dialogue as tapping him. This preserves reach on large phones and foldables while keeping direct NPC interaction natural.

## Mobile and foldable reach

- Stage the primary props at middle/lower heights where possible. Keep each category's actual hit region distinct and at least 44 logical points in effective size; many small items piled together are not independent category controls.
- For high shelves, allow the camera/scene to pan with one finger, or provide a small lower-counter physical token/representative prop that selects the same category. Do not require a precise tap on a tiny distant bottle. These remain physical shop objects, not an unrelated category-button bar.
- Keep dialogue, selected-item actions, personal bag/sell and Back near lower outer edges. Selection then purchase works with one finger; dragging merchandise into a bag is not required.
- On landscape, use the wider counter to separate category objects and the selected assortment. On foldables, put interactive categories, dialogue choices, Buy and Back outside the center exclusion region, including their full hit padding.
- A merchant may be visible near the center, but the reachable dialogue shortcut must remain at an outer edge. The central face is never the only way to enter dialogue across a physical hinge.
- Keep the optional foreground shoulder out of the reach regions. Reframe it or hide it when the device changes orientation or a hinge appears.

## Existing implementation versus new work

The current merchant is `Merchant Hordii`, with the role `merchant` and an existing bark. The current vendor panel lets the player **sell owned loot and buy HP/mana potions**. It does not yet contain a general equipment assortment or an equipment-purchase action. The new Shields category is therefore a feature addition, not merely an inventory reskin.

The item system can represent shields, weapons, armour, affixes and requirements. It supplies a useful basis for vendor stock. Implementation still needs a merchant assortment/price definition, stable item identities, filtered stock selection, availability/capacity checks and an equipment purchase action that consistently transfers gold and items. Browsing a category must not reroll stock or mutate inventory. Restocking/economy policy should be defined separately instead of implied by this artwork.

`NpcPanel` currently returns the vendor inventory immediately for merchant-role NPCs, before rendering dialogue and quest sections. Adding `quest` to a merchant's role list alone will not show those sections. Compose the merchant interaction so dialogue, quests and trade can coexist, reusing the existing quest actions and eligibility logic.

Build the shop's category props as 3D groups with typed interaction metadata. The existing scene selection/projection approach is a starting point; the dedicated camera, category hit areas and filtered countertop display still need implementation. The shop should remain functional through labelled accessible controls/shortcuts as well as visual prop taps.

The visual can be built from the same free modular environment assets and simple project-owned props proposed for the rest of the game. Generated cloth/material/icon details can supply identity. The concept PNGs are references, not a substitute for the 3D meshes, selection geometry and UI state.

No gameplay code, vendor stock, quests or asset downloads have been changed in this design pass.

[Other scene concepts](other-scenes-design.md)

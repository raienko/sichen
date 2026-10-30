# Low-poly style-transfer prompts

30 October 2026. Built-in image-generation tool, no CLI/API fallback.

The user-supplied wilderness screenshot, identical in style to the retained wilderness crawler, is the primary art-style reference. Existing approved battle and character/inventory images are edit targets supplying composition, content and UI constraints. Only style and a suitable simpler environment treatment change. The generated low-poly outputs were subsequently selected as the canonical battle and character/inventory illustrations. The older versions were replaced; the other approved screen references are unchanged.

## battle-low-poly

Reference order:

1. `/var/folders/gf/f6f0_bl13yxgw35hm44f5hh80000gn/T/codex-clipboard-debcd457-a492-4db1-b821-a6c28bb08ddb.png`
2. `/Users/src/Projects/sichen/docs/game/redesign-concepts/living-folk-world-arc.png`

Prompt (verbatim):

Use case: ui-mockup / style-transfer.
Image1 is the PRIMARY ART STYLE REFERENCE: a mobile 3D low-poly forest crawler. Image2 is the EDIT TARGET and exact BATTLE SCREEN COMPOSITION/CONTROL reference. Redraw image2 in image1's visual style, preserving all three responsive views on the board: tall Portrait left, Landscape upper right, Foldable lower right. Single board around1536x1024, quiet small view labels outside screens.
PRIMARY CHANGE IS ART STYLE, not layout or gameplay: every world object and actor becomes visibly faceted low-poly 3D with large simple polygons, flat matte material colors, soft ambient occlusion and diffuse lighting. Match image1's restrained moss/olive greens, slate/purple rocks, ochre leaf accents, warm torchlight and ivory thin HUD circles. Broad untextured/simple surfaces, readable low-detail terrain, modular trees/wood/stone. NOT photoreal, not detailed painted textures, not glossy realistic rendering, not pixel art, not outlines around polygons. Reduce saturated orange and ornate detail from image2.
Keep Cossack with same hair/moustache silhouette, white linen shirt, red trousers/sash, sabre, a real low-poly character visible in scene. Keep central large one-eyed folklore boss and two smaller enemies; build them from simple angular forms, no added wolves replacing the encounter. Keep elevated 3D battle camera and recognizable modest shrine/chapel, wood fence, cloth folk cues; simplify these into modular geometry. Preserve target rings and small HP bars.
PRESERVE HUD CONTRACT IN EACH OF THE THREE VIEWS:

- Upper left hero portrait and three thin red/blue/ochre bars; upper right selected one-eyed foe and HP. No minimap or joystick in battle.
- Lower left EXACTLY FIVE action circles in ONE HORIZONTAL ROW labelled1–5: sword, sword, stone, plus, plus. All five visible, no wrapping. Immediately ABOVE actions keep three tactics1/2/3 plus save-disk and erase, and AP1/5 above that. Never confuse tactics with action slots.
- Lower right LARGE READY circle at the same anchor with big white check and12s. Four smaller circles in a CURVED ARC around its upper/left side: Auto(A) at bottom-left end, melee(sword) above it, ranged(bow) farther upward, mental(eye) near top. Exactly ONE Auto. Auto matches action-circle size and bottom baseline. No separate target/crosshair, no tick underneath active defence.
- Thin ivory outlines and flat pictograms like image1; restrained amber active/Ready outline, not strong orange lens flare.
- In Foldable view keep left and right HUD groups outside the center hinge band; preserve world behind hinge. No center controls.
  Do not move HUD to separate cards or solid header/footer. All world scenes must unmistakably look like the same economical low-poly 3D game as image1, NOT the original high-detail amber paintings. Preserve actor identities and interface content.

## character-inventory-low-poly

Reference order:

1. `/var/folders/gf/f6f0_bl13yxgw35hm44f5hh80000gn/T/codex-clipboard-debcd457-a492-4db1-b821-a6c28bb08ddb.png`
2. `/Users/src/Projects/sichen/docs/game/redesign-concepts/character-inventory.png`

Prompt (verbatim):

Use case: ui-mockup / style-transfer.
Image1 is PRIMARY ART STYLE REFERENCE (low-poly 3D mobile forest crawler). Image2 is EDIT TARGET with exact character/inventory layout and content. Restyle the ENTIRE second image to match image1, one full-bleed portrait screen ~1024x1792, no bezel or marketing text.
Every 3D element must become visibly simple FACETED LOW-POLY, flat matte materials, broad clean surfaces, soft ambient occlusion, diffuse forest light, muted moss/olive/slate with modest ochre accents. No detailed painted textures, photoreal anatomy, reflective polished jewellery, glossy tiny bevels, intricate embroidery simulation, orange cinematic hyperdetail or flat 2D vector art. The result should look readily achievable with a small modular free/procedural 3D kit. Background can be a subdued low-poly timber/stone courtyard at a forest edge with a few modular trees and shrine/castle silhouettes; preserve folk presence with simple red geometric cloth marks.
KEEP THE SAME COMPOSITION:
Top compact Cossack portrait/name "Ostap · Lytsar · 8", XP245/400 and inline STR30 DEX17 INT6. Hero in upper half, centered between EXACTLY TEN equipment circles, FIVE EACH SIDE: left helm/chest/gloves/boots/belt; right amulet/ring/ring/shield/sabre. Hero same Cossack identity, black oseledets and moustache, white linen with a few simple red stitches, red trousers/sash, sabre and boots, but GEOMETRIC LOW-POLY BODY AND FACE. Even the portrait should share the stylized low-poly character design rather than a photographic face.
Retain SELECTED ITEM DETAILS as read-only overlay ON the hero's torso/knees with local soft dim/fade/blur and feathered edges, no framed rectangle. Hero head and side slots remain clear. Modest LOW-POLY sabre item illustration, "Karabela", "Saber · Lv6", sword8–14, crit+3%, DEX14, green4–8→8–14. Keep text crisp and readable through background simplification.
Lower half BAG: exact12/40 counter, slim left vertical category rail (all-grid/sword/shield/jewellery/potion), FIVE COLUMNS x FOUR ROWS of shared plain thin cells, slim scrollbar. EXACTLY twelve low-poly item icons in same order as image2: sabre, shield, helm, zhupan, gloves; boots, belt, amulet, red ring, blue ring; pike, oak staff then EIGHT empty cells. Total20 visible cells. Item illustrations should be small faceted game assets, not detailed realistic product paintings. Selected sabre amber thin edge. No extra foods, stacks or currencies.
Below bag keep small lower-left hide-details chevron and lower-right Equip/Drop circles. NO separate item-detail strip below bag. Bottom bag/hero selected, book, passive branching-tree, separate Back. All thin cream/ivory symbols and flat translucent circle fills like image1, restrained warm focus glow. Do not add cards, solid header/footer, Ready/Auto or more buttons. Preserve existing stat values, bag count, equipment and UI interactions; ONLY style and suitable low-detail backdrop change.

## Canonical outputs

[Battle board](living-folk-world-arc.png) · [Character/inventory](character-inventory.png). Promoted to the approved reference set on 30 October 2026. No gameplay implementation changes accompany the promotion.

[Game documentation](../../README.md) › [Post-MVP](../README.md) › Salt Road

# Salt Road: salt-cart chase quest

**Status: planned, post-MVP.** Added 30 October 2026. The illustrations establish the proposed experience; no quest, racing physics, networked pursuit or PvP entry flow has been implemented. This feature is outside the current playable slice and its delivery target.

## Quest premise and flow

Deliver bags of salt along a dangerous road in a horse-drawn wooden cart. Rival players pursue on riding horses. Reach the destination with cargo remaining by drifting around bends, avoiding obstacles and sacrificing salt bags to break pursuit.

1. Accept a salt delivery from a town quest giver and review the route, cargo and PvP participation rules. The NPC, unlock conditions and repeatability are still to be decided; this does not add a quest to Hordii or change the MVP quest chain.
2. Enter an authored chase route with a horse cart and a clear cargo count. Travel forward automatically, steer around obstacles and drift through corners.
3. Mounted rivals close the gap. A distance readout and crossed-swords progress ring warn when a pursuer is holding engagement range.
4. Throw a salt bag to slow or briefly obscure a pursuer, opening enough distance to interrupt their engagement hold. The bag is consumed from the delivery cargo.
5. Reach the delivery point, or transition into tactical PvP if a rival satisfies the distance/time condition and attacks. Delivery rewards, interruption outcomes, cart disablement, abandonment and resume rules must be settled before implementation.

Remaining salt is both the delivery objective and escape ammunition. The illustrations' `7/10` and `6/10` show one bag spent, not two currencies. Starting cargo and rewards are balancing decisions; illustration values are examples.

## Driving, drifting and obstacles

Use an elevated chase camera that keeps the horse, cart and upcoming road readable. The cart can slide through a bend with clear skid tracks and restrained dust. Horse steering, harness and cart movement must remain visually connected.

Start with a short authored route using reusable rocks, trees, fences, crates, fallen branches, clear passing gaps and a finish landmark. Collisions should provide readable feedback and affect the escape; exact slowdown, cart condition and cargo-loss rules remain to be tuned. Do not silently adopt the portrait's wheel bar or the landscape's hero bars as a finalized vehicle-resource model.

Throw targets an eligible pursuer or a rearward direction, with aiming/assist behavior to be prototyped. A visible sack arc and white salt puff show the effect. Throws consume one cargo bag only when accepted; zero cargo disables throwing. Effects, aim rules and duration are not established by the generated image.

## Pursuit and PvP entry

Track the engagement hold separately for each pursuer. A rider must stay within the configured distance continuously for a configured duration. Leaving range resets that rider's progress and readiness. Re-entering starts a new hold; progress is not shared between riders.

The drawings use **within 8 metres for 3 seconds** as an example only. The portrait shows `6 m · 2/3 s`; the escape image shows `10 m` and an out-of-range indicator. A lingering partial ring in the illustration is transition feedback, not retained attack eligibility.

Completing the hold makes an attack available while the rider remains eligible. An accepted attack starts a separate tactical PvP encounter; proximity alone is not an already-resolved hit. Both players need clear progress, readiness and transition feedback. Throwing or drifting breaks readiness by creating the required gap, rather than granting immunity.

Live play requires authoritative checks for position, elapsed hold, bag spending and attack eligibility, plus a single encounter transition that cannot start duplicate fights. How pursuit pauses, resolves or resumes around a tactical encounter is an open design decision. Disconnects, delivery completion racing with an attack and simultaneous pursuers must be handled before enabling multiplayer rewards.

## Presentation and controls

Match the low-poly [battle](../../redesign-concepts/living-folk-world-arc.png), [character/inventory](../../redesign-concepts/character-inventory.png) and [wilderness](../../redesign-concepts/wilderness-crawler.png) references: faceted matte geometry, muted woodland colors, soft lighting, folk cloth/costume details and thin ivory HUD symbols.

Show cargo, route direction and engagement danger using icons and short numerals. Keep Drift, Throw and rear view distinguishable from the tactical battle planner. Utility icons inherited by the landscape drawing are composition suggestions, not extra chase mechanics.

Portrait must support one-finger use: prototype automatic forward motion and steering that persists briefly while the finger taps Drift or Throw, with optional mirrored placement. Landscape uses two outer thumb groups. Keep all HUD hit areas outside a fold/hinge band, avoid compulsory simultaneous holds and validate the entire action flow on devices. Apply accessible names, minimum target sizes and reduced-motion behavior from the [shared guidelines](../../design-guidelines.md).

## Illustrations

| Illustration                                         | What it demonstrates                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| [Portrait chase](salt-cart-chase.png)                | Salt cargo, readable road obstacles, mounted rivals and distance/time warning |
| [Landscape drift escape](salt-cart-drift-escape.png) | Cart drift, thrown salt bag, spent cargo and a broken pursuit hold            |

Created with the built-in image-generation tool. Exact [generation prompts](prompts.md) are retained for the two images. These are raster references, not rigged horse/cart assets or validated physics.

## Proposed delivery stages

1. **Driving prototype:** one authored route, horse/cart handling, obstacles, drift and a finish condition.
2. **Escape prototype:** scripted riders, per-rider range/hold state, bag spending and slowdown/obscuration feedback. Validate that both steering skill and cargo sacrifice can create an escape.
3. **Multiplayer pursuit:** authoritative movement/hold checks, eligible attack and one tactical PvP handoff. Decide session, interruption and reconnect behavior.
4. **Quest integration:** choose giver/unlock/participation, settle reward and failure/resume rules, then add actual quest data and persistence with appropriate migrations.

No stage is marked complete by adding these documents. First validate that the loop is fun and readable before scheduling production networking or expanding route content.

## Acceptance targets for a future implementation

- The cart clears an authored route through steering, obstacle avoidance and controllable drifts.
- Each rival has independent, visible hold progress; breaking range resets eligibility, and locked-out riders cannot start PvP.
- An accepted throw spends exactly one bag and can create an escape opportunity; empty cargo cannot be thrown.
- An eligible attack starts one tactical encounter and preserves the agreed cargo/quest state through the transition.
- Delivery, interruption and failure use explicitly chosen outcomes and cannot award the same delivery twice.
- Portrait, landscape and foldable controls pass reach, accessibility and readability checks on representative devices.

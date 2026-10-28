[Docs](../index.md) › [Roadmap](../../Roadmap.md) › Plans

# UI, UX and developer tooling

> Tools the 2026-09-06 audit found missing, each with the defect or risk that justifies it and the step it lands in. Evidence figures are from that audit; the web-export and wasm figures have since changed (see ADR 0004).

Every gap below was reached by doing the work rather than by surveying the market: each row names the specific thing that went wrong, or would have.

## The case for tooling at all

Fifteen components shipped since the last audit. Four defects in the most recent ten were **invisible to 1,282 passing tests** and found only by a human opening a browser and looking:

| Defect                                                                                   | Why the tests could not see it                                                          |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| A neutral `Badge` and a `Skeleton` were the same colour as the surface behind them       | Both rendered correct, asserted values. Nothing compares a rendered pixel to a surface. |
| A `Chart` drew an empty plot (a React `View` inside a Skia canvas)                       | The canvas has no queryable elements at all; the mock renders fine.                     |
| A `Skeleton`'s highlight had a hard vertical edge (diagonal gradient in an upright rect) | Geometry is correct in every assertion; only the appearance is wrong.                   |
| `WebView` could `post` but never `receive` on the web                                    | Shim injected after the page's scripts. Both halves are individually correct.           |

That is the argument for the first table. The second and third follow from the same audit.

## UI — appearance and design

| Tool                                                                                                                 | Answers                                                       | Evidence it is needed here                                                                                                                                        | Add at  |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| **Visual regression on the existing Storybook** (Chromatic, Storybook test-runner + Playwright screenshots, or Loki) | "Does it still look right?"                                   | The highest-value missing tool by a distance. 63 stories already exist and nothing captures them; all four defects above are diffs a baseline catches.            | Step 03 |
| **A rendered light/dark × LTR/RTL × dynamic-type matrix**                                                            | "Does it look right in the other three?"                      | Step 13 asks for exactly this and there is no way to produce it. Every check so far has been manual, one scheme at a time.                                        | Step 13 |
| **Palette validation as a repo script and test**                                                                     | "Is this palette colour-blind safe against our own surfaces?" | The `chart1`–`chart6` palette was validated by an external script run by hand. Nothing re-runs it when `palette.json` changes.                                    | Step 10 |
| **Design-token pipeline** (Style Dictionary or Tokens Studio) — _only if design lives in Figma_                      | "Do the app's tokens match the design file's?"                | `palette.json` and the type scale are hand-authored. The `Skeleton` workflow already assumes Figma exports. Defer until there is a real design file to sync from. | Step 02 |

## UX — accessibility, interaction, and real devices

| Tool                                                               | Answers                                          | Evidence it is needed here                                                                                                                       | Add at  |
| ------------------------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| **`@storybook/addon-a11y` + `axe-core` in the story test-runner**  | "Does this component violate a known a11y rule?" | Accessibility is a stated definition-of-done gate enforced entirely by hand-written assertions and my own reading. Nothing catches a regression. | Step 03 |
| **Maestro flows** (Expo-recommended) on the dev client             | "Does the app still work on a real device?"      | Zero device coverage. Three native modules were added this session and none has run on a device.                                                 | Step 13 |
| **Real screen-reader passes** (VoiceOver/TalkBack), scheduled      | "Does it work for someone who cannot see it?"    | `Chart` and `Barcode` are opaque canvases whose entire accessible experience is a generated sentence nobody has heard aloud.                     | Step 13 |
| **Reduced-motion and large-dynamic-type sweeps in CI screenshots** | "Does it degrade, or break?"                     | Several components branch on Reduce Motion. Each branch is unit-tested and none has been looked at.                                              | Step 13 |

## Developer and delivery

| Tool                                                                    | Answers                                      | Evidence it is needed here                                                                                                                           | Add at   |
| ----------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **One `yarn check` script**                                             | "Is the tree green?"                         | Step 01, still open. Five commands run by hand every time; the odds of all five being run before a commit fall with each one added.                  | Step 01  |
| **GitHub Actions CI**                                                   | "Is it green on a machine that is not mine?" | Step 03, in place: the **Code quality** workflow (manual until its triggers are switched on) — see [Getting started › CI](../getting-started.md#ci). | Step 03  |
| **Environment contract in CI**                                          | "Will the build work on a clean runner?"     | `expo export` does not read `.env`; the web build fails on a clean checkout. Verified today, and currently nothing would catch it.                   | Step 03  |
| **Bundle budgets on the export** (Atlas is installed; nothing enforces) | "What did that component cost?"              | The export went 5.4 MB → 15 MB in two days, 8.1 MB of it one wasm file, and nobody noticed until this audit.                                         | Step 16  |
| **Coverage thresholds**                                                 | "Is coverage going the right way?"           | Functions coverage fell 70.4% → 68.5% while the codebase grew 50%. Measured, reported, unenforced.                                                   | Step 03  |
| **`eas.json` + a scripted dev-client build**                            | "How does anyone run the native app?"        | Three native modules added and no documented way to get them onto a device. Currently a verbal instruction in a chat log.                            | Step 15  |
| **Dependabot, dependency review, licence scan**                         | "What did we just pull in?"                  | Six dependencies added in two days, including an 8 MB wasm renderer. None reviewed by anything.                                                      | Step 05  |
| **`AGENTS.md` set and `docs/` with ADRs**                               | "Who decides, and what was already decided?" | Step 06, still open. Five components shipped outside the queue with no ADR recording why.                                                            | Step 06  |
| **Changesets or equivalent**                                            | "What version is this and what changed?"     | Only once step 02 chooses "reusable package". Not needed for an application.                                                                         | After 02 |

## Ordering

Two of these are worth doing before more components, because they change what every later component costs:

1. **CI (step 03) with `check` (step 01)** — everything else in this table plugs into it, and without it each gate is optional in practice.
2. **Visual regression on the existing stories** — the cheapest large win available, because the 63 stories are already written. It converts the class of defect that has actually been occurring from "someone noticed" into "the build failed".

Everything else follows the step numbering it is tagged with.

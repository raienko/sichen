[Docs](../index.md) › [Decisions](README.md)

# 0002. Deferred until evidence requires it

<sub>Status: **Accepted** · 2026-09-06</sub>

## Context

Several capabilities are plausible but unjustified today. Building them early costs maintenance and bundle size and pre-empts decisions that should follow real product needs.

## Decision

Each item below stays unbuilt until its trigger is met. Revisiting one means recording the evidence in a new ADR that supersedes the row.

| Deferred item                                                               | Trigger to reconsider                                                                            |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| New client/server state-management library                                  | Existing state boundaries fail a documented product requirement.                                 |
| Blanket `memo`, `useMemo`, or `useCallback`                                 | Profiler identifies a meaningful rerender bottleneck.                                            |
| FlashList or another list implementation                                    | Release-mode traces show current lists miss an agreed budget at real data scale.                 |
| Universal overlay/store manager                                             | Two or more existing APIs prove identical lifecycle and ownership through tests.                 |
| File splitting based only on line count                                     | A stable responsibility/import boundary emerges.                                                 |
| Replacing accessible app adapters with raw third-party controls             | Never; change the adapter or public contract instead.                                            |
| Full preference encryption, certificate pinning, root blocking, obfuscation | Classified risk and a tested operations/recovery plan justify it.                                |
| Every agent on every change or agent-controlled production                  | Never by default; route only required specialists and preserve human gates.                      |
| `@react-native-masked-view/masked-view` for `Skeleton`'s `children` case    | A real screen passes SVG components often enough that the bounding-box sweep is not good enough. |
| Per-person colour tints for `Avatar`                                        | A design decision plus contrast validation for each tint in both schemes.                        |

## Consequences

- A bundled `.ttf` for web chart labels was listed here until 2026-09-26, and is no longer needed: see [ADR 0004](0004-web-chart-renders-svg.md).
- File splitting by line count alone stays deferred. On 2026-09-26 the five largest files were split along real boundaries, not by size: accessibility props by what they describe (`props/structure`, `controls`, `field`, `feedback`); Skeleton's sweep into `shimmer.tsx` and its tones into `colors.ts`; Input's types by kind of value (`types/text`, `choice`, `value`); BaseInput's props into `types.ts` and its auto-height into `use-multiline-height.ts`; and the toast store's pure entry and expiry logic into `entry.ts`. Public imports didn't change.

[Docs](../index.md) › [Decisions](README.md)

# 0003. Component definition of done, manifest and import boundaries

<sub>Status: **Accepted** · 2026-09-26</sub>

## Context

The roadmap had a definition of done for public UI components that nothing checked. Components shipped without guides (14 of 52), without stories, or without tests. Nothing marked which components are the public kit and which are building blocks, and nothing stopped a screen from importing a file inside another module.

## Decision

1. **Manifest.** [`src/components/manifest.json`](../../src/components/manifest.json) lists every component folder as `public` (the UI kit) or `internal` (shared building blocks: `binary-control-row`, `expo-ui-host`).
2. **Checked definition of done.** [`src/components/manifest.test.ts`](../../src/components/manifest.test.ts) fails when a folder is missing from the manifest, or a component lacks an `index.md`, a test, or a row in the [components catalogue](../components/index.md). Public components also need a story.
3. **Import boundaries** (ESLint `no-restricted-imports`, tests exempt):
   - Components and features are imported only through their folder's entry point (`@/components/button`, never `@/components/button/palette`).
   - Internal components can't be imported from `src/app`, `features`, `root` or `screens`.
   - The one justified exception, `src/app/+native-intent.tsx` importing `@/features/deep-links/native-intent`, carries an inline disable with its reason.
4. **No barrel file.** There is no single `@/components` index. Metro doesn't tree-shake reliably, so importing through one would pull every component into every screen. The folder entry point is the public surface.

## The gates

The file-level gates above are enforced mechanically. The rest remain review criteria:

| Gate                 | Required evidence                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| API                  | Controlled value/events where applicable; impossible prop combinations encoded in types; platform limitations are explicit or cause a tested fallback.                               |
| Theme                | No hard-coded UI colors; all states use semantic tokens; light/dark and elevated-surface contrast are reviewed.                                                                      |
| Typography           | Visible text renders through the app text/type-scale contract; third-party controls receive supported font/text styles or use the custom fallback when exact typography is required. |
| Layout               | Phone/tablet/web, safe areas, LTR/RTL, long text, and min/max dynamic type are covered; no fixed size clips essential content.                                                       |
| Interaction          | Default, pressed, focused, selected, disabled, loading, error, and reduced-motion behavior is defined where relevant.                                                                |
| Accessibility        | Role, name, value/state, actions, focus order, target size, keyboard behavior, VoiceOver/TalkBack, and web semantics are tested.                                                     |
| Localization         | Component-owned copy uses translation keys with caller overrides where product wording varies; formatting uses locale-aware helpers.                                                 |
| Third-party boundary | Third-party UI is private behind an app adapter, receives semantic colors/type/direction, and has a capability matrix plus fallback.                                                 |
| Verification         | Focused unit/interaction tests, one story per stable public state, visual regression for stable layouts, and real-device coverage for native-only behavior.                          |
| Documentation        | Public export, concise examples, limits, ownership, and migration notes are current; internal primitives are not accidentally exported.                                              |

## Consequences

- Adding a component means adding a manifest entry, and the test says so.
- Visual, device and screen-reader gates are still manual until roadmap steps 03 and 13 add visual regression and device runs.

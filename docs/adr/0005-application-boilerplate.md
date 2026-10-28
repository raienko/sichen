[Docs](../index.md) › [Decisions](README.md)

# 0005. This repository is an application boilerplate

<sub>Status: **Accepted** · 2026-10-20</sub>

## Context

The repository contains an Expo Router entry point, native app configuration, a showcase screen, app providers, shared UI components, and app services. Its role was previously undecided: an application starter and a separately versioned design-system package have different boundaries and release needs.

## Decision

This repository is an **application boilerplate**. A team copies or forks it to build one iOS, Android, and web application. The components and features are app-owned source code, not an independently published library.

- **Entry points and exports:** `package.json` stays private, with `expo-router/entry` as its main entry. There is no npm package export map or all-components barrel. A module's `index` file is its import surface _inside this application_. The `public` entries in `src/components/manifest.json` mean available to this app's screens and other components; they do not promise a stable API to external consumers.
- **Ownership:** `src/app` owns route registration and platform route files; `src/root` owns app-wide providers and lifecycle; `src/screens` owns screen composition and product flows; `src/features` owns shared behavior, data and platform adapters; `src/components` owns reusable app UI. A product-specific component stays with its screen or feature until a second use or a clear shared contract warrants moving it.
- **Dependency direction:** route code composes the root and screens; the root composes app-wide providers and services. Screens consume features and components. Shared modules may depend on other shared modules but may not import `src/app`, `src/screens` or `src/root`. Screens may not import route files or root internals; the root may not import routes or screens. Component-to-component imports use the public folder entry point and the existing manifest boundary. ESLint (`import/no-restricted-paths`) checks every import against these rules by the file it resolves to, alias or relative; tests may reach internals to verify them.
- **Routes:** Expo Router route files stay in `src/app`. Ordinary UI routes delegate rendering to `src/screens`; layouts and special files keep only framework integration and composition. Route-local server handlers live in `src/app/api` and may call shared features. The showcase is an example screen and will leave production startup when a product route exists (roadmap step 14).
- **Versioning:** `package.json` and `app.config.ts` carry the application version used for builds and releases. Components change with the app and do not get separate semantic versions, changelogs or package publishing. A product can choose its release and EAS build-number policy during delivery setup.

## Consequences

- New shared UI work follows [ADR 0001](0001-reuse-before-new-components.md) and the component contract in [ADR 0003](0003-component-contract-and-manifest.md); there is no package compatibility promise beyond this app.
- Product routes, backend, authentication and deployment configuration belong to each application made from this boilerplate. The starter supplies boundaries and examples, not a default product or account system.
- Extracting a reusable package later would require a new decision, a package build/export surface, dependency separation, consumer tests and an independent release policy.

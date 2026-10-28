[← Project README](../README.md)

# Documentation

> The guides that span more than one folder, and the catalogues that lead into the rest. Anything about a single component, feature or screen lives in that folder as `index.md`, next to its code.

## Guides

| Guide                                         | What you'll find                                                                                                                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**Getting started**](getting-started.md)     | Install, `.env` setup, running on web / iOS / Android, every script, Storybook and git hooks                                                                                                                                    |
| [**Product guide**](product-guide.md)         | From this boilerplate to a shipped product: decisions, accounts, hardware, credentials, and the steps to the App Store, Google Play and the web                                                                                 |
| [**App builds**](development-builds.md)       | EAS environments, pulling them into `.env.local`, and the App build workflow that builds and submits                                                                                                                            |
| [**Store credentials**](store-credentials.md) | Where to get each store credential, step by step: App Store Connect API key, certificates and profiles, keystore, Play service account, first uploads                                                                           |
| [**Architecture**](architecture.md)           | Repository layout, the one-folder-per-unit rule, custom vs `@expo/ui` implementations, and where documentation lives                                                                                                            |
| [**Decisions**](adr/README.md)                | Architecture decision records: application boilerplate role, component reuse and contracts, deferred work, and the web chart renderer                                                                                           |
| [**Plans**](plans)                            | Reference plans behind the roadmap: [CI and EAS](plans/ci-and-eas.md), [agents](plans/agents.md), [tooling](plans/tooling.md), [references](plans/references.md)                                                                |
| [**Security**](security)                      | [Security plan](security/plan.md), [data inventory](security/data-inventory.md), [threat model](security/threat-model.md), [severity policy and exceptions](security/exceptions.md); reporting in [SECURITY.md](../SECURITY.md) |

## Catalogues

| Catalogue                             | What it covers                                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| [**Features**](features/index.md)     | The foundations every screen uses — theme, responsive, localization, accessibility — and app services such as storage and deep links |
| [**Components**](components/index.md) | Every component by category, with a one-line summary and a link to its guide                                                         |

## Also in the code

| Guide                                                    | What it covers                                                                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [**Root & Providers**](../src/root/index.md)             | The provider tree around every screen, shared with tests and Storybook                                              |
| [**API routes**](../src/app/api/index.md)                | Server endpoints in `src/app/api` (`GET /api/health`), and what server output means for the web build               |
| [**Native builds**](../scripts/native/README.md)         | Build profiles, native fingerprint, binary cache and JS repacking — `yarn e2e:*` and any workflow that needs an app |
| [**The showcase app**](../src/screens/showcase/index.md) | What each section of the running app demonstrates                                                                   |
| [**Utilities**](../src/utils/index.md)                   | `isWeb`/`isIOS`/`isAndroid`, `isE2E`, `seconds(17)`/`days(30)` time spans, `wait`, common hooks, `easeOutClamped`   |

## Conventions

- Paths are relative to the repository root (`src/components/button`); imports use the `@/` alias (`@/components/button`).
- Every folder guide opens with a breadcrumb back to its catalogue.
- "Verified live" notes record behaviour checked in the running app, not just in tests.
- Open work lives in the [Roadmap](../Roadmap.md); decisions live in [adr/](adr/README.md).

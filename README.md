# app

An application boilerplate for **iOS, Android and the web**, built on Expo, with its own design system, accessibility and localization in place from the first screen. Fork it for one product; its components are app-owned source code rather than a separately published package.

![Expo SDK 57](https://img.shields.io/badge/Expo_SDK-57-000020?logo=expo&logoColor=white)
![React Native 0.86](https://img.shields.io/badge/React_Native-0.86-61DAFB?logo=react&logoColor=black)
![React 19.2](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)
![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Storybook 10](https://img.shields.io/badge/Storybook-10-FF4785?logo=storybook&logoColor=white)

## Highlights

|                           |                                                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Design system**         | 50+ components on the Graphite kit: semantic light/dark palette, one table of corner radii, hairlines instead of cards |
| **Every screen size**     | Breakpoints for phone, foldable, tablet and desktop; sizes scale with the device and with the OS text size             |
| **Accessible by default** | Contrast-tested palette, 44pt targets, screen-reader semantics and reduced motion built into each component            |
| **10 languages**          | Translations, RTL layout and locale-aware numbers                                                                      |
| **See it running**        | The app itself is a showcase of every component, and each has a Storybook story (on device and on the web)             |
| **Guarded**               | ESLint, strict TypeScript, Jest, Prettier and secret scanning, run by git hooks                                        |

## Quick start

```bash
yarn install
cp .env.example .env
yarn web          # or: yarn ios · yarn android
```

`yarn ios` / `yarn android` build a real development client, which native modules such as MMKV need. See [Getting started](docs/getting-started.md) for the environment variables, platform caveats and every script. Turning it into your own product — accounts, signing, stores — is in the [Product guide](docs/product-guide.md).

## Everyday commands

| Command                                      | What it does                      |
| -------------------------------------------- | --------------------------------- |
| `yarn web` · `yarn ios` · `yarn android`     | Run the app                       |
| `yarn storybook:web`                         | Web Storybook at `localhost:6006` |
| `yarn storybook:native`                      | On-device Storybook               |
| `yarn lint` · `yarn typecheck` · `yarn test` | The checks the pre-push hook runs |
| `yarn format`                                | Prettier over the whole project   |

## Project layout

```text
src/
  app/          Routes (Expo Router), each a thin re-export of a screen
  screens/      One folder per screen — today, the showcase
  components/   One folder per component: code, index.md guide, story, tests
  features/     App-wide systems: theme, responsive, localization, accessibility, storage, deep links…
  root/         Root and Providers, which wrap every screen
  constants/    Validated environment variables
docs/           Cross-cutting guides and the catalogues
assets/         Brand assets (read at build time) and images (bundled)
```

## Documentation

|                                                |                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**Getting started**](docs/getting-started.md) | Setup, running, scripts, Storybook, git hooks                                                                                                                                                                                                                                                                                                |
| [**Architecture**](docs/architecture.md)       | How the code is organised, and where each kind of documentation lives                                                                                                                                                                                                                                                                        |
| [**Features**](docs/features/index.md)         | [Theme](src/features/theme/index.md) · [Responsive](src/features/responsive/index.md) · [Localization](src/features/localization/index.md) · [Accessibility](src/features/accessibility/index.md) · [Storage](src/features/storage/index.md) · [Deep links](src/features/deep-links/index.md) · [Event bus](src/features/event-bus/index.md) |
| [**Components**](docs/components/index.md)     | The catalogue, with a guide next to each component                                                                                                                                                                                                                                                                                           |
| [**Showcase**](src/screens/showcase/index.md)  | What each section of the running app demonstrates                                                                                                                                                                                                                                                                                            |
| [**Roadmap**](Roadmap.md)                      | Open steps by priority, and the component backlog                                                                                                                                                                                                                                                                                            |
| [**Decisions**](docs/adr/README.md)            | Architecture decision records: what was decided, and why                                                                                                                                                                                                                                                                                     |

Every other guide is an `index.md` in the folder it documents — [all docs](docs/index.md).

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [react-native-mmkv](https://github.com/mrousavy/react-native-mmkv)
- [Storybook for React Native](https://github.com/storybookjs/react-native)

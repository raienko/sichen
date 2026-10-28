[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Media & rich content

# Map

> A map with a few places on it, in the app's own theme — MapLibre on iOS, Android and the web.

<sub>`src/components/map` · [Stories](index.stories.tsx) · Tests: [`index.test.tsx`](index.test.tsx), [`view.test.ts`](view.test.ts)</sub>

```tsx
import Map, { type MapMarker } from "@/components/map";
import { useUserLocation } from "@/features/maps";

const location = useUserLocation();
const [selected, setSelected] = useState<string>();

<Map
  label="Stores near you"
  markers={stores}
  userLocation={location.coordinate}
  selectedId={selected}
  onSelectMarker={setSelected}
/>;
```

- **Two engines, one map.** `index.tsx` draws with `@maplibre/maplibre-react-native` on iOS and Android; `index.web.tsx` with `maplibre-gl` in the browser, imported lazily so its ~800 KB only downloads when a map is on screen. Both read the same generated style, use the same pins and callout, and resolve the camera through the same pure `view.ts`. Since `maplibre-gl` 6 its worker is a separate file that maplibre looks for beside its own module, which neither a Metro bundle nor Vite's dependency bundle keeps. So `yarn install` copies it into `public/` (`scripts/map-worker.mjs`, gitignored) and the map calls `setWorkerUrl` on it: the app's base path under Metro (`EXPO_BASE_URL`), and beside the story pages in the web Storybook, which serves `public/` as its static files.
- **It looks like the app.** The style is generated from the theme by `mapStyle` in [`@/features/maps`](../../features/maps/index.md) — land is the page background, water the `selected` tint, roads the `divider`/`border` hairlines — so it follows light and dark and stays quiet under the markers. Labels use the app's language, falling back to English, then the local name.
- **Markers are app components.** Square `primary` pins edged in the background colour; the selected one grows and gets an `accent` ring separated from it by a band of background — the band is what keeps it distinct in the light scheme, where `accent` and `primary` are the same colour (Graphite's selection rule, not an inverted fill). The user's position is the one round shape, by map convention. Pins are real buttons with the place's name, the only parts of a map a screen reader can reach; the map itself is a named group.
- **Selecting shows a card** over the bottom of the map with the title, subtitle and **Directions**, which hands off to the platform's own map app via `openDirections` — Apple Maps on iOS, the user's choice through a `geo:` intent on Android, Google Maps on the web. There is no in-app navigation.
- **The camera fits what's on it.** Without `center`, it frames every marker and the user's position (a single point is centred at street level instead of fitted), and moves again when those change. With `center`, it goes there at `zoom` (default 14).
- **The card never hides a place.** It reports its measured height, and while a place is selected the camera adds that to its bottom padding and re-fits, so every marker stays above the card.
- **Pressing the map itself** clears the selection (`onSelectMarker(undefined)`).
- **Tiles** come from OpenFreeMap — free, no key — unless `maps.tilesUrl` / `maps.glyphsUrl` in `assets/brand/brand.json` point at another OpenMapTiles-schema provider. Attribution stays on, as OpenStreetMap's licence requires.
- **Native needs a dev-client rebuild** — MapLibre is a native module with an Expo config plugin (registered in `app.config.ts`), so it doesn't run in Expo Go.
- **Offline** isn't wired yet. MapLibre's `OfflineManager` can download a region later without changing this component's API.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)

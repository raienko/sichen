[Docs](../../../docs/index.md) › [Features](../../../docs/features/index.md) › App services

# Maps

> The map style, tile configuration, the user's location and the hand-off to the platform's map app — everything behind the `Map` component.

<sub>`src/features/maps` · Tests: [`style.test.ts`](style.test.ts), [`directions.test.ts`](directions.test.ts), [`use-user-location.test.ts`](use-user-location.test.ts)</sub>

```ts
import {
  mapStyle,
  mapTiles,
  openDirections,
  useUserLocation,
} from "@/features/maps";

const location = useUserLocation(); // { status, coordinate? }
await openDirections(place.coordinate, place.title);
```

- **`mapStyle(colors, tiles, language)`** builds a MapLibre style from the theme's tokens rather than downloading one, so the map is Graphite in both schemes and identical on native and the web. It is written against the OpenMapTiles schema, so a different provider is a brand configuration change, not a style rewrite. Labels ask for one font, `Noto Sans Regular`, which every OpenMapTiles-compatible provider serves.
- **`mapTiles`** is the tile source and label fonts: OpenFreeMap by default (free, no account or key), or `maps.tilesUrl` and `maps.glyphsUrl` in `assets/brand/brand.json`. Both must be `https://`, and the glyphs URL must contain `{fontstack}` and `{range}` — checked by `@/constants/brand`. Native maps and the web security policy read the same brand settings. Provider URLs are public app assets; use only public provider keys with the provider's supported restrictions. See the brand guide for an example.
- **`useUserLocation({ request })`** is the user's position once, for "near me" — not a live track. It asks for foreground permission through `permissions.location` only when it hasn't been answered, shows a recent last-known position at once, then a fresh fix at `Balanced` accuracy (~100 m). It never throws: `"locating"`, `"ready"` (with `coordinate`), `"denied"`, or `"unavailable"`; a failed refresh keeps a good last-known position.
- **`openDirections(coordinate, label?)`** opens the platform's map app with directions: Apple Maps' universal link on iOS, a `geo:` intent on Android (so the user's chosen app opens), Google Maps' public directions URL on the web. `directionsUrl` is the pure, tested half. A failure is logged, never thrown.
- **Coordinates** are `{ latitude, longitude }` everywhere in the app's API. MapLibre wants `[longitude, latitude]`; `toLngLat` is the one place that converts, so a swapped pair can't creep in elsewhere.

---

[All features](../../../docs/features/index.md) · [Docs index](../../../docs/index.md)

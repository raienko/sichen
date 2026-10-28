[Docs](../../../docs/index.md) › [Features](../../../docs/features/index.md) › App services

# Network

> Online/offline and connection type, live; keeps TanStack Query's online state in sync.

<sub>`src/features/network` · Tests: [`index.test.ts`](index.test.ts)</sub>

```tsx
import {
  getNetworkStatus,
  onNetworkChange,
  useIsOnline,
  useNetworkStatus,
} from "@/features/network";

const isOnline = useIsOnline(); // re-renders on change
const { type, isInternetReachable } = useNetworkStatus();

const status = await getNetworkStatus(); // once, outside React
const stop = onNetworkChange(({ isOnline }) => isOnline && flushQueue());
```

Built on `expo-network`, with its state normalised into one shape:

| Field                 | Means                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `isOnline`            | **The one to branch on.** Connected, and nothing says the internet is unreachable.       |
| `isConnected`         | A network is up. Not proof the internet answers (a captive Wi-Fi portal is "connected"). |
| `isInternetReachable` | Whether the internet answered, where the platform can tell; `undefined` until known.     |
| `type`                | `WIFI`, `CELLULAR`, `ETHERNET`, `NONE`, … (`NetworkStateType`)                           |

- **Unknown counts as online.** The state arrives a moment after launch; an "offline" banner flashing in that moment is worse than a request that fails the normal way and goes through the API's error handling.
- **TanStack Query follows it.** `src/features/api/query-client.ts` feeds `onNetworkChange` into Query's `onlineManager`, so queries pause while offline and refetch on reconnect. Query's own listener only knows the browser's events, so on a phone it would otherwise always think it's online.
- **Platforms.** On iOS, `isInternetReachable` is always the same as `isConnected`. On Android it means the network was validated. On web, `type` is `UNKNOWN` whenever connected, because browsers don't expose the connection type.

---

[All features](../../../docs/features/index.md) · [Docs index](../../../docs/index.md)

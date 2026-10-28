[Docs](../../../docs/index.md) › [Features](../../../docs/features/index.md) › App services

# Device

> What the app and the device it runs on are: for request headers, logs and bug reports.

<sub>`src/features/device` · Tests: [`index.test.ts`](index.test.ts)</sub>

```ts
import {
  device,
  deviceHeaders,
  installId,
  timezone,
  userAgent,
} from "@/features/device";

device.appVersion; // "1.4.0"
device.buildNumber; // "42"
device.osName; // "iOS"
device.model; // "iPhone16,1"
userAgent(); // "app/1.4.0 (42; iOS 18.2; iPhone16,1)"
```

- **Read once at launch** from `expo-application` and `expo-device`. Anything a platform can't report (the web has no build number or model) is `"unknown"` rather than `null`, so it can go straight into a header.
- **`installId()`** is a random id made on first launch and kept in a `LocalValue` until the app is removed. The platforms' own ids differ in meaning and timing, and don't exist on the web, so this is the one id that behaves the same everywhere. It identifies an install, not a person.
- **`timezone()`** is read each time it's asked, because travelling changes it while the app runs.
- **Every API request carries it.** `@/features/api` adds `deviceHeaders()` per request: `X-App-Version`, `X-App-Build`, `X-Platform`, `X-Device-Model`, `X-OS-Version`, `X-Timezone`, `X-Install-Id`, and a `User-Agent` built from the brand's slug. Not on the web, where browsers forbid scripts from setting `User-Agent`.

---

[All features](../../../docs/features/index.md) · [Docs index](../../../docs/index.md)

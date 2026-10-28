[Docs](../../../docs/index.md) › [Features](../../../docs/features/index.md) › App services

# Format

> One place for how dates, times, numbers, money, sizes and durations are shown, in the active language.

<sub>`src/features/format` · Tests: [`index.test.ts`](index.test.ts)</sub>

```tsx
import { useFormat, toIsoDate } from "@/features/format";

const format = useFormat();
format.date(order.createdAt); // "16 Oct 2026"
format.time(order.createdAt); // "14:30" or "2:30 PM", per locale
format.dateTime(order.createdAt, { timeZone: "utc" });
format.relative(message.sentAt); // "5 minutes ago"
format.currency(total, "EUR"); // "€1,234.50"
format.percent(0.42); // "42%"
format.compact(1250); // "1.3K"
format.fileSize(file.size); // "1.2 MB"
format.duration(track.length); // "4:09"
format.initials(user.name); // "AL"

api.post("/bookings", { day: toIsoDate(day) }); // "2026-10-16"
```

- **`useFormat()`** binds every formatter to the active locale, so text follows a language switch. Outside React, the same functions take the locale explicitly: `formatDate(value, locale, options)`.
- **Dates take a `Date`, epoch milliseconds or an ISO string.** Anything that isn't a moment formats as `""` rather than "Invalid Date".
- **Which clock:** `timeZone` is `"local"` (the default, the device's zone), `"utc"`, or any IANA zone (`"Europe/Kyiv"`). `style` is `short` / `medium` (default) / `long` / `full`.
- **12- or 24-hour time comes from the locale**, never hard-coded.
- **For APIs:** `toIsoDate()` gives a calendar day in the device's own timezone (`2026-10-16`, for a birthday or a booking); `toIsoDateTime()` gives an exact moment, always UTC.
- **`Intl` formatters are cached** per locale and options; constructing them is the expensive part. A locale or zone the engine doesn't know falls back to a plain rendering instead of throwing. `formatRelative` falls back to the date on an engine without `Intl.RelativeTimeFormat`, rather than to English.
- **File sizes** use powers of 1024, the way file managers show them.

---

[All features](../../../docs/features/index.md) · [Docs index](../../../docs/index.md)

[Docs](../../../docs/index.md) › [Components](../../../docs/components/index.md) › Media & rich content

# MediaPlayer

> Video or audio with app-owned controls.

<sub>`src/components/media-player` · [Stories](index.stories.tsx) · Tests: [`index.test.tsx`](index.test.tsx), [`time.test.ts`](time.test.ts)</sub>

```tsx
import MediaPlayer from "@/components/media-player";

<MediaPlayer type="video" source={url} label="Trip video" />
<MediaPlayer type="audio" source={url} label="Episode 12" loop />
<MediaPlayer type="video" source={url} label="Trailer" nativeControls />
```

One player for both kinds of media: `type="video"` renders a picture with the controls beneath it, `type="audio"` is the controls alone. Built on `expo-video` and `expo-audio`.

- **Two implementations, one transport.** The packages share no API — `expo-audio` hands back a reactive status object while `expo-video` reports through events, and a video has a view to mount where audio has nothing to show. Both are reduced to one `MediaTransport` (`playing`, `currentTime`, `duration`, `muted`, and four methods) and rendered by one `MediaControls`, so the play button, scrubber, clock and mute toggle can't drift apart between them — the same reason `Checkbox` and `Switch` share `BinaryControlRow`.
- **The scrubber is the app's own `Slider`**, so it arrives `adjustable` and keyboard-operable rather than being a bare track only a pointer can move. It announces the clock — "1:23 of 4:56" — instead of a raw second count, which is what a listener actually wants read back. That needed a new `hideLabel` on `Slider`: a slider has no text of its own for a screen reader to derive a name from, but the media bar already says what it is between a play button and a clock, so the name is kept and the visible text dropped.
- **The scrubber stays disabled until there's a duration.** A player reports `0` until it has read the media's length, and scrubbing a zero-length track divides by nothing. Verified in the browser: disabled with `aria-valuetext="0:00 of 0:00"` while loading, enabling itself to "0:00 of 0:05" the moment the source resolved.
- **`label` is required and not shown** — it names the whole player, which otherwise announces as a group of unlabelled buttons with no indication what they control. It goes on a plain labelled group, not an `accessible` one, which would swallow the buttons into a single announcement.
- **`nativeControls`** hands the picture to the platform's own video controls. Video only — there is no audio-only control surface to defer to. Off by default so a video and an audio player look and announce the same.
- **Mutating the player is the API.** Both packages expose mutable native objects (`player.loop = true`, `player.currentTime = 5`), which React Compiler's immutability rule can't tell apart from mutating a hook's return value by mistake — so the rule is disabled in those two files, with the reason recorded, rather than across the codebase.
- **A `mediaSurface` palette token** was added for the letterbox behind a `contain`-fitted video: black in both schemes, unlike every other surface, because a video's own black bars are what the eye expects and a light one reads as a rendering fault.
- **`expo-audio` and `expo-video` are stubbed in `jest.setup.js`**, beside the other native modules that can't load under Jest. Importing either throws otherwise, which reaches every test that renders a tree containing a `MediaPlayer` — the Showcase's included.

---

[All components](../../../docs/components/index.md) · [Docs index](../../../docs/index.md)

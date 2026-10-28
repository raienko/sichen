import AudioMediaPlayer from "./audio";
import type { MediaPlayerProps } from "./types";
import VideoMediaPlayer from "./video";

/**
 * One player for both kinds of media: `type="video"` renders a picture with
 * the controls beneath it, `type="audio"` is the controls alone.
 *
 * The two are separate implementations because the packages behind them
 * are — `expo-video` and `expo-audio` share no API, and a video view has to
 * be mounted where an audio player has nothing to show. What they *do*
 * share is reduced to one `MediaTransport` (see ./types.ts) and rendered by
 * one `MediaControls`, so the play button, scrubber, clock and mute toggle
 * can't drift apart between them — the same reason `Checkbox` and `Switch`
 * share `BinaryControlRow`.
 *
 * @example <MediaPlayer type="video" source={url} label="Trip video" />
 * @example <MediaPlayer type="audio" source={url} label="Episode 12" loop />
 * @example
 * // hand the picture to the platform's own controls
 * <MediaPlayer type="video" source={url} label="Trailer" nativeControls />
 */
export default function MediaPlayer({ type, ...props }: MediaPlayerProps) {
  return type === "video" ? (
    <VideoMediaPlayer {...props} />
  ) : (
    <AudioMediaPlayer {...props} />
  );
}

export { formatTime } from "./time";
export type { MediaPlayerProps, MediaTransport } from "./types";

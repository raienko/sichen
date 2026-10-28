import type { StyleProp, ViewStyle } from "react-native";

/** What the two implementations reduce their very different players to. */
export type MediaTransport = {
  playing: boolean;
  /** Seconds elapsed. */
  currentTime: number;
  /** Seconds in total, or `0` until the media reports one. */
  duration: number;
  muted: boolean;
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setMuted: (muted: boolean) => void;
};

export type MediaPlayerProps = {
  /** `"video"` renders a picture above the controls; `"audio"` is controls alone. */
  type: "video" | "audio";
  /**
   * What to play — a URL, a `require()`d asset, or any source
   * `expo-video`/`expo-audio` accepts.
   */
  source: string | number;
  /**
   * What is playing, in words. Required, and not shown: it names the whole
   * player for a screen reader, which otherwise announces a group of
   * unlabelled buttons with no idea what they control.
   */
  label: string;
  /** Starts playing as soon as it is ready. */
  autoPlay?: boolean;
  loop?: boolean;
  /**
   * Hands the picture to the platform's own video controls instead of the
   * app's. Video only — there is no native audio-only control surface to
   * defer to.
   */
  nativeControls?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export type MediaImplementationProps = Omit<MediaPlayerProps, "type">;

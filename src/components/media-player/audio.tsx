import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useEffect } from "react";
import { View } from "react-native";

import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { testId } from "@/utils";

import MediaControls from "./controls";
import type { MediaImplementationProps, MediaTransport } from "./types";

/**
 * `expo-video` and `expo-audio` hand back a *mutable* native object —
 * `player.loop = true`, `player.currentTime = 5` and `player.muted = true`
 * are their documented API, with no setter methods to reach for instead.
 * React Compiler's immutability rule can't tell that apart from mutating a
 * hook's return value by mistake, so it's turned off for this file rather
 * than the whole codebase.
 */
/* eslint-disable react-hooks/immutability */

/**
 * `expo-audio` behind the shared transport. It already exposes a reactive
 * status object, so the whole implementation is a translation of names —
 * `mute` to `muted`, and a `setMuted` that writes the player's own field.
 */
export default function AudioMediaPlayer({
  source,
  label,
  autoPlay = false,
  loop = false,
  style,
  testID,
}: MediaImplementationProps) {
  const theme = useTheme();
  const styles = useStyles();
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    player.loop = loop;
  }, [player, loop]);

  useEffect(() => {
    // Waits for `isLoaded`: playing before the source is ready is a no-op
    // on some platforms and an error on others.
    if (autoPlay && status.isLoaded && !status.playing) player.play();
    // Only on the transition to loaded — re-running on every status change
    // would restart playback the moment the user pressed pause.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, status.isLoaded]);

  const transport: MediaTransport = {
    playing: status.playing,
    currentTime: status.currentTime,
    duration: status.duration,
    muted: status.mute,
    play: () => player.play(),
    pause: () => player.pause(),
    seekTo: (seconds) => void player.seekTo(seconds),
    setMuted: (muted) => {
      player.muted = muted;
    },
  };

  return (
    <View
      // A labelled group, so a screen reader says what these controls are
      // for before reading them out. Not `accessible`, which would swallow
      // the buttons into one announcement.
      accessibilityLabel={label}
      aria-label={label}
      testID={testID}
      style={[
        styles.player,
        {
          backgroundColor: theme.colors.backgroundElement,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      <MediaControls
        transport={transport}
        // Derived, not the same id: the player region already carries
        // `testID`, and two elements answering to one is ambiguous.
        testID={testId(testID, "controls")}
      />
    </View>
  );
}

const useStyles = createStyles(({ spacing, radius }) => ({
  player: {
    borderRadius: radius.surface,
    alignSelf: "stretch",
    borderWidth: spacing.x1,
    overflow: "hidden",
  },
}));

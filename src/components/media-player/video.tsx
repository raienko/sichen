import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
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

/** How often the player reports progress, in seconds. */
const TIME_UPDATE_INTERVAL = 0.25;

/**
 * `expo-video` behind the shared transport.
 *
 * Unlike `expo-audio` it has no reactive status object, so playback state
 * is read from its events instead: `playingChange` for the play/pause
 * state and `timeUpdate` for the position, the latter needing
 * `timeUpdateEventInterval` set or it never fires at all. Each `useEvent`
 * is seeded from the player's current value so the first render isn't a
 * frame of wrong state.
 */
export default function VideoMediaPlayer({
  source,
  label,
  autoPlay = false,
  loop = false,
  nativeControls = false,
  style,
  testID,
}: MediaImplementationProps) {
  const theme = useTheme();
  const styles = useStyles();

  const player = useVideoPlayer(source, (instance) => {
    instance.timeUpdateEventInterval = TIME_UPDATE_INTERVAL;
    instance.loop = loop;
    if (autoPlay) instance.play();
  });

  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });
  const { currentTime } = useEvent(player, "timeUpdate", {
    currentTime: player.currentTime,
    bufferedPosition: 0,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
  });
  const { muted } = useEvent(player, "mutedChange", { muted: player.muted });

  useEffect(() => {
    player.loop = loop;
  }, [player, loop]);

  const transport: MediaTransport = {
    playing: isPlaying,
    currentTime,
    // Not an event: it's known once the source is read, and `timeUpdate`
    // re-renders often enough to pick it up.
    duration: player.duration,
    muted,
    play: () => player.play(),
    pause: () => player.pause(),
    seekTo: (seconds) => {
      player.currentTime = seconds;
    },
    setMuted: (next) => {
      player.muted = next;
    },
  };

  return (
    <View
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
      <VideoView
        player={player}
        // The app's own controls by default, so a video and an audio player
        // look and announce the same. `nativeControls` hands the picture
        // back to the platform when that's what a screen wants.
        nativeControls={nativeControls}
        contentFit="contain"
        style={[styles.video, { backgroundColor: theme.colors.mediaSurface }]}
      />
      {nativeControls ? null : (
        <MediaControls
          transport={transport}
          // Derived, not the same id: the player region already carries
          // `testID`, and two elements answering to one is ambiguous.
          testID={testId(testID, "controls")}
        />
      )}
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
  video: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
}));

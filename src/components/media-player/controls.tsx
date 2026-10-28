import { View } from "react-native";

import { IconButton } from "@/components/button";
import Icon from "@/components/icon";
import Slider from "@/components/slider";
import Text from "@/components/text";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { testId } from "@/utils";

import { formatTime } from "./time";
import type { MediaTransport } from "./types";

type Props = {
  transport: MediaTransport;
  testID?: string;
};

/**
 * The transport bar: play/pause, a scrubber, the clock, and mute. Shared by
 * both implementations, which is the point of reducing two unrelated
 * players to one `MediaTransport` — video and audio then can't drift into
 * looking or announcing differently.
 *
 * The scrubber is the app's own `Slider`, so it arrives with `adjustable`
 * semantics and keyboard support already done rather than being a bare
 * track that only a pointer can move. Its announced value is the clock
 * ("1:23 of 4:56") instead of a raw second count, which is what a listener
 * actually wants to know.
 */
export default function MediaControls({ transport, testID }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { t } = useLocale();

  const { playing, currentTime, duration, muted } = transport;
  // A player reports 0 until it has read the media's length. Scrubbing a
  // 0-length track would divide by nothing, so the slider stays disabled
  // and pinned until there's a real duration.
  const ready = duration > 0;
  const position = ready ? Math.min(currentTime, duration) : 0;
  const clock = t("mediaPlayer.time", {
    current: formatTime(position),
    total: formatTime(duration),
  });

  return (
    <View style={styles.controls} testID={testID}>
      <IconButton
        label={playing ? t("mediaPlayer.pause") : t("mediaPlayer.play")}
        testID={testId(testID, "play")}
        type="primary"
        onPress={() => (playing ? transport.pause() : transport.play())}
      >
        <Icon name={playing ? "pause" : "play"} />
      </IconButton>

      <View style={styles.track}>
        <Slider
          label={t("mediaPlayer.progress")}
          // The clock below already says what this is; the name is kept
          // for the screen reader, which has nothing else to go on.
          hideLabel
          testID={testId(testID, "scrubber")}
          value={position}
          min={0}
          max={ready ? duration : 1}
          disabled={!ready}
          onChange={(next: number) => transport.seekTo(next)}
          // The clock, not the second count: "1:23 of 4:56" is what a
          // listener wants read back, and it's the same string shown below.
          formatValue={() => clock}
        />
        <Text
          value={clock}
          type="caption2"
          style={{ color: theme.colors.textSecondary }}
        />
      </View>

      <IconButton
        label={muted ? t("mediaPlayer.unmute") : t("mediaPlayer.mute")}
        testID={testId(testID, "mute")}
        onPress={() => transport.setMuted(!muted)}
      >
        <Icon name={muted ? "volume-x" : "volume-2"} />
      </IconButton>
    </View>
  );
}

const useStyles = createStyles(({ isRTL, spacing }) => ({
  controls: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    alignSelf: "stretch",
    gap: spacing.x8,
    padding: spacing.x8,
  },
  track: {
    // Takes the space the two buttons don't need; they never shrink.
    flex: 1,
    minWidth: 0,
    gap: spacing.x2,
  },
}));

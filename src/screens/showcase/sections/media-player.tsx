import { useState } from "react";
import { View } from "react-native";

import MediaPlayer from "@/components/media-player";
import SegmentedControl from "@/components/segmented-control";
import Switch from "@/components/switch";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

const VIDEO =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
const AUDIO =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3";

const TYPES = [
  { value: "video", label: "video" },
  { value: "audio", label: "audio" },
];

/** One component, two packages, the same transport bar under both. */
export default function MediaPlayerSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [type, setType] = useState<"video" | "audio">("video");
  const [nativeControls, setNativeControls] = useState(false);
  const [loop, setLoop] = useState(false);

  return (
    <View style={styles.container}>
      <Text
        value="expo-video and expo-audio share no API, so they're separate implementations — but both reduce to one transport, rendered by one set of controls, so the play button, scrubber, clock and mute toggle can't drift apart."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <SegmentedControl
        label="Media type"
        value={type}
        onChange={(next) => setType(next as "video" | "audio")}
        options={TYPES}
      />
      <Switch label="loop" value={loop} onChange={setLoop} />
      <Switch
        label="nativeControls (video only)"
        value={nativeControls}
        onChange={setNativeControls}
        disabled={type === "audio"}
      />

      <MediaPlayer
        // Remounts on every switch: two native players sharing one view
        // would fight over the audio session.
        key={`${type}-${String(nativeControls)}`}
        type={type}
        source={type === "video" ? VIDEO : AUDIO}
        label={type === "video" ? "A flower opening" : "A T-rex roar"}
        loop={loop}
        nativeControls={type === "video" && nativeControls}
      />

      <Readout label="type" value={type} />
      <Readout
        label="controls"
        value={type === "video" && nativeControls ? "platform" : "app"}
      />
      <Text
        value="The scrubber is the app's own Slider, so it arrives adjustable and keyboard-operable rather than being a bare track only a pointer can move. It announces the clock — “1:23 of 4:56” — not a raw second count."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x8,
  },
}));

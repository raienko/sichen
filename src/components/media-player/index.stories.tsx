import { View } from "react-native";

import Text from "@/components/text";
import { createStyles } from "@/features/responsive";

import Component from "./index";

const meta = {
  title: "components/MediaPlayer",
  component: Component,
};

export default meta;

const VIDEO =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
const AUDIO =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3";

export const Video = () => (
  <Component type="video" source={VIDEO} label="A flower opening" />
);

export const Audio = () => (
  <Component type="audio" source={AUDIO} label="A T-rex roar" />
);

/** The same transport, whichever package is behind it. */
export const BothTogether = () => {
  const styles = useStyles();

  return (
    <View style={styles.stack}>
      <Text value="Video" type="footnote" />
      <Component type="video" source={VIDEO} label="A flower opening" />
      <Text value="Audio" type="footnote" />
      <Component type="audio" source={AUDIO} label="A T-rex roar" />
    </View>
  );
};

/** Hands the picture to the platform's own controls. */
export const NativeControls = () => (
  <Component
    type="video"
    source={VIDEO}
    label="A flower opening"
    nativeControls
  />
);

export const Looping = () => (
  <Component type="audio" source={AUDIO} label="A T-rex roar" loop />
);

const useStyles = createStyles(({ spacing }) => ({
  stack: {
    alignSelf: "stretch",
    gap: spacing.x8,
  },
}));

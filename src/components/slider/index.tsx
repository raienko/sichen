import { View } from "react-native";

import Text from "@/components/text";
import { DEFAULT_COMPONENT_TYPE } from "@/components/types";
import { createStyles } from "@/features/responsive";

import CustomSlider from "./custom";
import ExpoUISlider from "./expo";
import type { SliderProps } from "./types";

/** Controlled single- or multi-thumb slider with custom and Expo UI variants. */
export default function Slider({
  type = DEFAULT_COMPONENT_TYPE,
  hideLabel = false,
  style,
  ...props
}: SliderProps) {
  const styles = useStyles();
  const useExpo = type === "expo" && !Array.isArray(props.value);

  return (
    <View style={[styles.container, style]}>
      {hideLabel ? null : <Text value={props.label} type="footnote" />}
      {useExpo ? <ExpoUISlider {...props} /> : <CustomSlider {...props} />}
    </View>
  );
}

export type { MultiSliderProps, SingleSliderProps, SliderProps } from "./types";

const useStyles = createStyles(({ spacing }) => ({
  container: {
    alignSelf: "stretch",
    gap: spacing.x4,
  },
}));

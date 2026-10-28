import { useState } from "react";
import {
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type ViewStyle,
} from "react-native";

import { useIsRtl } from "@/features/localization";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { testId } from "@/utils";

import {
  changeSliderThumb,
  getSliderBounds,
  getSliderValues,
  getThumbLabel,
  getThumbTestID,
} from "./interaction";
import SliderThumb from "./thumb";
import type { SliderImplementationProps } from "./types";
import { clamp, sliderPercent } from "./utils";

/** App-owned slider; unlike native sliders, this supports multiple thumbs. */
export default function CustomSlider(props: SliderImplementationProps) {
  const theme = useTheme();
  const isRTL = useIsRtl();
  const { sizes } = useSizes();
  const styles = useStyles();
  const [width, setWidth] = useState(0);
  const { min, max } = getSliderBounds(props);
  const values = getSliderValues(props);
  const thumbSize = sizes.elementHeightMd;
  const usableWidth = Math.max(0, width - thumbSize);
  const logicalPercents = values.map((value) => sliderPercent(value, min, max));
  const visualPercents = logicalPercents.map((percent) =>
    isRTL ? 1 - percent : percent,
  );
  const firstFill = values.length === 1 ? (isRTL ? 1 : 0) : visualPercents[0];
  const lastFill = visualPercents.at(-1) ?? firstFill;
  const fillStart = Math.min(firstFill, lastFill);
  const fillEnd = Math.max(firstFill, lastFill);

  function handleLayout({ nativeEvent }: LayoutChangeEvent) {
    setWidth(nativeEvent.layout.width);
  }

  function handleTrackPress(locationX: number) {
    if (props.disabled || usableWidth <= 0) return;
    const visualPercent = clamp(
      (locationX - thumbSize / 2) / usableWidth,
      0,
      1,
    );
    const logicalPercent = isRTL ? 1 - visualPercent : visualPercent;
    const requestedValue = min + logicalPercent * (max - min);
    const index = values.reduce(
      (nearest, value, valueIndex) =>
        Math.abs(value - requestedValue) <
        Math.abs(values[nearest] - requestedValue)
          ? valueIndex
          : nearest,
      0,
    );
    changeSliderThumb(props, index, requestedValue);
  }

  function handleTrackResponderGrant(event: GestureResponderEvent) {
    handleTrackPress(event.nativeEvent.locationX);
  }

  return (
    <View
      accessible={false}
      testID={testId(props.testID, "control")}
      onLayout={handleLayout}
      style={[styles.control, props.disabled ? styles.disabled : null]}
    >
      <View
        accessible={false}
        testID={testId(props.testID, "track")}
        onStartShouldSetResponder={() => !props.disabled}
        onResponderGrant={handleTrackResponderGrant}
        style={[styles.trackPressable, { paddingHorizontal: thumbSize / 2 }]}
      >
        <View
          pointerEvents="none"
          style={[styles.track, { backgroundColor: theme.colors.border }]}
        >
          <View
            style={[
              styles.fill,
              {
                backgroundColor: theme.colors.primary,
                left: `${fillStart * 100}%`,
                right: `${(1 - fillEnd) * 100}%`,
              } as ViewStyle,
            ]}
          />
        </View>
      </View>

      {values.map((value, index) => {
        const valueText = props.formatValue?.(value, index) ?? String(value);
        return (
          <SliderThumb
            key={index}
            slider={props}
            index={index}
            value={value}
            label={getThumbLabel(props, index, values.length)}
            valueText={valueText}
            testID={getThumbTestID(props.testID, index, values.length)}
            left={
              thumbSize / 2 +
              visualPercents[index] * usableWidth -
              thumbSize / 2
            }
            usableWidth={usableWidth}
            isRTL={isRTL}
          />
        );
      })}
    </View>
  );
}

const useStyles = createStyles(({ spacing, sizes, radius }) => ({
  control: {
    alignSelf: "stretch",
    height: sizes.elementHeightMd,
    justifyContent: "center",
  },
  trackPressable: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: "center",
  },
  track: {
    borderRadius: radius.indicator,
    height: spacing.x4,
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  disabled: {
    opacity: 0.5,
  },
}));

import { useCallback, useRef, useState } from "react";
import { View, type GestureResponderEvent } from "react-native";

import { sliderA11yProps } from "@/features/accessibility";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { isWeb } from "@/utils";

import {
  changeSliderThumb,
  getAccessibilityStep,
  getSliderBounds,
  handleSliderKey,
  type SliderKeyEvent,
} from "./interaction";
import type { SliderImplementationProps } from "./types";

type Props = {
  slider: SliderImplementationProps;
  index: number;
  value: number;
  label: string;
  valueText: string;
  testID?: string;
  left: number;
  usableWidth: number;
  isRTL: boolean;
};

/** One independently accessible and draggable thumb. */
export default function SliderThumb({
  slider,
  index,
  value,
  label,
  valueText,
  testID,
  left,
  usableWidth,
  isRTL,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const [focused, setFocused] = useState(false);
  const dragStartX = useRef(0);
  const dragStartValue = useRef(value);
  const { min, max } = getSliderBounds(slider);
  const accessibilityStep = getAccessibilityStep(min, max, slider.step);

  const handleGrant = useCallback(
    (event: GestureResponderEvent) => {
      dragStartX.current = event.nativeEvent.pageX;
      dragStartValue.current = value;
    },
    [value],
  );

  const handleMove = useCallback(
    (event: GestureResponderEvent) => {
      if (usableWidth <= 0) return;
      const direction = isRTL ? -1 : 1;
      const distance = event.nativeEvent.pageX - dragStartX.current;
      const delta = (distance / usableWidth) * (max - min) * direction;
      changeSliderThumb(slider, index, dragStartValue.current + delta);
    },
    [index, isRTL, max, min, slider, usableWidth],
  );

  const webKeyboardProps = isWeb
    ? {
        tabIndex: slider.disabled ? (-1 as const) : (0 as const),
        onKeyDown: (event: SliderKeyEvent) =>
          handleSliderKey(event, slider, index),
      }
    : null;

  return (
    <View
      {...sliderA11yProps({
        label,
        value,
        valueText,
        min,
        max,
        disabled: slider.disabled,
        hint: slider.accessibilityHint,
      })}
      {...webKeyboardProps}
      testID={testID}
      onStartShouldSetResponder={() => !slider.disabled}
      onResponderGrant={handleGrant}
      onResponderMove={handleMove}
      onAccessibilityAction={({ nativeEvent }) => {
        const direction = nativeEvent.actionName;
        if (direction !== "increment" && direction !== "decrement") return;
        changeSliderThumb(
          slider,
          index,
          value +
            (direction === "increment"
              ? accessibilityStep
              : -accessibilityStep),
        );
      }}
      onFocus={() => {
        setFocused(true);
        slider.onFocus?.();
      }}
      onBlur={() => {
        setFocused(false);
        slider.onBlur?.();
      }}
      style={[styles.touchTarget, { left }]}
    >
      <View
        style={[
          styles.thumb,
          {
            backgroundColor: theme.colors.background,
            borderColor: focused ? theme.colors.focus : theme.colors.primary,
          },
          focused ? styles.focused : null,
        ]}
      />
    </View>
  );
}

const useStyles = createStyles(({ spacing, sizes, radius }) => ({
  touchTarget: {
    position: "absolute",
    top: 0,
    width: sizes.elementHeightMd,
    height: sizes.elementHeightMd,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  thumb: {
    borderRadius: radius.control,
    width: spacing.x24,
    height: spacing.x24,
    borderWidth: spacing.x2,
  },
  focused: {
    borderWidth: spacing.x4,
  },
}));

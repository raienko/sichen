import { Slider as ExpoSlider } from "@expo/ui";
import { View } from "react-native";

import ExpoUIHost from "@/components/expo-ui-host";
import { sliderA11yProps } from "@/features/accessibility";
import { createStyles } from "@/features/responsive";
import { isWeb } from "@/utils";

import {
  changeSliderThumb,
  getAccessibilityStep,
  getSliderBounds,
  getThumbLabel,
  handleSliderKey,
  type SliderKeyEvent,
} from "./interaction";
import type { SliderImplementationProps } from "./types";
import { normalizeSliderValue } from "./utils";

/** Expo UI's universal single-thumb slider behind our labelled API. */
export default function ExpoUISlider(props: SliderImplementationProps) {
  const styles = useStyles();
  const { min, max } = getSliderBounds(props);
  const rawValue = Array.isArray(props.value) ? props.value[0] : props.value;
  const value = normalizeSliderValue(rawValue, min, max, props.step);
  const valueText = props.formatValue?.(value, 0) ?? String(value);
  const accessibilityStep = getAccessibilityStep(min, max, props.step);
  const webKeyboardProps = isWeb
    ? {
        tabIndex: props.disabled ? (-1 as const) : (0 as const),
        onKeyDown: (event: SliderKeyEvent) => handleSliderKey(event, props, 0),
      }
    : null;

  return (
    <View
      {...sliderA11yProps({
        label: getThumbLabel(props, 0, 1),
        value,
        valueText,
        min,
        max,
        disabled: props.disabled,
        hint: props.accessibilityHint,
      })}
      {...webKeyboardProps}
      testID={props.testID}
      onFocus={props.onFocus}
      onBlur={props.onBlur}
      onAccessibilityAction={({ nativeEvent }) => {
        const direction = nativeEvent.actionName;
        if (direction !== "increment" && direction !== "decrement") return;
        changeSliderThumb(
          props,
          0,
          value +
            (direction === "increment"
              ? accessibilityStep
              : -accessibilityStep),
        );
      }}
      style={[styles.control, props.disabled ? styles.disabled : null]}
    >
      <ExpoUIHost
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        ignoreSafeArea="all"
        style={styles.host}
      >
        <ExpoSlider
          value={value}
          min={min}
          max={max}
          step={props.step}
          disabled={props.disabled}
          onValueChange={(next) => changeSliderThumb(props, 0, next)}
        />
      </ExpoUIHost>
    </View>
  );
}

const useStyles = createStyles(({ sizes }) => ({
  control: {
    minHeight: sizes.elementHeightMd,
    justifyContent: "center",
  },
  host: {
    alignSelf: "stretch",
    height: sizes.elementHeightMd,
  },
  disabled: {
    opacity: 0.5,
  },
}));

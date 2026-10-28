import { useId } from "react";
import { View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import If from "@/components/if";
import { sliderA11yProps } from "@/features/accessibility";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";
import { isWeb } from "@/utils";

import { hsvToHex, type Hsv } from "./color";
import ColorThumb from "./thumb";
import { useDrag } from "./use-drag";

/** How far one arrow key or one screen-reader swipe turns the hue, in degrees. */
const STEP = 5;

/** The bar's stops: every 60° is one corner of the colour wheel. */
const HUE_STOPS = [0, 60, 120, 180, 240, 300, 360];

type Props = {
  hsv: Hsv;
  onChange: (hsv: Hsv) => void;
  disabled?: boolean;
  testID?: string;
};

type KeyEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
};

/**
 * The hue bar: the whole colour wheel unrolled left to right, red at both
 * ends. Changing it keeps the saturation and brightness the square has, so
 * sliding through hues keeps the same shade of each.
 *
 * Left-to-right whatever the locale, like the square above it.
 */
export default function ColorHue({ hsv, onChange, disabled, testID }: Props) {
  const styles = useStyles();
  const { t } = useLocale();
  const id = `hue-${useId().replace(/:/g, "")}`;

  const drag = useDrag(
    ({ x }) => onChange({ ...hsv, h: x * 360 }),
    disabled,
    "color-picker-hue-gesture",
  );
  const { width, height } = drag.size;

  function turn(degrees: number) {
    onChange({ ...hsv, h: Math.min(360, Math.max(0, hsv.h + degrees)) });
  }

  const degrees = Math.round(hsv.h);

  const webKeyboard = isWeb
    ? {
        tabIndex: disabled ? (-1 as const) : (0 as const),
        onKeyDown: (event: KeyEvent) => {
          const key = event.nativeEvent?.key ?? event.key;
          const amount =
            key === "ArrowRight" || key === "ArrowUp"
              ? STEP
              : key === "ArrowLeft" || key === "ArrowDown"
                ? -STEP
                : 0;
          if (amount === 0) return;
          event.preventDefault?.();
          turn(amount);
        },
      }
    : null;

  return (
    <GestureDetector gesture={drag.gesture}>
      <View
        {...sliderA11yProps({
          label: t("colorPicker.hue"),
          value: degrees,
          valueText: t("colorPicker.hueValue", { degrees }),
          min: 0,
          max: 360,
          disabled,
        })}
        {...webKeyboard}
        onAccessibilityAction={({ nativeEvent }) => {
          if (nativeEvent.actionName === "increment") turn(STEP);
          if (nativeEvent.actionName === "decrement") turn(-STEP);
        }}
        onLayout={drag.onLayout}
        testID={testID}
        style={styles.bar}
      >
        {/* Sized in pixels from the measured box rather than "100%":
            react-native-svg on Android resolves a percentage once, and a
            field that changes size (a capped height, a rotation) kept
            drawing its gradient at the old one. */}
        <Svg
          pointerEvents="none"
          width={width}
          height={height}
          style={styles.layer}
        >
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
              {HUE_STOPS.map((hue) => (
                <Stop
                  key={hue}
                  offset={String(hue / 360)}
                  stopColor={hsvToHex({ h: hue, s: 1, v: 1 })}
                />
              ))}
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${id})`} />
        </Svg>
        <If condition={width > 0}>
          <ColorThumb
            x={(hsv.h / 360) * width}
            y={height / 2}
            color={hsvToHex({ h: hsv.h, s: 1, v: 1 })}
          />
        </If>
      </View>
    </GestureDetector>
  );
}

const useStyles = createStyles(({ spacing, radius }) => ({
  bar: {
    width: "100%",
    height: spacing.x24,
    borderRadius: radius.indicator,
  },
  layer: {
    position: "absolute",
    top: 0,
    left: 0,
    borderRadius: radius.indicator,
  },
}));

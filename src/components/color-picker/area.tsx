import { useId } from "react";
import { useWindowDimensions, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import If from "@/components/if";
import { sliderA11yProps } from "@/features/accessibility";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { isWeb } from "@/utils";

import { clamp01, hsvToHex, type Hsv } from "./color";
import ColorThumb from "./thumb";
import { useDrag } from "./use-drag";

/** Width to height, when there's room for it. */
const ASPECT = 3 / 2;

/** The most of the window's height the square may take. */
const MAX_HEIGHT_SHARE = 0.25;

/** How far one arrow key or one screen-reader swipe moves, as a fraction. */
const STEP = 0.05;

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
 * The saturation/brightness square for the current hue: saturation grows
 * to the right, brightness upwards. Three layers, all SVG so they draw the
 * same everywhere — the pure hue, a white-to-clear wash across it, and a
 * clear-to-black wash down it.
 *
 * Laid out left-to-right whatever the locale: it's a colour field, not
 * text, and every colour tool draws it this way round. Positions are
 * physical (`left`/`top`), so a mirrored layout doesn't flip it.
 *
 * To assistive technology it's a slider for brightness, with saturation
 * read out alongside; the arrow keys on the web move both (left/right
 * saturation, up/down brightness). The hex field beside it is the precise
 * way in for anyone who can't drag.
 */
export default function ColorArea({ hsv, onChange, disabled, testID }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  // 3:2 until that would take more than a quarter of the window's height,
  // then flatter. On a short window (a phone in landscape, a foldable, a
  // tablet whose scaled sizes make the sheet wide) a full 3:2 square
  // pushed the sheet's own buttons out of view.
  const { height: windowHeight } = useWindowDimensions();
  const maxHeight = windowHeight * MAX_HEIGHT_SHARE;
  const { t } = useLocale();
  // The washes are true white and black in both schemes — they're colour
  // maths, not surfaces — which is exactly the palette's fixed pair.
  const white = theme.colors.scanSurface;
  const black = theme.colors.onScanSurface;
  const id = useId().replace(/:/g, "");

  const drag = useDrag(
    ({ x, y }) => onChange({ ...hsv, s: x, v: 1 - y }),
    disabled,
    "color-picker-area-gesture",
  );
  const { width, height } = drag.size;
  // Always the full width, so it lines up with the hue bar; only the
  // height gives way. Until the first layout there's no width to go on,
  // so it starts at the cap.
  const areaHeight =
    width > 0 ? Math.min(width / ASPECT, maxHeight) : maxHeight;

  function step(ds: number, dv: number) {
    onChange({ ...hsv, s: clamp01(hsv.s + ds), v: clamp01(hsv.v + dv) });
  }

  const saturation = Math.round(hsv.s * 100);
  const brightness = Math.round(hsv.v * 100);

  const webKeyboard = isWeb
    ? {
        tabIndex: disabled ? (-1 as const) : (0 as const),
        onKeyDown: (event: KeyEvent) => {
          const key = event.nativeEvent?.key ?? event.key;
          const move: Record<string, [number, number]> = {
            ArrowRight: [STEP, 0],
            ArrowLeft: [-STEP, 0],
            ArrowUp: [0, STEP],
            ArrowDown: [0, -STEP],
          };
          if (!key || !(key in move)) return;
          event.preventDefault?.();
          step(...move[key]!);
        },
      }
    : null;

  return (
    <GestureDetector gesture={drag.gesture}>
      <View
        {...sliderA11yProps({
          label: t("colorPicker.area"),
          value: brightness,
          valueText: t("colorPicker.areaValue", { saturation, brightness }),
          min: 0,
          max: 100,
          disabled,
        })}
        {...webKeyboard}
        onAccessibilityAction={({ nativeEvent }) => {
          if (nativeEvent.actionName === "increment") step(0, STEP);
          if (nativeEvent.actionName === "decrement") step(0, -STEP);
        }}
        onLayout={drag.onLayout}
        testID={testID}
        style={[styles.area, { height: areaHeight }]}
      >
        {/* Sized in pixels from the measured box rather than "100%":
            react-native-svg on Android resolves a percentage once, and a
            field that changes size (a capped height, a rotation) kept
            drawing its gradient at the old one. */}
        <Svg
          pointerEvents="none"
          width={width}
          height={areaHeight}
          style={styles.layer}
        >
          <Defs>
            <LinearGradient id={`${id}-s`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={white} stopOpacity="1" />
              <Stop offset="1" stopColor={white} stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id={`${id}-v`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={black} stopOpacity="0" />
              <Stop offset="1" stopColor={black} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect
            width="100%"
            height="100%"
            fill={hsvToHex({ h: hsv.h, s: 1, v: 1 })}
          />
          <Rect width="100%" height="100%" fill={`url(#${id}-s)`} />
          <Rect width="100%" height="100%" fill={`url(#${id}-v)`} />
        </Svg>
        <If condition={width > 0}>
          <ColorThumb
            x={hsv.s * width}
            y={(1 - hsv.v) * height}
            color={hsvToHex(hsv)}
          />
        </If>
      </View>
    </GestureDetector>
  );
}

const useStyles = createStyles(({ radius }) => ({
  area: {
    width: "100%",
    borderRadius: radius.surface,
  },
  layer: {
    position: "absolute",
    top: 0,
    left: 0,
    borderRadius: radius.surface,
  },
}));

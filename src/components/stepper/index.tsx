import { View, type StyleProp, type ViewStyle } from "react-native";

import { IconButton, type IconButtonSize } from "@/components/button";
import Icon from "@/components/icon";
import Text from "@/components/text";
import { disabledA11yProps, sliderA11yProps } from "@/features/accessibility";
import { formatNumber, useLocale } from "@/features/localization";
import { createStyles, type TypographyToken } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { isWeb, testId } from "@/utils";

import { canStep, clamp, nextValue } from "./step";

export type StepperSize = IconButtonSize;

/** Which step of the type scale the value is set in, per size. */
const SIZE_TEXT: Record<StepperSize, TypographyToken> = {
  small: "footnote",
  medium: "body",
  large: "headline",
};

type KeyEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
};

type Props = {
  /**
   * Visible text and the accessible name. A stepper has no text of its own
   * beyond the number, and "3" read aloud says nothing about what three of.
   */
  label: string;
  /**
   * Keeps `label` as the accessible name but stops drawing it, for a
   * stepper whose surroundings already say what it is — one in the trailing
   * slot of a "Quantity" row. Same contract `Slider` has.
   */
  hideLabel?: boolean;
  value: number;
  onChange: (value: number) => void;
  /** Defaults to 0. */
  min?: number;
  /** Defaults to 99 — see the note on limits. */
  max?: number;
  /** How far one press moves it. Defaults to 1. */
  step?: number;
  /**
   * How the value is drawn and announced. Defaults to the number in the
   * active locale's digits — pass one for a unit ("3 kg", "$4.50").
   */
  formatValue?: (value: number) => string;
  disabled?: boolean;
  size?: StepperSize;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * A number with a button either side of it: a quantity, a party size, a
 * count of anything small enough to reach by pressing.
 *
 * **The value is not editable, on purpose.** A stepper is for small
 * adjustments — 1 to 2, 4 to 3 — and a middle you can type into makes the
 * control two things at once: an adjustable element and a text field, which
 * need opposite accessibility treatment and disagree about what the
 * keyboard is for. Anything with a range wide enough to want typing wants
 * `Input`'s `numeric` variation instead, which already owns the digit
 * filtering, the clamping and the right keyboard. Use both together if a
 * screen genuinely needs both.
 *
 * **The whole control is one adjustable element, and the buttons are hidden
 * from assistive technology.** That's what the platform's own stepper is: a
 * screen-reader user swipes up and down (or presses the arrow keys on the
 * web) rather than hunting two anonymous buttons, and announcing "decrease,
 * button / 2 / increase, button" would turn one control into three stops.
 * The buttons stay perfectly pressable by touch — hiding affects the
 * accessibility tree, not the hit area.
 *
 * **It stops at its limits and says so.** The button that would cross a
 * bound is disabled rather than pressable-and-ignored, so the control looks
 * the way it behaves; the announced range (`min`/`max`) tells a screen
 * reader the same thing. Both default to concrete values (0 and 99) because
 * an adjustable element has to announce a range, and a stepper with no
 * limits is one that can't disable at them.
 *
 * **The value is drawn in tabular figures over a reserved width**, so a
 * number doesn't jump sideways as its digits change. The reserved width is
 * what actually guarantees that: `fontVariant` support varies across
 * Android builds, so it's the belt and the figures are the braces.
 *
 * @example <Stepper label="Quantity" value={quantity} onChange={setQuantity} />
 * @example <Stepper label="Guests" value={guests} onChange={setGuests} min={1} max={8} hideLabel />
 * @example <Stepper label="Rate" value={rate} onChange={setRate} step={0.5} formatValue={(v) => `${v}×`} />
 */
export default function Stepper({
  label,
  hideLabel = false,
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  formatValue,
  disabled = false,
  size = "medium",
  accessibilityHint,
  style,
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { t, locale } = useLocale();

  const current = clamp(value, min, max);
  const valueText = formatValue
    ? formatValue(current)
    : formatNumber(current, locale);

  const canDecrease = !disabled && canStep(value, -step, min, max);
  const canIncrease = !disabled && canStep(value, step, min, max);

  const change = (delta: number) => {
    if (disabled) return;
    const next = nextValue(value, delta, min, max);
    if (next !== current) onChange(next);
  };

  const handleKey = (event: KeyEvent) => {
    const key = event.nativeEvent?.key ?? event.key;
    if (key === "ArrowUp" || key === "ArrowRight") change(step);
    else if (key === "ArrowDown" || key === "ArrowLeft") change(-step);
    else if (key === "Home") change(min - value);
    else if (key === "End") change(max - value);
    else return;

    event.preventDefault?.();
  };

  // `sliderA11yProps` rather than a near-identical helper of its own: what
  // it emits — the native adjustable role plus the equivalent ARIA range
  // contract — is exactly a stepper's, and RN has no separate spinbutton
  // role to reach for.
  const controlA11y = sliderA11yProps({
    label,
    value: current,
    valueText,
    min,
    max,
    disabled,
    hint: accessibilityHint,
  });

  return (
    <View style={[styles.container, style]}>
      {hideLabel ? null : <Text value={label} type="footnote" />}

      <View
        testID={testID}
        {...controlA11y}
        {...(isWeb
          ? { tabIndex: disabled ? -1 : 0, onKeyDown: handleKey }
          : null)}
        onAccessibilityAction={({ nativeEvent }) => {
          if (nativeEvent.actionName === "increment") change(step);
          if (nativeEvent.actionName === "decrement") change(-step);
        }}
        style={[
          styles.control,
          {
            backgroundColor: theme.colors.backgroundElement,
            borderColor: theme.colors.border,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {/* Hidden, not absent: the adjustable element above is what a
            screen reader drives, and these are how everyone else does.
            Taking them out of the tab order goes with the hiding rather
            than beside it: an aria-hidden element left focusable is a stop
            that announces nothing, and it would make one control three tab
            stops instead of one. Two props because they cover different
            platforms — `focusable` is what native reads, and
            react-native-web ignores it on a Pressable (it renders a real
            <button>, which is focusable by default), so the web needs the
            DOM attribute spelled out. */}
        <IconButton
          {...disabledA11yProps()}
          focusable={false}
          {...(isWeb ? { tabIndex: -1 } : null)}
          testID={testId(testID, "decrease")}
          label={t("stepper.decrease", { label })}
          size={size}
          disabled={!canDecrease}
          onPress={() => change(-step)}
        >
          <Icon name="minus" />
        </IconButton>

        <Text
          {...disabledA11yProps()}
          value={valueText}
          type={SIZE_TEXT[size]}
          numberOfLines={1}
          style={[styles.value, styles[`value-${size}`]]}
        />

        <IconButton
          {...disabledA11yProps()}
          focusable={false}
          {...(isWeb ? { tabIndex: -1 } : null)}
          testID={testId(testID, "increase")}
          label={t("stepper.increase", { label })}
          size={size}
          disabled={!canIncrease}
          onPress={() => change(step)}
        >
          <Icon name="plus" />
        </IconButton>
      </View>
    </View>
  );
}

const useStyles = createStyles(({ isRTL, units, spacing, radius }) => ({
  container: {
    alignSelf: "flex-start",
    gap: spacing.x4,
  },
  control: {
    borderRadius: radius.control,
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: spacing.x1,
  },
  value: {
    textAlign: "center",
    // Figures of equal width, so 1 and 8 occupy the same space and the
    // number doesn't shuffle as it changes.
    fontVariant: ["tabular-nums"],
  },
  // Room for three digits plus a sign at each size — enough that the common
  // ranges never resize the control, and the value truncates rather than
  // pushing the buttons apart beyond it.
  "value-small": { minWidth: units(36) },
  "value-medium": { minWidth: units(44) },
  "value-large": { minWidth: units(52) },
}));

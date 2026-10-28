import { useId, type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import If from "@/components/if";
import Text from "@/components/text";
import { statusA11yProps } from "@/features/accessibility";
import { useLocale } from "@/features/localization";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

/**
 * The ids a control can point at to be labelled and described by this
 * field's text — `aria-labelledby` / `aria-describedby` on the web,
 * `accessibilityLabelledBy` on Android. Handed to a render-function child,
 * because only the control knows which of its elements should carry them.
 */
export type FormFieldIds = {
  labelId: string;
  descriptionId: string;
};

export type FormFieldProps = {
  label?: string;
  /**
   * Marks the field "Required" beside its label. Anything not required is
   * optional, so there's no marker for that.
   */
  required?: boolean;
  /** Replaces `helperText` and is announced as soon as it appears. */
  error?: string;
  helperText?: string;
  /**
   * A short reading at the end of the helper row — a character count,
   * "3 of 5 selected". Visual only unless `counterLabel` says it in words.
   */
  counter?: string;
  /** What a screen reader says for `counter`; "120 of 500 characters", not "120/500". */
  counterLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children: ReactNode | ((ids: FormFieldIds) => ReactNode);
};

/**
 * The frame around any form control: a label above, the control, and its
 * helper or error text below — the same shell every `Input` variation is
 * drawn in, public so a control that isn't an `Input` (a `Slider`, a
 * `Stepper`, something custom) sits in a form without looking borrowed.
 *
 * It owns text and spacing only. The control inside keeps its own name and
 * state — pass `hideLabel` to a control that draws its own label, so the
 * name stays for a screen reader but isn't shown twice; when it needs to point at the label or the description instead of
 * repeating them, pass a function as `children` and wire the ids it gets.
 *
 * **An error is announced when it appears**, through a live region on the
 * error line alone — the helper text is not, because a hint that talks
 * every time it changes is noise, while a field turning invalid is exactly
 * what a screen-reader user can't otherwise notice.
 *
 * @example
 * <FormField label="Volume" helperText="Applies to all devices">
 *   <Slider
          label="Volume"
          hideLabel
          value={volume}
          onChange={setVolume}
          max={100}
        />
 * </FormField>
 * @example
 * <FormField label="Guests" required error={guestsError}>
 *   {({ labelId }) => <Stepper aria-labelledby={labelId} … />}
 * </FormField>
 */
export default function FormField({
  label,
  required = false,
  error,
  helperText,
  counter,
  counterLabel,
  style,
  testID,
  children,
}: FormFieldProps) {
  const theme = useTheme();
  const styles = useStyles();
  const { t } = useLocale();
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  const helper = error ?? helperText;

  return (
    <View testID={testID} style={[styles.container, style]}>
      <If condition={label}>
        <View style={styles.labelRow}>
          <Text value={label ?? ""} type="footnote" nativeID={labelId} />
          <If condition={required}>
            <Text
              value={t("formField.required")}
              type="footnote"
              style={{ color: theme.colors.textSecondary }}
            />
          </If>
        </View>
      </If>

      {typeof children === "function"
        ? children({ labelId, descriptionId })
        : children}

      <If condition={helper || counter}>
        <View style={styles.helperRow}>
          <View style={styles.helper}>
            <If condition={helper}>
              <Text
                {...(error ? statusA11yProps({ urgency: "assertive" }) : null)}
                nativeID={descriptionId}
                value={helper ?? ""}
                type="caption1"
                style={{
                  color: error
                    ? theme.colors.error
                    : theme.colors.textSecondary,
                }}
              />
            </If>
          </View>
          <If condition={counter}>
            <Text
              value={counter ?? ""}
              type="caption1"
              accessibilityLabel={counterLabel}
              style={[styles.counter, { color: theme.colors.textSecondary }]}
            />
          </If>
        </View>
      </If>
    </View>
  );
}

const useStyles = createStyles(({ isRTL, spacing }) => ({
  container: {
    gap: spacing.x8,
  },
  labelRow: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "baseline",
    gap: spacing.x8,
  },
  helperRow: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "flex-start",
    gap: spacing.x12,
  },
  // Takes the row's width and wraps, so a long helper never pushes the
  // counter off the edge.
  helper: {
    flex: 1,
    minWidth: 0,
  },
  counter: {
    flexShrink: 0,
    fontVariant: ["tabular-nums"],
  },
}));

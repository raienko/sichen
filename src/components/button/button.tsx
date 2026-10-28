import type { ReactNode } from "react";
import {
  Pressable,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { withIconDefaults } from "@/components/icon";
import If from "@/components/if";
import Spinner from "@/components/spinner";
import Text from "@/components/text";
import { controlA11yProps } from "@/features/accessibility";
import { createStyles, type TypographyToken } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { testId } from "@/utils";

import { TYPE_COLORS, type ButtonSize, type ButtonType } from "./palette";

/**
 * Which step of the type scale each size sets its label in.
 *
 * The box metrics (height, padding) deliberately live in the stylesheet
 * below instead: they need `units()`-scaled values, which only
 * `createStyles` has. Splitting them isn't ideal, but duplicating the
 * heights into a const nothing reads would be worse.
 */
const SIZE_TEXT: Record<ButtonSize, TypographyToken> = {
  small: "footnote",
  medium: "body",
  large: "headline",
  auto: "body",
};

/**
 * A button says what it is either with a label or with content of its own,
 * never neither — and content has no text for a screen reader to read, so
 * that case has to name itself. Expressed as a union rather than three
 * optional props so an unnamed icon button is a `tsc` error rather than
 * something you find with a screen reader.
 */
type ContentProps =
  | {
      /** The label, centered and set in the size's step of the type scale. */
      value: string;
      children?: never;
      /** Rarely needed: the label already names the button. */
      label?: string;
    }
  | {
      value?: never;
      /**
       * Arbitrary content instead of a label. Any `Icon` inside takes this
       * button's foreground colour without being told it — see `IconButton`,
       * which is this case with a square box around it.
       */
      children: ReactNode;
      /** Required here: there is no text to derive a name from. */
      label: string;
    };

type Props = Omit<PressableProps, "children" | "style"> &
  ContentProps & {
    /**
     * Visual emphasis. Defaults to `"secondary"` — the app's buttons are
     * overwhelmingly utility actions, and defaulting to `primary` would make
     * every one of them shout.
     */
    type?: ButtonType;
    /** Defaults to `"medium"`, which is the 44pt touch-target height. */
    size?: ButtonSize;
    /** One of several choices (a segmented option) — also announced as such. */
    selected?: boolean;
    /** Shows a spinner, preserves the button's size, and blocks presses. */
    loading?: boolean;
    style?: StyleProp<ViewStyle>;
  };

export default function Button({
  value,
  children,
  label,
  type = "secondary",
  size = "medium",
  selected = false,
  loading = false,
  disabled,
  style,
  testID = "button",
  ...props
}: Props) {
  const theme = useTheme();
  const styles = useStyles();

  const palette = TYPE_COLORS[type];
  const background = selected ? palette.backgroundSelected : palette.background;
  const foreground =
    selected && palette.labelSelected ? palette.labelSelected : palette.label;
  const isDisabled = disabled || loading;

  const content = children ? (
    withIconDefaults(children, { color: theme.colors[foreground] })
  ) : (
    <Text
      value={value as string}
      type={SIZE_TEXT[size]}
      style={{ color: theme.colors[foreground] }}
    />
  );

  return (
    <Pressable
      {...controlA11yProps({
        label,
        disabled: isDisabled,
        selected,
        busy: loading ? true : undefined,
      })}
      style={({ pressed }) => [
        styles.button,
        styles[size],
        {
          backgroundColor:
            pressed && palette.backgroundPressed !== null
              ? theme.colors[palette.backgroundPressed]
              : background === null
                ? "transparent"
                : theme.colors[background],
          borderColor:
            palette.border === null
              ? "transparent"
              : theme.colors[palette.border],
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      disabled={isDisabled}
      {...props}
      testID={testID}
    >
      {({ pressed }) => (
        <>
          {/* A sibling under the content rather than a background, so it
              shades the resting fill — including the `selected` tint —
              instead of replacing it. */}
          <If condition={pressed && palette.backgroundPressed === null}>
            <View
              testID={testId(testID, "pressed")}
              pointerEvents="none"
              style={[
                styles.pressedOverlay,
                { backgroundColor: theme.colors.pressed },
              ]}
            />
          </If>
          <View style={styles.content}>
            {/* Keep content laid out while loading so changing state never
                changes the button's width or height. It also keeps the
                original text available as the accessible name. */}
            <View style={loading ? styles.loadingContent : null}>
              {content}
            </View>
            <If condition={loading}>
              <Spinner
                testID={testId(testID, "loading")}
                label={null}
                color={theme.colors[foreground]}
                style={styles.loadingIndicator}
              />
            </If>
          </View>
        </>
      )}
    </Pressable>
  );
}

const useStyles = createStyles(({ spacing, sizes, radius }) => ({
  button: {
    borderRadius: radius.control,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: spacing.x1,
    // Keeps the pressed overlay inside `radius.control` corners.
    overflow: "hidden",
  },
  pressedOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContent: {
    opacity: 0,
  },
  loadingIndicator: {
    position: "absolute",
  },
  small: {
    minHeight: sizes.elementHeightSm,
    paddingHorizontal: spacing.x12,
    paddingVertical: spacing.x4,
  },
  medium: {
    minHeight: sizes.elementHeightMd,
    paddingHorizontal: spacing.x16,
    paddingVertical: spacing.x8,
  },
  large: {
    minHeight: sizes.elementHeightLg,
    paddingHorizontal: spacing.x20,
    paddingVertical: spacing.x12,
  },
  auto: {
    paddingHorizontal: spacing.x12,
    paddingVertical: spacing.x8,
  },
}));

import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import Badge from "@/components/badge";
import Icon from "@/components/icon";
import { controlA11yProps, disabledA11yProps } from "@/features/accessibility";
import { formatNumber, useLocale } from "@/features/localization";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

type Props = {
  onPress: () => void;
  /** Messages from others that arrived while the reader was away. */
  unseen?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * The floating "back to the newest messages" button a thread shows once
 * the reader has scrolled up into history — with a count of what arrived
 * from others in the meantime.
 *
 * Its own opaque square rather than a kit `IconButton`: it floats over
 * the thread, and the secondary button's see-through fill would let the
 * bubbles underneath show through it. The count is in its accessible name
 * ("Jump to newest messages, 3 new"), not only on the badge.
 */
export default function JumpToLatest({
  onPress,
  unseen = 0,
  style,
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { spacing } = useSizes();
  const { t, locale } = useLocale();

  const label =
    unseen > 0
      ? t("chat.jumpToLatestUnseen", { count: formatNumber(unseen, locale) })
      : t("chat.jumpToLatest");

  return (
    <Pressable
      testID={testID}
      {...controlA11yProps({ label })}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed
            ? theme.colors.backgroundElementSelected
            : theme.colors.background,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      <View {...disabledA11yProps()}>
        <Icon
          name="chevron-down"
          size={spacing.x24}
          color={theme.colors.text}
        />
      </View>
      <View {...disabledA11yProps()} style={styles.badge}>
        <Badge count={unseen} type="info" />
      </View>
    </Pressable>
  );
}

const useStyles = createStyles(({ units, sizes, radius, isRTL }) => ({
  button: {
    width: sizes.elementHeightMd,
    height: sizes.elementHeightMd,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: units(1),
    borderRadius: radius.control,
  },
  badge: {
    position: "absolute",
    top: -units(8),
    ...(isRTL ? { left: -units(8) } : { right: -units(8) }),
  },
}));

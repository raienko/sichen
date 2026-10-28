import { Pressable } from "react-native";

import Icon from "@/components/icon";
import If from "@/components/if";
import Text from "@/components/text";
import { controlA11yProps } from "@/features/accessibility";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import type { PhoneCountry } from "./countries";

type Props = {
  option: PhoneCountry;
  selected: boolean;
  onPress: (option: PhoneCountry) => void;
};

export default function CountryOption({ option, selected, onPress }: Props) {
  const theme = useTheme();
  const { spacing } = useSizes();
  const styles = useStyles();
  const accessibleLabel = `${option.name}, +${option.callingCode}`;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        selected ? { backgroundColor: theme.colors.selected } : null,
        pressed && !selected ? { backgroundColor: theme.colors.pressed } : null,
      ]}
      onPress={() => onPress(option)}
      {...controlA11yProps({ label: accessibleLabel, selected })}
    >
      <Text value={option.flag} type="title3" allowFontScaling={false} />
      <Text value={option.name} style={styles.name} numberOfLines={1} />
      <Text
        value={`+${option.callingCode}`}
        type="callout"
        style={{ color: theme.colors.textSecondary }}
      />
      <If condition={selected}>
        <Icon name="check" size={spacing.x20} color={theme.colors.accent} />
      </If>
    </Pressable>
  );
}

const useStyles = createStyles(({ isRTL, spacing, sizes, radius }) => ({
  row: {
    borderRadius: radius.control,
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    gap: spacing.x8,
    minHeight: sizes.elementHeightMd,
    paddingHorizontal: sizes.rowInset,
  },
  name: {
    flex: 1,
  },
}));

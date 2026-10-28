import { View } from "react-native";

import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

type Props = {
  label: string;
  value: string;
};

/**
 * A label/value row for the sections that show live state (accessibility
 * flags, resolved breakpoints, storage contents) rather than a component.
 *
 * `label` is the technical name of the thing being read — a token, a flag,
 * a hook's return value — so it stays untranslated on purpose; those are
 * identifiers, not copy.
 */
export default function Readout({ label, value }: Props) {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.row}>
      <Text
        value={label}
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />
      <Text value={value} type="footnote" style={styles.value} />
    </View>
  );
}

const useStyles = createStyles(({ isRTL, spacing }) => ({
  row: {
    flexDirection: isRTL ? "row-reverse" : "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.x8,
  },
  value: {
    flexShrink: 1,
    textAlign: isRTL ? "left" : "right",
  },
}));

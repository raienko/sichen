import { View } from "react-native";

import Icon from "@/components/icon";
import If from "@/components/if";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import CheckboxRow from "./row";
import type {
  CheckboxImplementationProps,
  CheckboxIndicatorProps,
} from "./types";

function CustomIndicator({ value }: CheckboxIndicatorProps) {
  const theme = useTheme();
  const { spacing } = useSizes();
  const styles = useStyles();

  return (
    <View
      // The shared row is the one checkbox accessibility stop. Hiding the
      // decorative square prevents its icon-font glyph becoming part of the
      // name a screen reader derives.
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.box,
        {
          backgroundColor: value ? theme.colors.primary : "transparent",
          borderColor: value ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <If condition={value}>
        <Icon name="check" size={spacing.x16} color={theme.colors.onPrimary} />
      </If>
    </View>
  );
}

/** The app-owned checkbox, rendered entirely with React Native primitives. */
export default function CustomCheckbox(props: CheckboxImplementationProps) {
  return <CheckboxRow {...props} Indicator={CustomIndicator} />;
}

const useStyles = createStyles(({ spacing, radius }) => ({
  box: {
    borderRadius: radius.control,
    width: spacing.x24,
    height: spacing.x24,
    borderWidth: spacing.x2,
    alignItems: "center",
    justifyContent: "center",
  },
}));

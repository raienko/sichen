import { View } from "react-native";

import Icon from "@/components/icon";
import Text from "@/components/text";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

/**
 * One glyph from each icon family, plus the custom SVG set and a couple of
 * `color` overrides. Every family is listed explicitly rather than derived
 * from `ICON_SETS`, because each needs a glyph name that actually exists in
 * *that* family — which is exactly the constraint `Icon`'s per-family name
 * typing enforces, so a wrong pairing here wouldn't compile.
 */
export default function IconsSection() {
  const theme = useTheme();
  const { spacing } = useSizes();
  const styles = useStyles();
  const size = spacing.x28;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.item}>
          <Icon type="Feather" name="feather" size={size} />
          <Text value="Feather" type="caption2" />
        </View>
        <View style={styles.item}>
          <Icon type="MaterialIcons" name="android" size={size} />
          <Text value="Material" type="caption2" />
        </View>
        <View style={styles.item}>
          <Icon type="Ionicons" name="logo-apple" size={size} />
          <Text value="Ionicons" type="caption2" />
        </View>
        <View style={styles.item}>
          <Icon type="FontAwesome6" name="rocket" size={size} />
          <Text value="FontAwesome6" type="caption2" />
        </View>
        <View style={styles.item}>
          <Icon type="AntDesign" name="star" size={size} />
          <Text value="AntDesign" type="caption2" />
        </View>
        <View style={styles.item}>
          <Icon type="custom" name="logo" size={size} />
          <Text value="custom" type="caption2" />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.item}>
          <Icon name="heart" size={size} color={theme.colors.error} />
          <Text value="color" type="caption2" />
        </View>
        <View style={styles.item}>
          <Icon name="home" size={spacing.x16} />
          <Text value="x16" type="caption2" />
        </View>
        <View style={styles.item}>
          <Icon name="home" size={spacing.x40} />
          <Text value="x40" type="caption2" />
        </View>
      </View>
    </View>
  );
}

const useStyles = createStyles(({ spacing }) => ({
  container: {
    gap: spacing.x16,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.x16,
    alignItems: "flex-end",
  },
  item: {
    alignItems: "center",
    gap: spacing.x4,
  },
}));

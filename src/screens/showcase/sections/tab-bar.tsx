import { useState } from "react";
import { ScrollView, View } from "react-native";

import Icon from "@/components/icon";
import SegmentedControl from "@/components/segmented-control";
import Switch from "@/components/switch";
import TabBar, {
  useTabBarSpace,
  type TabBarItem,
  type TabBarVariant,
} from "@/components/tab-bar";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

const ITEMS: TabBarItem[] = [
  { key: "home", label: "Home", icon: <Icon name="home" /> },
  { key: "search", label: "Search", icon: <Icon name="search" /> },
  { key: "saved", label: "Saved", icon: <Icon name="bookmark" /> },
  { key: "profile", label: "Profile", icon: <Icon name="user" /> },
];

const VARIANTS: { value: TabBarVariant; label: string }[] = [
  { value: "sticky", label: "sticky" },
  { value: "floating", label: "floating" },
];

const ROWS = Array.from({ length: 8 }, (_, index) => `Row ${index + 1}`);

/**
 * A bounded stage standing in for a screen, so the bar can sit over
 * scrolling content the way it does in a real one — which is the only way
 * to see what `useTabBarSpace()` is actually for.
 */
export default function TabBarSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [variant, setVariant] = useState<TabBarVariant>("sticky");
  const [avoidChin, setAvoidChin] = useState(true);
  const [reserveSpace, setReserveSpace] = useState(true);
  const [tab, setTab] = useState("home");

  const space = useTabBarSpace({ variant, avoidChin });

  return (
    <View style={styles.container}>
      <Text
        value="A bottom tab bar for a Tabs navigator, in two shapes. It's drawn over the screen rather than beside it, so a screen has to reserve room for it — that's what useTabBarSpace() is for."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <SegmentedControl
        label="Variant"
        value={variant}
        onChange={(next) => setVariant(next as TabBarVariant)}
        options={VARIANTS}
      />
      <Switch label="avoidChin" value={avoidChin} onChange={setAvoidChin} />
      <Switch
        label="reserve space in the screen"
        value={reserveSpace}
        onChange={setReserveSpace}
      />

      <View style={[styles.stage, { borderColor: theme.colors.border }]}>
        <ScrollView
          contentContainerStyle={[
            styles.rows,
            { paddingBottom: reserveSpace ? space : 0 },
          ]}
        >
          {ROWS.map((row) => (
            <View
              key={row}
              style={[
                styles.row,
                { backgroundColor: theme.colors.backgroundElement },
              ]}
            >
              <Text value={row} type="footnote" />
            </View>
          ))}
        </ScrollView>

        <View style={styles.dock} pointerEvents="box-none">
          <TabBar
            items={ITEMS}
            value={tab}
            onChange={setTab}
            variant={variant}
            avoidChin={avoidChin}
          />
        </View>
      </View>

      <Readout label="selected" value={tab} />
      <Readout label="useTabBarSpace()" value={`${Math.round(space)}pt`} />
      <Text
        value="Turn the reservation off and scroll to the end: the last row disappears under the bar. The usual fix — a hardcoded paddingBottom — goes wrong the moment the variant or the device's chin changes."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
    </View>
  );
}

const useStyles = createStyles(({ spacing, sizes, radius }) => ({
  container: {
    gap: spacing.x8,
  },
  stage: {
    borderRadius: radius.surface,
    height: sizes.elementHeightLg * 4,
    borderWidth: spacing.x1,
    overflow: "hidden",
  },
  rows: {
    padding: spacing.x8,
    gap: spacing.x4,
  },
  row: {
    borderRadius: radius.surface,
    padding: spacing.x8,
  },
  // The bar overlays the content rather than sitting beside it, exactly as
  // a navigator's own does.
  dock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
}));

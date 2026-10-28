import { useState } from "react";
import { View } from "react-native";

import Card from "@/components/card";
import Divider from "@/components/divider";
import Icon from "@/components/icon";
import List, { type ListItemData } from "@/components/list";
import SegmentedControl from "@/components/segmented-control";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

const PEOPLE = Array.from({ length: 200 }, (_, index) => ({
  id: String(index),
  name: `Person ${index + 1}`,
  email: `person${index + 1}@example.com`,
}));

const RENDERERS = [
  { value: "default", label: "default (ListItem)" },
  { value: "custom", label: "custom renderItem" },
];

/**
 * Two hundred rows, so the point of a virtualized list is visible: scroll
 * it and the number of mounted rows doesn't grow.
 */
export default function ListSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [renderer, setRenderer] = useState("default");
  const [picked, setPicked] = useState<string>();

  const rows: ListItemData[] = PEOPLE.map((person) => ({
    key: person.id,
    title: person.name,
    subtitle: person.email,
    right: <Icon name="chevron-right" />,
    selected: person.id === picked,
    onPress: () => setPicked(person.id),
  }));

  return (
    <View style={styles.container}>
      <Text
        value="A wrapper over Legend List — a FlatList replacement that recycles row containers rather than mounting one view per row. Give it ListItemData and each entry renders as a ListItem; pass renderItem and it steps out of the way."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <SegmentedControl
        label="Renderer"
        value={renderer}
        onChange={setRenderer}
        options={RENDERERS}
      />

      <Card padded={false} style={styles.stage}>
        {renderer === "default" ? (
          <List
            data={rows}
            ListHeaderComponent={
              <View style={styles.header}>
                <Text value={`${PEOPLE.length} people`} type="footnote" />
              </View>
            }
            ItemSeparatorComponent={() => <Divider inset="x16" />}
          />
        ) : (
          <List
            data={PEOPLE}
            keyExtractor={(person) => person.id}
            estimatedItemSize={56}
            renderItem={({ item, index }) => (
              <View style={styles.custom}>
                <Text value={`#${index + 1}`} type="caption2" />
                <Text value={item.name} type="headline" />
                <Text
                  value={item.email}
                  type="caption1"
                  style={{ color: theme.colors.textSecondary }}
                />
              </View>
            )}
          />
        )}
      </Card>

      <Readout label="picked" value={picked ?? "none"} />
      <Text
        value="The custom renderer's items are plain records — no key, no title, nothing ListItem would recognise. Its item type is inferred from data, and keyExtractor and estimatedItemSize become the caller's to supply."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
    </View>
  );
}

const useStyles = createStyles(({ sizes, spacing }) => ({
  container: {
    gap: spacing.x8,
  },
  stage: {
    height: sizes.elementHeightLg * 5,
  },
  header: {
    padding: spacing.x12,
  },
  custom: {
    padding: spacing.x12,
    gap: spacing.x2,
  },
}));

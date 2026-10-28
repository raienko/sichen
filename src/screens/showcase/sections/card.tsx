import { useState } from "react";
import { View } from "react-native";

import Card, { type CardType } from "@/components/card";
import Image from "@/components/image";
import SegmentedControl from "@/components/segmented-control";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

const TYPES: { value: CardType; label: string }[] = [
  { value: "elevated", label: "elevated" },
  { value: "outlined", label: "outlined" },
  { value: "filled", label: "filled" },
];

/** The surface itself, its three types, and the one case that tells them apart. */
export default function CardSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [type, setType] = useState<CardType>("elevated");
  const [presses, setPresses] = useState(0);

  return (
    <View style={styles.container}>
      <Text
        value="A surface that groups related content. It owns the box and nothing else — no title or footer slots; the content is composed from Text, Image and the rest."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <SegmentedControl
        label="Card type"
        value={type}
        onChange={(next) => setType(next as CardType)}
        options={TYPES}
      />

      <Card type={type}>
        <Text value="Total" type="footnote" />
        <Text value="£42.00" type="title2" />
      </Card>

      <Text value="On an already-raised surface" type="headline" />
      <Text
        value="elevated and filled use the same token every raised surface does, so on one of those they vanish. outlined has no fill at all — it takes whatever is behind it and draws only an edge."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
      <View
        style={[
          styles.raised,
          { backgroundColor: theme.colors.backgroundElement },
        ]}
      >
        <Card type="filled">
          <Text value="filled" type="footnote" />
        </Card>
        <Card type="outlined">
          <Text value="outlined" type="footnote" />
        </Card>
      </View>

      <Text value="Pressable" type="headline" />
      <Text
        value="The whole card is one button, named by the text inside it. Don't do this for a card that holds its own controls — grouping would make them unreachable."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
      <Card onPress={() => setPresses((count) => count + 1)}>
        <Text value="Order #12" type="headline" />
        <Text value="Delivered on Tuesday" type="footnote" />
      </Card>
      <Readout label="presses" value={String(presses)} />

      <Card onPress={() => {}} disabled>
        <Text value="Order #11 (disabled)" type="headline" />
      </Card>

      <Text value="Edge to edge" type="headline" />
      <Card padded={false}>
        <Image
          source="https://picsum.photos/id/1039/600/300"
          alt="A waterfall seen from above"
          style={styles.image}
        />
        <View style={styles.caption}>
          <Text
            value="padded={false} — the content owns its spacing, and is clipped to the card's edge."
            type="footnote"
          />
        </View>
      </Card>
    </View>
  );
}

const useStyles = createStyles(({ spacing, sizes }) => ({
  container: {
    gap: spacing.x8,
  },
  raised: {
    gap: spacing.x8,
    padding: spacing.x12,
  },
  image: {
    width: "100%",
    height: sizes.elementHeightLg * 2,
  },
  caption: {
    padding: spacing.x12,
  },
}));

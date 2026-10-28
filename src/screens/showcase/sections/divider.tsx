import { useState } from "react";
import { View } from "react-native";

import Card from "@/components/card";
import Divider from "@/components/divider";
import If from "@/components/if";
import ListItem from "@/components/list-item";
import SegmentedControl from "@/components/segmented-control";
import Text from "@/components/text";
import { createStyles, type SpacingToken } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

const INSETS: { value: SpacingToken | "none"; label: string }[] = [
  { value: "none", label: "none" },
  { value: "x16", label: "x16" },
  { value: "x40", label: "x40" },
];

const PEOPLE = [
  { name: "Ada Lovelace", email: "ada@example.com" },
  { name: "Grace Hopper", email: "grace@example.com" },
  { name: "Alan Turing", email: "alan@example.com" },
];

/** Both orientations, the inset, and the one case that isn't decoration. */
export default function DividerSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [inset, setInset] = useState<SpacingToken | "none">("x16");

  return (
    <View style={styles.container}>
      <Text
        value="A drawn boundary and nothing more, so an unlabelled divider is hidden from screen readers — the grouping it suggests is already carried by the content either side."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <Text value="Horizontal" type="headline" />
      <Text value="Above the rule" type="footnote" />
      <Divider />
      <Text value="Below the rule" type="footnote" />

      <Text value="Vertical" type="headline" />
      <View style={styles.row}>
        <Text value="Left" type="footnote" />
        <Divider orientation="vertical" />
        <Text value="Middle" type="footnote" />
        <Divider orientation="vertical" />
        <Text value="Right" type="footnote" />
      </View>

      <Text value="Labelled" type="headline" />
      <Text
        value="This one does say something, so the label is announced and the rules either side become the decoration."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
      <Divider label="or" />

      <Text value="Inset" type="headline" />
      <SegmentedControl
        label="Inset"
        value={inset}
        onChange={(next) => setInset(next as SpacingToken | "none")}
        options={INSETS}
      />
      <Card padded={false}>
        <View style={styles.list}>
          {PEOPLE.map((person, index) => (
            <View key={person.email}>
              <ListItem title={person.name} subtitle={person.email} />
              <If condition={index < PEOPLE.length - 1}>
                <Divider inset={inset === "none" ? undefined : inset} />
              </If>
            </View>
          ))}
        </View>
      </Card>
      <Readout label="inset" value={inset} />
      <Text
        value="An inset lines the rule up with the text instead of running under the avatars."
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: sizes.elementHeightMd,
    gap: spacing.x12,
  },
  list: {
    paddingVertical: spacing.x4,
  },
}));

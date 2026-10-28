import { useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Icon from "@/components/icon";
import If from "@/components/if";
import Tag from "@/components/tag";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

const TOPICS = ["Design", "Accessibility", "Typography", "Localization"];

const PEOPLE = ["Ada Lovelace", "Grace Hopper", "Alan Turing"];

/** All three shapes, and the one pill that holds two separate controls. */
export default function TagsSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [picked, setPicked] = useState<string[]>(["Design"]);
  const [people, setPeople] = useState(PEOPLE);
  const [unread, setUnread] = useState<"on" | "off" | "removed">("on");

  function toggle(topic: string) {
    setPicked((current) =>
      current.includes(topic)
        ? current.filter((entry) => entry !== topic)
        : [...current, topic],
    );
  }

  return (
    <View style={styles.container}>
      <Text
        value="Three shapes out of two props: static with neither, a pressable filter chip with onPress, and a removable one with onClose."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <Text value="Static" type="headline" />
      <View style={styles.row}>
        {TOPICS.map((topic) => (
          <Tag key={topic} value={topic} />
        ))}
        <Tag value="Draft" icon={<Icon name="edit-3" />} />
      </View>

      <Text value="Sizes" type="headline" />
      <View style={styles.row}>
        <Tag value="small" size="small" />
        <Tag value="medium" size="medium" />
      </View>
      <Text
        value="small is the compact 32pt pill; medium is the 44pt touch target, which is why an interactive tag defaults to it."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />

      <Text value="Selectable" type="headline" />
      <View style={styles.row}>
        {TOPICS.map((topic) => (
          <Tag
            key={topic}
            value={topic}
            selected={picked.includes(topic)}
            onPress={() => toggle(topic)}
          />
        ))}
      </View>
      <Readout label="selected" value={picked.join(", ") || "none"} />

      <Text value="Removable" type="headline" />
      <Text
        value="The remove button is its own target and names what it removes — “Remove Ada Lovelace”, not “Close”."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
      <View style={styles.row}>
        {people.map((person) => (
          <Tag
            key={person}
            value={person}
            onClose={() =>
              setPeople((rest) => rest.filter((entry) => entry !== person))
            }
          />
        ))}
        <If condition={people.length === 0}>
          <Button
            value="Reset"
            size="small"
            onPress={() => setPeople(PEOPLE)}
          />
        </If>
      </View>
      <Readout label="remaining" value={String(people.length)} />

      <Text value="Both at once" type="headline" />
      <Text
        value="One pill, two controls: pressing the body toggles it, pressing the ✕ removes it, and a screen reader reaches each separately."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
      <View style={styles.row}>
        {unread === "removed" ? (
          <Button
            value="Bring it back"
            size="small"
            onPress={() => setUnread("on")}
          />
        ) : (
          <Tag
            value="Unread"
            selected={unread === "on"}
            onPress={() => setUnread(unread === "on" ? "off" : "on")}
            onClose={() => setUnread("removed")}
          />
        )}
      </View>
      <Readout label="unread" value={unread} />

      <Text value="Disabled" type="headline" />
      <View style={styles.row}>
        <Tag value="Static" disabled />
        <Tag value="Pressable" onPress={() => {}} disabled />
        <Tag value="Removable" onClose={() => {}} disabled />
      </View>

      <Text value="Long text" type="headline" />
      <Tag
        value="A tag with considerably more text in it than will ever fit on one line"
        onClose={() => {}}
      />
      <Text
        value="It truncates rather than overflowing: the body gives way and the remove button never shrinks."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
    </View>
  );
}

const useStyles = createStyles(({ isRTL, spacing }) => ({
  container: {
    gap: spacing.x8,
  },
  row: {
    flexDirection: isRTL ? "row-reverse" : "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.x8,
  },
}));

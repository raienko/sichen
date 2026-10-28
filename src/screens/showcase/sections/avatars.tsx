import { useState } from "react";
import { View } from "react-native";

import Avatar, { type AvatarSize } from "@/components/avatar";
import Icon from "@/components/icon";
import ListItem from "@/components/list-item";
import SegmentedControl from "@/components/segmented-control";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

const PHOTO = "https://picsum.photos/id/1027/200/200";
const OTHER = "https://picsum.photos/id/1025/200/200";
const BROKEN = "https://example.invalid/missing.png";

const SIZES: { value: AvatarSize; label: string }[] = [
  { value: "small", label: "small" },
  { value: "medium", label: "medium" },
  { value: "large", label: "large" },
];

const NAMES = ["Ada Augusta Byron Lovelace", "Grace", "山田太郎", "🙂 Smith"];

/** The fallback stack, the sizes, the status dot, and the slot it's for. */
export default function AvatarsSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [size, setSize] = useState<AvatarSize>("medium");

  return (
    <View style={styles.container}>
      <Text
        value="The picture of a person or a thing, in a circle. The monogram underneath is always drawn, so it doubles as the loading state and as the fallback."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <Text value="Size" type="headline" />
      <SegmentedControl
        label="Size"
        value={size}
        onChange={(next) => setSize(next as AvatarSize)}
        options={SIZES}
      />
      <View style={styles.row}>
        <Avatar name="Ada Lovelace" source={PHOTO} size={size} />
        <Avatar name="Ada Lovelace" size={size} />
        <Avatar name="Design team" icon={<Icon name="users" />} size={size} />
        <Avatar
          name="Ada Lovelace"
          source={PHOTO}
          size={size}
          status="success"
          statusLabel="Online"
        />
      </View>
      <Readout label="size" value={size} />

      <Text value="Fallbacks" type="headline" />
      <Text
        value="A picture, a source that will never load, a name, a single word, and no name at all — each falls one step further down the same stack."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
      <View style={styles.row}>
        <Avatar name="Ada Lovelace" source={PHOTO} />
        <Avatar name="Ada Lovelace" source={BROKEN} />
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace" />
        <Avatar name="" />
      </View>

      <Text value="Status" type="headline" />
      <Text
        value="A dot is colour, and colour alone says nothing to a screen reader — so the label is required with it, and is announced after the name."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
      <View style={styles.row}>
        <Avatar
          name="Ada Lovelace"
          source={PHOTO}
          status="success"
          statusLabel="Online"
        />
        <Avatar
          name="Grace Hopper"
          source={OTHER}
          status="warning"
          statusLabel="Away"
        />
        <Avatar name="Alan Turing" status="error" statusLabel="Offline" />
        <Avatar name="Katherine Johnson" status="info" statusLabel="Syncing" />
        <Avatar name="Unknown" status="neutral" statusLabel="No status" />
      </View>

      <Text value="Names" type="headline" />
      <View style={styles.row}>
        {NAMES.map((name) => (
          <View key={name} style={styles.named}>
            <Avatar name={name} />
            <Text value={name} type="caption2" />
          </View>
        ))}
      </View>
      <Text
        value="Middle names are skipped, a single word gives one character, and a code point is never split in half."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />

      <Text value="In a list" type="headline" />
      <ListItem
        title="Ada Lovelace"
        subtitle="ada@example.com"
        left={
          <Avatar
            name="Ada Lovelace"
            source={PHOTO}
            size="small"
            status="success"
            statusLabel="Online"
          />
        }
      />
      <ListItem
        title="Grace Hopper"
        subtitle="grace@example.com"
        left={<Avatar name="Grace Hopper" size="small" />}
      />
      <ListItem
        title="Design team"
        subtitle="4 members"
        left={
          <Avatar
            name="Design team"
            icon={<Icon name="users" />}
            size="small"
          />
        }
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
    gap: spacing.x12,
  },
  named: {
    alignItems: "center",
    gap: spacing.x4,
  },
}));

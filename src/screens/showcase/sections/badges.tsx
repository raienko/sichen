import { useState } from "react";
import { View } from "react-native";

import Badge from "@/components/badge";
import Button from "@/components/button";
import Icon from "@/components/icon";
import ListItem from "@/components/list-item";
import Text from "@/components/text";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

const TYPES = ["neutral", "success", "warning", "error", "info"] as const;

const COUNTS = [1, 12, 99, 412];

/** Every type, the count formatting, the dot, and where a badge sits. */
export default function BadgesSection() {
  const theme = useTheme();
  const { spacing } = useSizes();
  const styles = useStyles();
  const [unread, setUnread] = useState(3);

  return (
    <View style={styles.container}>
      <Text
        value="A small marker attached to something else: an unread count on a tab, “Beta” beside a feature, a dot on an avatar."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <Text value="Types" type="headline" />
      <View style={styles.row}>
        {TYPES.map((type) => (
          <Badge key={type} type={type} value={type} />
        ))}
      </View>
      <Text
        value="A filled badge is labelled in the page colour, not the text colour: the semantic tokens are tuned to contrast against the page, so using one as a fill inverts the problem."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />

      <Text value="Counts" type="headline" />
      <View style={styles.row}>
        {COUNTS.map((count) => (
          <Badge key={count} type="error" count={count} />
        ))}
        <Badge type="error" count={1200} max={999} />
        <Badge type="error" count={1200} max={9999} />
      </View>
      <Text
        value="Anything over max becomes “99+” — the fourth and fifth show max at its default 99 and raised to 999. The last is under its max, so it prints in full, with the digits and separators of the active locale: switch to Deutsch and 1,200 becomes 1.200."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />

      <Text value="Zero" type="headline" />
      <View style={styles.row}>
        <Text value="Unread" />
        <Badge type="error" count={unread} label={`${unread} unread`} />
        <Button
          value="−"
          size="small"
          label="Fewer"
          onPress={() => setUnread((current) => current - 1)}
        />
        <Button
          value="+"
          size="small"
          label="More"
          onPress={() => setUnread((current) => current + 1)}
        />
      </View>
      <Readout label="count" value={String(unread)} />
      <Text
        value="A count of zero or less renders nothing at all — “no unread” is not a thing to show a badge about."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />

      <Text value="Dots" type="headline" />
      <View style={styles.row}>
        <Badge dot />
        <Badge dot type="success" label="Online" />
        <Badge dot type="warning" label="Away" />
        <Badge dot type="error" label="Do not disturb" />
      </View>
      <Text
        value="The unlabelled one is hidden from screen readers — with no text it has nothing to announce. The other three are named, so they are."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />

      <Text value="In place" type="headline" />
      <Text
        value="A badge never positions itself: it is sized by its own content, and where it sits belongs to whatever owns both it and the thing it marks."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
      <ListItem
        title="Inbox"
        subtitle="ada@example.com"
        left={<Icon name="inbox" />}
        right={<Badge type="error" count={12} label="12 unread" />}
      />
      <View style={styles.row}>
        <Text value="Passkeys" type="headline" />
        <Badge type="info" value="Beta" />
      </View>
      <View style={styles.pinned}>
        <Icon name="bell" size={spacing.x24} />
        <View style={styles.corner}>
          <Badge dot type="error" label="Unread notifications" />
        </View>
      </View>
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
  pinned: {
    alignSelf: "flex-start",
  },
  corner: {
    position: "absolute",
    top: -spacing.x2,
    end: -spacing.x2,
  },
}));

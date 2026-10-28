import { useState } from "react";
import { View } from "react-native";

import BackButton from "@/components/back-button";
import { IconButton } from "@/components/button";
import Header from "@/components/header";
import Icon from "@/components/icon";
import SegmentedControl from "@/components/segmented-control";
import Switch from "@/components/switch";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

/** Every arrangement of the three zones, plus the notch padding. */
export default function HeaderSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [avoidNotch, setAvoidNotch] = useState(false);
  const [view, setView] = useState("all");
  const [presses, setPresses] = useState(0);

  const count = () => setPresses((current) => current + 1);

  return (
    <View style={styles.container}>
      <Text
        value="Something on the left, something on the right, and a title or a component of your own between them. The middle is centred against the header, not against whatever the slots leave over."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <View style={styles.stage}>
        <Header
          title="Orders"
          subtitle="12 open"
          left={<BackButton onPress={count} />}
          right={
            <IconButton label="Share" onPress={count}>
              <Icon name="share" />
            </IconButton>
          }
          avoidNotch={avoidNotch}
        />
      </View>

      <Switch label="avoidNotch" value={avoidNotch} onChange={setAvoidNotch} />
      <Text
        value="Adds the device's top safe-area inset. Off by default: it's only correct for a header pinned to the very top, and inside something that already inset the page it pads twice."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />

      <Text value="One slot, still centred" type="headline" />
      <View style={styles.stage}>
        <Header title="Centred" left={<BackButton onPress={count} />} />
      </View>

      <Text value="Several elements in a slot" type="headline" />
      <View style={styles.stage}>
        <Header
          title="Orders"
          left={<BackButton onPress={count} />}
          right={[
            <IconButton key="filter" label="Filter" onPress={count}>
              <Icon name="filter" />
            </IconButton>,
            <IconButton key="add" label="Add order" onPress={count}>
              <Icon name="plus" />
            </IconButton>,
          ]}
        />
      </View>

      <Text value="A component in the middle" type="headline" />
      <View style={styles.stage}>
        <Header left={<BackButton onPress={count} />}>
          <SegmentedControl
            label="View"
            value={view}
            onChange={setView}
            options={[
              { value: "all", label: "All" },
              { value: "open", label: "Open" },
            ]}
          />
        </Header>
      </View>
      <Readout label="view" value={view} />

      <Text value="A title too long to fit" type="headline" />
      <Text
        value="The title truncates before a control does — a squashed button is unusable, a clipped title is merely shorter."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
      <View style={styles.stage}>
        <Header
          title="A title long enough that something has to give"
          left={<BackButton onPress={count} />}
          right={
            <IconButton label="Share" onPress={count}>
              <Icon name="share" />
            </IconButton>
          }
        />
      </View>

      <Readout label="presses" value={String(presses)} />
    </View>
  );
}

const useStyles = createStyles(({ spacing, radius }) => ({
  container: {
    gap: spacing.x8,
  },
  // A header stretches edge to edge, so each demo gets a bounded box to
  // sit in rather than bleeding into the section's own padding.
  stage: {
    borderRadius: radius.surface,
    overflow: "hidden",
  },
}));

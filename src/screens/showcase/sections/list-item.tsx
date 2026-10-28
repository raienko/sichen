import { useState } from "react";
import { View } from "react-native";

import { IconButton } from "@/components/button";
import Card from "@/components/card";
import Icon from "@/components/icon";
import ListItem from "@/components/list-item";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

const PEOPLE = [
  { name: "Ada Lovelace", email: "ada@example.com", initials: "AL" },
  { name: "Grace Hopper", email: "grace@example.com", initials: "GH" },
  { name: "Alan Turing", email: "alan@example.com", initials: "AT" },
];

function Avatar({ initials }: { initials: string }) {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View
      style={[
        styles.avatar,
        { backgroundColor: theme.colors.backgroundElementSelected },
      ]}
    >
      <Text value={initials} type="footnote" />
    </View>
  );
}

/** Rows with both slots filled, and the one case that must stay inert. */
export default function ListItemSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [picked, setPicked] = useState(PEOPLE[0].email);
  const [removed, setRemoved] = useState<string[]>([]);

  const remaining = PEOPLE.filter((person) => !removed.includes(person.email));

  return (
    <View style={styles.container}>
      <Text
        value="A row with something on the left, text in the middle, and something on the right. Unlike Header the text is not centred — a list is read down its leading edge."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <Card padded={false}>
        <View style={styles.list}>
          {PEOPLE.map((person) => (
            <ListItem
              key={person.email}
              title={person.name}
              subtitle={person.email}
              left={<Avatar initials={person.initials} />}
              right={<Icon name="chevron-right" />}
              selected={person.email === picked}
              onPress={() => setPicked(person.email)}
            />
          ))}
        </View>
      </Card>
      <Readout label="selected" value={picked} />

      <Text value="A row that holds its own control" type="headline" />
      <Text
        value="This one is deliberately not pressable. Making the row a button would group its children into one announcement and leave the remove button unreachable — so the button owns the interaction and the row just labels it."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
      <Card padded={false}>
        <View style={styles.list}>
          {remaining.map((person) => (
            <ListItem
              key={person.email}
              title={person.name}
              subtitle={person.email}
              left={<Avatar initials={person.initials} />}
              right={
                <IconButton
                  label={`Remove ${person.name}`}
                  size="small"
                  onPress={() =>
                    setRemoved((current) => [...current, person.email])
                  }
                >
                  <Icon name="x" />
                </IconButton>
              }
            />
          ))}
        </View>
      </Card>
      <Readout label="removed" value={String(removed.length)} />
      <Text
        value="Switch, Checkbox and RadioButton are already full labelled rows — they don't go inside a ListItem, they replace one."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />

      <Text value="Text too long to fit" type="headline" />
      <Text
        value="The text truncates before either slot shrinks — a squashed avatar or control is unusable, a clipped line is merely shorter."
        type="caption1"
        style={{ color: theme.colors.textSecondary }}
      />
      <Card padded={false}>
        <View style={styles.list}>
          <ListItem
            title="A title long enough that something has to give way somewhere"
            subtitle="And a subtitle that is also rather longer than the row is wide"
            left={<Avatar initials="AL" />}
            right={<Icon name="chevron-right" />}
            onPress={() => {}}
          />
        </View>
      </Card>

      <Text value="Disabled" type="headline" />
      <Card padded={false}>
        <View style={styles.list}>
          <ListItem
            title="Unavailable"
            subtitle="Announced as disabled, and ignores presses"
            left={<Icon name="slash" />}
            right={<Icon name="chevron-right" />}
            onPress={() => {}}
            disabled
          />
        </View>
      </Card>
    </View>
  );
}

const useStyles = createStyles(({ sizes, spacing, radius }) => ({
  container: {
    gap: spacing.x8,
  },
  avatar: {
    borderRadius: radius.surface,
    width: sizes.elementHeightMd,
    height: sizes.elementHeightMd,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingVertical: spacing.x4,
  },
}));

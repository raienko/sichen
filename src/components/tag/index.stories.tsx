import { useState } from "react";
import { View } from "react-native";

import Icon from "@/components/icon";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";

import Component from "./index";

const meta = {
  title: "components/Tag",
  component: Component,
};

export default meta;

const TOPICS = ["Design", "Accessibility", "Typography", "Localization"];

/** Content, not a control: nothing to press and nothing to announce. */
export const Static = () => {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      {TOPICS.map((topic) => (
        <Component key={topic} value={topic} />
      ))}
    </View>
  );
};

export const Sizes = () => {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      <Component value="Small" size="small" />
      <Component value="Medium" size="medium" />
    </View>
  );
};

export const WithIcon = () => (
  <Component value="Draft" icon={<Icon name="edit-3" />} />
);

/** The filter-chip case: a pressable body that can be selected. */
export const Selectable = () => {
  const styles = useStyles();
  const [picked, setPicked] = useState<string[]>(["Design"]);

  function toggle(topic: string) {
    setPicked((current) =>
      current.includes(topic)
        ? current.filter((entry) => entry !== topic)
        : [...current, topic],
    );
  }

  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        {TOPICS.map((topic) => (
          <Component
            key={topic}
            value={topic}
            selected={picked.includes(topic)}
            onPress={() => toggle(topic)}
          />
        ))}
      </View>
      <Text
        value={`Picked: ${picked.join(", ") || "nothing"}`}
        type="footnote"
      />
    </View>
  );
};

/** `onClose` is all it takes — the remove button names what it removes. */
export const Removable = () => {
  const styles = useStyles();
  const [people, setPeople] = useState([
    "Ada Lovelace",
    "Grace Hopper",
    "Alan Turing",
  ]);

  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        {people.map((person) => (
          <Component
            key={person}
            value={person}
            onClose={() =>
              setPeople((rest) => rest.filter((p) => p !== person))
            }
          />
        ))}
      </View>
      <Text
        value={people.length === 0 ? "All removed" : `${people.length} left`}
        type="footnote"
      />
    </View>
  );
};

/** Two controls in one pill, each with its own name and its own target. */
export const SelectableAndRemovable = () => {
  const [selected, setSelected] = useState(true);
  const [present, setPresent] = useState(true);

  if (!present) return <Text value="Removed" type="footnote" />;

  return (
    <Component
      value="Unread"
      selected={selected}
      onPress={() => setSelected((current) => !current)}
      onClose={() => setPresent(false)}
    />
  );
};

export const Disabled = () => {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      <Component value="Static" disabled />
      <Component value="Pressable" onPress={() => {}} disabled />
      <Component value="Removable" onClose={() => {}} disabled />
    </View>
  );
};

/** A tag longer than its container truncates rather than overflowing it. */
export const LongLabel = () => (
  <Component
    value="A tag with considerably more text in it than will ever fit"
    onClose={() => {}}
  />
);

const useStyles = createStyles(({ isRTL, spacing }) => ({
  row: {
    flexDirection: isRTL ? "row-reverse" : "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.x8,
  },
  stack: {
    alignSelf: "stretch",
    gap: spacing.x12,
  },
}));

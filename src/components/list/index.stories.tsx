import { useState } from "react";
import { View } from "react-native";

import Card from "@/components/card";
import Divider from "@/components/divider";
import Icon from "@/components/icon";
import Image from "@/components/image";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";

import Component, { type ListItemData } from "./index";

const meta = {
  title: "components/List",
  component: Component,
};

export default meta;

const PEOPLE = Array.from({ length: 60 }, (_, index) => ({
  id: String(index),
  name: `Person ${index + 1}`,
  email: `person${index + 1}@example.com`,
}));

function rows(): ListItemData[] {
  return PEOPLE.map((person) => ({
    key: person.id,
    title: person.name,
    subtitle: person.email,
    right: <Icon name="chevron-right" />,
  }));
}

/**
 * Built in one place rather than spread onto `rows()` afterwards:
 * `ListItemData` is a union (text-or-children, pressable-or-not), and
 * spreading over it widens the array into a union of shapes that no longer
 * matches the default branch — the list then asks for a `renderItem`.
 */
function pressableRows(
  picked: string | undefined,
  onPress: (id: string) => void,
): ListItemData[] {
  return PEOPLE.map((person) => ({
    key: person.id,
    title: person.name,
    subtitle: person.email,
    right: <Icon name="chevron-right" />,
    selected: person.id === picked,
    onPress: () => onPress(person.id),
  }));
}

/** Sixty rows, three mounted views: the default `ListItem` rendering. */
export const Default = () => {
  const styles = useStyles();

  return (
    <View style={styles.stage}>
      <Component data={rows()} />
    </View>
  );
};

export const Pressable = () => {
  const styles = useStyles();
  const [picked, setPicked] = useState<string>();

  return (
    <View style={styles.stage}>
      <Component data={pressableRows(picked, setPicked)} />
      <Text value={`picked: ${picked ?? "none"}`} type="footnote" />
    </View>
  );
};

export const WithHeaderAndSeparators = () => {
  const styles = useStyles();

  return (
    <View style={styles.stage}>
      <Component
        data={rows()}
        ListHeaderComponent={<Text value="People" type="title3" />}
        ItemSeparatorComponent={() => <Divider inset="x16" />}
      />
    </View>
  );
};

export const Empty = () => {
  const styles = useStyles();

  return (
    <View style={styles.stage}>
      <Component
        data={[]}
        ListEmptyComponent={<Text value="Nobody here yet" />}
      />
    </View>
  );
};

/** A renderer of its own: the item type stops looking like a `ListItem`. */
export const CustomRenderItem = () => {
  const styles = useStyles();

  return (
    <View style={styles.stage}>
      <Component
        data={PEOPLE.slice(0, 12).map((person) => ({
          id: person.id,
          photo: `https://picsum.photos/id/${10 + Number(person.id)}/200/200`,
          caption: person.name,
        }))}
        keyExtractor={(item) => item.id}
        estimatedItemSize={72}
        renderItem={({ item }) => (
          <Card>
            <Image
              source={item.photo}
              alt={item.caption}
              style={styles.photo}
            />
            <Text value={item.caption} type="footnote" />
          </Card>
        )}
      />
    </View>
  );
};

const useStyles = createStyles(({ sizes, spacing, radius }) => ({
  stage: {
    alignSelf: "stretch",
    height: sizes.elementHeightLg * 5,
    gap: spacing.x8,
  },
  photo: {
    borderRadius: radius.surface,
    width: "100%",
    height: sizes.elementHeightLg * 2,
  },
}));

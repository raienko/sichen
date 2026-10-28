import { useState } from "react";
import { View } from "react-native";

import Icon from "@/components/icon";

import Component from ".";

const meta = {
  title: "components/Button/IconButton",
  component: Component,
};

export default meta;

const row = { flexDirection: "row", alignItems: "center", gap: 8 } as const;

export function Types() {
  return (
    <View style={row}>
      <Component label="Tertiary">
        <Icon name="star" />
      </Component>
      <Component label="Secondary" type="secondary">
        <Icon name="star" />
      </Component>
      <Component label="Primary" type="primary">
        <Icon name="star" />
      </Component>
    </View>
  );
}

// The glyph scales with the box, so the three read as one family.
export function Sizes() {
  return (
    <View style={row}>
      <Component label="Small" type="secondary" size="small">
        <Icon name="star" />
      </Component>
      <Component label="Medium" type="secondary" size="medium">
        <Icon name="star" />
      </Component>
      <Component label="Large" type="secondary" size="large">
        <Icon name="star" />
      </Component>
    </View>
  );
}

export function Toggle() {
  const [saved, setSaved] = useState(false);

  return (
    <Component
      label={saved ? "Remove from favourites" : "Add to favourites"}
      type="secondary"
      selected={saved}
      onPress={() => setSaved((was) => !was)}
    >
      <Icon name={saved ? "check" : "star"} />
    </Component>
  );
}

export function Disabled() {
  return (
    <View style={row}>
      <Component label="Tertiary" disabled>
        <Icon name="star" />
      </Component>
      <Component label="Primary" type="primary" disabled>
        <Icon name="star" />
      </Component>
    </View>
  );
}

// Any icon set works, including the app's own — the colour and size come
// from the button either way.
export function OtherIconSets() {
  return (
    <View style={row}>
      <Component label="Feather" type="secondary">
        <Icon name="heart" />
      </Component>
      <Component label="Material" type="secondary">
        <Icon type="MaterialIcons" name="alarm" />
      </Component>
      <Component label="Ionicons" type="secondary">
        <Icon type="Ionicons" name="rocket" />
      </Component>
    </View>
  );
}

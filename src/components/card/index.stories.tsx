import { View } from "react-native";

import Image from "@/components/image";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Component from "./index";

const meta = {
  title: "components/Card",
  component: Component,
};

export default meta;

export const Elevated = () => (
  <Component>
    <Text value="Total" type="footnote" />
    <Text value="£42.00" type="title2" />
  </Component>
);

/** The one to reach for on an already-raised surface — see `Filled` below. */
export const Outlined = () => (
  <Component type="outlined">
    <Text value="Outlined" type="headline" />
    <Text value="No fill of its own — just an edge." type="footnote" />
  </Component>
);

export const Filled = () => (
  <Component type="filled">
    <Text value="Filled" type="headline" />
    <Text value="Flat — no shadow, no border." type="footnote" />
  </Component>
);

/**
 * Why `outlined` exists: both filled types use the same token every other
 * raised surface does, so on one of those they disappear.
 */
export const OnARaisedSurface = () => {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View
      style={[
        styles.raised,
        { backgroundColor: theme.colors.backgroundElement },
      ]}
    >
      <Component type="filled">
        <Text value="filled — same colour as the surface" type="footnote" />
      </Component>
      <Component type="outlined">
        <Text value="outlined — still legible" type="footnote" />
      </Component>
    </View>
  );
};

/** The whole card is one button; its name comes from the text inside. */
export const Pressable = () => (
  <Component onPress={() => {}}>
    <Text value="Order #12" type="headline" />
    <Text value="Delivered on Tuesday" type="footnote" />
  </Component>
);

export const Disabled = () => (
  <Component onPress={() => {}} disabled>
    <Text value="Order #12" type="headline" />
  </Component>
);

/** Edge-to-edge content owns its own spacing, and is clipped to the radius. */
export const EdgeToEdge = () => {
  const styles = useStyles();

  return (
    <Component padded={false}>
      <Image
        source="https://picsum.photos/id/1015/600/300"
        alt="A river running through a canyon"
        style={styles.image}
      />
      <View style={styles.caption}>
        <Text value="A river running through a canyon" type="footnote" />
      </View>
    </Component>
  );
};

const useStyles = createStyles(({ spacing, sizes }) => ({
  raised: {
    gap: spacing.x8,
    padding: spacing.x12,
    alignSelf: "stretch",
  },
  image: {
    width: "100%",
    height: sizes.elementWidthLg * 0.5,
  },
  caption: {
    padding: spacing.x12,
  },
}));

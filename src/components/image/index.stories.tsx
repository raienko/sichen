import { View } from "react-native";

import Text from "@/components/text";
import { createStyles } from "@/features/responsive";

import Component from "./index";

const meta = {
  title: "components/Image",
  component: Component,
};

export default meta;

const PHOTO = "https://picsum.photos/id/1015/400/400";
const BROKEN = "https://example.invalid/missing.png";

export const Remote = () => {
  const styles = useStyles();

  return (
    <Component
      source={PHOTO}
      alt="A river running through a canyon"
      style={styles.image}
    />
  );
};

/** No source at all — the themed placeholder, correct in both schemes. */
export const Missing = () => {
  const styles = useStyles();

  return <Component source={null} alt="Nothing to show" style={styles.image} />;
};

/** A URL that will never resolve, so the load fails and the fallback takes over. */
export const Failed = () => {
  const styles = useStyles();

  return (
    <Component
      source={BROKEN}
      alt="A photo that won't load"
      style={styles.image}
    />
  );
};

/** A caller's own fallback image instead of the themed placeholder. */
export const CustomFallback = () => {
  const styles = useStyles();

  return (
    <Component
      source={BROKEN}
      fallback={PHOTO}
      alt="A photo, with a stand-in when it fails"
      style={styles.image}
    />
  );
};

/** Hidden from screen readers — nothing here they'd need to hear about. */
export const Decorative = () => {
  const styles = useStyles();

  return (
    <View style={styles.column}>
      <Component source={PHOTO} decorative style={styles.image} />
      <Text value="The image above is decoration; this line carries the meaning." />
    </View>
  );
};

const useStyles = createStyles(({ spacing, sizes, radius }) => ({
  column: {
    gap: spacing.x8,
  },
  image: {
    borderRadius: radius.surface,
    width: sizes.elementWidthLg,
    height: sizes.elementWidthLg,
  },
}));

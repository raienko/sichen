import { useState } from "react";

import Image from "@/components/image";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";

import Component from "./index";

const meta = {
  title: "components/ImagePicker",
  component: Component,
};

export default meta;

export const Default = () => {
  const styles = useStyles();
  const [uri, setUri] = useState<string>();

  return (
    <>
      <Component
        id="story-image-picker"
        accessibilityLabel="Choose an image"
        style={styles.trigger}
        onChange={(image) => setUri(image.uri)}
      >
        <Text value="Choose an image" type="headline" />
      </Component>
      {uri ? (
        <Image source={uri} alt="Selected image preview" style={styles.image} />
      ) : null}
    </>
  );
};

const useStyles = createStyles(({ spacing, sizes, units, radius }) => ({
  trigger: {
    borderRadius: radius.surface,
    minHeight: sizes.elementHeightMd,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: spacing.x1,
    paddingHorizontal: spacing.x16,
    paddingVertical: spacing.x8,
  },
  image: {
    borderRadius: radius.surface,
    width: units(240),
    aspectRatio: 1,
  },
}));

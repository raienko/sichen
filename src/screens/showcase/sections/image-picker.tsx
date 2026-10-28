import { useState } from "react";
import type { ImagePickerAsset } from "expo-image-picker";
import { View } from "react-native";

import Button from "@/components/button";
import Icon from "@/components/icon";
import If from "@/components/if";
import Image from "@/components/image";
import ImagePicker from "@/components/image-picker";
import Text from "@/components/text";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { isWeb } from "@/utils";

import Readout from "./readout";

const PICKER_ID = "showcase-image-picker";

/** Pressable and static entry points sharing one picker. */
export default function ImagePickerSection() {
  const [image, setImage] = useState<ImagePickerAsset>();
  const theme = useTheme();
  const { spacing } = useSizes();
  const styles = useStyles();

  const fileName = image?.fileName ?? (image ? "selected image" : "none");
  const dimensions = image ? `${image.width} × ${image.height}` : "—";

  return (
    <View style={styles.container}>
      <Text
        value={
          isWeb
            ? "Tap the preview or use the static API. On web both go straight to the file dialog — there is no camera to offer, so a chooser would be picking between one option and a copy of it."
            : "Tap the preview or use the static API. Both open the same camera/gallery bottom sheet."
        }
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <ImagePicker
        id={PICKER_ID}
        accessibilityLabel={
          image ? "Replace selected image" : "Choose an image"
        }
        style={[styles.trigger, { borderColor: theme.colors.border }]}
        onChange={setImage}
      >
        {image ? (
          <Image
            source={image.uri}
            contentFit="cover"
            alt="Selected image preview"
            style={styles.image}
          />
        ) : (
          <View style={styles.placeholder}>
            <Icon
              name="image"
              size={spacing.x32}
              color={theme.colors.textSecondary}
            />
            <Text
              value={
                isWeb ? "Choose an image" : "Choose from camera or gallery"
              }
              type="callout"
            />
          </View>
        )}
      </ImagePicker>

      <View style={styles.actions}>
        <Button
          value="Open with ImagePicker.show"
          onPress={() => void ImagePicker.show(PICKER_ID)}
        />
        <If condition={image}>
          <Button
            value="Clear"
            type="tertiary"
            onPress={() => setImage(undefined)}
          />
        </If>
      </View>

      <Readout label="file" value={fileName} />
      <Readout label="dimensions" value={dimensions} />
    </View>
  );
}

const useStyles = createStyles(({ spacing, units, radius }) => ({
  container: {
    gap: spacing.x12,
  },
  trigger: {
    borderRadius: radius.surface,
    alignSelf: "stretch",
    minHeight: units(180),
    overflow: "hidden",
    borderWidth: spacing.x1,
    borderStyle: "dashed",
  },
  placeholder: {
    flex: 1,
    minHeight: units(180),
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.x8,
    padding: spacing.x16,
  },
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.x8,
  },
}));

import { useState } from "react";
import { Pressable, View } from "react-native";

import Image from "@/components/image";
import ImageViewer, { type ImageViewerItem } from "@/components/image-viewer";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

const ALBUM: ImageViewerItem[] = [
  {
    id: 1015,
    alt: "River valley under a clear sky",
    caption: "The valley at noon",
  },
  { id: 1025, alt: "A pug wrapped in a blanket" },
  {
    id: 1039,
    alt: "Waterfall in a forest",
    caption: "Long exposure, two seconds",
  },
  { id: 1043, alt: "Coastal cliffs at sunset" },
  { id: 1050, alt: "Lighthouse on rocks" },
].map(({ id, alt, caption }) => ({
  source: `https://picsum.photos/id/${id}/1600/1067`,
  thumbnail: `https://picsum.photos/id/${id}/160/160`,
  alt,
  caption,
}));

/** Thumbnails that open the full-screen viewer at their own picture. */
export default function ImageViewerSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [viewed, setViewed] = useState<number>();

  return (
    <View style={styles.container}>
      <Text
        value="Tap a picture. Pinch or double-tap to zoom, drag a zoomed picture around, swipe across to page and down to close. A single tap hides the controls."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />
      <View style={styles.grid}>
        {ALBUM.map((item, index) => (
          <Pressable
            key={index}
            accessibilityRole="button"
            accessibilityLabel={item.alt}
            onPress={() => void ImageViewer.show("showcase-album", index)}
          >
            <Image
              source={item.thumbnail ?? item.source}
              alt={item.alt}
              style={styles.thumb}
            />
          </Pressable>
        ))}
      </View>
      <Readout
        label="last viewed"
        value={viewed === undefined ? "—" : String(viewed + 1)}
      />
      <ImageViewer
        id="showcase-album"
        images={ALBUM}
        onIndexChange={setViewed}
      />
    </View>
  );
}

const useStyles = createStyles(({ spacing, units }) => ({
  container: {
    gap: spacing.x12,
    alignItems: "stretch",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.x8,
  },
  thumb: {
    width: units(96),
    height: units(96),
  },
}));

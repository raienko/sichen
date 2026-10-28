import { Pressable, View } from "react-native";

import Image from "@/components/image";
import { createStyles } from "@/features/responsive";

import Component, { type ImageViewerItem } from "./index";

const meta = {
  title: "components/ImageViewer",
  component: Component,
};

export default meta;

const photo = (id: number, width = 1600, height = 1067) =>
  `https://picsum.photos/id/${id}/${width}/${height}`;
const thumb = (id: number) => `https://picsum.photos/id/${id}/160/160`;

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
  { id: 1043, alt: "Coastal cliffs at sunset", tall: true },
  { id: 1050, alt: "Lighthouse on rocks" },
].map(({ id, alt, caption, tall }) => ({
  source: tall ? photo(id, 1067, 1600) : photo(id),
  thumbnail: thumb(id),
  alt,
  caption,
}));

/** A row of thumbnails, each opening the viewer at its own picture. */
function Gallery({ id, images }: { id: string; images: ImageViewerItem[] }) {
  const styles = useStyles();
  return (
    <View style={styles.grid}>
      {images.map((item, index) => (
        <Pressable
          key={index}
          accessibilityRole="button"
          accessibilityLabel={item.alt}
          onPress={() => void Component.show(id, index)}
        >
          <Image
            source={item.thumbnail ?? item.source}
            alt={item.alt}
            style={styles.thumb}
          />
        </Pressable>
      ))}
      <Component id={id} images={images} />
    </View>
  );
}

export const Album = () => <Gallery id="story-album" images={ALBUM} />;

export const SinglePicture = () => (
  <Gallery id="story-single" images={[ALBUM[0]!]} />
);

const useStyles = createStyles(({ spacing, units }) => ({
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

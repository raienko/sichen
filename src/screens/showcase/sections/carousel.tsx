import { useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Carousel from "@/components/carousel";
import Image from "@/components/image";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

const PHOTOS = [
  { id: "1015", caption: "A river running through a canyon" },
  { id: "1025", caption: "A pug wrapped in a blanket" },
  { id: "1039", caption: "A waterfall seen from above" },
  { id: "1043", caption: "A forest road in the fog" },
];

/**
 * The wrapper's two additions over the library: pagination you can switch
 * off, and the accessibility a pan-gesture widget can't have on its own.
 */
export default function CarouselSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [hasPagination, setHasPagination] = useState(true);
  const [loop, setLoop] = useState(true);
  const [autoplay, setAutoplay] = useState(false);
  const [index, setIndex] = useState(0);

  return (
    <View style={styles.container}>
      <Text
        value="A pan gesture is unreachable by a screen reader, so the region announces itself as adjustable — swipe up or down to change slides — and the dots are real buttons that jump straight to one."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <View style={styles.actions}>
        <Button
          value={hasPagination ? "hasPagination: on" : "hasPagination: off"}
          size="small"
          selected={hasPagination}
          onPress={() => setHasPagination((current) => !current)}
        />
        <Button
          value={loop ? "loop: on" : "loop: off"}
          size="small"
          selected={loop}
          onPress={() => setLoop((current) => !current)}
        />
        <Button
          value={autoplay ? "autoplay: on" : "autoplay: off"}
          size="small"
          selected={autoplay}
          onPress={() => setAutoplay((current) => !current)}
        />
      </View>

      <Carousel
        data={PHOTOS}
        label="Trip photos"
        // Without this the region and the dots would announce only
        // "slide 2 of 4", with nothing about what's on the slide.
        slideLabel={(photo) => photo.caption}
        keyExtractor={(photo) => photo.id}
        hasPagination={hasPagination}
        loop={loop}
        autoplay={autoplay}
        autoplayInterval={2500}
        onChange={setIndex}
        renderItem={({ item }) => (
          <Image
            source={`https://picsum.photos/id/${item.id}/600/400`}
            alt={item.caption}
            style={styles.photo}
          />
        )}
        style={styles.carousel}
      />

      <Readout label="current slide" value={String(index + 1)} />
      <Readout
        label="announced"
        value={`${PHOTOS[index].caption}, Slide ${index + 1} of ${PHOTOS.length}`}
      />
    </View>
  );
}

const useStyles = createStyles(({ spacing, sizes, radius }) => ({
  container: {
    gap: spacing.x8,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.x8,
  },
  // The carousel has to be told its height — see the note on `style` in
  // the component. The dots live inside this box too, hence the extra
  // step beyond the photo's own height.
  carousel: {
    width: "100%",
    height: sizes.elementWidthLg * 0.6 + spacing.x20,
  },
  photo: {
    borderRadius: radius.surface,
    width: "100%",
    height: "100%",
  },
}));

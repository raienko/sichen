import { View } from "react-native";

import Image from "@/components/image";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Component from "./index";

const meta = {
  title: "components/Carousel",
  component: Component,
};

export default meta;

const PHOTOS = [
  { id: "1015", caption: "A river running through a canyon" },
  { id: "1025", caption: "A pug wrapped in a blanket" },
  { id: "1039", caption: "A waterfall seen from above" },
];

function Photo({ id, caption }: { id: string; caption: string }) {
  const styles = useStyles();

  return (
    <Image
      source={`https://picsum.photos/id/${id}/600/400`}
      alt={caption}
      style={styles.photo}
    />
  );
}

export const Default = () => {
  const styles = useStyles();

  return (
    <View style={styles.stage}>
      <Component
        data={PHOTOS}
        label="Trip photos"
        slideLabel={(photo) => photo.caption}
        keyExtractor={(photo) => photo.id}
        renderItem={({ item }) => <Photo {...item} />}
        style={styles.carousel}
      />
    </View>
  );
};

/** Dots off — for a carousel whose slides already say where you are. */
export const WithoutPagination = () => {
  const styles = useStyles();

  return (
    <View style={styles.stage}>
      <Component
        data={PHOTOS}
        label="Trip photos"
        hasPagination={false}
        slideLabel={(photo) => photo.caption}
        keyExtractor={(photo) => photo.id}
        renderItem={({ item }) => <Photo {...item} />}
        style={styles.carousel}
      />
    </View>
  );
};

export const Looping = () => {
  const styles = useStyles();

  return (
    <View style={styles.stage}>
      <Component
        data={PHOTOS}
        label="Trip photos"
        loop
        autoplay
        autoplayInterval={2500}
        slideLabel={(photo) => photo.caption}
        keyExtractor={(photo) => photo.id}
        renderItem={({ item }) => <Photo {...item} />}
        style={styles.carousel}
      />
    </View>
  );
};

/** Anything can be a slide — the library only owns the motion. */
export const Cards = () => {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.stage}>
      <Component
        data={["First", "Second", "Third"]}
        label="Onboarding"
        layout={{ type: "parallax" }}
        slideLabel={(step) => step}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.backgroundElement },
            ]}
          >
            <Text value={item} type="title2" />
          </View>
        )}
        style={styles.carousel}
      />
    </View>
  );
};

const useStyles = createStyles(({ spacing, sizes, radius }) => ({
  stage: {
    width: "100%",
    maxWidth: sizes.elementWidthLg,
  },
  carousel: {
    width: "100%",
    height: sizes.elementWidthLg * 0.66 + spacing.x20,
  },
  photo: {
    borderRadius: radius.surface,
    width: "100%",
    height: "100%",
  },
  card: {
    borderRadius: radius.surface,
    flex: 1,
    margin: spacing.x8,
    alignItems: "center",
    justifyContent: "center",
  },
}));

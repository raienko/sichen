import { useState } from "react";
import { View } from "react-native";

import Button from "@/components/button";
import Image from "@/components/image";
import Text from "@/components/text";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Readout from "./readout";

const PHOTO = "https://picsum.photos/id/1015/400/400";
const OTHER = "https://picsum.photos/id/1025/400/400";
const BROKEN = "https://example.invalid/missing.png";

type Case = {
  label: string;
  source: string | null;
  fallback?: string;
};

/**
 * The four states worth seeing side by side. `""` isn't contrived — it's
 * what a record with no picture looks like straight out of an API, and the
 * one case a plain `expo-image` would sit on forever loading nothing.
 */
const CASES: Case[] = [
  { label: "loads", source: PHOTO },
  { label: "empty source", source: "" },
  { label: "fails", source: BROKEN },
  { label: "fails, own fallback", source: BROKEN, fallback: OTHER },
];

/** A wrapper over expo-image: a fallback, accessibility, and cache controls. */
export default function ImagesSection() {
  const theme = useTheme();
  const styles = useStyles();
  const [preloaded, setPreloaded] = useState("—");
  const [cleared, setCleared] = useState("—");

  const preload = async () => {
    setPreloaded("…");
    const ok = await Image.preload([PHOTO, OTHER]);
    setPreloaded(ok ? "cached" : "failed");
  };

  const clear = async () => {
    setCleared("…");
    const ok = await Image.cacheClear();
    // `false` on web, which has no cache of expo-image's own to clear —
    // that's "nothing was cleared", not "something broke".
    setCleared(ok ? "cleared" : "nothing to clear");
  };

  return (
    <View style={styles.container}>
      <Text
        value="Every image falls back to a themed placeholder when its source is missing or fails, and has to be either described or explicitly marked decorative."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />

      <View style={styles.row}>
        {CASES.map(({ label, source, fallback }) => (
          <View key={label} style={styles.item}>
            <Image
              source={source}
              fallback={fallback}
              alt={`Example: ${label}`}
              style={styles.image}
              transition={200}
            />
            <Text value={label} type="caption2" />
          </View>
        ))}
      </View>

      <Text value="Decorative" type="headline" />
      <Text
        value="The image below is hidden from screen readers — this sentence carries the meaning instead."
        type="footnote"
        style={{ color: theme.colors.textSecondary }}
      />
      <Image source={OTHER} decorative style={styles.wide} transition={200} />

      <Text value="Cache" type="headline" />
      <Button value="preload both photos" onPress={() => void preload()} />
      <Readout label="Image.preload()" value={preloaded} />
      <Button value="clear the image cache" onPress={() => void clear()} />
      <Readout label="Image.cacheClear()" value={cleared} />
    </View>
  );
}

const useStyles = createStyles(({ spacing, sizes, radius }) => ({
  container: {
    gap: spacing.x8,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.x12,
  },
  item: {
    gap: spacing.x4,
    alignItems: "center",
  },
  image: {
    borderRadius: radius.surface,
    width: sizes.elementHeightLg * 2,
    height: sizes.elementHeightLg * 2,
  },
  wide: {
    borderRadius: radius.surface,
    width: "100%",
    height: sizes.elementHeightLg * 2,
  },
}));

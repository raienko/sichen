import type { ReactNode } from "react";
import { View } from "react-native";

import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { testId } from "@/utils";

import MapCallout from "./callout";
import type { MapMarker, MapProps } from "./types";

/** Tall enough to see a neighbourhood, short enough to sit in a scrolling page. */
export const DEFAULT_HEIGHT = 320;

/**
 * Everything around the map engine: the sized, clipped box, the name a
 * screen reader hears for it, and the selected place's card. Both
 * renderers draw the map inside this, so none of it is written twice.
 */
export default function MapFrame({
  label,
  height = DEFAULT_HEIGHT,
  style,
  testID,
  selected,
  onCalloutHeight,
  children,
}: Pick<MapProps, "label" | "height" | "style" | "testID"> & {
  selected?: MapMarker;
  onCalloutHeight?: (height: number) => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View
      testID={testID}
      // A named group rather than one accessible element: the pins inside
      // are buttons, and making the container itself accessible would hide
      // them on iOS.
      role="group"
      aria-label={label}
      accessibilityLabel={label}
      style={[
        styles.frame,
        { height, borderColor: theme.colors.divider },
        style,
      ]}
    >
      {children}
      <MapCallout
        marker={selected}
        onHeight={onCalloutHeight}
        testID={testId(testID, "callout")}
      />
    </View>
  );
}

const useStyles = createStyles(({ spacing, radius }) => ({
  frame: {
    alignSelf: "stretch",
    overflow: "hidden",
    borderWidth: spacing.x1,
    borderRadius: radius.surface,
  },
}));

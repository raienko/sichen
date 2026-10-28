import { View } from "react-native";

import Image from "@/components/image";

import { artworkFromChildren } from "./source";

describe("artworkFromChildren", () => {
  // The point of it: the two ways of saying the same thing render the same
  // thing, rather than one lighting up its shapes and the other dimming.
  it("finds the source behind a lone Image child", () => {
    expect(
      artworkFromChildren(<Image source="https://example.com/a.png" alt="" />),
    ).toEqual({ source: "https://example.com/a.png", contentFit: undefined });
  });

  it("carries the child's own contentFit with it", () => {
    expect(
      artworkFromChildren(
        <Image source={7 as never} alt="" contentFit="contain" />,
      ),
    ).toEqual({ source: 7, contentFit: "contain" });
  });

  it("declines an Image with nothing to draw", () => {
    expect(artworkFromChildren(<Image decorative />)).toBeUndefined();
  });

  // Reaching further into a caller's tree would make the effect depend on
  // layers they didn't write — the limit `withIconDefaults` puts on itself.
  it("declines anything that isn't a lone Image", () => {
    expect(artworkFromChildren(<View />)).toBeUndefined();
    expect(
      artworkFromChildren(
        <View>
          <Image source="https://example.com/a.png" alt="" />
        </View>,
      ),
    ).toBeUndefined();
    expect(
      artworkFromChildren(
        <>
          <Image source="https://example.com/a.png" alt="" />
          <View />
        </>,
      ),
    ).toBeUndefined();
    expect(artworkFromChildren(null)).toBeUndefined();
    expect(artworkFromChildren("text")).toBeUndefined();
  });
});

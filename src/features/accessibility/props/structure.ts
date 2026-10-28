import type { AccessibilityProps } from "react-native";

/**
 * Props for document structure and presentation: headings, meaningful
 * images, and purely visual nodes that should be hidden.
 */

/** `<h1>`–`<h6>`, in document-outline terms. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type HeadingProps = AccessibilityProps & { "aria-level"?: HeadingLevel };

/**
 * Marks text as a heading at a given level, so screen-reader users can
 * navigate the screen by structure (VoiceOver's rotor, TalkBack's heading
 * navigation) instead of reading it top to bottom. Without this a visually
 * obvious title is, to a screen reader, indistinguishable from body text.
 *
 * Three spellings, because no single one covers both platforms:
 * `accessibilityRole="header"` is what native reads; `role="heading"` is
 * what react-native-web turns into a real `<h1>`–`<h6>` element; and
 * `aria-level` is how it picks *which* one. That last prop isn't in RN's
 * `TextProps`/`ViewProps` typings at all — hence the wider return type —
 * but omitting it doesn't degrade gracefully: react-native-web falls back
 * to `<h1>` for every heading, flattening the outline it exists to convey.
 * Native ignores it and takes the level from context.
 */
export function headingA11yProps(level: HeadingLevel): HeadingProps {
  return {
    accessibilityRole: "header",
    role: "heading",
    "aria-level": level,
  };
}

type ImageOptions = {
  /**
   * What the image conveys, in words — not "photo of" or the file's name.
   * An image with nothing to convey isn't described, it's hidden: use
   * `disabledA11yProps()` below instead.
   */
  label: string;
};

/**
 * The accessibility props for an image that carries meaning. An image is
 * the one control-shaped thing with no text of its own to derive a name
 * from, so an undescribed one is announced as an anonymous element that a
 * screen-reader user can neither read nor skip past knowingly.
 *
 * `accessible: true` is deliberate rather than redundant: `expo-image`
 * defaults it to `false`, so an image left alone isn't an accessibility
 * element on iOS or Android at all. `accessibilityRole="image"` is what
 * native announces and `role="img"` is what react-native-web renders — the
 * same two-spelling split as everything else here.
 *
 * Callers should also pass the label to `expo-image`'s own `alt`, which is
 * what puts it in the DOM's `alt` attribute for web crawlers and link
 * traversal — see `Image`.
 */
export function imageA11yProps({ label }: ImageOptions): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: "image",
    role: "img",
    accessibilityLabel: label,
  };
}

/**
 * The accessibility props for something that exists only visually and has
 * nothing to say — a `Spacer`, a decorative rule, an icon sitting beside a
 * label that already names it. Without them a purely presentational node
 * still becomes a stop a screen-reader user has to swipe past, announced as
 * an empty element.
 *
 * Four spellings, and as with the rest of this file no single one covers
 * every platform: `accessible: false` keeps it from becoming an element in
 * the first place, `accessibilityElementsHidden` hides it *and its
 * descendants* on iOS, `importantForAccessibility="no-hide-descendants"` is
 * Android's equivalent, and `aria-hidden` is what react-native-web turns
 * into the real DOM attribute. Setting only one leaves it announced on
 * whichever platforms the others cover.
 *
 * @example
 * <View {...disabledA11yProps()} style={{ height: 16 }} />
 */
export function disabledA11yProps(): AccessibilityProps {
  return {
    accessible: false,
    accessibilityElementsHidden: true,
    importantForAccessibility: "no-hide-descendants",
    "aria-hidden": true,
  };
}

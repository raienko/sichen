import { useState } from "react";
import type { StyleProp } from "react-native";
import {
  Image as ExpoImage,
  type ImageErrorEventData,
  type ImageProps as ExpoImageProps,
  type ImageStyle,
} from "expo-image";

import { disabledA11yProps, imageA11yProps } from "@/features/accessibility";
import logger from "@/features/logger";
import { testId } from "@/utils";

import ImageFallback from "./fallback";

export type ImageSourceProp = ExpoImageProps["source"];

/**
 * Which caches `Image.cacheClear()` empties. `"all"` is both, and the
 * default — a caller reaching for this generally means "forget everything
 * you downloaded", and remembering that expo-image keeps two separate
 * caches shouldn't be a precondition for getting that.
 */
export type ImageCacheTarget = "memory" | "disk" | "all";

/**
 * A source is "empty" when there is nothing to load from it. `null` and
 * `undefined` are the obvious cases; `""` is the one worth naming, because
 * it's what a value straight out of an API looks like when the record has
 * no picture, and `<Image source="" />` would otherwise sit there loading
 * nothing forever instead of falling back.
 */
function isEmptySource(source: ImageSourceProp): boolean {
  if (source === null || source === undefined) return true;
  if (typeof source === "string") return source.trim() === "";
  if (Array.isArray(source)) return source.length === 0;
  return false;
}

/**
 * A stable string for whichever shape `source` arrived in, used to tell
 * "this source failed" from "a different source is being tried now".
 *
 * A key rather than a `useEffect` that resets a `failed` flag: a call site
 * passing an object literal (`source={{ uri }}`) makes a new object every
 * render, so an identity-keyed effect would clear the flag immediately
 * after each error and re-render into the same failing load forever. A
 * value-derived key changes only when the source actually does.
 */
function sourceKey(source: ImageSourceProp): string {
  if (source === null || source === undefined) return "";
  if (typeof source === "string" || typeof source === "number")
    return String(source);
  if (Array.isArray(source)) return source.map(sourceKey).join("|");
  if (typeof source === "object" && "uri" in source && source.uri)
    return String(source.uri);

  try {
    return JSON.stringify(source) ?? "";
  } catch {
    // A SharedRef (expo-image's own decoded-image handle) isn't
    // serializable. It also can't be re-created per render the way a
    // literal can, so its identity is already stable enough to key on.
    return "";
  }
}

/**
 * An image either says something or it doesn't, and the two need opposite
 * accessibility treatment — a name, or removal from the accessibility tree
 * entirely. Expressed as a union rather than two optional props so an
 * undescribed image is a `tsc` error, the same way `Button` makes an
 * unnamed icon button one: an image with neither is announced as an
 * anonymous element a screen-reader user can't read or knowingly skip.
 */
type DescriptionProps =
  | {
      /**
       * What the image conveys, in words. Also becomes the `alt` attribute
       * on web, for crawlers and link traversal.
       */
      alt: string;
      decorative?: never;
    }
  | {
      alt?: never;
      /**
       * The image adds nothing a screen-reader user needs — a background
       * texture, a divider flourish, an illustration beside text that
       * already says the same thing. Hides it on every platform at once.
       */
      decorative: true;
    };

type Props = Omit<
  ExpoImageProps,
  | "alt"
  | "accessible"
  | "accessibilityLabel"
  | "accessibilityRole"
  | "role"
  | "aria-hidden"
  | "accessibilityElementsHidden"
  | "importantForAccessibility"
  | "style"
> &
  DescriptionProps & {
    /**
     * Shown when `source` is missing (`null`, `undefined`, `""`, `[]`) or
     * fails to load. Defaults to a themed placeholder that's correct in
     * both colour schemes — see ./fallback.tsx. Pass an image source of
     * your own (a default avatar, a branded product shot) to show that
     * instead, or `null` to render nothing at all.
     */
    fallback?: ImageSourceProp | null;
    style?: StyleProp<ImageStyle>;
  };

/**
 * `expo-image` with the three things every call site would otherwise repeat:
 * a fallback for when there's nothing to show, accessibility that can't be
 * forgotten, and the cache controls it exposes as loose module functions.
 *
 * Everything else is `expo-image`'s own API, passed straight through —
 * `contentFit`, `transition`, `cachePolicy`, `placeholder`, `priority`, the
 * load callbacks. This is a wrapper, not a redesign; the only props it
 * takes away are the accessibility ones it owns (see `DescriptionProps`).
 *
 * `placeholder` and `fallback` are not the same thing and both are worth
 * having: a placeholder is what `expo-image` shows *while* the real image
 * loads, and disappears when it arrives. A fallback is what's shown when
 * the real image is never going to arrive.
 *
 * @example
 * <Image source={user.avatarUrl} alt={`${user.name}'s avatar`} style={styles.avatar} />
 * @example
 * <Image source={require("...")} decorative style={styles.texture} />
 * @example
 * // preloading and cache control, from anywhere — no instance needed:
 * await Image.preload(urls);
 * await Image.cacheClear();
 */
function ImageComponent({
  source,
  fallback,
  alt,
  decorative,
  style,
  onError,
  // Browsers make every <img> a native HTML5 drag source, and starting one
  // cancels the pointer stream any gesture is reading — so an image inside
  // a `Carousel`, a swipeable row or a draggable sheet silently kills the
  // drag the moment the pointer moves. (Observed as a pan that fires
  // `begin` then `end` with a translation of 0, right after the browser's
  // own `dragstart`.) Native has no equivalent concept, so defaulting this
  // off is also what makes web behave the way the other platforms already
  // do. Pass `draggable` to opt back in.
  draggable = false,
  testID = "image",
  ...props
}: Props) {
  const key = sourceKey(source);
  const [failedKey, setFailedKey] = useState<string | null>(null);

  // Comparing keys rather than holding a boolean is what makes a new
  // `source` recover on its own: a different key is, by definition, not the
  // one that failed.
  const failed = failedKey !== null && failedKey === key;
  const showFallback = failed || isEmptySource(source);

  // The label stays on the fallback too. The image is gone, but what it was
  // *for* is still what the user needs to know about that spot — dropping
  // the description would make the whole thing silently vanish from the
  // accessibility tree rather than announce that something is missing.
  const a11yProps = decorative
    ? disabledA11yProps()
    : imageA11yProps({ label: alt as string });

  const handleError = (event: ImageErrorEventData) => {
    logger.failed(`Unable to load image "${key}"`, event.error);
    setFailedKey(key);
    onError?.(event);
  };

  if (showFallback && (fallback === undefined || fallback === null)) {
    // `null` means "show nothing", which still has to occupy the layout box
    // the image would have — so the same styled, empty View, just without
    // the placeholder frame ImageFallback draws.
    return fallback === null ? null : (
      <ImageFallback
        style={style}
        a11yProps={a11yProps}
        testID={testId(testID, "fallback")}
      />
    );
  }

  return (
    <ExpoImage
      testID={testID}
      {...props}
      {...a11yProps}
      // expo-image's own prop, separate from accessibilityLabel: this is
      // what lands in the DOM's `alt` attribute on web.
      alt={alt}
      draggable={draggable}
      source={showFallback ? fallback : source}
      style={style}
      // A failing fallback would otherwise loop: error -> setFailedKey ->
      // render the fallback -> error again. Once we're already showing it
      // there's nothing further to fall back to, so the handler comes off.
      onError={showFallback ? onError : handleError}
    />
  );
}

type ImageStatic = {
  /** See the note below — set explicitly because the alias erases `.name`. */
  displayName: string;
  preload: (
    urls: string | string[],
    options?: Parameters<typeof ExpoImage.prefetch>[1],
  ) => Promise<boolean>;
  cacheClear: (target?: ImageCacheTarget) => Promise<boolean>;
};

const Image = ImageComponent as typeof ImageComponent & ImageStatic;

// The component is declared as `ImageComponent` so the statics can be
// attached to a differently-typed alias, which leaves `.name` reading
// "ImageComponent" — set explicitly so `describe(`${Component.displayName}
// smoke test`, ...)` matches every other component here. Same reason Modal
// sets one.
Image.displayName = "Image";

/**
 * Warms the cache for images that are about to be needed — the next page of
 * a feed, the photos behind a screen the user is one tap away from — so
 * they're already on disk when something renders them.
 *
 * Only remote URLs benefit: a `require()`d asset is in the bundle already.
 * Resolves `false` if *any* URL fails, which is why nothing here treats the
 * result as fatal — a warm cache is an optimization, and a failed preload
 * just means the image is fetched later, at render, as it would have been
 * anyway.
 */
Image.preload = async (urls, options) => {
  try {
    return await ExpoImage.prefetch(urls, options);
  } catch (error) {
    logger.failed("Unable to preload images", error);
    return false;
  }
};

/**
 * Empties expo-image's caches — after a sign-out, when images are
 * user-scoped, or from a "clear cached data" setting.
 *
 * Both caches by default; `"memory"` or `"disk"` narrows it. Resolves
 * `false` on web (which has no cache of expo-image's own to clear, and says
 * so) and on Android when the activity is gone, so a `false` here is
 * "nothing was cleared", not "something broke".
 */
Image.cacheClear = async (target: ImageCacheTarget = "all") => {
  try {
    const cleared = await Promise.all([
      target === "disk" ? true : ExpoImage.clearMemoryCache(),
      target === "memory" ? true : ExpoImage.clearDiskCache(),
    ]);

    return cleared.every(Boolean);
  } catch (error) {
    logger.failed(`Unable to clear the ${target} image cache`, error);
    return false;
  }
};

export default Image;

export type { ImageProps } from "expo-image";

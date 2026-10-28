import { Children, isValidElement, type ReactNode } from "react";

import Image, {
  type ImageProps,
  type ImageSourceProp,
} from "@/components/image";

/**
 * The artwork behind a lone `<Image>` child, if that is what the children
 * are.
 *
 * This exists so the two ways of saying the same thing render the same
 * thing: `<Skeleton source={x} />` and `<Skeleton><Image source={x} /></Skeleton>`
 * are the same placeholder, and it would be a poor surprise for one of them
 * to light up inside its shapes and the other to dim as a whole. Anything
 * else — an SVG component, several elements, a tree — has no source to
 * find and dims as a whole.
 *
 * Only a *direct, only* child is inspected, and only when it is this app's
 * own `Image`. Reaching further into a caller's tree would make the effect
 * depend on layers they did not write; the same limit `withIconDefaults`
 * puts on which children it will touch.
 */
export function artworkFromChildren(
  children: ReactNode,
): { source: ImageSourceProp; contentFit?: string } | undefined {
  const elements = Children.toArray(children).filter(isValidElement);
  if (elements.length !== 1) return undefined;

  const [only] = elements;
  if (only.type !== Image) return undefined;

  const { source, contentFit } = only.props as Pick<
    ImageProps,
    "source" | "contentFit"
  >;
  return source === undefined ? undefined : { source, contentFit };
}

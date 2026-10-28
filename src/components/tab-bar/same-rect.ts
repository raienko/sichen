import type { LayoutRectangle } from "react-native";

/** Whether a measured layout is the one already known, so it can be ignored. */
export default function sameRect(
  a: LayoutRectangle | undefined,
  b: LayoutRectangle,
): boolean {
  return (
    a !== undefined &&
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height
  );
}

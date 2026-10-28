import type { ReactNode } from "react";

type Props = {
  /**
   * Rendered when truthy, so an optional value can be passed as is —
   * `condition={footer}` rather than `condition={footer !== undefined}`.
   * Mind the falsy values that are still something: `0` and `""` hide the
   * children, so compare explicitly when those can occur.
   */
  condition: unknown;
  children: ReactNode;
};

/**
 * Renders `children` when `condition` is true, otherwise nothing — a plain
 * function returning `children` directly, so it adds no host element of its
 * own (unlike wrapping the condition in a <View>, which would introduce a
 * layout node that isn't there in `condition ? <X /> : null`).
 *
 * @example <If condition={config.backdrop}><ModalBackdrop ... /></If>
 */
export default function If({ condition, children }: Props): ReactNode {
  return condition ? children : null;
}

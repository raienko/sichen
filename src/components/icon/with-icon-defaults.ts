import {
  Children,
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";

import Icon from "./icon";

type IconProps = ComponentProps<typeof Icon>;

type Defaults = {
  color?: IconProps["color"];
  size?: IconProps["size"];
};

/**
 * Fills in colour and size on any `Icon` passed as a direct child, so a
 * surface that already knows its own foreground doesn't make every call site
 * repeat it. An icon's own props win — these are defaults, not overrides.
 *
 * Only direct `Icon` children are touched: cloning whatever happens to be
 * there would push a `color` onto a `View` that has no use for one.
 */
export default function withIconDefaults(
  children: ReactNode,
  { color, size }: Defaults,
): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement(child) || child.type !== Icon) return child;

    const icon = child as ReactElement<IconProps>;
    return cloneElement(icon, {
      color: icon.props.color ?? color,
      size: icon.props.size ?? size,
    });
  });
}

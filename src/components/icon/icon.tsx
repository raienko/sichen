import type { ColorValue } from "react-native";

import { useTheme } from "@/features/theme";

import { CUSTOM_ICONS, type CustomIconName } from "./custom-icons";
import { ICON_SETS, type IconNameByType, type IconSetType } from "./icon-sets";

/**
 * Which react-native-vector-icons family <Icon name="..." /> uses when
 * `type` is omitted. Change it here — nowhere else needs to change.
 */
const DEFAULT_ICON_TYPE: IconSetType = "Feather";

type CommonProps = {
  size?: number;
  color?: ColorValue;
};

type VectorIconProps = {
  [T in IconSetType]: { type: T; name: IconNameByType[T] };
}[IconSetType];

type CustomTypeProps = {
  type: "custom";
  name: CustomIconName;
};

type DefaultTypeProps = {
  type?: typeof DEFAULT_ICON_TYPE;
  name: IconNameByType[typeof DEFAULT_ICON_TYPE];
};

type Props = (VectorIconProps | CustomTypeProps | DefaultTypeProps) &
  CommonProps;

/**
 * Defaults to theme.colors.text when `color` isn't passed — override it like
 * any other prop.
 *
 * A `Button` fills both `color` and `size` in for an icon passed as its
 * child, so an icon on a filled button is legible without the call site
 * restating the button's own colour — see `withIconDefaults`.
 *
 * @example <Icon type="Feather" name="home" color={theme.colors.error} size={spacing.x24} />
 * @example <Icon type="custom" name="logo" size={spacing.x24} />
 * @example <Icon name="home" /> // type omitted -> DEFAULT_ICON_TYPE (Feather)
 */
export default function Icon({
  type = DEFAULT_ICON_TYPE,
  name,
  size,
  color,
}: Props) {
  const theme = useTheme();
  const resolvedColor = color ?? theme.colors.text;

  if (type === "custom") {
    const CustomIcon = CUSTOM_ICONS[name as CustomIconName];
    return <CustomIcon size={size} color={resolvedColor} />;
  }

  const VectorIcon = ICON_SETS[type];
  return (
    <VectorIcon
      name={name as never}
      size={size}
      color={resolvedColor}
      // FontAwesome6 alone splits its glyphs across three fonts and picks
      // `regular` when not told otherwise — see IconNameByType for why this
      // has to match the name type it's paired with.
      {...(type === "FontAwesome6" ? { iconStyle: "solid" as const } : null)}
    />
  );
}

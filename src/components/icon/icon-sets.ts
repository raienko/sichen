import {
  AntDesign,
  type AntDesignIconName,
} from "@react-native-vector-icons/ant-design";
import {
  Feather,
  type FeatherIconName,
} from "@react-native-vector-icons/feather";
import {
  FontAwesome6,
  type FontAwesome6SolidIconName,
} from "@react-native-vector-icons/fontawesome6";
import {
  Ionicons,
  type IoniconsIconName,
} from "@react-native-vector-icons/ionicons";
import {
  MaterialIcons,
  type MaterialIconsIconName,
} from "@react-native-vector-icons/material-icons";

/**
 * Every react-native-vector-icons family Icon supports. Add a new family by
 * adding one line here (component) and one line to IconNameByType below
 * (its glyph-name type) — nothing else needs to change.
 */
export const ICON_SETS = {
  Feather,
  MaterialIcons,
  Ionicons,
  FontAwesome6,
  AntDesign,
};

export type IconSetType = keyof typeof ICON_SETS;

export type IconNameByType = {
  Feather: FeatherIconName;
  MaterialIcons: MaterialIconsIconName;
  Ionicons: IoniconsIconName;
  /**
   * The *solid* set specifically, not FontAwesome6's catch-all
   * `FontAwesome6IconName`.
   *
   * FontAwesome6 ships three separate fonts (regular / solid / brand), each
   * with its own glyphs, selected by an `iconStyle` prop that defaults to
   * `regular`. Its exported `FontAwesome6IconName` is the union of all
   * three, so a solid-only name like `"rocket"` type-checks and then
   * renders as a missing-glyph box — the type promises more than the
   * default font can draw. Narrowing to the solid set (much the largest of
   * the three in the free tier) keeps names honest; `index.tsx` passes the
   * matching `iconStyle`. Regular/brand aren't exposed yet — add them the
   * day something needs one.
   */
  FontAwesome6: FontAwesome6SolidIconName;
  AntDesign: AntDesignIconName;
};

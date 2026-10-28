import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import If from "@/components/if";
import Text from "@/components/text";
import { disabledA11yProps, imageA11yProps } from "@/features/accessibility";
import { formatNumber, useLocale } from "@/features/localization";
import { createStyles, type TypographyToken } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Avatar, { AVATAR_SIDE, type AvatarSize } from "./avatar";

export type AvatarGroupPerson = {
  /** Stable identity, used as the React key. Defaults to `name`. */
  id?: string;
  name: string;
  source?: Parameters<typeof Avatar>[0]["source"];
  icon?: ReactNode;
};

type Props = {
  people: readonly AvatarGroupPerson[];
  /**
   * How many avatars are drawn before the rest collapse into a "+N" tile.
   * Defaults to 3. The tile takes the last slot, so `max` is the most
   * squares ever drawn — the row's width doesn't grow with the group.
   */
  max?: number;
  /** Defaults to `"small"`: a group usually sits in a header or a row. */
  size?: AvatarSize;
  /**
   * The whole group's accessible name. Defaults to the names, joined, with
   * the overflow counted: "Ada, Grace and 3 more".
   */
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const OVERFLOW_TEXT: Record<AvatarSize, TypographyToken> = {
  small: "caption1",
  medium: "subheadline",
  large: "headline",
};

/** How much of each square the next one covers. */
const OVERLAP = 0.3;

/**
 * Several avatars in an overlapping row, with a "+N" tile for the rest: a
 * chat's members, a document's collaborators, who reacted.
 *
 * **One accessibility element**, named after everyone in it — the avatars
 * inside are hidden, or a screen reader would stop on each square in turn
 * for what one sentence says better. The default name joins the drawn names
 * and counts the rest, so it agrees with what is on screen.
 *
 * **Overlap is drawn with a ring in the page colour**, the same cut-out the
 * status dot uses, so each square reads as separate from the one beneath
 * it whatever the pictures are. Later avatars sit on top of earlier ones,
 * and the row runs from the reading edge — the overlap flips in RTL.
 *
 * @example <AvatarGroup people={members} />
 * @example <Avatar.Group people={members} max={4} size="medium" />
 */
export default function AvatarGroup({
  people,
  max = 3,
  size = "small",
  label,
  style,
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { t, locale } = useLocale();

  // The tile replaces the last square rather than adding one, so the row
  // is never wider than `max` — unless everyone fits exactly.
  const visibleCount =
    people.length > max ? Math.max(0, max - 1) : people.length;
  const visible = people.slice(0, visibleCount);
  const overflow = people.length - visible.length;

  const names = visible
    .map((person) => person.name.trim())
    .filter(Boolean)
    .join(t("avatarGroup.separator"));
  const accessibleName =
    label ??
    (overflow > 0
      ? t("avatarGroup.andMore", {
          names,
          count: formatNumber(overflow, locale),
        })
      : names);

  return (
    <View
      testID={testID}
      {...imageA11yProps({ label: accessibleName })}
      style={[styles.row, style]}
    >
      {visible.map((person, index) => (
        <View
          key={person.id ?? `${person.name}-${index}`}
          {...disabledA11yProps()}
          style={[
            styles.slot,
            styles[`ring-${size}`],
            index === 0 ? null : styles[`overlap-${size}`],
            { borderColor: theme.colors.background },
          ]}
        >
          <Avatar
            name={person.name}
            source={person.source}
            icon={person.icon}
            size={size}
          />
        </View>
      ))}

      <If condition={overflow > 0}>
        <View
          {...disabledA11yProps()}
          style={[
            styles.slot,
            styles[`ring-${size}`],
            visible.length === 0 ? null : styles[`overlap-${size}`],
            { borderColor: theme.colors.background },
          ]}
        >
          <View
            style={[
              styles.tile,
              styles[`tile-${size}`],
              {
                backgroundColor: theme.colors.backgroundElementSelected,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              value={t("avatarGroup.overflow", {
                count: formatNumber(overflow, locale),
              })}
              type={OVERFLOW_TEXT[size]}
              // A fixed graphic, like the monogram — see `Avatar`.
              allowFontScaling={false}
              numberOfLines={1}
              style={{ color: theme.colors.textSecondary }}
            />
          </View>
        </View>
      </If>
    </View>
  );
}

const useStyles = createStyles(({ units, isRTL, radius }) => {
  // A negative margin on the reading side pulls each square back over the
  // one before it. A physical side from `isRTL`, as in `Avatar`.
  const overlap = (size: AvatarSize) => {
    const value = -Math.round(units(AVATAR_SIDE[size]) * OVERLAP);
    return isRTL ? { marginRight: value } : { marginLeft: value };
  };
  const tile = (size: AvatarSize) => ({
    width: units(AVATAR_SIDE[size]),
    height: units(AVATAR_SIDE[size]),
  });
  const ring = { borderWidth: units(2), borderRadius: radius.surface };

  return {
    row: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      alignSelf: "flex-start",
    },
    slot: {
      overflow: "hidden",
    },
    "ring-small": ring,
    "ring-medium": ring,
    "ring-large": ring,
    "overlap-small": overlap("small"),
    "overlap-medium": overlap("medium"),
    "overlap-large": overlap("large"),
    tile: {
      alignItems: "center",
      justifyContent: "center",
      borderWidth: units(1),
      borderRadius: radius.surface,
    },
    "tile-small": tile("small"),
    "tile-medium": tile("medium"),
    "tile-large": tile("large"),
  };
});

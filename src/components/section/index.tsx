import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import Text from "@/components/text";
import { headingA11yProps, type HeadingLevel } from "@/features/accessibility";
import { createStyles, type TypographyToken } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import SectionLevelContext, {
  nextSectionLevel,
  useSectionLevel,
} from "./context";

export { useSectionLevel } from "./context";

/**
 * Which step of the type scale a title takes at each depth, so a section
 * looks like the level it announces at without anyone choosing a size.
 *
 * It stops descending at `headline`: the scale's title steps are built for
 * headings with room to breathe, and a fourth-level heading in a settings
 * screen is a label on a group of rows, not a page title. Beyond that,
 * further nesting changes the outline but not the size — there is nothing
 * smaller left that is still a heading.
 */
const LEVEL_TYPE: Record<HeadingLevel, TypographyToken> = {
  1: "largeTitle",
  2: "title1",
  3: "title2",
  4: "title3",
  5: "headline",
  6: "headline",
};

/**
 * A title with no text under it is a label for nothing, and a `description`
 * or an `action` with no title has nothing to qualify or act on. Expressed
 * as a union so an untitled section — which is a real and useful thing, a
 * group that needs spacing but no heading — can't also carry the props that
 * only make sense beside a heading.
 */
type HeadingProps =
  | {
      /** The group's name, announced as a heading at this depth. */
      title: string;
      /** Supporting copy under it — what the group is for, or a caveat. */
      description?: string;
      /**
       * A control on the title's line: "Edit", "See all", a count. Kept a
       * node rather than a label and a callback, so it can be whatever
       * control the screen already uses.
       */
      action?: ReactNode;
    }
  | { title?: never; description?: never; action?: never };

type Props = HeadingProps & {
  children: ReactNode;
  /**
   * Explanatory text under the content — a form group's hint, a note about
   * what a setting affects.
   *
   * A string rather than a node, like `description`: this component owns
   * the typography of its own text, which is most of what it is for.
   * Anything richer belongs in `children`, where it is content rather than
   * a footnote.
   */
  footer?: string;
  /**
   * Overrides the depth this section announces at. Rarely needed — the
   * depth comes from how deeply sections are nested — but a screen with no
   * `Header` may want its first section to be the page's own heading.
   */
  headingLevel?: HeadingLevel;
  /** Sets the title's size without changing the level it announces at. */
  titleType?: TypographyToken;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * A titled group of related things: a block of settings, a fieldset, a
 * "Recent orders" list with a "See all" beside it.
 *
 * **It draws no surface.** No fill, no border, no shadow — that is `Card`'s
 * job, and a second component owning the same box is how two of them end up
 * disagreeing about a radius. This owns the *structure*: a heading, the
 * copy around it, and the gaps between them. Wrap it in a `Card` when the
 * group should also look raised, and the two compose without either
 * knowing about the other.
 *
 * **The heading level is counted for you.** A `Section` announces at level
 * 2, because level 1 belongs to the screen and `Header` already claims it;
 * a `Section` inside a `Section` announces at 3, and so on to 6. Nobody
 * passes a number, which matters because a hand-written level is right when
 * it is written and wrong the first time the screen is rearranged — and the
 * damage is invisible, since an outline is only ever read by people using a
 * screen reader's heading rotor.
 *
 * **Size follows the level.** The title takes the type step that matches
 * its depth, so it looks like what it announces as. `titleType` changes the
 * size without touching the level, for the cases where the two genuinely
 * should differ — the same split `Header` makes when it sets its `<h1>` in
 * `headline`.
 *
 * **It is not an accessibility group.** Marking the whole thing `accessible`
 * would collapse everything inside into one announcement and make the
 * controls in it unreachable — the trap `Card` and `ListItem` both
 * document. The heading is what gives a screen reader the structure, which
 * is the same thing it gives a sighted reader.
 *
 * @example
 * <Section title="Notifications" description="Choose what reaches you.">
 *   <Switch value={push} onChange={setPush} label="Push" />
 *   <Switch value={email} onChange={setEmail} label="Email" />
 * </Section>
 * @example
 * <Section title="Recent orders" action={<Button value="See all" size="small" onPress={openAll} />}>
 *   <ListItem title="Order #12" />
 * </Section>
 * @example
 * <Section title="Address" footer="Used for delivery only.">
 *   <Input type="text" label="Street" value={street} onChange={setStreet} />
 * </Section>
 */
export default function Section({
  title,
  description,
  action,
  footer,
  children,
  headingLevel,
  titleType,
  style,
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const inherited = useSectionLevel();
  const level = headingLevel ?? inherited;

  return (
    // Whatever this section announces at, the sections inside it are one
    // deeper. Provided even when this one has no title of its own: an
    // untitled group is still a level of nesting for anything below it.
    <SectionLevelContext.Provider value={nextSectionLevel(level)}>
      <View testID={testID} style={[styles.section, style]}>
        {title === undefined ? null : (
          <View style={styles.heading}>
            <View style={styles.titles}>
              <Text
                value={title}
                type={titleType ?? LEVEL_TYPE[level]}
                // Declared rather than left to `Text`'s own type-to-level
                // mapping: that mapping stops at `title3`, so a fifth- or
                // sixth-level heading set in `headline` would announce as
                // plain text and vanish from the outline entirely.
                {...headingA11yProps(level)}
              />
              {description === undefined ? null : (
                <Text
                  value={description}
                  type="footnote"
                  style={{ color: theme.colors.textSecondary }}
                />
              )}
            </View>
            {action === undefined ? null : (
              <View style={styles.action}>{action}</View>
            )}
          </View>
        )}

        {children}

        {footer === undefined ? null : (
          <Text
            value={footer}
            type="footnote"
            style={{ color: theme.colors.textSecondary }}
          />
        )}
      </View>
    </SectionLevelContext.Provider>
  );
}

const useStyles = createStyles(({ isRTL, spacing }) => ({
  section: {
    // Fills whatever contains it rather than picking a width of its own —
    // the same reason `Card` and `ListItem` use alignSelf.
    alignSelf: "stretch",
    gap: spacing.x12,
  },
  heading: {
    flexDirection: isRTL ? "row-reverse" : "row",
    // Top rather than centre: an action stays level with the title when a
    // description makes the left side two lines tall.
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.x12,
  },
  titles: {
    // Takes the space the action doesn't need, and is the half that gives
    // way. `minWidth: 0` is what actually lets it — a flex item's default
    // minimum size is its own content, the same trap `ListItem` documents.
    flex: 1,
    minWidth: 0,
    gap: spacing.x4,
  },
  action: {
    flexShrink: 0,
  },
}));

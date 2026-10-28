import { Fragment, useMemo, type ReactNode } from "react";
import {
  Text as RNText,
  type TextProps as RNTextProps,
  type StyleProp,
  type TextStyle,
} from "react-native";

import If from "@/components/if";
import { headingA11yProps, type HeadingLevel } from "@/features/accessibility";
import { useIsRtl } from "@/features/localization";
import { useResponsive, type TypographyToken } from "@/features/responsive";
import { useTheme } from "@/features/theme";

/**
 * Which heading level each type-scale entry means, in document-outline
 * terms. Apple's Large Title is the page's own title, and Title 1–3 are
 * nested section headings, so they map straight onto `<h1>`–`<h4>`.
 *
 * `type` is the only input — there's no separate `heading` prop, because
 * the type scale already *is* the hierarchy. Picking `title2` because
 * something is a sub-section and then separately declaring it a heading
 * states the same fact twice, with the option of contradicting yourself.
 *
 * `headline` is deliberately absent: HIG uses it for things like list-row
 * titles at body size, which are emphasis rather than document structure.
 * Marking those as headings would fill a screen reader's heading rotor
 * with entries that aren't navigation landmarks.
 *
 * The tradeoff is that a title size can't be used as pure decoration (a
 * large stat, say) without also entering the outline. No call site needs
 * that yet; if one shows up, an explicit opt-out is the change to make —
 * same "pull it in when there's a real second case" rule the styleguides
 * follow.
 */
const HEADING_LEVEL_BY_TYPE: Partial<Record<TypographyToken, HeadingLevel>> = {
  largeTitle: 1,
  title1: 2,
  title2: 3,
  title3: 4,
};

/**
 * A run of text inside a `Text`. Give it `onPress` and it becomes an
 * inline link: accent-coloured, underlined (colour alone isn't enough —
 * WCAG 1.4.1), announced as a link, and pressable without breaking the
 * line it sits in.
 */
export type TextSpan = {
  text: string;
  onPress?: () => void;
  /** What a screen reader calls the link, when the text alone won't do. */
  label?: string;
};

type Props = Omit<RNTextProps, "children"> & {
  /**
   * The text. Pass spans instead of a string to make parts of it links —
   * chat messages with URLs in them, "Read the [terms]" in a form footer.
   */
  value: string | readonly TextSpan[];
  /**
   * One of Apple's HIG type-scale names — see `@/features/responsive`'s
   * typography styleguide. Defaults to `"body"`.
   *
   * This also decides heading semantics: the four title sizes announce as
   * headings (and render as real `<h1>`–`<h4>` on web), everything else as
   * plain text.
   */
  type?: TypographyToken;
  /**
   * Whether the reader can select and copy it. Off by default, as it is on
   * native, so a button label, a tab, a counter or a page number never
   * highlights on a web double-click or drag — and a new control is right
   * without having to remember anything. Turn it on for content worth
   * copying: a chat message, an address, an error code.
   */
  selectable?: boolean;
};

/**
 * The one component that reads the type scale directly rather than through
 * `createStyles`. Its variant is chosen by a *prop* at render time, which a
 * static style factory can't express — the previous version worked around
 * that by spreading all eleven tokens into this component's own
 * `StyleSheet.create`, so every `<Text>` instance allocated twelve style
 * objects to use exactly one of them. Reading `typography[type]` costs one.
 */
function renderSpans(
  spans: readonly TextSpan[],
  linkStyle: TextStyle,
): ReactNode[] {
  return spans.map((span, index) => (
    // Spans have no identity beyond their place in the text.
    <Fragment key={index}>
      <If condition={span.onPress === undefined}>{span.text}</If>
      <If condition={span.onPress}>
        <RNText
          onPress={span.onPress}
          accessibilityRole="link"
          role="link"
          accessibilityLabel={span.label}
          style={linkStyle}
        >
          {span.text}
        </RNText>
      </If>
    </Fragment>
  ));
}

export default function Text({
  value,
  type = "body",
  style,
  allowFontScaling,
  selectable = false,
  ...props
}: Props) {
  const theme = useTheme();
  const { typography, fontScale } = useResponsive();
  const isRTL = useIsRtl();

  const headingLevel = HEADING_LEVEL_BY_TYPE[type];
  const linkStyle: TextStyle = {
    color: theme.colors.accent,
    textDecorationLine: "underline",
  };

  const baseStyle = useMemo<StyleProp<TextStyle>>(() => {
    const token = typography[type];
    return [
      token,
      // `typography` pre-scales lineHeight by the OS text-size multiplier
      // because RN scales fontSize but not lineHeight. Opting out of that
      // automatic fontSize scaling has to undo the lineHeight half too, or
      // the text stays put while its line box keeps growing.
      allowFontScaling === false
        ? { lineHeight: Math.round(token.lineHeight / fontScale) }
        : null,
      {
        color: theme.colors.text,
        textAlign: isRTL ? ("right" as const) : ("left" as const),
      },
    ];
  }, [typography, type, allowFontScaling, fontScale, theme.colors.text, isRTL]);

  return (
    <RNText
      style={[baseStyle, style]}
      allowFontScaling={allowFontScaling}
      selectable={selectable}
      {...(headingLevel === undefined ? null : headingA11yProps(headingLevel))}
      {...props}
    >
      {/* A plain string stays the only child — one text node, as before
          spans existed. Spans become nested text, which keeps a link
          inline rather than breaking the line around a separate element. */}
      {typeof value === "string" ? value : renderSpans(value, linkStyle)}
    </RNText>
  );
}

import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import If from "@/components/if";
import { createStyles } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { testId, isIOS } from "@/utils";

import type { ScreenProps } from "./types";

export type {
  CenteredScreenProps,
  DefaultScreenProps,
  ScreenLayout,
  ScreenProps,
} from "./types";

/**
 * The page container every route renders into, in one of two layouts.
 *
 * - `default` — optional `header` and `footer` pinned around the content
 *   (in a ScrollView when `scrollable`), and an optional `aside` beside them.
 * - `centered` — content centred in the viewport, for sign-in, empty and
 *   confirmation screens, with an optional `header` and `footer`.
 *
 * **Screen owns the safe areas**, so nothing inside it has to. The top
 * inset goes above the header, or above the content when there is none;
 * the bottom inset below the footer, or below the content; the aside takes
 * both for itself. Pass a `Header` without `avoidNotch` — clearing the
 * notch twice pushes it down twice.
 *
 * **Only the content scrolls**, when `scrollable` is set. Header, footer and aside stay put, and the
 * footer rises with the keyboard on iOS so a form's actions stay reachable.
 * A tab screen ends its content with `<Spacer size="tab-bar" />` to clear the bar.
 *
 * @example
 * <Screen scrollable header={<Header title="Orders" />}>…</Screen>
 * @example
 * <Screen scrollable header={<Header title="New address" left={<BackButton />} />} footer={<Button value="Save" />}>…</Screen>
 * @example
 * <Screen padded={false} header={<Header title="Contacts" />}><List … /></Screen>
 * @example
 * <Screen layout="centered" footer={<Button value="Resend link" type="tertiary" />}>…</Screen>
 */
export default function Screen(props: ScreenProps) {
  const {
    header,
    footer,
    children,
    style,
    testID = "screen",
    layout = "default",
  } = props;
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const centered = layout === "centered";
  const aside = props.layout === "centered" ? undefined : props.aside;
  const scrollable = props.layout === "centered" || (props.scrollable ?? false);
  const padded = props.layout === "centered" || (props.padded ?? true);

  // Whichever edge has no bar of its own has to clear the device itself.
  const contentInsets = {
    paddingTop: header === undefined ? insets.top : 0,
    paddingBottom: footer === undefined ? insets.bottom : 0,
  };
  const contentStyle = [
    padded ? styles.padded : null,
    centered ? styles.centeredContent : null,
    style,
  ];

  const content = (
    <>
      <If condition={scrollable}>
        <ScrollView
          testID={testId(testID, "scroll")}
          style={styles.fill}
          contentContainerStyle={[
            styles.scrollContent,
            contentInsets,
            centered ? styles.centeredScroll : null,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View testID={testId(testID, "content")} style={contentStyle}>
            {children}
          </View>
        </ScrollView>
      </If>
      <If condition={!scrollable}>
        <View
          testID={testId(testID, "content")}
          style={[styles.fill, contentInsets, contentStyle]}
        >
          {children}
        </View>
      </If>
    </>
  );

  return (
    <View
      testID={testID}
      style={[
        styles.root,
        {
          backgroundColor: theme.colors.background,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <If condition={aside}>
        <View
          testID={testId(testID, "aside")}
          style={[
            styles.aside,
            {
              borderColor: theme.colors.divider,
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          {aside}
        </View>
      </If>

      <KeyboardAvoidingView
        style={styles.main}
        behavior={isIOS ? "padding" : undefined}
      >
        <If condition={header}>
          <View
            testID={testId(testID, "header")}
            style={{ paddingTop: insets.top }}
          >
            {header}
          </View>
        </If>
        {content}
        <If condition={footer}>
          <View
            testID={testId(testID, "footer")}
            style={[
              styles.footer,
              {
                borderTopColor: theme.colors.divider,
                paddingBottom: insets.bottom,
              },
            ]}
          >
            {footer}
          </View>
        </If>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = createStyles(({ isRTL, spacing, sizes }) => ({
  root: {
    flex: 1,
    // The aside sits at the reading start edge.
    flexDirection: isRTL ? "row-reverse" : "row",
  },
  aside: {
    width: sizes.asideWidth,
    flexShrink: 0,
    [isRTL ? "borderLeftWidth" : "borderRightWidth"]: spacing.x1,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  padded: {
    padding: spacing.x16,
  },
  footer: {
    borderTopWidth: spacing.x1,
  },
  centeredScroll: {
    justifyContent: "center",
  },
  // Centred in both axes, at a width a sentence and a full-width button
  // still read comfortably at on a tablet.
  centeredContent: {
    width: "100%",
    maxWidth: sizes.elementWidthLg,
    alignSelf: "center",
    alignItems: "stretch",
  },
}));

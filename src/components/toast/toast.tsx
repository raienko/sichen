import { useEffect } from "react";
import {
  AccessibilityInfo,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { IconButton } from "@/components/button";
import Icon from "@/components/icon";
import If from "@/components/if";
import Text from "@/components/text";
import { controlA11yProps, statusA11yProps } from "@/features/accessibility";
import { deepLinks } from "@/features/deep-links";
import { useLocale } from "@/features/localization";
import { createStyles, useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";
import { isIOS, wait, testId } from "@/utils";

import { TOAST_TYPE_CONFIG } from "./config";
import { ANIMATION_DURATION } from "./constants";
import toasts from "./store";
import { TOAST_TYPES, type ToastContent, type ToastOptions } from "./types";

export type ToastProps = ToastContent & {
  /** Called when the close control is pressed. */
  onDismiss?: () => void;
  /**
   * Called after a press has dispatched `link`. `ToastItem` passes the
   * toast's own hide — acting on a toast is what takes it off the screen.
   */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Default `"toast"`; its controls are `<testID>.action` and `<testID>.close`. */
  testID?: string;
};

/**
 * One toast: a short, self-dismissing report on something that already
 * happened, styled by `type` (see ./config.ts) and optionally pressable to
 * follow a `link`.
 *
 * Almost nothing renders this directly. The normal way to raise one is the
 * static API, from anywhere at all — no ref, no context, no component in
 * scope:
 *
 * @example
 * await Toast.success("Saved");
 * const id = await Toast.show({
 *   type: "error",
 *   title: "Upload failed",
 *   message: "Tap to see what went wrong.",
 *   link: "/uploads/42",
 *   duration: null, // stays until it's hidden
 * });
 * await Toast.hide(id);
 *
 * `ToastsProvider` (mounted once in `Providers`) is what puts them on
 * screen; the list itself lives in ./store.ts, outside React, because the
 * places worth raising a toast from — a catch block, an API client — aren't
 * inside a component. `show`/`hide` resolve once the enter/exit animation
 * has finished, so `await Toast.hide(id)` means the toast is really gone.
 *
 * Rendering `<Toast />` on its own is for a fixed, inline notice — a story,
 * a form-level error that belongs in the layout rather than over it. It has
 * no lifetime of its own that way: `duration`/`expiresAt` are the store's
 * business, so an inline one stays until it's unmounted.
 */
function ToastComponent({
  type = "info",
  title,
  message,
  link,
  actionLabel,
  dismissible = true,
  onDismiss,
  onPress,
  style,
  testID = "toast",
}: ToastProps) {
  const theme = useTheme();
  const { spacing } = useSizes();
  const styles = useStyles();
  const { t } = useLocale();

  const config = TOAST_TYPE_CONFIG[type];
  const accent = theme.colors[config.accent];

  // The type is carried visually by the accent colour and the icon, neither
  // of which a screen reader can convey — so it's spelled out here instead
  // (WCAG 1.4.1: colour can't be the only thing that tells success from
  // failure).
  const announcement = [t(config.announcement), title, message]
    .filter(Boolean)
    .join(", ");

  useEffect(() => {
    // Live regions are Android's and the web's; iOS has no equivalent, so
    // VoiceOver only hears a toast if it's told. Announcing on every
    // platform would make Android and the web say it twice.
    if (isIOS) {
      AccessibilityInfo.announceForAccessibility(announcement);
    }
    // Deliberately mount-only: the announcement is "this appeared", not a
    // running commentary on prop changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const press = () => {
    // Not awaited: a link can be held at a closed gate indefinitely (until
    // sign-in, say), and the toast that was just pressed shouldn't sit
    // there waiting for it.
    if (link !== undefined) void deepLinks.open(link);
    onPress?.();
  };

  const body = (
    <>
      <Icon name={config.icon} color={accent} size={spacing.x20} />

      <View style={styles.text}>
        <If condition={title}>
          <Text value={title as string} type="headline" />
        </If>
        <Text
          value={message}
          type="footnote"
          style={{ color: theme.colors.textSecondary }}
        />
      </View>

      <If condition={link && actionLabel}>
        <Text
          value={actionLabel as string}
          type="footnote"
          style={{ color: accent }}
        />
      </If>
    </>
  );

  return (
    <View
      testID={testID}
      // Announced when it appears rather than only when someone navigates
      // to it — a toast the user has to go and find has failed at its one
      // job. The label carries the whole message, since the container
      // itself isn't an accessibility element and its children are read
      // separately.
      {...statusA11yProps({ urgency: config.urgency, label: announcement })}
      style={[
        styles.toast,
        {
          backgroundColor: theme.colors.backgroundElement,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {link === undefined ? (
        <View style={styles.body}>{body}</View>
      ) : (
        <Pressable
          testID={testId(testID, "action")}
          style={styles.body}
          onPress={press}
          // The message is the button's name, and the hint says what
          // pressing it will do — without it the announcement stops at
          // "Saved, button", which doesn't say there's anywhere to go.
          {...controlA11yProps({
            label: announcement,
            hint: t("toast.openHint"),
          })}
        >
          {body}
        </Pressable>
      )}

      {/* A sibling of the pressable body, not a child of it: a nested
          touchable is collapsed into its parent by iOS VoiceOver, which
          would leave the only way to dismiss a toast unreachable for
          exactly the users whose toasts don't expire on their own. */}
      <If condition={dismissible}>
        <IconButton
          testID={testId(testID, "close")}
          label={t("common.close")}
          size="small"
          onPress={onDismiss}
        >
          <Icon name="x" />
        </IconButton>
      </If>
    </View>
  );
}

/** `Toast.success(message)`, and one of these per entry in TOAST_TYPES. */
type ToastShortcut = (
  message: string,
  options?: Omit<ToastOptions, "type" | "message">,
) => Promise<string>;

type ToastStatic = {
  /** Resolves with the toast's id once it has finished animating in. */
  show: (options: ToastOptions) => Promise<string>;
  /** Resolves once the toast has finished animating out and is gone. */
  hide: (id: string) => Promise<void>;
  hideAll: () => Promise<void>;
} & Record<(typeof TOAST_TYPES)[number], ToastShortcut>;

const Toast = ToastComponent as typeof ToastComponent & ToastStatic;

Toast.show = async (options: ToastOptions) => {
  const id = toasts.show(options);
  await wait(ANIMATION_DURATION);
  return id;
};

Toast.hide = async (id: string) => {
  toasts.hide(id);
  // The store schedules its own removal on the same delay, and scheduled it
  // first — so once this resolves the toast is off the list, not merely
  // finished animating.
  await wait(ANIMATION_DURATION);
};

Toast.hideAll = async () => {
  toasts.hideAll();
  await wait(ANIMATION_DURATION);
};

// One shortcut per type, generated from the same list the config table is
// keyed by, so a new type gets its `Toast.<type>(message)` for free instead
// of needing four more near-identical lines here.
for (const type of TOAST_TYPES) {
  Toast[type] = (message, options) => Toast.show({ ...options, type, message });
}

export default Toast;

const useStyles = createStyles(({ isRTL, spacing, sizes, radius }) => ({
  toast: {
    borderRadius: radius.surface,
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    width: "100%",
    maxWidth: sizes.elementWidthLg,
    gap: spacing.x8,
    paddingVertical: spacing.x8,
    paddingHorizontal: spacing.x12,
    // The type's colour lives on the icon alone — a coloured side stripe
    // on top of it repeated the same signal as decoration.
    borderWidth: spacing.x1,
  },
  body: {
    flexDirection: isRTL ? "row-reverse" : "row",
    alignItems: "center",
    // Takes the row's spare width so the close control keeps its own size
    // and the message wraps instead of pushing it off the edge.
    flexShrink: 1,
    flexGrow: 1,
    gap: spacing.x8,
    // The whole row is the touch target, and it's already at least
    // elementHeightSm tall — the close button next to it sets that floor.
    minHeight: sizes.elementHeightSm,
  },
  text: {
    flexShrink: 1,
    flexGrow: 1,
  },
}));

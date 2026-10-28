import { router, type Href } from "expo-router";

import {
  IconButton,
  type ButtonType,
  type IconButtonSize,
} from "@/components/button";
import Icon from "@/components/icon";
import { useIsRtl, useLocale } from "@/features/localization";

type Props = {
  /**
   * What pressing it does. Omit it for the whole point of this component:
   * going back. Passing one takes over entirely — it does *not* run
   * alongside the navigation — which is what makes "ask before discarding"
   * expressible without fighting a default.
   */
  onPress?: () => void;
  /**
   * Where to go when there is no history to pop — a screen opened straight
   * from a deep link or a push notification, where `back()` is a no-op and
   * the user is otherwise stranded on a dead button.
   *
   * Defaults to `"/"`, the one route every app has. Pass `null` to opt out,
   * and the button then renders nothing at all rather than sitting there
   * doing nothing.
   *
   * Typed as Expo Router's `Href`, so a route this app doesn't have is a
   * `tsc` error rather than a dead end discovered at runtime.
   */
  fallbackHref?: Href | null;
  /** Overrides the localized "Back". */
  label?: string;
  /** Same palette as `Button`. Defaults to `"tertiary"` — a header affordance. */
  type?: ButtonType;
  size?: IconButtonSize;
  disabled?: boolean;
  testID?: string;
};

/**
 * The back affordance for a screen that draws its own header.
 *
 * With no `onPress` it pops the navigation stack, which is the case it
 * exists for — a header shouldn't have to reach for the router to do the
 * one thing back buttons do. It's an `IconButton` underneath, so the touch
 * target, palette, states and accessible name are the ones every other
 * button in the app has.
 *
 * **The chevron mirrors in RTL.** Back is a direction, not a glyph: in a
 * right-to-left locale the previous screen is to the *right*, and a
 * left-pointing chevron there means forward. It reads `useIsRtl()` (the
 * locale-derived flag) rather than relying on automatic mirroring, which
 * only lands after a native reload.
 *
 * @example <BackButton />
 * @example <BackButton onPress={confirmDiscard} />
 * @example <BackButton fallbackHref="/orders" /> // typed against your routes
 */
/**
 * Whether the router can go back — or `null` when there is no router to ask.
 *
 * `router.canGoBack()` already answers `false` for a navigator that hasn't
 * mounted yet, but outside an Expo Router root altogether (Storybook, a
 * component rendered before the app's root layout) there is no navigation
 * ref for it to check and the call throws. That case is reported rather
 * than folded into `false`, because the fallback's `router.replace` would
 * throw the same way.
 */
function canGoBack(): boolean | null {
  try {
    return router.canGoBack();
  } catch {
    return null;
  }
}

export default function BackButton({
  onPress,
  fallbackHref = "/",
  label,
  type = "tertiary",
  size = "medium",
  disabled,
  testID,
}: Props) {
  const { t } = useLocale();
  const isRTL = useIsRtl();

  // Only asked when this button owns the navigation: a caller's `onPress`
  // decides for itself what pressing means, and shouldn't have the button
  // disappear underneath it because the stack happens to be empty.
  const stranded = onPress === undefined && canGoBack() !== true;

  if (stranded && fallbackHref === null) return null;

  function goBack() {
    const back = canGoBack();
    // No router to navigate with: the button still renders (so a story or
    // a pre-navigation screen shows it), but pressing it has nowhere to go.
    if (back === null) return;
    if (back) {
      router.back();
      return;
    }
    // `replace`, not `navigate`: this is a way *out* of a dead end, and
    // pushing the fallback would leave a history whose own back button
    // returns to the screen the user just asked to leave.
    if (fallbackHref !== null) router.replace(fallbackHref);
  }

  return (
    <IconButton
      testID={testID}
      label={label ?? t("common.back")}
      type={type}
      size={size}
      disabled={disabled}
      onPress={onPress ?? goBack}
    >
      <Icon name={isRTL ? "chevron-right" : "chevron-left"} />
    </IconButton>
  );
}

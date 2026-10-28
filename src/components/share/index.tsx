import { useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import Button, {
  IconButton,
  type ButtonSize,
  type ButtonType,
  type IconButtonSize,
} from "@/components/button";
import Icon, { type IconNameByType } from "@/components/icon";
import Toast from "@/components/toast";
import { useLocale } from "@/features/localization";

import { hasContent, toCopyText } from "./content";
import { copyText, shareContent } from "./share";
import type { ShareContent, ShareOutcome } from "./types";

export type { ShareContent, ShareOutcome } from "./types";
export { toCopyText, hasContent } from "./content";
/** The share sheet without the button — for a control that already has its own. */
export { shareContent } from "./share";

/** What the button does when pressed. */
export type ShareMode = "share" | "copy";

/**
 * The glyph each mode wears, so the button says which of the two it is
 * without any text. They are genuinely different actions — one opens a
 * sheet, the other silently fills the clipboard — and a single icon for
 * both would be the same lie the shared label would tell.
 */
const MODE_ICON: Record<ShareMode, IconNameByType["Feather"]> = {
  share: "share-2",
  copy: "copy",
};

/**
 * `Button` has an `auto` size and `IconButton` has none, because a square
 * has nothing to hug. An icon-only share asked for `auto` gets the default
 * instead of a type error at the call site.
 */
function iconSize(size: ButtonSize): IconButtonSize {
  return size === "auto" ? "medium" : size;
}

type Props = {
  content: ShareContent;
  /**
   * `"share"` opens the OS share sheet and falls back to the clipboard
   * where there isn't one — which, in a browser, is most of the time.
   * `"copy"` always copies, for a "Copy link" beside a share button.
   * Defaults to `"share"`.
   */
  mode?: ShareMode;
  /**
   * Button text. **Omitted, the button is its mode's icon** — a share
   * glyph or a copy glyph — which is what this is nearly always wanted as:
   * one control beside the thing being shared, not a word competing with
   * it. Pass a string for the cases where the action needs spelling out,
   * and it becomes a text button instead.
   *
   * Either way the accessible name is the localized "Share"/"Copy", so the
   * icon form is never an unnamed control.
   */
  value?: string;
  /** Same palette and sizes as `Button`. */
  type?: ButtonType;
  size?: ButtonSize;
  disabled?: boolean;
  /**
   * Shows a toast confirming a copy, or reporting a share that failed. On
   * by default, and worth leaving on: a copy is otherwise completely
   * invisible — nothing on screen changes, and the only way to find out
   * whether it worked is to paste somewhere and see.
   */
  notify?: boolean;
  /** Told how it ended, including a dismissal. */
  onResult?: (outcome: ShareOutcome) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * A button that shares, and copies when there is nothing to share with.
 *
 * ```tsx
 * <Share content={{ url: order.url, title: "Order #12" }} />
 * <Share content={{ url: order.url }} mode="copy" />
 * <Share content={{ url: order.url }} value="Share this order" />
 *
 * // or drive it yourself
 * const outcome = await Share.share({ url });
 * await Share.copy(url);
 * ```
 *
 * **It is an icon by default, and the icon says which mode it is in** — a
 * share glyph for the sheet, a copy glyph for the clipboard. They are
 * different actions rather than two spellings of one, so they do not share
 * a glyph any more than they share a label. Passing `value` turns it into
 * a text button for the cases that need the action spelled out; the
 * accessible name is the same either way, so the icon form is never an
 * unnamed control.
 *
 * **The clipboard is not a consolation prize.** iOS and Android always have
 * a share sheet; a browser has one only where the Web Share API exists —
 * mobile Safari and Chrome, over HTTPS — and `react-native-web` rejects
 * everywhere else. That is most desktop browsers, so on the web the
 * clipboard is the normal path rather than an edge case, and `copied` is a
 * first-class outcome rather than an error to apologise for.
 *
 * **A dismissal never falls back to copying.** Someone who opened the sheet
 * and closed it has decided not to share; quietly copying instead, and
 * announcing that it was copied, does the opposite of what they just asked
 * for. The web reports that cancel by rejecting with an `AbortError`, which
 * is indistinguishable from a real failure unless the name is checked — so
 * it is checked.
 *
 * **A copy is invisible unless something says so.** Nothing on screen
 * changes when text reaches the clipboard, so the only way to know it
 * worked is to paste somewhere and look. That is why the confirmation toast
 * is on by default rather than opt-in; `notify={false}` is for a caller
 * showing its own feedback.
 *
 * **What gets copied is the URL, not the sentence around it.** The
 * clipboard is nearly always on its way into an address bar or a chat box,
 * where "Check this out https://…" is wrong in a way the bare link is not.
 *
 * @example <Share content={{ url: "https://example.com/o/12", title: "Order" }} />
 * @example <Share content={{ url }} mode="copy" type="tertiary" size="small" />
 * @example <Share content={{ url }} value="Share this order" type="primary" />
 */
function ShareComponent({
  content,
  mode = "share",
  value,
  type = "secondary",
  size = "medium",
  disabled = false,
  notify = true,
  onResult,
  style,
  testID,
}: Props) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);

  async function press() {
    setBusy(true);
    try {
      const outcome =
        mode === "copy"
          ? (await copyText(toCopyText(content)))
            ? "copied"
            : "failed"
          : await shareContent(content);

      if (notify && outcome === "copied") {
        await Toast.success(t("share.copied"));
      }
      if (notify && outcome === "failed") {
        await Toast.error(t("share.failed"));
      }

      onResult?.(outcome);
    } finally {
      setBusy(false);
    }
  }

  const name = t(mode === "copy" ? "share.copy" : "share.action");
  // Nothing to share is a disabled button rather than a sheet that opens
  // empty — reached by a URL that hasn't loaded yet more often than by a
  // caller getting it wrong.
  const unavailable = disabled || !hasContent(content);

  if (value === undefined) {
    return (
      <IconButton
        testID={testID}
        // The name the text form would have shown, since there is no text
        // here for a screen reader to derive one from.
        label={name}
        type={type}
        size={iconSize(size)}
        disabled={unavailable}
        loading={busy}
        onPress={press}
        style={style}
      >
        <Icon name={MODE_ICON[mode]} />
      </IconButton>
    );
  }

  return (
    <Button
      testID={testID}
      value={value}
      type={type}
      size={size}
      disabled={unavailable}
      loading={busy}
      onPress={press}
      style={style}
    />
  );
}

type ShareStatic = {
  displayName: string;
  /** Opens the share sheet, falling back to the clipboard. */
  share: (content: ShareContent) => Promise<ShareOutcome>;
  /** Puts text on the clipboard. `false` when it did not get there. */
  copy: (text: string) => Promise<boolean>;
};

const Share = ShareComponent as typeof ShareComponent & ShareStatic;

// Set explicitly because the alias erases `.name`, the same reason `Image`
// and `Modal` set one.
Share.displayName = "Share";
Share.share = shareContent;
Share.copy = copyText;

export default Share;

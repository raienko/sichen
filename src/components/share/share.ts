import {
  Share as RNShare,
  type ShareContent as RNShareContent,
} from "react-native";
import * as Clipboard from "expo-clipboard";

import logger from "@/features/logger";

import { hasContent, toCopyText } from "./content";
import type { ShareContent, ShareOutcome } from "./types";

/**
 * Puts text on the clipboard, and says whether it got there.
 *
 * A boolean rather than a throw: a failed copy is a thing the *interface*
 * has to react to — the confirmation must not appear — and not an
 * exceptional condition a caller should have to wrap. On the web the
 * clipboard is permission-gated and only available in a secure context, so
 * this genuinely fails sometimes, in ways nothing can prevent.
 */
export async function copyText(text: string): Promise<boolean> {
  if (text.trim() === "") return false;

  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch (error) {
    logger.failed("Unable to copy to the clipboard", error);
    return false;
  }
}

/**
 * Whether the user's dismissal is what ended this, rather than a fault.
 *
 * The web's share sheet reports a cancel by *rejecting* with an
 * `AbortError`, which is indistinguishable from a real failure unless the
 * name is checked. Treating it as a failure would fall back to copying
 * something the user had just decided not to share, and then tell them it
 * was copied.
 */
function isDismissal(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "AbortError"
  );
}

/**
 * Opens the OS share sheet, falling back to the clipboard where there
 * isn't one.
 *
 * **The fallback is the web, and it is not a workaround.** On iOS and
 * Android there is always a share sheet. In a browser there is one only
 * where the Web Share API exists — mobile Safari and Chrome, over HTTPS —
 * and `react-native-web` maps `Share.share` straight onto it, rejecting
 * with "Share is not supported in this browser" everywhere else. That is
 * most desktop browsers, so the clipboard is the normal path there rather
 * than an edge case, and `copied` is a first-class outcome rather than an
 * error.
 *
 * **A dismissal never falls back.** Someone who opened the sheet and closed
 * it has decided not to share; quietly copying to the clipboard instead and
 * announcing it would be doing the opposite of what they just asked for.
 */
export async function shareContent(
  content: ShareContent,
): Promise<ShareOutcome> {
  if (!hasContent(content)) return "failed";

  try {
    // Cast at this one boundary. `ShareContent` and react-native's own
    // content type encode the same "at least one of message or url" rule,
    // but neither TypeScript nor a reader gains anything from the dance
    // needed to prove it again here — and `hasContent` above has already
    // checked the property that actually matters at runtime.
    const result = await RNShare.share({
      title: content.title,
      message: content.message,
      url: content.url,
    } as RNShareContent);

    // Native reports which happened. The web resolves with nothing at all,
    // which means it went ahead — a cancel there arrives as a rejection.
    return result?.action === RNShare.dismissedAction ? "dismissed" : "shared";
  } catch (error) {
    if (isDismissal(error)) return "dismissed";

    // Everything else is "there is no share sheet here", which is a browser
    // being a browser rather than something to report as broken.
    return (await copyText(toCopyText(content))) ? "copied" : "failed";
  }
}

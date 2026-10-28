import type { ShareContent } from "./types";

/**
 * What goes on the clipboard when there is no share sheet to open.
 *
 * A URL on its own where there is one, rather than the message wrapped
 * around it: the clipboard is nearly always on its way into an address bar,
 * a chat box, or a QR generator, and "Check this out https://…" pasted into
 * any of those is wrong in a way the bare link never is. The message is
 * only used when there is no link to prefer.
 *
 * `title` is deliberately not in the chain. It names the *sheet*, not the
 * thing being shared — react-native's own `Share` rejects content with a
 * title and nothing else — so treating it as a payload here would make the
 * runtime disagree with `ShareContent`, which already refuses to describe
 * that case.
 */
export function toCopyText(content: ShareContent): string {
  const url = content.url?.trim() ?? "";
  if (url !== "") return url;
  return content.message ?? "";
}

/**
 * Whether there is anything worth sharing at all.
 *
 * Guards the case a caller reaches by accident rather than on purpose — a
 * URL that is still loading, a message built from an empty field — where
 * opening an empty share sheet is worse than doing nothing.
 */
export function hasContent(content: ShareContent): boolean {
  return toCopyText(content).trim() !== "";
}

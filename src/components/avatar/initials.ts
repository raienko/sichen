/**
 * How a name becomes the one or two characters an avatar has room for.
 * Split from the component and pure, for the same reason
 * `badge/count.ts` is: the interesting part is the edge cases, and they're
 * worth testing without rendering anything.
 */

/**
 * The first *code point*, not the first UTF-16 unit. `"🙂"[0]` is half of a
 * surrogate pair and renders as a replacement character; `Array.from`
 * iterates code points, so an emoji or an astral-plane character survives.
 *
 * Combining marks are still split (a base letter followed by its accent
 * yields the base alone, which is the readable half anyway). Doing better
 * would mean `Intl.Segmenter`, whose Hermes coverage varies by platform —
 * not a trade worth making for the second letter of a monogram.
 */
function firstCharacter(word: string): string {
  return Array.from(word)[0] ?? "";
}

/**
 * The initials for a name: the first character of the first word, plus the
 * first character of the last word when there's more than one.
 *
 * Deterministic — the same name always produces the same monogram, so a
 * person's avatar doesn't change between renders or between screens.
 *
 * Middle names are skipped rather than included: "Ada Augusta Byron
 * Lovelace" is "AL", because a monogram that grows with the length of
 * someone's name stops fitting the circle. A single word gives a single
 * character, which is also what a mononym or a CJK name (one "word" to
 * `split`) should get.
 *
 * Uppercased through the active locale rather than `toUpperCase()`: the
 * mapping isn't universal (Turkish "i" uppercases to "İ", not "I"), and a
 * name is exactly the kind of text where getting that wrong is noticed.
 */
export function getInitials(name: string, locale: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";

  const first = firstCharacter(words[0]);
  const last = words.length > 1 ? firstCharacter(words[words.length - 1]) : "";

  return `${first}${last}`.toLocaleUpperCase(locale);
}

import { findPhoneNumbersInText } from "libphonenumber-js";

export type LinkKind = "url" | "email" | "phone";

export type MessageSegment =
  | { type: "text"; text: string }
  | { type: "link"; kind: LinkKind; text: string; url: string };

type Found = { start: number; end: number; kind: LinkKind; url: string };

// `www.` without a scheme counts: it's how people type addresses.
const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)*\.[A-Z]{2,}/gi;

/** Sentence punctuation that ends a URL rather than belonging to it. */
const TRAILING = /[.,!?;:'"’”]+$/;

/**
 * Trims what a person wrote *after* the link — the full stop, the comma,
 * the closing bracket of "(see example.com)" — while keeping brackets that
 * are part of it, like a Wikipedia path's "(film)".
 */
function trimUrl(raw: string): string {
  let url = raw.replace(TRAILING, "");
  while (
    url.endsWith(")") &&
    (url.match(/\)/g)?.length ?? 0) > (url.match(/\(/g)?.length ?? 0)
  ) {
    url = url.slice(0, -1).replace(TRAILING, "");
  }
  return url;
}

function findAll(text: string): Found[] {
  const found: Found[] = [];

  for (const match of text.matchAll(URL_PATTERN)) {
    const value = trimUrl(match[0]);
    const start = match.index ?? 0;
    found.push({
      start,
      end: start + value.length,
      kind: "url",
      url: /^https?:\/\//i.test(value) ? value : `https://${value}`,
    });
  }

  for (const match of text.matchAll(EMAIL_PATTERN)) {
    const start = match.index ?? 0;
    found.push({
      start,
      end: start + match[0].length,
      kind: "email",
      url: `mailto:${match[0]}`,
    });
  }

  // International format only: without a country to assume, "0441 234
  // 567" could be a phone number, an order number or a date, and a chat
  // that links the wrong one is worse than one that links none.
  for (const match of findPhoneNumbersInText(text)) {
    found.push({
      start: match.startsAt,
      end: match.endsAt,
      kind: "phone",
      url: match.number.getURI(),
    });
  }

  // Earliest first; at the same start the longest wins. Anything starting
  // inside an earlier link is part of it (an email inside a URL's query).
  found.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept: Found[] = [];
  for (const item of found) {
    const last = kept[kept.length - 1];
    if (last === undefined || item.start >= last.end) kept.push(item);
  }
  return kept;
}

/**
 * Splits message text into plain runs and links — web addresses (with or
 * without `https://`), email addresses, and phone numbers written in
 * international format — each with the URL that opens it (`https:`,
 * `mailto:`, `tel:`).
 *
 * Pure and separate from rendering, so what counts as a link is tested
 * on its own. Text without links comes back as one text segment.
 */
export function linkify(text: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  let cursor = 0;

  for (const link of findAll(text)) {
    if (link.start > cursor) {
      segments.push({ type: "text", text: text.slice(cursor, link.start) });
    }
    segments.push({
      type: "link",
      kind: link.kind,
      text: text.slice(link.start, link.end),
      url: link.url,
    });
    cursor = link.end;
  }

  if (cursor < text.length) {
    segments.push({ type: "text", text: text.slice(cursor) });
  }
  return segments;
}

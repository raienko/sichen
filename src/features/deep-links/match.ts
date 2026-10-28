const PARAM_PREFIX = ":";
const REST_SEGMENT = "*";
/** Where a trailing `*` puts everything it swallowed. */
export const REST_PARAM = "rest";

/**
 * Matches a path against one route pattern, returning the captured params or
 * `null` if it doesn't match.
 *
 * Comparison is segment-by-segment and case-sensitive (paths are), so
 * `/orders/:id` matches `/orders/12` but not `/orders/12/items` — a pattern
 * that wants the rest of the path has to say so with a trailing `*`.
 *
 * Captured values are decoded here rather than in ./url.ts because only the
 * pattern knows where a segment ends: decoding earlier would let an encoded
 * `/` inside a value split into two segments.
 */
export function matchPath(
  pattern: string,
  path: string,
): Record<string, string> | null {
  const expected = toSegments(pattern);
  const actual = toSegments(path);
  const params: Record<string, string> = {};

  for (const [index, segment] of expected.entries()) {
    if (segment === REST_SEGMENT) {
      params[REST_PARAM] = actual.slice(index).map(decodeSegment).join("/");
      return params;
    }

    const value = actual[index];
    if (value === undefined) return null;

    if (segment.startsWith(PARAM_PREFIX)) {
      params[segment.slice(PARAM_PREFIX.length)] = decodeSegment(value);
      continue;
    }

    if (segment !== value) return null;
  }

  return expected.length === actual.length ? params : null;
}

function toSegments(value: string): string[] {
  return value.split("/").filter(Boolean);
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    // A malformed escape ("%zz") is the sender's problem, not a reason to
    // drop the whole link — hand the raw segment to the handler instead.
    return segment;
  }
}

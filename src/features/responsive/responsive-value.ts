import { BREAKPOINT_ORDER, type Breakpoint } from "./breakpoint";

/**
 * A value that can either be fixed, or vary by breakpoint.
 *
 * @example
 * const columns: ResponsiveValue<number> = 4;                    // always 4
 * const span: ResponsiveValue<number> = { phone: 12, tablet: 6 }; // 12, then 6
 */
export type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

function isBreakpointMap<T>(
  value: ResponsiveValue<T>,
): value is Partial<Record<Breakpoint, T>> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  // A plain object *could* legitimately be the value itself (a style object,
  // say), so "is this a breakpoint map" is decided by its keys rather than
  // by it merely being an object.
  return Object.keys(value).every((key) =>
    BREAKPOINT_ORDER.includes(key as Breakpoint),
  );
}

/**
 * Resolves a `ResponsiveValue` at the given breakpoint, **cascading
 * upward**: a breakpoint with no entry of its own inherits the nearest
 * narrower one that has one. So `{ phone: 12, tablet: 6 }` is 12 on phone
 * *and* foldable, then 6 on tablet *and* desktop — the mobile-first rule,
 * which means a map only has to name the widths where something actually
 * changes.
 *
 * Returns `fallback` when the map defines nothing at or below the current
 * breakpoint (e.g. `{ desktop: 4 }` viewed on a phone).
 */
export function resolveResponsive<T>(
  value: ResponsiveValue<T>,
  breakpoint: Breakpoint,
  fallback: T,
): T {
  if (!isBreakpointMap(value)) {
    return value;
  }

  const upTo = BREAKPOINT_ORDER.slice(
    0,
    BREAKPOINT_ORDER.indexOf(breakpoint) + 1,
  );

  for (let i = upTo.length - 1; i >= 0; i--) {
    const candidate = value[upTo[i]];
    if (candidate !== undefined) {
      return candidate;
    }
  }

  return fallback;
}

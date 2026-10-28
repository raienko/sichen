type Part = string | number | null | undefined;

/** What joins the segments of an id. */
const SEPARATOR = ".";

/**
 * Lower-case, with anything but letters, digits and `-` turned into `-` —
 * so no part can contain the `.` separator. Keys pass through otherwise
 * unchanged (`#E4002B` → `e4002b`); parts are written kebab already.
 */
function segment(part: string | number): string {
  return String(part)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * One id format for every `testID` in the app — what end-to-end flows
 * (Maestro) and web tests (`data-testid`) select by: dot-separated
 * segments from the owner down to the part, each lower-kebab.
 *
 * The first argument is the owner's own id, usually the component's
 * `testID` prop. Without one there's nothing to hang the part on, so the
 * result is `undefined` and the part gets no id — which is what keeps two
 * instances of a component from ever producing the same id. Empty parts are
 * skipped, so an optional key can be passed as-is.
 *
 * @example
 * testId("showcase", "carousel")                // "showcase.carousel"
 * testId(testID, "slide", item.id ?? index)      // "trip-photos.slide.42"
 * testId(testID, "close")                        // undefined when testID is
 */
export function testId(owner: string, ...parts: Part[]): string;
export function testId(
  owner: string | undefined,
  ...parts: Part[]
): string | undefined;
export function testId(
  owner: string | undefined,
  ...parts: Part[]
): string | undefined {
  if (owner === undefined) return undefined;
  return [owner, ...parts]
    .filter(
      (part): part is string | number =>
        part !== null && part !== undefined && part !== "",
    )
    .map((part, index) => (index === 0 ? String(part) : segment(part)))
    .join(SEPARATOR);
}

/** In `testIdPattern`, stands for any one segment — a generated key, say. */
export const ANY = Symbol("any test id segment");

/** Survives `segment()` unchanged, so it can be found again after joining. */
const PLACEHOLDER = "x0any0x";

/**
 * A RegExp matching the ids `testId()` would build, with `ANY` standing for
 * a segment the caller can't know — a toast's generated id, a modal's.
 * Built from the same function, so it follows the format if that changes.
 * For tests, through `@/root/testing`.
 *
 * @example
 * screen.getByTestId(testIdPattern("toasts", ANY, "close")) // toasts.<id>.close
 */
export function testIdPattern(
  owner: string | typeof ANY,
  ...parts: (Part | typeof ANY)[]
): RegExp {
  const id = testId(
    owner === ANY ? PLACEHOLDER : owner,
    ...parts.map((part) => (part === ANY ? PLACEHOLDER : part)),
  );
  const escaped = (id ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const anySegment = `[^${SEPARATOR.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]+`;
  return new RegExp(`^${escaped.split(PLACEHOLDER).join(anySegment)}$`);
}

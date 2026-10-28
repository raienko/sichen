import { createContext, useContext } from "react";

import type { HeadingLevel } from "@/features/accessibility";

/**
 * The deepest heading level a document outline has. There is no `<h7>`, so
 * a section nested past this keeps announcing at 6 rather than producing a
 * level nothing can represent.
 */
const DEEPEST: HeadingLevel = 6;

/**
 * The level a `Section` here should announce its title at.
 *
 * **2, not 1, by default.** Level 1 belongs to the screen, and `Header`
 * already claims it — a section is by definition inside something. A
 * screen that draws no `Header` and wants its first section to be the page
 * heading says so with `headingLevel`.
 */
const SectionLevelContext = createContext<HeadingLevel>(2);

export default SectionLevelContext;

/** The level a section at this point in the tree announces at. */
export function useSectionLevel(): HeadingLevel {
  return useContext(SectionLevelContext);
}

/**
 * The level a section's *children* announce at — one deeper, clamped.
 *
 * This is what makes the outline correct without anyone counting: nesting a
 * `Section` inside a `Section` makes the inner one an `<h3>` because it is
 * one, rather than because a caller remembered to say so. A hand-passed
 * level is the kind of thing that is right when written and wrong the first
 * time a screen is rearranged.
 */
export function nextSectionLevel(level: HeadingLevel): HeadingLevel {
  return level >= DEEPEST ? DEEPEST : ((level + 1) as HeadingLevel);
}

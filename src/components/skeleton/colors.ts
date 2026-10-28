/**
 * The two tones a skeleton is drawn in, exported so `children` drawn by the
 * caller can use the same ones the `source` path tints to.
 *
 * **The base is `backgroundElementSelected`, not `backgroundElement`**, for
 * the reason `ProgressBar`'s track is: `backgroundElement` is what most
 * raised surfaces in the app already use, so a placeholder sitting on a
 * `Card` or inside an open `Accordion` would be exactly the colour of what
 * is behind it. Caught in the showcase, where the first version rendered an
 * invisible skeleton on the section's own card.
 *
 * **The highlight is `grabber`**, the one neutral that is the same value in
 * both schemes. That makes it reliably *visible* against the base rather
 * than reliably brighter — it reads as a lighter glow in the dark scheme
 * and a darker one in the light. No token is brighter than the base in both
 * (the palette has no step above `backgroundElementSelected` in light, and
 * `background` inverts), so visibility is the property worth pinning; a
 * conventional always-brighter shine would need a palette entry of its own.
 * The pulse only ever takes it part of the way (`HIGHLIGHT_OPACITY` in
 * ./pulse.tsx), which keeps a mid-grey reading as light rather than paint.
 */
export const SKELETON_COLORS = {
  base: "backgroundElementSelected",
  highlight: "grabber",
} as const;

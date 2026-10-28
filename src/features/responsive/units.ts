import { useMemo } from "react";
import { Dimensions, useWindowDimensions } from "react-native";

import { BASE_WIDTH, MAX_SCALE, MIN_SCALE, SCALE_MODERATION } from "./config";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Pure — exported mainly for testing. See createUnits/useUnits below.
 *
 * Takes a single "reference dimension", not separate width/height — call
 * sites pass Math.min(width, height), the shorter edge, so scaling stays
 * stable across rotation. A phone doesn't get physically bigger when it
 * turns sideways; scaling off the raw (now-longer) width would say it did.
 */
export function scaleFactorForWidth(referenceDimension: number): number {
  const rawScale = referenceDimension / BASE_WIDTH;
  const moderated = 1 + (rawScale - 1) * SCALE_MODERATION;
  return clamp(moderated, MIN_SCALE, MAX_SCALE);
}

/** What every units(value) function in the app looks like. */
export type Units = (value: number) => number;

/**
 * Creates a units(value) function from an already-derived scale factor.
 * Separate from createUnits() so a caller that already has the scale (see
 * useResponsive) can memoize on *it* rather than on raw width/height — two
 * sizes that clamp to the same scale then produce the same function
 * reference, and nothing downstream recomputes.
 */
export function createUnitsForScale(scale: number): Units {
  return (value: number): number => Math.round(value * scale);
}

/**
 * Creates a units(value) function for a given reference dimension
 * (Math.min(width, height) — see scaleFactorForWidth). Exported for
 * testing — components should use useUnits() so values update as the
 * window resizes (rotation, foldable unfold/fold, browser/desktop resize).
 */
export function createUnits(referenceDimension: number): Units {
  return createUnitsForScale(scaleFactorForWidth(referenceDimension));
}

/**
 * unitsSnapshot(value): pass a Figma px value, get back that value scaled
 * for the device's CURRENT size — 12 in Figma is unitsSnapshot(12). Reads
 * Dimensions.get("window") imperatively at call time, so it works anywhere —
 * module scope, inside or outside a component, event handlers, a
 * module-scope StyleSheet.create — no hook required.
 *
 * The tradeoff: it's a snapshot, not reactive. A value computed once at
 * import time (e.g. in a module-scope StyleSheet.create) will NOT update
 * later if the window resizes, rotates, or a foldable unfolds — nothing
 * re-runs that code. For a value that live-updates on resize, call this
 * inside a component via useUnits() instead, which re-renders on change.
 *
 * Named unitsSnapshot (not units) on purpose: inside a component, "units"
 * should always mean the reactive value from useUnits(). Component/screen/
 * root files are not allowed to import this — see eslint.config.js — so
 * reaching for it there is a lint error, not a silent stale-value bug.
 */
export function unitsSnapshot(value: number): number {
  const { width, height } = Dimensions.get("window");
  return createUnits(Math.min(width, height))(value);
}

/**
 * Reactive units(value): pass a Figma px value, get back that value scaled
 * for the current device — 12 in Figma is units(12). Re-renders the calling
 * component when the window resizes (rotation, foldable unfold/fold,
 * desktop/browser resize) via useWindowDimensions.
 *
 * Memoized on the *derived scale factor*, not the raw width — two widths
 * that clamp to the same scale (e.g. 1280px and 2560px both hit MAX_SCALE)
 * produce the same units function reference, so a useMemo/createStyles
 * depending on it doesn't recompute for a resize that wouldn't change any
 * actual output value.
 *
 * Because it's reactive, values built with it can't live in a module-scope
 * StyleSheet.create (that only runs once, at import time). Compute styles
 * that use units() inside the component instead, e.g.
 * useMemo(() => StyleSheet.create({ padding: units(12) }), [units]) — or,
 * to keep the style *definition* outside the component while it still
 * reacts to resize, use createStyles() from ./create-styles.
 *
 * If you don't need resize-reactivity at all, use unitsSnapshot() instead —
 * it works directly in a module-scope StyleSheet.create. (Not from a
 * component/screen/root file, though — see unitsSnapshot's doc comment.)
 */
export default function useUnits(): Units {
  const { width, height } = useWindowDimensions();
  const scale = scaleFactorForWidth(Math.min(width, height));
  return useMemo(() => createUnitsForScale(scale), [scale]);
}

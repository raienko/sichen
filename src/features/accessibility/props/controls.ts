import type { AccessibilityProps, AccessibilityState } from "react-native";

/**
 * Props for interactive controls: generic pressables, the three binary
 * controls, radio groups, sliders and tabs.
 */

type ControlOptions = {
  /**
   * What a screen reader announces. Omit when the control's own text
   * children already say it — RN derives the label from them, and a
   * duplicate explicit label just makes the announcement noisier.
   */
  label?: string;
  /**
   * The control's *current* setting, announced after its label — for a
   * control that carries one (a select's chosen option). Separate from
   * `label` on purpose: "Country, United Kingdom" is what a screen reader
   * should say, and folding both into `label` would instead re-announce the
   * whole string every time the value changes.
   */
  value?: string;
  /**
   * Extra context read after the label — a select's validation message, say.
   * Mirrors how `fieldA11yProps` surfaces an `error`, which RN has no
   * "invalid" state for.
   */
  hint?: string;
  disabled?: boolean;
  /** For a control that's one of several choices (a segmented option). */
  selected?: boolean;
  /** For a control that shows/hides content (an accordion header). */
  expanded?: boolean;
  busy?: boolean;
};

/**
 * The accessibility props for anything a user can press. Centralized here
 * so a new pressable component gets the whole set right by construction,
 * rather than each one separately remembering `accessibilityRole` (easy to
 * forget — `Button` shipped without it, which left every button in the app
 * announcing as a plain group) and which state keys to expose.
 *
 * Only the state keys actually passed are emitted: a plain button reports
 * no `selected`/`expanded` at all, instead of reporting them as `false` and
 * making a screen reader announce a selection state that doesn't exist.
 *
 * @example
 * <Pressable {...controlA11yProps({ disabled, selected })}>...</Pressable>
 */
export function controlA11yProps({
  label,
  value,
  hint,
  disabled,
  selected,
  expanded,
  busy,
}: ControlOptions = {}): AccessibilityProps {
  const state: AccessibilityState = {};
  if (disabled !== undefined) state.disabled = disabled;
  if (selected !== undefined) state.selected = selected;
  if (expanded !== undefined) state.expanded = expanded;
  if (busy !== undefined) state.busy = busy;

  return {
    accessibilityRole: "button",
    ...(label === undefined ? null : { accessibilityLabel: label }),
    ...(value === undefined
      ? null
      : { accessibilityValue: { text: value }, "aria-valuetext": value }),
    ...(hint === undefined ? null : { accessibilityHint: hint }),
    ...(Object.keys(state).length === 0 ? null : { accessibilityState: state }),
    // Both spellings on purpose. `accessibilityState` is what native reads
    // and what testing-library asserts against; react-native-web 0.21 only
    // renders the `aria-*` form, so state set solely through
    // `accessibilityState` reaches native correctly and silently produces
    // *nothing* in the DOM — verified by inspecting a rendered button.
    ...(disabled === undefined ? null : { "aria-disabled": disabled }),
    ...(selected === undefined ? null : { "aria-selected": selected }),
    ...(expanded === undefined ? null : { "aria-expanded": expanded }),
    ...(busy === undefined ? null : { "aria-busy": busy }),
  };
}

type CheckboxOptions = {
  /** The visible label that names the checkbox. */
  label: string;
  checked: boolean;
  disabled?: boolean;
};

/**
 * The native and web accessibility contract for a custom checkbox.
 *
 * A checkbox is not a button with a selected state: assistive technology
 * has a dedicated checkbox role and checked state, and both need to be
 * exposed. As with the other helpers in this file, both React Native and
 * ARIA spellings are emitted because each platform consumes a different
 * half of the pair.
 */
export function checkboxA11yProps({
  label,
  checked,
  disabled = false,
}: CheckboxOptions): AccessibilityProps {
  return {
    accessibilityRole: "checkbox",
    role: "checkbox",
    accessibilityLabel: label,
    accessibilityState: { checked, disabled },
    "aria-checked": checked,
    "aria-disabled": disabled,
  };
}

type SwitchOptions = {
  /** The visible label that names the switch. */
  label: string;
  value: boolean;
  disabled?: boolean;
};

/** Native and web accessibility state for an app-owned switch. */
export function switchA11yProps({
  label,
  value,
  disabled = false,
}: SwitchOptions): AccessibilityProps {
  return {
    accessibilityRole: "switch",
    role: "switch",
    accessibilityLabel: label,
    accessibilityState: { checked: value, disabled },
    "aria-checked": value,
    "aria-disabled": disabled,
  };
}

type RadioOptions = {
  /** The visible label that names this option within its radio group. */
  label: string;
  checked: boolean;
  disabled?: boolean;
};

/** Native and web accessibility state for one app-owned radio option. */
export function radioA11yProps({
  label,
  checked,
  disabled = false,
}: RadioOptions): AccessibilityProps {
  return {
    accessibilityRole: "radio",
    role: "radio",
    accessibilityLabel: label,
    accessibilityState: { checked, disabled },
    "aria-checked": checked,
    "aria-disabled": disabled,
  };
}

type RadioGroupOptions = {
  /** What the whole set of choices is for — "View", "Sort by", "Plan". */
  label: string;
  disabled?: boolean;
};

/**
 * The accessibility props for the container around a set of mutually
 * exclusive options — a `SegmentedControl`, a radio list.
 *
 * Without it each option announces on its own with nothing saying what the
 * choice *is*: a screen reader reads "Day, selected, radio button" and
 * never mentions that this is the view mode. The role also tells assistive
 * technology the options belong together, which is what makes "2 of 3"
 * position announcements and group navigation work.
 *
 * Pair it with `radioA11yProps()` on each option.
 */
export function radioGroupA11yProps({
  label,
  disabled = false,
}: RadioGroupOptions): AccessibilityProps {
  return {
    accessibilityRole: "radiogroup",
    role: "radiogroup",
    accessibilityLabel: label,
    accessibilityState: { disabled },
    "aria-disabled": disabled,
  };
}

type SliderOptions = {
  label: string;
  value: number;
  valueText: string;
  min: number;
  max: number;
  disabled?: boolean;
  hint?: string;
};

type SliderAccessibilityProps = AccessibilityProps & {
  accessible: true;
  role: "slider";
  "aria-valuemin": number;
  "aria-valuemax": number;
  "aria-valuenow": number;
  "aria-valuetext": string;
  "aria-disabled": boolean;
};

/** Native adjustable semantics plus the equivalent ARIA range contract. */
export function sliderA11yProps({
  label,
  value,
  valueText,
  min,
  max,
  disabled = false,
  hint,
}: SliderOptions): SliderAccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: "adjustable",
    role: "slider",
    accessibilityLabel: label,
    accessibilityValue: { min, max, now: value, text: valueText },
    accessibilityState: { disabled },
    accessibilityActions: [{ name: "increment" }, { name: "decrement" }],
    ...(hint === undefined ? null : { accessibilityHint: hint }),
    "aria-valuemin": min,
    "aria-valuemax": max,
    "aria-valuenow": value,
    "aria-valuetext": valueText,
    "aria-disabled": disabled,
  };
}

type TabOptions = {
  /** The tab's visible text, which is also its accessible name. */
  label: string;
  selected: boolean;
  disabled?: boolean;
};

/**
 * The accessibility props for one tab in a tab bar.
 *
 * `accessibilityRole="tab"` rather than `"button"`: both are pressable, but
 * a tab tells a screen reader that picking it swaps the view rather than
 * performing an action, and that it belongs to the set its parent
 * `tabListA11yProps()` declares — which is what makes "2 of 4" position
 * announcements work.
 */
export function tabA11yProps({
  label,
  selected,
  disabled = false,
}: TabOptions): AccessibilityProps {
  return {
    accessibilityRole: "tab",
    role: "tab",
    accessibilityLabel: label,
    accessibilityState: { selected, disabled },
    // react-native-web 0.21 renders only the aria-* form of state.
    "aria-selected": selected,
    "aria-disabled": disabled,
  };
}

/** The container around a set of tabs — pair it with `tabA11yProps()`. */
export function tabListA11yProps(): AccessibilityProps {
  return {
    accessibilityRole: "tablist",
    role: "tablist",
  };
}

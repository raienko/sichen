import type { ComponentType } from "@/components/types";

/** Pick-from-options variations: select, checklist, switchGroup, radioGroup. */

/**
 * One choice in a `select`. `value` is what `onChange` reports and what
 * `value` is matched against; `label` is the only thing ever shown, so the
 * stored value can stay a stable code (`"uk"`) while the visible text is
 * free to be translated or reworded.
 */
export type SelectOption = {
  value: string;
  label: string;
};

export type SelectInputTypeProps = {
  type: "select";
  /** `null` when nothing is picked yet — the field then shows its placeholder. */
  value: string | null;
  /**
   * Only ever called with an option's `value`. It can't report `null`,
   * because picking an option is the only thing that fires it — a field
   * that should be clearable wants its own "None" option, whose `value` the
   * call site decides.
   */
  onChange: (value: string) => void;
  options: SelectOption[];
};

/** One independently selectable item in a `checklist`. */
export type ChecklistOption = {
  value: string;
  label: string;
  disabled?: boolean;
  testID?: string;
};

export type ChecklistInputTypeProps = {
  type: "checklist";
  /** The values of every currently checked option. */
  value: string[];
  /** Reports a new array whenever one option is checked or unchecked. */
  onChange: (value: string[]) => void;
  options: ChecklistOption[];
  /** Chooses the implementation used by every checkbox in the list. */
  checkboxType?: ComponentType;
  /** A checklist has no editable text surface for these common input props. */
  placeholder?: never;
  leftSlot?: never;
  rightSlot?: never;
  autoCapitalize?: never;
  autoCorrect?: never;
  onFocus?: never;
  onBlur?: never;
};

/** One independently controlled setting in a `switchGroup`. */
export type SwitchGroupOption = {
  value: string;
  label: string;
  disabled?: boolean;
  testID?: string;
};

type SwitchGroupControlProps =
  | {
      groupSwitch?: false;
      groupSwitchTestID?: never;
    }
  | {
      /** Makes the group's labelled header control every enabled option. */
      groupSwitch: true;
      /** Required because it is also the master switch's accessible name. */
      label: string;
      groupSwitchTestID?: string;
    };

export type SwitchGroupInputTypeProps = {
  type: "switchGroup";
  /** Values of every option currently switched on. */
  value: string[];
  onChange: (value: string[]) => void;
  options: SwitchGroupOption[];
  /** Chooses the implementation used by every switch, including groupSwitch. */
  switchType?: ComponentType;
  placeholder?: never;
  leftSlot?: never;
  rightSlot?: never;
  autoCapitalize?: never;
  autoCorrect?: never;
  onFocus?: never;
  onBlur?: never;
} & SwitchGroupControlProps;

/** One mutually exclusive choice in a `radioGroup`. */
export type RadioGroupOption = {
  value: string;
  label: string;
  disabled?: boolean;
  testID?: string;
};

export type RadioGroupInputTypeProps = {
  type: "radioGroup";
  /** `null` means no option is currently selected. */
  value: string | null;
  /** Reports the newly selected option's value. */
  onChange: (value: string) => void;
  options: RadioGroupOption[];
  /** Chooses the radio implementation used by every option. */
  radioType?: ComponentType;
  placeholder?: never;
  leftSlot?: never;
  rightSlot?: never;
  autoCapitalize?: never;
  autoCorrect?: never;
  onFocus?: never;
  onBlur?: never;
};

import type { DocumentPickerAsset } from "expo-document-picker";

import type { ComponentType } from "@/components/types";

/** Structured-value variations: range, date/time, file. */

type RangeInputSharedProps = {
  type: "range";
  min?: number;
  max?: number;
  step?: number;
  /** Chooses Expo UI for one thumb; multi-thumb values use the custom slider. */
  sliderType?: ComponentType;
  thumbLabels?: string[];
  formatValue?: (value: number, index: number) => string;
  /** Required because every adjustable thumb needs an accessible name. */
  label: string;
  placeholder?: never;
  leftSlot?: never;
  rightSlot?: never;
  autoCapitalize?: never;
  autoCorrect?: never;
};

export type RangeInputTypeProps = RangeInputSharedProps &
  (
    | {
        value: number;
        onChange: (value: number) => void;
      }
    | {
        value: number[];
        onChange: (value: number[]) => void;
      }
  );

/**
 * Which parts of a moment a `datetime` field asks for. Defaults to
 * `"datetime"`; the other two hide the half they don't need.
 */
export type DateTimeMode = "date" | "time" | "datetime";

export type DateTimeInputTypeProps = {
  type: "datetime";
  /** `null` when nothing is picked yet — the field then shows its placeholder. */
  value: Date | null;
  /**
   * Fires once per confirmed pick, never mid-edit: the sheet stages taps in
   * a draft and only reports on "Done".
   */
  onChange: (value: Date) => void;
  mode?: DateTimeMode;
  /** Earliest selectable moment. Days, hours and minutes fully before it are disabled. */
  min?: Date;
  /** Latest selectable moment. Days, hours and minutes fully after it are disabled. */
  max?: Date;
};

export type ColorInputTypeProps = {
  type: "color";
  /** `#RRGGBB`, or `null` when nothing is picked yet — the field then shows its placeholder. */
  value: string | null;
  /**
   * Fires once per confirmed pick, with `#RRGGBB` in upper case — never
   * mid-drag: the sheet stages changes in a draft and only reports on
   * "Done", the same contract as `datetime`.
   */
  onChange: (value: string) => void;
  /** Colours offered as one-tap swatches in the sheet. */
  presets?: readonly string[];
};

/** What `expo-document-picker` reports back, re-exported for call sites. */
export type FileInputAsset = DocumentPickerAsset;

export type FileInputTypeProps = {
  type: "file";
  /** `null` until a file is chosen — the field then shows its placeholder. */
  value: FileInputAsset | null;
  /**
   * Only ever called with a chosen file. It can't report `null`, because
   * picking is the only thing that fires it — a field that should be
   * clearable wants its own clear control beside it, the same shape
   * `select` has.
   */
  onChange: (value: FileInputAsset) => void;
  /**
   * Passed through to the picker: `type` for the MIME types on offer,
   * `copyToCacheDirectory` for whether the file is copied somewhere the
   * rest of Expo can read straight away.
   */
  options?: {
    type?: string | string[];
    copyToCacheDirectory?: boolean;
  };
};

/**
 * Input's props, split by kind of value. `InputProps` is the union that
 * `<Input type="...">` switches on; each variation's own folder imports
 * its member type from here.
 */
import type { CommonInputProps } from "./common";
import type {
  CodeInputTypeProps,
  EmailInputTypeProps,
  NumericInputTypeProps,
  PasswordInputTypeProps,
  PhoneInputTypeProps,
  TextAreaInputTypeProps,
  TextInputTypeProps,
} from "./text";
import type {
  ChecklistInputTypeProps,
  RadioGroupInputTypeProps,
  SelectInputTypeProps,
  SwitchGroupInputTypeProps,
} from "./choice";
import type {
  ColorInputTypeProps,
  DateTimeInputTypeProps,
  FileInputTypeProps,
  RangeInputTypeProps,
} from "./value";

export type * from "./choice";
export type * from "./common";
export type * from "./text";
export type * from "./value";

export type InputProps = (
  | TextInputTypeProps
  | TextAreaInputTypeProps
  | NumericInputTypeProps
  | EmailInputTypeProps
  | SelectInputTypeProps
  | ChecklistInputTypeProps
  | SwitchGroupInputTypeProps
  | RadioGroupInputTypeProps
  | RangeInputTypeProps
  | DateTimeInputTypeProps
  | ColorInputTypeProps
  | PasswordInputTypeProps
  | CodeInputTypeProps
  | PhoneInputTypeProps
  | FileInputTypeProps
) &
  CommonInputProps;

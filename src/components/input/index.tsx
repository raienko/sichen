import {
  forwardRef,
  type ForwardedRef,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from "react";
import type { TextInput as RNTextInputInstance } from "react-native";

import CodeInput from "./code";
import ChecklistInput from "./checklist";
import ColorInput from "./color";
import DateTimeInput from "./datetime";
import EmailInput from "./email";
import FileInput from "./file";
import NumericInput from "./numeric";
import PasswordInput from "./password";
import PhoneInput from "./phone";
import RadioGroupInput from "./radio-group";
import RangeInput from "./range";
import SelectInput from "./select";
import SwitchGroupInput from "./switch-group";
import TextInput from "./text";
import TextAreaInput from "./textarea";
import type { InputProps } from "./types";

/**
 * The single `{...props}` spread for every variation. Generic in `P` so each
 * call site below is still fully type-checked: TS infers `P` from the
 * `Component` argument, then verifies the (already-narrowed-by-`switch`)
 * `props` value actually satisfies it — unlike storing a variation component
 * in an `any`-typed variable, a mismatched pairing here is a `tsc` error.
 */
function renderVariant<P>(
  Component: ForwardRefExoticComponent<P & RefAttributes<RNTextInputInstance>>,
  props: P,
  ref: ForwardedRef<RNTextInputInstance>,
) {
  return <Component ref={ref} {...props} />;
}

/**
 * One component, branching on `type` — like <input> in HTML. Each variation
 * (Text, Numeric, Email, ...) is its own component in its own folder, built
 * on the shared BaseInput shell in ./base — Input just picks which one to
 * render.
 *
 * Add a new variation by adding its props to ./types (by kind), a new folder for
 * its component (+ whatever variation-only logic it needs), and a case
 * below — nothing else about the existing variations changes.
 *
 * Forwards its ref to the underlying RN TextInput (via whichever variation
 * is rendered), so `<Input ref={...} />` can be focused/blurred
 * imperatively. The exception is `select`, which has no text field to
 * forward to — its value is picked in a Modal, not typed — so its ref
 * stays `null`. Same for `file`, `datetime`, `color`, groups, and `range`.
 *
 * @example <Input value={text} onChange={setText} label="Name" />
 * @example <Input type="textarea" value={notes} onChange={setNotes} maxLength={500} />
 * @example <Input type="numeric" value={age} onChange={setAge} min={0} max={120} />
 * @example <Input type="email" value={email} onChange={setEmail} />
 * @example <Input type="select" value={country} onChange={setCountry} options={COUNTRIES} />
 * @example <Input type="datetime" value={when} onChange={setWhen} mode="date" />
 * @example <Input type="color" value={accent} onChange={setAccent} presets={BRAND_COLORS} />
 * @example <Input type="password" value={password} onChange={setPassword} />
 * @example <Input type="code" value={code} onChange={setCode} onComplete={verify} />
 * @example <Input type="file" value={file} onChange={setFile} label="Attachment" />
 * @example <Input type="phone" defaultCountry="US" value={phone} onChange={setPhone} />
 * @example <Input type="checklist" value={topics} onChange={setTopics} options={options} />
 * @example <Input type="switchGroup" value={settings} onChange={setSettings} options={options} />
 * @example <Input type="radioGroup" value={plan} onChange={setPlan} options={options} />
 * @example <Input type="range" value={[20, 80]} onChange={setRange} min={0} max={100} />
 * @example <Input value={query} onChange={setQuery} leftSlot={<Icon name="search" />} />
 */
const Input = forwardRef<RNTextInputInstance, InputProps>(
  function Input(props, ref) {
    switch (props.type) {
      case "textarea":
        return renderVariant(TextAreaInput, props, ref);
      case "numeric":
        return renderVariant(NumericInput, props, ref);
      case "email":
        return renderVariant(EmailInput, props, ref);
      case "select":
        return renderVariant(SelectInput, props, ref);
      case "file":
        return renderVariant(FileInput, props, ref);
      case "datetime":
        return renderVariant(DateTimeInput, props, ref);
      case "color":
        return renderVariant(ColorInput, props, ref);
      case "password":
        return renderVariant(PasswordInput, props, ref);
      case "code":
        return renderVariant(CodeInput, props, ref);
      case "checklist":
        return renderVariant(ChecklistInput, props, ref);
      case "switchGroup":
        return renderVariant(SwitchGroupInput, props, ref);
      case "radioGroup":
        return renderVariant(RadioGroupInput, props, ref);
      case "range":
        return renderVariant(RangeInput, props, ref);
      case "phone":
        return renderVariant(PhoneInput, props, ref);
      default:
        return renderVariant(TextInput, props, ref);
    }
  },
);

Input.displayName = "Input";

export default Input;

// Re-exported so a call site declaring an options array (or a wrapper's
// props) can reach them through this folder's entry point, rather than
// importing from ./types directly.
export type {
  ChecklistOption,
  ColorInputTypeProps,
  DateTimeMode,
  InputProps,
  PhoneCountryCode,
  RadioGroupOption,
  RadioGroupInputTypeProps,
  RangeInputTypeProps,
  SelectOption,
  TextAreaInputTypeProps,
  SwitchGroupOption,
} from "./types";

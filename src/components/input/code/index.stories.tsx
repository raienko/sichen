import { useState, type ComponentProps } from "react";

import Component from "./index";

const meta = {
  title: "components/Input/Code",
  component: Component,
};

export default meta;

type DemoProps = Omit<
  ComponentProps<typeof Component>,
  "value" | "onChange"
> & {
  initial?: string;
};

// Controlled: the boxes only ever draw what the value holds, so a story
// with static args would show six permanently empty boxes.
function Demo({ initial = "", ...props }: DemoProps) {
  const [value, setValue] = useState(initial);

  return (
    <Component label="Code" {...props} value={value} onChange={setValue} />
  );
}

export function Default() {
  return <Demo helperText="We texted you a 6-digit code" />;
}

export function PartiallyFilled() {
  return <Demo initial="123" />;
}

export function FourDigits() {
  return <Demo length={4} initial="12" />;
}

export function Complete() {
  return <Demo initial="123456" />;
}

// Letters as well as digits, on the normal keyboard — some services issue
// codes like "K7F2QP".
export function Alphanumeric() {
  return <Demo charset="alphanumeric" initial="K7F" />;
}

export function WithError() {
  return <Demo initial="123456" error="That code didn't work — try again" />;
}

export function Disabled() {
  return <Demo initial="123" disabled />;
}

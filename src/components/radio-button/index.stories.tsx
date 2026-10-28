import { useState, type ComponentProps } from "react";

import Component from "./index";

const meta = {
  title: "components/RadioButton",
  component: Component,
};

export default meta;

type DemoProps = Omit<
  ComponentProps<typeof Component>,
  "value" | "onChange"
> & {
  initial?: boolean;
};

function Demo({ initial = false, ...props }: DemoProps) {
  const [value, setValue] = useState(initial);
  return <Component {...props} value={value} onChange={setValue} />;
}

export function Custom() {
  return <Demo label="Custom radio button" />;
}

export function Expo() {
  return <Demo type="expo" label="Expo-style radio button" />;
}

export function Selected() {
  return <Demo label="Selected" initial />;
}

export function Disabled() {
  return <Demo label="Disabled" disabled />;
}

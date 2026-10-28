import { useState, type ComponentProps } from "react";

import Component from "./index";

const meta = {
  title: "components/Switch",
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
  return <Demo label="Custom switch" />;
}

export function Expo() {
  return <Demo type="expo" label="Expo UI switch" />;
}

export function On() {
  return <Demo label="On" initial />;
}

export function Disabled() {
  return <Demo label="Disabled" initial disabled />;
}

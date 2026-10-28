import { useState, type ComponentProps } from "react";

import Component from "./index";

const meta = {
  title: "components/Input/RadioGroup",
  component: Component,
};

export default meta;

const OPTIONS = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Contact sales", disabled: true },
];

type DemoProps = Omit<
  ComponentProps<typeof Component>,
  "value" | "onChange" | "options"
>;

function Demo(props: DemoProps) {
  const [value, setValue] = useState<string | null>("free");
  return (
    <Component
      label="Plan"
      {...props}
      value={value}
      onChange={setValue}
      options={OPTIONS}
    />
  );
}

export function Custom() {
  return <Demo helperText="Choose one" />;
}

export function Expo() {
  return <Demo radioType="expo" />;
}

export function Disabled() {
  return <Demo disabled />;
}

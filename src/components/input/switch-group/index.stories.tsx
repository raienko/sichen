import { useState, type ComponentProps } from "react";

import Component from "./index";

const meta = {
  title: "components/Input/SwitchGroup",
  component: Component,
};

export default meta;

const OPTIONS = [
  { value: "product", label: "Product updates" },
  { value: "security", label: "Security alerts" },
  { value: "marketing", label: "Marketing" },
  { value: "locked", label: "Managed by your organization", disabled: true },
];

type DemoProps = Omit<
  ComponentProps<typeof Component>,
  "value" | "onChange" | "options"
> & {
  initial?: string[];
};

function Demo({ initial = ["security"], ...props }: DemoProps) {
  const [value, setValue] = useState(initial);
  return (
    <Component
      label="Notifications"
      {...props}
      options={OPTIONS}
      value={value}
      onChange={setValue}
    />
  );
}

export function Custom() {
  return <Demo />;
}

export function WithGroupSwitch() {
  return <Demo groupSwitch />;
}

export function Expo() {
  return <Demo switchType="expo" groupSwitch />;
}

export function Disabled() {
  return <Demo groupSwitch disabled />;
}

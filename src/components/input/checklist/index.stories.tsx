import { useState, type ComponentProps } from "react";

import Component from "./index";

const meta = {
  title: "components/Input/Checklist",
  component: Component,
};

export default meta;

const OPTIONS = [
  { value: "design", label: "Design" },
  { value: "engineering", label: "Engineering" },
  { value: "research", label: "Research" },
  { value: "locked", label: "Unavailable option", disabled: true },
];

type DemoProps = Omit<
  ComponentProps<typeof Component>,
  "value" | "onChange" | "options"
> & {
  initial?: string[];
};

function Demo({ initial = ["design"], ...props }: DemoProps) {
  const [value, setValue] = useState(initial);
  return (
    <Component
      label="Interests"
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

export function Expo() {
  return <Demo checkboxType="expo" />;
}

export function WithHelperText() {
  return <Demo helperText="Choose as many as apply" />;
}

export function WithError() {
  return <Demo initial={[]} error="Choose at least one" />;
}

export function Disabled() {
  return <Demo disabled />;
}

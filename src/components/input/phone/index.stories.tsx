import { useState, type ComponentProps } from "react";

import Component from "./index";

const meta = {
  title: "components/Input/Phone",
  component: Component,
};

export default meta;

type DemoProps = Omit<
  ComponentProps<typeof Component>,
  "value" | "onChange"
> & {
  initial?: string | null;
};

function Demo({ initial = null, ...props }: DemoProps) {
  const [value, setValue] = useState<string | null>(initial);

  return (
    <Component
      label="Phone"
      defaultCountry="US"
      {...props}
      value={value}
      onChange={setValue}
    />
  );
}

export function Default() {
  return <Demo helperText="Grouped as you type" />;
}

export function Prefilled() {
  return <Demo initial="+12133734253" />;
}

// A number from another country keeps its dialling code, since that's the
// only way it reads unambiguously.
export function ForeignNumber() {
  return <Demo initial="+380441234567" />;
}

// Without a country only international input can be understood.
export function InternationalOnly() {
  return (
    <Demo
      defaultCountry={undefined}
      helperText="Pick a country or start with + and a country code"
    />
  );
}

export function WithError() {
  return <Demo initial="+12133734253" error="We couldn't reach that number" />;
}

export function Disabled() {
  return <Demo initial="+12133734253" disabled />;
}

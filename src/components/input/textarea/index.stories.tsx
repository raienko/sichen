import { useState, type ComponentProps } from "react";

import Component from "./index";

const meta = {
  title: "components/Input/TextArea",
  component: Component,
};

export default meta;

type DemoProps = Omit<ComponentProps<typeof Component>, "value" | "onChange">;

// A field that never shows what you typed isn't demonstrating anything, so
// every story owns its own state.
function Demo({ initial = "", ...props }: DemoProps & { initial?: string }) {
  const [value, setValue] = useState(initial);

  return (
    <Component
      label="Notes"
      placeholder="Anything we should know?"
      {...props}
      value={value}
      onChange={setValue}
    />
  );
}

export function Default() {
  return <Demo />;
}

export function WithLimit() {
  return (
    <Demo
      maxLength={200}
      initial="Counted under the field, and the keyboard stops at the limit."
      helperText="Shown to the delivery driver"
    />
  );
}

export function Tall() {
  return <Demo minLines={6} maxLines={10} />;
}

export function Required() {
  return <Demo required />;
}

export function WithError() {
  return <Demo error="Tell us at least a few words" />;
}

export function Disabled() {
  return <Demo disabled initial="Not editable" />;
}

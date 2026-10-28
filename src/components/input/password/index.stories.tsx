import { useState } from "react";

import Icon from "@/components/icon";

import Component from "./index";

const meta = {
  title: "components/Input/Password",
  component: Component,
};

export default meta;

// Controlled, like the other text-shaped variations: Storybook args don't
// feed back into a controlled value, and a password field that never shows
// what you typed can't demonstrate the one thing it's for.
function Demo(props: Partial<React.ComponentProps<typeof Component>>) {
  const [value, setValue] = useState("");

  return (
    <Component
      label="Password"
      placeholder="••••••••"
      {...props}
      value={value}
      onChange={setValue}
    />
  );
}

export function Default() {
  return <Demo />;
}

export function WithSlot() {
  return <Demo leftSlot={<Icon name="lock" />} />;
}

// Signing up rather than signing in — the only difference is what a
// password manager is told, so there's nothing to see here beyond the
// prop itself.
export function NewPassword() {
  return <Demo newPassword label="Choose a password" />;
}

export function WithError() {
  return <Demo error="At least 8 characters" leftSlot={<Icon name="lock" />} />;
}

export function WithHelperText() {
  return <Demo helperText="At least 8 characters, one of them a number" />;
}

export function Disabled() {
  return <Demo disabled leftSlot={<Icon name="lock" />} />;
}

import { useState } from "react";

import Component from "./index";

const meta = {
  title: "components/Input",
  component: Component,
};

export default meta;

export const Text = {
  args: {
    label: "Name",
    placeholder: "Ada Lovelace",
  },
};

export const Numeric = {
  args: {
    type: "numeric",
    label: "Age",
    placeholder: "0",
    min: 0,
    max: 120,
  },
};

// `select` has no uncontrolled form to demo through args at all — its value
// only ever changes by picking one of `options` — so it owns state here too.
export function Select() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <Component
      type="select"
      label="Country"
      placeholder="Pick a country"
      value={value}
      onChange={setValue}
      options={[
        { value: "uk", label: "United Kingdom" },
        { value: "ua", label: "Ukraine" },
        { value: "jp", label: "Japan" },
      ]}
    />
  );
}

// Picked, not typed, like `select`: the value only changes on Done. The
// hex strings are the demo's data, not UI colours.
/* eslint-disable no-restricted-syntax */
export function Color() {
  const [value, setValue] = useState<string | null>("#3F5BD9");
  return (
    <Component
      type="color"
      label="Accent colour"
      placeholder="Pick a colour"
      value={value}
      onChange={setValue}
      presets={["#3F5BD9", "#E4002B", "#00A86B", "#FFD400"]}
    />
  );
}
/* eslint-enable no-restricted-syntax */

export function Password() {
  const [value, setValue] = useState("");
  return (
    <Component
      type="password"
      label="Password"
      placeholder="••••••••"
      value={value}
      onChange={setValue}
    />
  );
}

export function Checklist() {
  const [value, setValue] = useState<string[]>(["design"]);
  return (
    <Component
      type="checklist"
      label="Interests"
      value={value}
      onChange={setValue}
      options={[
        { value: "design", label: "Design" },
        { value: "engineering", label: "Engineering" },
        { value: "research", label: "Research" },
      ]}
    />
  );
}

export function SwitchGroup() {
  const [value, setValue] = useState<string[]>(["security"]);
  return (
    <Component
      type="switchGroup"
      label="Notifications"
      value={value}
      onChange={setValue}
      groupSwitch
      options={[
        { value: "product", label: "Product updates" },
        { value: "security", label: "Security alerts" },
        { value: "marketing", label: "Marketing" },
      ]}
    />
  );
}

export function RadioGroup() {
  const [value, setValue] = useState<string | null>("pro");
  return (
    <Component
      type="radioGroup"
      label="Plan"
      value={value}
      onChange={setValue}
      options={[
        { value: "free", label: "Free" },
        { value: "pro", label: "Pro" },
        { value: "enterprise", label: "Contact sales", disabled: true },
      ]}
    />
  );
}

// Controlled demo — Storybook args don't feed back into a controlled
// TextInput's value, so this story owns its own state. See ./text and
// ./numeric for each variation's own story set.
export function Controlled() {
  const [value, setValue] = useState("");
  return <Component label="Controlled" value={value} onChange={setValue} />;
}

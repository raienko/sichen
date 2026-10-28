import { useState, type ComponentProps } from "react";

import Icon from "@/components/icon";

import Component from "./index";

const meta = {
  title: "components/Input/Select",
  component: Component,
};

export default meta;

const COUNTRIES = [
  { value: "uk", label: "United Kingdom" },
  { value: "ua", label: "Ukraine" },
  { value: "es", label: "Spain" },
  { value: "jp", label: "Japan" },
  { value: "cn", label: "China" },
];

type DemoProps = Omit<
  ComponentProps<typeof Component>,
  "value" | "onChange" | "options"
> & {
  initial?: string | null;
  options?: ComponentProps<typeof Component>["options"];
};

// Every story here owns its own state: Storybook args don't feed back into
// a controlled value, and a select that doesn't visibly update when you pick
// an option isn't demonstrating the thing worth looking at.
function Demo({ initial = null, options = COUNTRIES, ...props }: DemoProps) {
  const [value, setValue] = useState<string | null>(initial);

  return (
    <Component
      label="Country"
      placeholder="Pick a country"
      {...props}
      options={options}
      value={value}
      onChange={setValue}
    />
  );
}

export function Default() {
  return <Demo />;
}

export function WithSlot() {
  return <Demo leftSlot={<Icon name="globe" />} />;
}

export function Preselected() {
  return <Demo initial="ua" leftSlot={<Icon name="globe" />} />;
}

export function WithError() {
  return <Demo error="Pick a country to continue" />;
}

export function WithHelperText() {
  return <Demo helperText="Used to set your default currency" />;
}

export function Disabled() {
  return <Demo initial="jp" disabled />;
}

// A long list is what makes the Modal's own scrolling visible — the sheet
// caps its height and scrolls from there rather than growing off-screen.
export function ManyOptions() {
  return (
    <Demo
      label="Long list"
      placeholder="Pick one"
      options={Array.from({ length: 30 }, (_, index) => ({
        value: String(index),
        label: `Option ${index + 1}`,
      }))}
    />
  );
}

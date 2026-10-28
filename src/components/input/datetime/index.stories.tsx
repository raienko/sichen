import { useState, type ComponentProps } from "react";

import Component from "./index";

const meta = {
  title: "components/Input/DateTime",
  component: Component,
};

export default meta;

type DemoProps = Omit<
  ComponentProps<typeof Component>,
  "value" | "onChange"
> & {
  initial?: Date | null;
};

// Storybook args don't feed back into a controlled value, and a picker that
// never shows what you picked isn't demonstrating anything — so every story
// owns its own state.
function Demo({ initial = null, ...props }: DemoProps) {
  const [value, setValue] = useState<Date | null>(initial);

  return (
    <Component
      label="Starts"
      placeholder="Pick a moment"
      {...props}
      value={value}
      onChange={setValue}
    />
  );
}

export function Default() {
  return <Demo />;
}

export function Preselected() {
  return <Demo initial={new Date(2026, 7, 27, 14, 30)} />;
}

export function DateOnly() {
  return <Demo mode="date" label="Birthday" placeholder="Pick a day" />;
}

export function TimeOnly() {
  return <Demo mode="time" label="Alarm" placeholder="Pick a time" />;
}

// Days, hours and minutes outside the window are disabled rather than hidden,
// so the calendar keeps its shape.
export function Bounded() {
  return (
    <Demo
      label="Within one week"
      min={new Date(2026, 7, 24, 9, 0)}
      max={new Date(2026, 7, 30, 17, 0)}
      initial={new Date(2026, 7, 26, 12, 0)}
    />
  );
}

export function WithError() {
  return <Demo error="Pick a start time to continue" />;
}

export function Disabled() {
  return <Demo initial={new Date(2026, 7, 27, 14, 30)} disabled />;
}

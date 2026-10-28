import { useMemo } from "react";

import Stepper from "@/components/stepper";

import LocalValue from "./index";

/** A stepper whose value lives in a LocalValue — step it, reload, it stays. */
function PersistedStepper({ storageKey }: { storageKey: string }) {
  const stored = useMemo(
    () => new LocalValue<number>(storageKey),
    [storageKey],
  );
  const value = stored.useValue() ?? 0;

  return (
    <Stepper
      label={`LocalValue("${storageKey}")`}
      value={value}
      onChange={(next) => stored.setValue(next)}
    />
  );
}

const meta = {
  title: "features/LocalValue",
  component: PersistedStepper,
};

export default meta;

export const Default = {
  args: {
    storageKey: "storybook-demo-counter",
  },
};

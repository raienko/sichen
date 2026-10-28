import { useMemo } from "react";

import Stepper from "@/components/stepper";

import SecureValue from "./index";

/** A stepper whose value lives in the Keychain/Keystore (memory on web). */
function SecureStepper({ storageKey }: { storageKey: string }) {
  const stored = useMemo(
    () => new SecureValue<number>(storageKey),
    [storageKey],
  );
  const value = stored.useValue() ?? 0;

  return (
    <Stepper
      label={`SecureValue("${storageKey}")`}
      value={value}
      onChange={(next) => stored.setValue(next)}
    />
  );
}

const meta = {
  title: "features/SecureValue",
  component: SecureStepper,
};

export default meta;

export const Default = {
  args: {
    storageKey: "storybook-secure-counter",
  },
};

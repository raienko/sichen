import Icon from "@/components/icon";

import Component from "./index";

const meta = {
  title: "components/Input/Base",
  component: Component,
};

export default meta;

// The shared shell every variation (Text, Numeric, ...) builds on — label,
// slots, and focus/disabled styling, driven directly by string
// value/onChangeText rather than a variation's own value shape.
export const Default = {
  args: {
    label: "Base shell",
    placeholder: "Type something...",
    leftSlot: <Icon name="search" />,
  },
};

export const Disabled = {
  args: {
    label: "Base shell",
    value: "locked",
    disabled: true,
  },
};

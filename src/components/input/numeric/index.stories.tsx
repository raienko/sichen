import Icon from "@/components/icon";

import Component from "./index";

const meta = {
  title: "components/Input/Numeric",
  component: Component,
};

export default meta;

export const Default = {
  args: {
    placeholder: "0",
  },
};

export const WithLabel = {
  args: {
    label: "Age",
    placeholder: "0",
    leftSlot: <Icon name="hash" />,
  },
};

export const Clamped = {
  args: {
    label: "Age (0–120)",
    placeholder: "0",
    min: 0,
    max: 120,
    leftSlot: <Icon name="hash" />,
  },
};

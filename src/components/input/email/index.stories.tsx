import Icon from "@/components/icon";

import Component from "./index";

const meta = {
  title: "components/Input/Email",
  component: Component,
};

export default meta;

export const Default = {
  args: {
    placeholder: "you@example.com",
  },
};

export const WithLabel = {
  args: {
    label: "Email",
    placeholder: "ada@example.com",
    leftSlot: <Icon name="mail" />,
  },
};

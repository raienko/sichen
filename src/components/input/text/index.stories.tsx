import Icon from "@/components/icon";

import Component from "./index";

const meta = {
  title: "components/Input/Text",
  component: Component,
};

export default meta;

export const Default = {
  args: {
    placeholder: "Type something...",
  },
};

export const WithLabel = {
  args: {
    label: "Name",
    placeholder: "Ada Lovelace",
  },
};

export const WithSlots = {
  args: {
    placeholder: "Search",
    leftSlot: <Icon name="search" />,
  },
};

export const Disabled = {
  args: {
    label: "Email",
    value: "locked@example.com",
    disabled: true,
    leftSlot: <Icon name="mail" />,
  },
};

export const AutoCapitalizeWords = {
  args: {
    label: "Full name (auto-capitalized)",
    placeholder: "Ada Lovelace",
    autoCapitalize: "words",
  },
};

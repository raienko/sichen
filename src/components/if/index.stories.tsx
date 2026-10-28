import Text from "@/components/text";

import Component from "./index";

const meta = {
  title: "components/If",
  component: Component,
};

export default meta;

export const Shown = {
  args: {
    condition: true,
    children: <Text value="Visible — condition is true" />,
  },
};

export const Hidden = {
  args: {
    condition: false,
    children: <Text value="Never rendered — condition is false" />,
  },
};

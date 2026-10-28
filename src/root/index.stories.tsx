import Text from "@/components/text";

import Component from "./index";

const meta = {
  title: "Root",
  component: Component,
};

export default meta;

export const Default = {
  args: {
    children: <Text value="wrapped content" />,
  },
};

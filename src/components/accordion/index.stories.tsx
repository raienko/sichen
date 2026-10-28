import Button from "@/components/button";
import Text from "@/components/text";

import Component from "./index";

const meta = {
  title: "components/Accordion",
  component: Component,
};

export default meta;

export const Collapsed = {
  args: {
    title: "Section title",
    children: <Text value="Content only visible when expanded." />,
  },
};

export const DefaultOpen = {
  args: {
    title: "Section title",
    defaultOpen: true,
    children: <Text value="Content only visible when expanded." />,
  },
};

export const WithMultipleChildren = {
  args: {
    title: "Actions",
    defaultOpen: true,
    children: (
      <>
        <Text value="Pick an option below." />
        <Button value="Option A" onPress={() => {}} />
        <Button value="Option B" onPress={() => {}} />
      </>
    ),
  },
};

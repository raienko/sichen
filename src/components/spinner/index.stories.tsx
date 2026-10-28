import Component from "./index";

const meta = {
  title: "components/Spinner",
  component: Component,
};

export default meta;

export const Default = {};

export const Small = {
  args: { size: "small" },
};

export const Large = {
  args: { size: "large" },
};

export const Custom = {
  args: { label: "Uploading", color: "rebeccapurple" },
};

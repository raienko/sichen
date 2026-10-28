import Component from "./index";

const meta = {
  title: "components/Button",
  component: Component,
};

export default meta;

export const Default = {
  args: { value: "Button", onPress: () => {} },
};

export const Primary = {
  args: { value: "Primary", type: "primary", onPress: () => {} },
};

export const Secondary = {
  args: { value: "Secondary", type: "secondary", onPress: () => {} },
};

export const Tertiary = {
  args: { value: "Tertiary", type: "tertiary", onPress: () => {} },
};

export const Small = {
  args: { value: "Small", size: "small", onPress: () => {} },
};

export const Medium = {
  args: { value: "Medium", size: "medium", onPress: () => {} },
};

export const Large = {
  args: { value: "Large", size: "large", onPress: () => {} },
};

export const Auto = {
  args: { value: "Auto", size: "auto", onPress: () => {} },
};

export const Selected = {
  args: { value: "Selected", selected: true, onPress: () => {} },
};

export const Disabled = {
  args: { value: "Disabled", disabled: true, onPress: () => {} },
};

export const Loading = {
  args: { value: "Loading", loading: true, onPress: () => {} },
};

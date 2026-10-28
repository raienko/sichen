import { useSizes } from "@/features/responsive";
import { useTheme } from "@/features/theme";

import Component from "./index";

const meta = {
  title: "components/Icon",
  component: Component,
};

export default meta;

export const Default = {
  args: {
    name: "home",
  },
};

function FeatherStory() {
  const theme = useTheme();
  const { spacing } = useSizes();

  return (
    <Component
      type="Feather"
      name="home"
      color={theme.colors.error}
      size={spacing.x32}
    />
  );
}

export const Feather = { render: FeatherStory };

export const MaterialIcons = {
  args: {
    type: "MaterialIcons",
    name: "home",
    size: 32,
  },
};

export const Custom = {
  args: {
    type: "custom",
    name: "logo",
    size: 32,
  },
};

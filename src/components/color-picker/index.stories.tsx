/* eslint-disable no-restricted-syntax -- colour values are this story's data, not UI colours */
import { useState } from "react";

import Component from "./index";

const meta = {
  title: "components/ColorPicker",
  component: Component,
};

export default meta;

export function Default() {
  const [value, setValue] = useState("#3F5BD9");
  return <Component value={value} onChange={setValue} />;
}

export function WithPresets() {
  const [value, setValue] = useState("#E4002B");
  return (
    <Component
      value={value}
      onChange={setValue}
      presets={["#3F5BD9", "#E4002B", "#00A86B", "#FFD400", "#1F2023"]}
    />
  );
}

export function Disabled() {
  return <Component value="#00A86B" onChange={() => {}} disabled />;
}

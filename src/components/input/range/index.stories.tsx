import { useState } from "react";

import Component from "./index";

const meta = {
  title: "components/Input/Range",
  component: Component,
};

export default meta;

export function Interval() {
  const [value, setValue] = useState([25, 75]);
  return (
    <Component
      label="Budget"
      value={value}
      onChange={setValue}
      min={0}
      max={100}
      step={5}
      thumbLabels={["Minimum budget", "Maximum budget"]}
      helperText="Choose an acceptable interval"
    />
  );
}

export function SingleExpoValue() {
  const [value, setValue] = useState(50);
  return (
    <Component
      sliderType="expo"
      label="Progress"
      value={value}
      max={100}
      onChange={setValue}
    />
  );
}

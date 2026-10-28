import { useState } from "react";

import Component from "./index";

const meta = {
  title: "components/Slider",
  component: Component,
};

export default meta;

export function Custom() {
  const [value, setValue] = useState(35);
  return (
    <Component label="Volume" value={value} max={100} onChange={setValue} />
  );
}

export function Expo() {
  const [value, setValue] = useState(65);
  return (
    <Component
      type="expo"
      label="Brightness"
      value={value}
      max={100}
      onChange={setValue}
    />
  );
}

export function MultipleThumbs() {
  const [value, setValue] = useState([20, 50, 80]);
  return (
    <Component
      label="Milestones"
      value={value}
      max={100}
      onChange={setValue}
      thumbLabels={["First", "Second", "Third"]}
    />
  );
}

export function Disabled() {
  return (
    <Component
      label="Disabled"
      value={50}
      max={100}
      onChange={() => {}}
      disabled
    />
  );
}

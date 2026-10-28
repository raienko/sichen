import { useState } from "react";

import Component, { type MapMarker } from "./index";

const meta = {
  title: "components/Map",
  component: Component,
};

export default meta;

const MARKERS: MapMarker[] = [
  {
    id: "rosa",
    title: "Café Rosa",
    subtitle: "Rua Augusta 12",
    coordinate: { latitude: 38.7105, longitude: -9.1373 },
  },
  {
    id: "lumen",
    title: "Lumen Books",
    subtitle: "Open until 20:00",
    coordinate: { latitude: 38.7139, longitude: -9.1394 },
  },
  {
    id: "jardim",
    title: "Jardim",
    coordinate: { latitude: 38.7081, longitude: -9.1431 },
  },
];

const USER = { latitude: 38.7118, longitude: -9.1405 };

/** Fitted to the places and the user; press a pin for its card. */
export const Default = () => {
  const [selected, setSelected] = useState<string>();
  return (
    <Component
      label="Places near you"
      markers={MARKERS}
      userLocation={USER}
      selectedId={selected}
      onSelectMarker={setSelected}
    />
  );
};

export const Selected = () => (
  <Component label="Places near you" markers={MARKERS} selectedId="rosa" />
);

export const Centered = () => (
  <Component
    label="Lisbon"
    markers={[]}
    center={{ latitude: 38.7223, longitude: -9.1393 }}
    zoom={12}
  />
);

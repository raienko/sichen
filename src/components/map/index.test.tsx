import { openURL } from "expo-linking";

import { fireEvent, render, screen, testId } from "@/root/testing";

import Component, { type MapMarker } from "./index";

jest.mock("expo-linking", () => ({
  ...jest.requireActual("expo-linking"),
  openURL: jest.fn(),
}));

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
    coordinate: { latitude: 38.7139, longitude: -9.1394 },
  },
];

function camera() {
  return JSON.parse(
    screen.getByTestId("map-camera").props.accessibilityValue.text,
  ) as Record<string, unknown>;
}

describe(`${Component.name}`, () => {
  it("names the map for assistive technology", async () => {
    await render(
      <Component testID="map" label="Places near you" markers={MARKERS} />,
    );

    expect(screen.getByTestId("map").props.accessibilityLabel).toBe(
      "Places near you",
    );
  });

  it("draws every marker as a named button", async () => {
    await render(<Component label="Places" markers={MARKERS} />);

    expect(screen.getByRole("button", { name: "Café Rosa" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Lumen Books" })).toBeTruthy();
  });

  it("reports which marker was pressed", async () => {
    const onSelect = jest.fn();
    await render(
      <Component label="Places" markers={MARKERS} onSelectMarker={onSelect} />,
    );

    await fireEvent.press(screen.getByRole("button", { name: "Lumen Books" }));

    expect(onSelect).toHaveBeenCalledWith("lumen");
  });

  it("shows the selected place, with directions to it", async () => {
    await render(
      <Component label="Places" markers={MARKERS} selectedId="rosa" />,
    );

    expect(screen.getByText("Rua Augusta 12")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Café Rosa" }).props
        .accessibilityState,
    ).toMatchObject({ selected: true });

    await fireEvent.press(screen.getByText("Directions"));
    expect(openURL).toHaveBeenCalledWith(
      expect.stringContaining("38.7105,-9.1373"),
    );
  });

  it("has no callout when nothing is selected", async () => {
    await render(<Component label="Places" markers={MARKERS} />);

    expect(screen.queryByTestId(testId("map", "callout"))).toBeNull();
  });

  it("frames the markers and the user together", async () => {
    await render(
      <Component
        label="Places"
        markers={MARKERS}
        userLocation={{ latitude: 38.72, longitude: -9.15 }}
      />,
    );

    expect(camera().bounds).toEqual([-9.15, 38.7105, -9.1373, 38.72]);
    expect(screen.getByTestId(testId("map", "user-location"))).toBeTruthy();
  });

  it("leaves the user's dot out when there's no position", async () => {
    await render(<Component label="Places" markers={MARKERS} />);

    expect(screen.queryByTestId(testId("map", "user-location"))).toBeNull();
  });

  it("goes to an explicit center when given one", async () => {
    await render(
      <Component
        label="Places"
        markers={MARKERS}
        center={{ latitude: 1, longitude: 2 }}
        zoom={9}
      />,
    );

    expect(camera()).toMatchObject({ center: [2, 1], zoom: 9 });
  });

  it("draws the map in the theme's colours", async () => {
    await render(<Component label="Places" markers={[]} />);

    const background = JSON.parse(
      screen.getByTestId(testId("map", "engine")).props.accessibilityValue.text,
    );
    expect(background.paint["background-color"]).toMatch(/^#/);
  });

  it("keeps the places clear of the selected place's card", async () => {
    await render(
      <Component label="Places" markers={MARKERS} selectedId="rosa" />,
    );
    const before = camera().padding as { bottom: number; top: number };

    await fireEvent(screen.getByTestId(testId("map", "callout")), "layout", {
      nativeEvent: { layout: { height: 80, width: 300, x: 0, y: 0 } },
    });

    const after = camera().padding as { bottom: number; top: number };
    expect(after.bottom).toBeGreaterThan(before.bottom + 80);
    expect(after.top).toBe(before.top);
  });

  it("rings the selected pin in the accent colour, apart from its fill", async () => {
    await render(
      <Component label="Places" markers={MARKERS} selectedId="rosa" />,
    );

    const ring = (name: string) =>
      Object.assign(
        {},
        ...[screen.getByRole("button", { name }).props.style].flat(),
      ) as { borderColor?: string; backgroundColor?: string };

    expect(ring("Café Rosa").borderColor).not.toBe("transparent");
    // The gap between ring and pin is the page background, not the pin.
    expect(ring("Café Rosa").backgroundColor).toBeDefined();
    expect(ring("Lumen Books").borderColor).toBe("transparent");
  });
});

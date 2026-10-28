import { AccessibilityInfo, Text as RNText } from "react-native";

import { act, render } from "@/root/testing";

import Component from "./index";

// What the library is asked to do, captured: under a mocked Reanimated
// nothing advances, so the prop it receives is the observable part.
const mockReceived: { autoplay?: boolean }[] = [];
jest.mock("react-native-reanimated-carousel", () => ({
  Carousel: (props: { autoplay?: boolean }) => {
    mockReceived.push(props);
    return null;
  },
}));

const lastAutoplay = () => mockReceived[mockReceived.length - 1]?.autoplay;

async function renderCarousel() {
  await render(
    <Component
      data={["one", "two"]}
      label="Trip photos"
      autoplay
      renderItem={({ item }) => <RNText>{item}</RNText>}
    />,
  );
  // Let the accessibility flags' async reads land.
  await act(() => Promise.resolve());
}

describe("Carousel autoplay", () => {
  afterEach(() => {
    mockReceived.length = 0;
    jest.restoreAllMocks();
  });

  it("plays when asked", async () => {
    await renderCarousel();
    expect(lastAutoplay()).toBe(true);
  });

  it("holds still while Reduce Motion is on", async () => {
    jest
      .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
      .mockResolvedValue(true);
    await renderCarousel();
    expect(lastAutoplay()).toBe(false);
  });

  it("holds still while a screen reader is on", async () => {
    jest
      .spyOn(AccessibilityInfo, "isScreenReaderEnabled")
      .mockResolvedValue(true);
    await renderCarousel();
    expect(lastAutoplay()).toBe(false);
  });
});

import { AccessibilityInfo } from "react-native";

import Text from "@/components/text";
import { render, screen, waitFor } from "@/root/testing";

import { useAccessibility } from "./hooks";

function Probe() {
  const { isReduceMotionEnabled, duration, fontScale, isLargeTextEnabled } =
    useAccessibility();
  return (
    <Text
      value={`reduceMotion:${isReduceMotionEnabled} d:${duration(250)} scale:${fontScale} large:${isLargeTextEnabled}`}
    />
  );
}

/**
 * Each test sets every flag it depends on explicitly rather than relying on
 * the previous one being torn down — these queries resolve asynchronously
 * against a module-level RN singleton, which makes leak-by-default the
 * easy failure mode here.
 */
function mockReduceMotion(enabled: boolean) {
  jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockResolvedValue(enabled);
}

describe("AccessibilityProvider", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("passes an animation duration straight through when reduce-motion is off", async () => {
    mockReduceMotion(false);
    await render(<Probe />);

    await waitFor(() =>
      expect(screen.getByText(/reduceMotion:false d:250/)).toBeTruthy(),
    );
  });

  // The point of centralizing `duration()`: an animated component asks for
  // its duration and gets 0 under Reduce Motion, without having to know the
  // flag exists.
  it("collapses animation durations to 0 when reduce-motion is on", async () => {
    mockReduceMotion(true);
    await render(<Probe />);

    await waitFor(() =>
      expect(screen.getByText(/reduceMotion:true d:0/)).toBeTruthy(),
    );
  });

  it("derives isLargeTextEnabled from the OS text-size multiplier", async () => {
    mockReduceMotion(false);
    await render(<Probe />);

    const rendered = screen.getByText(/scale:/).props.children as string;
    const scale = Number(/scale:([\d.]+)/.exec(rendered)?.[1]);
    const large = /large:true/.test(rendered);

    expect(Number.isFinite(scale)).toBe(true);
    expect(large).toBe(scale > 1);
  });

  it("survives a flag the platform doesn't support", async () => {
    mockReduceMotion(false);
    jest
      .spyOn(AccessibilityInfo, "isBoldTextEnabled")
      .mockRejectedValue(new Error("unsupported on this platform"));

    await render(<Probe />);

    // A rejected query resolves false rather than failing the whole batch,
    // so the flags that *are* supported still land.
    await waitFor(() =>
      expect(screen.getByText(/reduceMotion:false/)).toBeTruthy(),
    );
  });
});

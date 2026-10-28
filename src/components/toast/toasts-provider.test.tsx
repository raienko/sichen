import { act, render } from "@/root/testing";

import { ANIMATION_DURATION } from "./constants";
import toasts from "./store";

jest.mock("@/features/accessibility/screen-reader", () => ({
  __esModule: true,
  default: () => Promise.resolve(false),
}));

beforeEach(() => {
  jest.useFakeTimers();
  toasts.reset();
});

afterEach(() => {
  toasts.reset();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe("ToastsProvider", () => {
  it("keeps auto-hide enabled when no screen reader is detected", async () => {
    await render(<></>);
    await act(async () => Promise.resolve());

    toasts.show({ message: "expires", duration: 3000 });

    await act(() => jest.advanceTimersByTime(3000));
    expect(toasts.list()[0]).toMatchObject({
      message: "expires",
      leaving: true,
    });

    await act(() => jest.advanceTimersByTime(ANIMATION_DURATION));
    expect(toasts.list()).toHaveLength(0);
  });
});

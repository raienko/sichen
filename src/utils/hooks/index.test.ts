import { AppState, type AppStateStatus } from "react-native";

import { act, renderHook } from "@/root/testing";

import {
  useAppState,
  useDebouncedCallback,
  useDebouncedValue,
  useInterval,
  useOnForeground,
  usePrevious,
  useTimeout,
  useToggle,
} from ".";

/** Lets a test drive AppState's change events by hand. */
function mockAppState() {
  const listeners = new Set<(state: AppStateStatus) => void>();
  jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((_type, listener) => {
      listeners.add(listener as (state: AppStateStatus) => void);
      return {
        remove: () =>
          listeners.delete(listener as (state: AppStateStatus) => void),
      } as ReturnType<typeof AppState.addEventListener>;
    });
  return (state: AppStateStatus) =>
    listeners.forEach((listener) => listener(state));
}

describe("hooks", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("useDebouncedValue settles once changes stop", async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 300),
      { initialProps: { value: "a" } },
    );
    await rerender({ value: "ab" });
    await act(() => jest.advanceTimersByTime(200));
    await rerender({ value: "abc" });
    await act(() => jest.advanceTimersByTime(200));
    expect(result.current).toBe("a");

    await act(() => jest.advanceTimersByTime(100));
    expect(result.current).toBe("abc");
  });

  it("useDebouncedCallback runs the last call once, and can be cancelled", async () => {
    const callback = jest.fn();
    const { result } = await renderHook(() =>
      useDebouncedCallback(callback, 300),
    );

    result.current("a");
    result.current("b");
    jest.advanceTimersByTime(300);
    expect(callback.mock.calls).toEqual([["b"]]);

    result.current("c");
    result.current.cancel();
    jest.advanceTimersByTime(300);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("usePrevious remembers the value before the last change", async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: number }) => usePrevious(value),
      { initialProps: { value: 1 } },
    );
    expect(result.current).toBeUndefined();
    await rerender({ value: 2 });
    expect(result.current).toBe(1);
    await rerender({ value: 2 });
    expect(result.current).toBe(1);
    await rerender({ value: 3 });
    expect(result.current).toBe(2);
  });

  it("useToggle flips and sets", async () => {
    const { result } = await renderHook(() => useToggle());
    await act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
    await act(() => result.current[2](false));
    expect(result.current[0]).toBe(false);
  });

  it("useInterval ticks until paused, with the latest callback", async () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = await renderHook(
      ({ callback, delay }: { callback: () => void; delay: number | null }) =>
        useInterval(callback, delay),
      { initialProps: { callback: first, delay: 1000 as number | null } },
    );
    await act(() => jest.advanceTimersByTime(2000));
    expect(first).toHaveBeenCalledTimes(2);

    await rerender({ callback: second, delay: 1000 });
    await act(() => jest.advanceTimersByTime(1000));
    expect(second).toHaveBeenCalledTimes(1);

    await rerender({ callback: second, delay: null });
    await act(() => jest.advanceTimersByTime(5000));
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("useTimeout fires once", async () => {
    const callback = jest.fn();
    await renderHook(() => useTimeout(callback, 500));
    await act(() => jest.advanceTimersByTime(5000));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("useAppState and useOnForeground follow the app's state", async () => {
    const emit = mockAppState();
    const onForeground = jest.fn();
    const { result } = await renderHook(() => {
      useOnForeground(onForeground);
      return useAppState();
    });

    await act(() => emit("background"));
    expect(result.current).toBe("background");
    expect(onForeground).not.toHaveBeenCalled();

    await act(() => emit("active"));
    expect(result.current).toBe("active");
    expect(onForeground).toHaveBeenCalledTimes(1);
  });
});

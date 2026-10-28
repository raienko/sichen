import { act, renderHook } from "@testing-library/react-native";

import logger from "@/features/logger";

import LocalValue from "./index";

describe(`${LocalValue.name} smoke test`, () => {
  it("returns undefined for a key that was never set", () => {
    const value = new LocalValue<string>("unset-key");

    expect(value.getValue()).toBeUndefined();
  });

  it("stores and retrieves a value", () => {
    const value = new LocalValue<{ count: number }>("object-key");

    value.setValue({ count: 1 });

    expect(value.getValue()).toEqual({ count: 1 });
  });

  it("clears the value on reset", () => {
    const value = new LocalValue<string>("reset-key");
    value.setValue("hello");

    value.reset();

    expect(value.getValue()).toBeUndefined();
  });

  it("reflects updates reactively through use()", async () => {
    const value = new LocalValue<number>("reactive-key");
    const { result } = await renderHook(() => value.useValue());

    expect(result.current).toBeUndefined();

    await act(async () => {
      value.setValue(42);
    });

    expect(result.current).toBe(42);
  });

  it("reads a stored value that isn't valid JSON as unset instead of throwing", async () => {
    const warn = jest.spyOn(logger, "warn").mockImplementation(() => {});
    const value = new LocalValue<{ count: number }>("corrupt-key");
    value.setValue({ count: 1 });
    // Simulate a truncated write: the raw MMKV entry, not a JSON string.
    (
      value as unknown as { adapter: { setItem(k: string, v: string): void } }
    ).adapter.setItem("corrupt-key", '{"count":');

    expect(value.getValue()).toBeUndefined();
    const { result } = await renderHook(() => value.useValue());
    expect(result.current).toBeUndefined();
    expect(warn).toHaveBeenCalled();

    value.setValue({ count: 2 });
    expect(value.getValue()).toEqual({ count: 2 });
    warn.mockRestore();
  });
});

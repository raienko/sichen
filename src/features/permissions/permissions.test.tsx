import { AppState, Text } from "react-native";
import { act, render, waitFor } from "@testing-library/react-native";

import Permissions from "./permissions";
import permissions from "./registry";

describe("Permissions", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("refreshes on mount and whenever the app becomes active", async () => {
    let onAppStateChange: ((state: string) => void) | undefined;
    const remove = jest.fn();
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_type, listener) => {
        onAppStateChange = listener as (state: string) => void;
        return { remove };
      });
    const refresh = jest
      .spyOn(permissions, "refresh")
      .mockResolvedValue({} as Awaited<ReturnType<typeof permissions.refresh>>);

    const { unmount } = await render(
      <Permissions>
        <Text>content</Text>
      </Permissions>,
    );

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));

    await act(() => onAppStateChange?.("background"));
    expect(refresh).toHaveBeenCalledTimes(1);

    await act(() => onAppStateChange?.("active"));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(2));

    await unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});

import { registerDevMenuItems } from "expo-dev-client";

import { act, fireEvent, render, screen, waitFor } from "@/root/testing";

import { devMenu, DevMenu } from "./index";

jest.mock("expo-dev-client", () => ({
  registerDevMenuItems: jest.fn(async () => {}),
}));

describe("DevMenu", () => {
  it("adds itself to Expo's dev menu", async () => {
    await render(<DevMenu />);
    expect(registerDevMenuItems).toHaveBeenCalledWith([
      expect.objectContaining({ name: "App dev menu" }),
    ]);
  });

  it("opens from anywhere and calls the health route", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response('{"status":"ok"}', { status: 200 }));
    await render(<DevMenu />);

    await act(() => devMenu.open());
    await fireEvent.press(await screen.findByText("GET /api/health"));

    expect(fetchMock).toHaveBeenCalledWith("/api/health");
    await waitFor(() =>
      expect(screen.getByText('200 {"status":"ok"}')).toBeTruthy(),
    );
    fetchMock.mockRestore();
  });
});

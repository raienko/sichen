import { PermissionStatus, type PermissionResponse } from "expo";
import {
  launchCameraAsync,
  launchImageLibraryAsync,
  type ImagePickerAsset,
  type ImagePickerResult,
} from "expo-image-picker";
import { Text } from "react-native";

import { permissions } from "@/features/permissions";
import {
  act,
  ANY,
  fireEvent,
  render,
  screen,
  testIdPattern,
  waitFor,
} from "@/root/testing";

import Component from "./index";

jest.mock("expo-image-picker", () => ({
  getCameraPermissionsAsync: jest.fn(),
  getMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
}));

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

const ID = "test-image-picker";

const image: ImagePickerAsset = {
  uri: "file:///picked.jpg",
  width: 1200,
  height: 800,
  type: "image",
};

const picked: ImagePickerResult = {
  canceled: false,
  assets: [image],
};

const canceled: ImagePickerResult = {
  canceled: true,
  assets: null,
};

const granted: PermissionResponse = {
  status: PermissionStatus.GRANTED,
  granted: true,
  canAskAgain: false,
  expires: "never",
};

async function renderPicker(onChange = jest.fn()) {
  jest
    .spyOn(permissions, "refresh")
    .mockResolvedValue({} as Awaited<ReturnType<typeof permissions.refresh>>);

  await render(
    <Component id={ID} onChange={onChange}>
      <Text>Avatar</Text>
    </Component>,
  );

  return onChange;
}

async function showPicker() {
  await act(() => Component.show(ID));
}

describe("ImagePicker", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("wraps its children in a pressable and exposes show/hide", async () => {
    await renderPicker();

    await fireEvent.press(screen.getByRole("button", { name: "Avatar" }));
    expect(
      await screen.findByRole("button", { name: "Gallery" }),
    ).toBeOnTheScreen();
    expect(
      screen.getByTestId(testIdPattern("modal", ANY, "drag-handle")),
    ).toBeOnTheScreen();

    await act(() => Component.hide(ID));
    expect(screen.queryByRole("button", { name: "Gallery" })).toBeNull();

    await act(() => Component.show(ID));
    expect(screen.getByRole("button", { name: "Camera" })).toBeOnTheScreen();
  });

  it("waits for the sheet to close before launching the gallery", async () => {
    const onChange = await renderPicker();
    await showPicker();

    let finishClosing: () => void = () => {};
    const closing = new Promise<void>((resolve) => {
      finishClosing = resolve;
    });
    const hide = jest.spyOn(Component, "hide").mockReturnValue(closing);
    jest.mocked(launchImageLibraryAsync).mockResolvedValue(picked);

    await fireEvent.press(screen.getByRole("button", { name: "Gallery" }));

    expect(hide).toHaveBeenCalledWith(ID);
    expect(launchImageLibraryAsync).not.toHaveBeenCalled();

    finishClosing();
    await waitFor(() =>
      expect(launchImageLibraryAsync).toHaveBeenCalledTimes(1),
    );
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(image));
  });

  it("requests camera permission after closing and reports the image", async () => {
    const onChange = await renderPicker();
    await showPicker();

    const hide = jest.spyOn(Component, "hide").mockResolvedValue();
    jest.spyOn(permissions.camera, "get").mockReturnValue(undefined);
    const request = jest
      .spyOn(permissions.camera, "request")
      .mockResolvedValue(granted);
    jest.mocked(launchCameraAsync).mockResolvedValue(picked);

    await fireEvent.press(screen.getByRole("button", { name: "Camera" }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(image));
    expect(hide.mock.invocationCallOrder[0]).toBeLessThan(
      request.mock.invocationCallOrder[0],
    );
    expect(request.mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(launchCameraAsync).mock.invocationCallOrder[0],
    );
  });

  it("can launch again after the native picker is canceled", async () => {
    const onChange = await renderPicker();
    await showPicker();

    jest.spyOn(Component, "hide").mockResolvedValue();
    jest
      .mocked(launchImageLibraryAsync)
      .mockResolvedValueOnce(canceled)
      .mockResolvedValueOnce(picked);

    const gallery = screen.getByRole("button", { name: "Gallery" });
    await fireEvent.press(gallery);
    await waitFor(() =>
      expect(launchImageLibraryAsync).toHaveBeenCalledTimes(1),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onChange).not.toHaveBeenCalled();

    await fireEvent.press(gallery);
    await waitFor(() =>
      expect(launchImageLibraryAsync).toHaveBeenCalledTimes(2),
    );
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(image));
  });
});

import {
  launchCameraAsync,
  launchImageLibraryAsync,
  type ImagePickerAsset,
  type ImagePickerResult,
} from "expo-image-picker";
import { Text } from "react-native";

import { permissions } from "@/features/permissions";
import { act, fireEvent, render, screen, waitFor } from "@/root/testing";

import Component from "./index";

/**
 * Its own file because the platform is a module-load constant, so it has to
 * be settled before anything imports it — there is no per-test switch. The
 * native behaviour is covered next door under the real platform.
 *
 * `@/utils` is mocked rather than react-native's `Platform`: replacing that
 * module breaks `expo-modules-core`, which reads `select` from it during
 * setup.
 */
jest.mock("@/utils", () => ({
  ...jest.requireActual("@/utils"),
  isWeb: true,
}));

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

const picked: ImagePickerResult = { canceled: false, assets: [image] };
const canceled: ImagePickerResult = { canceled: true, assets: null };

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

/**
 * The web build has no camera to offer — `launchCameraAsync` there is the
 * same `<input type="file">` the gallery opens, with a `capture` attribute
 * desktop browsers ignore — so a chooser sheet would be a choice between
 * one option and a copy of it.
 */
describe("ImagePicker on web", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("opens the gallery straight from the press, with no sheet", async () => {
    const onChange = await renderPicker();
    jest.mocked(launchImageLibraryAsync).mockResolvedValue(picked);

    await fireEvent.press(screen.getByRole("button", { name: "Avatar" }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(image));
    expect(launchImageLibraryAsync).toHaveBeenCalledTimes(1);
    expect(launchCameraAsync).not.toHaveBeenCalled();
  });

  it("renders no chooser at all", async () => {
    await renderPicker();

    await fireEvent.press(screen.getByRole("button", { name: "Avatar" }));

    expect(screen.queryByRole("button", { name: "Gallery" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Camera" })).toBeNull();
    expect(screen.queryByText("Choose image")).toBeNull();
  });

  // Browsers only allow a file dialog to open from the gesture that asked
  // for it, so nothing may be awaited between the press and the launch.
  it("reaches the file dialog without awaiting anything first", async () => {
    await renderPicker();
    jest.mocked(launchImageLibraryAsync).mockResolvedValue(canceled);

    // Deliberately not awaited: the call has to have happened by the time
    // the press handler returns, not a tick later.
    fireEvent.press(screen.getByRole("button", { name: "Avatar" }));

    expect(launchImageLibraryAsync).toHaveBeenCalledTimes(1);
  });

  it("announces no expanded state — there is no sheet to disclose", async () => {
    await renderPicker();
    const { props } = screen.getByRole("button", { name: "Avatar" });

    expect(props.accessibilityState?.expanded).toBeUndefined();
    // react-native-web 0.21 renders only the aria-* form of state, so this
    // is the spelling that would actually reach a browser.
    expect(props["aria-expanded"]).toBeUndefined();
  });

  it("opens the gallery through the static too", async () => {
    const onChange = await renderPicker();
    jest.mocked(launchImageLibraryAsync).mockResolvedValue(picked);

    await act(() => Component.show(ID));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(image));
  });

  it("leaves another picker's id alone", async () => {
    await renderPicker();
    jest.mocked(launchImageLibraryAsync).mockResolvedValue(picked);

    await act(() => Component.show("some-other-picker"));

    expect(launchImageLibraryAsync).not.toHaveBeenCalled();
  });

  // Nothing was opened, so it resolves rather than warning about a Modal
  // that was never mounted.
  it("has a no-op hide", async () => {
    await renderPicker();

    await expect(Component.hide(ID)).resolves.toBeUndefined();
  });

  it("can launch again after the dialog is dismissed", async () => {
    const onChange = await renderPicker();
    jest
      .mocked(launchImageLibraryAsync)
      .mockResolvedValueOnce(canceled)
      .mockResolvedValueOnce(picked);

    await fireEvent.press(screen.getByRole("button", { name: "Avatar" }));
    await waitFor(() =>
      expect(launchImageLibraryAsync).toHaveBeenCalledTimes(1),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onChange).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole("button", { name: "Avatar" }));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(image));
  });
});

import {
  getDocumentAsync,
  type DocumentPickerAsset,
} from "expo-document-picker";
import { Text } from "react-native";

import { act, fireEvent, render, screen, waitFor } from "@/root/testing";

import Component from "./index";

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));

const ID = "test-file-picker";

const file: DocumentPickerAsset = {
  name: "report.pdf",
  uri: "file:///report.pdf",
  size: 1024,
  mimeType: "application/pdf",
  lastModified: 0,
};

const picked = { canceled: false as const, assets: [file] };
const canceled = { canceled: true as const, assets: null };

async function renderPicker(onChange = jest.fn(), props = {}) {
  await render(
    <Component id={ID} onChange={onChange} {...props}>
      <Text>Attach a file</Text>
    </Component>,
  );
  return onChange;
}

function trigger() {
  return screen.getByRole("button", { name: "Attach a file" });
}

describe(`${Component.name} smoke test`, () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("wraps its children in a labelled pressable", async () => {
    await renderPicker();

    expect(trigger()).toBeTruthy();
  });

  // No camera to offer and no permission to request, so there's no chooser
  // sheet in between — unlike ImagePicker.
  it("opens the system browser straight from the press", async () => {
    const onChange = await renderPicker();
    jest.mocked(getDocumentAsync).mockResolvedValue(picked);

    await fireEvent.press(trigger());

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(file));
    expect(getDocumentAsync).toHaveBeenCalledTimes(1);
  });

  // Browsers only allow a file dialog to open from the activation that
  // asked for it, so nothing may be awaited between the press and the call.
  it("reaches the picker without awaiting anything first", async () => {
    await renderPicker();
    jest.mocked(getDocumentAsync).mockResolvedValue(canceled);

    // Deliberately not awaited.
    fireEvent.press(trigger());

    expect(getDocumentAsync).toHaveBeenCalledTimes(1);
  });

  it("reports nothing when the user cancels", async () => {
    const onChange = await renderPicker();
    jest.mocked(getDocumentAsync).mockResolvedValue(canceled);

    await fireEvent.press(trigger());

    await waitFor(() => expect(getDocumentAsync).toHaveBeenCalled());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("can open again after a cancel", async () => {
    const onChange = await renderPicker();
    jest
      .mocked(getDocumentAsync)
      .mockResolvedValueOnce(canceled)
      .mockResolvedValueOnce(picked);

    await fireEvent.press(trigger());
    await waitFor(() => expect(getDocumentAsync).toHaveBeenCalledTimes(1));

    await fireEvent.press(trigger());
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(file));
  });

  // `onChange` reports one asset, so a caller never has to narrow between
  // one file and several.
  it("always asks for a single file", async () => {
    await renderPicker(jest.fn(), { options: { type: "application/pdf" } });
    jest.mocked(getDocumentAsync).mockResolvedValue(picked);

    await fireEvent.press(trigger());

    expect(getDocumentAsync).toHaveBeenCalledWith({
      type: "application/pdf",
      multiple: false,
    });
  });

  it("ignores presses when disabled", async () => {
    await renderPicker(jest.fn(), { disabled: true });

    await fireEvent.press(screen.getByRole("button"));

    expect(getDocumentAsync).not.toHaveBeenCalled();
  });

  it("logs a failure rather than throwing", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    const onChange = await renderPicker();
    jest.mocked(getDocumentAsync).mockRejectedValue(new Error("no provider"));

    await fireEvent.press(trigger());

    await waitFor(() =>
      expect(
        log.mock.calls
          .flat()
          .some((arg) => String(arg).includes("Unable to pick a file")),
      ).toBe(true),
    );
    expect(onChange).not.toHaveBeenCalled();
    log.mockRestore();
  });

  describe("the static", () => {
    it("opens the picker for its id", async () => {
      const onChange = await renderPicker();
      jest.mocked(getDocumentAsync).mockResolvedValue(picked);

      await act(() => Component.open(ID));

      await waitFor(() => expect(onChange).toHaveBeenCalledWith(file));
    });

    it("leaves another picker's id alone", async () => {
      await renderPicker();
      jest.mocked(getDocumentAsync).mockResolvedValue(picked);

      await act(() => Component.open("some-other-picker"));

      expect(getDocumentAsync).not.toHaveBeenCalled();
    });
  });
});

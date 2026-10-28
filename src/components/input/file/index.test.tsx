import {
  getDocumentAsync,
  type DocumentPickerAsset,
} from "expo-document-picker";

import Input from "@/components/input";
import { fireEvent, render, screen, waitFor } from "@/root/testing";

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));

const file: DocumentPickerAsset = {
  name: "report.pdf",
  uri: "file:///var/cache/8f2a-report.pdf",
  size: 1024,
  mimeType: "application/pdf",
  lastModified: 0,
};

const picked = { canceled: false as const, assets: [file] };

async function renderField(props = {}) {
  const onChange = jest.fn();
  await render(
    <Input
      type="file"
      label="Attachment"
      placeholder="Choose a file"
      value={null}
      onChange={onChange}
      {...props}
    />,
  );
  return onChange;
}

describe("FileInput", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("shows the placeholder with nothing chosen", async () => {
    await renderField();

    expect(screen.getByText("Choose a file")).toBeTruthy();
  });

  // Never the uri, which is a cache path on native and a blob URL on web —
  // neither means anything to whoever is reading the field.
  it("shows the file's own name once one is chosen", async () => {
    await renderField({ value: file });

    expect(screen.getByText("report.pdf")).toBeTruthy();
    expect(screen.queryByText(file.uri)).toBeNull();
  });

  it("opens the picker when the field is pressed", async () => {
    const onChange = await renderField();
    jest.mocked(getDocumentAsync).mockResolvedValue(picked);

    await fireEvent.press(screen.getByLabelText("Attachment"));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(file));
  });

  it("passes its options to the picker", async () => {
    await renderField({ options: { type: "application/pdf" } });
    jest.mocked(getDocumentAsync).mockResolvedValue(picked);

    await fireEvent.press(screen.getByLabelText("Attachment"));

    await waitFor(() =>
      expect(getDocumentAsync).toHaveBeenCalledWith({
        type: "application/pdf",
        multiple: false,
      }),
    );
  });

  it("ignores presses when disabled", async () => {
    await renderField({ disabled: true });

    await fireEvent.press(screen.getByLabelText("Attachment"));

    expect(getDocumentAsync).not.toHaveBeenCalled();
  });

  // The field underneath is the labelled control; naming the wrapper too
  // would have a screen reader read the same thing twice.
  it("names the field once, not twice", async () => {
    await renderField();

    expect(screen.getAllByLabelText("Attachment")).toHaveLength(1);
  });
});

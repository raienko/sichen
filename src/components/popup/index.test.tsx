import { Text } from "react-native";

import { act, render, screen, userEvent, waitFor } from "@/root/testing";

import Popup from "./index";

describe("Popup", () => {
  it("shows and hides by id through its async static API", async () => {
    await render(
      <Popup id="static" title="Static popup" message="Popup content" />,
    );

    expect(screen.queryByText("Popup content")).not.toBeOnTheScreen();

    await act(() => Popup.show("static"));
    expect(screen.getByText("Popup content")).toBeOnTheScreen();

    await act(() => Popup.hide("static"));
    expect(screen.queryByText("Popup content")).not.toBeOnTheScreen();
  });

  it("renders Confirm and Cancel and runs their callbacks after hiding", async () => {
    const user = userEvent.setup();
    let wasVisibleWhenConfirmed = true;
    const onConfirm = jest.fn(() => {
      wasVisibleWhenConfirmed = screen.queryByText("Publish?") !== null;
    });

    await render(
      <Popup id="confirmation" title="Publish?" onConfirm={onConfirm} />,
    );
    await act(() => Popup.show("confirmation"));

    expect(screen.getByRole("button", { name: "Cancel" })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(wasVisibleWhenConfirmed).toBe(false);
  });

  it("runs the cancel callback from the Cancel button", async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();

    await render(<Popup id="cancel" title="Cancel me" onCancel={onCancel} />);
    await act(() => Popup.show("cancel"));
    await user.press(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Cancel me")).not.toBeOnTheScreen();
  });

  it("renders an alert with only its OK action", async () => {
    await render(<Popup id="alert" type="alert" title="Heads up" />);
    await act(() => Popup.show("alert"));

    expect(screen.getByRole("button", { name: "OK" })).toBeOnTheScreen();
    expect(
      screen.queryByRole("button", { name: "Cancel" }),
    ).not.toBeOnTheScreen();
  });

  it("passes a prompt's current input value to onConfirm", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();

    await render(
      <Popup
        id="prompt"
        type="prompt"
        title="Your name"
        inputLabel="Name"
        onConfirm={onConfirm}
      />,
    );
    await act(() => Popup.show("prompt"));

    await user.type(screen.getByLabelText("Name"), "Ada");
    await user.press(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith("Ada"));
  });

  it("resets a prompt to defaultValue each time it opens", async () => {
    const user = userEvent.setup();

    await render(
      <Popup
        id="reset-prompt"
        type="prompt"
        title="Your name"
        inputLabel="Name"
        defaultValue="Initial"
      />,
    );
    await act(() => Popup.show("reset-prompt"));
    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Changed");
    await act(() => Popup.hide("reset-prompt"));

    await act(() => Popup.show("reset-prompt"));
    expect(screen.getByLabelText("Name")).toHaveDisplayValue("Initial");
  });

  it("renders custom children before its actions", async () => {
    await render(
      <Popup id="children" title="Custom">
        <PopupChild />
      </Popup>,
    );
    await act(() => Popup.show("children"));

    expect(screen.getByText("Custom child content")).toBeOnTheScreen();
  });
});

function PopupChild() {
  return <Text>Custom child content</Text>;
}

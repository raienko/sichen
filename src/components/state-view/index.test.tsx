import { act, render, screen, userEvent, waitFor } from "@/root/testing";

import Text from "@/components/text";

import Component from "./state-view";
import stateViews from "./store";

beforeEach(() => stateViews.reset());
afterEach(() => stateViews.reset());

describe(`${Component.name} smoke test`, () => {
  it("renders localized defaults for each state", async () => {
    const { rerender } = await render(
      <Component type="empty" message="There are no projects." />,
    );

    expect(screen.getByText("Nothing here yet")).toBeOnTheScreen();
    const status = screen.getByLabelText(
      "Nothing here yet, There are no projects.",
    );
    expect(status).toBeOnTheScreen();
    expect(status.props.role).toBe("status");

    await rerender(<Component type="error" />);
    const alert = screen.getByLabelText("Something went wrong");
    expect(alert).toBeOnTheScreen();
    expect(alert.props.role).toBe("alert");
  });

  it("renders a loading state and custom children", async () => {
    await render(
      <Component type="loading">
        <Text value="A custom progress detail" />
      </Component>,
    );

    expect(screen.getByText("Loading")).toBeOnTheScreen();
    expect(screen.getByText("A custom progress detail")).toBeOnTheScreen();
  });

  it("keeps an async action disabled while it is running", async () => {
    const user = userEvent.setup();
    let finish: (() => void) | undefined;
    const onAction = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    await render(
      <Component type="error" actionLabel="Try again" onAction={onAction} />,
    );

    const action = screen.getByRole("button", { name: "Try again" });
    await user.press(action);

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(action).toBeDisabled();

    await act(async () => finish?.());
    await waitFor(() => expect(action).toBeEnabled());
  });
});

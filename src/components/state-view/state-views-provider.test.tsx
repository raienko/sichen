import Text from "@/components/text";
import { act, render, screen } from "@/root/testing";

import StateView from "./state-view";
import stateViews from "./store";

beforeEach(() => stateViews.reset());
afterEach(() => stateViews.reset());

describe("StateViewsProvider", () => {
  it("renders and hides a global overlay above existing content", async () => {
    await render(<Text value="Underlying screen" />);

    let id = "";
    await act(async () => {
      id = StateView.show({ type: "offline", message: "Check the network." });
    });

    // RN Modal keeps the underlying React tree mounted while presenting the
    // state view in a separate native window above it.
    expect(screen.getByText("Underlying screen")).toBeOnTheScreen();
    expect(screen.getByTestId("state-view-overlay")).toBeOnTheScreen();
    expect(screen.getByText("You're offline")).toBeOnTheScreen();

    await act(async () => StateView.hide(id));
    expect(screen.queryByTestId("state-view-overlay")).not.toBeOnTheScreen();
    expect(screen.getByText("Underlying screen")).toBeOnTheScreen();
  });
});

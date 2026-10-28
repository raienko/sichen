import { deepLinks } from "@/features/deep-links";
import {
  act,
  ANY,
  fireEvent,
  render,
  screen,
  testId,
  testIdPattern,
  waitFor,
} from "@/root/testing";

import Component from "./index";
import toasts from "./store";

/**
 * What a toast looks like and does once it's on screen. The queue, expiry
 * and the delayed removal that lets a toast animate out live in the store
 * and are tested in ./store.test.ts, on fake timers this file deliberately
 * never installs.
 *
 * `Providers` already mounts `ToastsProvider`, so a toast raised here
 * through the static API lands the same way it does in the real app.
 * Rendering `<Toast />` directly is for the presentational assertions.
 */
function mountHost() {
  return render(<></>);
}

beforeEach(() => {
  toasts.reset();
});

afterEach(() => {
  toasts.reset();
});

describe("Toast", () => {
  it("renders its message, and its title when it has one", async () => {
    await render(<Component type="success" title="Saved" message="All good" />);

    expect(screen.getByText("Saved")).toBeTruthy();
    expect(screen.getByText("All good")).toBeTruthy();
  });

  it("shows and hides through the static API", async () => {
    await mountHost();

    const id = await act(() => Component.show({ message: "hello" }));
    expect(screen.getByText("hello")).toBeTruthy();

    await act(() => Component.hide(id));
    expect(screen.queryByText("hello")).toBeNull();
  });

  it("resolves hide() only once the toast is really gone", async () => {
    await mountHost();
    const id = await act(() => Component.show({ message: "hello" }));

    // The store keeps the entry mounted for the length of the exit
    // animation, and hide() waits exactly that out — so there's nothing left
    // on the list by the time it resolves, not merely an invisible one.
    await act(() => Component.hide(id));

    expect(toasts.list()).toHaveLength(0);
  });

  it("gives each type its own shortcut", async () => {
    await mountHost();

    await act(() => Component.success("saved"));
    await act(() => Component.error("broke"));

    expect(screen.getByText("saved")).toBeTruthy();
    expect(screen.getByText("broke")).toBeTruthy();
    expect(toasts.list().map((entry) => entry.type)).toEqual([
      "success",
      "error",
    ]);
  });

  it("opens a pressed toast's link through the deep-link pipeline", async () => {
    const open = jest.spyOn(deepLinks, "open").mockResolvedValue();
    await mountHost();

    await act(() =>
      Component.show({ message: "hello", link: "/orders/12", duration: null }),
    );
    fireEvent.press(screen.getByTestId(testIdPattern("toasts", ANY, "action")));

    expect(open).toHaveBeenCalledWith("/orders/12");

    // Acting on a toast is what takes it off the screen.
    await waitFor(() => {
      expect(screen.queryByText("hello")).toBeNull();
    });

    open.mockRestore();
  });

  it("is not pressable without a link", async () => {
    await render(<Component message="hello" />);

    expect(
      screen.queryByTestId(testIdPattern("toasts", ANY, "action")),
    ).toBeNull();
  });

  it("hides when the close control is pressed", async () => {
    await mountHost();
    await act(() => Component.show({ message: "hello", duration: null }));

    fireEvent.press(screen.getByTestId(testIdPattern("toasts", ANY, "close")));

    await waitFor(() => {
      expect(screen.queryByText("hello")).toBeNull();
    });
  });

  it("omits the close control when the toast isn't dismissible", async () => {
    await render(<Component message="hello" dismissible={false} />);

    expect(
      screen.queryByTestId(testIdPattern("toasts", ANY, "close")),
    ).toBeNull();
  });

  it("announces itself, with the type spelled out for a screen reader", async () => {
    // The colour and the icon carry "this is an error" visually and say
    // nothing out loud, so the type has to be in the announcement itself.
    await render(<Component type="error" message="Could not save" />);

    const status = screen.getByLabelText("Error, Could not save");

    expect(status.props.accessibilityLiveRegion).toBe("assertive");
    expect(status.props.role).toBe("alert");
  });

  it("announces a non-error politely rather than interrupting", async () => {
    await render(<Component type="success" message="Saved" />);

    const status = screen.getByLabelText("Success, Saved");

    expect(status.props.accessibilityLiveRegion).toBe("polite");
    expect(status.props.role).toBe("status");
  });

  it("keeps the close control reachable beside a pressable body", async () => {
    // Nested inside it, iOS VoiceOver would collapse the two into one
    // element and leave the only way to dismiss a toast unreachable.
    await render(<Component message="hello" link="/orders/12" />);

    expect(screen.getByTestId(testId("toast", "action"))).toBeTruthy();
    expect(screen.getByTestId(testId("toast", "close"))).toBeTruthy();
  });
});

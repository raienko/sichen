import { render, screen, waitFor } from "@testing-library/react-native";
import {
  addEventListener,
  clearInitialURL,
  getInitialURL,
  getLinkingURL,
} from "expo-linking";
import { useNavigationContainerRef } from "expo-router";
import { Text as RNText } from "react-native";

import Component from "./deep-links";
import deepLinks from "./registry";

jest.mock("expo-linking", () => ({
  openURL: jest.fn(),
  getInitialURL: jest.fn(),
  getLinkingURL: jest.fn(),
  clearInitialURL: jest.fn(),
  addEventListener: jest.fn(),
}));
jest.mock("expo-router", () => ({
  router: { navigate: jest.fn() },
  useNavigationContainerRef: jest.fn(),
}));

type UrlListener = (event: { url: string }) => void;

/**
 * Stands in for the OS delivering a link. `launchUrl` is what
 * `getLinkingURL()` reports; `fallbackUrl` is what RN's async
 * `getInitialURL()` reports when the first comes back empty.
 */
function mockLinking(launchUrl: string | null = null, fallbackUrl = null) {
  const listeners: UrlListener[] = [];

  jest.mocked(getLinkingURL).mockReturnValue(launchUrl);
  jest.mocked(getInitialURL).mockResolvedValue(fallbackUrl);
  jest.mocked(addEventListener).mockImplementation((_event, listener) => {
    listeners.push(listener as UrlListener);
    return {
      remove: () => {
        listeners.splice(listeners.indexOf(listener as UrlListener), 1);
      },
    } as unknown as ReturnType<typeof addEventListener>;
  });

  return {
    deliver: (url: string) =>
      listeners.forEach((listener) => listener({ url })),
    get subscribed() {
      return listeners.length;
    },
  };
}

type StateListener = () => void;

/**
 * Stands in for Expo Router's navigation container ref, whose `isReady()`
 * is the actual signal this component waits on.
 */
function navigationRef(ready: boolean) {
  const listeners: StateListener[] = [];

  return {
    isReady: () => ready,
    addListener: jest.fn((_event: string, listener: StateListener) => {
      listeners.push(listener);
      return () => listeners.splice(listeners.indexOf(listener), 1);
    }),
    /** Mounts the navigator, the way a first state change would. */
    becomeReady() {
      ready = true;
      listeners.forEach((listener) => listener());
    },
  };
}

function mockNavigation(ref: ReturnType<typeof navigationRef>) {
  jest
    .mocked(useNavigationContainerRef)
    .mockReturnValue(
      ref as unknown as ReturnType<typeof useNavigationContainerRef>,
    );
}

/**
 * Rendered bare, via @testing-library/react-native rather than
 * @/root/testing: this component is now part of Providers, so the wrapped
 * render would mount a second copy of the thing under test.
 */
describe(`${Component.name} smoke test`, () => {
  beforeEach(() => {
    deepLinks.reset();
    jest.clearAllMocks();
    mockLinking();
  });

  it("renders its children", async () => {
    mockNavigation(navigationRef(true));

    await render(
      <Component>
        <RNText>child</RNText>
      </Component>,
    );

    expect(screen.getByText("child")).toBeTruthy();
  });

  it("opens the ready gate when the navigator is already mounted", async () => {
    mockNavigation(navigationRef(true));

    await render(<Component>{null}</Component>);

    expect(deepLinks.isGateOpen("ready")).toBe(true);
  });

  it("waits for the navigator when it isn't mounted yet", async () => {
    const ref = navigationRef(false);
    mockNavigation(ref);

    await render(<Component>{null}</Component>);
    expect(deepLinks.isGateOpen("ready")).toBe(false);

    ref.becomeReady();

    expect(deepLinks.isGateOpen("ready")).toBe(true);
  });

  it("closes the ready gate again when it unmounts", async () => {
    mockNavigation(navigationRef(true));

    const { unmount } = await render(<Component>{null}</Component>);
    await unmount();

    expect(deepLinks.isGateOpen("ready")).toBe(false);
  });

  it("stays closed with no navigator at all, as in a test or a story", async () => {
    jest
      .mocked(useNavigationContainerRef)
      .mockReturnValue(
        undefined as unknown as ReturnType<typeof useNavigationContainerRef>,
      );

    await render(
      <Component>
        <RNText>child</RNText>
      </Component>,
    );

    expect(screen.getByText("child")).toBeTruthy();
    expect(deepLinks.isGateOpen("ready")).toBe(false);
  });

  it("handles the URL the app was launched with, as an initial link", async () => {
    mockNavigation(navigationRef(true));
    mockLinking("/orders/12");
    const handle = jest.fn();
    deepLinks.register({ pattern: "/orders/:id", handle });

    await render(<Component>{null}</Component>);

    await waitFor(() =>
      expect(handle).toHaveBeenCalledWith(
        expect.objectContaining({ path: "/orders/12", initial: true }),
      ),
    );
    expect(clearInitialURL).toHaveBeenCalledTimes(1);
  });

  it("does not replay a cached initial URL after a remount", async () => {
    mockNavigation(navigationRef(true));
    mockLinking("/orders/12");
    const handle = jest.fn();
    deepLinks.register({ pattern: "/orders/:id", handle });

    const first = await render(<Component>{null}</Component>);
    await waitFor(() => expect(handle).toHaveBeenCalledTimes(1));
    await first.unmount();

    mockNavigation(navigationRef(true));
    await render(<Component>{null}</Component>);

    expect(handle).toHaveBeenCalledTimes(1);
  });

  it("handles a link that arrives while the app is running", async () => {
    mockNavigation(navigationRef(true));
    const linking = mockLinking();
    const handle = jest.fn();
    deepLinks.register({ pattern: "/orders/:id", handle });

    await render(<Component>{null}</Component>);
    linking.deliver("/orders/12");

    expect(handle).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/orders/12", initial: false }),
    );
  });

  it("handles the same link twice, which a URL-valued hook could not", async () => {
    mockNavigation(navigationRef(true));
    const linking = mockLinking();
    const handle = jest.fn();
    deepLinks.register({ pattern: "/orders/:id", handle });

    await render(<Component>{null}</Component>);
    linking.deliver("/orders/12");
    linking.deliver("/orders/12");

    expect(handle).toHaveBeenCalledTimes(2);
  });

  it("stops listening when it unmounts", async () => {
    mockNavigation(navigationRef(true));
    const linking = mockLinking();

    const { unmount } = await render(<Component>{null}</Component>);
    expect(linking.subscribed).toBe(1);

    await unmount();

    expect(linking.subscribed).toBe(0);
  });

  it("falls back to the async reader when the synchronous one is empty", async () => {
    mockNavigation(navigationRef(true));
    mockLinking(null, "/orders/12" as never);
    const handle = jest.fn();
    deepLinks.register({ pattern: "/orders/:id", handle });

    await render(<Component>{null}</Component>);

    await waitFor(() =>
      expect(handle).toHaveBeenCalledWith(
        expect.objectContaining({ path: "/orders/12", initial: true }),
      ),
    );
  });

  it("does not replay a URL event when the initial reader resolves with the same URL", async () => {
    mockNavigation(navigationRef(true));
    const linking = mockLinking();
    let resolveInitial!: (url: string | null) => void;
    jest.mocked(getInitialURL).mockReturnValue(
      new Promise((resolve) => {
        resolveInitial = resolve;
      }),
    );
    const handle = jest.fn();
    deepLinks.register({ pattern: "/orders/:id", handle });

    await render(<Component>{null}</Component>);
    linking.deliver("/orders/12");
    resolveInitial("/orders/12");

    await waitFor(() => expect(handle).toHaveBeenCalledTimes(1));
  });

  it("survives a launch URL that cannot be read", async () => {
    mockNavigation(navigationRef(true));
    jest.mocked(getLinkingURL).mockReturnValue(null);
    jest.mocked(getInitialURL).mockRejectedValue(new Error("no"));
    jest.mocked(addEventListener).mockReturnValue({
      remove: jest.fn(),
    } as unknown as ReturnType<typeof addEventListener>);

    await render(
      <Component>
        <RNText>child</RNText>
      </Component>,
    );

    expect(screen.getByText("child")).toBeTruthy();
  });

  it("dispatches a link that arrived before the app was ready", async () => {
    mockNavigation(navigationRef(true));
    const handle = jest.fn();
    deepLinks.register({ pattern: "/orders/:id", handle });

    await deepLinks.open("/orders/12");
    expect(handle).not.toHaveBeenCalled();

    await render(<Component>{null}</Component>);

    expect(handle).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/orders/12" }),
    );
  });
});

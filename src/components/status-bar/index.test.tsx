import { useEffect } from "react";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

import { useTheme, type ThemePreference } from "@/features/theme";
import { render, waitFor } from "@/root/testing";

import Component from "./index";
import type { StatusBarProps } from "./index";

jest.mock("expo-status-bar", () => ({
  StatusBar: jest.fn(() => null),
}));

const expoStatusBar = jest.mocked(ExpoStatusBar);

/**
 * The props of the last status bar rendered. The shared providers mount
 * the app-wide one first, so within a render pass the component under
 * test is always the later call.
 */
function lastProps() {
  const calls = expoStatusBar.mock.calls;
  return calls[calls.length - 1]?.[0];
}

function WithTheme({
  preference,
  ...props
}: StatusBarProps & { preference: ThemePreference }) {
  const theme = useTheme();
  useEffect(() => theme.setPreference(preference), [theme, preference]);
  return <Component {...props} />;
}

describe(`${Component.name} smoke test`, () => {
  beforeEach(() => expoStatusBar.mockClear());

  it("follows the app theme, not the OS appearance", async () => {
    await render(<WithTheme preference="dark" />);
    await waitFor(() => expect(lastProps()?.style).toBe("light"));

    await render(<WithTheme preference="light" />);
    await waitFor(() => expect(lastProps()?.style).toBe("dark"));
  });

  it("inverts the theme's style", async () => {
    await render(<WithTheme preference="dark" style="inverted" />);
    await waitFor(() => expect(lastProps()?.style).toBe("dark"));
  });

  it("passes a fixed style, visibility and animation through", async () => {
    await render(
      <WithTheme preference="dark" style="dark" hidden animated={false} />,
    );
    await waitFor(() =>
      expect(lastProps()).toEqual(
        expect.objectContaining({
          style: "dark",
          hidden: true,
          animated: false,
        }),
      ),
    );
  });

  it("renders outside a navigator", async () => {
    await render(<Component style="light" />);
    expect(lastProps()?.style).toBe("light");
  });
});

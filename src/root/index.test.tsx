import { render, screen, waitFor } from "@testing-library/react-native";
import * as SplashScreen from "expo-splash-screen";
import { Text as RNText } from "react-native";

import { keepSplashScreen } from "@/features/splash-screen";
import { useTheme } from "@/features/theme";

import Component from "./index";

// Held for real, the splash would wait out its minimum time before hiding.
jest.mock("@/features/splash-screen", () => ({
  ...jest.requireActual("@/features/splash-screen"),
  keepSplashScreen: jest.fn(),
}));

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(async () => true),
  setOptions: jest.fn(),
  hide: jest.fn(),
}));

describe(`${Component.name} smoke test`, () => {
  it("renders its children", async () => {
    await render(
      <Component>
        <RNText>hello</RNText>
      </Component>,
    );

    expect(screen.getByText("hello")).toBeTruthy();
  });

  it("passes provider configuration to the shared theme", async () => {
    function ThemeProbe() {
      const theme = useTheme();
      return <RNText>{theme.colors.primary}</RNText>;
    }

    await render(
      <Component
        config={{ theme: { overrides: { light: { primary: "#123456" } } } }}
      >
        <ThemeProbe />
      </Component>,
    );

    expect(screen.getByText("#123456")).toBeTruthy();
  });

  it("holds the splash screen as soon as it loads", () => {
    expect(keepSplashScreen).toHaveBeenCalledTimes(1);
  });

  it("hides the splash screen once the app is ready", async () => {
    await render(
      <Component>
        <RNText>hello</RNText>
      </Component>,
    );

    await waitFor(() => expect(SplashScreen.hide).toHaveBeenCalledTimes(1));
  });
});

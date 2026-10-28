import { View } from "react-native";

import { LocalValue } from "@/features/storage";
import { colors } from "@/features/theme/colors";
import type { LocalePreference } from "@/features/localization";
import { render, screen } from "@/root/testing";

import Component from "./index";

jest.mock("@expo/ui", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    Host: ({ children, ...props }: React.PropsWithChildren) =>
      React.createElement(View, props, children),
  };
});

const storedLocale = new LocalValue<LocalePreference>("locale-preference");

afterEach(() => {
  storedLocale.reset();
});

describe(`${Component.name} theme boundary`, () => {
  it("supplies the app palette and left-to-right locale direction", async () => {
    await render(
      <Component testID="host">
        <View />
      </Component>,
    );

    expect(screen.getByTestId("host").props).toEqual(
      expect.objectContaining({
        colorScheme: "light",
        seedColor: colors.light.primary,
        layoutDirection: "leftToRight",
      }),
    );
  });

  it("passes the active right-to-left direction to Expo UI", async () => {
    storedLocale.setValue("ar");

    await render(
      <Component testID="host">
        <View />
      </Component>,
    );

    expect(screen.getByTestId("host").props.layoutDirection).toBe(
      "rightToLeft",
    );
  });
});

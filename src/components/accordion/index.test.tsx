import { Text as RNText } from "react-native";

import { fireEvent, render, screen, waitFor } from "@/root/testing";

import Component from "./index";

describe(`${Component.name} smoke test`, () => {
  it("renders the title but not content when collapsed by default", async () => {
    await render(
      <Component title="Section">
        <RNText>content</RNText>
      </Component>,
    );

    expect(screen.getByText("Section")).toBeTruthy();
    expect(screen.queryByText("content")).toBeNull();
  });

  it("renders content when defaultOpen is true", async () => {
    await render(
      <Component title="Section" defaultOpen>
        <RNText>content</RNText>
      </Component>,
    );

    expect(screen.getByText("content")).toBeTruthy();
  });

  it("toggles content visibility when the header is pressed", async () => {
    await render(
      <Component title="Section">
        <RNText>content</RNText>
      </Component>,
    );

    await fireEvent.press(screen.getByText("Section"));
    await waitFor(() => {
      expect(screen.getByText("content")).toBeTruthy();
    });

    await fireEvent.press(screen.getByText("Section"));
    await waitFor(() => {
      expect(screen.queryByText("content")).toBeNull();
    });
  });

  it("reflects expanded state via accessibilityState", async () => {
    await render(
      <Component title="Section">
        <RNText>content</RNText>
      </Component>,
    );

    expect(screen.getByRole("button").props.accessibilityState.expanded).toBe(
      false,
    );

    await fireEvent.press(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByRole("button").props.accessibilityState.expanded).toBe(
        true,
      );
    });
  });
});

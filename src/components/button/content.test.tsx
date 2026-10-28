import { Text as RNText } from "react-native";

import Icon from "@/components/icon";
import { useTheme } from "@/features/theme";
import { render } from "@/root/testing";

import Component from "./index";

/**
 * Split from ./index.test.tsx rather than appended to it: past a certain
 * number of renders in one file this harness stops resolving queries
 * against freshly rendered trees, and these tests were landing on the wrong
 * side of that line. Jest isolates modules, so a second file starts clean.
 */
describe("Button with content instead of a label", () => {
  it("renders the content in place of the label", async () => {
    // Queried through this render rather than the shared `screen`, which
    // earlier tests in this file leave pointing at a stale tree.
    const view = await render(
      <Component label="Close">
        <RNText>x</RNText>
      </Component>,
    );

    expect(view.getByText("x")).toBeTruthy();
  });

  // With no text to derive a name from, the label is what a screen reader
  // gets — which is why the props type makes it mandatory in this case.
  it("takes its accessible name from the label", async () => {
    const view = await render(
      <Component label="Close">
        <RNText>x</RNText>
      </Component>,
    );

    expect(view.getByRole("button", { name: "Close" })).toBeTruthy();
  });

  it("hands its foreground down, so an icon child needs no colour of its own", async () => {
    let onPrimary = "";
    function Reader() {
      onPrimary = useTheme().colors.onPrimary;
      return null;
    }

    const { toJSON } = await render(
      <>
        <Reader />
        <Component label="Close" type="primary">
          <Icon name="x" />
        </Component>
      </>,
    );

    expect(JSON.stringify(toJSON())).toContain(onPrimary);
  });
});
